import * as THREE from 'three';
import { globalUniforms } from './uniforms';

// Ashima 3D simplex noise (MIT), used for slow organic membrane undulation.
export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export interface MembraneOptions {
  color: THREE.ColorRepresentation;
  /** Peak opacity at grazing angles. */
  opacity?: number;
  /** Opacity multiplier when viewed face-on (0..1). Low values keep membranes see-through. */
  baseAlpha?: number;
  rimColor?: THREE.ColorRepresentation;
  rimStrength?: number;
  rimPower?: number;
  /** Undulation amplitude in world units and spatial frequency. */
  amp?: number;
  freq?: number;
  /** Self-glow as a fraction of the membrane colour, so it reads against the dark. */
  glow?: number;
  /** Overrides the self-glow colour (the plasma membrane uses this for depolarization). */
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  /** Extra face-on opacity when the camera is close: [full within, gone beyond, extra alpha]. */
  near?: [number, number, number];
  /** Spatial frequency of the lipid head-group stipple shown up close (0 = none). */
  dots?: number;
  side?: THREE.Side;
  roughness?: number;
}

export type MembraneMaterial = THREE.MeshStandardMaterial & {
  userData: { xray: { value: number }; membrane: true };
};

/**
 * Translucent lipid-bilayer look: glassy when seen face-on, solid and glowing at the rim,
 * with slow noise-driven undulation. Up close it can thicken into a stippled wall of lipid
 * head groups. `userData.xray` (0..1) fades it for the cutaway mode.
 */
export function membraneMaterial(o: MembraneOptions): MembraneMaterial {
  const m = new THREE.MeshStandardMaterial({
    color: o.color,
    roughness: o.roughness ?? 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: o.opacity ?? 0.85,
    depthWrite: false,
    side: o.side ?? THREE.DoubleSide,
    emissive: o.emissive ?? o.color,
    emissiveIntensity: o.emissiveIntensity ?? (o.emissive !== undefined ? 1 : (o.glow ?? 0.22)),
  }) as MembraneMaterial;
  const xray = { value: 0 };
  const near = o.near ?? [0, 0.001, 0];
  const uniforms = {
    uTime: globalUniforms.uTime,
    uMotion: globalUniforms.uMotion,
    uAmp: { value: o.amp ?? 0.15 },
    uFreq: { value: o.freq ?? 0.12 },
    uBaseAlpha: { value: o.baseAlpha ?? 0.14 },
    uRimColor: { value: new THREE.Color(o.rimColor ?? o.color) },
    uRimStrength: { value: o.rimStrength ?? 0.9 },
    uRimPower: { value: o.rimPower ?? 2.2 },
    uNear: { value: new THREE.Vector3(near[0], near[1], near[2]) },
    uDots: { value: o.dots ?? 0 },
    uXray: xray,
  };
  m.userData = { xray, membrane: true };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime; uniform float uMotion; uniform float uAmp; uniform float uFreq;
varying vec3 vMemPos;
${NOISE_GLSL}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vMemPos = position;
float wob = snoise(position * uFreq + vec3(uTime * 0.11, uTime * 0.07, -uTime * 0.09));
transformed += objectNormal * wob * uAmp * uMotion;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uBaseAlpha; uniform vec3 uRimColor; uniform float uRimStrength; uniform float uRimPower; uniform float uXray;
uniform vec3 uNear; uniform float uDots;
varying vec3 vMemPos;
// A jittered 3D lattice of dots sliced by the surface: reads as packed lipid head groups.
float memDots(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p) - 0.5;
  vec3 j = fract(sin(vec3(dot(i, vec3(127.1, 311.7, 74.7)), dot(i, vec3(269.5, 183.3, 246.1)), dot(i, vec3(113.5, 271.9, 124.6)))) * 43758.5453) - 0.5;
  return smoothstep(0.44, 0.16, length(f - j * 0.4));
}`,
      )
      .replace(
        '#include <opaque_fragment>',
        `float camD = length(vViewPosition);
float nearK = 1.0 - smoothstep(uNear.x, uNear.y, camD);
if (uDots > 0.0) outgoingLight *= mix(1.0, 0.72 + 0.5 * memDots(vMemPos * uDots), nearK);
float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), uRimPower);
outgoingLight += uRimColor * fres * uRimStrength * mix(1.0, 0.55, uXray);
diffuseColor.a *= mix(min(1.0, uBaseAlpha + nearK * uNear.z), 1.0, fres) * mix(1.0, 0.1, uXray);
#include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'membrane-v2';
  return m;
}

