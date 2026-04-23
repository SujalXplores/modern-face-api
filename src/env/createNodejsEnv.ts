import { createFileSystem } from './createFileSystem';
import type { Environment } from './types';

type GlobalPolyfills = {
  Canvas?: typeof HTMLCanvasElement;
  HTMLCanvasElement?: typeof HTMLCanvasElement;
  Image?: typeof HTMLImageElement;
  HTMLImageElement?: typeof HTMLImageElement;
  ImageData?: typeof ImageData;
  CanvasRenderingContext2D?: typeof CanvasRenderingContext2D;
  HTMLVideoElement?: typeof HTMLVideoElement;
  fetch?: typeof fetch;
};

export function createNodejsEnv(): Environment {
  const globalPolyfills = globalThis as unknown as GlobalPolyfills;
  const Canvas = globalPolyfills.Canvas || globalPolyfills.HTMLCanvasElement;
  const Image = globalPolyfills.Image || globalPolyfills.HTMLImageElement;

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
    globalPolyfills.fetch ||
    (() => {
      throw new Error('fetch - missing fetch implementation for nodejs environment');
    });

  const fileSystem = createFileSystem();

  return {
    Canvas: Canvas || (class {} as unknown as typeof HTMLCanvasElement),
    CanvasRenderingContext2D:
      globalPolyfills.CanvasRenderingContext2D ||
      (class {} as unknown as typeof CanvasRenderingContext2D),
    Image: Image || (class {} as unknown as typeof HTMLImageElement),
    ImageData: globalPolyfills.ImageData || (class {} as unknown as typeof ImageData),
    Video: globalPolyfills.HTMLVideoElement || (class {} as unknown as typeof HTMLVideoElement),
    createCanvasElement,
    createImageElement,
    fetch,
    ...fileSystem,
  };
}
