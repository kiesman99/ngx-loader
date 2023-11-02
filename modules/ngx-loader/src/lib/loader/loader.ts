import { Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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
  Subscription,
  catchError,
  skipWhile,
  switchMap,
  take,
  tap
} from 'rxjs';
import { LoaderResult } from './state';

type LoaderFn<Params, Result> = (params: Params) => Observable<Result>;

const STALE_AFTER = 30000; // after 30 seconds

class Loader<
  Result,
  Params,
  ErrorType extends Error = Error
> extends BehaviorSubject<LoaderResult<Result, ErrorType>> {
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
    console.log('Resolver')
    return (_route, _state) => {
      const params = fn(_route, _state);
      const loader = this.getOrCreateLoader(params);
      loader.load(params);
      return loader.pipe(
        tap(() => console.log('resolver 1')),
        skipWhile((l) => ['initial', 'idle', 'pending'].includes(l.state)),
        tap(() => console.log('resolver 2')),
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
