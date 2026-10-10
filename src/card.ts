import { NATURE_ITEMS, type NatureItem, type SeasonName } from './catalog';

export type { NatureItem, SeasonName };
export { NATURE_ITEMS };

export type SeasonChoice = SeasonName | 'any';

export const GRID_SIZE = 4;
export const CARD_SIZE = GRID_SIZE * GRID_SIZE;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface GenerateCardOptions {
  date: string;
  season: SeasonChoice;
  catalog?: readonly NatureItem[];
  size?: number;
}

export function seasonFromDate(date: string): SeasonName {
  if (!DATE_PATTERN.test(date)) {
    throw new Error('date must be YYYY-MM-DD');
  }
  const month = Number(date.slice(5, 7));
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  if (month === 12 || month === 1 || month === 2) return 'winter';
  throw new Error('date must be YYYY-MM-DD');
}

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateCard(options: GenerateCardOptions): NatureItem[] {
  if (!DATE_PATTERN.test(options.date)) {
    throw new Error('date must be YYYY-MM-DD');
  }
  const catalog = options.catalog ?? NATURE_ITEMS;
  const size = options.size ?? CARD_SIZE;
  if (size < 1) {
    throw new Error('card size must be positive');
  }

  const random = mulberry32(hashSeed(`${options.date}|${options.season}`));
  const preferred = catalog.filter((item) => isPreferred(item, options.season));
  const everyday = catalog.filter((item) => item.seasons.length === 0 && !preferred.includes(item));
  const offSeason = catalog.filter((item) => item.seasons.length > 0 && !preferred.includes(item));
  const ordered = [...shuffle(preferred, random), ...shuffle(everyday, random), ...shuffle(offSeason, random)];

  if (ordered.length < size) {
    throw new Error('catalog is too small to fill the card');
  }

  return shuffle(ordered.slice(0, size), random);
}

function isPreferred(item: NatureItem, season: SeasonChoice): boolean {
  if (season === 'any') return true;
  return item.seasons.includes(season);
}

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}
