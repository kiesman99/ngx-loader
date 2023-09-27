import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { Character } from "./resolver";

@Component({
    selector: 'character-page',
    standalone: true,
    imports: [CommonModule],
    template: `
        <h1>Character</h1>

        <pre>{{ character$ | async | json }}</pre>
    `
})
export class CharacterPageComponent {
    private readonly route = inject(ActivatedRoute);

    character$ = this.route.data.pipe(
        map(data => data['character'] as Character)
    )
}