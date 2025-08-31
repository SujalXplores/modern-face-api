import { euclideanDistance } from '../src/euclideanDistance';
import type { WithFaceDescriptor } from '../src/factories/WithFaceDescriptor';
import type { WithFaceDetection } from '../src/factories/WithFaceDetection';
import type { WithFaceLandmarks } from '../src/factories/WithFaceLandmarks';
import type { BoxAndLandmarksDeltas } from './expectFaceDetectionsWithLandmarks';
import {
  type ExpectedFullFaceDescription,
  expectPointClose,
  expectRectClose,
  sortByFaceDetection,
} from './utils';

export type FullFaceDescriptionDeltas = BoxAndLandmarksDeltas & {
  maxDescriptorDelta: number;
};

export function expectFullFaceDescriptions(
  results: WithFaceDescriptor<WithFaceLandmarks<WithFaceDetection<any>>>[],
  allExpectedFullFaceDescriptions: ExpectedFullFaceDescription[],
  expectedScores: number[],
  deltas: FullFaceDescriptionDeltas
) {
  const expectedFullFaceDescriptions = expectedScores
    .map((score, i) => ({
      score,
      ...allExpectedFullFaceDescriptions[i],
    }))
    .filter(expected => expected.score !== -1);

  const sortedResults = sortByFaceDetection(results);

  expectedFullFaceDescriptions.forEach((expected, i) => {
    const { detection, landmarks, descriptor } = sortedResults[i];
    expect(Math.abs(detection.score - expected.score)).toBeLessThan(deltas.maxScoreDelta);
    expectRectClose(detection.box, expected.detection, deltas.maxBoxDelta);
    landmarks.positions.forEach((pt: any, j: number) => {
      expectPointClose(pt, expected.landmarks[j], deltas.maxLandmarksDelta);
    });
    expect(euclideanDistance(descriptor, expected.descriptor)).toBeLessThan(
      deltas.maxDescriptorDelta
    );
  });
}
