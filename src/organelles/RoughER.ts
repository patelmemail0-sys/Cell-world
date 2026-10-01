import * as THREE from 'three';
import { membraneMaterial, solid, PALETTE } from '../fx/materials';
import { blob, merge, place, quatFromY, v3, cyclePhase, perpendicular } from '../fx/geom';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Rough endoplasmic reticulum: stacked, flattened cisternae wrapped around the nucleus,
// studded with ribosomes making secretory proteins. In a beta cell, mostly preproinsulin.

/** Half-thickness of a cisterna in nucleus-relative units (about 30 nm of lumen). */
const HALF = 0.0135;

export interface BoundSite {
  pos: THREE.Vector3;
  /** Points from the membrane into the cytosol. */
  normal: THREE.Vector3;
}

export class RoughER implements Organelle {
  readonly id = 'rough-er';
  readonly group = new THREE.Group();
  /** Ribosome docking positions on the cytosolic faces; consumed by the ribosome system. */
  readonly boundSites: BoundSite[] = [];
  /** Rim points facing the Golgi, where COPII vesicles bud. */
  readonly exitSites: BoundSite[] = [];
  private readonly docking: DockingDemo[] = [];

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, quality } = ctx;
    const center = v3(layout.nucleus.center);
    const radii = v3(layout.nucleus.radii);
    const golgi = v3(layout.golgi.center);
    const density = quality === 'low' ? 0.45 : quality === 'medium' ? 0.75 : 1;
    const mat = membraneMaterial({
      color: PALETTE.er,
      rimColor: PALETTE.erRim,
      baseAlpha: 0.17,
      opacity: 0.85,
      amp: 0.16,
      freq: 0.22,
      rimStrength: 0.75,
      glow: 0.2,
      near: [2, 9, 0.3],
      dots: 3.3,
    });

    const cisternae: { dir: THREE.Vector3; angle: number; s: number }[] = [];
    layout.er.forEach((cap) => {
      const dir = v3(cap.dir);
      const q = quatFromY(dir);
      cap.shells.forEach((s, k) => {
        const angle = cap.angle - k * 0.07;
        cisternae.push({ dir, angle, s });
        const g = cisternaGeo(s, angle);
        g.applyQuaternion(q);
        g.scale(radii.x, radii.y, radii.z);
        g.translate(center.x, center.y, center.z);
        const mesh = new THREE.Mesh(g, mat);
        this.group.add(mesh);
        kit.pickable(mesh, { entity: 'rough-er' });
        kit.membrane(mesh, { depth: 2, xray: false, contains: (p) => inLumen(p, dir, angle, s) });

        // Ribosome sites on both cytosolic faces, denser on larger shells.
        const perFace = Math.round(120 * s * s * (1 - Math.cos(angle)) * density);
        for (const face of [1, -1]) {
          for (let i = 0; i < perFace; i++) {
            const u = sampleCap(dir, angle * 0.96, rng.next(), rng.next());
            const rr = s + face * (HALF + 0.004);
            const pos = new THREE.Vector3(u.x * radii.x, u.y * radii.y, u.z * radii.z).multiplyScalar(rr).add(center);
            const normal = new THREE.Vector3(u.x / radii.x, u.y / radii.y, u.z / radii.z).normalize().multiplyScalar(face);
            this.boundSites.push({ pos, normal });
          }
        }
        // ER exit sites sit on the rim nearest the Golgi.
        const toGolgi = golgi.clone().sub(center).divide(radii).normalize();
        const rimDir = rimToward(dir, angle, toGolgi);
        if (rimDir) {
          const pos = new THREE.Vector3(rimDir.x * radii.x, rimDir.y * radii.y, rimDir.z * radii.z).multiplyScalar(s).add(center);
          const normal = pos.clone().sub(center).normalize();
          const outward = golgi.clone().sub(pos).normalize().lerp(normal, 0.3).normalize();
          this.exitSites.push({ pos, normal: outward });
        }
      });
    });

    const inLumenAny = (p: THREE.Vector3) => cisternae.some((c) => inLumen(p, c.dir, c.angle, c.s));
    function inLumen(p: THREE.Vector3, dir: THREE.Vector3, angle: number, s: number): boolean {
      _u.copy(p).sub(center).divide(radii);
      const r = _u.length();
      if (Math.abs(r - s) > HALF) return false;
      return Math.acos(THREE.MathUtils.clamp(_u.multiplyScalar(1 / r).dot(dir), -1, 1)) < angle;
    }
    kit.compartment({ label: 'ER lumen', priority: 6, fog: 0x06262e, fogDensity: 0.03, test: inLumenAny });

    // Designated site for travel and the story: outermost shell, facing the Golgi side.
    const want = golgi.clone().sub(center).normalize();
    const designated = this.boundSites
      .filter((s) => s.normal.dot(s.pos.clone().sub(center)) > 0)
      .reduce((best, s) => (score(s) > score(best) ? s : best), this.boundSites[0]);
    function score(s: BoundSite): number {
      return s.pos.clone().sub(center).normalize().dot(want) + s.pos.distanceTo(center) * 0.004;
    }
    // Move the designated site to index 0 so the ribosome system can find it.
    const di = this.boundSites.indexOf(designated);
    [this.boundSites[0], this.boundSites[di]] = [this.boundSites[di], this.boundSites[0]];
    const d = this.boundSites[0];
    const close = d.pos.clone().addScaledVector(d.normal, 0.55).addScaledVector(perpendicular(d.normal), 1.6);
    for (const id of ['sec61', 'signal-peptidase', 'ost', 'bip', 'pdi']) kit.anchor(id, d.pos, close);
    kit.anchor('rough-er', d.pos, d.pos.clone().addScaledVector(d.normal, 11));

    // SRP docking demos: a ribosome that has just started a secretory protein is escorted
    // to the membrane by the signal recognition particle.
    for (let i = 0; i < 3; i++) {
      const site = this.boundSites[1 + i * 7];
      const demo = new DockingDemo(site, i * 3.1, ctx);
      this.docking.push(demo);
      this.group.add(demo.group);
      kit.lod(demo.group, site.pos, 30);
      if (i === 0) kit.anchor('srp', () => demo.srpWorld(), site.pos.clone().addScaledVector(site.normal, 4.5).add(new THREE.Vector3(0, 1.2, 0)));
    }
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'srp') return this.docking[0].progress;
    return null;
  }

  update(ctx: FrameCtx): void {
    for (const d of this.docking) if (d.group.visible) d.update(ctx.pt);
  }
}

