import * as THREE from 'three';
import { membraneMaterial, solid, PALETTE } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, v3, fibonacciSphere, perpendicular, randomQuat } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Ball, Layout } from '../world/layout';

// Lysosomes: acidic digestive compartments (pH about 4.5-5). V-ATPase pumps keep them acid,
// about 60 kinds of acid hydrolases break down cargo, and heavily glycosylated LAMP proteins
// protect the membrane from its own contents. In beta cells they also dispose of surplus
// insulin granules (crinophagy).

export class Lysosomes implements Organelle {
  readonly id = 'lysosome';
  readonly group = new THREE.Group();
  private readonly pumps: NearSites;
  private readonly protons: ParticlePool;
  private readonly monomers: ParticlePool;
  private readonly balls: { center: THREE.Vector3; radius: number }[];
  private readonly debris: THREE.InstancedMesh;
  private progress: number | null = null;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const balls: Ball[] = layout.lysosomes;
    this.balls = balls.map((b) => ({ center: v3(b.center), radius: b.radius }));
    const n = balls.length;

    const shell = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 32, 22),
      membraneMaterial({ color: PALETTE.lysosome, rimColor: 0xff9ad2, baseAlpha: 0.24, opacity: 0.9, amp: 0.04, freq: 1.4, glow: 0.3 }),
      n,
    );
    // Dark, lumpy material being digested; golden lumps are insulin granule cores.
    this.debris = new THREE.InstancedMesh(blob(1, 2, 0.5, 3), solid(0x5a1840, { emissiveIntensity: 0.25, roughness: 0.9 }), n);
    const cores = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), solid(PALETTE.granuleCore, { emissiveIntensity: 0.5, flat: true }), n * 2);
    const hydrolases = new THREE.InstancedMesh(blob(0.11, 1, 0.3, 5), solid(0xff7ac0, { emissiveIntensity: 0.5 }), n * 9);
    const lamp = new THREE.InstancedMesh(lampGeo(), solid(0xffd0ec, { emissiveIntensity: 0.3 }), n * 26);
    const vatpase = new THREE.InstancedMesh(vAtpaseGeo(), solid(0xb58cff, { emissiveIntensity: 0.45 }), n * 9);
    const pumpSites: Site[] = [];
    const lampDirs = fibonacciSphere(26);
    const pumpDirs = fibonacciSphere(9);

    this.balls.forEach((b, i) => {
      setInstance(shell, i, b.center, null, b.radius);
      setInstance(this.debris, i, b.center.clone().add(new THREE.Vector3(...rng.unit()).multiplyScalar(b.radius * 0.2)), randomQuat(() => rng.next()), b.radius * 0.45);
      for (let j = 0; j < 2; j++) {
        const show = i % 3 === 0;
        setInstance(cores, i * 2 + j, b.center.clone().add(new THREE.Vector3(...rng.unit()).multiplyScalar(b.radius * 0.5)), randomQuat(() => rng.next()), show ? b.radius * 0.2 : 0.0001);
      }
      for (let j = 0; j < 9; j++) {
        setInstance(hydrolases, i * 9 + j, b.center.clone().add(new THREE.Vector3(...rng.unit()).multiplyScalar(b.radius * rng.range(0.45, 0.82))), randomQuat(() => rng.next()), 1);
      }
      lampDirs.forEach((d, j) => {
        setInstance(lamp, i * 26 + j, b.center.clone().addScaledVector(d, b.radius), quatFromY(d.clone().negate()), 1);
      });
      const spin = randomQuat(() => rng.next());
      pumpDirs.forEach((d0, j) => {
        const d = d0.clone().applyQuaternion(spin);
        const pos = b.center.clone().addScaledVector(d, b.radius);
        setInstance(vatpase, i * 9 + j, pos, quatFromY(d), 1);
        pumpSites.push({ pos, normal: d, phase: rng.range(0, 10) });
      });
      kit.compartment({ label: 'Lysosome lumen', priority: 6, fog: 0x220618, fogDensity: 0.03, test: (p) => p.distanceTo(b.center) < b.radius * 0.97 });
    });
    for (const m of [shell, this.debris, cores, hydrolases, lamp, vatpase]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      this.group.add(m);
    }
    this.debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    kit.pickable(shell, { entity: 'lysosome', xray: true });
    kit.membrane(shell, { depth: 2, xray: true, contains: (p) => this.balls.some((b) => p.distanceTo(b.center) < b.radius) });
    kit.pickable(this.debris, { entity: 'lysosome' });
    kit.pickable(cores, { entity: 'insulin-hexamer' });
    kit.pickable(hydrolases, { entity: 'acid-hydrolase' });
    kit.pickable(lamp, { entity: 'lamp' });
    kit.pickable(vatpase, { entity: 'v-atpase' });
    kit.lod(lamp, () => nearestCenter(this.balls, _cam), 30);

    this.pumps = new NearSites(pumpSites, 5, 12);
    this.protons = particles.pool(5 * 3, PALETTE.proton, 0.11);
    this.monomers = particles.pool(36, 0xffc9e6, 0.1);

    const b0 = this.balls[0];
    const out = b0.center.clone().normalize();
    kit.anchor('lysosome', b0.center, kit.vantage(b0.center, b0.radius + 5, b0.radius + 0.8));
    kit.anchor('v-atpase', pumpSites[0].pos, pumpSites[0].pos.clone().addScaledVector(pumpSites[0].normal, 1.8));
    kit.anchor('acid-hydrolase', b0.center, b0.center.clone().addScaledVector(out, -b0.radius * 0.55));
    kit.anchor('lamp', b0.center.clone().addScaledVector(out, b0.radius), b0.center.clone().addScaledVector(out, b0.radius * 0.35));
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'v-atpase' || entityId === 'lysosome') return this.progress;
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    _cam.copy(cam);
    const pt = ctx.pt;
    // V-ATPase: ATP-driven rotary pump moving H+ from the cytosol into the lumen.
    this.protons.hideAll();
    this.progress = null;
    this.pumps.update(cam, ctx.dt).forEach((s, i) => {
      if (i === 0) this.progress = (pt * 0.5 + s.phase) % 1;
      perpendicular(s.normal, _a);
      for (let j = 0; j < 3; j++) {
        const u = (((pt * 0.5 + s.phase + j / 3) % 1) + 1) % 1;
        this.protons.setV(i * 3 + j, _p.copy(s.pos).addScaledVector(s.normal, THREE.MathUtils.lerp(1.3, -0.7, u)).addScaledVector(_a, 0.08));
      }
    });
    // Digestion products (amino acids, sugars) leave through transporters.
    const n = this.monomers.count;
    for (let i = 0; i < n; i++) {
      const b = this.balls[i % this.balls.length];
      const u = (((pt * 0.12 + i * 0.37) % 1) + 1) % 1;
      const a = i * 2.4;
      _a.set(Math.cos(a) * Math.sin(a * 0.7), Math.cos(a * 0.7), Math.sin(a) * Math.sin(a * 0.7)).normalize();
      this.monomers.setV(i, _p.copy(b.center).addScaledVector(_a, b.radius * (0.4 + u * 1.5)));
      this.monomers.size(i, 0.1 * (1 - u * 0.7));
    }
    // The cargo lump slowly shrinks as it is digested, then a new load arrives.
    this.balls.forEach((b, i) => {
      const u = (((pt * 0.02 + i * 0.21) % 1) + 1) % 1;
      _s.setScalar(b.radius * (0.2 + 0.32 * (1 - u)));
      _q.setFromAxisAngle(_y, pt * 0.05 + i);
      _m.compose(b.center, _q, _s);
      this.debris.setMatrixAt(i, _m);
    });
    this.debris.instanceMatrix.needsUpdate = true;
  }
}

