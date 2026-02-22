import {od6sutilities} from "../system/utilities.js";
import OD6S from "../config/config-od6s.js";

export class OD6SChat {

    static chatContextMenu(html, options) {
        let canApplyCharacterPoint = function (li) {
            let result = false;
            let actor;
            if (li.find(".dice-roll").length) {
                let message = game.messages.get(li.attr("data-message-id"));
                if (message.speaker.actor) {
                    if (message.speaker.token) {
                        actor = game.scenes.viewed.tokens.filter(t => t.id === message.speaker.token)[0].actor;
                    } else {
                        actor = game.actors.get(message.speaker.actor);
                    }

                    if (message.getFlag('od6s', 'canUseCp') &&
                        (game.user.isGM || actor.isOwner) &&
                        (actor.type === "character"||actor.type === "npc") &&
                        actor.system.characterpoints.value > 0) {
                        return true;
                    }
                }
            }
            return result;
        };

        options.push(
            {
                name: game.i18n.localize("OD6S.USE_A_CHARACTER_POINT"),
                icon: '<i class="fas fa-user-plus"></i>',
                condition: canApplyCharacterPoint,
                callback: li => {
                    let message = game.messages.get(li.attr("data-message-id"));
                    let actor;
                    if (message.speaker.token) {
                        actor = game.scenes.viewed.tokens.filter(t => t.id === message.speaker.token)[0].actor;
                    } else {
                        actor = game.actors.get(message.speaker.actor);
                    }
                    return actor.useCharacterPointOnRoll(message, message.getRollData());
                }
            }
        )
    }
}

export default class OD6SEditDifficulty extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "edit-difficulty";
        options.template = "systems/od6s/templates/chat/edit-difficulty.html";
        options.height = 200;
        options.width = 100;
        options.minimizable = true;
        options.title = game.i18n.localize("OD6S.EDIT_DIFFICULTY");
        return options;
    }

    getData() {
        let data = super.getData()
        return data;
    }

    async _updateObject(ev, formData) {
        let success = false;
        if (ev.submitter.value === 'cancel') {
            return;
        }
        const message = game.messages.get(formData.messageId);

        const diff = (+formData.baseDifficulty) - (+message.getFlag('od6s', 'baseDifficulty'));

        message.rolls[0].total >= (+message.getFlag('od6s', 'difficulty')) + (+diff) ? success = true : success = false;

        let flags = {};
        flags.baseDifficulty = formData.baseDifficulty;
        flags.difficulty = (+message.getFlag('od6s', 'difficulty')) + (+diff);
        flags.success = success;

        await message.update({
            id: message.id,
            flags: {
                od6s: flags
            }
        })
    }
}

export class OD6SEditDamage extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "edit-damage";
        options.template = "systems/od6s/templates/chat/edit-damage.html";
        options.height = 200;
        options.width = 100;
        options.minimizable = true;
        options.title = game.i18n.localize("OD6S.EDIT_DAMAGE");
        return options;
    }

    getData() {
        let data = super.getData()
        return data;
    }

    async _updateObject(ev, formData) {
        if (ev.submitter.value === 'cancel') {
            return;
        }
        const message = game.messages.get(formData.messageId);
        const damageScore = od6sutilities.getScoreFromDice(formData.damageDice, formData.damagePips);
        const damageDice = {};
        damageDice.dice = formData.damageDice;
        damageDice.pips = formData.damagePips;
        await message.setFlag('od6s', 'damageScore', damageScore);
        await message.setFlag('od6s', 'damageDice', damageDice);
    }
}