class DockingDemo {
  readonly group = new THREE.Group();
  private readonly complex = new THREE.Group();
  private readonly srp: THREE.Mesh;
  private readonly receptor: THREE.Mesh;
  progress = 0;

  constructor(site: BoundSite, private readonly phase: number, ctx: BuildContext) {
    this.group.position.copy(site.pos);
    this.group.quaternion.copy(quatFromY(site.normal));
    const large = new THREE.Mesh(blob(0.3, 2, 0.25, 3), solid(PALETTE.ribosome, { emissiveIntensity: 0.3 }));
    large.position.y = 0.26;
    const small = new THREE.Mesh(blob(0.22, 2, 0.3, 6, [1.2, 0.8, 1]), solid(0x9fe6ff, { emissiveIntensity: 0.3 }));
    small.position.y = 0.56;
    // SRP: an elongated RNA-protein rod that grips the signal peptide and pauses translation.
    this.srp = new THREE.Mesh(
      merge([
        place(new THREE.CapsuleGeometry(0.06, 0.5, 3, 6), [0.36, 0.2, 0], new THREE.Euler(0, 0, 0.5)),
        place(blob(0.11, 1, 0.3, 2), [0.2, 0.0, 0]),
        place(blob(0.09, 1, 0.3, 4), [0.5, 0.44, 0]),
      ]),
      solid(0xffd166, { emissiveIntensity: 0.5 }),
    );
    this.complex.add(large, small, this.srp);
    this.receptor = new THREE.Mesh(blob(0.13, 1, 0.3, 8, [1, 1.4, 1]), solid(0xff9f6b, { emissiveIntensity: 0.4 }));
    this.receptor.position.set(0.3, 0.05, 0);
    this.group.add(this.complex, this.receptor);
    ctx.kit.pickable(large, { entity: 'large-subunit' });
    ctx.kit.pickable(small, { entity: 'small-subunit' });
    ctx.kit.pickable(this.srp, { entity: 'srp' });
    ctx.kit.pickable(this.receptor, { entity: 'srp' });
  }

