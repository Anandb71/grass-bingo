import { describe, expect, it } from 'vitest';
import { bingoLineLabel, bingoLines, detectBingoLines, formatBingoLines } from '../src/bingo';

describe('detectBingoLines', () => {
  it('defines four rows, four columns, and two diagonals', () => {
    const lines = bingoLines();
    expect(lines).toHaveLength(10);
    expect(lines.find((line) => line.id === 'row-1')?.indices).toEqual([0, 1, 2, 3]);
    expect(lines.find((line) => line.id === 'column-2')?.indices).toEqual([1, 5, 9, 13]);
    expect(lines.find((line) => line.id === 'diagonal')?.indices).toEqual([0, 5, 10, 15]);
    expect(lines.find((line) => line.id === 'anti-diagonal')?.indices).toEqual([3, 6, 9, 12]);
  });

  it('finds no line on an empty or partial card', () => {
    expect(detectBingoLines([])).toEqual([]);
    expect(detectBingoLines([0, 1, 2])).toEqual([]);
  });

  it('finds a completed row and ignores a different row', () => {
    const lines = detectBingoLines([4, 5, 6, 7]);
    expect(lines.map((line) => line.id)).toEqual(['row-2']);
  });

  it('finds a completed column', () => {
    const lines = detectBingoLines([2, 6, 10, 14]);
    expect(lines.map((line) => line.id)).toEqual(['column-3']);
  });

  it('finds both diagonals and no rows when only those squares are marked', () => {
    const lines = detectBingoLines([0, 5, 10, 15, 3, 6, 9, 12]);
    expect(lines.map((line) => line.id)).toEqual(['diagonal', 'anti-diagonal']);
  });

  it('finds every line on a full card', () => {
    const all = Array.from({ length: 16 }, (_, index) => index);
    expect(detectBingoLines(all)).toHaveLength(10);
  });

  it('treats duplicate marks as a single square', () => {
    expect(detectBingoLines([0, 0, 1, 1, 2, 2, 3]).map((line) => line.id)).toEqual(['row-1']);
  });

  it('names completed lines in plain language', () => {
    expect(bingoLineLabel('row-1')).toBe('row 1');
    expect(bingoLineLabel('column-4')).toBe('column 4');
    expect(bingoLineLabel('diagonal')).toBe('the diagonal');
    expect(bingoLineLabel('anti-diagonal')).toBe('the other diagonal');
    const lines = detectBingoLines([0, 1, 2, 3, 4, 8, 12]);
    expect(formatBingoLines(lines)).toBe('row 1 and column 1');
  });
});
