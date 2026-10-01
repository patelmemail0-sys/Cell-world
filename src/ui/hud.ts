import * as THREE from 'three';
import { entry, lineage } from '../content';
import { formatNm, formatRange, niceBarNm, unitsToNm } from '../engine/units';
import type { SequenceView } from '../engine/Sequencer';
import { STAGE_LABEL, type CellState } from '../world/state';
import type { Layout } from '../world/layout';

// Heads-up display: where you are, what you are pointing at, the cell's physiological
// state, a scale bar in real units, tour captions, and a small position navigator.

const $ = (id: string): HTMLElement => document.getElementById(id)!;

export class Hud {
  private readonly root = $('hud');
  private readonly compartment = $('compartment');
  private readonly modeLine = $('mode-line');
  private readonly crosshair = $('crosshair');
  private readonly tag = $('tag');
  private readonly tagName = $('tag-name');
  private readonly tagSub = $('tag-sub');
  private readonly scaleLine = $('scale-line');
  private readonly scaleLabel = $('scale-label');
  private readonly scaleTarget = $('scale-target');
  private readonly caption = $('caption');
  private readonly toast = $('toast');
  private readonly nav = ($('navigator') as HTMLCanvasElement).getContext('2d')!;
  private toastTimer = 0;
  private lastEntity: string | null = '';
  private lastCompartment = '';
  private navAcc = 0;
  labels = true;

  show(on: boolean): void {
    this.root.hidden = !on;
  }

  setCompartment(label: string): void {
    if (label === this.lastCompartment) return;
    this.lastCompartment = label;
    this.compartment.textContent = label;
  }

  setModeLine(text: string): void {
    this.modeLine.textContent = text;
  }

  setTarget(entityId: string | null): void {
    if (entityId === this.lastEntity) return;
    this.lastEntity = entityId;
    const e = entityId ? entry(entityId) : undefined;
    this.crosshair.classList.toggle('hot', !!e);
    if (!e || !this.labels) {
      this.tag.hidden = true;
      this.scaleTarget.textContent = '';
      return;
    }
    this.tag.hidden = false;
    this.tagName.textContent = e.name;
    const chain = lineage(e.id);
    this.tagSub.textContent = chain.length > 1 ? `${chain[0].name} · press E` : 'press E';
    this.scaleTarget.textContent = `${e.name}: ${formatRange(e.sizeNm)}${e.enlargement ? `, drawn ~${e.enlargement}× larger` : ''}`;
  }

