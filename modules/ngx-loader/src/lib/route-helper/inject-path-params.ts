import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { z } from 'zod';

export const injectPathParams$ = <PathParams>(schema: z.Schema<PathParams>) => {
  const route = inject(ActivatedRoute);
  return route.params.pipe(map((params) => schema.parse(params)));
};

export const injectPathParamsSnapshot = <PathParams>(schema: z.Schema<PathParams>) => {
    const route = inject(ActivatedRoute);
    return schema.parse(route.snapshot.params);
}