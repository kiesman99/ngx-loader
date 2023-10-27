import { ResolveFn, Route } from '@angular/router';
import { CharacterPageComponent } from './charachter/character-page.component';
import { SamplePageComponent } from './sample/sample-page.component';
import { inject } from '@angular/core';
import { injectCharacterLoader } from './charachter/character.loader';
import { Character } from './charachter/resolver';

const characterResolver: ResolveFn<Character> = (route, state) => {
  const id = Number(route.params['id']);
  return injectCharacterLoader().ensureLoad(id);
}

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: SamplePageComponent,
  },
  {
    path: 'characters/:id',
    resolve: {
      character: characterResolver,
    },
    component: CharacterPageComponent,
  },
];

