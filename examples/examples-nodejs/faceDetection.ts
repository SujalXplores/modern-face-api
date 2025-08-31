import * as faceapi from 'modern-face-api';

import { canvas, faceDetectionNet, faceDetectionOptions, saveFile, loadTensorFlowBindings } from './commons';

async function run() {
  // Load TensorFlow bindings (optional)
  await loadTensorFlowBindings();

  await faceDetectionNet.loadFromDisk('../../weights')

  const img = await canvas.loadImage('../images/bbt1.jpg')
  const detections = await faceapi.detectAllFaces(img, faceDetectionOptions)

  const out = faceapi.createCanvasFromMedia(img) as any
  faceapi.draw.drawDetections(out, detections)

  saveFile('faceDetection.jpg', out.toBuffer('image/jpeg'))
  console.log('done, saved results to out/faceDetection.jpg')
}

run()
