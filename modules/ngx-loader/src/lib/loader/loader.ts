import { Injectable, InjectionToken, Signal, computed, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
  catchError,
  map,
  skipWhile,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { LoaderResult } from './state';

type LoaderFn<Params, Result> = (params: Params) => Observable<Result>;

const STALE_AFTER = 30000; // after 30 seconds

export class LL<Result, Params, ErrorType extends Error = Error> {
  result = signal(new LoaderResult<Result, ErrorType>());
  error = computed(() => this.result().error);
  state = computed(() => this.result().state);
  value = computed(() => this.result().value);
  metadata = computed(() => this.result().metadata);

  connect(params$: Observable<Params>) {
    const reloadSubject = new Subject<void>();
  }

  constructor(
    private config: {
      loaderFn: LoaderFn<Params, Result>;
    }
  ) {}

  load(params: Params) {
    this.setLoading();
    this.config
      .loaderFn(params)
      .pipe(
        catchError((err) => {
          this.errored(err);
          return EMPTY;
        }),
        take(1)
      )
      .subscribe((res) => this.successfull(res));
  }

  private setLoading() {
    this.result.update(
      (old) =>
        new LoaderResult({
          ...old,
          state: 'pending',
          metadata: {
            ...old.metadata,
            timestamp: undefined,
            cached: false,
          },
        })
    );
  }

  private successfull(res: Result) {
    this.result.update(
      (old) =>
        new LoaderResult({
          ...old,
          state: 'success',
          value: res,
          metadata: {
            timestamp: Date.now(),
            cached: false,
          },
        })
    );
  }

  private errored(error: ErrorType) {
    this.result.update(
      (old) =>
        new LoaderResult({
          ...old,
          state: 'error',
          error,
          metadata: {
            ...old.metadata,
            timestamp: undefined,
          },
        })
    );
  }
}

const LLS_TOKEN = new InjectionToken<LLS<unknown, unknown>>('LLS');

abstract class LLS<Result, Params, ErrorType extends Error = Error> {
  cache = new Map<Params, LL<Result, Params, ErrorType>>();

  paramsObserverSubscription?: Subscription;

  abstract loaderFn: LoaderFn<Params, Result>;

  connectFromObservable(params: Observable<Params>) {
    this.paramsObserverSubscription?.unsubscribe();

    const loader$ = new ReplaySubject<LL<Result, Params, ErrorType>>(1);

    this.paramsObserverSubscription = params
      .pipe(map((params) => this.getOrCreateLoader(params)))
      .subscribe((loader) => loader$.next(loader));

    return loader$;
  }

  connect(params: Signal<Params>) {
    return toSignal(this.connectFromObservable(toObservable(params)), {
      requireSync: true,
    });
  }

  // preload(params: Params) {}

  getOrCreateLoader(params: Params) {
    const cachedLoader = this.cache.get(params);
    if (cachedLoader !== undefined) {
      return cachedLoader;
    }

    const loader = new LL<Result, Params, ErrorType>({
      loaderFn: this.loaderFn,
    });

    this.cache.set(params, loader);

    return loader;
  }
}

export function createLLS<Result, Params, ErrorType extends Error = Error>(_loaderFn: LoaderFn<Params, Result>) {

  @Injectable({
    providedIn: 'root',
  })
  class Service extends LLS<Result, Params, ErrorType> {
    override loaderFn: LoaderFn<Params, Result> = _loaderFn;
  }

  return new Service();
}

class Loader<
  Result,
  Params,
  ErrorType extends Error = Error
> extends BehaviorSubject<LoaderResult<Result, ErrorType>> {
  state = signal(new LoaderResult<Result, ErrorType>());

  constructor(private loaderFn: LoaderFn<Params, Result>) {
    super(new LoaderResult());
  }

  load(params: Params) {
    const now = Date.now();

    const old = this.value;

    if (old.value && old.metadata.timestamp !== undefined) {
      const diff = now - old.metadata.timestamp;
      const isStale = diff > STALE_AFTER;
      console.log({
        now,
        timestamp: old.metadata.timestamp,
        diff,
        isStale,
      });

      if (!isStale) {
        this.next(
          new LoaderResult({
            ...this.value,
            metadata: { ...this.value.metadata, cached: true },
          })
        );
        return;
      }
    }

    this.next(
      new LoaderResult({ ...this.value, state: 'pending', metadata: undefined })
    );
    this.loaderFn(params)
      .pipe(
        catchError((error) => {
          console.info('Loader run into error', error);
          this.next(
            new LoaderResult({
              ...this.value,
              state: 'error',
              error,
              metadata: undefined,
            })
          );
          return EMPTY;
        }),
        take(1)
      )
      .subscribe((result) => {
        this.next(
          new LoaderResult({
            ...this.value,
            state: 'success',
            value: result,
            metadata: { timestamp: now },
          })
        );
      });
  }
}

export class LoaderService<Result, Params, ErrorType extends Error = Error> {
  cache = new Map<Params, Loader<Result, Params, ErrorType>>();

  params$ = new ReplaySubject<Params>(1);

  constructor(private loadFn: LoaderFn<Params, Result>) {}

  connectFromObservableParamsSubscription?: Subscription;
  connectFromObservable(params: Observable<Params>) {
    console.info('Connecting new Params');

    return params.pipe(
      tap((params) => console.info('New params', params)),
      switchMap((params) => {
        const loader = this.getOrCreateLoader(params);
        loader.load(params);
        return loader;
      }),
      tap((res) => console.info('New Loader Result', res))
    );
  }

  connect(params: Signal<Params>) {
    return this.connectFromObservable(toObservable(params));
  }

  getOrCreateLoader(params: Params) {
    if (!this.cache.has(params)) {
      this.cache.set(params, new Loader(this.loadFn));
    }

    return this.cache.get(params)!;
  }

  ensure(params: Params) {
    console.log('Ensure load of', params);
    const loader = this.getOrCreateLoader(params);
    loader.load(params);

    return loader.pipe(
      skipWhile((l) => ['initial', 'idle', 'pending'].includes(l.state))
    );
  }

  resolver(
    fn: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => Params
  ): ResolveFn<LoaderResult<Result, ErrorType>> {
    console.log('Resolver');
    return (_route, _state) => {
      const params = fn(_route, _state);
      const loader = this.getOrCreateLoader(params);
      loader.load(params);
      return loader.pipe(
        tap(() => console.log('resolver 1')),
        skipWhile((l) => ['initial', 'idle', 'pending'].includes(l.state)),
        tap(() => console.log('resolver 2'))
      );
    };
  }
}

// const createLoaderService = {} as any;

// const [useHero, injectHeroLoader] = createLoaderService(() => {
//   const http = inject(HttpClient);

//   return (id: number) => {
//     return http.get(`http://localhost/${id}`);
//   };
// });

// const id$ = of(1);

// useHero(id$);
