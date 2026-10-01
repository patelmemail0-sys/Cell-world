import * as THREE from 'three';
import { solid, PALETTE } from '../fx/materials';
import { blob, v3, cyclePhase, smoothstep } from '../fx/geom';
import { globalUniforms } from '../fx/uniforms';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';
import { cellState } from '../world/state';

// Cytosol: the crowded fluid between organelles (20-30% protein by volume). Glucose is
// phosphorylated here by glucokinase, the beta cell's glucose sensor, then split by
// glycolysis into pyruvate that feeds the mitochondria.

const BOX = 40;
const CROWD = 150;
const HEROES = 8;
const FLUX = 40;

export class Cytosol implements Organelle {
  readonly id = 'cytosol';
  readonly group = new THREE.Group();
  private readonly crowd: THREE.InstancedMesh;
  private readonly base: Float32Array;
  private readonly cell: (number | undefined)[] = [];
  private readonly isCytosol: (p: THREE.Vector3) => boolean;
  private readonly heroes: { group: THREE.Group; lobe: THREE.Mesh; phase: number }[] = [];
  private readonly glucose: ParticlePool;
  private readonly atp: ParticlePool;
  private readonly flux: ParticlePool;
  private readonly fluxRoutes: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  private readonly radii: THREE.Vector3;
  private progress: number | null = null;
  private readonly white = new THREE.Color(PALETTE.glucose);
  private readonly pyruvate = new THREE.Color(0xffb26b);

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles, quality } = ctx;
    this.radii = v3(layout.cell.radii);
    this.isCytosol = (p) => kit.compartmentAt(p).label === 'Cytosol' && p.clone().divide(this.radii).length() < 0.97;

    // --- drifting motes for depth: wrapped around the camera entirely on the GPU --------
    const nMotes = quality === 'low' ? 1000 : 2400;
    const pos = new Float32Array(nMotes * 3);
    const seed = new Float32Array(nMotes);
    for (let i = 0; i < nMotes; i++) {
      pos[i * 3] = rng.range(0, BOX);
      pos[i * 3 + 1] = rng.range(0, BOX);
      pos[i * 3 + 2] = rng.range(0, BOX);
      seed[i] = rng.next();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const motes = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        uniforms: { uTime: globalUniforms.uTime, uMotion: globalUniforms.uMotion, uBox: { value: BOX }, uScale: { value: 600 }, uTint: { value: new THREE.Color(0x8fd8e8) } },
        vertexShader: /* glsl */ `
          attribute float aSeed; uniform float uTime; uniform float uMotion; uniform float uBox; uniform float uScale;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            // Brownian drift.
            p += vec3(sin(uTime * 0.31 + aSeed * 40.0), cos(uTime * 0.27 + aSeed * 71.0), sin(uTime * 0.23 + aSeed * 13.0)) * 0.6 * uMotion;
            p = mod(p - cameraPosition, uBox) - uBox * 0.5 + cameraPosition;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float d = -mv.z;
            gl_PointSize = clamp((0.035 + aSeed * 0.05) * uScale / max(d, 0.1), 0.0, 5.0);
            vAlpha = smoothstep(uBox * 0.5, uBox * 0.3, d) * smoothstep(0.3, 1.5, d) * (0.25 + aSeed * 0.5);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTint; varying float vAlpha;
          void main() {
            float r = length(gl_PointCoord - 0.5) * 2.0;
            if (r > 1.0) discard;
            gl_FragColor = vec4(uTint * vAlpha * (1.0 - r * r), 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    motes.frustumCulled = false;
    motes.renderOrder = 40;
    this.group.add(motes);

    // --- macromolecular crowding: enzymes and other soluble proteins near the player -----
    const nCrowd = quality === 'low' ? 80 : CROWD;
    this.crowd = new THREE.InstancedMesh(blob(0.2, 1, 0.45, 3, [1.2, 0.85, 1]), solid(0x3f7f90, { emissiveIntensity: 0.2, roughness: 0.8, transparent: true, opacity: 0.6 }), nCrowd);
    this.crowd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.crowd.frustumCulled = false;
    this.base = new Float32Array(nCrowd * 4);
    for (let i = 0; i < nCrowd; i++) {
      this.base[i * 4] = rng.range(0, BOX);
      this.base[i * 4 + 1] = rng.range(0, BOX);
      this.base[i * 4 + 2] = rng.range(0, BOX);
      this.base[i * 4 + 3] = rng.range(0.6, 1.5);
    }
    this.group.add(this.crowd);
    kit.pickable(this.crowd, { entity: 'cytosol' });

    // --- glucokinase: a two-lobed enzyme that clamps shut around glucose --------------
    const big = blob(0.3, 2, 0.3, 2, [1, 1.15, 1]);
    const small = blob(0.21, 2, 0.3, 6, [1, 1.1, 1]);
    const showcase = new THREE.Vector3(0.52, 0.44, 0.73).normalize();
    for (let i = 0; i < HEROES; i++) {
      const dir = i === 0 ? showcase.clone() : new THREE.Vector3(...rng.unit());
      const p = dir.clone().multiply(this.radii).multiplyScalar(i === 0 ? 0.9 : rng.range(0.7, 0.9));
      const grp = new THREE.Group();
      grp.position.copy(p);
      grp.rotation.set(rng.range(0, 6), rng.range(0, 6), rng.range(0, 6));
      const a = new THREE.Mesh(big, solid(0x5fe3a1, { emissiveIntensity: 0.4 }));
      const pivot = new THREE.Group();
      pivot.position.set(0.12, 0.22, 0);
      const lobe = new THREE.Mesh(small, solid(0x9dffca, { emissiveIntensity: 0.45 }));
      lobe.position.set(0.16, 0.14, 0);
      pivot.add(lobe);
      grp.add(a, pivot);
      this.group.add(grp);
      kit.pickable(a, { entity: 'glucokinase' });
      kit.pickable(lobe, { entity: 'glucokinase' });
      kit.lod(grp, p, 30);
      this.heroes.push({ group: grp, lobe: pivot as unknown as THREE.Mesh, phase: rng.range(0, 10) });
      if (i === 0) kit.anchor('glucokinase', p, p.clone().addScaledVector(dir, -2.4));
    }
    this.glucose = particles.pool(HEROES, PALETTE.glucose, 0.2);
    this.atp = particles.pool(HEROES, PALETTE.atp, 0.2);

    // --- glycolysis flux: glucose in at the membrane, pyruvate out to mitochondria ------
    this.flux = particles.pool(FLUX, PALETTE.glucose, 0.17);
    for (let i = 0; i < FLUX; i++) {
      const m = layout.mitochondria[i % layout.mitochondria.length];
      const to = v3(m.center);
      const from = to.clone().normalize().add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.45)).normalize().multiply(this.radii).multiplyScalar(0.97);
      this.fluxRoutes.push({ from, to });
    }
    const open = new THREE.Vector3(...layout.spawn.position);
    kit.anchor('cytosol', open, open.clone().add(new THREE.Vector3(3, 1, 3)));
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'glucokinase') return this.progress;
    if (entityId === 'cytosol') return (globalUniforms.uProcessTime.value * 0.05) % 1;
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const pt = ctx.pt;
    // Crowd proteins: wrap around the camera; hide any that land inside an organelle.
    const n = this.crowd.count;
    const half = BOX / 2;
    for (let i = 0; i < n; i++) {
      const bx = this.base[i * 4];
      const by = this.base[i * 4 + 1];
      const bz = this.base[i * 4 + 2];
      const wx = Math.floor((cam.x + half - bx) / BOX);
      const wy = Math.floor((cam.y + half - by) / BOX);
      const wz = Math.floor((cam.z + half - bz) / BOX);
      _p.set(bx + wx * BOX, by + wy * BOX, bz + wz * BOX);
      const key = wx * 73856093 + wy * 19349663 + wz * 83492791;
      if (this.cell[i] !== key) {
        this.cell[i] = key;
        this.base[i * 4 + 3] = Math.abs(this.base[i * 4 + 3]) * (this.isCytosol(_p) ? 1 : -1);
      }
      const s = this.base[i * 4 + 3];
      const t = ctx.time * 0.6 + i;
      _p.x += Math.sin(t * 0.7 + i) * 0.15;
      _p.y += Math.cos(t * 0.9 + i * 1.3) * 0.15;
      _q.setFromAxisAngle(_axis.set(Math.sin(i), Math.cos(i * 1.7), Math.sin(i * 0.3)).normalize(), t * 0.3);
      _s.setScalar(s > 0 ? s : 0.0001);
      _m.compose(_p, _q, _s);
      this.crowd.setMatrixAt(i, _m);
    }
    this.crowd.instanceMatrix.needsUpdate = true;

    // Glucokinase: glucose binds, the lobes close, ATP donates a phosphate, G6P leaves.
    this.progress = null;
    let first = true;
    this.heroes.forEach((h, i) => {
      if (!h.group.visible) {
        this.glucose.hide(i);
        this.atp.hide(i);
        return;
      }
      const [step, p] = cyclePhase(pt * 0.7 + h.phase, [1.6, 0.8, 1.0, 1.6]);
      if (first) {
        this.progress = (step + p) / 4;
        first = false;
      }
      const closed = step === 0 ? smoothstep(0.7, 1, p) : step === 3 ? 1 - smoothstep(0, 0.4, p) : 1;
      h.lobe.rotation.z = THREE.MathUtils.lerp(0.5, -0.05, closed);
      const cleft = h.group.localToWorld(_p.set(0.2, 0.2, 0.05));
      _d.copy(cleft).sub(h.group.position).normalize();
      const far = step === 0 ? (1 - p) * 2.2 : step === 3 ? p * 2.2 : 0;
      this.glucose.setV(i, _a.copy(cleft).addScaledVector(_d, far));
      this.glucose.color(i, step === 3 ? G6P : this.white);
      if (step === 1 || step === 2) this.atp.setV(i, _a.copy(cleft).addScaledVector(_d, step === 1 ? (1 - p) * 1.6 + 0.15 : 0.15 + p * 1.6).add(_axis.set(0.1, 0.12, 0)));
      else this.atp.hide(i);
    });

    // Glycolysis: one glucose becomes two pyruvate on its way inward.
    const drive = THREE.MathUtils.clamp((cellState.glucoseMM - 3.5) / 8, 0.2, 1);
    for (let i = 0; i < FLUX; i++) {
      const r = this.fluxRoutes[i];
      const u = (((pt * 0.035 + i * 0.6180339) % 1) + 1) % 1;
      const split = smoothstep(0.4, 0.6, u);
      _p.lerpVectors(r.from, r.to, u);
      _p.x += Math.sin(i * 3.1) * split * 0.7;
      _p.y += Math.cos(i * 2.3) * split * 0.7;
      if (i / FLUX > drive) this.flux.hide(i);
      else {
        this.flux.setV(i, _p);
        this.flux.color(i, _col.copy(this.white).lerp(this.pyruvate, split));
        this.flux.size(i, 0.17 * (1 - split * 0.25));
      }
    }
  }
}

const G6P = new THREE.Color(0xffe27a);
const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _d = new THREE.Vector3();
const _s = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _col = new THREE.Color();
