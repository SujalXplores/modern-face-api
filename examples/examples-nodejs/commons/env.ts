// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
const loadTensorFlowBindings = async () => {
  try {
    await import('@tensorflow/tfjs-node');
    console.log('TensorFlow.js Node.js bindings loaded successfully');
  } catch (error) {
    console.warn('TensorFlow.js Node.js bindings not available, using CPU-only mode:', error.message);
  }
};

import * as faceapi from 'modern-face-api';

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
const canvas = require('canvas')

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

export { canvas, loadTensorFlowBindings }