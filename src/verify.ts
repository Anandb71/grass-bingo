export const VERIFY_SCORE_THRESHOLD = 0.35;

export const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';

export interface LabelScore {
  label: string;
  score: number;
}

export interface ImageClassifier {
  classify(image: Blob, labels: string[]): Promise<LabelScore[]>;
}

export type VerifyReason = 'top-1' | 'threshold' | 'reject';

export interface VerifyDecision {
  accepted: boolean;
  reason: VerifyReason;
  targetScore: number;
  topLabel: string | null;
  scores: LabelScore[];
}

export function decideVerification(
  scores: readonly LabelScore[],
  targetLabel: string,
  threshold = VERIFY_SCORE_THRESHOLD,
): VerifyDecision {
  if (scores.length === 0) {
    return { accepted: false, reason: 'reject', targetScore: 0, topLabel: null, scores: [] };
  }

  const sorted = scores.slice().sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  const top = sorted[0];
  const target = scores.find((entry) => entry.label === targetLabel);
  if (!top || !target) {
    return {
      accepted: false,
      reason: 'reject',
      targetScore: target?.score ?? 0,
      topLabel: top?.label ?? null,
      scores: sorted,
    };
  }

  const best = Math.max(...scores.map((entry) => entry.score));
  if (target.score === best) {
    return { accepted: true, reason: 'top-1', targetScore: target.score, topLabel: top.label, scores: sorted };
  }
  if (target.score >= threshold) {
    return { accepted: true, reason: 'threshold', targetScore: target.score, topLabel: top.label, scores: sorted };
  }
  return { accepted: false, reason: 'reject', targetScore: target.score, topLabel: top.label, scores: sorted };
}

export async function verifyPhoto(
  classifier: ImageClassifier,
  image: Blob,
  targetLabel: string,
  distractors: readonly string[],
  threshold = VERIFY_SCORE_THRESHOLD,
): Promise<VerifyDecision> {
  const labels = [targetLabel, ...distractors.filter((label) => label !== targetLabel)];
  const scores = await classifier.classify(image, labels);
  return decideVerification(scores, targetLabel, threshold);
}

/** Stand-in checker for `?demo=1`. The first label is treated as the match. */
export function createMockClassifier(): ImageClassifier {
  return {
    async classify(_image, labels) {
      const others = Math.max(labels.length - 1, 1);
      return labels.map((label, index) => ({
        label,
        score: index === 0 ? 0.86 : 0.14 / others,
      }));
    },
  };
}
