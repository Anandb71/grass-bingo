import { describe, expect, it } from 'vitest';
import {
  createProgress,
  createProgressStore,
  markSquare,
  progressKey,
  type KeyValueStore,
} from '../src/storage';

function memory(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe('progress storage', () => {
  it('round-trips a card and keeps separate days and seasons', () => {
    const store = createProgressStore(memory());
    const autumn = createProgress('2026-10-10', 'autumn', ['oak-leaf', 'moss'], '2026-10-10T08:00:00.000Z');
    const marked = markSquare(autumn, 1, 'moss', '2026-10-10T08:15:00.000Z');
    store.save(marked);

    const winter = createProgress('2026-10-10', 'winter', ['pinecone'], '2026-10-10T09:00:00.000Z');
    store.save(winter);
    const nextDay = createProgress('2026-10-11', 'autumn', ['bird'], '2026-10-11T09:00:00.000Z');
    store.save(nextDay);

    expect(store.load('2026-10-10', 'autumn')).toEqual(marked);
    expect(store.load('2026-10-10', 'winter')?.itemIds).toEqual(['pinecone']);
    expect(store.load('2026-10-11', 'autumn')?.found).toEqual({});
    expect(store.load('2026-10-12', 'autumn')).toBeNull();
  });

  it('keeps the original start time and does not store a photo', () => {
    const store = createProgressStore(memory());
    const started = createProgress('2026-05-02', 'spring', ['dandelion', 'bee'], '2026-05-02T07:30:00.000Z');
    const marked = markSquare(started, 0, 'dandelion', '2026-05-02T07:41:00.000Z');
    store.save(marked);

    const loaded = store.load('2026-05-02', 'spring');
    expect(loaded?.startedAt).toBe('2026-05-02T07:30:00.000Z');
    expect(loaded?.found['0']).toEqual({ itemId: 'dandelion', markedAt: '2026-05-02T07:41:00.000Z' });
    expect(JSON.stringify(loaded)).not.toMatch(/photo|blob|data:/i);
  });

  it('marks a square once and refuses a mismatched item', () => {
    const progress = createProgress('2026-08-01', 'summer', ['bench', 'dog'], '2026-08-01T10:00:00.000Z');
    const once = markSquare(progress, 1, 'dog', '2026-08-01T10:05:00.000Z');
    const twice = markSquare(once, 1, 'dog', '2026-08-01T11:00:00.000Z');
    expect(twice).toBe(once);
    expect(() => markSquare(progress, 0, 'dog', '2026-08-01T10:06:00.000Z')).toThrow(/match/i);
  });

  it('ignores corrupt saved data and can clear a day', () => {
    const raw = memory();
    const store = createProgressStore(raw);
    raw.setItem(progressKey('2026-10-10', 'any'), '{');
    expect(store.load('2026-10-10', 'any')).toBeNull();

    store.save(createProgress('2026-10-10', 'any', ['stone'], '2026-10-10T12:00:00.000Z'));
    store.clear('2026-10-10', 'any');
    expect(store.load('2026-10-10', 'any')).toBeNull();
  });

  it('remembers which season was chosen for a date', () => {
    const store = createProgressStore(memory());
    expect(store.recallSeason('2026-10-10')).toBeNull();
    store.rememberSeason('2026-10-10', 'winter');
    expect(store.recallSeason('2026-10-10')).toBe('winter');
    store.rememberSeason('2026-10-10', 'nope');
    expect(store.recallSeason('2026-10-10')).toBe('winter');
  });
});
