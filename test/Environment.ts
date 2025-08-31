import type { NeuralNetwork } from '../src';

export type TestEnv = {
  loadImage: (uri: string) => Promise<HTMLImageElement>;
  loadJson: <T>(uri: string) => Promise<T>;
  initNet: <TNet extends NeuralNetwork<unknown>>(
    net: TNet,
    uncompressedFilename?: string | boolean,
    isUnusedModel?: boolean
  ) => Promise<void>;
};
