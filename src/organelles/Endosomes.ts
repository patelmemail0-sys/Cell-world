import * as THREE from 'three';
import { membraneMaterial, PALETTE } from '../fx/materials';
import { merge, setInstance, v3 } from '../fx/geom';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Endosomes: sorting stations of the endocytic pathway. Early endosomes near the plasma
// membrane send receptors back along recycling tubules; late endosomes (multivesicular
// bodies) fill with intraluminal vesicles and mature toward lysosomes.

export class Endosomes implements Organelle {
  readonly id = 'endosome';
  readonly group = new THREE.Group();
  private readonly early: { center: THREE.Vector3; radius: number; tubes: THREE.Vector3[] }[] = [];
  private readonly late: { center: THREE.Vector3; radius: number }[];
  private readonly recycle: ParticlePool;
  private readonly incoming: ParticlePool;
  private readonly ilv: THREE.InstancedMesh;
  private readonly ilvHome: THREE.Vector3[] = [];

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const earlyMat = membraneMaterial({ color: PALETTE.endosome, rimColor: 0xb0c8ff, baseAlpha: 0.24, opacity: 0.9, amp: 0.05, freq: 1.2, glow: 0.3 });
    const lateMat = membraneMaterial({ color: 0x8a6cff, rimColor: 0xd0c0ff, baseAlpha: 0.22, opacity: 0.9, amp: 0.04, freq: 1.2, glow: 0.3 });

    layout.earlyEndosomes.forEach((b, i) => {
      const c = v3(b.center);
      const parts: THREE.BufferGeometry[] = [new THREE.SphereGeometry(b.radius, 24, 16).translate(c.x, c.y, c.z)];
      const tubes: THREE.Vector3[] = [];
      // Recycling tubules reach back toward the plasma membrane.
      for (let t = 0; t < 3; t++) {
        const out = c.clone().normalize().add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.7)).normalize();
        const end = c.clone().addScaledVector(out, b.radius + rng.range(2.2, 3.6));
        const mid = c.clone().addScaledVector(out, b.radius + 1).add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.5));
        parts.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(c.clone().addScaledVector(out, b.radius * 0.8), mid, end), 10, 0.22, 7, false));
        parts.push(new THREE.SphereGeometry(0.3, 8, 6).translate(end.x, end.y, end.z));
        tubes.push(end);
      }
      const mesh = new THREE.Mesh(merge(parts), earlyMat);
      this.group.add(mesh);
      kit.pickable(mesh, { entity: 'endosome', nearEntity: 'early-endosome', nearDist: 14, xray: true });
      kit.membrane(mesh, { depth: 2, xray: true, contains: (p) => p.distanceTo(c) < b.radius });
      kit.compartment({ label: 'Endosome lumen', priority: 6, fog: 0x0a122e, fogDensity: 0.03, test: (p) => p.distanceTo(c) < b.radius * 0.97 });
      this.early.push({ center: c, radius: b.radius, tubes });
      if (i === 0) {
        kit.anchor('endosome', c, kit.vantage(c, b.radius + 6.5, b.radius + 3.8));
        kit.anchor('early-endosome', c, kit.vantage(c, b.radius + 5, b.radius + 3.8));
      }
    });

    this.late = layout.lateEndosomes.map((b) => ({ center: v3(b.center), radius: b.radius }));
    const shell = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 28, 20), lateMat, this.late.length);
    const perBody = 12;
    this.ilv = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      membraneMaterial({ color: 0xc8b8ff, rimColor: 0xffffff, baseAlpha: 0.7, opacity: 0.95, amp: 0 }),
      this.late.length * perBody,
    );
    this.late.forEach((b, i) => {
      setInstance(shell, i, b.center, null, b.radius);
      for (let j = 0; j < perBody; j++) {
        this.ilvHome.push(b.center.clone().add(new THREE.Vector3(...rng.unit()).multiplyScalar(b.radius * rng.range(0.1, 0.62))));
      }
      kit.compartment({ label: 'Endosome lumen', priority: 6, fog: 0x120a2e, fogDensity: 0.03, test: (p) => p.distanceTo(b.center) < b.radius * 0.97 });
    });
    shell.computeBoundingSphere();
    this.ilv.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ilv.frustumCulled = false;
    this.group.add(shell, this.ilv);
    kit.pickable(shell, { entity: 'endosome', nearEntity: 'late-endosome', nearDist: 16, xray: true });
    kit.membrane(shell, { depth: 2, xray: true, contains: (p) => this.late.some((b) => p.distanceTo(b.center) < b.radius) });
    kit.pickable(this.ilv, { entity: 'late-endosome' });
    const l0 = this.late[0];
    kit.anchor('late-endosome', l0.center, kit.vantage(l0.center, l0.radius + 4.5, l0.radius + 0.8));

    this.recycle = particles.pool(this.early.length * 6, 0x9fd0ff, 0.13);
    this.incoming = particles.pool(this.early.length * 3, 0xffb3d9, 0.2);
  }

  getProcessProgress(entityId: string): number | null {
    return ['endosome', 'early-endosome', 'late-endosome'].includes(entityId) ? this.progress : null;
  }

  private progress = 0;

  update(ctx: FrameCtx): void {
    const pt = ctx.pt;
    this.progress = (pt * 0.05) % 1;
    this.early.forEach((e, i) => {
      // Receptors recycle out along the tubules; freshly uncoated vesicles arrive and fuse.
      for (let j = 0; j < 6; j++) {
        const end = e.tubes[j % e.tubes.length];
        const u = (((pt * 0.18 + j * 0.31 + i) % 1) + 1) % 1;
        this.recycle.setV(i * 6 + j, _p.lerpVectors(e.center, end, 0.3 + u * 0.9));
      }
      for (let j = 0; j < 3; j++) {
        const u = (((pt * 0.1 + j / 3 + i * 0.4) % 1) + 1) % 1;
        const from = _a.copy(e.center).normalize().multiplyScalar(e.center.length() + 7).add(_b.set(Math.sin(j * 2.1 + i) * 2.5, Math.cos(j * 1.7) * 2.5, Math.sin(j) * 2.5));
        this.incoming.setV(i * 3 + j, _p.lerpVectors(from, e.center, u));
        this.incoming.size(i * 3 + j, 0.24 * (1 - u * 0.6));
      }
    });
    // Intraluminal vesicles bud inward from the limiting membrane and collect inside.
    const per = this.ilvHome.length / this.late.length;
    this.ilvHome.forEach((home, k) => {
      const b = this.late[Math.floor(k / per)];
      const u = (((pt * 0.04 + k * 0.173) % 1) + 1) % 1;
      const fromWall = _a.copy(home).sub(b.center).normalize().multiplyScalar(b.radius * 0.95).add(b.center);
      const budding = Math.min(1, u * 5);
      _p.lerpVectors(fromWall, home, budding * budding * (3 - 2 * budding));
      _p.x += Math.sin(pt * 0.4 + k) * 0.05;
      _p.y += Math.cos(pt * 0.33 + k * 1.3) * 0.05;
      _s.setScalar(0.4 + 0.6 * budding);
      _m.compose(_p, _q, _s);
      this.ilv.setMatrixAt(k, _m);
    });
    this.ilv.instanceMatrix.needsUpdate = true;
  }
}

const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
