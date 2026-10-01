import * as THREE from 'three';

// Per-instance level of detail for big instanced sets. Everything is drawn from a cheap
// low-detail InstancedMesh; the few instances nearest the player are hidden there and
// redrawn from a high-detail mesh instead.

export class HeroSwap {
  readonly high: THREE.InstancedMesh;
  private readonly base: Float32Array;
  private assigned: number[] = [];
  private acc = 1;

  constructor(
    private readonly low: THREE.InstancedMesh,
    highGeometry: THREE.BufferGeometry,
    material: THREE.Material,
    private readonly maxNear: number,
    private readonly range: number,
  ) {
    this.base = new Float32Array(low.instanceMatrix.array);
    this.high = new THREE.InstancedMesh(highGeometry, material, maxNear);
    this.high.count = 0;
    this.high.frustumCulled = false;
    this.high.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.low.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Hero copies are scanned exactly like the instances they stand in for.
    this.high.userData.pick = low.userData.pick;
  }

  update(cam: THREE.Vector3, dt: number): void {
    this.acc += dt;
    if (this.acc < 0.4) return;
    this.acc = 0;
    const r2 = this.range * this.range;
    const near: { i: number; d: number }[] = [];
    const b = this.base;
    for (let i = 0; i < this.low.count; i++) {
      const dx = b[i * 16 + 12] - cam.x;
      const dy = b[i * 16 + 13] - cam.y;
      const dz = b[i * 16 + 14] - cam.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < r2) near.push({ i, d });
    }
    near.sort((x, y) => x.d - y.d);
    const next = near.slice(0, this.maxNear).map((n) => n.i);
    if (next.length === this.assigned.length && next.every((v, k) => v === this.assigned[k])) return;
    const lowArr = this.low.instanceMatrix.array as Float32Array;
    const highArr = this.high.instanceMatrix.array as Float32Array;
    for (const i of this.assigned) lowArr.set(b.subarray(i * 16, i * 16 + 16), i * 16);
    next.forEach((i, k) => {
      highArr.set(b.subarray(i * 16, i * 16 + 16), k * 16);
      lowArr.fill(0, i * 16, i * 16 + 16);
      lowArr[i * 16 + 13] = -1e5;
      lowArr[i * 16 + 15] = 1;
    });
    this.assigned = next;
    this.high.count = next.length;
    this.low.instanceMatrix.needsUpdate = true;
    this.high.instanceMatrix.needsUpdate = true;
  }
}
