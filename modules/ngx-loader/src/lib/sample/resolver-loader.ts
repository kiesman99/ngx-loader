import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    ResolveFn,
    
} from '@angular/router';
import { ObSig } from './loader';
import { Observable } from 'rxjs';

export const createLoaderWithResolver = <
  R,
  RequiredParams = void,
  ParamsObject extends ObSig<RequiredParams> | unknown = ObSig<RequiredParams>
>(
    // fn: (params: ParamsObject) => Observable<R>,
    fn: (loaderFn: (paramsObj: ParamsObject) => Observable<R>, ...resolverParams: Parameters<ResolveFn<R>>) => Observable<R>
) => {
  

    return [fn];
};

// const [createApplicationLoader, applicationResolver] = createLoaderWithResolver(
//   (route, state) => {
//     return (page: number) => {
//       return of(page);
//     };
//   }
// );

type TransformToParamsFn<ParamsObject> = (...params: Parameters<ResolveFn<any>>) => ParamsObject;

const r = <R>(fn: (...params: Parameters<ResolveFn<R>>) => Observable<R>): [ResolveFn<R>] => {
    
    const resolver: ResolveFn<R> = (route, state) => {
        return 
    }

    return [];
};

const load = <ParamsObject, R>(params: ParamsObject, fn: (p: ParamsObject) => Observable<R>) => {
    return fn(params);
};

r((route, state) => {
    const http = inject(HttpClient);

    const id = route.params['id'] as number;

    return load(id, (id) => {
        return http.get(`https://loca${id}`);
    });
});