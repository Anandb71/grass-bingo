export interface BingoLine {
  id: string;
  indices: number[];
}

export function bingoLines(size = 4): BingoLine[] {
  const lines: BingoLine[] = [];
  for (let row = 0; row < size; row += 1) {
    lines.push({
      id: `row-${row + 1}`,
      indices: Array.from({ length: size }, (_, column) => row * size + column),
    });
  }
  for (let column = 0; column < size; column += 1) {
    lines.push({
      id: `column-${column + 1}`,
      indices: Array.from({ length: size }, (_, row) => row * size + column),
    });
  }
  lines.push({
    id: 'diagonal',
    indices: Array.from({ length: size }, (_, index) => index * size + index),
  });
  lines.push({
    id: 'anti-diagonal',
    indices: Array.from({ length: size }, (_, index) => index * size + (size - 1 - index)),
  });
  return lines;
}

export function detectBingoLines(found: Iterable<number>, size = 4): BingoLine[] {
  const marked = new Set(found);
  return bingoLines(size).filter((line) => line.indices.every((index) => marked.has(index)));
}

export function bingoLineLabel(id: string): string {
  const row = /^row-(\d+)$/.exec(id);
  if (row) return `row ${row[1]}`;
  const column = /^column-(\d+)$/.exec(id);
  if (column) return `column ${column[1]}`;
  if (id === 'diagonal') return 'the diagonal';
  if (id === 'anti-diagonal') return 'the other diagonal';
  return id;
}

export function formatBingoLines(lines: readonly BingoLine[]): string {
  const labels = lines.map((line) => bingoLineLabel(line.id));
  if (labels.length === 0) return 'no bingo yet';
  if (labels.length === 1) return labels[0] ?? 'no bingo yet';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
