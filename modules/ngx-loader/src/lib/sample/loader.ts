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
  isObservable,
  of,
  switchMap,
} from 'rxjs';

class Loader<Result, Params, Error = unknown> {
  private readonly _result$ = new BehaviorSubject<Result | undefined>(
    undefined
  );
  private readonly _params$ = new ReplaySubject<Params>(1);
  private readonly params = toSignal(this._params$);
  private readonly _error$ = new Subject<Error>();

  private connectSubscription?: Subscription;

  constructor(private loaderFn: (params: Params) => Observable<Result>) {
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

  mutate(mutatorFn: (value: Result | undefined) => Result | undefined) {
    this._result$.next(mutatorFn(this._result$.getValue()));
  }

  connect(params: Observable<Params> | Signal<Params>) {
    const paramsObs = isObservable(params) ? params : toObservable(params);
    this.connectSubscription?.unsubscribe();
    this.connectSubscription = paramsObs.subscribe((params) =>
      this._params$.next(params)
    );
  }

  destroy() {
    this.connectSubscription?.unsubscribe();
  }

  get result$() {
    return this._result$.asObservable();
  }
}

export const createLoader2 = <Result, Params>(
  loaderFn: (params: Params) => Observable<Result>
) => {
  const loader = new Loader(loaderFn);

  return {
    $: loader.result$,
    load: loader.load.bind(loader),
    connect: loader.connect.bind(loader),
    mutate: loader.mutate.bind(loader),
    reload: loader.reload.bind(loader),
  };
};
