import * as THREE from 'three';

// Many processes (pumps, pores, ATP synthases) exist in hundreds of copies. Only the few
// nearest the player get their full particle animation; this picks them, cheaply.

export interface Site {
  pos: THREE.Vector3;
  /** Unit "outward" direction for the site (membrane normal etc). */
  normal: THREE.Vector3;
  /** Stable per-site phase offset so neighbours are not in lockstep. */
  phase: number;
}

export class NearSites<T extends Site = Site> {
  active: T[] = [];
  private acc = 1;
  private readonly scratch: { s: T; d: number }[] = [];

  constructor(
    readonly sites: T[],
    private readonly maxActive: number,
    private readonly range: number,
    /** Optional transform when sites are stored in a parent's local space. */
    private readonly toWorld?: THREE.Matrix4,
  ) {}

  update(camPos: THREE.Vector3, dt: number): T[] {
    this.acc += dt;
    if (this.acc < 0.35) return this.active;
    this.acc = 0;
    const r2 = this.range * this.range;
    this.scratch.length = 0;
    const p = _v;
    for (const s of this.sites) {
      p.copy(s.pos);
      if (this.toWorld) p.applyMatrix4(this.toWorld);
      const d = p.distanceToSquared(camPos);
      if (d < r2) this.scratch.push({ s, d });
    }
    this.scratch.sort((a, b) => a.d - b.d);
    this.active = this.scratch.slice(0, this.maxActive).map((x) => x.s);
    return this.active;
  }
}

const _v = new THREE.Vector3();
