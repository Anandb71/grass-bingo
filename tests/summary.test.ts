import { describe, expect, it } from 'vitest';
import { formatElapsed, shareSummary } from '../src/summary';

describe('share summary', () => {
  it('formats elapsed time as a clock', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(45_000)).toBe('00:45');
    expect(formatElapsed(125_000)).toBe('02:05');
    expect(formatElapsed(3_661_000)).toBe('1:01:01');
    expect(formatElapsed(-10)).toBe('00:00');
  });

  it('writes a text-only celebration with no photo data', () => {
    const text = shareSummary({
      dateLabel: 'Saturday 10 Oct 2026',
      season: 'autumn',
      foundNames: ['Oak leaf', 'Moss'],
      total: 16,
      bingoLabel: 'row 1',
      elapsedLabel: '42:10',
    });

    expect(text).toContain('Grass Bingo');
    expect(text).toContain('Saturday 10 Oct 2026');
    expect(text).toContain('autumn');
    expect(text).toContain('2 of 16 found');
    expect(text).toContain('row 1');
    expect(text).toContain('Time outside: 42:10');
    expect(text).toContain('Oak leaf, Moss');
    expect(text).toContain('Photos stayed on my device.');
    expect(text).not.toMatch(/data:|blob:|https?:\/\//i);
  });
});