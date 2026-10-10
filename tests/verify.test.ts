import { describe, expect, it } from 'vitest';
import {
  VERIFY_SCORE_THRESHOLD,
  decideVerification,
  verifyPhoto,
  type ImageClassifier,
  type LabelScore,
} from '../src/verify';

const photo = new Blob(['not-a-real-image'], { type: 'image/jpeg' });

function scores(entries: Record<string, number>): LabelScore[] {
  return Object.entries(entries).map(([label, score]) => ({ label, score }));
}

describe('decideVerification', () => {
  it('accepts when the target label is the top score', () => {
    const decision = decideVerification(
      scores({ 'a photo of a pinecone': 0.2, 'a photo of an oak leaf': 0.22 }),
      'a photo of an oak leaf',
    );
    expect(decision.accepted).toBe(true);
    expect(decision.reason).toBe('top-1');
    expect(decision.targetScore).toBe(0.22);
  });

  it('accepts a tie for the top score', () => {
    const decision = decideVerification(
      scores({ 'a photo of a bird': 0.4, 'a photo of moss': 0.4 }),
      'a photo of moss',
    );
    expect(decision.accepted).toBe(true);
    expect(decision.reason).toBe('top-1');
  });

  it('accepts when the target is not first but clears the threshold', () => {
    const decision = decideVerification(
      scores({ 'a photo of a yellow leaf': 0.5, 'a photo of a red leaf': VERIFY_SCORE_THRESHOLD }),
      'a photo of a red leaf',
    );
    expect(decision.accepted).toBe(true);
    expect(decision.reason).toBe('threshold');
  });

  it('rejects when the target loses and stays under the threshold', () => {
    const decision = decideVerification(
      scores({ 'a photo of a dog': 0.8, 'a photo of a bench': 0.1 }),
      'a photo of a bench',
    );
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toBe('reject');
    expect(decision.topLabel).toBe('a photo of a dog');
  });

  it('rejects a missing target label or an empty score list', () => {
    expect(decideVerification(scores({ 'a photo of a stone': 0.9 }), 'a photo of an ant').accepted).toBe(
      false,
    );
    expect(decideVerification([], 'a photo of an ant')).toMatchObject({
      accepted: false,
      reason: 'reject',
      topLabel: null,
      targetScore: 0,
    });
  });
});

describe('verifyPhoto', () => {
  it('asks the classifier for the target and distractors, then applies the decision', async () => {
    const seen: string[][] = [];
    const classifier: ImageClassifier = {
      async classify(_image, labels) {
        seen.push(labels);
        return labels.map((label) => ({
          label,
          score: label === 'a photo of a puddle' ? 0.71 : 0.07,
        }));
      },
    };

    const decision = await verifyPhoto(classifier, photo, 'a photo of a puddle', [
      'a photo of a puddle',
      'a photo of a bird',
      'a photo of moss',
    ]);

    expect(seen).toEqual([['a photo of a puddle', 'a photo of a bird', 'a photo of moss']]);
    expect(decision.accepted).toBe(true);
    expect(decision.reason).toBe('top-1');
  });

  it('rejects from mocked classifier scores when another label wins', async () => {
    const classifier: ImageClassifier = {
      async classify(_image, labels) {
        return labels.map((label, index) => ({
          label,
          score: index === labels.length - 1 ? 0.86 : 0.04,
        }));
      },
    };

    const decision = await verifyPhoto(classifier, photo, 'a photo of a feather', [
      'a photo of a dog',
      'a photo of a bench',
    ]);

    expect(decision.accepted).toBe(false);
    expect(decision.topLabel).toBe('a photo of a bench');
    expect(decision.targetScore).toBe(0.04);
  });
});
