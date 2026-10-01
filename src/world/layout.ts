// Pure, seeded placement of everything in the cell. No DOM, no WebGL: tests import this.
// Units: 1 = 100 nm. The cell is a human pancreatic beta cell about 12-14 µm across.

import { Rng } from '../engine/rng';

export type V3 = [number, number, number];

export interface Capsule {
  center: V3;
  dir: V3; // unit axis
  length: number; // total length including caps
  radius: number;
}

export interface Ball {
  center: V3;
  radius: number;
}

export interface ErCap {
  dir: V3;
  /** Angular radius of the cap in radians. */
  angle: number;
  /** Shell scale factors relative to the nucleus radii, one per cisterna. */
  shells: number[];
}

export interface Layout {
  seed: number;
  cell: { radii: V3 };
  nucleus: { center: V3; radii: V3; nucleoli: Ball[] };
  er: ErCap[];
  golgi: { center: V3; axis: V3; radius: number };
  centrosome: { center: V3 };
  smoothEr: { center: V3; radius: number };
  mitochondria: Capsule[];
  lysosomes: Ball[];
  peroxisomes: Ball[];
  earlyEndosomes: Ball[];
  lateEndosomes: Ball[];
  autophagosome: Ball;
  granules: Ball[];
  proteasomes: V3[];
  polysomes: { center: V3; axis: V3; count: number }[];
  microtubuleEnds: V3[];
  spawn: { position: V3; lookAt: V3 };
}

export const LAYOUT_SEED = 1921; // the year insulin was isolated
const SPAWN: V3 = [30, 22, 34];

// Small vector helpers on tuples, kept local so this file stays dependency-free.
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scale(a, 1 / (len(a) || 1));
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dist = (a: V3, b: V3): number => len(sub(a, b));

export const vec = { add, sub, scale, len, norm, dot, dist };

