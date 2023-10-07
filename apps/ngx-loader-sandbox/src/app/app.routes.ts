import { Route } from '@angular/router';
import { CharacterPageComponent } from './charachter/character-page.component';
import { SamplePageComponent } from './sample/sample-page.component';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: SamplePageComponent,
  },
  {
    path: 'characters/:id',
    // resolve: {
    //   character: characterResolver,
    // },
    component: CharacterPageComponent,
  },
];
