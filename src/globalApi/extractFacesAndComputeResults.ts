import * as tf from '@tensorflow/tfjs-core';

import type { Box } from '../classes/Box';
import type { FaceDetection } from '../classes/FaceDetection';
import type { FaceLandmarks } from '../classes/FaceLandmarks';
import type { Rect } from '../classes/Rect';
import { extractFaces, extractFaceTensors, type TNetInput } from '../dom';
import type { WithFaceDetection } from '../factories/WithFaceDetection';
import { isWithFaceLandmarks, type WithFaceLandmarks } from '../factories/WithFaceLandmarks';

type AlignmentRect = FaceDetection | Rect | Box;

export async function extractAllFacesAndComputeResults<
  TSource extends WithFaceDetection<object>,
  TResult,
>(
  parentResults: TSource[],
  input: TNetInput,
  computeResults: (faces: Array<HTMLCanvasElement | tf.Tensor3D>) => Promise<TResult>,
  extractedFaces?: Array<HTMLCanvasElement | tf.Tensor3D> | null,
  getRectForAlignment: (
    parentResult: WithFaceLandmarks<TSource, FaceLandmarks>
  ) => AlignmentRect = ({ alignedRect }) => alignedRect
) {
  const faceBoxes: Array<FaceDetection | Rect> = parentResults.map(parentResult => {
    const rect: AlignmentRect = isWithFaceLandmarks(parentResult)
      ? getRectForAlignment(parentResult)
      : parentResult.detection;
    return rect as FaceDetection | Rect;
  });
  const faces: Array<HTMLCanvasElement | tf.Tensor3D> =
    extractedFaces ||
    (input instanceof tf.Tensor
      ? await extractFaceTensors(input, faceBoxes)
      : await extractFaces(input, faceBoxes));

  const results = await computeResults(faces);

  faces.forEach(f => {
    if (f instanceof tf.Tensor) {
      f.dispose();
    }
  });

  return results;
}

export async function extractSingleFaceAndComputeResult<
  TSource extends WithFaceDetection<object>,
  TResult,
>(
  parentResult: TSource,
  input: TNetInput,
  computeResult: (face: HTMLCanvasElement | tf.Tensor3D) => Promise<TResult>,
  extractedFaces?: Array<HTMLCanvasElement | tf.Tensor3D> | null,
  getRectForAlignment?: (parentResult: WithFaceLandmarks<TSource, FaceLandmarks>) => AlignmentRect
) {
  return extractAllFacesAndComputeResults<TSource, TResult>(
    [parentResult],
    input,
    async faces => computeResult(faces[0]),
    extractedFaces,
    getRectForAlignment
  );
}
