export type LoadState = 'idle' | 'success' | 'error' | 'loading';

export type LoadResponse<T> = LoadIdle<T> | LoadLoading<T> | LoadSuccess<T> | LoadError<T>;

export type LoadIdle<T, S extends LoadState = 'idle'> = {
  state: S;
  value: T | undefined;
};

export type LoadSuccess<T, S extends LoadState = 'success'> = {
  state: S;
  value: T;
};

export type LoadError<T, S extends LoadState = 'error'> = {
  state: S;
  error: unknown;
};

export type LoadLoading<T, S extends LoadState = 'loading'> = {
  state: S;
  value: T | undefined;
};

export function createLoadIdle<T>(value?: T | undefined): LoadIdle<T> {
  return {
    state: 'idle',
    value,
  };
}

export function createLoadSuccess<T>(value: T): LoadSuccess<T> {
  return {
    state: 'success',
    value,
  };
}

export function createLoadLoading<T>(value: T | undefined): LoadLoading<T> {
  return {
    state: 'loading',
    value,
  };
}

export function createLoadError<T>(error: unknown): LoadError<T> {
  return {
    state: 'error',
    error,
  };
}
