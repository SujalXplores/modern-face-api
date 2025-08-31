import { isValidProbablitiy } from '../utils';
import type { IBoundingBox } from './BoundingBox';
import { LabeledBox } from './LabeledBox';
import type { IRect } from './Rect';

export class PredictedBox extends LabeledBox {
  public static assertIsValidPredictedBox(box: unknown, callee: string) {
    LabeledBox.assertIsValidLabeledBox(box, callee);

    const boxRecord = box as Record<string, unknown>;
    if (!isValidProbablitiy(boxRecord.score) || !isValidProbablitiy(boxRecord.classScore)) {
      throw new Error(
        `${callee} - expected properties score (${boxRecord.score}) and (${boxRecord.classScore}) to be a number between [0, 1]`
      );
    }
  }

  private _score: number;
  private _classScore: number;

  constructor(
    box: IBoundingBox | IRect | unknown,
    label: number,
    score: number,
    classScore: number
  ) {
    super(box, label);
    this._score = score;
    this._classScore = classScore;
  }

  public get score(): number {
    return this._score;
  }
  public get classScore(): number {
    return this._classScore;
  }
}
