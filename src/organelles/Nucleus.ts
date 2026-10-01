import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { membraneMaterial, solid, glow, PALETTE } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, fibonacciSphere, v3, cyclePhase, randomQuat } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import { ellipsoidRatio, type Layout } from '../world/layout';

// The nucleus: double envelope pierced by nuclear pore complexes, lamina, chromatin
// territories, nucleoli, and live transcription of the insulin gene with mRNA export.

interface GeneSite {
  start: THREE.Vector3;
  end: THREE.Vector3;
  pore: Site;
  phase: number;
  pol: THREE.Mesh;
}

const MRNA_BEADS = 12;

export class Nucleus implements Organelle {
  readonly id = 'nucleus';
  readonly group = new THREE.Group();
  private readonly center: THREE.Vector3;
  private readonly radii: THREE.Vector3;
  private readonly pores: NearSites;
  private readonly poreCargo: ParticlePool;
  private readonly genes: GeneSite[] = [];
  private readonly mrna: THREE.InstancedMesh;
  private readonly subunits: ParticlePool;
  private readonly nucleoli: { center: THREE.Vector3; radius: number; pore: Site }[] = [];
  private readonly ntp: ParticlePool;
  private geneProgress = 0;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const n = layout.nucleus;
    this.center = v3(n.center);
    this.radii = v3(n.radii);
    const c = n.center;
    const inside = (p: THREE.Vector3, r = 1) => ellipsoidRatio([p.x, p.y, p.z], c, n.radii) < r;

    // --- double envelope --------------------------------------------------------------
    const makeShell = (shrink: number, opacity: number, baseAlpha: number) => {
      const g = new THREE.SphereGeometry(1, 72, 48);
      g.scale(this.radii.x - shrink, this.radii.y - shrink, this.radii.z - shrink);
      const m = new THREE.Mesh(
        g,
        membraneMaterial({ color: PALETTE.nucleus, rimColor: PALETTE.nucleusRim, opacity, baseAlpha, amp: 0.1, freq: 0.14, rimStrength: 0.85, glow: 0.3, near: [3, 12, 0.3], dots: 3.3 }),
      );
      m.position.copy(this.center);
      return m;
    };
    const outer = makeShell(0, 0.92, 0.2);
    const inner = makeShell(0.5, 0.8, 0.1);
    this.group.add(outer, inner);
    kit.pickable(outer, { entity: 'nucleus', nearEntity: 'nuclear-envelope', nearDist: 6, xray: true });
    kit.pickable(inner, { entity: 'nuclear-envelope', xray: true });
    kit.membrane(outer, { depth: 2, xray: true, contains: (p) => inside(p) });
    kit.membrane(inner, { depth: 3, xray: true, contains: (p) => inside(p, 0.975) });

