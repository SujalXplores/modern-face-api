export class ComposableTask<T> {
  // biome-ignore lint/suspicious/noThenProperty: This class is intentionally designed to be thenable
  public async then(onfulfilled: (value: T) => T | PromiseLike<T>): Promise<T> {
    return onfulfilled(await this.run());
  }

  public async run(): Promise<T> {
    throw new Error('ComposableTask - run is not implemented');
  }
}
