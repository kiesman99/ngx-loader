import {
  DestroyRef,
  Signal,
  assertInInjectionContext,
  computed,
  inject,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  debounceTime,
  filter,
  isObservable,
  merge,
  of,
  scan,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { LoadResponse, createLoadError, createLoadIdle, createLoadLoading, createLoadSuccess } from './loader.model';

/**
 * This is a POC of a compositable helper to
 * load entities from an api. It should provide
 * some helper function for DX.
 *
 * Following things should be possible for V1:
 *
 * - [x] Load entities via {HttpClient}
 * - [x] React on reactive variables (Observables or Signals) which retrigger loading entities
 * - [ ] Optimistic update of entites
 * - [ ] On Demand reload of entities
 * - [ ] List should be filterable on client side
 * 
 * Optional Goals:
 * 
 * - [ ] createLoaderWithResolver
 *  - a specialized kind of loader that exports a resolver
 *    that can be hooked up and provides the first value of the createLoader  
 */

export type ObSig<T> = Observable<T> | Signal<T>;

export const createLoader = <
  R,
  RequiredParams = void,
  ParamsObject extends ObSig<RequiredParams> | unknown = ObSig<RequiredParams>
>(
  fn: (params: ParamsObject) => Observable<R>
) => {
  assertInInjectionContext(createLoader);

  const destroyRef = inject(DestroyRef);
  const params$ = new ReplaySubject<ParamsObject>(1);
  const reload$ = new Subject<void>();

  const res$ = new BehaviorSubject<LoadResponse<R>>(createLoadIdle<R>());

  const load = (loadParams: ParamsObject) => {
    params$.next(loadParams);
  };

  const connect = (
    loadParams: Observable<ParamsObject> | Signal<ParamsObject>
  ) => {
    const obs$ = isObservable(loadParams)
      ? loadParams
      : toObservable(loadParams);
    obs$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => params$.next(value));
  };

  const reload = () => {
    reload$.next();
  };

  merge(params$, reload$).pipe(
    takeUntilDestroyed(),
    debounceTime(100),
    tap(() => res$.next(createLoadLoading<R>(undefined))),
    scan((old, current) => {
      if (!old && !current) {
        throw new Error(`Cannot reload before loaded values at least once`);
      }

      return current || old;
    }),
    // is another takeUntilDestroyed here really needed?
    switchMap((p) => fn(p as ParamsObject).pipe(
      catchError(err => {
        res$.next(createLoadError(err));
        return of(undefined);
      })
    )),
    filter((res): res is R => res !== undefined),
    shareReplay(1)
  ).subscribe({
    next: value => res$.next(createLoadSuccess(value)),
    error: err => {
      console.error(err);
      res$.next(createLoadError(err));
    }
  });

  const resSig = toSignal(res$, { requireSync: true });

  const sample = computed(() => {
    return resSig();
  });

  return Object.assign(sample, {
    $: res$,
    load,
    connect,
    reload,
  });
};
