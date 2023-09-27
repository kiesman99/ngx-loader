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
  Observable,
  ReplaySubject,
  Subject,
  debounceTime,
  isObservable,
  merge,
  scan,
  shareReplay,
  switchMap
} from 'rxjs';

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

  const res$ = merge(params$, reload$).pipe(
    debounceTime(100),
    scan((old, current) => {
      if (!old && !current) {
        throw new Error(`Cannot reload before loaded values at least once`);
      }

      return current || old;
    }),
    switchMap((p) => fn(p as ParamsObject)),
    shareReplay(1)
  );

  // const res$ = params$.pipe(
  //   debounceTime(300),
  //   switchMap((p) => fn(p)),
  //   shareReplay(1)
  // );

  const resSig = toSignal(res$);

  const sample = computed(() => {
    return resSig();
  });

  return Object.assign(sample, {
    $: res$,
    load,
    connect,
    reload
  });
};
