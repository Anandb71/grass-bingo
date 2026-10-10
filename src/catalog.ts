export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface NatureItem {
  id: string;
  name: string;
  prompt: string;
  seasons: SeasonName[];
}

/** Everyday items use an empty season list and can appear on any card. */
export const NATURE_ITEMS: readonly NatureItem[] = [
  { id: 'oak-leaf', name: 'Oak leaf', prompt: 'an oak leaf', seasons: ['autumn'] },
  { id: 'pinecone', name: 'Pinecone', prompt: 'a pinecone', seasons: ['autumn', 'winter'] },
  { id: 'dandelion', name: 'Dandelion', prompt: 'a yellow dandelion', seasons: ['spring', 'summer'] },
  { id: 'bird', name: 'Bird', prompt: 'a wild bird', seasons: [] },
  { id: 'moss', name: 'Moss', prompt: 'green moss', seasons: [] },
  { id: 'cloud', name: 'Cloud shape', prompt: 'a cloud shaped like something', seasons: [] },
  { id: 'puddle', name: 'Puddle', prompt: 'a puddle', seasons: [] },
  { id: 'mushroom', name: 'Mushroom', prompt: 'a wild mushroom', seasons: ['autumn'] },
  { id: 'red-leaf', name: 'Red leaf', prompt: 'a red fallen leaf', seasons: ['autumn'] },
  { id: 'yellow-leaf', name: 'Yellow leaf', prompt: 'a yellow fallen leaf', seasons: ['autumn'] },
  { id: 'bark', name: 'Tree bark', prompt: 'tree bark', seasons: [] },
  { id: 'feather', name: 'Feather', prompt: 'a bird feather', seasons: [] },
  { id: 'flower', name: 'Flower', prompt: 'a wildflower', seasons: ['spring', 'summer'] },
  { id: 'ant', name: 'Ant', prompt: 'an ant', seasons: ['spring', 'summer', 'autumn'] },
  { id: 'stone', name: 'Stone', prompt: 'a stone', seasons: [] },
  { id: 'bench', name: 'Bench', prompt: 'a park bench', seasons: [] },
  { id: 'dog', name: 'Dog', prompt: 'a dog outdoors', seasons: [] },
  { id: 'squirrel', name: 'Squirrel', prompt: 'a squirrel', seasons: [] },
  { id: 'butterfly', name: 'Butterfly', prompt: 'a butterfly', seasons: ['spring', 'summer'] },
  { id: 'bee', name: 'Bee', prompt: 'a bee', seasons: ['spring', 'summer'] },
  { id: 'grass', name: 'Grass', prompt: 'blades of grass', seasons: ['spring', 'summer'] },
  { id: 'acorn', name: 'Acorn', prompt: 'an acorn', seasons: ['autumn'] },
  { id: 'web', name: 'Spider web', prompt: 'a spider web', seasons: ['summer', 'autumn'] },
  { id: 'snail', name: 'Snail', prompt: 'a snail', seasons: ['spring', 'summer', 'autumn'] },
  { id: 'clover', name: 'Clover', prompt: 'a clover', seasons: ['spring', 'summer'] },
  { id: 'fern', name: 'Fern', prompt: 'a fern', seasons: ['spring', 'summer'] },
  { id: 'daisy', name: 'Daisy', prompt: 'a daisy', seasons: ['spring', 'summer'] },
  { id: 'berry', name: 'Berries', prompt: 'berries on a plant', seasons: ['summer', 'autumn'] },
  { id: 'twig', name: 'Twig', prompt: 'a fallen twig', seasons: [] },
  { id: 'footprint', name: 'Muddy footprint', prompt: 'a footprint in mud', seasons: [] },
  { id: 'nest', name: 'Bird nest', prompt: 'a bird nest', seasons: ['spring'] },
  { id: 'duck', name: 'Duck', prompt: 'a duck', seasons: ['spring', 'summer'] },
  { id: 'ivy', name: 'Ivy', prompt: 'ivy leaves', seasons: [] },
  { id: 'stump', name: 'Tree stump', prompt: 'a tree stump', seasons: [] },
  { id: 'log', name: 'Fallen log', prompt: 'a fallen log', seasons: [] },
  { id: 'path', name: 'Dirt path', prompt: 'a dirt path', seasons: [] },
  { id: 'pebbles', name: 'Pebbles', prompt: 'small pebbles', seasons: [] },
  { id: 'seed-head', name: 'Seed head', prompt: 'a dried seed head', seasons: ['autumn', 'winter'] },
  { id: 'evergreen', name: 'Evergreen', prompt: 'evergreen needles', seasons: ['winter'] },
  { id: 'frost', name: 'Frost', prompt: 'frost on a plant', seasons: ['winter'] },
  { id: 'ladybug', name: 'Ladybug', prompt: 'a ladybug', seasons: ['spring', 'summer'] },
  { id: 'blossom', name: 'Blossom', prompt: 'blossom on a tree', seasons: ['spring'] },
  { id: 'bush', name: 'Bush', prompt: 'a leafy bush', seasons: ['spring', 'summer'] },
  { id: 'weed', name: 'Weed', prompt: 'a weed growing outside', seasons: ['spring', 'summer', 'autumn'] },
];

export function candidateLabels(item: NatureItem, card: readonly NatureItem[]): {
  target: string;
  distractors: string[];
} {
  const distractors: string[] = [];
  const start = Math.max(
    card.findIndex((entry) => entry.id === item.id),
    0,
  );
  for (let step = 1; distractors.length < 4 && step <= card.length; step += 1) {
    const other = card[(start + step * 3) % card.length];
    if (!other || other.id === item.id || distractors.includes(other.prompt)) continue;
    distractors.push(other.prompt);
  }
  return { target: item.prompt, distractors };
}
