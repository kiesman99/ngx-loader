import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { LoaderService } from '@ngx-loader';
import { Character } from '../charachter/resolver';

@Injectable({
  providedIn: 'root',
})
export class CharacterLoaderService extends LoaderService<Character, number> {
  private readonly http = inject(HttpClient);

  constructor() {
    super((characterId) => {
      return this.http.get<Character>(
        `https://rickandmortyapi.com/api/character/${characterId}`
      );
    });
  }
}

export function injectCharacterLoader() {
    return inject(CharacterLoaderService);
}

export function useCharacter(params: Signal<number>) {
    const loader = injectCharacterLoader();

    return loader.connect(params);
}