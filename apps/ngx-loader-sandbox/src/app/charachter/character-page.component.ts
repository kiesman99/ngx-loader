import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderContainerDirective, createLoader2 } from '@ngx-loader';
import { filter, map } from 'rxjs';
import { Character } from './resolver';

@Component({
  selector: 'ngx-loader-character-page',
  standalone: true,
  imports: [CommonModule, LoaderContainerDirective],
  template: `
    <h1>Character</h1>

    <button (click)="character.reload()">RELOAD</button>
    <button (click)="loadAnother()">Another</button>

    <ng-container *ngxLoaderContainer="character.s$; let char; let s = state">
        <p>State: {{s}}</p>
        <hr>
        <pre>{{char | json}}</pre>
    </ng-container>

    <!-- <pre>{{ character.s$ | async | json }}</pre> -->
  `,
})
export class CharacterPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  private characterId$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    filter((id): id is string => id !== null),
    map(id => Number(id))
  );

  constructor() {
    this.character.connect(this.characterId$);
  }

  character = createLoader2((characterId: number) => {
    return this.http.get<Character>(
      `https://rickandmortyapi.com/api/character/${characterId}`
    );
  });

  loadAnother() {
    this.character.load(4);
  }
}
