import * as THREE from 'three';
import './ui/styles.css';
import { Engine } from './engine/Engine';
import { Input } from './engine/Input';
import { Player } from './engine/Player';
import { Picker } from './engine/Picker';
import { Sequencer } from './engine/Sequencer';
import { Ambience } from './engine/Audio';
import { Cell } from './world/Cell';
import { cellState, storyBeat } from './world/state';
import type { FrameCtx } from './world/types';
import { ALL_ENTRIES, entry } from './content';
import { v3 } from './fx/geom';
import { STORY, TOUR } from './content/sequences';
import { Store } from './ui/store';
import { Coach, Hud, Landmarks, type Landmark } from './ui/hud';
import { Panel } from './ui/panel';
import { CodexView } from './ui/codexView';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const CONTROLS: [string, string][] = [
  ['Mouse', 'look around'],
  ['W A S D', 'swim'],
  ['Space / C', 'up / down'],
  ['Shift', 'boost'],
  ['Scroll', 'cruise speed'],
  ['E or click', 'inspect'],
  ['Tab', 'codex'],
  ['T', 'guided tour'],
  ['G', 'insulin story'],
  ['X', 'cutaway view'],
  ['[ ]', 'slow / speed processes'],
  ['P', 'pause processes'],
  ['M', 'sound on / off'],
  ['Esc', 'menu'],
];

const TIME_SCALES = [0.25, 0.5, 1, 2, 4];

type Overlay = 'none' | 'panel' | 'codex' | 'menu';

function boot(): void {
  const controlsHtml = CONTROLS.map(([k, v]) => `<span><kbd>${k}</kbd> ${v}</span>`).join('');
  $('start-controls').innerHTML = controlsHtml;
  $('controls-grid').innerHTML = controlsHtml;

  if (!Engine.webgl2Available()) {
    $('start').hidden = true;
    $('unsupported').hidden = false;
    return;
  }
  const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
  $('mobile-note').hidden = !coarse;

  const store = new Store();
  const debug = new URLSearchParams(location.search).has('debug');
  const canvas = $<HTMLCanvasElement>('scene');
  const engine = new Engine(canvas);
  engine.setQuality(store.settings.quality);

  // Let the start screen paint before the (synchronous) world build.
  setTimeout(() => run(engine, store, canvas, debug), 60);
}