export class OD6SChooseTarget extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "choose-target";
        options.template = "systems/od6s/templates/chat/choose-target.html";
        options.height = 200;
        options.width = 100;
        options.minimizable = true;
        options.title = game.i18n.localize("OD6S.CHOOSE_TARGET");
        return options;
    }

    getData() {
        let data = super.getData();
        return data;
    }

    async _updateObject(ev, formData) {
        if (ev.submitter.value === 'cancel') {
            return;
        }
        const message = game.messages.get(formData.messageId);
        if(message.getFlag('od6s','isExplosive')) {
            const targets = [];
            const currentTargets = message.getFlag('od6s','targets');
            const formTargets = this.object.targets.filter(t => formData.choosetarget.includes(t.id));
            for (const t in formTargets) {
                const target = {};
                const i = currentTargets?.findIndex(e => e.id === formTargets[t]);
                if (i > -1) {
                    target.id = currentTargets[i].id;
                    target.name = currentTargets[i].name;
                    target.range = currentTargets[i].range;
                    target.zone = currentTargets[i].zone;
                    targets.push(target);
                } else {
                    target.id = formTargets[t].id;
                    target.name = formTargets[t].name;
                    target.range = 0;
                    target.zone = 1;
                    targets.push(target);
                }
            }
            await message.unsetFlag('od6s','targets', targets);
            await message.setFlag('od6s','targets', targets);
        } else {
            await message.setFlag('od6s', 'targetId', formData.choosetarget);
            await message.setFlag('od6s', 'targetName', game.scenes.active.tokens.find(t => t.id === formData.choosetarget).name);
        }
    }
}

export class OD6SHandleWildDieForm extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "wilddie";
        options.template = "systems/od6s/templates/chat/wild-die.html";
        options.height = 200;
        options.width = 100;
        options.minimizable = true;
        options.title = game.i18n.localize("OD6S.WILD_DIE");
        return options;
    }

    getData() {
        let data = super.getData();
        return data;
    }

    async _updateObject(ev, formData) {
        if (ev.submitter.value === 'cancel') {
            return;
        }


        const message = game.messages.get(formData.messageId);
        switch (formData.wilddie) {
            case '0':
                await message.setFlag('od6s', 'wild', false);
                break;
            case '1':
                await message.setFlag('od6s', 'wildResult', 'OD6S.REMOVE_HIGHEST_DIE')
                // Update original card and re-display
                let replacementRoll = JSON.parse(JSON.stringify(message.rolls[0]));
                let highest = 0;
                for (let i = 0; i < replacementRoll.terms[0].results.length; i++) {
                    replacementRoll.terms[0].results[i].result >
                    replacementRoll.terms[0].results[highest].result ?
                        highest = i : {}
                }
                replacementRoll.terms[0].results[highest].discarded = true;
                replacementRoll.terms[0].results[highest].active = false;
                replacementRoll.total -= (+replacementRoll.terms[0].results[highest].result);
                const messageUpdate = {};
                messageUpdate.system = {};
                messageUpdate.content = replacementRoll.total;
                messageUpdate.id = message.id;
                messageUpdate._id = message.id;
                messageUpdate.rolls = [];
                messageUpdate.rolls[0] = replacementRoll;

                if (message.getFlag('od6s', 'difficulty') && message.getFlag('od6s', 'success')) {
                    if (replacementRoll.total < message.getFlag('od6s', 'difficulty')) {
                        await message.setFlag('od6s', 'success', false);
                    }
                }

                await message.update(messageUpdate, {"diff": true});

                break;
            case '2':
                await message.setFlag('od6s', 'wildResult', 'OD6S.COMPLICATION');
                break
        }
        await message.setFlag('od6s', 'wildHandled', true);
        if (message.getFlag('od6s', 'isOpposable') && OD6S.autoOpposed
            && (message.getFlag('od6s', 'type') === 'damage') || message.getFlag('od6s', 'type') === 'resistance') {
            await od6sutilities.autoOpposeRoll(message);
        }

        if (message.getFlag('od6s', 'subtype') === 'purchase' && message.getFlag('od6s', 'success')) {
            const seller = game.actors.get(message.getFlag('od6s', 'seller'));
            await seller.sheet._onPurchase(message.getFlag('od6s', 'purchasedItem'), message.speaker.actor);
        }
    }
}
