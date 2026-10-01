import * as THREE from 'three';
import { membraneMaterial, solid, extend, PALETTE } from '../fx/materials';
import { blob, mergeColored, quatFromY, setInstance, v3, smoothstep, perpendicular } from '../fx/geom';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';
import { cellState, storyBeat } from '../world/state';
import type { Golgi } from './Golgi';

// Insulin secretory granules: about 300 nm vesicles with a dense crystalline core of
// zinc-insulin hexamers. Immature granules bud from the trans-Golgi network, acidify and
// convert proinsulin to insulin; docked granules fuse with the plasma membrane when Ca2+
// floods in, releasing insulin outside the cell.

const DOCKED = 26;
const IMMATURE = 6;
const SPRAY = 8;

interface Docked {
  index: number;
  radius: number;
  surface: THREE.Vector3;
  normal: THREE.Vector3;
  phase: number;
}

export class InsulinGranules implements Organelle {
  readonly id = 'insulin-granule';
  readonly group = new THREE.Group();
  private readonly halo: THREE.InstancedMesh;
  private readonly core: THREE.InstancedMesh;
  private readonly docked: Docked[] = [];
  private readonly snares: THREE.InstancedMesh;
  private readonly insulin: ParticlePool;
  private readonly immHalo: THREE.InstancedMesh;
  private readonly immCore: THREE.InstancedMesh;
  private readonly convertase: THREE.InstancedMesh;
  private readonly paths: { from: THREE.Vector3; mid: THREE.Vector3; to: THREE.Vector3; radius: number }[] = [];
  private readonly immPos = new THREE.Vector3();
  private readonly pale = new THREE.Color(0xd9ccb0);
  private readonly gold = new THREE.Color(PALETTE.granuleCore);

