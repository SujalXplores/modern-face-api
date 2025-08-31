import type * as tf from '@tensorflow/tfjs-core';

import type { ConvParams } from './types';

export function loadConvParamsFactory(
  extractWeightEntry: <T extends tf.Tensor>(originalPath: string, paramRank: number) => T
) {
  return (prefix: string): ConvParams => {
    const filters = extractWeightEntry<tf.Tensor4D>(`${prefix}/filters`, 4);
    const bias = extractWeightEntry<tf.Tensor1D>(`${prefix}/bias`, 1);

    return { filters, bias };
  };
}
