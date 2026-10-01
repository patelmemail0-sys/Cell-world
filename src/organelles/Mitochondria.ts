import * as THREE from 'three';
import { membraneMaterial, solid, glow, PALETTE } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, v3, cyclePhase, perpendicular } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Capsule, Layout } from '../world/layout';
import { cellState } from '../world/state';

// Mitochondria: double membrane, lamellar cristae carrying the respiratory chain, and rows of
// ATP synthase dimers along the crista rims. In a beta cell the ATP made here is the signal
// that closes K_ATP channels and triggers insulin release.

const CRISTA_SPACING = 1.6;
const CRISTA_THICK = 0.28;
/** Scale of the respiratory machinery relative to its 4x models: about 2.5x life size. */
const S = 0.6;
const SYN_SPACING = 0.42;

interface UnitSite extends Site {
  /** Direction of the I -> III -> IV row along the crista face. */
  along: THREE.Vector3;
  /** Direction toward the crista's free rim (where ATP synthase sits). */
  toRim: THREE.Vector3;
}

interface Mito {
  capsule: Capsule;
  group: THREE.Group;
  detail: THREE.Group;
  center: THREE.Vector3;
  axis: THREE.Vector3;
  half: number;
  radius: number;
  rotor: THREE.InstancedMesh;
  rotorBase: THREE.Matrix4[];
  tcaCenter: THREE.Vector3;
  tcaNormal: THREE.Vector3;
}

export class Mitochondria implements Organelle {
  readonly id = 'mitochondrion';
  readonly group = new THREE.Group();
  private readonly mitos: Mito[] = [];
  private readonly units: NearSites<UnitSite>;
  private readonly synthases: NearSites;
  private readonly ants: NearSites;
  private readonly pools: Record<string, ParticlePool>;
  private rotorAngle = 0;
  private readonly carriers: { q: THREE.InstancedMesh; cytc: THREE.InstancedMesh };
  private unitProgress: number | null = null;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const unitSites: UnitSite[] = [];
    const synthaseSites: Site[] = [];
    const antSites: Site[] = [];

    // Shared geometries and materials across all mitochondria.
    const geo = {
      c1: complexIGeo(),
      c2: complexIIGeo(),
      c3: complexIIIGeo(),
      c4: complexIVGeo(),
      stator: synthaseStatorGeo(),
      rotor: synthaseRotorGeo(),
      vdac: vdacGeo(),
      ant: antGeo(),
      mtdna: new THREE.TorusKnotGeometry(0.34, 0.035, 80, 5, 2, 5),
      granule: new THREE.IcosahedronGeometry(0.12, 1),
    };
    const mat = {
      outer: membraneMaterial({ color: PALETTE.mito, rimColor: PALETTE.mitoRim, baseAlpha: 0.2, opacity: 0.9, amp: 0.07, freq: 0.5, glow: 0.3, near: [1.5, 7, 0.3], dots: 3.3 }),
      inner: membraneMaterial({ color: 0xd9643a, rimColor: 0xffb48a, baseAlpha: 0.1, opacity: 0.75, amp: 0.03, freq: 0.6, glow: 0.2 }),
      cristae: membraneMaterial({
        color: 0xc8552e,
        rimColor: 0xffc49a,
        baseAlpha: 0.55,
        opacity: 0.96,
        amp: 0.02,
        freq: 0.9,
        emissive: 0xff4a12,
        emissiveIntensity: 0.12,
        rimStrength: 0.6,
      }),
      // Cool colours for the electron transport chain, warm gold for ATP synthase.
      c1: solid(0x4f9dff, { emissiveIntensity: 0.4 }),
      c2: solid(0x8fb0d8, { emissiveIntensity: 0.35 }),
      c3: solid(0x8a86ff, { emissiveIntensity: 0.4 }),
      c4: solid(0x45d3c4, { emissiveIntensity: 0.4 }),
      stator: solid(0xffc24d, { emissiveIntensity: 0.32 }),
      rotor: solid(0xff8a3a, { emissiveIntensity: 0.6 }),
      vdac: solid(0xffdcc4, { emissiveIntensity: 0.2 }),
      ant: solid(0xfff0a0, { emissiveIntensity: 0.3 }),
      mtdna: glow(0xc59bff, 1.5),
      granule: solid(0x40160c, { emissiveIntensity: 0.05, roughness: 0.9 }),
    };

