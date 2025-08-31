import { FaceExpressions } from '../faceExpressionNet/FaceExpressions';

export type WithFaceExpressions<TSource> = TSource & {
  expressions: FaceExpressions;
};

export function isWithFaceExpressions(obj: unknown): obj is WithFaceExpressions<object> {
  return !!(
    obj &&
    typeof obj === 'object' &&
    (obj as { expressions?: unknown }).expressions instanceof FaceExpressions
  );
}

export function extendWithFaceExpressions<TSource>(
  sourceObj: TSource,
  expressions: FaceExpressions
): WithFaceExpressions<TSource> {
  const extension = { expressions };
  return Object.assign({}, sourceObj, extension);
}
