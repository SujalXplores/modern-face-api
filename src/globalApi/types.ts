import type { FaceDetection } from '../classes/FaceDetection';
import type { TNetInput } from '../dom';
import type { MtcnnOptions } from '../mtcnn/MtcnnOptions';
import type { SsdMobilenetv1Options } from '../ssdMobilenetv1/SsdMobilenetv1Options';
import type { TinyFaceDetectorOptions } from '../tinyFaceDetector/TinyFaceDetectorOptions';
import type { TinyYolov2Options } from '../tinyYolov2';

export type FaceDetectionOptions =
  | TinyFaceDetectorOptions
  | SsdMobilenetv1Options
  | MtcnnOptions
  | TinyYolov2Options;

export type FaceDetectionFunction = (input: TNetInput) => Promise<FaceDetection[]>;
