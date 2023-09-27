import { Route } from '@angular/router';
import { SamplePageComponent } from './sample/sample-page.component';
import { characterResolver } from './charachter/resolver';
import { CharacterPageComponent } from './charachter/character-page.component';

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
