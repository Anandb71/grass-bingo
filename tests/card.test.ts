import { describe, expect, it } from 'vitest';
import {
  NATURE_ITEMS,
  generateCard,
  seasonFromDate,
  type NatureItem,
  type SeasonChoice,
} from '../src/card';

function item(id: string, seasons: NatureItem['seasons']): NatureItem {
  return {
    id,
    name: id,
    prompt: `a photo of ${id}`,
    seasons,
  };
}

const fixture: NatureItem[] = [
  item('w1', ['winter']),
  item('w2', ['winter']),
  item('e1', []),
  item('e2', []),
  item('s1', ['summer']),
  item('s2', ['summer']),
];

describe('generateCard', () => {
  it('builds a 16-square card of unique catalog items', () => {
    const card = generateCard({ date: '2026-10-10', season: 'autumn' });
    expect(card).toHaveLength(16);
    expect(new Set(card.map((entry) => entry.id)).size).toBe(16);
    const catalogIds = new Set(NATURE_ITEMS.map((entry) => entry.id));
    for (const entry of card) {
      expect(catalogIds.has(entry.id)).toBe(true);
    }
  });

  it('repeats the same card for the same date and season', () => {
    const first = generateCard({ date: '2026-06-21', season: 'summer' });
    const second = generateCard({ date: '2026-06-21', season: 'summer' });
    expect(second.map((entry) => entry.id)).toEqual(first.map((entry) => entry.id));
  });

  it('changes the card when the date or season changes', () => {
    const autumn = generateCard({ date: '2026-10-10', season: 'autumn' });
    const nextDay = generateCard({ date: '2026-10-11', season: 'autumn' });
    const winter = generateCard({ date: '2026-10-10', season: 'winter' });
    expect(nextDay.map((entry) => entry.id)).not.toEqual(autumn.map((entry) => entry.id));
    expect(winter.map((entry) => entry.id)).not.toEqual(autumn.map((entry) => entry.id));
  });

  it('fills a seasonal card with that season, then everyday items, before off-season items', () => {
    const card = generateCard({
      date: '2026-01-03',
      season: 'winter',
      catalog: fixture,
      size: 4,
    });
    expect(card.map((entry) => entry.id).sort()).toEqual(['e1', 'e2', 'w1', 'w2']);
  });

  it('keeps a seasonal card inside that season when there are enough tagged items', () => {
    const winterHeavy: NatureItem[] = [
      item('w1', ['winter']),
      item('w2', ['winter']),
      item('w3', ['winter']),
      item('w4', ['winter']),
      item('s1', ['summer']),
    ];
    const card = generateCard({
      date: '2026-12-25',
      season: 'winter',
      catalog: winterHeavy,
      size: 3,
    });
    expect(card.every((entry) => entry.seasons.includes('winter'))).toBe(true);
  });

  it('rejects a catalog that cannot fill the card', () => {
    expect(() =>
      generateCard({ date: '2026-05-01', season: 'spring', catalog: fixture.slice(0, 2), size: 4 }),
    ).toThrow(/catalog/i);
  });

  it('rejects a date that is not YYYY-MM-DD', () => {
    expect(() => generateCard({ date: '10 Oct 2026', season: 'any' })).toThrow(/date/i);
  });
});

describe('seasonFromDate', () => {
  it('maps months to seasons without using a location', () => {
    expect(seasonFromDate('2026-03-01')).toBe('spring');
    expect(seasonFromDate('2026-07-15')).toBe('summer');
    expect(seasonFromDate('2026-10-10')).toBe('autumn');
    expect(seasonFromDate('2026-01-02')).toBe('winter');
  });
});

describe('catalog', () => {
  it('covers the outdoor prompts the card is built from', () => {
    const names = NATURE_ITEMS.map((entry) => entry.name.toLowerCase());
    for (const expected of [
      'oak leaf',
      'pinecone',
      'dandelion',
      'bird',
      'moss',
      'cloud shape',
      'puddle',
      'mushroom',
      'red leaf',
      'yellow leaf',
      'tree bark',
      'feather',
      'flower',
      'ant',
      'stone',
      'bench',
      'dog',
    ]) {
      expect(names).toContain(expected);
    }
    expect(new Set(NATURE_ITEMS.map((entry) => entry.id)).size).toBe(NATURE_ITEMS.length);
    expect(NATURE_ITEMS.length).toBeGreaterThanOrEqual(16);
  });

  it('offers every season enough items for a full card', () => {
    const seasons: SeasonChoice[] = ['any', 'spring', 'summer', 'autumn', 'winter'];
    for (const season of seasons) {
      expect(generateCard({ date: '2026-04-04', season })).toHaveLength(16);
    }
  });
});
