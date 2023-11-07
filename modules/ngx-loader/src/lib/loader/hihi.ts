import { Signal, computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  filter,
  iif,
  map,
  of,
  retry,
  switchMap,
  take,
  tap,
} from 'rxjs';

type LoaderFn<Result, Params> = (params: Params) => Observable<Result>;

export type LoaderState = 'initial' | 'idle' | 'pending' | 'success' | 'error';

export class LoaderMetadata {
  timestamp: number | undefined = undefined;
  cached? = false;
  constructor(metadata?: Partial<LoaderMetadata>) {
    Object.assign(this, { ...this, metadata });
  }
}

export class LoaderResult<Result, ErrorType extends Error = Error> {
  state: LoaderState = 'initial';
  value: Result | undefined = undefined;
  error: ErrorType | undefined = undefined;
  metadata = new LoaderMetadata();

  constructor(loaderResult?: Partial<LoaderResult<Result, ErrorType>>) {
    Object.assign(this, { ...this, ...loaderResult });
  }
}

interface Action {
  type: string;
}

interface LoadAction extends Action {
  type: 'load';
}

export class Loader<Result, Params, ErrorType extends Error = Error> {
  subscriptions = new Subscription();

  result = signal(new LoaderResult<Result, ErrorType>());

  // result$ = new BehaviorSubject(new LoaderResult<Result, ErrorType>());

  result$ = toObservable(this.result);

  isStale$ = this.result$.pipe(
    map((res) => {
      if (res.value === undefined) {
        return true;
      }

      if (res.metadata.timestamp === undefined) {
        return true;
      }

      const now = Date.now();
      const diff = now - res.metadata.timestamp;

      return diff > 30000; // more than 30 seconds
    })
  );

  actions$ = new Subject<Action>();

  load$ = this.actions$.pipe(
    filter((action): action is LoadAction => action.type === 'load')
  );

  constructor(
    private config: {
      loaderFn: LoaderFn<Result, Params>;
      params: Params;
    }
  ) {}

  newData$ = this.config.loaderFn(this.config.params).pipe(
    catchError((err) => {
      this.patch({
        state: 'error',
        error: err,
        metadata: { timestamp: undefined },
      });
      return of();
    }),
  );

  data$ = this.isStale$.pipe(switchMap((isStale) => iif(() => isStale)));

  patch(values: Partial<LoaderResult<Result, ErrorType>>) {
    // const old = this.result$.getValue();
    // this.result$.next(
    //   new LoaderResult({
    //     ...old,
    //     ...values,
    //     metadata: {
    //       ...old.metadata,
    //       ...values.metadata,
    //     },
    //   })
    // );

    this.result.update(
      (old) =>
        new LoaderResult({
          ...old,
          ...values,
          metadata: {
            ...old.metadata,
            ...values.metadata,
          },
        })
    );
  }

  load() {
    // if (this.value && !this.isStale()) {
    //   this.metadata.cached = true;
    //   return;
    // }

    this.patch({ state: 'pending' });

    const { loaderFn, params } = this.config;
    loaderFn(params)
      .pipe(
        catchError((err) => {
          this.patch({
            state: 'error',
            error: err,
          });

          return EMPTY;
        }),
        take(1)
      )
      .subscribe((res) => {
        this.patch({
          state: 'success',
          error: undefined,
          value: res,
          metadata: {
            timestamp: Date.now(),
          },
        });
      });
  }
}

export class LoaderService<Result, Params, ErrorType extends Error = Error> {
  cache = new Map<Params, Loader<Result, Params, ErrorType>>();

  constructor(private loaderFn: LoaderFn<Result, Params>) {}

  connectFromObservable(params$: Observable<Params>) {
    return params$.pipe(
      map((params) => this.getOrCreateLoader(params)),
      tap((loader) => loader.load())
    );
  }

  connect(params: Signal<Params>) {
    return computed(() => {
      const loader = this.getOrCreateLoader(params());
      return loader.result();
    });
  }

  getOrCreateLoader(params: Params) {
    const cached = this.cache.get(params);
    if (cached) {
      return cached;
    }

    const loader = new Loader({
      loaderFn: this.loaderFn,
      params: params,
    });

    return loader;
  }
}