function run(engine: Engine, store: Store, canvas: HTMLCanvasElement, debug: boolean): void {
  const cell = new Cell(engine.scene, engine.camera, store.settings.quality);
  engine.onResize = (h, fov) => cell.particles.setViewportHeight(h, fov);
  engine.resize();

  const input = new Input(canvas);
  const player = new Player(engine.camera, input, cell.confine);
  const spawn = cell.kit.anchors.get('spawn')!;
  player.position.copy(spawn.view());
  player.lookAt(spawn.target());
  const picker = new Picker(engine.camera, cell.kit);
  const sequencer = new Sequencer(player, cell.kit, cell.particles.pool(6, 0xffb3e6, 0.16));
  const hud = new Hud();
  const ambience = new Ambience();

  // Names floating on the big structures, so there is always something to head for.
  const L = cell.layout;
  const mark = (id: string, points: THREE.Vector3[], radius: number): Landmark => ({ id, name: entry(id)?.name ?? id, points, radius });
  const landmarks = new Landmarks([
    mark('nucleus', [v3(L.nucleus.center)], 23),
    mark('golgi', [v3(L.golgi.center)], 8),
    mark('rough-er', [cell.kit.anchors.get('rough-er')!.target()], 5),
    mark('smooth-er', [v3(L.smoothEr.center)], 13),
    mark('centrosome', [v3(L.centrosome.center)], 4),
    mark('mitochondrion', L.mitochondria.map((m) => v3(m.center)), 6),
    mark('lysosome', L.lysosomes.map((b) => v3(b.center)), 3),
    mark('peroxisome', L.peroxisomes.map((b) => v3(b.center)), 2.5),
    mark('endosome', [...L.earlyEndosomes, ...L.lateEndosomes].map((b) => v3(b.center)), 3),
    mark('autophagosome', [v3(L.autophagosome.center)], 5),
  ]);
  let inspected = false;
  let coach: Coach | null = null;
  const startCoach = () => {
    if (store.coached || coach?.active) return;
    coach = new Coach([
      { html: input.fallback ? 'Drag to look around.' : 'Move the mouse to look around.', done: (g) => g.looked > 500 },
      { html: 'Swim with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>. <kbd>Space</kbd> rises, <kbd>C</kbd> sinks, <kbd>Shift</kbd> boosts.', done: (g) => g.moved > 8 },
      { html: 'Point the circle at anything and press <kbd>E</kbd> to learn what it is and watch it work.', done: (g) => g.inspected },
      { html: 'Press <kbd>T</kbd> for a guided tour, <kbd>G</kbd> to follow an insulin molecule, or <kbd>Tab</kbd> for the codex.', done: (g) => g.seconds > 10 },
    ]);
    coach.onDone = () => store.markCoached();
    player.lookTravel = 0;
    player.swimTravel = 0;
    inspected = false;
    coach.start();
  };

  let started = false;
  let overlay: Overlay = 'none';
  let time = 0;
  let pt = 0;
  let scaleIdx = 2;
  let processPaused = false;
  // While a panel is open the cell slows so each step of the process can be read as it happens.
  let inspectScale = 1;
  let progressRate: number | null = null;
  let lastProgress: number | null = null;
  let lastInspected: string | null = null;

  const applySettings = () => {
    const s = store.settings;
    player.settings.sensitivity = s.sensitivity;
    player.settings.invertY = s.invertY;
    sequencer.reducedMotion = s.reducedMotion;
    hud.labels = s.labels;
    ambience.setEnabled(s.sound);
  };
  applySettings();

  // ---- overlays and pointer lock ---------------------------------------------------------
  const engage = async () => {
    // Take the controls back. Called from a user gesture (key or click).
    overlay = 'none';
    $('resume').hidden = true;
    input.enabled = true;
    sequencer.paused = false;
    if (input.fallback) return;
    const ok = await input.requestLock();
    if (!ok && input.everLocked) {
      // The browser refused to re-lock without a click; ask for one.
      input.enabled = false;
      sequencer.paused = true;
      $('resume').hidden = false;
    }
  };
  const disengage = (next: Overlay) => {
    overlay = next;
    input.enabled = false;
    sequencer.paused = true;
    input.releaseLock();
  };
  input.onUnexpectedUnlock = () => {
    if (started && overlay === 'none') openMenu();
  };
  $('resume').addEventListener('click', () => void engage());

  const panel = new Panel(store, {
    onOpen: (id) => panel.show(id),
    onClose: () => closePanel(),
    onTravel: (id) => travel(id),
  });
  const codex = new CodexView(store, {
    onOpen: (id) => {
      codex.close();
      openPanel(id);
    },
    onTravel: (id) => travel(id),
    onClose: () => closeCodex(),
  });

  function openPanel(id: string): void {
    if (!panel.show(id)) return;
    inspected = true;
    $('menu').hidden = true;
    disengage('panel');
  }
  function closePanel(): void {
    panel.hide();
    void engage();
  }
  function openCodex(): void {
    panel.hide();
    $('menu').hidden = true;
    codex.open();
    disengage('codex');
  }
  function closeCodex(): void {
    codex.close();
    void engage();
  }
  function openMenu(): void {
    panel.hide();
    codex.close();
    syncSettingsForm();
    $('menu').hidden = false;
    disengage('menu');
  }
  function closeMenu(): void {
    $('menu').hidden = true;
    void engage();
  }
  function closeAll(): void {
    panel.hide();
    codex.close();
    $('menu').hidden = true;
  }

  function travel(id: string): void {
    const e = entry(id);
    closeAll();
    void engage();
    if (!sequencer.travel(id, e?.name ?? id)) hud.flash('No route to that structure yet.');
    else hud.flash(`Travelling to ${e?.name ?? id}`);
  }
  function startSequence(mode: 'tour' | 'story'): void {
    closeAll();
    void engage();
    if (sequencer.mode === mode) {
      sequencer.stop();
      hud.flash('You have the controls.');
      return;
    }
    sequencer.start(mode, mode === 'tour' ? TOUR : STORY);
  }
  function setCutaway(on: boolean): void {
    cell.setCutaway(on);
    hud.setCutaway(on);
  }

  function scan(): void {
    const hit = picker.pick();
    const id = hit?.entity ?? (sequencer.mode !== 'free' ? sequencer.view.stop?.entity : undefined);
    if (id && entry(id)) {
      ambience.blip();
      openPanel(id);
    } else hud.flash('Nothing in range. Fly closer and point at something.');
  }
  input.onScanClick = () => {
    if (overlay === 'none' && started) scan();
  };

  store.onDiscover = (id, total) => {
    const e = entry(id);
    if (e) hud.flash(`Discovered: ${e.name}  (${total} / ${ALL_ENTRIES.length})`);
  };
  sequencer.onChange = (view) => {
    hud.setModeLine(view.mode === 'tour' ? 'Guided tour' : view.mode === 'story' ? 'Following an insulin molecule' : view.mode === 'travel' ? 'Travelling' : '');
    if (view.arrived && view.stop && view.mode !== 'travel') store.discover(view.stop.entity);
    // Leaving a tour for the first time: teach the controls.
    if (view.mode === 'free' && started) startCoach();
  };
  sequencer.onCut = () => hud.cut();

  // ---- keys ------------------------------------------------------------------------------
  input.onKey = (code) => {
    if (!started) return;
    if (overlay === 'menu') {
      if (code === 'Escape') closeMenu();
      return;
    }
    if (overlay === 'codex') {
      if (code === 'Tab' || code === 'Escape') closeCodex();
      return;
    }
    if (overlay === 'panel') {
      if (code === 'KeyE' || code === 'Escape') closePanel();
      else if (code === 'Tab') openCodex();
      return;
    }
    switch (code) {
      case 'KeyE': scan(); break;
      case 'Tab': openCodex(); break;
      case 'KeyT': startSequence('tour'); break;
      case 'KeyG': startSequence('story'); break;
      case 'KeyX': setCutaway(!cell.cutaway); break;
      case 'KeyP': processPaused = !processPaused; break;
      case 'BracketLeft': scaleIdx = Math.max(0, scaleIdx - 1); break;
      case 'BracketRight': scaleIdx = Math.min(TIME_SCALES.length - 1, scaleIdx + 1); break;
      case 'KeyM':
        store.settings.sound = !store.settings.sound;
        store.save();
        applySettings();
        hud.flash(store.settings.sound ? 'Sound on' : 'Sound off');
        break;
      case 'ArrowRight':
      case 'Enter': sequencer.next(); break;
      case 'ArrowLeft': sequencer.prev(); break;
      case 'Escape': if (!input.locked) openMenu(); break;
    }
  };
  // Tab and Esc must still close the codex while the search box has focus.
  $('codex-search').addEventListener('keydown', (e) => {
    if (e.code === 'Tab' || e.code === 'Escape') {
      e.preventDefault();
      closeCodex();
    }
  });

  // ---- menu and settings -----------------------------------------------------------------
  const form = {
    quality: $<HTMLSelectElement>('set-quality'),
    sens: $<HTMLInputElement>('set-sens'),
    invert: $<HTMLInputElement>('set-invert'),
    motion: $<HTMLInputElement>('set-motion'),
    labels: $<HTMLInputElement>('set-labels'),
    sound: $<HTMLInputElement>('set-sound'),
  };
  function syncSettingsForm(): void {
    const s = store.settings;
    form.quality.value = s.quality;
    form.sens.value = String(s.sensitivity);
    form.invert.checked = s.invertY;
    form.motion.checked = s.reducedMotion;
    form.labels.checked = s.labels;
    form.sound.checked = s.sound;
  }
  const onSetting = () => {
    const s = store.settings;
    const qualityChanged = form.quality.value !== s.quality;
    s.quality = form.quality.value as typeof s.quality;
    s.sensitivity = Number(form.sens.value);
    s.invertY = form.invert.checked;
    s.reducedMotion = form.motion.checked;
    s.labels = form.labels.checked;
    s.sound = form.sound.checked;
    store.save();
    applySettings();
    if (qualityChanged) location.reload();
  };
  for (const el of Object.values(form)) el.addEventListener('change', onSetting);
  $('menu-resume').addEventListener('click', closeMenu);
  $('menu-tour').addEventListener('click', () => startSequence('tour'));
  $('menu-story').addEventListener('click', () => startSequence('story'));
  $('menu-codex').addEventListener('click', openCodex);

  // ---- start -----------------------------------------------------------------------------
  const begin = (withTour: boolean) => {
    if (started) return;
    started = true;
    $('start').classList.add('leaving');
    setTimeout(() => ($('start').hidden = true), 650);
    hud.show(true);
    ambience.start();
    applySettings();
    player.position.copy(spawn.view());
    player.lookAt(spawn.target());
    void engage().then(() => {
      if (withTour) sequencer.start('tour', TOUR);
      else startCoach();
    });
  };
  const enter = $<HTMLButtonElement>('enter');
  const enterTour = $<HTMLButtonElement>('enter-tour');
  enter.disabled = enterTour.disabled = false;
  $('start-status').textContent = `Cell ready: ${ALL_ENTRIES.length} structures to discover.`;
  enter.addEventListener('click', () => begin(false));
  enterTour.addEventListener('click', () => begin(true));

  // ---- frame loop ------------------------------------------------------------------------
  const ctx: FrameCtx = { dt: 0, time: 0, pt: 0, pdt: 0, camera: engine.camera, quality: store.settings.quality, reducedMotion: false };
  let last = performance.now();
  let lastCompartment = '';
  let simulate = true;
  window.addEventListener('blur', () => (simulate = false));
  window.addEventListener('focus', () => {
    simulate = true;
    last = performance.now();
  });

  const tick = (now: number) => {
    const frameMs = Math.max(0, now - last);
    const dt = Math.min(0.05, frameMs / 1000);
    last = now;
    if (!simulate && !debug) return;
    time += dt;
    const baseScale = processPaused ? 0 : TIME_SCALES[scaleIdx];
    const pdt = dt * baseScale * inspectScale;
    pt += pdt;
    ctx.dt = dt;
    ctx.time = time;
    ctx.pt = pt;
    ctx.pdt = pdt;
    ctx.reducedMotion = store.settings.reducedMotion;

    if (started) {
      if (sequencer.mode !== 'free' && input.anyMovementKey()) {
        sequencer.stop();
        hud.flash('You have the controls.');
      }
      sequencer.update(dt, time);
      // While the story describes a stage of the secretion loop, the cell plays that stage.
      const beat = sequencer.mode === 'story' ? sequencer.view.stop?.beat : undefined;
      storyBeat.range = beat ?? null;
      storyBeat.t = sequencer.view.arrived ? sequencer.holdProgress : 0;
      player.update(dt);
    } else {
      // Attract mode behind the start screen: a slow drift around the spawn point.
      const a = time * 0.05;
      player.position.copy(spawn.view()).add(_v.set(Math.sin(a) * 6, Math.sin(a * 0.7) * 2, Math.cos(a) * 6 - 6));
      player.lookAt(spawn.target());
      player.update(dt);
    }
    cell.update(ctx);

    if (started) {
      const hit = overlay === 'none' ? picker.update(dt) : picker.current;
      hud.setTarget(overlay === 'none' ? hit?.entity ?? null : null);
      hud.setScale(hit?.distance ?? 10, engine.camera);
      hud.setCompartment(cell.compartment.label);
      if (cell.compartment.label !== lastCompartment) {
        if (lastCompartment && !store.settings.reducedMotion) hud.ripple();
        lastCompartment = cell.compartment.label;
        ambience.setCompartment(cell.compartment.fogDensity);
      }
      hud.setState(cellState);
      hud.setTimeScale(TIME_SCALES[scaleIdx], processPaused, inspectScale);
      const view = sequencer.view;
      hud.setSequence(view, view.arrived ? sequencer.holdProgress : 0);
      hud.update(dt);
      hud.drawNavigator(dt, cell.layout, player.position, player.yaw);
      landmarks.enabled = store.settings.labels;
      // Landmarks are for finding your way across the cytosol; inside an organelle they are noise.
      landmarks.update(engine.camera, overlay === 'none' && cell.compartment.label === 'Cytosol');
      coach?.update(dt, { looked: player.lookTravel, moved: player.swimTravel, inspected }, overlay !== 'none' || sequencer.mode !== 'free');
      if (panel.current) {
        if (panel.current !== lastInspected) {
          lastInspected = panel.current;
          progressRate = lastProgress = null;
        }
        const progress = cell.processProgress(panel.current);
        panel.setProgress(progress);
        // Measure how fast this process cycles, then slow time so each step gets ~3 seconds.
        if (progress !== null && lastProgress !== null && pdt > 0) {
          const d = progress - lastProgress;
          if (d > 0 && d < 0.5) progressRate = progressRate === null ? d / pdt : progressRate + (d / pdt - progressRate) * 0.1;
        }
        lastProgress = progress;
        const steps = panel.liveSteps;
        const target = progress !== null && progressRate && steps && baseScale > 0 ? THREE.MathUtils.clamp(1 / (steps * 2.8 * progressRate * baseScale), 0.02, 1) : 1;
        inspectScale += (target - inspectScale) * Math.min(1, dt * 2.5);
      } else {
        lastInspected = null;
        inspectScale += (1 - inspectScale) * Math.min(1, dt * 3);
      }
    }
    engine.render(time, frameMs);
  };
  const loop = (now: number) => {
    requestAnimationFrame(loop);
    tick(now);
  };
  requestAnimationFrame(loop);

  // ---- debug API (?debug) ------------------------------------------------------------------
  if (debug) {
    const api = {
      start: () => begin(false),
      /** Advance n frames synchronously (for automated checks when the tab is not painting). */
      step: (n = 1, ms = 16.7) => {
        for (let i = 0; i < n; i++) tick(last + ms);
        return n;
      },
      teleport: (target: string | [number, number, number]) => {
        if (typeof target === 'string') {
          const a = cell.kit.anchors.get(target);
          if (!a) return false;
          player.position.copy(a.view());
          player.lookAt(a.target());
        } else player.position.set(...target);
        player.velocity.set(0, 0, 0);
        return true;
      },
      lookAt: (p: [number, number, number]) => player.lookAt(_v.set(...p)),
      anchors: () => [...cell.kit.anchors.keys()],
      entities: () => ALL_ENTRIES.map((e) => e.id),
      missingAnchors: () => ALL_ENTRIES.map((e) => e.id).filter((id) => !cell.kit.anchors.has(id)),
      stats: () => ({ ...engine.stats(), particles: cell.particles.usage }),
      scan: () => picker.pick()?.entity ?? null,
      inspect: (id: string) => openPanel(id),
      closePanel: () => closePanel(),
      compartment: () => cell.compartment.label,
      state: () => ({ ...cellState }),
      timeScale: (n: number) => {
        scaleIdx = Math.max(0, TIME_SCALES.indexOf(n));
      },
      setCutaway,
      membraneOpacity: () => cell.kit.membraneOpacityFactor(),
      travel: (id: string) => travel(id),
      tour: { start: () => startSequence('tour'), skip: () => sequencer.next(), stop: () => sequencer.stop() },
      story: { start: () => startSequence('story'), skip: () => sequencer.next(), stop: () => sequencer.stop() },
      sequence: () => sequencer.view,
      position: () => player.position.toArray(),
      discovered: () => store.discovered.size,
      progress: (id: string) => cell.processProgress(id),
      /** Direct handles for poking at the scene from the console. */
      raw: { engine, cell, player, picker, sequencer },
      /** Triangle count per visible mesh, largest first, to keep the scene within budget. */
      breakdown: () => {
        const rows: { what: string; tris: number; instances: number }[] = [];
        engine.scene.traverseVisible((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          const g = m.geometry;
          const per = (g.index ? g.index.count : g.attributes.position.count) / 3;
          const inst = (m as unknown as THREE.InstancedMesh).isInstancedMesh ? (m as unknown as THREE.InstancedMesh).count : 1;
          const tag = m.userData.pick?.entity;
          rows.push({ what: typeof tag === 'string' ? tag : (m.userData.pick?.nearEntity ?? m.type), tris: Math.round(per * inst), instances: inst });
        });
        return rows.sort((a, b) => b.tris - a.tris).slice(0, 22);
      },
    };
    (window as unknown as { __cell: typeof api }).__cell = api;
  }
}

const _v = new THREE.Vector3();

boot();