  srpWorld(): THREE.Vector3 {
    return this.srp.getWorldPosition(new THREE.Vector3());
  }

  update(pt: number): void {
    // 0 approach with SRP bound, 1 dock on the SRP receptor, 2 SRP released, 3 translating, 4 reset
    const durations = [4, 1.5, 2, 4, 1];
    const total = 12.5;
    const t = pt * 0.6 + this.phase;
    const [step, p] = cyclePhase(t, durations);
    this.progress = (((t % total) + total) % total) / total;
    const e = p * p * (3 - 2 * p);
    let y = 0;
    let srpOff = 0;
    let scale = 1;
    if (step === 0) y = THREE.MathUtils.lerp(4, 0.4, e);
    else if (step === 1) y = THREE.MathUtils.lerp(0.4, 0, e);
    else if (step === 2) srpOff = e;
    else if (step === 3) srpOff = 1;
    else { srpOff = 1; scale = 1 - e; }
    this.complex.position.set(step === 0 ? Math.sin(pt * 1.3 + this.phase) * 0.3 * (1 - e) : 0, y, 0);
    this.complex.scale.setScalar(Math.max(0.001, scale));
    this.srp.position.set(srpOff * 1.6, srpOff * 1.4, srpOff * 0.5);
    this.srp.visible = srpOff < 0.98;
  }
}

const _u = new THREE.Vector3();

/** Closed flattened sac following a spherical cap around +Y, built by revolving a profile. */
function cisternaGeo(s: number, angle: number): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const th = 0.015 + (angle - 0.015) * (i / n);
    pts.push(new THREE.Vector2(Math.sin(th) * (s + HALF), Math.cos(th) * (s + HALF)));
  }
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const r = s + Math.cos(a) * HALF;
    const th = angle + Math.sin(a) * HALF * 0.9;
    pts.push(new THREE.Vector2(Math.sin(th) * r, Math.cos(th) * r));
  }
  for (let i = n; i >= 0; i--) {
    const th = 0.015 + (angle - 0.015) * (i / n);
    pts.push(new THREE.Vector2(Math.sin(th) * (s - HALF), Math.cos(th) * (s - HALF)));
  }
  return new THREE.LatheGeometry(pts, 72);
}

/** Uniform direction within a cap of half-angle `angle` around `dir`. */
function sampleCap(dir: THREE.Vector3, angle: number, r1: number, r2: number): THREE.Vector3 {
  const cos = 1 - r1 * (1 - Math.cos(angle));
  const sin = Math.sqrt(1 - cos * cos);
  const phi = r2 * Math.PI * 2;
  return new THREE.Vector3(Math.cos(phi) * sin, cos, Math.sin(phi) * sin).applyQuaternion(quatFromY(dir));
}

/** Point on the cap's rim closest to `toward`, or null if the cap already covers it. */
function rimToward(dir: THREE.Vector3, angle: number, toward: THREE.Vector3): THREE.Vector3 | null {
  const tangent = toward.clone().addScaledVector(dir, -toward.dot(dir));
  if (tangent.lengthSq() < 1e-6) return null;
  tangent.normalize();
  return dir.clone().multiplyScalar(Math.cos(angle)).addScaledVector(tangent, Math.sin(angle));
}
