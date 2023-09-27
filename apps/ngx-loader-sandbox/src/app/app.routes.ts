import { Route } from '@angular/router';
import { SamplePageComponent } from './sample/sample-page.component';

export const appRoutes: Route[] = [
    {
        path: '',
        pathMatch: 'full',
        component: SamplePageComponent
    }
];
