import { od6sInitRoll } from "../apps/od6sroll.js";

export class OD6SCombatTracker extends CombatTracker{
    /**
     * Handle a Combatant control toggle
     * @private
     * @param {Event} event   The originating mousedown event
     */
    async _onCombatantControl(event) {
        event.preventDefault();
        event.stopPropagation();
        const btn = event.currentTarget;
        const li = btn.closest(".combatant");
        const combat = this.viewed;
        const c = combat.combatants.get(li.dataset.combatantId);

        // Switch control action
        switch (btn.dataset.control) {

            // Toggle combatant visibility
            case "toggleHidden":
                return await c.update({hidden: !c.hidden});

            // Toggle combatant defeated flag
            case "toggleDefeated":
                return this._onToggleDefeatedStatus(c);

            // Roll combatant initiative
            case "rollInitiative":
                if (c.actor.type === "character") {
                    await od6sInitRoll._onInitRollDialog(this, c);
                } else {
                    const messageOptions = {};
                    if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) {
                        messageOptions.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
                    }
                    await game.combats.active.rollInitiative([c.id],{"messageOptions": messageOptions});
                }
                break;
        }
        // Render tracker updates
        this.render();
    }
}
