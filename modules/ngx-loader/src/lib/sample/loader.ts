/**
 * This is a POC of a compositable helper to
 * load entities from an api. It should provide
 * some helper function for DX.
 *
 * Following things should be possible for V1:
 *
 * - [x] Load entities via {HttpClient}
 * - [x] React on reactive variables (Observables or Signals) which retrigger loading entities
 * - [x] Optimistic update of entites
 * - [ ] On Demand reload of entities
 * - [ ] List should be filterable on client side
 *
 * Optional Goals:
 *
 * - [ ] createLoaderWithResolver
 *  - a specialized kind of loader that exports a resolver
 *    that can be hooked up and provides the first value of the createLoader
 */

import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  debounceTime,
  filter,
  isObservable,
  map,
  of,
  switchMap,
} from 'rxjs';

export type LoaderState<Result, Error> = {
  value: Result | undefined;
  state: 'idle' | 'loading' | 'success' | 'error';
  error: Error | null;
  metadata: {
    timestamp: number | undefined;
  };
};

class Loader<Result, Params, Error = unknown> {
  private readonly _result$ = new BehaviorSubject<Result | undefined>(
    undefined
  );
  private readonly _params$ = new ReplaySubject<Params>(1);
  private readonly params = toSignal(this._params$);
  private readonly _error$ = new Subject<Error>();

  private readonly _loaderState$ = new ReplaySubject<
    LoaderState<Result, Error>
  >(1);

  private connectSubscription?: Subscription;
  private connectFromLoaderSubscription?: Subscription;

  constructor(private loaderFn: (params: Params) => Observable<Result>) {
    this._loaderState$.next({
      state: 'idle',
      value: undefined,
      error: null,
      metadata: {
        timestamp: undefined,
      },
    });

    this._params$
      .pipe(
        switchMap((params) =>
          this.loaderFn(params).pipe(
            catchError((err) => {
              this._error$.next(err);
              return of();
            })
          )
        )
      )
      .subscribe((result) => {
        this._result$.next(result);
      });

    this._params$.subscribe(() => {
      this._loaderState$.next({
        state: 'loading',
        value: this._result$.getValue(),
        error: null,
        metadata: {
          timestamp: undefined,
        },
      });
    });

    this.result$.subscribe((res) => {
      this._loaderState$.next({
        value: res,
        state: 'success',
        error: null,
        metadata: {
          timestamp: Date.now(),
        },
      });
    });

    this._error$.subscribe((err) =>
      this._loaderState$.next({
        value: undefined,
        state: 'error',
        error: err,
        metadata: {
          timestamp: undefined,
        },
      })
    );
  }

  load(params: Params) {
    this._params$.next(params);
  }

  reload() {
    const lastParams = this.params();
    if (!lastParams) {
      throw new Error(
        `Cannot load before the loader has been loaded at least once.`
      );
    }

    this.load(lastParams);
  }

  update(mutatorFn: (value: Result | undefined) => Result | undefined) {
    this._result$.next(mutatorFn(this._result$.getValue()));
  }

  connect(params: Observable<Params> | Signal<Params>) {
    const paramsObs = isObservable(params) ? params : toObservable(params);
    this.connectSubscription?.unsubscribe();
    this.connectSubscription = paramsObs.subscribe((params) =>
      this._params$.next(params)
    );
  }
  connectFromLoader(
    loader:
      | Observable<LoaderState<Params, unknown>>
      | Signal<LoaderState<Params, unknown>>
  ) {
    const loaderObs = isObservable(loader) ? loader : toObservable(loader);
    this.connectFromLoaderSubscription?.unsubscribe();
    this.connectFromLoaderSubscription = loaderObs
      .pipe(
        map((res) => res.value),
        filter((value): value is Params => value !== undefined)
      )
      .subscribe((value) => {
        this._params$.next(value);
      });
  }

  destroy() {
    this.connectSubscription?.unsubscribe();
  }

  get result$() {
    return this._result$.asObservable();
  }

  get s$() {
    return this._loaderState$.asObservable();
  }
}

export const createLoader2 = <Result, Params>(
  loaderFn: (params: Params) => Observable<Result>
) => {
  const loader = new Loader(loaderFn);

  return {
    $: loader.result$,
    s$: loader.s$,
    load: loader.load.bind(loader),
    connect: loader.connect.bind(loader),
    connectFromLoader: loader.connectFromLoader.bind(loader),
    update: loader.update.bind(loader),
    reload: loader.reload.bind(loader),
  };
};

type CreateLoaderReturn<Result, Params> = ReturnType<
  typeof createLoader2<Result, Params>
>;

type CreateLoaderReturnType<L> = L extends CreateLoaderReturn<infer T, any>
  ? T
  : never;

// export function forkJoin<T extends Record<string, ObservableInput<any>>>(
//   sourcesObject: T
// ): Observable<{ [K in keyof T]: ObservedValueOf<T[K]> }>;

// export type ObservedValueOf<O> = O extends ObservableInput<infer T> ? T : never;

// TODO: hier sollte ein besseres handling für die values gemacht werden
// gerade wird sobald ein neues value da ist, dieses in das result gepackt.
// eigentlich, sollte das values objekt erst "enriched" werden, wenn alle loader
// auf 'success' gewechselt haben.
export const mergeLoader = <
  T extends Record<string, CreateLoaderReturn<any, any>>
>(
  sourcesLoader: T
): Omit<
  CreateLoaderReturn<
    { [K in keyof T]: CreateLoaderReturnType<T[K]> | undefined },
    unknown
  >,
  '$' | 'load' | 'connect' | 'connectFromLoader' | 'update' | 'reload'
> => {
  const mergedLoaders = combineLatest(
    Object.keys(sourcesLoader).reduce((acc, key) => {
      const loader = sourcesLoader[key];
      acc[key] = loader.s$;
      return acc;
    }, {} as Record<string, Observable<LoaderState<any, any>>>)
  );

  const mergedResult = mergedLoaders.pipe(
    debounceTime(100),
    map((obj) => {
      console.log('merge', obj);
      const isError = Object.values(obj).some((s) => s.state === 'error');
      const isLoading = Object.values(obj).some((s) => s.state === 'loading');
      const isIdle = Object.values(obj).some((s) => s.state === 'idle');
      const isSuccess = Object.values(obj).every((s) => s.state === 'success');

      const values = Object.keys(obj).reduce((acc, key) => {
        acc[key] = obj[key].value;
        return acc;
      }, {} as Record<string, any>);

      if (isError) {
        const errors = Object.keys(obj).reduce((acc, key) => {
          acc[key] = obj[key].error;
          return acc;
        }, {} as Record<string, unknown>);

        return <LoaderState<any, any>>{
          state: 'error',
          value: values,
          error: errors,
          metadata: {
            timestamp: undefined,
          },
        };
      }

      if (isLoading) {
        return <LoaderState<any, any>>{
          state: 'loading',
          value: values,
          error: null,
          metadata: {
            timestamp: undefined,
          },
        };
      }

      if (isIdle) {
        return <LoaderState<any, any>>{
          state: 'idle',
          value: values,
          error: null,
          metadata: {
            timestamp: undefined,
          },
        };
      }

      return <LoaderState<any, any>>{
        state: 'success',
        value: values,
        error: null,
        metadata: {
          timestamp: undefined,
        },
      };
    })
  );

  return {
    s$: mergedResult,
  };
};
