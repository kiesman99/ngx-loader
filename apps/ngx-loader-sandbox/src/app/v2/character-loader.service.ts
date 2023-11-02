import { Injectable, Signal, inject } from '@angular/core';
import { LoaderService } from '@ngx-loader';
import { Character } from '../charachter/resolver';
import { HttpClient } from '@angular/common/http';
import { Observable, isObservable } from 'rxjs';

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

export function useCharacter(params: Observable<number> | Signal<number>) {
    const loader = injectCharacterLoader();

    if (isObservable(params)) {
        return loader.connectFromObservable(params)
    } 

    return loader.connect(params);
}