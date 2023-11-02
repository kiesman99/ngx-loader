import { ResolveFn } from "@angular/router";
import { injectCharacterLoader } from "./character-loader.service";
import { Character } from "../charachter/resolver";

// export const characterResolver: ResolveFn<Character> = (route, state) => {
//     const characterLoader = injectCharacterLoader();
//     return characterLoader.ensure(1);
// }