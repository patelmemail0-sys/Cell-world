import * as THREE from 'three';
import { solid, PALETTE } from '../fx/materials';
import { blob, merge, place, setInstance, v3, randomQuat, cyclePhase } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// 26S proteasomes: barrel-shaped protein shredders. A 19S cap recognizes ubiquitin-tagged
// proteins, unfolds them and feeds them into the 20S core, which cuts them into peptides.

const ACTIVE = 4;
const UB = 4;

export class Proteasomes implements Organelle {
  readonly id = 'proteasome';
  readonly group = new THREE.Group();
  private readonly near: NearSites;
  private readonly ub: THREE.InstancedMesh;
  private readonly substrate: ParticlePool;
  private readonly peptides: ParticlePool;
  private progress: number | null = null;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles, quality } = ctx;
    const list = layout.proteasomes.slice(0, quality === 'low' ? 140 : layout.proteasomes.length);
    const n = list.length;
    // 20S core: four stacked heptameric rings (alpha, beta, beta, alpha).
    const coreParts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) coreParts.push(place(new THREE.TorusGeometry(0.09, 0.05, 4, 10).rotateX(Math.PI / 2), [0, (i - 1.5) * 0.085, 0]));
    const capGeo = merge([place(blob(0.12, 1, 0.35, 3, [1, 1.2, 1]), [0.01, 0.3, 0]), place(blob(0.12, 1, 0.35, 8, [1, 1.2, 1]), [-0.01, -0.3, 0])]);
    const core = new THREE.InstancedMesh(merge(coreParts), solid(PALETTE.proteasome, { emissiveIntensity: 0.35 }), n);
    const caps = new THREE.InstancedMesh(capGeo, solid(0x8fa0ff, { emissiveIntensity: 0.35 }), n);
    const sites: Site[] = [];
    list.forEach((p, i) => {
      const pos = v3(p);
      const q = randomQuat(() => rng.next());
      setInstance(core, i, pos, q, 1);
      setInstance(caps, i, pos, q, 1);
      sites.push({ pos, normal: new THREE.Vector3(0, 1, 0).applyQuaternion(q), phase: rng.range(0, 10) });
    });
    core.computeBoundingSphere();
    caps.computeBoundingSphere();
    this.group.add(core, caps);
    kit.pickable(core, { entity: 'proteasome', nearEntity: 'core-20s', nearDist: 4 });
    kit.pickable(caps, { entity: 'proteasome', nearEntity: 'cap-19s', nearDist: 4 });

    this.near = new NearSites(sites, ACTIVE, 12);
    this.ub = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 1), solid(PALETTE.ubiquitin, { emissiveIntensity: 1 }), ACTIVE * UB);
    this.ub.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ub.frustumCulled = false;
    this.group.add(this.ub);
    kit.pickable(this.ub, { entity: 'ubiquitin' });
    this.substrate = particles.pool(ACTIVE, 0xff9ac0, 0.2);
    this.peptides = particles.pool(ACTIVE * 4, 0xffc6dc, 0.07);

    // Proteasomes work in the nucleus too, but the one you travel to is out in the cytosol.
    const s0 = sites.find((s) => kit.compartmentAt(s.pos).label === 'Cytosol') ?? sites[0];
    const side = new THREE.Vector3(1, 0.3, 0.5).normalize();
    const view = kit.vantage(s0.pos, 1.9, 0.8, side);
    for (const id of ['proteasome', 'core-20s', 'cap-19s', 'ubiquitin']) kit.anchor(id, s0.pos, view);
  }

  getProcessProgress(entityId: string): number | null {
    return ['proteasome', 'ubiquitin', 'core-20s', 'cap-19s'].includes(entityId) ? this.progress : null;
  }

  update(ctx: FrameCtx): void {
    const active = this.near.update(ctx.camera.position, ctx.dt);
    this.substrate.hideAll();
    this.peptides.hideAll();
    this.progress = null;
    for (let i = 0; i < ACTIVE * UB; i++) {
      _s.setScalar(0.0001);
      _m.compose(_p.set(0, -1e4, 0), _q, _s);
      this.ub.setMatrixAt(i, _m);
    }
    active.forEach((s, i) => {
      // 0 tagged protein docks, 1 ubiquitin removed and recycled, 2 unfold + thread in, 3 peptides out
      const [step, p] = cyclePhase(ctx.pt * 0.7 + s.phase, [2, 1.3, 1.7, 1.3]);
      if (i === 0) this.progress = (step + p) / 4;
      const e = p * p * (3 - 2 * p);
      const top = 0.48;
      let y = top;
      if (step === 0) y = THREE.MathUtils.lerp(2.6, top, e);
      else if (step === 2) y = THREE.MathUtils.lerp(top, 0, e);
      if (step <= 2) {
        this.substrate.setV(i, _p.copy(s.pos).addScaledVector(s.normal, y));
        this.substrate.size(i, step === 2 ? 0.2 * (1 - e * 0.7) : 0.2);
      }
      _side.set(s.normal.z, s.normal.x, s.normal.y).cross(s.normal).normalize();
      for (let j = 0; j < UB; j++) {
        let off = 0.12 + j * 0.1;
        let lift = y + 0.06;
        if (step === 1) {
          off += e * (0.9 + j * 0.25);
          lift += e * 0.5;
        }
        if (step >= 2) continue;
        _p.copy(s.pos).addScaledVector(s.normal, lift).addScaledVector(_side, off);
        _s.setScalar(1);
        _m.compose(_p, _q, _s);
        this.ub.setMatrixAt(i * UB + j, _m);
      }
      if (step === 3) {
        for (let j = 0; j < 4; j++) {
          const a = j * 1.6 + s.phase;
          _p.copy(s.pos).addScaledVector(s.normal, -0.45 - e * 1.1).addScaledVector(_side, Math.cos(a) * e * 0.5);
          _p.y += Math.sin(a) * e * 0.3;
          this.peptides.setV(i * 4 + j, _p);
        }
      }
    });
    this.ub.instanceMatrix.needsUpdate = true;
  }
}

const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _side = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
