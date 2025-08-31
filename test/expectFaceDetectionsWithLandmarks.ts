import type { FaceLandmarks } from '../src/classes/FaceLandmarks';
import type { FaceLandmarks68 } from '../src/classes/FaceLandmarks68';
import type { WithFaceDetection } from '../src/factories/WithFaceDetection';
import type { WithFaceLandmarks } from '../src/factories/WithFaceLandmarks';
import {
  type ExpectedFaceDetectionWithLandmarks,
  expectPointsClose,
  expectRectClose,
  sortByFaceDetection,
} from './utils';

export type BoxAndLandmarksDeltas = {
  maxScoreDelta: number;
  maxBoxDelta: number;
  maxLandmarksDelta: number;
};

export function expectFaceDetectionsWithLandmarks<
  TFaceLandmarks extends FaceLandmarks = FaceLandmarks68,
>(
  results: WithFaceLandmarks<WithFaceDetection<any>, TFaceLandmarks>[],
  allExpectedFullFaceDescriptions: ExpectedFaceDetectionWithLandmarks[],
  expectedScores: number[],
  deltas: BoxAndLandmarksDeltas
) {
  const expectedFullFaceDescriptions = expectedScores
    .map((score, i) => ({
      score,
      ...allExpectedFullFaceDescriptions[i],
    }))
    .filter(expected => expected.score !== -1);

  const sortedResults = sortByFaceDetection(results);

  expectedFullFaceDescriptions.forEach((expected, i) => {
    const { detection, landmarks } = sortedResults[i];
    expect(Math.abs(detection.score - expected.score)).toBeLessThan(deltas.maxScoreDelta);
    expectRectClose(detection.box, expected.detection, deltas.maxBoxDelta);
    expectPointsClose(landmarks.positions, expected.landmarks, deltas.maxLandmarksDelta);
  });
}
