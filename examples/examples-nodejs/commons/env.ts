import canvas from 'canvas';
import * as faceapi from 'modern-face-api';

// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
const loadTensorFlowBindings = async (): Promise<void> => {
  try {
    await import('@tensorflow/tfjs-node');
  } catch (_error) {
    // fall back to the pure-JS backend already bundled with modern-face-api
  }
};

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export { canvas, loadTensorFlowBindings };