export interface SolidOptions {
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  flat?: boolean;
  side?: THREE.Side;
  /** Strength of the soft edge light (0 disables). */
  rim?: number;
  /** Strength and spatial frequency of the procedural surface texture (0 disables). */
  bump?: number;
  bumpScale?: number;
}

const SURFACE_GLSL = /* glsl */ `
float cyHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float cyNoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(cyHash(i), cyHash(i + vec3(1,0,0)), f.x), mix(cyHash(i + vec3(0,1,0)), cyHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(cyHash(i + vec3(0,0,1)), cyHash(i + vec3(1,0,1)), f.x), mix(cyHash(i + vec3(0,1,1)), cyHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 cyPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir){
  vec3 sx = normalize(dFdx(surfPos)); vec3 sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, surfNorm); vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

/**
 * Opaque organic material for proteins and dense structures. On top of standard lighting it
 * adds a knobbly procedural surface (so smooth blobs read as folded protein) and a soft rim
 * light that separates shapes from the background.
 */
export function solid(color: THREE.ColorRepresentation, o: SolidOptions = {}): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.55,
    metalness: o.metalness ?? 0.05,
    emissive: o.emissive ?? color,
    emissiveIntensity: o.emissiveIntensity ?? 0.12,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    flatShading: o.flat ?? false,
    side: o.side ?? THREE.FrontSide,
    depthWrite: !(o.transparent ?? false),
  });
  const rim = o.rim ?? 0.45;
  const bump = o.flat ? 0 : (o.bump ?? 1.1);
  if (rim === 0 && bump === 0) return m;
  const uniforms = { uRim: { value: rim }, uBump: { value: bump }, uBumpScale: { value: o.bumpScale ?? 14 } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObjPos; uniform float uRim; uniform float uBump; uniform float uBumpScale;\n${SURFACE_GLSL}`)
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
float cyH = cyNoise(vObjPos * uBumpScale) + 0.5 * cyNoise(vObjPos * uBumpScale * 2.3);
if (uBump > 0.0) normal = cyPerturb(-vViewPosition, normal, vec2(dFdx(cyH), dFdy(cyH)) * uBump, faceDirection);
diffuseColor.rgb *= 0.8 + 0.27 * cyH;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `float cyRim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.6);
outgoingLight += (diffuseColor.rgb * 0.9 + 0.1) * cyRim * uRim;
#include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'solid-v1';
  return m;
}

/**
 * Add extra shader edits to a material made by solid() without losing its own.
 * Each distinct extension needs its own cache key.
 */
export function extend(m: THREE.Material, key: string, fn: (shader: THREE.WebGLProgramParametersWithUniforms) => void): void {
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    base.call(m, shader, renderer);
    fn(shader);
  };
  const baseKey = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${baseKey()}|${key}`;
}

/** Unlit glowing material; intensity > 1 feeds the bloom pass. */
export function glow(color: THREE.ColorRepresentation, intensity = 2, opacity = 1): THREE.MeshBasicMaterial {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({
    color: c,
    toneMapped: false,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
}

/** Palette: textbook-convention colors, tuned for the dark bioluminescent look. */
export const PALETTE = {
  membrane: 0xd9b48a,
  membraneRim: 0xffd7a8,
  nucleus: 0x6b5cff,
  nucleusRim: 0xb9b0ff,
  chromatin: 0x6a3fd0,
  nucleolus: 0xb48cff,
  er: 0x3fb8d9,
  erRim: 0x9fe8ff,
  golgi: 0xf0a640,
  golgiRim: 0xffd28a,
  mito: 0xff6a3d,
  mitoRim: 0xffb08f,
  cristae: 0xff8a52,
  lysosome: 0xe0459b,
  peroxisome: 0x69d36b,
  endosome: 0x5f8cff,
  granule: 0xf3e3a0,
  granuleCore: 0xffd24a,
  microtubule: 0x9ff5d0,
  actin: 0xff9fc4,
  intermediate: 0xc6b38e,
  ribosome: 0x4fd1ff,
  proteasome: 0xb6c2ff,
  // process particles
  atp: 0xffcf3a,
  proton: 0xe8fbff,
  electron: 0x4aa8ff,
  sodium: 0xa57bff,
  potassium: 0x63ff9a,
  calcium: 0xff9a3a,
  glucose: 0xffffff,
  mrna: 0xff7b6b,
  o2: 0x9ad8ff,
  h2o2: 0xd6ff7a,
  ubiquitin: 0xffe066,
};
