import { describe, expect, it } from 'vitest';
import { ALL_ENTRIES, childrenOf, entry, lineage, topLevel } from '../src/content';
import { REFERENCES } from '../src/content/references';

describe('codex', () => {
  it('has unique ids', () => {
    const ids = ALL_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('links every child to an existing parent', () => {
    for (const e of ALL_ENTRIES) {
      if (e.parent !== null) expect(entry(e.parent), `${e.id} -> ${e.parent}`).toBeDefined();
    }
  });

  it('gives every entry the fields the info panel shows', () => {
    for (const e of ALL_ENTRIES) {
      expect(e.name.length, e.id).toBeGreaterThan(1);
      expect(e.summary.length, e.id).toBeGreaterThan(30);
      expect(e.function.length, e.id).toBeGreaterThan(60);
      expect(e.accuracy.length, e.id).toBeGreaterThan(30);
      expect(e.facts.length, e.id).toBeGreaterThanOrEqual(1);
      expect(e.sizeNm[0], e.id).toBeGreaterThan(0);
      expect(e.sizeNm[0], e.id).toBeLessThanOrEqual(e.sizeNm[1]);
    }
  });

  it('cites a known reference on every organelle-level entry', () => {
    for (const e of topLevel()) {
      expect(e.references?.length ?? 0, e.id).toBeGreaterThanOrEqual(1);
      for (const key of e.references ?? []) expect(REFERENCES[key], `${e.id} cites ${key}`).toBeDefined();
    }
  });

  it('only cites known references anywhere', () => {
    for (const e of ALL_ENTRIES) for (const key of e.references ?? []) expect(REFERENCES[key], `${e.id} cites ${key}`).toBeDefined();
  });

  it('writes processes as ordered steps with a stated real rate', () => {
    for (const e of ALL_ENTRIES) {
      if (!e.processes) continue;
      expect(e.realRate, `${e.id} needs a real rate for the slow-motion badge`).toBeTruthy();
      for (const p of e.processes) {
        expect(p.steps.length, `${e.id}/${p.id}`).toBeGreaterThanOrEqual(3);
        expect(p.steps.length, `${e.id}/${p.id}`).toBeLessThanOrEqual(8);
      }
    }
  });

  it('covers the whole cell: 18 organelle-level entries and their parts', () => {
    expect(topLevel().length).toBe(18);
    expect(ALL_ENTRIES.length).toBeGreaterThanOrEqual(95);
    expect(childrenOf('mitochondrion').length).toBeGreaterThanOrEqual(12);
  });

  it('resolves lineage from organelle down to part', () => {
    expect(lineage('atp-synthase').map((e) => e.id)).toEqual(['mitochondrion', 'atp-synthase']);
  });

  it('keeps human-specific facts straight', () => {
    // Human peroxisomes have no urate oxidase crystalloid core.
    const perox = entry('peroxisome')!;
    expect(`${perox.summary} ${perox.function} ${perox.accuracy} ${(perox.structure ?? []).join(' ')}`.toLowerCase()).not.toMatch(/crystalline core of urate/);
    // Na+/K+ pump stoichiometry.
    const pump = JSON.stringify(entry('na-k-atpase'));
    expect(pump).toMatch(/3 Na\+/);
    expect(pump).toMatch(/2 K\+/);
    // Mammalian ATP synthase c-ring.
    expect(JSON.stringify(entry('atp-synthase'))).toMatch(/8 c/);
  });
});