    // --- nuclear lamina: a protein meshwork lining the inner membrane --------------------
    const laminaGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 5));
    laminaGeo.scale(this.radii.x - 0.8, this.radii.y - 0.8, this.radii.z - 0.8);
    const lamina = new THREE.LineSegments(
      laminaGeo,
      new THREE.LineBasicMaterial({ color: 0xbfaeff, transparent: true, opacity: 0.22 }),
    );
    lamina.position.copy(this.center);
    this.group.add(lamina);
    const laminaHit = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16).scale(this.radii.x - 0.8, this.radii.y - 0.8, this.radii.z - 0.8),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.BackSide }),
    );
    laminaHit.position.copy(this.center);
    this.group.add(laminaHit);
    kit.pickable(laminaHit, { entity: 'nuclear-lamina' });

    // --- nuclear pore complexes (true scale: about 120 nm across) ------------------------
    const dirs = fibonacciSphere(210);
    const poreSites: Site[] = dirs.map((d) => {
      const pos = new THREE.Vector3(d.x * this.radii.x, d.y * this.radii.y, d.z * this.radii.z);
      const normal = new THREE.Vector3(pos.x / this.radii.x ** 2, pos.y / this.radii.y ** 2, pos.z / this.radii.z ** 2).normalize();
      pos.addScaledVector(normal, -0.22).add(this.center);
      return { pos, normal, phase: rng.range(0, 10) };
    });
    const poreMesh = new THREE.InstancedMesh(poreGeo(), solid(0xcbbcff, { emissiveIntensity: 0.3, roughness: 0.45 }), poreSites.length);
    const plug = new THREE.InstancedMesh(
      new THREE.CircleGeometry(0.36, 12).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x9a7cff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
      poreSites.length * 2,
    );
    poreSites.forEach((s, i) => {
      const q = quatFromY(s.normal);
      setInstance(poreMesh, i, s.pos, q, 1);
      // The central channel's FG-repeat mesh, seen from the cytoplasm and from the nucleus.
      setInstance(plug, i * 2, s.pos.clone().addScaledVector(s.normal, 0.3), q, 1);
      setInstance(plug, i * 2 + 1, s.pos.clone().addScaledVector(s.normal, -0.36), q, 1);
    });
    poreMesh.computeBoundingSphere();
    plug.computeBoundingSphere();
    this.group.add(poreMesh, plug);
    kit.pickable(poreMesh, { entity: 'nuclear-pore' });
    kit.pickable(plug, { entity: 'nuclear-pore' });
    this.pores = new NearSites(poreSites, 6, 26);
    this.poreCargo = particles.pool(6 * 4, 0x9fffc0, 0.2);

    // Designated pore for travel and the story: the one facing the spawn side.
    const facing = new THREE.Vector3(0.62, 0.3, 0.72).normalize();
    const mainPore = poreSites.reduce((best, s) => (s.normal.dot(facing) > best.normal.dot(facing) ? s : best), poreSites[0]);
    kit.anchor('nuclear-pore', mainPore.pos, mainPore.pos.clone().addScaledVector(mainPore.normal, 3.2).add(new THREE.Vector3(0, 1.3, 0)));
    kit.anchor('nucleus', this.center, kit.vantage(this.center, this.radii.x + 17, this.radii.x + 9, facing));
    kit.anchor('nuclear-envelope', mainPore.pos, mainPore.pos.clone().addScaledVector(mainPore.normal, 7));
    kit.anchor('nuclear-lamina', mainPore.pos.clone().addScaledVector(mainPore.normal, -0.8), mainPore.pos.clone().addScaledVector(mainPore.normal, -5));

    // --- nucleoli: membrane-less ribosome factories -------------------------------------
    n.nucleoli.forEach((nu, idx) => {
      const nc = v3(nu.center);
      const granular = new THREE.Mesh(
        blob(nu.radius, 4, 0.22, 3 + idx),
        solid(PALETTE.nucleolus, { transparent: true, opacity: 0.5, emissiveIntensity: 0.25, roughness: 0.9 }),
      );
      granular.position.copy(nc);
      granular.renderOrder = 6;
      this.group.add(granular);
      kit.pickable(granular, { entity: 'nucleolus' });
      // Dense fibrillar component wrapping pale fibrillar centres.
      const dfc = new THREE.InstancedMesh(blob(1, 2, 0.3, 9), solid(0x7a4be0, { emissiveIntensity: 0.35 }), 5);
      const fc = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), glow(0xe9dcff, 1.3), 5);
      for (let i = 0; i < 5; i++) {
        const p = nc.clone().add(new THREE.Vector3(...rng.unit()).multiplyScalar(nu.radius * 0.45));
        const s = nu.radius * rng.range(0.2, 0.28);
        setInstance(dfc, i, p, randomQuat(() => rng.next()), s);
        setInstance(fc, i, p, null, s * 0.42);
      }
      this.group.add(dfc, fc);
      kit.pickable(dfc, { entity: 'nucleolus' });
      const out = nc.clone().sub(this.center).normalize();
      const pore = poreSites.reduce((best, s) => (s.normal.dot(out) > best.normal.dot(out) ? s : best), poreSites[0]);
      this.nucleoli.push({ center: nc, radius: nu.radius, pore });
      kit.compartment({ label: 'Nucleolus', priority: 7, fog: 0x1c0e40, fogDensity: 0.03, test: (p) => p.distanceTo(nc) < nu.radius * 0.95 });
      if (idx === 0) kit.anchor('nucleolus', nc, nc.clone().addScaledVector(facing, nu.radius + 7));
    });
    this.subunits = particles.pool(36, 0x8fd8ff, 0.3);

    // --- chromatin ----------------------------------------------------------------------
    const inNucleolus = (p: THREE.Vector3) => this.nucleoli.some((nu) => p.distanceTo(nu.center) < nu.radius + 1.2);
    const fibers: THREE.BufferGeometry[] = [];
    const hues = [0.72, 0.76, 0.68, 0.8, 0.64, 0.74, 0.7, 0.78, 0.66, 0.82, 0.62, 0.75, 0.69, 0.79];
    hues.forEach((h, t) => {
      // Each chromosome keeps to its own territory: a confined random walk.
      const home = new THREE.Vector3(...rng.unit()).multiply(this.radii).multiplyScalar(rng.range(0.25, 0.62)).add(this.center);
      const pts: THREE.Vector3[] = [];
      let p = home.clone();
      let dir = new THREE.Vector3(...rng.unit());
      for (let i = 0; i < 70; i++) {
        pts.push(p.clone());
        dir.add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.9)).normalize();
        let next = p.clone().addScaledVector(dir, 2.1);
        if (!inside(next, 0.86) || inNucleolus(next) || next.distanceTo(home) > 13) {
          dir = home.clone().sub(p).normalize().add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.5)).normalize();
          next = p.clone().addScaledVector(dir, 2.1);
        }
        p = next;
      }
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.3, 5, false).toNonIndexed();
      g.deleteAttribute('uv');
      const col = new THREE.Color().setHSL(h, 0.62, 0.5 + (t % 3) * 0.05);
      const colors = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = col.r;
        colors[i + 1] = col.g;
        colors[i + 2] = col.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      fibers.push(g);
    });
    // A knobbly surface suggests the nucleosomes packed along each fibre.
    const fibreMat = solid(0xffffff, { emissive: 0x3a1f8a, emissiveIntensity: 0.4, roughness: 0.7, bump: 1.7, bumpScale: 7 });
    fibreMat.vertexColors = true;
    const euchromatin = new THREE.Mesh(mergeGeometries(fibers)!, fibreMat);
    this.group.add(euchromatin);
    kit.pickable(euchromatin, { entity: 'chromatin' });

    // Heterochromatin: dense, silent clumps pressed against the lamina.
    const hetero = new THREE.InstancedMesh(blob(1, 2, 0.4, 5), solid(0x5a36c8, { emissiveIntensity: 0.42, roughness: 0.85, bumpScale: 5, bump: 1.6 }), 170);
    for (let i = 0; i < 170; i++) {
      const d = new THREE.Vector3(...rng.unit());
      const p = d.clone().multiply(this.radii).multiplyScalar(rng.range(0.86, 0.93)).add(this.center);
      const s = rng.range(1.4, 3.1);
      setInstance(hetero, i, p, quatFromY(d), new THREE.Vector3(s, s * 0.45, s));
    }
    hetero.computeBoundingSphere();
    this.group.add(hetero);
    kit.pickable(hetero, { entity: 'chromatin' });
    kit.anchor('chromatin', this.center.clone().addScaledVector(facing, 8), this.center.clone().addScaledVector(facing, 15));

    // --- transcription sites ------------------------------------------------------------
    this.mrna = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 1), glow(PALETTE.mrna, 1.5), 3 * MRNA_BEADS);
    this.mrna.frustumCulled = false;
    this.group.add(this.mrna);
    kit.pickable(this.mrna, { entity: 'mrna' });
    this.ntp = particles.pool(3 * 6, 0xffc9a8, 0.12);
    const detail = new THREE.Group();
    this.group.add(detail);
    const geneDirs = [facing, new THREE.Vector3(-0.5, 0.7, 0.4).normalize(), new THREE.Vector3(0.2, -0.6, -0.75).normalize()];
    geneDirs.forEach((gd, gi) => {
      const pore = poreSites.reduce((best, s) => (s.normal.dot(gd) > best.normal.dot(gd) ? s : best), poreSites[0]);
      const mid = pore.pos.clone().sub(this.center).multiplyScalar(0.62).add(this.center);
      const along = new THREE.Vector3().crossVectors(pore.normal, new THREE.Vector3(0.2, 1, 0.1)).normalize();
      const start = mid.clone().addScaledVector(along, -4.5);
      const end = mid.clone().addScaledVector(along, 4.5);
      const dna = new THREE.Mesh(dnaGeo(9), solid(0xb9a4ff, { emissiveIntensity: 0.45 }));
      dna.position.copy(mid);
      dna.quaternion.copy(quatFromY(along));
      detail.add(dna);
      kit.pickable(dna, { entity: 'chromatin' });
      // Beads on a string leading into the gene: nucleosomes, drawn 4x.
      const nucleosomes = new THREE.InstancedMesh(nucleosomeGeo(), solid(0xd96bff, { emissiveIntensity: 0.3 }), 26);
      for (let i = 0; i < 26; i++) {
        const side = i < 13 ? -1 : 1;
        const k = i % 13;
        const p = (side < 0 ? start : end)
          .clone()
          .addScaledVector(along, side * (0.7 + k * 0.62))
          .add(new THREE.Vector3(Math.sin(k * 1.9) * 0.35, Math.cos(k * 2.3) * 0.35, Math.sin(k * 1.1) * 0.3));
        setInstance(nucleosomes, i, p, randomQuat(() => rng.next()), 1);
      }
      nucleosomes.computeBoundingSphere();
      detail.add(nucleosomes);
      kit.pickable(nucleosomes, { entity: 'nucleosome' });
      const pol = new THREE.Mesh(polGeo(), solid(0xffd166, { emissiveIntensity: 0.4 }));
      detail.add(pol);
      kit.pickable(pol, { entity: 'rna-pol-ii' });
      this.genes.push({ start, end, pore, phase: gi * 5.3, pol });
      if (gi === 0) {
        const view = mid.clone().addScaledVector(pore.normal, -5).addScaledVector(new THREE.Vector3(0, 1, 0), 1.5);
        kit.anchor('rna-pol-ii', () => pol.position, view);
        kit.anchor('mrna', () => pol.position, view);
        kit.anchor('nucleosome', start.clone().addScaledVector(along, -3), view.clone().addScaledVector(along, -4));
      }
    });
    kit.lod(detail, this.center, this.radii.x + 26);

    // --- compartments -------------------------------------------------------------------
    kit.compartment({ label: 'Nucleoplasm', priority: 5, fog: 0x100930, fogDensity: 0.02, test: (p) => inside(p, 0.972) });
    kit.compartment({ label: 'Perinuclear space', priority: 4, fog: 0x130b38, fogDensity: 0.02, test: (p) => inside(p, 1.0) });

  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'rna-pol-ii' || entityId === 'mrna' || entityId === 'nucleus') return this.geneProgress;
    if (entityId === 'nuclear-pore') return this.geneProgress;
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const pt = ctx.pt;

    // Transport through the nearest pores: import (green, inward) and export (blue, outward).
    const near = this.pores.update(cam, ctx.dt);
    this.poreCargo.hideAll();
    near.forEach((s, i) => {
      for (let j = 0; j < 4; j++) {
        const inward = j % 2 === 0;
        const u = (((pt * 0.22 + s.phase + j * 0.25) % 1) + 1) % 1;
        const y = inward ? THREE.MathUtils.lerp(3.2, -3.2, u) : THREE.MathUtils.lerp(-3.2, 3.2, u);
        const r = Math.min(1, Math.abs(y) / 1.5) * 0.7;
        const a = j * 1.7 + s.phase;
        _p.copy(s.pos).addScaledVector(s.normal, y);
        _p.x += Math.cos(a) * r * 0.5;
        _p.y += Math.sin(a) * r * 0.5;
        this.poreCargo.setV(i * 4 + j, _p);
        this.poreCargo.color(i * 4 + j, inward ? IMPORT : EXPORT);
      }
    });

    // Ribosomal subunits leave the nucleolus and exit through a pore.
    let k = 0;
    for (const nu of this.nucleoli) {
      const per = this.subunits.count / this.nucleoli.length;
      const outDir = nu.pore.pos.clone().sub(nu.center).normalize();
      for (let i = 0; i < per; i++, k++) {
        const u = (((pt * 0.045 + i / per) % 1) + 1) % 1;
        const from = _a.copy(nu.center).addScaledVector(outDir, nu.radius * 0.9);
        const through = _b.copy(nu.pore.pos).addScaledVector(nu.pore.normal, 5);
        if (u < 0.8) _p.lerpVectors(from, nu.pore.pos, u / 0.8);
        else _p.lerpVectors(nu.pore.pos, through, (u - 0.8) / 0.2);
        const wob = Math.sin(u * 30 + i) * 0.5 * (1 - Math.abs(u - 0.4));
        _p.x += wob * 0.6;
        _p.y += Math.cos(u * 24 + i * 2) * 0.4;
        this.subunits.setV(k, _p);
        this.subunits.size(k, i % 2 ? 0.34 : 0.26); // 60S and 40S
      }
    }

    // Transcription -> processing -> export.
    this.ntp.hideAll();
    const durations = [6, 2, 5, 2, 1.5];
    this.genes.forEach((g, gi) => {
      const total = durations.reduce((a, b) => a + b, 0);
      const t = pt * 0.55 + g.phase;
      const [step, p] = cyclePhase(t, durations);
      if (gi === 0) this.geneProgress = (((t % total) + total) % total) / total;
      const polT = step === 0 ? p : 1;
      g.pol.position.lerpVectors(g.start, g.end, polT);
      g.pol.visible = step <= 1;
      const along = _a.copy(g.end).sub(g.start).normalize();
      const side = _b.crossVectors(along, g.pore.normal).normalize();
      const poreIn = _c.copy(g.pore.pos).addScaledVector(g.pore.normal, -1.6);
      const poreOut = _d.copy(g.pore.pos).addScaledVector(g.pore.normal, 2.4);
      for (let i = 0; i < MRNA_BEADS; i++) {
        const idx = gi * MRNA_BEADS + i;
        let visible = true;
        let scale = 1;
        if (step === 0) {
          // Nascent transcript grows out of the polymerase.
          const grown = Math.floor(p * MRNA_BEADS);
          visible = i <= grown;
          const back = i * 0.24;
          _p.copy(g.pol.position).addScaledVector(side, 0.35 + back * 0.9).addScaledVector(along, -back * 0.3);
          _p.y += Math.sin(pt * 2 + i * 0.8) * 0.12;
        } else if (step === 1) {
          // Capping, splicing, poly-A: the transcript compacts into a mature mRNP.
          const back = i * 0.24 * (1 - p * 0.45);
          _p.copy(g.end).addScaledVector(side, 0.35 + back * 0.9).addScaledVector(along, -back * 0.3);
          scale = 1 + Math.sin(p * Math.PI) * 0.5;
        } else {
          // Travel to the pore, thread through single file, disperse in the cytosol.
          const head = step === 2 ? p * 0.6 : step === 3 ? 0.6 + p * 0.3 : 0.9 + p * 0.1;
          const s = Math.max(0, head - i * 0.016);
          const from = _e.copy(g.end).addScaledVector(side, 0.6);
          if (s < 0.6) _p.lerpVectors(from, poreIn, s / 0.6);
          else if (s < 0.9) _p.lerpVectors(poreIn, poreOut, (s - 0.6) / 0.3);
          else _p.copy(poreOut).addScaledVector(g.pore.normal, ((s - 0.9) / 0.1) * 4);
          if (step === 4) scale = 1 - p;
        }
        _q.identity();
        _s.setScalar(visible ? Math.max(0.001, scale) : 0.001);
        _m.compose(_p, _q, _s);
        this.mrna.setMatrixAt(idx, _m);
      }
      // Incoming ribonucleotides at the active site.
      if (step === 0) {
        for (let j = 0; j < 6; j++) {
          const u = (((pt * 0.8 + j / 6) % 1) + 1) % 1;
          const a = j * 2.1;
          _p.copy(g.pol.position).add(_e.set(Math.cos(a), Math.sin(a * 1.3), Math.sin(a)).multiplyScalar((1 - u) * 2.2));
          this.ntp.setV(gi * 6 + j, _p);
        }
      }
    });
    this.mrna.instanceMatrix.needsUpdate = true;
  }
}

