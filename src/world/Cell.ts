import * as THREE from 'three';
import { Rng } from '../engine/rng';
import { ParticleSystem } from '../fx/particles';
import { globalUniforms } from '../fx/uniforms';
import { CYTOSOL, Kit, type Compartment } from './kit';
import { buildLayout, type Layout } from './layout';
import { cellState, computeState } from './state';
import type { BuildContext, FrameCtx, Organelle, Quality } from './types';
import { PlasmaMembrane } from '../organelles/PlasmaMembrane';
import { Nucleus } from '../organelles/Nucleus';
import { Mitochondria } from '../organelles/Mitochondria';
import { RoughER } from '../organelles/RoughER';
import { Ribosomes } from '../organelles/Ribosomes';
import { SmoothER } from '../organelles/SmoothER';
import { Golgi } from '../organelles/Golgi';
import { Centrosome } from '../organelles/Centrosome';
import { Cytoskeleton } from '../organelles/Cytoskeleton';
import { Lysosomes } from '../organelles/Lysosomes';
import { Peroxisomes } from '../organelles/Peroxisomes';
import { Endosomes } from '../organelles/Endosomes';
import { Autophagosome } from '../organelles/Autophagosome';
import { Proteasomes } from '../organelles/Proteasomes';
import { InsulinGranules } from '../organelles/InsulinGranules';
import { Vesicles } from '../organelles/Vesicles';
import { Cytosol } from '../organelles/Cytosol';
import { ExtracellularMatrix } from '../organelles/ExtracellularMatrix';

// Builds the whole beta cell and runs it each frame.

/**
 * Compartment haze colours are authored as the look wanted before tone mapping, so the hex
 * channels are read as linear light rather than sRGB.
 */
