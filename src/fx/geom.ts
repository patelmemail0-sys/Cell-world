import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { V3 } from '../world/layout';

export const v3 = (t: V3): THREE.Vector3 => new THREE.Vector3(t[0], t[1], t[2]);

const Y = new THREE.Vector3(0, 1, 0);

/** Quaternion that rotates +Y onto dir. */
export function quatFromY(dir: THREE.Vector3, out = new THREE.Quaternion()): THREE.Quaternion {
  return out.setFromUnitVectors(Y, dir.clone().normalize());
}

/** Lumpy protein-like blob: icosphere with low-frequency radial noise. */
export function blob(radius: number, detail = 2, lump = 0.18, seed = 1, stretch?: V3): THREE.BufferGeometry {
  const src = new THREE.IcosahedronGeometry(radius, detail);
  // Drop uvs and normals so every shared corner welds; otherwise seams shade as facets.
  src.deleteAttribute('uv');
  src.deleteAttribute('normal');
  const g = mergeVertices(src);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const s =
      Math.sin(n.x * 3.1 + seed) * Math.cos(n.y * 2.7 + seed * 1.7) +
      Math.sin(n.z * 3.7 + seed * 0.3) * 0.6 +
      Math.cos((n.x + n.y) * 5.3 + seed * 2.1) * 0.25;
    v.multiplyScalar(1 + lump * s * 0.5);
    if (stretch) v.set(v.x * stretch[0], v.y * stretch[1], v.z * stretch[2]);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function merge(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const prepared = geoms.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of prepared) {
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
  }
  const m = mergeGeometries(prepared, false);
  if (!m) throw new Error('mergeGeometries failed');
  return m;
}

/** Merge parts into one geometry, painting each part a flat vertex colour. */
export function mergeColored(parts: [THREE.BufferGeometry, THREE.ColorRepresentation][]): THREE.BufferGeometry {
  const c = new THREE.Color();
  const prepared = parts.map(([g0, color]) => {
    const g = g0.index ? g0.toNonIndexed() : g0;
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    c.set(color);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  });
  const m = mergeGeometries(prepared, false);
  if (!m) throw new Error('mergeGeometries failed');
  return m;
}

/** Translate/rotate/scale a geometry in place and return it (for building merged parts). */
export function place(
  g: THREE.BufferGeometry,
  pos: THREE.Vector3 | V3,
  rot?: THREE.Euler | THREE.Quaternion,
  scale?: number | V3,
): THREE.BufferGeometry {
  const m = new THREE.Matrix4();
  const q = rot instanceof THREE.Euler ? new THREE.Quaternion().setFromEuler(rot) : rot ?? new THREE.Quaternion();
  const s =
    scale === undefined
      ? new THREE.Vector3(1, 1, 1)
      : typeof scale === 'number'
        ? new THREE.Vector3(scale, scale, scale)
        : new THREE.Vector3(scale[0], scale[1], scale[2]);
  const p = pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(pos[0], pos[1], pos[2]);
  m.compose(p, q, s);
  g.applyMatrix4(m);
  return g;
}

/** Cylinder between two points. */
export function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, radial = 6): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(radius, radius, len, radial, 1, false);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return place(g, mid, quatFromY(b.clone().sub(a)));
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

export function setInstance(
  mesh: THREE.InstancedMesh,
  i: number,
  pos: THREE.Vector3,
  quat: THREE.Quaternion | null,
  scale: number | THREE.Vector3 = 1,
): void {
  if (typeof scale === 'number') _s.set(scale, scale, scale);
  else _s.copy(scale);
  _m.compose(pos, quat ?? _q.identity(), _s);
  mesh.setMatrixAt(i, _m);
}

/** Random rotation from an rng-like source. */
export function randomQuat(r: () => number, out = new THREE.Quaternion()): THREE.Quaternion {
  const u1 = r();
  const u2 = r() * Math.PI * 2;
  const u3 = r() * Math.PI * 2;
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  return out.set(a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3));
}

/** Points on a sphere via the Fibonacci lattice. */
export function fibonacciSphere(n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    out.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return out;
}

/** Any unit vector perpendicular to n. */
export function perpendicular(n: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
  const a = Math.abs(n.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  return out.crossVectors(n, a).normalize();
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Fractional position of t within a looping cycle, returning [stepIndex, progress 0..1]. */
export function cyclePhase(t: number, durations: number[]): [number, number] {
  const total = durations.reduce((s, d) => s + d, 0);
  let x = ((t % total) + total) % total;
  for (let i = 0; i < durations.length; i++) {
    if (x < durations[i]) return [i, x / durations[i]];
    x -= durations[i];
  }
  return [durations.length - 1, 1];
}
