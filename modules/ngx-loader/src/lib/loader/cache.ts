export interface LoaderCache<Result, Params> {
  save: (params: Params, value: Result) => void;
  get: (params: Params) => Result | undefined;
}

export class SimpleLoaderCache<Result, Params> implements LoaderCache<Result, Params> {
  private readonly cache = new Map<Params, Result>();

  save(params: Params, value: Result) {
    this.cache.set(params, value);
  }

  get(params: Params) {
    return this.cache.get(params);
  }
}
