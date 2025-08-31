import { createFileSystem } from './createFileSystem';
import type { Environment } from './types';

export function createNodejsEnv(): Environment {
  const globalAny = global as any;
  const Canvas = globalAny.Canvas || globalAny.HTMLCanvasElement;
  const Image = globalAny.Image || globalAny.HTMLImageElement;

  const createCanvasElement = () => {
    if (Canvas) {
      return new Canvas();
    }
    throw new Error('createCanvasElement - missing Canvas implementation for nodejs environment');
  };

  const createImageElement = () => {
    if (Image) {
      return new Image();
    }
    throw new Error('createImageElement - missing Image implementation for nodejs environment');
  };

  const fetch =
    globalAny.fetch ||
    (() => {
      throw new Error('fetch - missing fetch implementation for nodejs environment');
    });

  const fileSystem = createFileSystem();

  return {
    Canvas: Canvas || class {},
    CanvasRenderingContext2D: globalAny.CanvasRenderingContext2D || class {},
    Image: Image || class {},
    ImageData: globalAny.ImageData || class {},
    Video: globalAny.HTMLVideoElement || class {},
    createCanvasElement,
    createImageElement,
    fetch,
    ...fileSystem,
  };
}
