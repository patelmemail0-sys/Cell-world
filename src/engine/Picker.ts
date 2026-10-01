import * as THREE from 'three';
import type { Kit, PickTag } from '../world/kit';

// Crosshair scanner. Hover picks run at 15 Hz; clicks pick immediately. The nearest hit wins,
// x-rayed membranes are skipped, and a membrane hit from close up resolves to its more
// specific entity (e.g. "Outer mitochondrial membrane" instead of "Mitochondrion").

export interface PickResult {
  entity: string;
  distance: number;
  point: THREE.Vector3;
  object: THREE.Object3D;
  instanceId?: number;
}

export class Picker {
  private readonly ray = new THREE.Raycaster();
  private readonly center = new THREE.Vector2(0, 0);
  private acc = 0;
  current: PickResult | null = null;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly kit: Kit,
  ) {
    this.ray.far = 90;
  }

  update(dt: number): PickResult | null {
    this.acc += dt;
    if (this.acc >= 1 / 15) {
      this.acc = 0;
      this.current = this.pick();
    }
    return this.current;
  }

  pick(): PickResult | null {
    this.camera.updateMatrixWorld();
    this.ray.setFromCamera(this.center, this.camera);
    const candidates = this.kit.pickables.filter((o) => o.visible && isVisibleChain(o));
    for (const o of candidates) {
      // Instances that move every frame would otherwise be tested against a stale bounding
      // sphere and silently never be hit.
      const im = o as THREE.InstancedMesh;
      if (im.isInstancedMesh && im.instanceMatrix.usage === THREE.DynamicDrawUsage) im.boundingSphere = EVERYWHERE;
    }
    const hits = this.ray.intersectObjects(candidates, false);
    for (let k = 0; k < hits.length; k++) {
      let h = hits[k];
      let tag = h.object.userData.pick as PickTag | undefined;
      if (!tag) continue;
      if (tag.xray && this.kit.xray) continue;
      if (tag.passThrough) {
        // A see-through skin: prefer whatever sits just behind it.
        for (let j = k + 1; j < hits.length && hits[j].distance <= h.distance + tag.passThrough; j++) {
          const t2 = hits[j].object.userData.pick as PickTag | undefined;
          if (!t2 || hits[j].object === h.object || t2.passThrough || (t2.xray && this.kit.xray)) continue;
          h = hits[j];
          tag = t2;
          break;
        }
      }
      let entity: string | null;
      if (typeof tag.entity === 'function') {
        entity = tag.entity(h.instanceId ?? -1);
      } else {
        entity = tag.entity;
      }
      if (tag.nearEntity && h.distance < (tag.nearDist ?? 4)) entity = tag.nearEntity;
      if (!entity) continue;
      return { entity, distance: h.distance, point: h.point.clone(), object: h.object, instanceId: h.instanceId };
    }
    return null;
  }
}

const EVERYWHERE = new THREE.Sphere(new THREE.Vector3(), Infinity);

function isVisibleChain(o: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = o.parent;
  while (p) {
    if (!p.visible) return false;
    p = p.parent;
  }
  return true;
}