const IMPORT = new THREE.Color(0x8dffb0);
const EXPORT = new THREE.Color(0x8fc8ff);
const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _e = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();

function poreGeo(): THREE.BufferGeometry {
  // Eight-fold symmetric: cytoplasmic ring with filaments, inner spoke ring, nuclear ring
  // with a basket converging on a distal ring. +Y points to the cytoplasm.
  const parts: THREE.BufferGeometry[] = [];
  const ring = (R: number, r: number, y: number) =>
    place(new THREE.TorusGeometry(R, r, 4, 12).rotateX(Math.PI / 2), [0, y, 0]);
  parts.push(ring(0.52, 0.1, 0.22), ring(0.4, 0.12, 0), ring(0.52, 0.09, -0.22), ring(0.17, 0.035, -0.95));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cx = Math.cos(a);
    const sz = Math.sin(a);
    parts.push(place(new THREE.IcosahedronGeometry(0.13, 0), [cx * 0.52, 0.24, sz * 0.52]));
    // cytoplasmic filament
    parts.push(
      place(new THREE.CylinderGeometry(0.02, 0.03, 0.55, 4), [cx * 0.6, 0.55, sz * 0.6], new THREE.Euler(sz * 0.35, 0, -cx * 0.35)),
    );
    // basket filament
    const top = new THREE.Vector3(cx * 0.5, -0.24, sz * 0.5);
    const bottom = new THREE.Vector3(cx * 0.17, -0.95, sz * 0.17);
    const mid = top.clone().add(bottom).multiplyScalar(0.5);
    parts.push(place(new THREE.CylinderGeometry(0.02, 0.02, top.distanceTo(bottom), 4), mid, quatFromY(bottom.clone().sub(top))));
  }
  return merge(parts);
}