    layout.mitochondria.forEach((cap, mi) => {
      const group = new THREE.Group();
      const center = v3(cap.center);
      const axis = v3(cap.dir);
      group.position.copy(center);
      group.quaternion.copy(quatFromY(axis));
      group.updateMatrixWorld(true);
      const R = cap.radius;
      const cyl = cap.length - 2 * R;
      const toWorld = (p: THREE.Vector3) => p.clone().applyMatrix4(group.matrixWorld);
      const dirWorld = (d: THREE.Vector3) => d.clone().applyQuaternion(group.quaternion);

      const outer = new THREE.Mesh(new THREE.CapsuleGeometry(R, cyl, 10, 28), mat.outer);
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(R - 0.3, cyl, 8, 24), mat.inner);
      group.add(outer, inner);
      kit.pickable(outer, { entity: 'mitochondrion', nearEntity: 'outer-mito-membrane', nearDist: 5, xray: true });
      kit.pickable(inner, { entity: 'cristae', xray: true });
      const sdf = (p: THREE.Vector3) => capsuleDistance(p, center, axis, cyl / 2) - R;
      kit.membrane(outer, { depth: 2, xray: true, contains: (p) => sdf(p) < 0 });
      kit.membrane(inner, { depth: 3, xray: true, contains: (p) => sdf(p) < -0.3 });
      kit.compartment({ label: 'Mitochondrial matrix', priority: 6, fog: 0x1c0904, fogDensity: 0.03, test: (p) => sdf(p) < -0.34 });
      kit.compartment({ label: 'Intermembrane space', priority: 5, fog: 0x1a0c07, fogDensity: 0.03, test: (p) => sdf(p) < 0 });

      // Lamellar cristae: folds of the inner membrane, alternating from opposite walls.
      const rc = R - 0.38;
      const cristaeGeos: THREE.BufferGeometry[] = [];
      const cristae: { y: number; phi: number }[] = [];
      const span = cyl / 2 - 0.3;
      const count = Math.max(1, Math.floor((span * 2) / CRISTA_SPACING) + 1);
      for (let k = 0; k < count; k++) {
        const y = count === 1 ? 0 : -span + (k * 2 * span) / (count - 1);
        const phi = k * Math.PI + rng.range(-0.35, 0.35);
        cristae.push({ y, phi });
        cristaeGeos.push(place(cristaGeo(rc), [0, y, 0], new THREE.Euler(0, phi, 0)));
      }
      const cristaeMesh = new THREE.Mesh(merge(cristaeGeos), mat.cristae);
      cristaeMesh.renderOrder = 8;
      group.add(cristaeMesh);
      kit.pickable(cristaeMesh, { entity: 'cristae' });

      // ---- molecular detail (near LOD) ------------------------------------------------
      const detail = new THREE.Group();
      group.add(detail);
      const nUnits = cristae.length * 4;
      const meshes = {
        c1: new THREE.InstancedMesh(geo.c1, mat.c1, nUnits),
        c2: new THREE.InstancedMesh(geo.c2, mat.c2, nUnits),
        c3: new THREE.InstancedMesh(geo.c3, mat.c3, nUnits),
        c4: new THREE.InstancedMesh(geo.c4, mat.c4, nUnits),
      };
      const chordHalf = Math.sqrt(rc * rc - (0.35 * rc) ** 2);
      const perRow = Math.max(2, Math.floor((chordHalf * 1.7) / SYN_SPACING));
      const nSyn = cristae.length * perRow * 2;
      const stator = new THREE.InstancedMesh(geo.stator, mat.stator, nSyn);
      const rotor = new THREE.InstancedMesh(geo.rotor, mat.rotor, nSyn);
      const rotorBase: THREE.Matrix4[] = [];
      let ui = 0;
      let si = 0;
      const up = new THREE.Vector3(0, 1, 0);
      cristae.forEach(({ y, phi }) => {
        const rotPhi = new THREE.Quaternion().setFromAxisAngle(up, phi);
        const local = (x: number, yy: number, z: number) => new THREE.Vector3(x, 0, z).applyQuaternion(rotPhi).setY(yy);
        for (const face of [1, -1]) {
          const faceQ = face === 1 ? rotPhi.clone() : rotPhi.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI));
          const fy = y + face * (CRISTA_THICK / 2);
          // Each respiratory unit is a row: Complex I, III, IV, with Complex II beside it.
          for (const ux of [-0.05 * rc, 0.45 * rc]) {
            for (const zc of [ux < 0 ? -0.45 : 0.45]) {
              const zs = face * 1;
              const row = (dz: number) => (zc + dz * S) * zs;
              setInstance(meshes.c1, ui, local(ux, fy, row(-0.72)), faceQ, S);
              setInstance(meshes.c3, ui, local(ux, fy, row(0.02)), faceQ, S);
              setInstance(meshes.c4, ui, local(ux, fy, row(0.68)), faceQ, S);
              setInstance(meshes.c2, ui, local(ux + 0.4, fy, row(-0.2)), faceQ, S);
              ui++;
              unitSites.push({
                pos: toWorld(local(ux, fy, row(-0.72))),
                normal: dirWorld(new THREE.Vector3(0, face, 0)),
                along: dirWorld(new THREE.Vector3(0, 0, zs).applyQuaternion(rotPhi)),
                toRim: dirWorld(new THREE.Vector3(-1, 0, 0).applyQuaternion(rotPhi)),
                phase: rng.range(0, 10),
              });
            }
          }
        }
        // ATP synthase dimer rows along the free rim, heads splayed into the matrix.
        for (let r = 0; r < perRow; r++) {
          const z = -chordHalf * 0.85 + (r / (perRow - 1)) * chordHalf * 1.7;
          for (const sgn of [1, -1]) {
            const head = new THREE.Vector3(-Math.cos(0.75), sgn * Math.sin(0.75), 0).applyQuaternion(rotPhi);
            const p = local(-0.35 * rc - 0.02, y + sgn * 0.07, z);
            const q = quatFromY(head);
            setInstance(stator, si, p, q, S);
            rotorBase.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(S, S, S)));
            si++;
            synthaseSites.push({ pos: toWorld(p), normal: dirWorld(head), phase: rng.range(0, 10) });
          }
        }
      });
      for (const m of [...Object.values(meshes), stator, rotor]) {
        m.instanceMatrix.needsUpdate = true;
        m.computeBoundingSphere();
        detail.add(m);
      }
      rotor.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      kit.pickable(meshes.c1, { entity: 'complex-i' });
      kit.pickable(meshes.c2, { entity: 'complex-ii' });
      kit.pickable(meshes.c3, { entity: 'complex-iii' });
      kit.pickable(meshes.c4, { entity: 'complex-iv' });
      kit.pickable(stator, { entity: 'atp-synthase' });
      kit.pickable(rotor, { entity: 'atp-synthase' });

      // VDAC porins in the outer membrane and ADP/ATP translocases in the inner membrane.
      const nV = Math.round(cap.length * 3);
      const vdac = new THREE.InstancedMesh(geo.vdac, mat.vdac, nV);
      const ant = new THREE.InstancedMesh(geo.ant, mat.ant, nV);
      for (let i = 0; i < nV; i++) {
        const a = rng.range(0, Math.PI * 2);
        const y = rng.range(-cyl / 2, cyl / 2);
        const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        setInstance(vdac, i, radial.clone().multiplyScalar(R).setY(y), quatFromY(radial), 1);
        const a2 = a + rng.range(0.2, 0.6);
        const radial2 = new THREE.Vector3(Math.cos(a2), 0, Math.sin(a2));
        const y2 = y + rng.range(-0.4, 0.4);
        const ap = radial2.clone().multiplyScalar(R - 0.3).setY(y2);
        setInstance(ant, i, ap, quatFromY(radial2), 1);
        antSites.push({ pos: toWorld(ap), normal: dirWorld(radial2), phase: rng.range(0, 10) });
      }
      vdac.computeBoundingSphere();
      ant.computeBoundingSphere();
      detail.add(vdac, ant);
      kit.pickable(vdac, { entity: 'vdac' });
      kit.pickable(ant, { entity: 'ant' });

      // Matrix contents in the end caps: mtDNA nucleoids, dense granules, the TCA cycle.
      const capY = cyl / 2 + R * 0.25;
      const mtdna = new THREE.InstancedMesh(geo.mtdna, mat.mtdna, 3);
      setInstance(mtdna, 0, new THREE.Vector3(0.5, capY, 0.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, 0.2, 0.9)), 1);
      setInstance(mtdna, 1, new THREE.Vector3(-0.6, -capY + 0.1, -0.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, 0.7, 0.1)), 0.9);
      setInstance(mtdna, 2, new THREE.Vector3(-0.3, capY - 0.5, -0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 1.7, 0.4)), 0.8);
      const granules = new THREE.InstancedMesh(geo.granule, mat.granule, 14);
      for (let i = 0; i < 14; i++) {
        const a = rng.range(0, 6.28);
        const rr = rng.range(0, R - 0.9);
        setInstance(granules, i, new THREE.Vector3(Math.cos(a) * rr, (i % 2 ? 1 : -1) * (cyl / 2 + rng.range(-0.2, R * 0.5)), Math.sin(a) * rr), null, rng.range(0.7, 1.5));
      }
      mtdna.computeBoundingSphere();
      granules.computeBoundingSphere();
      detail.add(mtdna, granules);
      kit.pickable(mtdna, { entity: 'mtdna' });
      kit.pickable(granules, { entity: 'mito-matrix' });
      const tcaLocal = new THREE.Vector3(0.1, -capY - 0.1, 0.4);
      const tcaRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 6, 40), glow(0xffb070, 1.1, 0.6));
      tcaRing.position.copy(tcaLocal);
      tcaRing.rotation.set(1.1, 0.3, 0);
      detail.add(tcaRing);
      kit.pickable(tcaRing, { entity: 'mito-matrix' });

      kit.lod(detail, center, cap.length / 2 + 14);
      this.group.add(group);
      this.mitos.push({
        capsule: cap,
        group,
        detail,
        center,
        axis,
        half: cyl / 2,
        radius: R,
        rotor,
        rotorBase,
        tcaCenter: toWorld(tcaLocal),
        tcaNormal: dirWorld(new THREE.Vector3(0, 0, 1).applyEuler(tcaRing.rotation)),
      });

      if (mi === 0) {
        // Designated mitochondrion for travel, tour and story.
        const side = perpendicular(axis);
        kit.anchor('mitochondrion', center, kit.vantage(center, R + 9, R + 1, side));
        kit.anchor('outer-mito-membrane', center.clone().addScaledVector(side, R), kit.vantage(center, R + 4.5, R + 1, side));
        kit.anchor('vdac', center.clone().addScaledVector(side, R), center.clone().addScaledVector(side, R + 2.5));
        const firstCrista = cristae[Math.floor(cristae.length / 2)];
        const rotPhi = new THREE.Quaternion().setFromAxisAngle(up, firstCrista.phi);
        const rim = toWorld(new THREE.Vector3(-0.35 * rc, 0, 0).applyQuaternion(rotPhi).setY(firstCrista.y));
        const L = (x: number, dy: number, z: number) => toWorld(new THREE.Vector3(x, 0, z).applyQuaternion(rotPhi).setY(firstCrista.y + dy));
        const rimX = -0.35 * rc;
        // From the open matrix by the far wall, facing the rim: the dimers splay in a V.
        kit.anchor('atp-synthase', L(rimX, 0, 0.25), L(-0.9 * rc, 0.16, -0.55));
        kit.anchor('cristae', rim, L(-0.9 * rc, 0.5, -0.95));
        // Between two cristae, looking across the flat face where the respiratory chain sits.
        const faceView = L(0.6 * rc, 0.5, -1.1);
        const facePoint = L(-0.05 * rc, CRISTA_THICK / 2, -0.45);
        for (const id of ['complex-i', 'complex-ii', 'complex-iii', 'complex-iv', 'ubiquinone', 'cytochrome-c']) {
          kit.anchor(id, facePoint, faceView);
        }
        kit.anchor('mito-matrix', toWorld(tcaLocal), toWorld(tcaLocal.clone().add(new THREE.Vector3(0, 1.6, 0.6))));
        kit.anchor('mtdna', toWorld(new THREE.Vector3(0.5, capY, 0.2)), toWorld(new THREE.Vector3(0, capY - 1.5, 0)));
        const antP = antSites[antSites.length - nV];
        kit.anchor('ant', antP.pos, antP.pos.clone().addScaledVector(antP.normal, -1.6));
      }
    });

    // Mobile electron carriers at the active units: ubiquinone in the membrane, cytochrome c
    // on its lumen face. Small meshes so they can be inspected.
    this.carriers = {
      q: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.032, 1), solid(0xffe45a, { emissiveIntensity: 1.1 }), 4),
      cytc: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.04, 1), solid(0xff4f5e, { emissiveIntensity: 1.1 }), 4),
    };
    for (const m of Object.values(this.carriers)) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      this.group.add(m);
    }
    kit.pickable(this.carriers.q, { entity: 'ubiquinone' });
    kit.pickable(this.carriers.cytc, { entity: 'cytochrome-c' });

    this.units = new NearSites(unitSites, 4, 7);
    this.synthases = new NearSites(synthaseSites, 8, 6);
    this.ants = new NearSites(antSites, 5, 10);
    this.pools = {
      nadh: particles.pool(4, 0xb4ff9a, 0.1),
      electron: particles.pool(4, PALETTE.electron, 0.11),
      pumped: particles.pool(4 * 10, PALETTE.proton, 0.05),
      o2: particles.pool(4, PALETTE.o2, 0.1),
      synH: particles.pool(8 * 3, PALETTE.proton, 0.05),
      synAtp: particles.pool(8, PALETTE.atp, 0.1),
      antAtp: particles.pool(5 * 2, PALETTE.atp, 0.11),
      antAdp: particles.pool(5 * 2, 0xd98a3a, 0.09),
      tca: particles.pool(3 * 8, 0xffa56a, 0.07),
      tcaOut: particles.pool(3 * 3, 0xb4ff9a, 0.08),
      farAtp: particles.pool(60, PALETTE.atp, 0.3),
    };
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'atp-synthase') return (this.rotorAngle / ((Math.PI * 2) / 3)) % 1;
    if (entityId === 'mitochondrion' || entityId.startsWith('complex-') || entityId === 'ubiquinone' || entityId === 'cytochrome-c') {
      return this.unitProgress;
    }
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const pt = ctx.pt;
    const P = this.pools;
    // Respiration speeds up when glucose is plentiful.
    const drive = 0.55 + 0.45 * cellState.atp;

    // --- ATP synthase rotors (about 100+ rev/s in life; shown far slower) ---------------
    this.rotorAngle += ctx.pdt * 2.6 * drive;
    const spin = _q.setFromAxisAngle(_y, this.rotorAngle);
    _rot.makeRotationFromQuaternion(spin);
    for (const m of this.mitos) {
      if (!m.detail.visible) continue;
      for (let i = 0; i < m.rotorBase.length; i++) {
        _m.multiplyMatrices(m.rotorBase[i], _rot);
        m.rotor.setMatrixAt(i, _m);
      }
      m.rotor.instanceMatrix.needsUpdate = true;
    }

    // --- electron transport chain at the nearest respiratory units -----------------------
    for (const k of ['nadh', 'electron', 'pumped', 'o2'] as const) P[k].hideAll();
    for (let i = 0; i < 4; i++) {
      _m.compose(_p.set(0, -1e4, 0), _q.identity(), _one);
      this.carriers.q.setMatrixAt(i, _m);
      this.carriers.cytc.setMatrixAt(i, _m);
    }
    const units = this.units.update(cam, ctx.dt);
    this.unitProgress = null;
    const dur = [1.0, 1.3, 1.3, 1.1];
    const total = 4.7;
    units.forEach((u, i) => {
      const t = pt * 0.8 * drive + u.phase;
      const [step, p] = cyclePhase(t, dur);
      if (i === 0) this.unitProgress = (((t % total) + total) % total) / total;
      const at = (dAlong: number, dN: number, dRim = 0) =>
        _p.copy(u.pos).addScaledVector(u.along, dAlong).addScaledVector(u.normal, dN).addScaledVector(u.toRim, dRim);
      const cI = 0;
      const cIII = 0.74 * S;
      const cIV = 1.4 * S;
      // NADH delivers two electrons to Complex I.
      if (step === 0) P.nadh.setV(i, at(cI - 0.06, THREE.MathUtils.lerp(1.0, 0.3, p)));
      // Electron pair: I -> ubiquinone -> III -> cytochrome c -> IV -> oxygen.
      let ex = cI;
      let en = 0.15;
      if (step === 0) en = THREE.MathUtils.lerp(0.3, 0.03, p);
      else if (step === 1) { ex = THREE.MathUtils.lerp(cI, cIII, p); en = 0.0; }
      else if (step === 2) { ex = THREE.MathUtils.lerp(cIII, cIV, p); en = -0.06; }
      else { ex = cIV; en = THREE.MathUtils.lerp(0, 0.18, p); }
      P.electron.setV(i, at(ex, en));
      // Between hops the carriers wait beside the complex that will reduce them next.
      at(step === 1 ? ex : step === 0 ? cI + 0.12 : cIII - 0.09, -0.02, 0.06);
      _m.compose(_p, _q.identity(), _one);
      this.carriers.q.setMatrixAt(i, _m);
      at(step === 2 ? ex : step < 2 ? cIII + 0.09 : cIV - 0.07, -0.13, 0.03);
      _m.compose(_p, _q.identity(), _one);
      this.carriers.cytc.setMatrixAt(i, _m);
      // Oxygen is reduced to water at Complex IV.
      if (step === 3) {
        P.o2.setV(i, at(cIV + 0.06, THREE.MathUtils.lerp(0.8, 0.2, Math.min(1, p * 2)) + Math.max(0, p - 0.5) * 1.2));
      }
      // Protons pumped from the matrix into the crista lumen: 4 at I, 4 at III, 2 at IV.
      const pump = (base: number, n: number, where: number, active: boolean, done: boolean) => {
        for (let j = 0; j < n; j++) {
          const idx = i * 10 + base + j;
          if (active) {
            const pp = THREE.MathUtils.clamp(p * 1.4 - j * 0.1, 0, 1);
            P.pumped.setV(idx, at(where + (j - n / 2) * 0.055, THREE.MathUtils.lerp(0.34, -0.14, pp)));
          } else if (done) {
            // Once inside the lumen, drift toward the rim where ATP synthase sits.
            const drift = ((t * 0.35 + j * 0.13) % 1 + 1) % 1;
            P.pumped.setV(idx, at(where, -0.14, drift * 1.2 + 0.15));
          }
        }
      };
      pump(0, 4, cI, step === 1, step > 1);
      pump(4, 4, cIII, step === 2, step > 2);
      pump(8, 2, cIV, step === 3, false);
    });

    this.carriers.q.instanceMatrix.needsUpdate = true;
    this.carriers.cytc.instanceMatrix.needsUpdate = true;

    // --- protons through ATP synthase, ATP released from the F1 head ---------------------
    P.synH.hideAll();
    P.synAtp.hideAll();
    const syn = this.synthases.update(cam, ctx.dt);
    syn.forEach((s, i) => {
      for (let j = 0; j < 3; j++) {
        const u = (((pt * 0.9 * drive + s.phase + j / 3) % 1) + 1) % 1;
        _p.copy(s.pos).addScaledVector(s.normal, THREE.MathUtils.lerp(-0.26, 0.32, u));
        // Enter and leave through half-channels offset from the rotor axis.
        perpendicular(s.normal, _a);
        _p.addScaledVector(_a, (0.16 + Math.sin(u * Math.PI) * 0.05) * S);
        P.synH.setV(i * 3 + j, _p);
      }
      const u = (((pt * 0.3 * drive + s.phase) % 1) + 1) % 1;
      perpendicular(s.normal, _a);
      _p.copy(s.pos).addScaledVector(s.normal, 0.5 + u * 0.8).addScaledVector(_a, -0.12 - u * 0.4);
      P.synAtp.setV(i, _p);
    });

    // --- ADP/ATP translocase: ATP out, ADP in ------------------------------------------
    P.antAtp.hideAll();
    P.antAdp.hideAll();
    this.ants.update(cam, ctx.dt).forEach((s, i) => {
      for (let j = 0; j < 2; j++) {
        const u = (((pt * 0.3 + s.phase + j * 0.5) % 1) + 1) % 1;
        P.antAtp.setV(i * 2 + j, _p.copy(s.pos).addScaledVector(s.normal, THREE.MathUtils.lerp(-1.2, 1.6, u)));
        perpendicular(s.normal, _a);
        P.antAdp.setV(i * 2 + j, _p.copy(s.pos).addScaledVector(s.normal, THREE.MathUtils.lerp(1.6, -1.2, u)).addScaledVector(_a, 0.2));
      }
    });

    // --- TCA cycle: eight intermediates turning, NADH leaving for the cristae ------------
    P.tca.hideAll();
    P.tcaOut.hideAll();
    const nearMitos = this.mitos.filter((m) => m.detail.visible).sort((a, b) => a.tcaCenter.distanceToSquared(cam) - b.tcaCenter.distanceToSquared(cam)).slice(0, 3);
    nearMitos.forEach((m, i) => {
      perpendicular(m.tcaNormal, _a);
      _b.crossVectors(m.tcaNormal, _a);
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2 + pt * 0.5 * drive;
        P.tca.setV(i * 8 + j, _p.copy(m.tcaCenter).addScaledVector(_a, Math.cos(a) * 0.62).addScaledVector(_b, Math.sin(a) * 0.62));
      }
      for (let j = 0; j < 3; j++) {
        const u = (((pt * 0.4 + j / 3) % 1) + 1) % 1;
        const a = j * 2.1;
        P.tcaOut.setV(i * 3 + j, _p.copy(m.tcaCenter).addScaledVector(_a, Math.cos(a) * (0.62 + u * 1.2)).addScaledVector(m.axis, -Math.sign(m.tcaCenter.clone().sub(m.center).dot(m.axis)) * u * 1.4));
      }
    });

    // --- far summary: ATP leaving every mitochondrion for the cytosol ---------------------
    const n = P.farAtp.count;
    for (let i = 0; i < n; i++) {
      const m = this.mitos[i % this.mitos.length];
      const u = (((pt * 0.07 * (0.5 + drive) + i * 0.618) % 1) + 1) % 1;
      const a = i * 2.399;
      perpendicular(m.axis, _a);
      _b.crossVectors(m.axis, _a);
      const along = ((i * 0.37) % 1) * 2 - 1;
      _p.copy(m.center)
        .addScaledVector(m.axis, along * m.half)
        .addScaledVector(_a, Math.cos(a) * (m.radius + u * 7))
        .addScaledVector(_b, Math.sin(a) * (m.radius + u * 7));
      P.farAtp.setV(i, _p);
      P.farAtp.size(i, 0.3 * (1 - u) * (0.4 + 0.6 * cellState.atp));
    }
  }
}

