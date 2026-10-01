import * as THREE from 'three';
import { globalUniforms } from './uniforms';

// One GPU point cloud shared by every process (ions, ATP, electrons, mRNA...). Organelles
// reserve contiguous pools and write positions each frame; the whole thing is one draw call.

const VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
varying float vFog;
uniform float uScale;
uniform float uFogDensity;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = -mv.z;
  gl_PointSize = aSize * uScale / max(d, 0.05);
  gl_PointSize = min(gl_PointSize, 46.0);
  vColor = aColor;
  float f = uFogDensity * d;
  vFog = exp(-f * f);
}
`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vFog;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  if (r > 1.0) discard;
  float core = smoothstep(0.45, 0.0, r);
  float halo = smoothstep(1.0, 0.0, r) * 0.45;
  gl_FragColor = vec4(vColor * (core * 1.6 + halo) * vFog, 1.0);
}
`;

export interface ParticlePool {
  readonly count: number;
  set(i: number, x: number, y: number, z: number): void;
  setV(i: number, v: THREE.Vector3): void;
  color(i: number, c: THREE.Color, brightness?: number): void;
  size(i: number, s: number): void;
  hide(i: number): void;
  hideAll(): void;
}

export class ParticleSystem {
  readonly points: THREE.Points;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly siz: Float32Array;
  private used = 0;
  private readonly capacity: number;
  private readonly geom: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.pos = new Float32Array(capacity * 3);
    this.col = new Float32Array(capacity * 3);
    this.siz = new Float32Array(capacity);
    // Park unused particles far outside the cell.
    for (let i = 0; i < capacity; i++) this.pos[i * 3 + 1] = -1e5;
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aSize', new THREE.BufferAttribute(this.siz, 1).setUsage(THREE.DynamicDrawUsage));
    this.geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uScale: { value: 300 },
        uFogDensity: globalUniforms.uFogDensity,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geom, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 50;
  }

  /** Viewport height in pixels drives point size so particles keep a constant world size. */
  setViewportHeight(px: number, fovDeg: number): void {
    this.material.uniforms.uScale.value = px / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  pool(count: number, color: THREE.ColorRepresentation, size: number): ParticlePool {
    const n = Math.max(0, Math.min(count, this.capacity - this.used));
    const start = this.used;
    this.used += n;
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const k = start + i;
      this.col[k * 3] = c.r;
      this.col[k * 3 + 1] = c.g;
      this.col[k * 3 + 2] = c.b;
      this.siz[k] = size;
    }
    const pos = this.pos;
    const col = this.col;
    const siz = this.siz;
    return {
      count: n,
      set(i, x, y, z) {
        const k = (start + i) * 3;
        pos[k] = x;
        pos[k + 1] = y;
        pos[k + 2] = z;
      },
      setV(i, v) {
        const k = (start + i) * 3;
        pos[k] = v.x;
        pos[k + 1] = v.y;
        pos[k + 2] = v.z;
      },
      color(i, cc, b = 1) {
        const k = (start + i) * 3;
        col[k] = cc.r * b;
        col[k + 1] = cc.g * b;
        col[k + 2] = cc.b * b;
      },
      size(i, s) {
        siz[start + i] = s;
      },
      hide(i) {
        pos[(start + i) * 3 + 1] = -1e5;
      },
      hideAll() {
        for (let i = 0; i < n; i++) pos[(start + i) * 3 + 1] = -1e5;
      },
    };
  }

  get usage(): { used: number; capacity: number } {
    return { used: this.used, capacity: this.capacity };
  }

  flush(): void {
    (this.geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geom.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
    (this.geom.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
  }
}
