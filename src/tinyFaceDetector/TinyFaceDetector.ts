import type * as tf from '@tensorflow/tfjs-core';

import { FaceDetection, type Point } from '../classes';
import type { ParamMapping } from '../common';
import type { TNetInput } from '../dom';
import type { ITinyYolov2Options } from '../tinyYolov2';
import { TinyYolov2Base } from '../tinyYolov2/TinyYolov2Base';
import type { TinyYolov2NetParams } from '../tinyYolov2/types';
import { BOX_ANCHORS, IOU_THRESHOLD, MEAN_RGB } from './const';

export class TinyFaceDetector extends TinyYolov2Base {
  constructor() {
    const config = {
      withSeparableConvs: true,
      iouThreshold: IOU_THRESHOLD,
      classes: ['face'],
      anchors: BOX_ANCHORS,
      meanRgb: MEAN_RGB,
      isFirstLayerConv2d: true,
      filterSizes: [3, 16, 32, 64, 128, 256, 512],
    };

    super(config);
  }

  public get anchors(): Point[] {
    return this.config.anchors;
  }

  public async locateFaces(
    input: TNetInput,
    forwardParams: ITinyYolov2Options
  ): Promise<FaceDetection[]> {
    const objectDetections = await this.detect(input, forwardParams);
    return objectDetections.map(
      det =>
        new FaceDetection(det.score, det.relativeBox, {
          width: det.imageWidth,
          height: det.imageHeight,
        })
    );
  }

  protected getDefaultModelName(): string {
    return 'tiny_face_detector_model';
  }

  protected extractParamsFromWeigthMap(weightMap: tf.NamedTensorMap): {
    params: TinyYolov2NetParams;
    paramMappings: ParamMapping[];
  } {
    return super.extractParamsFromWeigthMap(weightMap);
  }
}
