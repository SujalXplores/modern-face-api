import type * as tf from '@tensorflow/tfjs-core';
import { isTensor } from '../utils';
import type { ParamMapping } from './types';

export function extractWeightEntryFactory(
  weightMap: tf.NamedTensorMap,
  paramMappings: ParamMapping[]
) {
  return <T extends tf.Tensor>(originalPath: string, paramRank: number, mappedPath?: string): T => {
    const tensor = weightMap[originalPath];

    if (!isTensor(tensor, paramRank)) {
      throw new Error(
        `expected weightMap[${originalPath}] to be a Tensor${paramRank}D, instead have ${tensor}`
      );
    }

    paramMappings.push({ originalPath, paramPath: mappedPath || originalPath });

    return tensor as T;
  };
}
