import { Injector, inject } from '@angular/core';
import { ActivatedRoute, ResolveFn } from '@angular/router';
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



