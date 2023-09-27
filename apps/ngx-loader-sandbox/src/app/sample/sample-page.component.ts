import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  Injector,
  inject,
  signal
} from '@angular/core';
import { map } from 'rxjs';
import { RMReq } from './models';
import { createLoader } from '@ngx-loader';

@Component({
  selector: 'sample-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Sample</h1>

    <div class="flex flex-row justify-between items-center my-5">
      <div class="flex flex-row gap-3 items-center">
        <button edsButton="primary" (click)="prev()">PREV</button>
        <p>{{ page() }}</p>
        <button edsButton="primary" (click)="next()">NEXT</button>
      </div>
      <button edsButton="primary" (click)="charactersReq.reload()">
        RELOAD
      </button>
    </div>

    <!-- <pre>{{ charactersReq.$ | async | json }}</pre> -->

    <table class="table-auto w-full">
      <thead>
        <tr>
          <th *ngFor="let header of headers">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let char of charactersReq()">
          <td *ngFor="let header of headers">{{ $any(char)[header] }}</td>
        </tr>
      </tbody>
    </table>

    <!-- <pre>{{charactersReq() | json}}</pre> -->
  `,
})
export class SamplePageComponent {
  http = inject(HttpClient);
  injector = inject(Injector);

  page = signal(1);

  charactersReq = createLoader((page: number) => {
    return this.http
      .get<RMReq>(`https://rickandmortyapi.com/api/character?page=${page}`)
      .pipe(map((res) => res.results));
  });

  headers = ['id', 'name', 'status', 'species', 'gender'];

  constructor() {
    this.charactersReq.connect(this.page);
    // effect(() => {
    //   this.charactersReq.load(this.page());
    // });
  }

  prev() {
    this.page.update((p) => p - 1);
  }

  next() {
    this.page.update((p) => p + 1);
  }
}