function nucleosomeGeo(): THREE.BufferGeometry {
  // Histone octamer disc with DNA wrapped about 1.65 turns around it.
  const parts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(0.17, 0.17, 0.2, 10)];
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const a = u * Math.PI * 2 * 1.65;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.22, (u - 0.5) * 0.16, Math.sin(a) * 0.22));
  }
  parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 4, false));
  return merge(parts);
}

function dnaGeo(length: number): THREE.BufferGeometry {
  // B-form double helix along +Y, drawn about 10x: two backbones and base-pair rungs.
  const parts: THREE.BufferGeometry[] = [];
  const turns = length / 0.7;
  for (let strand = 0; strand < 2; strand++) {
    const pts: THREE.Vector3[] = [];
    const n = Math.floor(turns * 10);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = u * turns * Math.PI * 2 + strand * Math.PI * 0.9;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.12, (u - 0.5) * length, Math.sin(a) * 0.12));
    }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.028, 4, false));
  }
  const rungs = Math.floor(turns * 10);
  for (let i = 0; i < rungs; i += 1) {
    const u = i / rungs;
    const a = u * turns * Math.PI * 2;
    parts.push(
      place(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 3), [0, (u - 0.5) * length, 0], new THREE.Euler(0, -a, Math.PI / 2)),
    );
  }
  return merge(parts);
}

function polGeo(): THREE.BufferGeometry {
  // RNA polymerase II: a 12-subunit "crab claw" clamped around the DNA.
  return merge([
    place(blob(0.42, 2, 0.35, 2), [0.18, 0, 0.05]),
    place(blob(0.36, 2, 0.35, 5), [-0.2, 0.08, -0.05]),
    place(blob(0.2, 1, 0.3, 8), [0, -0.1, 0.36]),
  ]);
}
