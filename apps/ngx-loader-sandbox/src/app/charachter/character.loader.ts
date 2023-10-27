import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { createLoaderService } from '@ngx-loader';
import { Character } from './resolver';

export const injectCharacterLoader = createLoaderService(() => {
  const http = inject(HttpClient);

  return (characterId: number) => {
    return http.get<Character>(
      `https://rickandmortyapi.com/api/character/${characterId}`
    );
  };
});
