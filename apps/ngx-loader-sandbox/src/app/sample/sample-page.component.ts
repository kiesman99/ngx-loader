// import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Component, Injector, computed, inject, signal } from '@angular/core';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { RouterModule } from '@angular/router';
// import { createLoader } from '@ngx-loader';
// import { map } from 'rxjs';
// import { RMReq } from './models';
// import { injectCharacterLoader } from '../charachter/character.loader';

// @Component({
//   selector: 'ngx-loader-sample-page',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <h1>Sample</h1>

//     <div class="flex flex-row justify-between items-center my-5">
//       <div class="flex flex-row gap-3 items-center">
//         <button edsButton="primary" (click)="prev()" [disabled]="prevDisabled()">PREV</button>
//         <p>{{ page() }}</p>
//         <button edsButton="primary" (click)="next()" [disabled]="nextDisabled()">NEXT</button>
//       </div>
//       <button edsButton="primary" (click)="charactersReq.reload()" [disabled]="reloadDisabled()">
//         RELOAD
//       </button>
//     </div>

//     <p><strong>STATE: </strong>{{ characterState().state }}</p>

//     <ng-container *ngIf="characterState() as charachters">
//       <ng-container *ngIf="charachters.state === 'error'">
//         <p>{{charachters.error | json}}</p>
//       </ng-container>
//     </ng-container>

//     <ng-container *ngIf="characterState() as characters">
//       <table
//         class="table-auto w-full"
//         *ngIf="characters.value !== undefined"
//       >
//         <thead>
//           <tr>
//             <th>Link</th>
//             <th *ngFor="let header of headers">{{ header }}</th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr *ngFor="let char of characters.value">
//             <td><a [routerLink]="['/characters', char.id]" (mouseover)="characterLoader.preload(char.id)">GO</a></td>
//             <td *ngFor="let header of headers">{{ $any(char)[header] }}</td>
//           </tr>
//         </tbody>
//       </table>
//     </ng-container>
//   `,
// })
// export class SamplePageComponent {
//   http = inject(HttpClient);
//   injector = inject(Injector);

//   page = signal(1);

//   characterLoader = injectCharacterLoader();

//   charactersReq = createLoader((page: number) => {
//     return this.http
//       .get<RMReq>(`https://rickandmortyapi.com/api/character?page=${page}`)
//       .pipe(map((res) => res.results));
//   });

//   characterState = toSignal(this.charactersReq.s$, {
//     requireSync: true
//   });

//   headers = ['id', 'name', 'status', 'species', 'gender'];

//   nextDisabled = computed(() => {
//     return this.characterState().state === 'loading';
//   })

//   prevDisabled = computed(() => {
//     return this.characterState().state === 'loading' || this.page() === 1;
//   });

//   reloadDisabled = computed(() => {
//     return this.characterState().state !== 'success';
//   });

//   constructor() {
//     this.charactersReq.connect(this.page);
//   }

//   prev() {
//     this.page.update((p) => p - 1);
//   }

//   next() {
//     this.page.update((p) => p + 1);
//   }
// }
