import * as THREE from 'three';
import { membraneMaterial, solid, PALETTE } from '../fx/materials';
import { blob, setInstance, v3, randomQuat, cyclePhase } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Peroxisomes: single-membrane oxidative organelles. They shorten very-long-chain fatty
// acids, producing hydrogen peroxide, which catalase immediately converts to water and
// oxygen. Human peroxisomes have a uniform granular matrix (no crystalline core).

const CHAIN = 6;

export class Peroxisomes implements Organelle {
  readonly id = 'peroxisome';
  readonly group = new THREE.Group();
  private readonly catalase: NearSites;
  private readonly oxidase: NearSites;
  private readonly h2o2: ParticlePool;
  private readonly o2: ParticlePool;
  private readonly chain: ParticlePool;
  private readonly acetyl: ParticlePool;
  private catProgress: number | null = null;
  private oxProgress: number | null = null;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const balls = layout.peroxisomes.map((b) => ({ center: v3(b.center), radius: b.radius }));
    const n = balls.length;
    const shell = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 28, 20),
      membraneMaterial({ color: PALETTE.peroxisome, rimColor: 0xb8ffba, baseAlpha: 0.22, opacity: 0.9, amp: 0.03, freq: 1.6, glow: 0.3 }),
      n,
    );
    // Fine granular matrix: a soft haze rather than a crystal.
    const matrix = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 2),
      solid(0x2f7a3a, { transparent: true, opacity: 0.28, emissiveIntensity: 0.5, roughness: 1 }),
      n,
    );
    matrix.renderOrder = 6;
    // Catalase: a tetramer, one of the fastest enzymes known.
    const catGeo = blob(0.13, 1, 0.35, 2, [1.1, 0.9, 1]);
    const cat = new THREE.InstancedMesh(catGeo, solid(0xc8ff7a, { emissiveIntensity: 0.55 }), n * 8);
    const ox = new THREE.InstancedMesh(blob(0.12, 1, 0.3, 7, [1.4, 0.8, 0.9]), solid(0x5fe0c8, { emissiveIntensity: 0.55 }), n * 6);
    const catSites: Site[] = [];
    const oxSites: Site[] = [];
    balls.forEach((b, i) => {
      setInstance(shell, i, b.center, null, b.radius);
      setInstance(matrix, i, b.center, null, b.radius * 0.88);
      for (let j = 0; j < 8; j++) {
        const d = new THREE.Vector3(...rng.unit());
        const pos = b.center.clone().addScaledVector(d, b.radius * rng.range(0.2, 0.7));
        setInstance(cat, i * 8 + j, pos, randomQuat(() => rng.next()), 1);
        catSites.push({ pos, normal: d, phase: rng.range(0, 10) });
      }
      for (let j = 0; j < 6; j++) {
        const d = new THREE.Vector3(...rng.unit());
        const pos = b.center.clone().addScaledVector(d, b.radius * rng.range(0.25, 0.7));
        setInstance(ox, i * 6 + j, pos, randomQuat(() => rng.next()), 1);
        oxSites.push({ pos, normal: d, phase: rng.range(0, 10) });
      }
      kit.compartment({ label: 'Peroxisomal matrix', priority: 6, fog: 0x08200d, fogDensity: 0.03, test: (p) => p.distanceTo(b.center) < b.radius * 0.97 });
    });
    for (const m of [shell, matrix, cat, ox]) {
      m.computeBoundingSphere();
      this.group.add(m);
    }
    kit.pickable(shell, { entity: 'peroxisome', xray: true });
    kit.membrane(shell, { depth: 2, xray: true, contains: (p) => balls.some((b) => p.distanceTo(b.center) < b.radius) });
    kit.pickable(cat, { entity: 'catalase' });
    kit.pickable(ox, { entity: 'acyl-coa-oxidase' });

    this.catalase = new NearSites(catSites, 5, 10);
    this.oxidase = new NearSites(oxSites, 3, 10);
    this.h2o2 = particles.pool(5 * 2, PALETTE.h2o2, 0.13);
    this.o2 = particles.pool(5, PALETTE.o2, 0.15);
    this.chain = particles.pool(3 * CHAIN, 0xfff2b0, 0.1);
    this.acetyl = particles.pool(3, 0xffb86b, 0.13);

    const b0 = balls[0];
    const inward = b0.center.clone().normalize().negate();
    kit.anchor('peroxisome', b0.center, kit.vantage(b0.center, b0.radius + 4.5, b0.radius + 0.8));
    kit.anchor('catalase', catSites[0].pos, catSites[0].pos.clone().addScaledVector(inward, 1.1));
    kit.anchor('acyl-coa-oxidase', oxSites[0].pos, oxSites[0].pos.clone().addScaledVector(inward, 1.1));
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'catalase') return this.catProgress;
    if (entityId === 'acyl-coa-oxidase' || entityId === 'peroxisome') return this.oxProgress;
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const pt = ctx.pt;
    // Catalase: 2 H2O2 -> 2 H2O + O2.
    this.h2o2.hideAll();
    this.o2.hideAll();
    this.catProgress = null;
    this.catalase.update(cam, ctx.dt).forEach((s, i) => {
      const [step, p] = cyclePhase(pt * 1.2 + s.phase, [1, 0.4, 1]);
      if (i === 0) this.catProgress = (step + p) / 3;
      if (step === 0) {
        for (let j = 0; j < 2; j++) {
          const a = s.phase + j * Math.PI;
          _d.set(Math.cos(a), Math.sin(a * 1.3), Math.sin(a)).normalize();
          this.h2o2.setV(i * 2 + j, _p.copy(s.pos).addScaledVector(_d, (1 - p) * 0.9 + 0.1));
        }
      } else if (step === 2) {
        this.o2.setV(i, _p.copy(s.pos).addScaledVector(s.normal, 0.15 + p * 1.0));
      }
    });
    // Beta-oxidation: each turn removes a two-carbon acetyl-CoA and makes one H2O2.
    this.chain.hideAll();
    this.acetyl.hideAll();
    this.oxProgress = null;
    this.oxidase.update(cam, ctx.dt).forEach((s, i) => {
      const t = pt * 0.5 + s.phase;
      const turn = Math.floor(t) % CHAIN;
      const p = t % 1;
      if (i === 0) this.oxProgress = (turn + p) / CHAIN;
      const left = CHAIN - turn;
      for (let j = 0; j < left; j++) {
        this.chain.setV(i * CHAIN + j, _p.copy(s.pos).addScaledVector(s.normal, 0.16 + j * 0.085).add(_d.set(Math.sin(j * 1.9) * 0.02, Math.cos(j * 1.9) * 0.02, 0)));
      }
      this.acetyl.setV(i, _p.copy(s.pos).addScaledVector(s.normal, -0.15 - p * 0.8));
    });
  }
}

const _p = new THREE.Vector3();
const _d = new THREE.Vector3();