const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _y = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _rot = new THREE.Matrix4();
const _t = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);

/** Distance from p to the capsule's axis segment. */
function capsuleDistance(p: THREE.Vector3, center: THREE.Vector3, axis: THREE.Vector3, half: number): number {
  _t.copy(p).sub(center);
  const t = THREE.MathUtils.clamp(_t.dot(axis), -half, half);
  return _t.addScaledVector(axis, -t).length();
}

function cristaGeo(rc: number): THREE.BufferGeometry {
  // A flat membrane sac attached along its arc, with a free straight rim.
  const ac = Math.acos(-0.35);
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rc, -ac, ac, false);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: CRISTA_THICK - 0.12,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
    curveSegments: 18,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -(CRISTA_THICK - 0.12) / 2, 0);
  return g;
}

// All complexes: +Y points into the matrix, membrane mid-plane at y = 0. Drawn about 4x.

function complexIGeo(): THREE.BufferGeometry {
  // L-shaped: a long membrane arm (proton pumps) and a matrix arm (NADH site, Fe-S chain).
  return merge([
    place(blob(0.16, 2, 0.3, 1, [2.3, 0.8, 0.9]), [0.18, -0.02, 0]),
    place(blob(0.15, 2, 0.3, 4, [0.95, 2.1, 0.95]), [-0.14, 0.3, 0]),
  ]);
}

