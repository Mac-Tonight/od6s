/**
 * Star Wars D6 character sheet overrides for OpenD6 Space.
 * Provides two themed sheet options: 2nd Edition (tan) and 1st Edition (white).
 * Formerly the 'od6s-star-wars' module by Christian Ovsenik, now integrated.
 */
import {OD6SActorSheet} from './actor-sheet.js';

/**
 * Star Wars 2nd Edition Revised & Expanded sheet theme.
 * Tan background with maroon accents.
 * @extends {OD6SActorSheet}
 */
export class ActorSheetStarWars extends OD6SActorSheet {
    /** @override */
    get template() {
        return 'systems/od6s/templates/actor/star-wars/actor-sheet-2e.html';
    }
}

/**
 * Star Wars 1st Edition sheet theme.
 * Clean white background with black accents.
 * @extends {OD6SActorSheet}
 */
export class ActorSheetStarW1e extends OD6SActorSheet {
    /** @override */
    get template() {
        return 'systems/od6s/templates/actor/star-wars/actor-sheet-1e.html';
    }
}
