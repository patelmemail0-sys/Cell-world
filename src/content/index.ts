import { CODEX } from './codex';
import { CODEX_EXTRA } from './codexExtra';
import type { CodexEntry } from './types';

// Enlargement factors as actually drawn in the 3D world, where they differ from the
// writer's defaults. Kept here so the panel never claims a scale the model does not use.
const DRAWN_ENLARGEMENT: Record<string, number | undefined> = {
  ribosome: 2.2,
  'small-subunit': 2.2,
  'large-subunit': 2.2,
  trna: 2.2,
  'nascent-chain': 2.2,
  sec61: 2.2,
  srp: 2.2,
  'signal-peptidase': 2.2,
  bip: 2.2,
  ost: 2.2,
  pdi: 2.2,
  proteasome: 2.2,
  'core-20s': 2.2,
  'cap-19s': 2.2,
  serca: 2.5,
  'ip3-receptor': 2.5,
  'cytochrome-p450': 2.5,
  'na-k-atpase': 8,
  'katp-channel': 8,
  'cav-channel': 8,
  glut: 8,
  aquaporin: 8,
  glp1r: 8,
  glycocalyx: 8,
  'snare-complex': 4,
  'complex-i': 2.5,
  'complex-ii': 2.5,
  'complex-iii': 2.5,
  'complex-iv': 2.5,
  'atp-synthase': 2.5,
  ubiquinone: 2.5,
  'cytochrome-c': 2.5,
  microtubule: 1.6,
  'tubulin-dimer': 1.6,
  kinesin: 3,
  'nuclear-pore': undefined,
};

export const ALL_ENTRIES: CodexEntry[] = [...CODEX, ...CODEX_EXTRA].map((e) =>
  e.id in DRAWN_ENLARGEMENT ? { ...e, enlargement: DRAWN_ENLARGEMENT[e.id] } : e,
);

const byId = new Map(ALL_ENTRIES.map((e) => [e.id, e]));

export function entry(id: string): CodexEntry | undefined {
  return byId.get(id);
}

export function childrenOf(id: string): CodexEntry[] {
  return ALL_ENTRIES.filter((e) => e.parent === id);
}

export function topLevel(): CodexEntry[] {
  return ALL_ENTRIES.filter((e) => e.parent === null);
}

/** Chain from the organelle-level ancestor down to the entry itself. */
export function lineage(id: string): CodexEntry[] {
  const out: CodexEntry[] = [];
  let cur = byId.get(id);
  while (cur) {
    out.unshift(cur);
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  return out;
}

export type { CodexEntry } from './types';
