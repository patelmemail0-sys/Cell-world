import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { Quality } from '../world/types';

// Vignette, a whisper of chromatic fringing at the edges, and fine grain: the "microscope" lens.
const LensShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 1.0 },
    uVeil: { value: 0.1 },
    uAberration: { value: 0.0016 },
    uGrain: { value: 0.035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uAberration; uniform float uGrain; uniform float uVeil;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float d = length(c);
      vec2 off = c * d * uAberration * 6.0;
      vec4 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col.a = 1.0;
      // Deep-water grade: a thin teal veil and edges that fall away into the dark.
      col.rgb = mix(col.rgb, vec3(0.012, 0.07, 0.095), uVeil * (0.35 + 0.65 * smoothstep(0.1, 0.75, d)));
      float vig = smoothstep(0.98, 0.22, d * uVignette * 1.25);
      col.rgb *= mix(0.2, 1.0, vig);
      col.rgb += (hash(vUv * 1000.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = col;
    }
  `,
};

const SanitizeShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      // NaN fails every comparison, so this keeps only finite, non-negative light.
      vec3 rgb = vec3(c.r >= 0.0 ? c.r : 0.0, c.g >= 0.0 ? c.g : 0.0, c.b >= 0.0 ? c.b : 0.0);
      gl_FragColor = vec4(min(rgb, vec3(64.0)), 1.0);
    }
  `,
};

export interface FrameStats {
  fps: number;
  frameMsP50: number;
  frameMsP95: number;
  drawCalls: number;
  triangles: number;
}

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly lens: ShaderPass;
  private quality: Quality = 'high';
  private readonly frameTimes: number[] = [];
  private lastDraw = { calls: 0, triangles: 0 };

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x041620, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The composer renders several passes; count draw calls ourselves across the whole frame.
    this.renderer.info.autoReset = false;

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.03, 420);
    this.scene.add(this.camera);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // A single invalid pixel would be smeared by the bloom blur into a black block; scrub them.
    this.composer.addPass(new ShaderPass(SanitizeShader));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.62, 0.7);
    this.composer.addPass(this.bloom);
    this.lens = new ShaderPass(LensShader);
    this.composer.addPass(this.lens);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  static webgl2Available(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!c.getContext('webgl2');
    } catch {
      return false;
    }
  }

  setQuality(q: Quality): void {
    this.quality = q;
    this.bloom.enabled = q !== 'low';
    this.lens.uniforms.uAberration.value = q === 'high' ? 0.0016 : 0;
    this.resize();
  }

  get pixelRatio(): number {
    const dpr = window.devicePixelRatio || 1;
    if (this.quality === 'low') return Math.min(dpr, 1) * 0.75;
    if (this.quality === 'medium') return Math.min(dpr, 1.25);
    return Math.min(dpr, 2);
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize?.(h * this.pixelRatio, this.camera.fov);
  }

  onResize?: (heightPx: number, fov: number) => void;

  render(time: number, frameMs: number): void {
    this.renderer.info.reset();
    this.lens.uniforms.uTime.value = time % 100;
    this.composer.render();
    this.lastDraw = { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles };
    this.frameTimes.push(frameMs);
    if (this.frameTimes.length > 240) this.frameTimes.shift();
  }

  stats(): FrameStats {
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const q = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0);
    const mean = sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : 0;
    return {
      fps: mean > 0 ? Math.round(1000 / mean) : 0,
      frameMsP50: +q(0.5).toFixed(2),
      frameMsP95: +q(0.95).toFixed(2),
      drawCalls: this.lastDraw.calls,
      triangles: this.lastDraw.triangles,
    };
  }
}
