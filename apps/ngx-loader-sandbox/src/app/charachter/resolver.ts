import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { createLoaderWithResolver } from '@ngx-loader';

export interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: Origin;
  location: Location;
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface Origin {
  name: string;
  url: string;
}

export interface Location {
  name: string;
  url: string;
}

export const [characterResolver] = createLoaderWithResolver((route, state) => {
  const http = inject(HttpClient);

  const charId = route.paramMap.get('id');

  if (!charId) {
    throw new Error('No character id provided');
  }

  return http.get<Character>(
    `https://rickandmortyapi.com/api/character/${charId}`
  );
});