  /** Scale bar for the distance to whatever is under the crosshair (or 10 units ahead). */
  setScale(distance: number, camera: THREE.PerspectiveCamera): void {
    const worldPerPx = (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / window.innerHeight;
    const nm = niceBarNm(unitsToNm(worldPerPx * 120));
    const px = nm / unitsToNm(worldPerPx);
    this.scaleLine.style.width = `${Math.max(8, px).toFixed(0)}px`;
    this.scaleLabel.textContent = `${formatNm(nm)} at this distance`;
  }

  setState(s: CellState): void {
    $('st-glucose').textContent = `${s.glucoseMM.toFixed(1)} mM`;
    $('st-atp').style.width = `${Math.round(10 + s.atp * 90)}%`;
    $('st-vm').textContent = `${Math.round(s.vm)} mV`;
    $('st-stage').textContent = STAGE_LABEL[s.stage];
  }

  setTimeScale(scale: number, paused: boolean, inspect = 1): void {
    const chip = $('time-chip');
    if (paused) chip.textContent = 'Processes paused';
    else if (inspect < 0.9) chip.textContent = `Slowed ${Math.round(1 / inspect)}× while you read`;
    else chip.textContent = `Processes ${scale}×`;
    chip.classList.toggle('accent', !paused && inspect < 0.9);
  }

  setCutaway(on: boolean): void {
    $('xray-chip').hidden = !on;
  }

  setSequence(view: SequenceView, holdProgress: number): void {
    const s = view.stop;
    if (!s || view.mode === 'travel' || view.mode === 'free') {
      this.caption.hidden = true;
      return;
    }
    this.caption.hidden = false;
    $('caption-step').textContent = `${view.mode === 'story' ? 'The insulin story' : 'Guided tour'} · ${view.index + 1} of ${view.total}`;
    $('caption-title').textContent = s.title;
    $('caption-text').textContent = s.caption;
    $('caption-real').textContent = s.real ? `Real time: ${s.real}` : '';
    $('caption-progress').style.width = `${Math.round(holdProgress * 100)}%`;
  }

  flash(message: string, seconds = 2.6): void {
    this.toast.textContent = message;
    this.toast.hidden = false;
    this.toastTimer = seconds;
  }

  ripple(): void {
    const el = $('ripple');
    el.classList.remove('go');
    void el.offsetWidth;
    el.classList.add('go');
  }

  cut(): void {
    const el = $('fade');
    el.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('on')));
  }

  update(dt: number): void {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast.hidden = true;
    }
  }

  /** Top-down locator: the cell outline, nucleus, Golgi, mitochondria, and you. */
  drawNavigator(dt: number, layout: Layout, pos: THREE.Vector3, yaw: number): void {
    this.navAcc += dt;
    if (this.navAcc < 0.1) return;
    this.navAcc = 0;
    const c = this.nav;
    const S = 132;
    const k = (S / 2 - 8) / layout.cell.radii[0];
    const X = (x: number) => S / 2 + x * k;
    const Z = (z: number) => S / 2 + z * k;
    c.clearRect(0, 0, S, S);
    c.lineWidth = 1.5;
    c.strokeStyle = 'rgba(255, 215, 168, 0.8)';
    c.beginPath();
    c.ellipse(S / 2, S / 2, layout.cell.radii[0] * k, layout.cell.radii[2] * k, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(142, 108, 255, 0.55)';
    c.beginPath();
    c.ellipse(X(layout.nucleus.center[0]), Z(layout.nucleus.center[2]), layout.nucleus.radii[0] * k, layout.nucleus.radii[2] * k, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(240, 166, 64, 0.9)';
    c.fillRect(X(layout.golgi.center[0]) - 4, Z(layout.golgi.center[2]) - 2, 8, 4);
    c.fillStyle = 'rgba(255, 106, 61, 0.85)';
    for (const m of layout.mitochondria) {
      c.beginPath();
      c.arc(X(m.center[0]), Z(m.center[2]), 2, 0, Math.PI * 2);
      c.fill();
    }
    // Player arrow.
    c.save();
    c.translate(X(pos.x), Z(pos.z));
    c.rotate(-yaw);
    c.fillStyle = '#59e0d0';
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(4.5, 5);
    c.lineTo(0, 2.5);
    c.lineTo(-4.5, 5);
    c.closePath();
    c.fill();
    c.restore();
  }
}

// ---- landmark labels -------------------------------------------------------------------------

export interface Landmark {
  id: string;
  name: string;
  /** One or more world positions; the nearest suitable one is labelled. */
  points: THREE.Vector3[];
  /** Approximate radius: the label hides once you are this close (you have arrived). */
  radius: number;
}

/** Floating names on the big structures, so there is always something to steer toward. */
export class Landmarks {
  private readonly root = $('landmarks');
  private readonly els = new Map<string, HTMLElement>();
  private readonly v = new THREE.Vector3();
  enabled = true;

  constructor(private readonly list: Landmark[]) {
    for (const l of list) {
      const el = document.createElement('div');
      el.className = 'landmark';
      el.innerHTML = `${l.name}<small></small>`;
      el.style.opacity = '0';
      this.root.appendChild(el);
      this.els.set(l.id, el);
    }
  }

  update(camera: THREE.PerspectiveCamera, visible: boolean): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const shown: { el: HTMLElement; d: number; x: number; y: number; a: number }[] = [];
    for (const l of this.list) {
      const el = this.els.get(l.id)!;
      let best: { d: number; x: number; y: number } | null = null;
      if (visible && this.enabled) {
        for (const p of l.points) {
          const d = p.distanceTo(camera.position);
          if (d < l.radius + 5 || d > 95) continue;
          this.v.copy(p).project(camera);
          if (this.v.z > 1 || Math.abs(this.v.x) > 0.92 || Math.abs(this.v.y) > 0.86) continue;
          // Leave the centre of the view to the crosshair's own name tag.
          if (Math.hypot(this.v.x, this.v.y) < 0.1) continue;
          if (!best || d < best.d) best = { d, x: (this.v.x * 0.5 + 0.5) * w, y: (-this.v.y * 0.5 + 0.5) * h };
        }
      }
      if (!best) {
        el.style.opacity = '0';
        continue;
      }
      const fade = Math.min(1, (best.d - l.radius - 5) / 6) * Math.min(1, (95 - best.d) / 25);
      shown.push({ el, d: best.d, x: best.x, y: best.y, a: fade });
    }
    // Only the nearest few, so the view never fills with text.
    shown.sort((a, b) => a.d - b.d);
    shown.forEach((s, i) => {
      if (i >= 5) {
        s.el.style.opacity = '0';
        return;
      }
      s.el.style.opacity = (s.a * 0.9).toFixed(2);
      s.el.style.transform = `translate(${s.x.toFixed(0)}px, ${(s.y - 8).toFixed(0)}px)`;
      (s.el.lastElementChild as HTMLElement).textContent = `${formatNm(unitsToNm(s.d))} away`;
    });
  }
}

// ---- first-run coaching ----------------------------------------------------------------------

export interface CoachStep {
  html: string;
  /** Returns true once the player has done the thing. */
  done: (s: CoachSignals) => boolean;
}

export interface CoachSignals {
  looked: number;
  moved: number;
  inspected: boolean;
  seconds: number;
}

/** One instruction at a time; each advances when the player actually does it. */
export class Coach {
  private readonly el = $('coach');
  private readonly text = $('coach-text');
  private readonly dots = $('coach-dots');
  private index = -1;
  private since = 0;
  active = false;
  onDone?: () => void;

  constructor(private readonly steps: CoachStep[]) {}

  start(): void {
    this.active = true;
    this.go(0);
  }

  stop(): void {
    this.active = false;
    this.el.hidden = true;
  }

  private go(i: number): void {
    this.index = i;
    this.since = 0;
    if (i >= this.steps.length) {
      this.stop();
      this.onDone?.();
      return;
    }
    this.text.innerHTML = this.steps[i].html;
    this.dots.innerHTML = this.steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('');
    this.el.hidden = false;
  }

  /** Call every frame with running totals; `suspended` hides the card under overlays. */
  update(dt: number, signals: Omit<CoachSignals, 'seconds'>, suspended: boolean): void {
    if (!this.active) return;
    this.el.hidden = suspended;
    if (suspended) return;
    this.since += dt;
    // Give each instruction a moment on screen even if the player is already doing it.
    if (this.since > 1.2 && this.steps[this.index].done({ ...signals, seconds: this.since })) this.go(this.index + 1);
  }
}
