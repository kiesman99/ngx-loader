import { Injector, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, ResolveFn } from '@angular/router';
import { ObSig, createLoader } from './loader';
import { Observable } from 'rxjs';

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
  const resolver: ResolveFn<R> = (route, state) => {
    const transformedParams = transformer(route, state);
    return fn(transformedParams);
  };

  const injectFn = () => {
    const route = inject(ActivatedRoute);
    const injector = inject(Injector);
    const dataSnapshot = route.snapshot.data as { character: R };
    return createLoader(fn, { initialValue: dataSnapshot.character });
  };

  return [resolver, injectFn];
};

const load = <ParamsObject, R>(
  params: ParamsObject,
  fn: (p: ParamsObject) => Observable<R>
) => {
  return fn(params);
};

const [applicationResolver, injectApplicationLoader] = r(
  // this is weird as separat function.
  (route, state) => route.params['id'] as number,
  (id) => {
    const http = inject(HttpClient);

    return load(id, (id) => {
      return http.get(`https://loca${id}`);
    });
  }
);
