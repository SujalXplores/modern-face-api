import * as fs from 'node:fs';
import * as path from 'node:path';

import { env, type NeuralNetwork } from '../src';
import type { TestEnv } from './Environment';

require('@tensorflow/tfjs-node');
const canvas = require('canvas');

const { Canvas, Image, ImageData } = canvas;
env.monkeyPatch({ Canvas, Image, ImageData });

async function loadImageNode(uri: string): Promise<HTMLImageElement> {
  return canvas.loadImage(path.resolve(__dirname, '../', uri));
}

async function loadJsonNode<T>(uri: string): Promise<T> {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../', uri)).toString());
}

export async function initNetNode<TNet extends NeuralNetwork<unknown>>(net: TNet): Promise<void> {
  await net.loadFromDisk(path.resolve(__dirname, '../weights'));
}

const nodeTestEnv: TestEnv = {
  loadImage: loadImageNode,
  loadJson: loadJsonNode,
  initNet: initNetNode,
};

(global as any).nodeTestEnv = nodeTestEnv;