function complexIIGeo(): THREE.BufferGeometry {
  // Succinate dehydrogenase: small membrane anchor, catalytic head in the matrix. No pumping.
  return merge([place(new THREE.CapsuleGeometry(0.07, 0.1, 3, 8), [0, 0, 0]), place(blob(0.15, 2, 0.3, 2), [0, 0.24, 0])]);
}

function complexIIIGeo(): THREE.BufferGeometry {
  // Cytochrome bc1: a dimer, with large core proteins in the matrix.
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    parts.push(place(new THREE.CapsuleGeometry(0.09, 0.1, 3, 8), [s * 0.1, 0, 0]));
    parts.push(place(blob(0.14, 2, 0.3, 3 + s), [s * 0.12, 0.28, 0]));
    parts.push(place(blob(0.07, 1, 0.3, 6 + s), [s * 0.1, -0.17, 0]));
  }
  return merge(parts);
}

function complexIVGeo(): THREE.BufferGeometry {
  // Cytochrome c oxidase: compact, where oxygen is reduced to water.
  return merge([
    place(blob(0.16, 2, 0.25, 9, [1, 1.1, 0.9]), [0, 0.02, 0]),
    place(blob(0.1, 1, 0.3, 5), [0.05, 0.2, 0.04]),
    place(blob(0.08, 1, 0.3, 7), [-0.06, -0.16, 0]),
  ]);
}

