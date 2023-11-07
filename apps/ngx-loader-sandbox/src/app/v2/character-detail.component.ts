import { Component, computed, signal } from '@angular/core';
import {
  injectCharacterLoader,
  useCharacter,
} from './character-loader.service';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>V2 Character Detail - {{id()}}</h1>
    <div class="flex flex-row mb-10">
      <button (click)="prev()">Prev</button>
      <button (click)="next()">Next</button>
      <!-- <button (click)="character().load()">Load</button> -->
    </div>

    <pre>{{ (character | async)?.result() | json }}</pre>

    <!-- <pre>{{character | async | json}}</pre> -->
  `,
})
export class CharcterDetailComponent {
  id = signal(1);

  id$ = toObservable(this.id);

  cl = injectCharacterLoader();

  character = this.cl.connectFromObservable(this.id$);

  constructor() {
    // this.character().load();
  }

  next() {
    this.id.update((o) => o + 1);
    // this.character().load();
  }

  prev() {
    this.id.update((o) => o - 1);
    // this.character().load();
  }
}
