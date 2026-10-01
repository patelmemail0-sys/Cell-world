import * as THREE from 'three';
import type { Input } from './Input';

// Free-flight "swimming" controller: velocity with viscous damping, mouse look with clamped
// pitch, and a soft clamp that keeps the player inside the plasma membrane.

export interface PlayerSettings {
  sensitivity: number;
  invertY: boolean;
}

const UP = new THREE.Vector3(0, 1, 0);

export class Player {
  readonly position = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  /** Cruise speed in world units per second (1 unit = 100 nm). */
  cruise = 7;
  settings: PlayerSettings = { sensitivity: 1, invertY: false };
  /** When set, a sequence (tour/story/travel) drives position and gaze. */
  scripted = false;
  /** Running totals used by the first-run coaching. */
  lookTravel = 0;
  swimTravel = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly input: Input,
    private readonly confine: (p: THREE.Vector3) => void,
  ) {}

  lookAt(target: THREE.Vector3): void {
    const d = this.tmp.copy(target).sub(this.position).normalize();
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  }

  forward(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(0, 0, -1).applyEuler(this.euler.set(this.pitch, this.yaw, 0, 'YXZ'));
  }

  update(dt: number): void {
    const look = this.input.consumeLook();
    this.lookTravel += Math.abs(look.dx) + Math.abs(look.dy);
    const k = 0.0022 * this.settings.sensitivity;
    this.yaw -= look.dx * k;
    this.pitch -= look.dy * k * (this.settings.invertY ? -1 : 1);
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.53, 1.53);

    const wheel = this.input.consumeWheel();
    if (wheel !== 0) this.cruise = THREE.MathUtils.clamp(this.cruise * Math.pow(0.85, wheel), 1, 40);

    if (!this.scripted) {
      const fwd = this.forward();
      const right = this.tmp.crossVectors(fwd, UP).normalize();
      const accel = new THREE.Vector3()
        .addScaledVector(fwd, this.input.axis('KeyS', 'KeyW'))
        .addScaledVector(right, this.input.axis('KeyA', 'KeyD'))
        .addScaledVector(UP, this.input.axis('KeyC', 'Space'));
      if (accel.lengthSq() > 0) accel.normalize();
      const boost = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight') ? 3.5 : 1;
      // Low Reynolds number: you stop almost as soon as you stop swimming.
      this.velocity.addScaledVector(accel, this.cruise * boost * 6 * dt);
      this.velocity.multiplyScalar(Math.exp(-6 * dt));
      this.position.addScaledVector(this.velocity, dt);
      this.swimTravel += this.velocity.length() * dt;
      this.confine(this.position);
    }

    this.camera.position.copy(this.position);
    this.camera.quaternion.setFromEuler(this.euler.set(this.pitch, this.yaw, 0, 'YXZ'));
  }

  /** Called by the sequencer: move along its path and ease the gaze toward its target. */
  drive(pos: THREE.Vector3, lookTarget: THREE.Vector3, dt: number, gazeEase = 2.5): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    const d = this.tmp.copy(lookTarget).sub(pos).normalize();
    const targetYaw = Math.atan2(-d.x, -d.z);
    const targetPitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    let dy = targetYaw - this.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const a = 1 - Math.exp(-gazeEase * dt);
    this.yaw += dy * a;
    this.pitch += (targetPitch - this.pitch) * a;
  }
}