/** Ellipsoid "radius ratio": < 1 inside, 1 on the surface. */
export function ellipsoidRatio(p: V3, center: V3, radii: V3): number {
  const x = (p[0] - center[0]) / radii[0];
  const y = (p[1] - center[1]) / radii[1];
  const z = (p[2] - center[2]) / radii[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/** Distance from point to a capsule's axis segment minus radius (signed distance). */
export function capsuleSdf(p: V3, c: Capsule): number {
  const half = c.length / 2 - c.radius;
  const rel = sub(p, c.center);
  const t = Math.max(-half, Math.min(half, dot(rel, c.dir)));
  const closest = add(c.center, scale(c.dir, t));
  return dist(p, closest) - c.radius;
}

export function inErCap(dirFromNucleus: V3, cap: ErCap): boolean {
  return Math.acos(Math.max(-1, Math.min(1, dot(norm(dirFromNucleus), cap.dir)))) < cap.angle;
}

export function buildLayout(seed = LAYOUT_SEED): Layout {
  const rng = new Rng(seed);
  const cellRadii: V3 = [70, 60, 64];
  const nucleus = { center: [-12, 2, 2] as V3, radii: [24, 21, 22] as V3, nucleoli: [] as Ball[] };
  nucleus.nucleoli.push({ center: add(nucleus.center, [-3, 6, 4]), radius: 6 });
  nucleus.nucleoli.push({ center: add(nucleus.center, [7, -7, -5]), radius: 3.2 });

  const er: ErCap[] = [
    { dir: norm([-0.35, 0.45, 0.82]), angle: 1.15, shells: [1.24, 1.36, 1.48, 1.6] },
    { dir: norm([-0.45, -0.55, -0.7]), angle: 0.95, shells: [1.24, 1.36, 1.48] },
  ];

  const golgiCenter: V3 = [25, 9, -6];
  const golgi = { center: golgiCenter, axis: norm(sub(golgiCenter, nucleus.center)), radius: 7 };
  const centrosome = { center: [15, -9, 9] as V3 };
  const smoothEr = { center: [8, -38, 26] as V3, radius: 15 };

  // Occupancy list so organelles don't interpenetrate.
  const occupied: Ball[] = [
    { center: golgi.center, radius: 11 },
    { center: centrosome.center, radius: 5 },
    { center: smoothEr.center, radius: smoothEr.radius * 0.8 },
    // Keep the arrival point clear so the first view is the nucleus, not a granule.
    { center: SPAWN, radius: 7 },
    { center: [SPAWN[0] * 0.75, SPAWN[1] * 0.75, SPAWN[2] * 0.75], radius: 6 },
  ];
  const free = (p: V3, r: number, pad = 0.6): boolean => occupied.every((o) => dist(p, o.center) > o.radius + r + pad);
  const insideCell = (p: V3, margin: number): boolean => ellipsoidRatio(p, [0, 0, 0], cellRadii) < margin;
  const nucRatio = (p: V3): number => ellipsoidRatio(p, nucleus.center, nucleus.radii);
  const inErRegion = (p: V3, pad: number): boolean => {
    const r = nucRatio(p);
    const d = sub(p, nucleus.center);
    return er.some((cap) => inErCap(d, cap) && r > cap.shells[0] - pad && r < cap.shells[cap.shells.length - 1] + pad);
  };

  const randomInCell = (minR: number, maxR: number): V3 => {
    const u = rng.unit();
    const r = rng.range(minR, maxR);
    return [u[0] * cellRadii[0] * r, u[1] * cellRadii[1] * r, u[2] * cellRadii[2] * r];
  };

  // Mitochondria: 0.5 µm wide, 1-3 µm long, spread through the cytoplasm.
  const mitochondria: Capsule[] = [];
  for (let tries = 0; mitochondria.length < 22 && tries < 4000; tries++) {
    const p = randomInCell(0.3, 0.86);
    const radius = rng.range(2.2, 2.7);
    const length = rng.range(10, 24);
    if (nucRatio(p) < 1.75) continue;
    if (inErRegion(p, 0.25)) continue;
    if (!insideCell(p, 0.86 - (length / 2) / 64)) continue;
    // Orientation: mostly tangential to the cell surface.
    const radial = norm(p);
    let dir = norm(rng.unit());
    dir = norm(sub(dir, scale(radial, dot(dir, radial) * 0.8)));
    const reach = length / 2;
    if (!free(p, reach * 0.8)) continue;
    mitochondria.push({ center: p, dir, length, radius });
    occupied.push({ center: p, radius: reach * 0.85 });
  }

  const scatter = (count: number, minR: number, maxR: number, rMin: number, rMax: number, avoidEr = true): Ball[] => {
    const out: Ball[] = [];
    for (let tries = 0; out.length < count && tries < 6000; tries++) {
      const p = randomInCell(minR, maxR);
      const radius = rng.range(rMin, rMax);
      if (nucRatio(p) < 1.3) continue;
      if (avoidEr && inErRegion(p, 0.08)) continue;
      if (!free(p, radius)) continue;
      out.push({ center: p, radius });
      occupied.push({ center: p, radius });
    }
    return out;
  };

  // A late endosome and a lysosome near the autophagosome make fusion visible.
  const autophagosome: Ball = { center: [36, -22, -24], radius: 4.2 };
  occupied.push(autophagosome);
  const lysosomes = scatter(9, 0.35, 0.8, 1.6, 3.2);
  const peroxisomes = scatter(10, 0.35, 0.85, 1.1, 2.1);
  const earlyEndosomes = scatter(6, 0.78, 0.9, 1.8, 2.6);
  const lateEndosomes = scatter(5, 0.55, 0.8, 2.2, 3.0);

  // Insulin granules: about 300 nm, concentrated under the plasma membrane.
  // A real beta cell holds about 10,000; we draw far fewer so the cell stays readable.
  const granules: Ball[] = [];
  for (let tries = 0; granules.length < 190 && tries < 20000; tries++) {
    const shell = rng.next() < 0.78 ? rng.range(0.82, 0.95) : rng.range(0.5, 0.82);
    const p = randomInCell(shell, shell);
    const radius = rng.range(1.25, 1.75);
    if (nucRatio(p) < 1.3) continue;
    if (inErRegion(p, 0.06)) continue;
    if (!free(p, radius, 0.3)) continue;
    granules.push({ center: p, radius });
    occupied.push({ center: p, radius });
  }

  const proteasomes: V3[] = [];
  for (let tries = 0; proteasomes.length < 150 && tries < 8000; tries++) {
    const p = randomInCell(0.2, 0.93);
    if (nucRatio(p) < 1.05 && nucRatio(p) > 0.95) continue; // not inside the envelope itself
    if (!free(p, 0.9, 0.1)) continue;
    proteasomes.push(p);
  }

  const polysomes: Layout['polysomes'] = [];
  for (let tries = 0; polysomes.length < 110 && tries < 8000; tries++) {
    const p = randomInCell(0.25, 0.92);
    if (nucRatio(p) < 1.12) continue;
    if (inErRegion(p, 0.04)) continue;
    if (!free(p, 1.5, 0.1)) continue;
    polysomes.push({ center: p, axis: norm(rng.unit()), count: rng.int(5, 11) });
  }

  // Microtubule plus ends near the cell cortex.
  const microtubuleEnds: V3[] = [];
  for (let i = 0; i < 40; i++) {
    const u = norm(rng.unit());
    const r = rng.range(0.82, 0.93);
    microtubuleEnds.push([u[0] * cellRadii[0] * r, u[1] * cellRadii[1] * r, u[2] * cellRadii[2] * r]);
  }

  return {
    seed,
    cell: { radii: cellRadii },
    nucleus,
    er,
    golgi,
    centrosome,
    smoothEr,
    mitochondria,
    lysosomes,
    peroxisomes,
    earlyEndosomes,
    lateEndosomes,
    autophagosome,
    granules,
    proteasomes,
    polysomes,
    microtubuleEnds,
    spawn: { position: SPAWN, lookAt: [-6, 2, 2] },
  };
}
