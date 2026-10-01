import type * as THREE from 'three';
import type { ParticleSystem } from '../fx/particles';
import type { Rng } from '../engine/rng';
import type { Kit } from './kit';

export type Quality = 'low' | 'medium' | 'high';

export interface FrameCtx {
  /** Real elapsed seconds since last frame (clamped). */
  dt: number;
  /** Real seconds since start. */
  time: number;
  /** Process clock: scaled by the time controls and frozen by P. */
  pt: number;
  /** Process delta this frame. */
  pdt: number;
  camera: THREE.PerspectiveCamera;
  quality: Quality;
  reducedMotion: boolean;
}

export interface Organelle {
  /** Codex id of the organelle-level entry this module builds. */
  readonly id: string;
  readonly group: THREE.Group;
  update(ctx: FrameCtx): void;
  /**
   * Progress 0..1 through the live process the given entity is performing, so the info
   * panel can highlight the matching step of "What you are watching". Null when the entity
   * has no instance animating near the player.
   */
  getProcessProgress?(entityId: string): number | null;
}

export interface BuildContext {
  kit: Kit;
  rng: Rng;
  particles: ParticleSystem;
  quality: Quality;
}
