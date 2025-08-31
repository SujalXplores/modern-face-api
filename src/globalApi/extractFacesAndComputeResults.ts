import * as tf from '@tensorflow/tfjs-core';

import type { FaceDetection } from '../classes/FaceDetection';
import type { FaceLandmarks } from '../classes/FaceLandmarks';
import { extractFaces, extractFaceTensors, type TNetInput } from '../dom';
import type { WithFaceDetection } from '../factories/WithFaceDetection';
import { isWithFaceLandmarks, type WithFaceLandmarks } from '../factories/WithFaceLandmarks';

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
  ) => FaceDetection = ({ alignedRect }) => alignedRect
) {
  const faceBoxes = parentResults.map(parentResult =>
    isWithFaceLandmarks(parentResult) ? getRectForAlignment(parentResult) : parentResult.detection
  );
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
  getRectForAlignment?: (parentResult: WithFaceLandmarks<TSource, FaceLandmarks>) => FaceDetection
) {
  return extractAllFacesAndComputeResults<TSource, TResult>(
    [parentResult],
    input,
    async faces => computeResult(faces[0]),
    extractedFaces,
    getRectForAlignment
  );
}
