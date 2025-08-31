import { isValidNumber } from '../utils';
import type { IBoundingBox } from './BoundingBox';
import { Box } from './Box';
import type { IRect } from './Rect';

export class LabeledBox extends Box<LabeledBox> {
  public static assertIsValidLabeledBox(box: unknown, callee: string) {
    Box.assertIsValidBox(box, callee);

    const boxRecord = box as Record<string, unknown>;
    if (!isValidNumber(boxRecord.label)) {
      throw new Error(`${callee} - expected property label (${boxRecord.label}) to be a number`);
    }
  }

  private _label: number;

  constructor(box: IBoundingBox | IRect | unknown, label: number) {
    super(box as IBoundingBox | IRect);
    this._label = label;
  }

  public get label(): number {
    return this._label;
  }
}
