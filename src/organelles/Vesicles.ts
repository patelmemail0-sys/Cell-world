import * as THREE from 'three';
import { solid } from '../fx/materials';
import { setInstance, v3, smoothstep } from '../fx/geom';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';
import type { RoughER } from './RoughER';
import type { Golgi } from './Golgi';

// Transport vesicles: coated buds that carry cargo between compartments. COPII moves new
// proteins from ER exit sites to the Golgi, COPI returns escaped ER proteins, and
// clathrin-coated vesicles carry lysosomal enzymes from the trans-Golgi network to endosomes.
// Each sheds its coat after budding and fuses with its target through SNARE proteins.

type Kind = 'copii-vesicle' | 'copi-vesicle' | 'clathrin-vesicle';

interface Route {
  kind: Kind;
  from: THREE.Vector3;
  mid: THREE.Vector3;
  to: THREE.Vector3;
  radius: number;
  phase: number;
  speed: number;
}

const COAT: Record<Kind, number> = { 'copii-vesicle': 0x7dffd0, 'copi-vesicle': 0xff9f6b, 'clathrin-vesicle': 0xffc24a };
const BODY: Record<Kind, number> = { 'copii-vesicle': 0x4fc6d9, 'copi-vesicle': 0xf0a640, 'clathrin-vesicle': 0xe9824a };

export class Vesicles implements Organelle {
  readonly id = 'vesicle';
  readonly group = new THREE.Group();
  private readonly routes: Route[] = [];
  private readonly body: THREE.InstancedMesh;
  private readonly coat: THREE.InstancedMesh;
  private readonly tracked = new Map<Kind, THREE.Vector3>();
  private progress = 0;
  /** True once a vesicle has shed its coat; from then on it is just "a transport vesicle". */
  private readonly uncoated: boolean[] = [];

