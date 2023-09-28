import { Injector, inject } from '@angular/core';
import { ActivatedRoute, ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { createLoader } from './loader';

// export const createLoaderWithResolver = <
//   R,
//   RequiredParams = void,
//   ParamsObject extends ObSig<RequiredParams> | unknown = ObSig<RequiredParams>
// >(
//   // fn: (params: ParamsObject) => Observable<R>,
//   fn: (
//     loaderFn: (paramsObj: ParamsObject) => Observable<R>,
//     ...resolverParams: Parameters<ResolveFn<R>>
//   ) => Observable<R>
// ) => {
//   return [fn];
// };

// const [createApplicationLoader, applicationResolver] = createLoaderWithResolver(
//   (route, state) => {
//     return (page: number) => {
//       return of(page);
//     };
//   }
// );

type TransformToParamsFn<ParamsObject> = (
  ...params: Parameters<ResolveFn<unknown>>
) => ParamsObject;

export const r = <R, ParamsObject>(
  transformer: TransformToParamsFn<ParamsObject>,
  fn: (paramObj: ParamsObject) => Observable<R>
): [
  ResolveFn<R>,
  () => ReturnType<typeof createLoader<R, void, ParamsObject>>
] => {
  let initialParams: ParamsObject;

  const resolver: ResolveFn<R> = (route, state) => {
    const transformedParams = transformer(route, state);
    initialParams = transformedParams;
    return fn(transformedParams);
  };

  const injectFn = () => {
    const route = inject(ActivatedRoute);
    const injector = inject(Injector);
    const dataSnapshot = route.snapshot.data as { character: R };
    return createLoader(fn, { initialValue: dataSnapshot.character, initialParams: initialParams, injector });
  };

  return [resolver, injectFn];
};

