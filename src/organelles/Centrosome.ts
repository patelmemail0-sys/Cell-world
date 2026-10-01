import * as THREE from 'three';
import { solid } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, v3 } from '../fx/geom';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Centrosome: a pair of orthogonal centrioles (nine microtubule triplets each) embedded in
// pericentriolar material, whose gamma-tubulin ring complexes nucleate microtubules.

export class Centrosome implements Organelle {
  readonly id = 'centrosome';
  readonly group = new THREE.Group();
  private readonly dimers: ParticlePool;
  private readonly rings: THREE.Vector3[] = [];
  private readonly center: THREE.Vector3;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    this.center = v3(layout.centrosome.center);
    this.group.position.copy(this.center);

    const mat = solid(0xa8f5d6, { emissiveIntensity: 0.35, roughness: 0.5 });
    const mother = new THREE.Mesh(centrioleGeo(true), mat);
    mother.position.set(0, 0.2, 0);
    const daughter = new THREE.Mesh(centrioleGeo(false), mat);
    daughter.position.set(2.1, -1.6, 0);
    daughter.rotation.z = Math.PI / 2;
    this.group.add(mother, daughter);
    kit.pickable(mother, { entity: 'centriole' });
    kit.pickable(daughter, { entity: 'centriole' });

    // Pericentriolar material: a dense protein matrix with no membrane around it.
    const pcm = new THREE.Mesh(
      blob(3.6, 4, 0.3, 7),
      solid(0x6fd9b4, { transparent: true, opacity: 0.16, emissiveIntensity: 0.5, roughness: 1 }),
    );
    pcm.renderOrder = 7;
    this.group.add(pcm);
    kit.pickable(pcm, { entity: 'centrosome', nearEntity: 'pericentriolar-material', nearDist: 9 });

    // Gamma-tubulin ring complexes: 13-fold lock-washer templates for new microtubules.
    const ringGeo = merge([
      new THREE.TorusGeometry(0.13, 0.035, 5, 13).rotateX(Math.PI / 2),
      place(new THREE.ConeGeometry(0.13, 0.16, 8), [0, -0.1, 0], new THREE.Euler(Math.PI, 0, 0)),
    ]);
    const turc = new THREE.InstancedMesh(ringGeo, solid(0xffe27a, { emissiveIntensity: 0.6 }), 64);
    for (let i = 0; i < 64; i++) {
      const d = new THREE.Vector3(...rng.unit());
      const p = d.clone().multiplyScalar(rng.range(2.2, 3.3));
      setInstance(turc, i, p, quatFromY(d), 1);
      this.rings.push(p.clone().add(this.center));
    }
    turc.computeBoundingSphere();
    this.group.add(turc);
    kit.pickable(turc, { entity: 'gamma-turc' });

    this.dimers = particles.pool(40, 0xbfffe2, 0.11);

    kit.anchor('centrosome', this.center, kit.vantage(this.center, 12, 4.5, new THREE.Vector3(7.5, 3, 6)));
    kit.anchor('centriole', this.center.clone().add(new THREE.Vector3(0, 0.2, 0)), this.center.clone().add(new THREE.Vector3(3.4, 2.2, 3.4)));
    kit.anchor('pericentriolar-material', this.center, this.center.clone().add(new THREE.Vector3(5, -1.5, 4.5)));
    kit.anchor('gamma-turc', this.rings[0], this.rings[0].clone().add(this.rings[0].clone().sub(this.center).normalize().multiplyScalar(1.6)));
    kit.solid(this.center.clone().add(new THREE.Vector3(0, 0.2, 0)), 1.3);

  }

  getProcessProgress(entityId: string): number | null {
    return entityId === 'centrosome' || entityId === 'gamma-turc' ? this.progress : null;
  }

  private progress = 0;

  update(ctx: FrameCtx): void {
    // Tubulin dimers converge on gamma-TuRCs and add onto the growing plus end.
    const n = this.dimers.count;
    this.progress = (ctx.pt * 0.12) % 1;
    for (let i = 0; i < n; i++) {
      const ring = this.rings[i % this.rings.length];
      const out = _a.copy(ring).sub(this.center).normalize();
      const u = (((ctx.pt * 0.25 + i * 0.37) % 1) + 1) % 1;
      const a = i * 2.4;
      const spread = (1 - u) * 1.4;
      _p.copy(ring).addScaledVector(out, 0.3 + (1 - u) * 2.2);
      _p.x += Math.cos(a) * spread;
      _p.y += Math.sin(a * 1.3) * spread;
      _p.z += Math.sin(a) * spread;
      this.dimers.setV(i, _p);
    }
  }
}

const _p = new THREE.Vector3();
const _a = new THREE.Vector3();

function centrioleGeo(mother: boolean): THREE.BufferGeometry {
  // Barrel of nine microtubule triplets, each tilted like a pinwheel blade; +Y is distal.
  const parts: THREE.BufferGeometry[] = [];
  const R = 0.95;
  const L = 4.4;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    for (let j = 0; j < 3; j++) {
      const tilt = a + 0.75;
      const x = Math.cos(a) * R + Math.cos(tilt) * (j - 1) * 0.24;
      const z = Math.sin(a) * R + Math.sin(tilt) * (j - 1) * 0.24;
      parts.push(place(new THREE.CylinderGeometry(0.125, 0.125, L, 7, 1, true), [x, 0, z]));
    }
    // Cartwheel spokes at the proximal end set the nine-fold symmetry.
    parts.push(
      place(new THREE.CylinderGeometry(0.03, 0.03, R, 4), [Math.cos(a) * R * 0.5, -L / 2 + 0.5, Math.sin(a) * R * 0.5], new THREE.Euler(0, -a, Math.PI / 2)),
    );
    if (mother) {
      // Distal appendages mark the older, "mother" centriole.
      parts.push(
        place(new THREE.ConeGeometry(0.14, 0.7, 5), [Math.cos(a) * (R + 0.5), L / 2 - 0.35, Math.sin(a) * (R + 0.5)], new THREE.Euler(0, -a, -Math.PI / 2.4)),
      );
    }
  }
  parts.push(place(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), [0, -L / 2 + 0.5, 0]));
  return merge(parts);
}
