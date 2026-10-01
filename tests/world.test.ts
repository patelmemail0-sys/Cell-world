import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { ALL_ENTRIES, entry } from '../src/content';
import { STORY, TOUR } from '../src/content/sequences';
import { Cell } from '../src/world/Cell';
import { buildLayout, capsuleSdf, ellipsoidRatio } from '../src/world/layout';
import { computeState, GSIS_PERIOD, type CellState } from '../src/world/state';
import type { PickTag } from '../src/world/kit';

// The whole cell is built without a renderer: geometry, anchors, pick tags and compartments
// are plain data, so they can be checked headlessly.
let cell: Cell;

beforeAll(() => {
  const camera = new THREE.PerspectiveCamera();
  cell = new Cell(new THREE.Scene(), camera, 'high');
  // One frame, so anything that resolves on the first update (moving vesicles, motors) is live.
  camera.position.set(...cell.layout.spawn.position);
  cell.update({ dt: 0.016, time: 0.016, pt: 0.016, pdt: 0.016, camera, quality: 'high', reducedMotion: false });
});

describe('layout', () => {
  it('is deterministic for a given seed', () => {
    expect(JSON.stringify(buildLayout(7))).toBe(JSON.stringify(buildLayout(7)));
  });

  it('keeps organelles inside the cell and out of the nucleus', () => {
    const L = buildLayout();
    for (const m of L.mitochondria) {
      expect(ellipsoidRatio(m.center, [0, 0, 0], L.cell.radii)).toBeLessThan(0.9);
      expect(ellipsoidRatio(m.center, L.nucleus.center, L.nucleus.radii)).toBeGreaterThan(1.3);
    }
    for (const g of L.granules) expect(ellipsoidRatio(g.center, [0, 0, 0], L.cell.radii)).toBeLessThan(0.97);
  });

  it('measures capsule distance from the surface', () => {
    const cap = { center: [0, 0, 0] as [number, number, number], dir: [0, 1, 0] as [number, number, number], length: 10, radius: 2 };
    expect(capsuleSdf([0, 0, 0], cap)).toBeCloseTo(-2);
    expect(capsuleSdf([2, 0, 0], cap)).toBeCloseTo(0);
    expect(capsuleSdf([0, 5, 0], cap)).toBeCloseTo(0);
    expect(capsuleSdf([0, 7, 0], cap)).toBeCloseTo(2);
  });
});

