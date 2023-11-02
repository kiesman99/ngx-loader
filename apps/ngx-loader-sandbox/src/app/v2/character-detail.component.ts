import { Component, signal } from "@angular/core";
import { useCharacter } from "./character-loader.service";
import { CommonModule } from "@angular/common";

@Component({
    standalone: true,
    imports: [CommonModule],
    template: `
        <h1>V2 Character Detail</h1>
        <div class="flex flex-row mb-10">
            <button (click)="prev()">Prev</button>
            <button (click)="next()">Next</button>
        </div>

        <pre>{{character$ | async | json}}</pre>
    `
})
export class CharcterDetailComponent {
    id = signal(1);
    
    character$ = useCharacter(this.id);

    next() {
        this.id.update(o => o + 1);
    }

    prev() {
        this.id.update(o => o - 1);
    }
}