// Cell-wide physiological state. A beta cell's defining behaviour is glucose-stimulated
// insulin secretion (GSIS): glucose in -> ATP/ADP up -> K_ATP channels close -> membrane
// depolarizes -> voltage-gated Ca2+ channels open -> Ca2+ triggers granule exocytosis.
// The whole cell cycles through that loop on the process clock, so the plasma membrane,
// mitochondria and granules all animate from the same state.

import { smoothstep } from '../fx/geom';

export const GSIS_PERIOD = 48; // process-seconds per full loop

export type GsisStage = 'rest' | 'glucose' | 'atp' | 'katp-close' | 'depolarize' | 'calcium' | 'secretion' | 'recover';

export interface CellState {
  /** 0..1 position in the GSIS loop. */
  phase: number;
  stage: GsisStage;
  /** Extracellular glucose, mM (shown value; fasting about 5, fed about 10+). */
  glucoseMM: number;
  /** 0..1 relative ATP/ADP ratio. */
  atp: number;
  /** 0..1 fraction of K_ATP channels open. */
  katpOpen: number;
  /** Membrane potential in mV. */
  vm: number;
  /** 0..1 voltage-gated Ca2+ channel opening. */
  cavOpen: number;
  /** 0..1 cytosolic Ca2+ near the membrane. */
  calcium: number;
  /** 0..1 exocytosis drive. */
  secretion: number;
}

export const STAGE_LABEL: Record<GsisStage, string> = {
  rest: 'Resting: K_ATP channels open, membrane at about -70 mV',
  glucose: 'Glucose rises and enters through GLUT1',
  atp: 'Mitochondria raise the ATP/ADP ratio',
  'katp-close': 'ATP closes K_ATP channels',
  depolarize: 'Membrane depolarizes',
  calcium: 'Voltage-gated Ca2+ channels open, Ca2+ floods in',
  secretion: 'Ca2+ triggers insulin granule exocytosis',
  recover: 'Glucose falls, K_ATP reopens, membrane repolarizes',
};

const bump = (x: number, a: number, b: number, c: number, d: number): number => smoothstep(a, b, x) * (1 - smoothstep(c, d, x));

export function computeState(processTime: number, out: CellState): CellState {
  const phase = (((processTime / GSIS_PERIOD) % 1) + 1) % 1;
  out.phase = phase;
  const glucose = bump(phase, 0.12, 0.22, 0.72, 0.86);
  out.glucoseMM = 4.5 + 7.5 * glucose;
  out.atp = bump(phase, 0.2, 0.34, 0.76, 0.9);
  out.katpOpen = 1 - 0.95 * bump(phase, 0.3, 0.4, 0.8, 0.92);
  const depol = bump(phase, 0.36, 0.46, 0.82, 0.94);
  // Bursting action potentials ride on the depolarized plateau.
  const spikes = depol > 0.9 ? Math.max(0, Math.sin(processTime * 5.2)) * 22 : 0;
  out.vm = -70 + 28 * depol + spikes;
  out.cavOpen = depol > 0.9 ? 0.35 + 0.65 * Math.max(0, Math.sin(processTime * 5.2)) : depol * 0.2;
  out.calcium = bump(phase, 0.46, 0.54, 0.84, 0.95);
  out.secretion = bump(phase, 0.52, 0.6, 0.84, 0.94);

  if (phase < 0.12) out.stage = 'rest';
  else if (phase < 0.22) out.stage = 'glucose';
  else if (phase < 0.32) out.stage = 'atp';
  else if (phase < 0.4) out.stage = 'katp-close';
  else if (phase < 0.47) out.stage = 'depolarize';
  else if (phase < 0.55) out.stage = 'calcium';
  else if (phase < 0.84) out.stage = 'secretion';
  else out.stage = 'recover';
  return out;
}

export const cellState: CellState = computeState(0, {
  phase: 0,
  stage: 'rest',
  glucoseMM: 4.5,
  atp: 0,
  katpOpen: 1,
  vm: -70,
  cavOpen: 0,
  calcium: 0,
  secretion: 0,
});