function synthaseStatorGeo(): THREE.BufferGeometry {
  // F1 head: three alpha and three beta subunits arranged like the segments of an orange,
  // plus subunit a beside the c-ring and the peripheral stalk that holds the head still.
  const head = new THREE.SphereGeometry(0.25, 24, 14);
  const p = head.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const az = Math.atan2(z, x);
    const lobes = 1 + 0.13 * Math.cos(az * 6) * Math.sqrt(Math.max(0, 1 - (y / 0.25) ** 2));
    p.setXYZ(i, x * lobes, y * 1.2, z * lobes);
  }
  head.computeVertexNormals();
  return merge([
    place(head, [0, 0.64, 0]),
    place(blob(0.1, 2, 0.3, 9, [1, 1.3, 1.2]), [0.21, 0, 0]),
    place(new THREE.CylinderGeometry(0.03, 0.03, 0.86, 6), [0.31, 0.44, 0], new THREE.Euler(0, 0, 0.1)),
    place(blob(0.08, 1, 0.2, 11), [0.14, 0.93, 0]),
  ]);
}

function synthaseRotorGeo(): THREE.BufferGeometry {
  // The rotor: a ring of 8 c-subunits (mammals) plus the asymmetric gamma/epsilon stalk.
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    parts.push(place(new THREE.CapsuleGeometry(0.042, 0.16, 2, 6), [Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1]));
  }
  parts.push(place(new THREE.CylinderGeometry(0.035, 0.05, 0.42, 6), [0.015, 0.3, 0], new THREE.Euler(0, 0, -0.08)));
  parts.push(place(blob(0.07, 1, 0.3, 3), [0.08, 0.17, 0]));
  return merge(parts);
}

function vdacGeo(): THREE.BufferGeometry {
  // Beta-barrel porin; +Y is the membrane normal.
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    parts.push(place(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 4), [Math.cos(a) * 0.075, 0, Math.sin(a) * 0.075], new THREE.Euler(0.25, a, 0)));
  }
  return merge(parts);
}

function antGeo(): THREE.BufferGeometry {
  // Six-helix carrier forming a cup that alternately opens to each side.
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(place(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 5), [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], new THREE.Euler(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2)));
  }
  return merge(parts);
}