  constructor(layout: Layout, golgi: Golgi, ctx: BuildContext) {
    const { kit, rng, particles, quality } = ctx;
    const radii = v3(layout.cell.radii);
    const all = layout.granules.slice(0, quality === 'low' ? 160 : layout.granules.length);
    const n = all.length;
    const haloMat = membraneMaterial({ color: PALETTE.granule, rimColor: 0xfff3c4, baseAlpha: 0.12, opacity: 0.8, amp: 0.02, freq: 1.5, glow: 0.25, rimStrength: 0.5 });
    this.halo = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), haloMat, n);
    // Faceted core: insulin is stored as a crystal.
    this.core = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), solid(PALETTE.granuleCore, { emissiveIntensity: 0.45, flat: true, roughness: 0.35 }), n);
    const centers = all.map((g) => v3(g.center));

    // The granules closest to the membrane form the docked, release-ready pool.
    const order = all.map((g, i) => ({ i, r: centers[i].clone().divide(radii).length() - g.radius / 64 })).sort((a, b) => b.r - a.r);
    const showcase = new THREE.Vector3(0.52, 0.44, 0.73).normalize();
    const dockSet = new Set<number>();
    order.slice(0, DOCKED).forEach(({ i }, k) => {
      // The first docked granule is moved beside the membrane showcase patch for travel.
      // Kept clear of the membrane-protein showcase so the fusion machinery is easy to see.
      const dir = k === 0 ? showcase.clone().add(new THREE.Vector3(0.13, -0.09, 0)).normalize() : centers[i].clone().divide(radii).normalize();
      const surface = new THREE.Vector3(dir.x * radii.x, dir.y * radii.y, dir.z * radii.z);
      const normal = new THREE.Vector3(surface.x / radii.x ** 2, surface.y / radii.y ** 2, surface.z / radii.z ** 2).normalize();
      this.docked.push({ index: i, radius: all[i].radius, surface, normal, phase: rng.range(0, 1) });
      dockSet.add(i);
    });
    all.forEach((g, i) => {
      if (dockSet.has(i)) return;
      setInstance(this.halo, i, centers[i], null, g.radius);
      setInstance(this.core, i, centers[i], quatFromY(new THREE.Vector3(...rng.unit())), g.radius * 0.6);
    });
    for (const m of [this.halo, this.core]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      this.group.add(m);
    }
    kit.pickable(this.halo, { entity: 'insulin-granule', xray: true, passThrough: 2.2 });
    kit.membrane(this.halo, { depth: 2, xray: true });
    kit.pickable(this.core, { entity: 'insulin-hexamer' });

    // SNARE complexes: four-helix bundles zippering the granule onto the membrane.
    // Four helices coiled around each other: syntaxin (red), two from SNAP-25 (green) and
    // synaptobrevin from the granule (blue).
    const helix = (phase: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        const a = phase + u * Math.PI * 1.6;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.034, (u - 0.5) * 0.5, Math.sin(a) * 0.034));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.019, 4, false);
    };
    const snareGeo = mergeColored([
      [helix(0), 0xff5a5f],
      [helix(Math.PI / 2), 0x5fe08a],
      [helix(Math.PI), 0x5fe08a],
      [helix(Math.PI * 1.5), 0x5aa9ff],
    ]);
    const snareMat = solid(0xffffff, { emissiveIntensity: 0, bump: 0, rim: 0.3 });
    snareMat.vertexColors = true;
    extend(snareMat, 'tinted-glow', (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.6;',
      );
    });
    this.snares = new THREE.InstancedMesh(snareGeo, snareMat, DOCKED * 4);
    this.snares.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.snares.frustumCulled = false;
    this.group.add(this.snares);
    kit.pickable(this.snares, { entity: 'snare-complex' });
    this.insulin = particles.pool(DOCKED * SPRAY, 0xfff0b0, 0.2);

    // Immature granules travelling out from the trans-Golgi network.
    this.immHalo = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), haloMat, IMMATURE);
    this.immCore = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), solid(0xffffff, { emissive: 0x8a6a20, emissiveIntensity: 0.25, bumpScale: 4 }), IMMATURE);
    this.convertase = new THREE.InstancedMesh(blob(0.14, 1, 0.3, 4, [1.3, 0.9, 1]), solid(0xff7a5c, { emissiveIntensity: 0.8 }), IMMATURE * 2);
    for (const m of [this.immHalo, this.immCore, this.convertase]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      this.group.add(m);
    }
    kit.pickable(this.immHalo, { entity: 'insulin-granule', xray: true, passThrough: 2.2 });
    kit.pickable(this.immCore, { entity: 'insulin-hexamer' });
    kit.pickable(this.convertase, { entity: 'prohormone-convertase' });
    for (let i = 0; i < IMMATURE; i++) {
      const a = (i / IMMATURE) * Math.PI * 2;
      const from = golgi.transFace(Math.cos(a) * 3.5, Math.sin(a) * 3.5);
      const dir = from.clone().sub(golgi.center).normalize().add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.5)).normalize();
      const to = dir.clone().multiply(radii).multiplyScalar(0.84);
      const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(...rng.unit()).multiplyScalar(5));
      this.paths.push({ from, mid, to, radius: rng.range(1.3, 1.6) });
    }

    const d0 = this.docked[0];
    const dockedCenter = d0.surface.clone().addScaledVector(d0.normal, -(d0.radius + 0.5));
    kit.anchor('insulin-granule', dockedCenter, dockedCenter.clone().addScaledVector(d0.normal, -5.5));
    kit.anchor('insulin-hexamer', dockedCenter, dockedCenter.clone().addScaledVector(d0.normal, -3.4));
    const snarePos = d0.surface.clone().addScaledVector(d0.normal, -0.3);
    kit.anchor('snare-complex', snarePos, snarePos.clone().addScaledVector(perpendicular(d0.normal), 2.1).addScaledVector(d0.normal, -0.45));
    kit.anchor('prohormone-convertase', () => this.immPos, () => this.immPos.clone().add(new THREE.Vector3(3.6, 1.6, 3.6)));
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'insulin-granule' || entityId === 'snare-complex') return cellState.phase;
    if (entityId === 'prohormone-convertase') return this.immProgress;
    return null;
  }

  private immProgress = 0;

  update(ctx: FrameCtx): void {
    const pt = ctx.pt;
    const secreting = cellState.secretion;
    this.insulin.hideAll();
    this.docked.forEach((d, k) => {
      // Each docked granule takes its turn while Ca2+ is high.
      // During the story's final step the showcase granule fuses in time with the caption.
      const staged = k === 0 && storyBeat.range !== null && secreting > 0.25;
      const t = staged ? 0.04 + storyBeat.t * 0.44 : (((pt * 0.11 + d.phase) % 1) + 1) % 1;
      const firing = secreting > 0.25 && t < 0.5;
      const u = firing ? t / 0.5 : 0;
      const pull = firing ? smoothstep(0, 0.25, u) : 0;
      const fuse = firing ? smoothstep(0.25, 0.8, u) : 0;
      const refill = !firing && secreting > 0.25 ? smoothstep(0.5, 0.75, t) : 1;
      const gap = THREE.MathUtils.lerp(0.5, 0.02, pull);
      const scale = d.radius * (1 - fuse * 0.92) * (firing ? 1 : refill);
      _c.copy(d.surface).addScaledVector(d.normal, -(d.radius * (1 - fuse) + gap));
      setInstance(this.halo, d.index, _c, null, Math.max(0.0001, scale));
      // The crystal dissolves as the fusion pore opens to the neutral outside.
      setInstance(this.core, d.index, _c, null, Math.max(0.0001, scale * 0.6 * (1 - fuse)));

      perpendicular(d.normal, _a);
      _b.crossVectors(d.normal, _a);
      for (let j = 0; j < 4; j++) {
        const ang = (j / 4) * Math.PI * 2;
        const ring = 0.45 * (1 - fuse * 0.7);
        _p.copy(d.surface).addScaledVector(d.normal, -(0.1 + gap * 0.5)).addScaledVector(_a, Math.cos(ang) * ring).addScaledVector(_b, Math.sin(ang) * ring);
        _s.set(1, Math.max(0.2, (gap + 0.25) / 0.5), 1).multiplyScalar(fuse > 0.95 ? 0.0001 : 1);
        _m.compose(_p, quatFromY(d.normal, _q), _s);
        this.snares.setMatrixAt(k * 4 + j, _m);
      }
      if (firing && fuse > 0.05) {
        for (let j = 0; j < SPRAY; j++) {
          // Insulin streams out through the fusion pore, each particle a little behind the last.
          const w = Math.min(1, Math.max(0, u - 0.3 - j * 0.035) / 0.6);
          const ang = j * 1.05 + k;
          const spread = w * (0.9 + (j % 3) * 0.5);
          this.insulin.setV(k * SPRAY + j, _p.copy(d.surface).addScaledVector(d.normal, 0.25 + w * (2.6 + (j % 2) * 1.6)).addScaledVector(_a, Math.cos(ang) * spread).addScaledVector(_b, Math.sin(ang) * spread));
          this.insulin.size(k * SPRAY + j, w > 0 ? 0.24 * (1 - w * 0.5) : 0);
        }
      }
    });
    this.halo.instanceMatrix.needsUpdate = true;
    this.core.instanceMatrix.needsUpdate = true;
    this.snares.instanceMatrix.needsUpdate = true;

    // Maturation: the core condenses and yellows as proinsulin becomes insulin.
    this.paths.forEach((path, i) => {
      const u = (((pt * 0.012 + i / IMMATURE) % 1) + 1) % 1;
      const w = 1 - u;
      _c.set(0, 0, 0)
        .addScaledVector(path.from, w * w)
        .addScaledVector(path.mid, 2 * w * u)
        .addScaledVector(path.to, u * u);
      const grow = smoothstep(0, 0.08, u) * (1 - smoothstep(0.94, 1, u));
      const mature = smoothstep(0.1, 0.8, u);
      setInstance(this.immHalo, i, _c, null, Math.max(0.0001, path.radius * grow));
      setInstance(this.immCore, i, _c, null, Math.max(0.0001, path.radius * grow * THREE.MathUtils.lerp(0.86, 0.6, mature)));
      this.immCore.setColorAt(i, _col.copy(this.pale).lerp(this.gold, mature));
      for (let j = 0; j < 2; j++) {
        const a = pt * 0.3 + j * Math.PI + i;
        // The enzymes work in the fluid between the membrane and the condensing core.
        _p.copy(_c).add(_a.set(Math.cos(a), Math.sin(a * 0.7), Math.sin(a)).normalize().multiplyScalar(path.radius * 0.93));
        setInstance(this.convertase, i * 2 + j, _p, null, grow * 0.8);
      }
      if (i === 0) {
        this.immPos.copy(_c);
        this.immProgress = u;
      }
    });
    this.immHalo.instanceMatrix.needsUpdate = true;
    this.immCore.instanceMatrix.needsUpdate = true;
    this.convertase.instanceMatrix.needsUpdate = true;
    if (this.immCore.instanceColor) this.immCore.instanceColor.needsUpdate = true;
  }
}

const _c = new THREE.Vector3();
const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _col = new THREE.Color();
