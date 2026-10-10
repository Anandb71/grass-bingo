export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatCardDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)));
}

export interface ShareSummaryInput {
  dateLabel: string;
  season: string;
  foundNames: string[];
  total: number;
  bingoLabel: string;
  elapsedLabel: string;
}

export function shareSummary(input: ShareSummaryInput): string {
  const foundLine =
    input.foundNames.length > 0
      ? `Found: ${input.foundNames.join(', ')}`
      : 'Found: nothing yet — the card is waiting outside.';
  const bingoLine = input.bingoLabel === 'no bingo yet' ? 'No bingo yet' : `Bingo: ${input.bingoLabel}`;

  return [
    `Grass Bingo · ${input.dateLabel} (${input.season})`,
    `${input.foundNames.length} of ${input.total} found`,
    bingoLine,
    `Time outside: ${input.elapsedLabel}`,
    '',
    foundLine,
    '',
    'Photos stayed on my device.',
  ].join('\n');
}
