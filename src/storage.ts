import type { SeasonChoice } from './card';

export interface FoundMark {
  itemId: string;
  markedAt: string;
}

export interface CardProgress {
  date: string;
  season: SeasonChoice;
  itemIds: string[];
  found: Record<string, FoundMark>;
  startedAt: string;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SEASON_CHOICES = new Set<string>(['any', 'spring', 'summer', 'autumn', 'winter']);

export function progressKey(date: string, season: string): string {
  return `grass-bingo:v1:${date}:${season}`;
}

export function seasonChoiceKey(date: string): string {
  return `grass-bingo:v1:choice:${date}`;
}

export function createProgress(
  date: string,
  season: SeasonChoice,
  itemIds: string[],
  startedAt: string,
): CardProgress {
  return { date, season, itemIds, found: {}, startedAt };
}

export function markSquare(
  progress: CardProgress,
  index: number,
  itemId: string,
  markedAt: string,
): CardProgress {
  if (progress.itemIds[index] !== itemId) {
    throw new Error('square does not match item');
  }
  const key = String(index);
  if (progress.found[key]) return progress;
  return {
    ...progress,
    found: {
      ...progress.found,
      [key]: { itemId, markedAt },
    },
  };
}

export function foundIndices(progress: CardProgress): number[] {
  return Object.keys(progress.found)
    .map((key) => Number(key))
    .filter((index) => Number.isInteger(index));
}

export function createProgressStore(storage: KeyValueStore) {
  return {
    load(date: string, season: SeasonChoice): CardProgress | null {
      const raw = storage.getItem(progressKey(date, season));
      if (!raw) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isProgress(parsed, date, season)) return null;
        return parsed;
      } catch {
        return null;
      }
    },
    save(progress: CardProgress): void {
      storage.setItem(progressKey(progress.date, progress.season), JSON.stringify(progress));
    },
    clear(date: string, season: SeasonChoice): void {
      storage.removeItem(progressKey(date, season));
    },
    rememberSeason(date: string, season: string): void {
      if (!SEASON_CHOICES.has(season)) return;
      storage.setItem(seasonChoiceKey(date), season);
    },
    recallSeason(date: string): SeasonChoice | null {
      const value = storage.getItem(seasonChoiceKey(date));
      if (value && SEASON_CHOICES.has(value)) return value as SeasonChoice;
      return null;
    },
  };
}

function isProgress(value: unknown, date: string, season: string): value is CardProgress {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<CardProgress>;
  return (
    record.date === date &&
    record.season === season &&
    Array.isArray(record.itemIds) &&
    record.itemIds.every((id) => typeof id === 'string') &&
    typeof record.startedAt === 'string' &&
    !!record.found &&
    typeof record.found === 'object' &&
    !Array.isArray(record.found)
  );
}
