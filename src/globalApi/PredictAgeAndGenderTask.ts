import type * as tf from '@tensorflow/tfjs-core';

import type { AgeAndGenderPrediction } from '../ageGenderNet/types';
import type { TNetInput } from '../dom';
import { extendWithAge, type WithAge } from '../factories/WithAge';
import type { WithFaceDetection } from '../factories/WithFaceDetection';
import type { WithFaceLandmarks } from '../factories/WithFaceLandmarks';
import { extendWithGender, type WithGender } from '../factories/WithGender';
import { ComposableTask } from './ComposableTask';
import {
  ComputeAllFaceDescriptorsTask,
  ComputeSingleFaceDescriptorTask,
} from './ComputeFaceDescriptorsTasks';
import {
  extractAllFacesAndComputeResults,
  extractSingleFaceAndComputeResult,
} from './extractFacesAndComputeResults';
import { nets } from './nets';
import {
  PredictAllFaceExpressionsTask,
  PredictAllFaceExpressionsWithFaceAlignmentTask,
  PredictSingleFaceExpressionsTask,
  PredictSingleFaceExpressionsWithFaceAlignmentTask,
} from './PredictFaceExpressionsTask';

export class PredictAgeAndGenderTaskBase<TReturn, TParentReturn> extends ComposableTask<TReturn> {
  constructor(
    protected parentTask: ComposableTask<TParentReturn> | Promise<TParentReturn>,
    protected input: TNetInput,
    protected extractedFaces?: Array<HTMLCanvasElement | tf.Tensor3D>
  ) {
    super();
  }
}

export class PredictAllAgeAndGenderTask<
  TSource extends WithFaceDetection<object>,
> extends PredictAgeAndGenderTaskBase<WithAge<WithGender<TSource>>[], TSource[]> {
  public async run(): Promise<WithAge<WithGender<TSource>>[]> {
    const parentResults = await this.parentTask;

    const ageAndGenderByFace = await extractAllFacesAndComputeResults<
      TSource,
      AgeAndGenderPrediction[]
    >(
      parentResults,
      this.input,
      async faces =>
        await Promise.all(
          faces.map(
            face => nets.ageGenderNet.predictAgeAndGender(face) as Promise<AgeAndGenderPrediction>
          )
        ),
      this.extractedFaces
    );

    return parentResults.map((parentResult, i) => {
      const { age, gender, genderProbability } = ageAndGenderByFace[i];
      return extendWithAge(extendWithGender(parentResult, gender, genderProbability), age);
    });
  }

  withFaceExpressions() {
    return new PredictAllFaceExpressionsTask(this, this.input);
  }
}

export class PredictSingleAgeAndGenderTask<
  TSource extends WithFaceDetection<object>,
> extends PredictAgeAndGenderTaskBase<
  WithAge<WithGender<TSource>> | undefined,
  TSource | undefined
> {
  public async run(): Promise<WithAge<WithGender<TSource>> | undefined> {
    const parentResult = await this.parentTask;
    if (!parentResult) {
      return;
    }

    const { age, gender, genderProbability } = await extractSingleFaceAndComputeResult<
      TSource,
      AgeAndGenderPrediction
    >(
      parentResult,
      this.input,
      face => nets.ageGenderNet.predictAgeAndGender(face) as Promise<AgeAndGenderPrediction>,
      this.extractedFaces
    );

    return extendWithAge(extendWithGender(parentResult, gender, genderProbability), age);
  }

  withFaceExpressions() {
    return new PredictSingleFaceExpressionsTask(this, this.input);
  }
}

export class PredictAllAgeAndGenderWithFaceAlignmentTask<
  TSource extends WithFaceLandmarks<WithFaceDetection<object>>,
> extends PredictAllAgeAndGenderTask<TSource> {
  withFaceExpressions() {
    return new PredictAllFaceExpressionsWithFaceAlignmentTask(this, this.input);
  }

  withFaceDescriptors() {
    return new ComputeAllFaceDescriptorsTask(this, this.input);
  }
}

export class PredictSingleAgeAndGenderWithFaceAlignmentTask<
  TSource extends WithFaceLandmarks<WithFaceDetection<object>>,
> extends PredictSingleAgeAndGenderTask<TSource> {
  withFaceExpressions() {
    return new PredictSingleFaceExpressionsWithFaceAlignmentTask(this, this.input);
  }

  withFaceDescriptor() {
    return new ComputeSingleFaceDescriptorTask(this, this.input);
  }
}
