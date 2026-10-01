// World scale: 1 world unit = 100 nm.

export const NM_PER_UNIT = 100;

/** Format a length given in nanometres: < 1 nm in Å, < 1000 nm in nm, otherwise µm. */
export function formatNm(nm: number): string {
  if (!Number.isFinite(nm) || nm < 0) return '-';
  if (nm < 1) return `${trim(nm * 10)} Å`;
  if (nm < 1000) return `${trim(nm)} nm`;
  return `${(nm / 1000).toFixed(1)} µm`;
}

export function formatRange(range: [number, number]): string {
  const [a, b] = range;
  if (a === b) return formatNm(a);
  // Keep both ends in the larger end's unit so "250-350 nm" reads naturally.
  if (b >= 1000 && a >= 100) return `${(a / 1000).toFixed(1)}-${(b / 1000).toFixed(1)} µm`;
  if (b < 1000 && a >= 1) return `${trim(a)}-${trim(b)} nm`;
  return `${formatNm(a)} to ${formatNm(b)}`;
}

export function unitsToNm(units: number): number {
  return units * NM_PER_UNIT;
}

/** Pick a "nice" scale-bar length (1, 2, 5 x 10^n nm) that fits within maxNm. */
export function niceBarNm(maxNm: number): number {
  if (!(maxNm > 0)) return 0;
  const exp = Math.floor(Math.log10(maxNm));
  const base = Math.pow(10, exp);
  for (const m of [5, 2, 1]) {
    if (m * base <= maxNm) return m * base;
  }
  return base;
}

function trim(n: number): string {
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10) return (Math.round(n * 10) / 10).toString();
  return (Math.round(n * 100) / 100).toString();
}