const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _y = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _cam = new THREE.Vector3();
const _near = new THREE.Vector3();

export function nearestCenter(balls: { center: THREE.Vector3 }[], cam: THREE.Vector3): THREE.Vector3 {
  let best = Infinity;
  for (const b of balls) {
    const d = b.center.distanceToSquared(cam);
    if (d < best) {
      best = d;
      _near.copy(b.center);
    }
  }
  return _near;
}

function lampGeo(): THREE.BufferGeometry {
  // LAMP: a short stalk carrying a dense tuft of sugar chains into the lumen (+Y).
  return merge([
    place(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4), [0, 0.1, 0]),
    place(new THREE.IcosahedronGeometry(0.06, 0), [0, 0.22, 0]),
    place(new THREE.IcosahedronGeometry(0.045, 0), [0.06, 0.16, 0.03]),
    place(new THREE.IcosahedronGeometry(0.045, 0), [-0.05, 0.17, -0.04]),
  ]);
}

export function vAtpaseGeo(): THREE.BufferGeometry {
  // Rotary proton pump: V0 ring in the membrane, V1 head in the cytosol (+Y).
  const parts: THREE.BufferGeometry[] = [place(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 10), [0, 0, 0])];
  parts.push(place(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), [0, 0.18, 0]));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(place(blob(0.075, 1, 0.2, i), [Math.cos(a) * 0.08, 0.38, Math.sin(a) * 0.08]));
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    parts.push(place(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 4), [Math.cos(a) * 0.17, 0.22, Math.sin(a) * 0.17]));
  }
  return merge(parts);
}
