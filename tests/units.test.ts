import { describe, expect, it } from 'vitest';
import { formatNm, formatRange, niceBarNm, unitsToNm } from '../src/engine/units';

describe('units', () => {
  it('formats across angstrom, nanometre and micrometre ranges', () => {
    expect(formatNm(0.5)).toBe('5 Å');
    expect(formatNm(1)).toBe('1 nm');
    expect(formatNm(25)).toBe('25 nm');
    expect(formatNm(999)).toBe('999 nm');
    expect(formatNm(1000)).toBe('1.0 µm');
    expect(formatNm(12500)).toBe('12.5 µm');
  });

  it('rejects nonsense lengths', () => {
    expect(formatNm(-1)).toBe('-');
    expect(formatNm(Number.NaN)).toBe('-');
  });

  it('formats size ranges in one unit', () => {
    expect(formatRange([250, 350])).toBe('250-350 nm');
    expect(formatRange([5000, 10000])).toBe('5.0-10.0 µm');
    expect(formatRange([25, 25])).toBe('25 nm');
  });

  it('picks round scale-bar lengths that fit', () => {
    expect(niceBarNm(130)).toBe(100);
    expect(niceBarNm(260)).toBe(200);
    expect(niceBarNm(700)).toBe(500);
    expect(niceBarNm(0)).toBe(0);
  });

  it('uses 100 nm per world unit', () => {
    expect(unitsToNm(1)).toBe(100);
    expect(unitsToNm(2.5)).toBe(250);
  });
});