  constructor(layout: Layout, er: RoughER, golgi: Golgi, ctx: BuildContext) {
    const { kit, rng } = ctx;
    const jitter = (s: number) => new THREE.Vector3(...rng.unit()).multiplyScalar(s);
    const add = (kind: Kind, from: THREE.Vector3, to: THREE.Vector3, radius: number, bend: number) => {
      const mid = from.clone().lerp(to, 0.5).add(jitter(bend));
      this.routes.push({ kind, from, mid, to, radius, phase: rng.next(), speed: rng.range(0.035, 0.05) });
    };
    const exits = er.exitSites;
    for (let i = 0; i < 18; i++) {
      const e = exits[i % exits.length];
      const a = rng.range(0, Math.PI * 2);
      add('copii-vesicle', e.pos.clone().add(jitter(0.5)), golgi.cisFace(Math.cos(a) * rng.range(0, 4.5), Math.sin(a) * rng.range(0, 4.5)), 0.35, 2.5);
    }
    for (let i = 0; i < 10; i++) {
      const rim = golgi.rim(i % 2, rng.range(0, Math.PI * 2));
      const e = exits[i % exits.length];
      add('copi-vesicle', rim.pos, e.pos.clone().add(jitter(0.8)), 0.3, 3);
    }
    // Intra-Golgi retrograde hops between neighbouring rims.
    for (let i = 0; i < 8; i++) {
      const phi = rng.range(0, Math.PI * 2);
      const k = 1 + (i % 4);
      add('copi-vesicle', golgi.rim(k, phi).pos, golgi.rim(k - 1, phi + 0.3).pos, 0.3, 0.8);
    }
    const late = layout.lateEndosomes.map((b) => v3(b.center));
    for (let i = 0; i < 7; i++) {
      const a = rng.range(0, Math.PI * 2);
      add('clathrin-vesicle', golgi.transFace(Math.cos(a) * 4, Math.sin(a) * 4), late[i % late.length].clone().add(jitter(2.2)), 0.45, 4);
    }

    const n = this.routes.length;
    this.body = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), solid(0xffffff, { emissiveIntensity: 0.0, transparent: true, opacity: 0.85 }), n);
    this.coat = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1.14, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, toneMapped: false }),
      n,
    );
    const c = new THREE.Color();
    this.routes.forEach((r, i) => {
      this.body.setColorAt(i, c.set(BODY[r.kind]));
      this.coat.setColorAt(i, c.set(COAT[r.kind]).multiplyScalar(1.5));
    });
    for (const m of [this.body, this.coat]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      this.group.add(m);
    }
    const entity = (id: number) => (this.routes[id] ? (this.uncoated[id] ? 'vesicle' : this.routes[id].kind) : null);
    kit.pickable(this.body, { entity });
    kit.pickable(this.coat, { entity });

    // ER exit sites: clusters of COPII-coated buds on the rim of the rough ER.
    const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 12, 8), solid(BODY['copii-vesicle'], { emissiveIntensity: 0.3 }), exits.length * 4);
    const budCoats = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.4, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(COAT['copii-vesicle']).multiplyScalar(1.4), wireframe: true, toneMapped: false }),
      exits.length * 4,
    );
    exits.forEach((e, i) => {
      for (let j = 0; j < 4; j++) {
        const p = e.pos.clone().add(jitter(0.55)).addScaledVector(e.normal, 0.15 + j * 0.08);
        setInstance(buds, i * 4 + j, p, null, 0.7 + j * 0.1);
        setInstance(budCoats, i * 4 + j, p, null, 0.7 + j * 0.1);
      }
    });
    buds.computeBoundingSphere();
    budCoats.computeBoundingSphere();
    this.group.add(buds, budCoats);
    kit.pickable(buds, { entity: 'er-exit-site' });
    kit.pickable(budCoats, { entity: 'er-exit-site' });

    for (const kind of ['copii-vesicle', 'copi-vesicle', 'clathrin-vesicle'] as const) {
      const p = new THREE.Vector3();
      this.tracked.set(kind, p);
      kit.anchor(kind, () => p, () => p.clone().add(new THREE.Vector3(1.6, 0.9, 1.6)));
    }
    kit.anchor('vesicle', () => this.tracked.get('copii-vesicle')!, () => this.tracked.get('copii-vesicle')!.clone().add(new THREE.Vector3(2.4, 1.2, 2.4)));
    const e0 = exits[0];
    kit.anchor('er-exit-site', e0.pos, e0.pos.clone().addScaledVector(e0.normal, 4).add(new THREE.Vector3(0, 1.5, 0)));
  }

  getProcessProgress(entityId: string): number | null {
    return ['vesicle', 'copii-vesicle', 'copi-vesicle', 'clathrin-vesicle', 'er-exit-site'].includes(entityId) ? this.progress : null;
  }

  update(ctx: FrameCtx): void {
    const seen = new Set<Kind>();
    this.routes.forEach((r, i) => {
      const u = (((ctx.pt * r.speed + r.phase) % 1) + 1) % 1;
      const w = 1 - u;
      _p.set(0, 0, 0).addScaledVector(r.from, w * w).addScaledVector(r.mid, 2 * w * u).addScaledVector(r.to, u * u);
      // Bud out of the donor membrane, travel, then flatten into the target on fusion.
      const bud = smoothstep(0, 0.1, u);
      const fuse = 1 - smoothstep(0.93, 1, u);
      setInstance(this.body, i, _p, null, Math.max(0.0001, r.radius * bud * fuse));
      // The coat does its job at budding, then falls off so the SNAREs are exposed.
      const coatOn = 1 - smoothstep(0.14, 0.28, u);
      this.uncoated[i] = u > 0.28;
      const coatScale = r.radius * bud * (1 + smoothstep(0.14, 0.28, u) * 0.8) * (coatOn > 0.02 ? 1 : 0);
      setInstance(this.coat, i, _p, null, Math.max(0.0001, coatScale));
      if (!seen.has(r.kind)) {
        seen.add(r.kind);
        this.tracked.get(r.kind)!.copy(_p);
        if (r.kind === 'copii-vesicle') this.progress = u;
      }
    });
    this.body.instanceMatrix.needsUpdate = true;
    this.coat.instanceMatrix.needsUpdate = true;
  }
}

const _p = new THREE.Vector3();
