// import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Component, inject } from '@angular/core';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { LoaderContainerDirective, createLoader, injectPathParams$, mergeLoader } from '@ngx-loader';
// import { forkJoin, map, of } from 'rxjs';
// import { z } from 'zod';
// import { Character, Episode } from './resolver';
// import { injectCharacterLoader } from './character.loader';

// @Component({
//   selector: 'ngx-loader-character-page',
//   standalone: true,
//   imports: [CommonModule, LoaderContainerDirective],
//   template: `
//     <h1>Character</h1>

//     <button (click)="character.reload()">RELOAD</button>
//     <button (click)="loadAnother()">Another</button>

//     <!-- <hr>
//     <pre>{{vm() | json}}</pre>
//     <hr> -->

//     <button (click)="character.reload()">RELOAD</button>
//     <button (click)="loadAnother()">Another</button>

//     <ng-container *ngxLoaderContainer="character.s$; let character; let s = state">
//         <p>State: {{s}}</p>
//         <hr>
//         <pre>{{character | json}}</pre>
//     </ng-container>
//   `,
// })
// export class CharacterPageComponent {
//   private readonly http = inject(HttpClient);

//   private pathParams$ = injectPathParams$(z.object({
//     id: z.coerce.number()
//   }))

//   private characterId$ = this.pathParams$.pipe(
//     map(p => p.id)
//   );

//   // character = createLoader2((characterId: number) => {
//   //   return this.http.get<Character>(
//   //     `https://rickandmortyapi.com/api/character/${characterId}`
//   //   );
//   // });

//   character = injectCharacterLoader();

//   episodesOfCharacter = createLoader((character: Character) => {
//     const episodes = character.episode.map(episodeLink => {
//       return this.http.get<Episode>(episodeLink)
//     });

//     const test = forkJoin({
//       id: of(2),
//       name: of('hello'),
//       hero: of({ heroName: 'gustav' })
//     })

//     return forkJoin(episodes);
//   });

//   // vm = toSignal(mergeLoader({
//   //   charachter: this.character,
//   //   episodes: this.episodesOfCharacter
//   // }).s$);

//   constructor() {

//     // this.character.connect(this.characterId$);
//     // this.episodesOfCharacter.connectFromLoader(this.character.s$);
//   }

//   loadAnother() {
//     this.character.load(4);
//   }
// }
