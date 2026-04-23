export const FACE_EXPRESSION_LABELS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised',
] as const;

export type FaceExpressionLabel = (typeof FACE_EXPRESSION_LABELS)[number];

type ExpressionProbabilities = Record<FaceExpressionLabel, number>;

export class FaceExpressions {
  public neutral = 0;
  public happy = 0;
  public sad = 0;
  public angry = 0;
  public fearful = 0;
  public disgusted = 0;
  public surprised = 0;

  constructor(probabilities: number[] | Float32Array) {
    if (probabilities.length !== 7) {
      throw new Error(
        `FaceExpressions.constructor - expected probabilities.length to be 7, have: ${probabilities.length}`
      );
    }

    const target = this as unknown as ExpressionProbabilities;
    FACE_EXPRESSION_LABELS.forEach((expression, idx) => {
      target[expression] = probabilities[idx];
    });
  }

  asSortedArray() {
    const source = this as unknown as ExpressionProbabilities;
    return FACE_EXPRESSION_LABELS.map(expression => ({
      expression,
      probability: source[expression],
    })).sort((e0, e1) => e1.probability - e0.probability);
  }
}
