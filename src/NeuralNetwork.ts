import * as tf from '@tensorflow/tfjs-core';

import type { ParamMapping } from './common';
import { getModelUris } from './common/getModelUris';
import { loadWeightMap } from './dom';
import { env } from './env';

interface TraverseContext {
  nextObj: Record<string, unknown>;
  obj?: Record<string, unknown>;
  objProp?: string;
}

export abstract class NeuralNetwork<TNetParams> {
  protected _params: TNetParams | undefined = undefined;
  protected _paramMappings: ParamMapping[] = [];

  constructor(protected _name: string) {}

  public get params(): TNetParams | undefined {
    return this._params;
  }
  public get paramMappings(): ParamMapping[] {
    return this._paramMappings;
  }
  public get isLoaded(): boolean {
    return !!this.params;
  }

  public getParamFromPath(paramPath: string): tf.Tensor {
    const { obj, objProp } = this.traversePropertyPath(paramPath);
    return obj[objProp] as tf.Tensor;
  }

  public reassignParamFromPath(paramPath: string, tensor: tf.Tensor) {
    const { obj, objProp } = this.traversePropertyPath(paramPath);
    (obj[objProp] as tf.Tensor).dispose();
    obj[objProp] = tensor;
  }

  public getParamList() {
    return this._paramMappings.map(({ paramPath }) => ({
      path: paramPath,
      tensor: this.getParamFromPath(paramPath),
    }));
  }

  public getTrainableParams() {
    return this.getParamList().filter(param => param.tensor instanceof tf.Variable);
  }

  public getFrozenParams() {
    return this.getParamList().filter(param => !(param.tensor instanceof tf.Variable));
  }

  public variable() {
    this.getFrozenParams().forEach(({ path, tensor }) => {
      this.reassignParamFromPath(path, tensor.variable());
    });
  }

  public freeze() {
    this.getTrainableParams().forEach(({ path, tensor: variable }) => {
      const tensor = tf.tensor(variable.dataSync());
      variable.dispose();
      this.reassignParamFromPath(path, tensor);
    });
  }

  public dispose(throwOnRedispose: boolean = true) {
    this.getParamList().forEach(param => {
      if (throwOnRedispose && param.tensor.isDisposed) {
        throw new Error(`param tensor has already been disposed for path ${param.path}`);
      }
      param.tensor.dispose();
    });
    this._params = undefined;
  }

  public serializeParams(): Float32Array {
    const chunks = this.getParamList().map(({ tensor }) => tensor.dataSync());
    let totalLength = 0;
    for (const chunk of chunks) totalLength += chunk.length;

    const out = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  public async load(weightsOrUrl: Float32Array | string | undefined): Promise<void> {
    if (weightsOrUrl instanceof Float32Array) {
      this.extractWeights(weightsOrUrl);
      return;
    }

    await this.loadFromUri(weightsOrUrl);
  }

  public async loadFromUri(uri: string | undefined) {
    if (uri && typeof uri !== 'string') {
      throw new Error(`${this._name}.loadFromUri - expected model uri`);
    }

    const weightMap = await loadWeightMap(uri, this.getDefaultModelName());
    this.loadFromWeightMap(weightMap);
  }

  public async loadFromDisk(filePath: string | undefined) {
    if (filePath && typeof filePath !== 'string') {
      throw new Error(`${this._name}.loadFromDisk - expected model file path`);
    }

    const { readFile } = env.getEnv();

    const { manifestUri, modelBaseUri } = getModelUris(filePath, this.getDefaultModelName());

    const fetchWeightsFromDisk = (filePaths: string[]): Promise<ArrayBuffer[]> =>
      Promise.all(
        filePaths.map(filePath =>
          readFile(filePath).then(buf => {
            // `Buffer` instances share a pooled ArrayBuffer with other allocations,
            // so we must slice using byteOffset/byteLength to get only this buffer's bytes.
            const slice = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
            return slice as ArrayBuffer;
          })
        )
      );
    const loadWeights = tf.io.weightsLoaderFactory(fetchWeightsFromDisk);

    const manifest = JSON.parse((await readFile(manifestUri)).toString());
    const weightMap = await loadWeights(manifest, modelBaseUri);

    this.loadFromWeightMap(weightMap);
  }

  public loadFromWeightMap(weightMap: tf.NamedTensorMap) {
    const { paramMappings, params } = this.extractParamsFromWeightMap(weightMap);

    this._paramMappings = paramMappings;
    this._params = params;
  }

  public extractWeights(weights: Float32Array) {
    const { paramMappings, params } = this.extractParams(weights);

    this._paramMappings = paramMappings;
    this._params = params;
  }

  private traversePropertyPath(paramPath: string) {
    if (!this.params) {
      throw new Error(`traversePropertyPath - model has no loaded params`);
    }

    const result = paramPath.split('/').reduce(
      (res: TraverseContext, objProp) => {
        if (!(objProp in res.nextObj)) {
          throw new Error(
            `traversePropertyPath - object does not have property ${objProp}, for path ${paramPath}`
          );
        }

        return {
          obj: res.nextObj,
          objProp,
          nextObj: res.nextObj[objProp] as Record<string, unknown>,
        };
      },
      { nextObj: this.params as Record<string, unknown> }
    );

    const { obj, objProp } = result;
    if (!obj || !objProp || !(obj[objProp] instanceof tf.Tensor)) {
      throw new Error(`traversePropertyPath - parameter is not a tensor, for path ${paramPath}`);
    }

    return { obj, objProp };
  }

  protected abstract getDefaultModelName(): string;

  /**
   * Extracts model parameters from a TensorFlow.js weight map.
   *
   * Subclasses should implement this method. A deprecated misspelled alias
   * `extractParamsFromWeigthMap` is still supported for backward compatibility,
   * but will be removed in a future major version.
   */
  protected extractParamsFromWeightMap(weightMap: tf.NamedTensorMap): {
    params: TNetParams;
    paramMappings: ParamMapping[];
  } {
    if (this._isDelegatingWeightMapCall) {
      throw new Error(
        `${this._name} - subclass must override extractParamsFromWeightMap (new name) or extractParamsFromWeigthMap (deprecated)`
      );
    }
    this._isDelegatingWeightMapCall = true;
    try {
      return this.extractParamsFromWeigthMap(weightMap);
    } finally {
      this._isDelegatingWeightMapCall = false;
    }
  }

  /**
   * @deprecated Misspelled name; override `extractParamsFromWeightMap` instead.
   * This alias is kept for backward compatibility with older subclasses.
   */
  protected extractParamsFromWeigthMap(weightMap: tf.NamedTensorMap): {
    params: TNetParams;
    paramMappings: ParamMapping[];
  } {
    if (this._isDelegatingWeightMapCall) {
      throw new Error(
        `${this._name} - subclass must override extractParamsFromWeightMap (new name) or extractParamsFromWeigthMap (deprecated)`
      );
    }
    this._isDelegatingWeightMapCall = true;
    try {
      return this.extractParamsFromWeightMap(weightMap);
    } finally {
      this._isDelegatingWeightMapCall = false;
    }
  }

  protected abstract extractParams(weights: Float32Array): {
    params: TNetParams;
    paramMappings: ParamMapping[];
  };

  private _isDelegatingWeightMapCall = false;
}