describe('world', () => {
  it('gives every codex entry a place to travel to', () => {
    const missing = ALL_ENTRIES.map((e) => e.id).filter((id) => !cell.kit.anchors.has(id));
    expect(missing).toEqual([]);
  });

  it('only tags scannable objects with ids the codex knows', () => {
    const unknown = new Set<string>();
    for (const obj of cell.kit.pickables) {
      const tag = obj.userData.pick as PickTag;
      const ids: (string | null | undefined)[] = [tag.nearEntity];
      if (typeof tag.entity === 'function') {
        const count = (obj as THREE.InstancedMesh).count ?? 1;
        for (let i = 0; i < count; i++) ids.push(tag.entity(i));
      } else ids.push(tag.entity);
      for (const id of ids) if (id && !entry(id)) unknown.add(id);
    }
    expect([...unknown]).toEqual([]);
  });

  it('makes every codex entry scannable somewhere in the cell', () => {
    const scannable = new Set<string>();
    for (const obj of cell.kit.pickables) {
      const tag = obj.userData.pick as PickTag;
      if (tag.nearEntity) scannable.add(tag.nearEntity);
      if (typeof tag.entity === 'function') {
        const count = (obj as THREE.InstancedMesh).count ?? 1;
        for (let i = 0; i < count; i++) {
          const id = tag.entity(i);
          if (id) scannable.add(id);
        }
      } else scannable.add(tag.entity);
    }
    // Compartments with no surface of their own are reached through the things inside them.
    const missing = ALL_ENTRIES.map((e) => e.id).filter((id) => !scannable.has(id));
    expect(missing).toEqual([]);
  });

  it('routes the tour and the story through real anchors and entries', () => {
    for (const stop of [...TOUR, ...STORY]) {
      expect(cell.kit.anchors.has(stop.anchor), `anchor ${stop.anchor}`).toBe(true);
      expect(entry(stop.entity), `entity ${stop.entity}`).toBeDefined();
      expect(stop.caption.length).toBeGreaterThan(40);
    }
  });

  it('classifies compartments', () => {
    const at = (x: number, y: number, z: number) => cell.kit.compartmentAt(new THREE.Vector3(x, y, z)).label;
    const L = cell.layout;
    expect(at(...L.spawn.position)).toBe('Cytosol');
    expect(at(L.nucleus.center[0] + 12, L.nucleus.center[1], L.nucleus.center[2])).toBe('Nucleoplasm');
    expect(at(...L.nucleus.nucleoli[0].center)).toBe('Nucleolus');
    const m = L.mitochondria[0];
    expect(['Mitochondrial matrix', 'Intermembrane space']).toContain(at(...m.center));
    expect(at(...L.lysosomes[0].center)).toBe('Lysosome lumen');
    expect(at(...L.peroxisomes[0].center)).toBe('Peroxisomal matrix');
  });

  it('puts every viewpoint inside the cell', () => {
    for (const [key, a] of cell.kit.anchors) {
      const v = a.view();
      expect(Number.isFinite(v.x + v.y + v.z), key).toBe(true);
      expect(ellipsoidRatio([v.x, v.y, v.z], [0, 0, 0], cell.layout.cell.radii), key).toBeLessThan(1);
    }
  });

  it('keeps the player inside the plasma membrane', () => {
    const p = new THREE.Vector3(500, 0, 0);
    cell.confine(p);
    expect(ellipsoidRatio([p.x, p.y, p.z], [0, 0, 0], cell.layout.cell.radii)).toBeLessThanOrEqual(0.986);
  });

  it('runs a frame without touching the DOM or a renderer', () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(...cell.layout.spawn.position);
    expect(() => cell.update({ dt: 0.016, time: 1, pt: 1, pdt: 0.016, camera, quality: 'high', reducedMotion: false })).not.toThrow();
  });
});

describe('glucose-stimulated insulin secretion loop', () => {
  const at = (phase: number): CellState => computeState(phase * GSIS_PERIOD, {} as CellState);

  it('rests at about -70 mV with K_ATP channels open and no secretion', () => {
    const s = at(0.03);
    expect(s.stage).toBe('rest');
    expect(s.vm).toBeCloseTo(-70, 0);
    expect(s.katpOpen).toBeGreaterThan(0.95);
    expect(s.secretion).toBeLessThan(0.01);
  });

  it('follows the causal order glucose -> ATP -> K_ATP closure -> depolarization -> Ca2+ -> secretion', () => {
    const onset = (pick: (s: CellState) => number, threshold: number): number => {
      for (let i = 0; i <= 1000; i++) if (pick(at(i / 1000)) > threshold) return i / 1000;
      return Infinity;
    };
    const glucose = onset((s) => s.glucoseMM, 8);
    const atp = onset((s) => s.atp, 0.5);
    const closed = onset((s) => 1 - s.katpOpen, 0.5);
    const depol = onset((s) => s.vm, -55);
    const calcium = onset((s) => s.calcium, 0.5);
    const secretion = onset((s) => s.secretion, 0.5);
    expect(glucose).toBeLessThan(atp);
    expect(atp).toBeLessThan(closed);
    expect(closed).toBeLessThan(depol);
    expect(depol).toBeLessThan(calcium);
    expect(calcium).toBeLessThan(secretion);
  });

  it('stays within physiological bounds all the way round', () => {
    for (let i = 0; i < 400; i++) {
      const s = at(i / 400);
      expect(s.vm).toBeGreaterThanOrEqual(-71);
      expect(s.vm).toBeLessThanOrEqual(-15);
      expect(s.glucoseMM).toBeGreaterThanOrEqual(4.4);
      expect(s.glucoseMM).toBeLessThanOrEqual(12.1);
    }
  });
});