function haze(hex: number, out: THREE.Color): THREE.Color {
  return out.setRGB(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

export class Cell {
  readonly group = new THREE.Group();
  readonly kit = new Kit();
  readonly particles: ParticleSystem;
  readonly layout: Layout;
  readonly organelles: Organelle[] = [];
  readonly radii: THREE.Vector3;
  /** Compartment after hysteresis; what the HUD and fog use. */
  compartment: Compartment;
  private pending: Compartment;
  private pendingFor = 0;
  /** Seconds since the last membrane crossing, for the ripple effect. */
  sinceCrossing = 10;
  private readonly fogTarget = new THREE.Color();

  constructor(private readonly scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: Quality) {
    this.layout = buildLayout();
    this.radii = new THREE.Vector3(...this.layout.cell.radii);
    this.particles = new ParticleSystem(4000);
    this.kit.bounds.copy(this.radii);
    const ctx: BuildContext = { kit: this.kit, rng: new Rng(this.layout.seed + 7), particles: this.particles, quality };

    const er = new RoughER(this.layout, ctx);
    const golgi = new Golgi(this.layout, ctx);
    // Order matters only where one module consumes another's sites.
    this.organelles.push(
      new PlasmaMembrane(this.layout, ctx),
      new ExtracellularMatrix(this.layout, ctx),
      new Nucleus(this.layout, ctx),
      er,
      new Ribosomes(this.layout, er.boundSites, ctx),
      new SmoothER(this.layout, ctx),
      golgi,
      new Mitochondria(this.layout, ctx),
      new Centrosome(this.layout, ctx),
      new Cytoskeleton(this.layout, ctx),
      new Lysosomes(this.layout, ctx),
      new Peroxisomes(this.layout, ctx),
      new Endosomes(this.layout, ctx),
      new Autophagosome(this.layout, ctx),
      new Proteasomes(this.layout, ctx),
      new InsulinGranules(this.layout, golgi, ctx),
      new Vesicles(this.layout, er, golgi, ctx),
    );
    // The cytosol asks the kit which compartment a point is in, so it builds last.
    this.organelles.push(new Cytosol(this.layout, ctx));
    for (const o of this.organelles) this.group.add(o.group);
    this.group.add(this.particles.points);
    scene.add(this.group);

    // Lighting: soft two-tone ambient plus a headlamp that travels with the player.
    // The headlamp is directional (constant brightness at any range) so nothing blows out
    // when you press your nose against it; fog supplies the falloff with distance.
    scene.add(new THREE.HemisphereLight(0xc4e6f2, 0x1c1a46, 0.5));
    const key = new THREE.DirectionalLight(0xfff0dc, 0.3);
    key.position.set(0.4, 1, 0.6);
    scene.add(key);
    const headlamp = new THREE.DirectionalLight(0xe6f7ff, 0.85);
    headlamp.position.set(0.25, 0.35, 1);
    camera.add(headlamp, headlamp.target);
    headlamp.target.position.set(0, 0, -1);

    // The backdrop IS the fog colour, so distant structures dissolve into it instead of
    // standing out as silhouettes.
    const fog = new THREE.FogExp2(0x000000, CYTOSOL.fogDensity);
    haze(CYTOSOL.fog, fog.color);
    scene.fog = fog;
    scene.background = fog.color;
    this.compartment = this.pending = this.kit.compartmentAt(new THREE.Vector3(...this.layout.spawn.position));

    const spawn = new THREE.Vector3(...this.layout.spawn.position);
    this.kit.anchor('spawn', new THREE.Vector3(...this.layout.spawn.lookAt), spawn);
    this.kit.anchor('overview', new THREE.Vector3(-8, 0, 0), new THREE.Vector3(40, 22, 30));
  }

  /** Keep the player inside the plasma membrane and out of the few solid bodies. */
  confine = (p: THREE.Vector3): void => {
    const r = Math.sqrt((p.x / this.radii.x) ** 2 + (p.y / this.radii.y) ** 2 + (p.z / this.radii.z) ** 2);
    if (r > 0.985) p.multiplyScalar(0.985 / r);
    for (const s of this.kit.solids) {
      const d = p.distanceTo(s.center);
      if (d < s.radius + 0.15 && d > 1e-4) p.sub(s.center).multiplyScalar((s.radius + 0.15) / d).add(s.center);
    }
  };

  setCutaway(on: boolean): void {
    this.kit.setXray(on);
  }

  get cutaway(): boolean {
    return this.kit.xray;
  }

  processProgress(entityId: string): number | null {
    for (const o of this.organelles) {
      const p = o.getProcessProgress?.(entityId);
      if (p !== null && p !== undefined) return p;
    }
    return null;
  }

  update(ctx: FrameCtx): void {
    computeState(ctx.pt, cellState);
    globalUniforms.uTime.value = ctx.time;
    globalUniforms.uProcessTime.value = ctx.pt;
    globalUniforms.uMotion.value = ctx.reducedMotion ? 0.05 : 1;

    const cam = ctx.camera.position;
    this.kit.update(cam, ctx.dt);
    for (const o of this.organelles) o.update(ctx);
    this.particles.flush();

    // Compartment with hysteresis so thin lumens do not make the HUD and fog flicker.
    this.sinceCrossing += ctx.dt;
    const now = this.kit.compartmentAt(cam);
    if (now.label !== this.compartment.label) {
      if (now.label === this.pending.label) this.pendingFor += ctx.dt;
      else {
        this.pending = now;
        this.pendingFor = 0;
      }
      if (this.pendingFor > 0.15) {
        this.compartment = now;
        if (this.sinceCrossing > 0.4) this.sinceCrossing = 0;
      }
    } else {
      this.pending = now;
      this.pendingFor = 0;
    }
    const fog = this.scene.fog as THREE.FogExp2;
    haze(this.compartment.fog, this.fogTarget);
    const k = Math.min(1, ctx.dt * 3.5);
    fog.color.lerp(this.fogTarget, k);
    fog.density += (this.compartment.fogDensity - fog.density) * k;
    globalUniforms.uFogColor.value.copy(fog.color);
    globalUniforms.uFogDensity.value = fog.density;
  }
}
