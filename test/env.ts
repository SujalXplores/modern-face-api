import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import { fetchImage, fetchJson, fetchNetWeights, type NeuralNetwork } from '../src';
import type { TestEnv } from './Environment';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

// Ensure backend is ready before any operations
async function initBackend() {
  await tf.ready();
  if (
    typeof window !== 'undefined' &&
    (window as any).__karma__ &&
    ((window as any).__karma__.config.jasmine.args as string[]).some(arg => arg === 'backend_cpu')
  ) {
    await tf.setBackend('cpu');
  }
}

// Initialize backend immediately
initBackend();

async function loadImageBrowser(uri: string): Promise<HTMLImageElement> {
  return fetchImage(`base${uri.startsWith('/') ? '' : '/'}${uri}`);
}

async function loadJsonBrowser<T>(uri: string): Promise<T> {
  return fetchJson<T>(`base${uri.startsWith('/') ? '' : '/'}${uri}`);
}

async function initNetBrowser<TNet extends NeuralNetwork<unknown>>(
  net: TNet,
  uncompressedFilename?: string | boolean,
  isUnusedModel: boolean = false
): Promise<void> {
  const url = uncompressedFilename
    ? await fetchNetWeights(`base/weights_uncompressed/${uncompressedFilename}`)
    : isUnusedModel
      ? 'base/weights_unused'
      : 'base/weights';
  await net.load(url);
}

const browserTestEnv: TestEnv = {
  loadImage: loadImageBrowser,
  loadJson: loadJsonBrowser,
  initNet: initNetBrowser,
};

export function getTestEnv(): TestEnv {
  return (
    (typeof window !== 'undefined' ? (window as any).nodeTestEnv : (global as any).nodeTestEnv) ||
    browserTestEnv
  );
}
