import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { z } from 'zod';

export const injectQueryParams$ = <PathParams>(schema: z.Schema<PathParams>) => {
  const route = inject(ActivatedRoute);
  return route.queryParams.pipe(map((params) => schema.parse(params)));
};

export const injectQueryParamsSnapshot = <PathParams>(schema: z.Schema<PathParams>) => {
    const route = inject(ActivatedRoute);
    return schema.parse(route.snapshot.queryParams);
}