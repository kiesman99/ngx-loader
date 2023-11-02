import { ActivatedRouteSnapshot, Route, RouterStateSnapshot } from '@angular/router';
import { CharacterPageComponent } from './charachter/character-page.component';
import { SamplePageComponent } from './sample/sample-page.component';
import { CharcterDetailComponent } from './v2/character-detail.component';
import { injectCharacterLoader } from './v2/character-loader.service';
// import { characterResolver } from './v2/character.resolver';

// const characterResolver: ResolveFn<Character> = (route, state) => {
//   const id = Number(route.params['id']);
//   return injectCharacterLoader().ensureLoad(id);
// }

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
  {
    path: 'v2',
    resolve: {
      character: (route: any, state: any) => injectCharacterLoader().resolver(() => {
        return 1
      })(route, state)
    },
    component: CharcterDetailComponent
  }
];

