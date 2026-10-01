import * as THREE from 'three';
import type { MembraneMaterial } from '../fx/materials';
import { fibonacciSphere } from '../fx/geom';

// Registries every organelle writes into while it builds: what can be scanned, which
// membranes exist, where anchors are, which compartment a point is in, and what is LOD-gated.

export interface PickTag {
  /** Entity shown when this object is scanned from far away. */
  entity: string | ((instanceId: number) => string | null);
  /** Optional more specific entity when the player is within nearDist. */
  nearEntity?: string;
  nearDist?: number;
  /** Membranes that the cutaway mode fades; skipped by the picker while x-ray is on. */
  xray?: boolean;
  /**
   * For nearly invisible skins: if something else is hit within this distance behind the
   * skin, the scanner reports that instead.
   */
  passThrough?: number;
}

export interface Compartment {
  label: string;
  /** Higher priority wins when compartments overlap (innermost first). */
  priority: number;
  fog: number;
  fogDensity: number;
  test: (p: THREE.Vector3) => boolean;
}

export interface Anchor {
  /** Where the thing is. */
  target: () => THREE.Vector3;
  /** Where a camera should sit to look at it. */
  view: () => THREE.Vector3;
}

interface MembraneEntry {
  mesh: THREE.Object3D;
  material: MembraneMaterial;
  depth: number;
  xray: boolean;
  contains?: (p: THREE.Vector3) => boolean;
}

interface LodEntry {
  obj: THREE.Object3D;
  center: () => THREE.Vector3;
  radius: number;
}

export const CYTOSOL: Compartment = {
  label: 'Cytosol',
  priority: 0,
  fog: 0x041620,
  fogDensity: 0.019,
  test: () => true,
};

export class Kit {
  readonly pickables: THREE.Object3D[] = [];
  readonly membranes: MembraneEntry[] = [];
  readonly anchors = new Map<string, Anchor>();
  readonly compartments: Compartment[] = [CYTOSOL];
  readonly solids: { center: THREE.Vector3; radius: number }[] = [];
  private readonly lods: LodEntry[] = [];
  private xrayOn = false;
  /** Cell semi-axes, so chosen viewpoints stay inside the plasma membrane. */
  readonly bounds = new THREE.Vector3(70, 60, 64);
  private xrayLevel = 0;

  pickable(obj: THREE.Object3D, tag: PickTag): void {
    obj.userData.pick = tag;
    this.pickables.push(obj);
  }

  membrane(
    mesh: THREE.Mesh,
    opts: { depth: number; xray: boolean; contains?: (p: THREE.Vector3) => boolean },
  ): void {
    const material = mesh.material as MembraneMaterial;
    this.membranes.push({ mesh, material, depth: opts.depth, xray: opts.xray, contains: opts.contains });
    mesh.renderOrder = 10 + opts.depth;
  }

  /**
   * Register a named anchor. The first registration of a key wins, so the first instance an
   * organelle builds becomes the designated representative for "Travel there".
   */
  anchor(key: string, target: THREE.Vector3 | (() => THREE.Vector3), view?: THREE.Vector3 | (() => THREE.Vector3)): void {
    if (this.anchors.has(key)) return;
    const t = typeof target === 'function' ? target : () => target;
    let v: () => THREE.Vector3;
    if (view === undefined) {
      // Default: stand a few units toward the cell centre from the target.
      v = () => {
        const p = t();
        const dir = p.clone().multiplyScalar(-1).normalize();
        return p.clone().addScaledVector(dir, 6);
      };
    } else {
      v = typeof view === 'function' ? view : () => view;
    }
    this.anchors.set(key, { target: t, view: v });
  }

  /**
   * A place to stand and look at `target` from `distance` away: open cytosol, inside the cell,
   * with a clear line of sight down to `inner` (roughly the target's own radius). Resolved on
   * first use, once every organelle has registered its compartment.
   */
  vantage(target: THREE.Vector3, distance: number, inner: number, prefer?: THREE.Vector3): () => THREE.Vector3 {
    let cached: THREE.Vector3 | null = null;
    return () => {
      if (cached) return cached;
      const pref = (prefer ?? target.clone().multiplyScalar(-1)).clone().normalize();
      const dirs = [pref, ...fibonacciSphere(80).sort((a, b) => b.dot(pref) - a.dot(pref))];
      const p = new THREE.Vector3();
      const open = (q: THREE.Vector3) =>
        Math.hypot(q.x / this.bounds.x, q.y / this.bounds.y, q.z / this.bounds.z) < 0.93 &&
        this.compartmentAt(q) === CYTOSOL &&
        this.solids.every((s) => s.center.distanceTo(q) > s.radius + 0.4);
      for (const d of dirs) {
        let clear = true;
        for (let k = 0; k <= 4 && clear; k++) {
          const r = distance - ((distance - inner) * k) / 4;
          clear = open(p.copy(target).addScaledVector(d, r));
        }
        if (clear) return (cached = target.clone().addScaledVector(d, distance));
      }
      return (cached = target.clone().addScaledVector(pref, distance));
    };
  }

  compartment(c: Compartment): void {
    this.compartments.push(c);
    this.compartments.sort((a, b) => b.priority - a.priority);
  }

  solid(center: THREE.Vector3, radius: number): void {
    this.solids.push({ center, radius });
  }

  lod(obj: THREE.Object3D, center: THREE.Vector3 | (() => THREE.Vector3), radius: number): void {
    const c = center instanceof THREE.Vector3 ? () => center : center;
    this.lods.push({ obj, center: c, radius });
    obj.visible = false;
  }

  compartmentAt(p: THREE.Vector3): Compartment {
    for (const c of this.compartments) if (c.test(p)) return c;
    return CYTOSOL;
  }

  get xray(): boolean {
    return this.xrayOn;
  }

  setXray(on: boolean): void {
    this.xrayOn = on;
  }

  membraneOpacityFactor(): number {
    return 1 - 0.9 * this.xrayLevel;
  }

  /** Per frame: LOD visibility, x-ray fade, and transparent sort order for nested membranes. */
  update(camPos: THREE.Vector3, dt: number): void {
    for (const l of this.lods) {
      const r = l.radius;
      l.obj.visible = l.center().distanceToSquared(camPos) < r * r;
    }
    const target = this.xrayOn ? 1 : 0;
    this.xrayLevel += (target - this.xrayLevel) * Math.min(1, dt * 6);
    if (Math.abs(target - this.xrayLevel) < 0.002) this.xrayLevel = target;
    for (const m of this.membranes) {
      m.material.userData.xray.value = m.xray ? this.xrayLevel : 0;
      // Membranes the camera is inside draw first (outermost first), then everything else.
      const inside = m.contains ? m.contains(camPos) : false;
      m.mesh.renderOrder = inside ? m.depth : 10 + m.depth;
    }
  }
}
