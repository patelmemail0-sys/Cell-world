import * as THREE from 'three';
import type { Kit } from '../world/kit';
import type { Player } from './Player';
import type { Stop } from '../content/sequences';
import type { ParticlePool } from '../fx/particles';

// One sequencer drives the guided tour, the insulin story and "Travel there".
//
//   free --T--> tour      free --G--> story      free --travel(id)--> travel
//   tour --T--> free      tour --G--> story      (the other key replaces the sequence)
//   any  --movement key--> free                  travel --arrive--> free
//
// Flights run on real time (never on the pausable process clock).

export type Mode = 'free' | 'tour' | 'story' | 'travel';

export interface SequenceView {
  mode: Mode;
  index: number;
  total: number;
  stop: Stop | null;
  arrived: boolean;
}

export class Sequencer {
  mode: Mode = 'free';
  paused = false;
  reducedMotion = false;
  private stops: Stop[] = [];
  private index = 0;
  private phase: 'fly' | 'hold' = 'fly';
  private t = 0;
  private duration = 1;
  private readonly from = new THREE.Vector3();
  private readonly prevTarget = new THREE.Vector3();
  private readonly cargoPos = new THREE.Vector3();
  /** 0..1 through the current stop's hold, for anything that plays in step with the caption. */
  holdProgress = 0;
  onChange?: (view: SequenceView) => void;
  onCut?: () => void;

  constructor(
    private readonly player: Player,
    private readonly kit: Kit,
    private readonly cargo: ParticlePool,
  ) {}

  get view(): SequenceView {
    return {
      mode: this.mode,
      index: this.index,
      total: this.stops.length,
      stop: this.mode === 'free' ? null : this.stops[this.index] ?? null,
      arrived: this.phase === 'hold',
    };
  }

  start(mode: Exclude<Mode, 'free' | 'travel'>, stops: Stop[]): void {
    this.mode = mode;
    this.stops = stops;
    this.index = 0;
    this.prevTarget.copy(this.player.position);
    this.beginFlight();
  }

  /** Fly to a single codex entry's anchor. Returns false if it has no anchor. */
  travel(anchor: string, title: string): boolean {
    if (!this.kit.anchors.has(anchor)) return false;
    this.mode = 'travel';
    this.stops = [{ anchor, entity: anchor, title, caption: '', hold: 0 }];
    this.index = 0;
    this.prevTarget.copy(this.player.position);
    this.beginFlight();
    return true;
  }

  stop(): void {
    if (this.mode === 'free') return;
    this.mode = 'free';
    this.player.scripted = false;
    this.player.velocity.set(0, 0, 0);
    this.cargo.hideAll();
    this.onChange?.(this.view);
  }

  next(): void {
    if (this.mode === 'free' || this.mode === 'travel') return;
    if (this.index >= this.stops.length - 1) return this.stop();
    this.prevTarget.copy(this.kit.anchors.get(this.stops[this.index].anchor)!.target());
    this.index++;
    this.beginFlight();
  }

  prev(): void {
    if (this.mode === 'free' || this.mode === 'travel' || this.index === 0) return;
    this.prevTarget.copy(this.kit.anchors.get(this.stops[this.index].anchor)!.target());
    this.index--;
    this.beginFlight();
  }

  private beginFlight(): void {
    const a = this.kit.anchors.get(this.stops[this.index].anchor);
    if (!a) {
      // A missing anchor should never ship (tests cover it); skip rather than strand the player.
      if (this.index < this.stops.length - 1) {
        this.index++;
        return this.beginFlight();
      }
      return this.stop();
    }
    this.player.scripted = true;
    this.from.copy(this.player.position);
    const dist = this.from.distanceTo(a.view());
    this.duration = this.reducedMotion ? 0.001 : THREE.MathUtils.clamp(dist / 16, 2.2, 7);
    this.phase = 'fly';
    this.t = 0;
    this.holdProgress = 0;
    if (this.reducedMotion) this.onCut?.();
    this.onChange?.(this.view);
  }

  update(dt: number, time: number): void {
    if (this.mode === 'free' || this.paused) return;
    const stop = this.stops[this.index];
    const a = this.kit.anchors.get(stop.anchor)!;
    const view = a.view();
    const target = a.target();
    this.t += dt;
    if (this.phase === 'fly') {
      const u = Math.min(1, this.t / this.duration);
      const e = u * u * (3 - 2 * u);
      _p.lerpVectors(this.from, view, e);
      // Look where we are going for most of the flight, then settle on the subject.
      _look.lerpVectors(view, target, THREE.MathUtils.smoothstep(u, 0.35, 0.85));
      if (this.reducedMotion) {
        this.player.position.copy(view);
        this.player.lookAt(target);
      } else {
        this.player.drive(_p, _look.distanceToSquared(_p) < 0.01 ? target : _look, dt, 3.2);
      }
      this.cargoPos.lerpVectors(this.prevTarget, target, e);
      if (u >= 1) {
        this.phase = 'hold';
        this.t = 0;
        this.onChange?.(this.view);
      }
    } else {
      // Track moving subjects (motors, vesicles) while holding.
      _p.copy(this.player.position).lerp(view, Math.min(1, dt * 2.5));
      this.player.drive(_p, target, dt, 4);
      this.cargoPos.copy(target);
      if (this.mode === 'travel') return this.stop();
      this.holdProgress = Math.min(1, this.t / Math.max(0.1, stop.hold));
      if (this.t > stop.hold) this.next();
    }
    // The story's tracked cargo: a small swirl marking "our" insulin molecule.
    if (this.mode === 'story') {
      for (let i = 0; i < this.cargo.count; i++) {
        const ang = time * 2.2 + (i / this.cargo.count) * Math.PI * 2;
        this.cargo.set(i, this.cargoPos.x + Math.cos(ang) * 0.14, this.cargoPos.y + Math.sin(ang * 1.3) * 0.14, this.cargoPos.z + Math.sin(ang) * 0.14);
      }
    } else this.cargo.hideAll();
  }
}

const _p = new THREE.Vector3();
const _look = new THREE.Vector3();
