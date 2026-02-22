// Import Modules
import {OD6SActor} from "./actor/actor.js";
import {OD6SActorSheet} from "./actor/actor-sheet.js";
import {OD6SItem} from "./item/item.js";
import {OD6SItemSheet} from "./item/item-sheet.js";
import {OD6SToken} from "./overrides/token.js";
import {od6sutilities} from "./system/utilities.js";
import {OD6SCombatTracker} from "./overrides/combat-tracker.js";
import {OD6SCompendiumDirectory} from "./overrides/compendium-directory.js";
import {OD6SChatLog} from "./overrides/chat-log.js";
import OD6SEditDifficulty, {OD6SChat, OD6SChooseTarget, OD6SEditDamage, OD6SHandleWildDieForm} from "./apps/chat.js";
import OD6SSocketHandler from "./system/socket.js";
import OD6S from "./config/config-od6s.js";
import od6sSettings from "./config/settings-od6s.js";
import od6sHandlebars from "./system/handlebars.js"
import {OD6SInitiative} from "./system/initative.js";
import {OD6SCombat} from "./overrides/combat.js";
import {od6sroll} from "./apps/od6sroll.js";
import {ActorSheetStarWars, ActorSheetStarW1e} from "./actor/actor-sheets-star-wars.js";

od6sSettings();
od6sHandlebars();

// Preload Google Fonts used by Star Wars sheet themes (Barlow Condensed + Domine)
for (const [rel, href, cross] of [
    ['preconnect', 'https://fonts.googleapis.com', false],
    ['preconnect', 'https://fonts.gstatic.com', true],
    ['stylesheet', 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Domine:wght@400;700&display=swap', false]
]) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (cross) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}

Hooks.once('init', async function () {

    game.od6s = {
        OD6SActor,
        OD6SItem,
        OD6SToken,
        rollItemMacro,
        rollItemNameMacro,
        simpleRoll,
        getActorFromUuid,
        diceTerms: [CharacterPointDie, WildDie],
        config: OD6S,
    };

    //CONFIG.debug.hooks = true

    game.socket.on('system.od6s', (data) => {
        if (data.operation === 'updateRollMessage') OD6SSocketHandler.updateRollMessage(data);
        if (data.operation === 'updateInitRoll') OD6SSocketHandler.updateInitRoll(data);
        if (data.operation === 'addToVehicle') OD6SSocketHandler.addToVehicle(data);
        if (data.operation === 'removeFromVehicle') OD6SSocketHandler.removeFromVehicle(data);
        if (data.operation === 'sendVehicleStats') OD6SSocketHandler.sendVehicleStats(data);
        if (data.operation === 'updateExplosiveTemplate') OD6S.SocketHandler.updateExplosiveTemplate(data);
        if (data.operation === 'deleteExplosiveTemplate') OD6S.SocketHandler.deleteExplosiveTemplate(data);
    })

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "@initiative.formula",
        decimals: 2
    };

    if (typeof Babele !== 'undefined') {
        Babele.get().setSystemTranslationsDir("lang/translations");
    }

    CONFIG.Combat.documentClass = OD6SCombat;
    CONFIG.ui.chat = OD6SChatLog;
    CONFIG.ui.combat = OD6SCombatTracker;
    CONFIG.ui.compendium = OD6SCompendiumDirectory;
    CONFIG.statusEffects = OD6S.statusEffects;
    CONFIG.Dice.terms["w"] = WildDie;
    CONFIG.Dice.terms["b"] = CharacterPointDie;
    CONFIG.Token.objectClass = OD6SToken;

    // v13: CONFIG.ChatMessage.template was removed. Override documentClass to use custom template.
    const _BaseChatMessage = CONFIG.ChatMessage.documentClass;
    CONFIG.ChatMessage.documentClass = class OD6SChatMessage extends _BaseChatMessage {
        async _renderHTML(options) {
            const templateData = {
                message: this,
                cssClass: [
                    this.style === CONST.CHAT_MESSAGE_STYLES.OTHER ? "" : "whisper",
                    this.blind ? "blind" : ""
                ].filterJoin(" "),
                isWhisper: this.whisper.length > 0,
                canDelete: game.user.isGM,
                alias: this.alias,
                borderColor: this.getFlag("od6s", "borderColor") ?? null
            };
            return renderTemplate("systems/od6s/templates/chat/chat-inner.html", templateData);
        }
    };

    // Define custom Entity classes
    CONFIG.Actor.documentClass = OD6SActor;
    CONFIG.Item.documentClass = OD6SItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("od6s", OD6SActorSheet, {makeDefault: true});
    Actors.registerSheet("od6s", ActorSheetStarWars, {label: game.i18n.localize("od6s-star-wars.ActorSheetStarWars")});
    Actors.registerSheet("od6s", ActorSheetStarW1e,  {label: game.i18n.localize("od6s-star-wars.ActorSheetStarW1e")});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("od6s", OD6SItemSheet, {makeDefault: true});
});

// Application Close Hook
Hooks.on('closeApplication', async (app, buttons) => {

})

Hooks.on('drawMeasuredTemplate', async (template, refreshState) => {
})

Hooks.on('refreshMeasuredTemplate', async (template, refreshState) => {
})

Hooks.on('createMeasuredTemplate', async (template, data, data2) => {
})

//update measuredTemplate hook
Hooks.on('updateMeasuredTemplate', async (template, change) => {
    // If the template has a message attached, update the targets in the message
    if (game.user.isGM) {
        if (change.flags?.od6s.messageId ) {
            return;
        }
        if (template.getFlag('od6s', 'messageId') && !template.getFlag('od6s', 'handled')) {
            const message = game.messages.get(template.getFlag('od6s', 'messageId'));
            if (typeof (message !== 'undefined') && message !== '') {

                let actor;
                if (message.speaker.token !== '' && message.speaker.token !== null) {
                    actor = game.scenes.get(message.speaker.scene).tokens.get(message.speaker.token).object.actor;
                } else {
                    actor = game.actors.get(message.speaker.actor);
                }
                const targets = await od6sutilities.getExplosiveTargets(
                    actor,
                    template.getFlag('od6s', 'item'));
                await message.unsetFlag('od6s', 'targets');
                await message.setFlag('od6s', 'targets', targets);
                await message.render();
            }
        }
    }
})

Hooks.on('preDeleteDocument', async (document, options, userId) => {
    if (['starship','vehicle'].includes(document.type)) {
        if (document.system.crewmembers.length > 0) {
            // Iterate through crew and disembark
            if(game.user.isGM) {
                for (const c in document.system.crewmembers) {
                    const actor = od6sutilities.getActorFromUuid(document.system.crewmembers[c].uuid);
                    await actor.removeFromCrew(this.document.uuid)
                }
            }
        }
    }

    if (['character','npc','creature'].includes(document.type)) {
        if (typeof document.system.vehicle.uuid !== 'undefined' && document.system.vehicle.uuid !== ''  ) {
            if (game.user.isGM) {
                const vehicle = od6sutilities.getActorFromUuid(document.system.vehicle.uuid);
                await vehicle.forceRemoveCrewmember(this.document.uuid);
            }
        }
    }
})

//Delete template hook
Hooks.on('deleteMeasuredTemplate', async (template) => {
    if (game.settings.get('od6s', 'auto_explosive') && game.user.isGM) {
        if (template.getFlag('od6s', 'explosive')) {
            // Delete the flags from the item that generated the template
            let actor;
            if(template.getFlag('od6s','token')) {
                const token = game.scenes.active.tokens.get(template.getFlag('od6s', 'token'));
                actor = token.actor;
            } else {
                actor = await od6sutilities.getActorFromUuid(template.getFlag('od6s', 'actor'));
            }
            if (typeof (actor) !== 'undefined') {
                const item = actor.items.get(template.getFlag('od6s', 'item'));
                if (typeof (item) !== 'undefined') {
                    await item.unsetFlag('od6s', 'explosiveOrigin');
                    await item.unsetFlag('od6s', 'explosiveRange');
                    await item.unsetFlag('od6s', 'explosiveSet');
                    await item.unsetFlag('od6s', 'explosiveTemplate');
                }
            }
            if(template.getFlag('od6s','messageId') && !template.getFlag('od6s','handled')) {
                const message = game.messages.get(template.getFlag('od6s','messageId'));
                if(typeof(message) !== 'undefined') await message.delete();
            }
        }
    }
})

// Chat hooks
// Chat listeners
Hooks.on('renderChatMessage', (msg, html, data) => {
    if (game.settings.get('od6s', 'hide-gm-rolls') && data?.whisperTo !== '') {
        if (game.user.isGM === false &&
            game.userId !== (data?.author?.id ?? msg.author?.id) &&
            (msg.whisper ?? []).indexOf(game.user.id) === -1) {
            msg.sound = null;
            // v13: html may be an HTMLElement rather than jQuery
            if (html instanceof HTMLElement) html.style.display = 'none';
            else if (html?.hide) html.hide();
        }
    }
})

Hooks.on("preDeleteChatMessage", async (message, data, diff, id) => {
    if(message.getFlag('od6s','isExplosive') && game.user.isGM) {
        // Delete the template and clear the flag from the item
        let actor;
        if (message.speaker.token !== '') {
            actor = game.scenes.get(message.speaker.scene).tokens.get(message.speaker.token).object.actor;
        } else {
            actor = game.actors.get(message.speaker.actor);
        }
        const item = actor.items.find(i => i.id === message.getFlag('od6s', 'itemId'));
        const template = await canvas.scene.getEmbeddedDocument('MeasuredTemplate', item.getFlag('od6s', 'explosiveTemplate'));
        if (typeof (template) !== 'undefined') {
            await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [item.getFlag('od6s', 'explosiveTemplate')]);
        }
        await item.unsetFlag('od6s', 'explosiveSet');
        await item.unsetFlag('od6s', 'explosiveTemplate');
        await item.unsetFlag('od6s', 'explosiveOrigin');
        await item.unsetFlag('od6s', 'explosiveRange');
        await od6sutilities.wait(100);
    }
})

Hooks.on("preUpdateChatMessage", async (message, data, options, id) => {

})

Hooks.on('deleteChatMessage', async (message, data, options, id) => {

})

Hooks.on("updateChatMessage", async (message, data, diff, id) => {
    if (data.blind === false) {
        let messageLi = $(`.message[data-message-id=${data._id}]`);
        messageLi.show();
    }

    if (message.getFlag('od6s','isExplosive') && typeof(data.flags?.od6s?.success) !== 'undefined') {
        if(game.user.isGM) {
            let newTargets = message.getFlag('od6s','targets');

                const messageData = od6sutilities.getTemplateFromMessage(message);
                const actor = messageData.actor;
                const item = messageData.item;
                const template = messageData.template;

                let updateTargets = false;

                if (!data.flags.od6s.success && OD6S.autoExplosive) {
                    // Missed, scatter it
                    if (message.getFlag('od6s', 'isExplosive')) {
                        await od6sutilities.scatterExplosive(message.getFlag('od6s', 'range'), item.getFlag('od6s', 'explosiveOrigin'), template.id);
                        await od6sutilities.wait(100);
                        updateTargets = true;
                    }
                }

                if (data.flags.od6s.success) {
                    // Hit, un-scatter the template
                    const update = {
                        x: template.getFlag('od6s', 'originalX'),
                        y: template.getFlag('od6s', 'originalY')
                    }
                    await template.update(update);
                    await od6sutilities.wait(100);
                    await template.render();
                    updateTargets = true;
                }

                if (updateTargets) {
                    newTargets = await od6sutilities.getExplosiveTargets(actor, item.id);
                    if (Object.keys(newTargets).length === 0) {
                        await message.setFlag('od6s','showButton', false);
                    } else {
                        await message.setFlag('od6s','showButton',true);
                    }
                    await message.unsetFlag('od6s','targets');
                    await message.setFlag('od6s', 'targets', newTargets);
                }

        }
    }

    await promptResistanceRolls(message);
});

Hooks.on('renderChatLog', (log, html, data) => {
    // v13: html may be an HTMLElement; wrap with jQuery if needed for event delegation
    const $html = html instanceof HTMLElement ? $(html) : html;

    $html.on('input', ".explosive-damage", async ev => {
        const message =  await game.messages.get(ev.currentTarget.dataset.messageId);
        const targets = message.getFlag('od6s','targets');
        targets[ev.currentTarget.dataset.target].damage = ev.target.value;
        await message.setFlag('od6s','targets',targets);
    })

    $html.on("click", ".modifiers-button", async ev => {
        let content = document.getElementById("modifiers-display-" + ev.currentTarget.dataset.messageId);
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
        game.messages.get(ev.currentTarget.dataset.messageId).render();
    })

    $html.on("click", ".damage-modifiers-button", async ev => {
        let content = document.getElementById("damage-modifiers-display-" + ev.currentTarget.dataset.messageId);
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
        game.messages.get(ev.currentTarget.dataset.messageId).render();
    })

    $html.on("click", ".apply-damage-button", async ev => {
        ev.preventDefault();
        let token = game.scenes.active.tokens.get(ev.currentTarget.dataset.tokenId);
        let actor;
        if(typeof(token) === 'undefined' && token !== null) {
            actor = game.scenes.active.tokens.get(ev.currentTarget.dataset.tokenId).actor;
        } else {
            actor = token?.actor;
        }
        const result = ev.currentTarget.dataset.result;
        const isVehicle = ev.currentTarget.dataset.isVehicle;
        const messageId = ev.currentTarget.dataset.messageId;
        const update = {};
        const stun = ev.currentTarget.dataset.stun;
        const msg = game.messages.get(messageId);
        const stunEffect = msg.getFlag('od6s', 'stunEffect');

        if ((actor.type !== 'vehicle' && actor.type !== 'starship') && (isVehicle === true || isVehicle === 'true')) {
            actor = await od6sutilities.getActorFromUuid(actor.system.vehicle.uuid);
        }

        if (od6sutilities.boolCheck(stun)) {
            if (stunEffect === 'unconscious') {
                if (game.settings.get('od6s', 'auto_status')) {
                    await token.object.toggleEffect(CONFIG.statusEffects.find(e => e.id === 'unconscious', {
                        overlay: false,
                        active: true
                    }));
                }
            } else {
                if (stunEffect === '-1D') {
                    const update = {}
                    update[`system.stuns.current`] = 1;
                    update[`system.stuns.rounds`] = 1;
                    update[`system.stuns.value`] = (+actor.system.stuns.value) + 1;
                    await actor.update(update);
                } else if (stunEffect === '-2D') {
                    update[`system.stuns.current`] = 2;
                    update[`system.stuns.rounds`] = 1;
                    update[`system.stuns.value`] = (+actor.system.stuns.value) + 1;
                    await actor.update(update);
                }
                if(!actor.effects.contents.find(
                    i => i.label === game.i18n.localize(CONFIG.statusEffects.find(
                        e => e.id === 'stunned').label))) {
                    await token.object.toggleEffect(CONFIG.statusEffects.find(e => e.id === 'stunned', {
                        overlay: false,
                        active: true
                    }));
                }
            }

        } else {
            update.id = actor.id;
            if (game.settings.get('od6s', 'bodypoints') === 0 || (isVehicle === true || isVehicle === 'true')
                || actor.type === 'starship' || actor.type === 'vehicle') {
                if (isVehicle === true || isVehicle === 'true') {
                    await actor.applyDamage(result);
                } else {
                    await actor.applyWounds(result);
                }
            } else {
                let bp = actor.system.wounds.body_points.current - result;
                if (bp < 0) bp = 0;
                update['system.wounds.body_points.current'] = bp;
                if (game.settings.get('od6s', 'bodypoints') === 1) await actor.setWoundLevelFromBodyPoints(bp);
            }
            await actor.update(update);
        }
        await actor.update(update);
        await msg.setFlag('od6s', 'applied', true);
    })

    $html.on("click", ".explosive-damage-button", async ev => {
        ev.preventDefault();
        await od6sutilities.detonateExplosive(ev.currentTarget.dataset);
    })

    $html.on('click', '.remove-template-button', async ev=> {
        const message =  await game.messages.get(ev.currentTarget.dataset.messageId);
        const actor = message.speaker.token === null ?
            game.actors.get(message.speaker.actor) : game.scenes.active.tokens.get(message.speaker.token).actor;
        const item = actor.items.get(message.getFlag('od6s','itemId'));
        const template = canvas.scene.getEmbeddedDocument('MeasuredTemplate', item.getFlag('od6s','explosiveTemplate'));
        await template.setFlag('od6s','handled', true);
        await message.setFlag('od6s','handled', true);
        await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [template.id]);
        msg.setFlag('od6s', 'applied', true);
    })

    $html.on("click", ".damage-button", async ev => {
        ev.preventDefault();
        const data = ev.currentTarget.dataset;
        const dice = {};
        dice.dice = data.damageDice;
        dice.pips = data.damagePips;
        let rollString;
        let itemId = '';

        if (typeof (data?.itemId) !== 'undefined' && data.itemId !== '') {
            itemId = data.itemId;
        }

        if (game.settings.get('od6s', 'use_wild_die')) {
            dice.dice = dice.dice - 1;
            if (dice.dice < 1) {
                rollString = "+1dw" + game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
            } else {
                rollString = dice.dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR') + "+1dw" +
                    game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
            }
        } else {
            rollString = dice.dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR');
        }
        dice.pips ? rollString += "+" + dice.pips : null;
        if (!game.settings.get('od6s', 'dice_for_scale')) {
            if (data.damagescalebonus > 0) rollString += "+" + Math.abs(data.damagescalebonus);
            if (data.damagescalebonus < 0) rollString += "-" + Math.abs(data.damagescalebonus);
        }

        let roll = await new Roll(rollString).evaluate();

        let label = game.i18n.localize('OD6S.DAMAGE') + " (" +
            game.i18n.localize(OD6S.damageTypes[data.damagetype]) + ")";

        if (typeof (data.source) !== 'undefined' && data.source !== '') {
            label = label + " " + game.i18n.localize('OD6S.FROM') + " " +
                game.i18n.localize(data.source);
        }

        if (typeof (data.vehicle) !== 'undefined' && data.vehicle !== '') {
            const vehicle = await od6sutilities.getActorFromUuid(data.vehicle);
            label = label + " " + game.i18n.localize('OD6S.BY') + " " + vehicle.name;
        }

        if (typeof (data.targetname) !== 'undefined' && data.targetname !== '') {
            label = label + " " + game.i18n.localize('OD6S.TO') + " " + data.targetname;
        }

        data.collision = (data.collision === 'true');

        const flags = {
            "type": "damage",
            "source": data.source,
            "damageType": data.damagetype,
            "targetName": data.targetname,
            "targetId": data.targetid,
            "attackMessage": data.messageId,
            "isOpposable": true,
            "wild": false,
            "wildHandled": false,
            "wildResult": OD6S.wildDieResult[OD6S.wildDieOneDefault],
            "total": roll.total,
            "isVehicleCollision": data.collision,
            "stun": data.stun,
            "itemId": itemId
        }

        if (game.settings.get('od6s', 'use_wild_die')) {
            const WildDie = roll.terms.find(d => game.i18n.localize("OD6S.WILD_DIE_FLAVOR").includes(d.flavor))
            if (WildDie.total === 1) {
                flags.wild = true;
                if (OD6S.wildDieOneDefault > 0 && OD6S.wildDieOneAuto === 0) {
                    flags.wildHandled = true;
                }
            } else {
                flags.wild = false;
            }
        }

        let rollMode = 'roll';
        if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

        let rollMessage = await roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: game.actors.find(a => a.id === data.actor)}),
            flavor: label,
            flags: {
                od6s: flags
            },
            rollMode: rollMode, create: true
        });

        if (flags.wild === true && OD6S.wildDieOneDefault === 2 && OD6S.wildDieOneAuto === 0) {
            let replacementRoll = JSON.parse(JSON.stringify(rollMessage.rolls[0].toJSON()));
            let highest = 0;
            for (let i = 0; i < replacementRoll.terms[0].results.length; i++) {
                replacementRoll.terms[0].results[i].result >
                replacementRoll.terms[0].results[highest].result ?
                    highest = i : {}
            }
            replacementRoll.terms[0].results[highest].discarded = true;
            replacementRoll.terms[0].results[highest].active = false;
            replacementRoll.total -= (+replacementRoll.terms[0].results[highest].result);
            const rollMessageUpdate = {};
            rollMessageUpdate.system = {};
            rollMessageUpdate.content = replacementRoll.total;
            rollMessageUpdate.id = rollMessage.id;
            rollMessageUpdate.rolls = [];
            rollMessageUpdate.rolls[0] = replacementRoll;

            if (game.user.isGM) {
                if (rollMessage.getFlag('od6s', 'difficulty') && rollMessage.getFlag('od6s', 'success')) {
                    replacementRoll.total < rollMessage.getFlag('od6s', 'difficulty') ? await rollMessage.setFlag('od6s', 'success', false) :
                        await rollMessage.setFlag('od6s', 'success', true);
                }
                await rollMessage.setFlag('od6s', 'originalroll', rollMessage.rolls[0])
                await rollMessage.update(rollMessageUpdate, {"diff": true});
            } else {
                game.socket.emit('system.od6s', {
                    operation: 'updateRollMessage',
                    message: rollMessage,
                    update: rollMessageUpdate
                })
            }
        }
    })

    $html.on("click", ".flavor-text", async ev => {
        if (!game.user.isGM) return;
        const message = game.messages.get(ev.currentTarget.dataset.messageId);
        let actor;
        if (message.speaker.actor && message?.speaker.token) {
            const tokenDoc = game.scenes.get(message.speaker.scene)?.tokens?.get(message.speaker.token);
            actor = tokenDoc?.actor ?? game.actors.get(message.speaker.actor);
        } else {
            actor = game.actors.get(message.speaker.actor)
        }
        // Find the item
        let item = actor?.items.find(i => i.id === message.getFlag('od6s', 'itemId'));
        if (typeof (item) === "undefined" || item === "") {
            // See if the actor is a crewmember
            if (typeof (actor?.system.vehicle.name) !== 'undefined') {
                const vehicleActor = await od6sutilities.getActorFromUuid(actor.system.vehicle.uuid);
                item = vehicleActor.items.find(i => i.id === message.getFlag('od6s', 'itemId'));
            }
        }
        if (typeof (item) === "undefined") return;
        item.sheet.render(true);
    })

    $html.on("click", ".select-actor", async ev => {
        if (!game.user.isGM) return;
        ev.preventDefault();
        const message = game.messages.get(ev.currentTarget.dataset.messageId);
        let actor;
        if (message.speaker.actor && message.speaker.token) {
            const tokenDoc = game.scenes.get(message.speaker.scene)?.tokens?.get(message.speaker.token);
            actor = tokenDoc?.actor ?? game.actors.get(message.speaker.actor);
        } else {
            actor = game.actors.get(message.speaker.actor)
        }
        actor.sheet.render(true);
    })

    $html.on("click", ".edit-difficulty", async ev => {
        let data = {};
        const dataSet = ev.currentTarget.dataset;
        data.messageId = dataSet.messageId;
        const message = game.messages.get(dataSet.messageId);
        data.baseDifficulty = message.getFlag('od6s', 'baseDifficulty');
        data.modifiers = message.getFlag('od6s', 'modifiers');
        new OD6SEditDifficulty(data).render(true);
    })

    $html.on("click", ".edit-difficulty-submit", async ev => {
    })

    $html.on("click", ".edit-damage", async ev => {
        ev.preventDefault();
        let data = {};
        const dataSet = ev.currentTarget.dataset;
        data.messageId = dataSet.messageId;
        const message = game.messages.get(dataSet.messageId);
        data.damage = message.getFlag('od6s', 'damageScore');
        data.damageDice = message.getFlag('od6s', 'damageDice');
        new OD6SEditDamage(data).render(true);
    })

    $html.on("click", ".choose-target", async ev => {
        ev.preventDefault();
        data = {};
        data.targets = [];
        data.messageId = ev.currentTarget.dataset.messageId;
        const message = game.messages.get(data.messageId);

        if (game.user.isGM) {
            data.isExplosive = message.getFlag('od6s','isExplosive');
            // If in combat, only load tokens in combat.  Otherwise, load all tokens in scene
            if (game.combat) {
                for (let t of game.combat.combatants) {
                    const target = {
                        "id": t.token.id,
                        "name": t.token.name
                    }
                    data.targets.push(target);

                }
            } else {
                data.targets = game.scenes.active.tokens;
            }
        } else {
            return;
        }
        new OD6SChooseTarget(data).render(true);
    })

    $html.on("change", ".explosive-target-zone", async ev => {
        const message = game.messages.get(ev.currentTarget.dataset.messageId);
        const targets = Array.from(message.getFlag('od6s','targets'));
        for (const t in targets) {
            if(ev.currentTarget.dataset.targetId === targets[t].id) {
                targets[t].zone = parseInt(ev.target.value);
            }
        }
        await message.setFlag('od6s','targets', targets);
    })

    $html.on("click", ".message-sender", async ev => {
        ev.preventDefault();
        const message = await game.messages.get(ev.currentTarget.dataset.messageId);
        if (message.speaker?.token !== null && message.speaker?.token !== "") {
            const scene = game.scenes.get(message.speaker.scene);
            const token = scene.tokens.get(message.speaker.token);
            if (typeof (token) !== "undefined" && typeof (token.actor) !== "undefined" && token.actor !== null) {
                if (game.user.isGM || token.actor.isOwner) {
                    token.actor.sheet.render(true)
                }
            }
        }
    })

    $html.on("click", ".wilddiegm", async ev => {
        ev.preventDefault();
        // three choices: leave it as-is, remove the highest die from the roll, or cause a complication
        new OD6SHandleWildDieForm(ev).render(true);
    })

    $html.on("click", ".message-reveal", async ev => {
        const message = game.messages.get(ev.currentTarget.dataset.messageId);
        await message.setFlag('od6s', 'isVisible', true);
        await message.setFlag('od6s', 'isKnown', true);
        if(message.getFlag('od6s','isExplosive') && game.settings.get('od6s','auto_explosive')) {
            // Reveal the template
            const template = od6sutilities.getTemplateFromMessage(message).template;
            if(template !== 'undefined') {
                const owner = game.users.get(template.getFlag('od6s', 'originalOwner'))
                await template.update({
                    hidden: false,
                    user: owner
                })
            }
        }
    })

    $html.on("click", ".message-oppose", async ev => {
        ev.preventDefault();
        // Check if there are any opposed cards already in the pipe
        const data = {};
        data.messageId = ev.currentTarget.dataset.messageId;
        data.target = ev.currentTarget.dataset?.target;

        if (OD6S.opposed.length > 0) {
            OD6S.opposed.push(data);
            return od6sutilities.handleOpposedRoll(data);
        } else {
            OD6S.opposed.push(data);
        }
    })

    $html.on("change", ".choose-difficulty", async ev => {
        ev.preventDefault();
        const message = game.messages.get(ev.currentTarget.dataset.messageId);
        const flags = {
            difficultyLevel: ev.currentTarget.value,
            difficulty: await od6sutilities.getDifficultyFromLevel(ev.currentTarget.value)
        }

        const update = {};
        update.flags = {};
        update.flags.od6s = flags;
        update.id = message.id;
        update._id = message.id;

        if (message.getFlag('od6s', 'total') < flags.difficulty) {
            flags.success = false;
        } else {
            flags.success = true;
        }

        if (message.getFlag('od6s', 'subtype') === 'purchase' && message.getFlag('od6s', 'success')) {
            const seller = game.actors.get(message.getFlag('od6s', 'seller'));
            await seller.sheet._onPurchase(message.getFlag('od6s', 'purchasedItem'), message.speaker.actor);
        }

        await message.update(update, {"diff": true});
    })
})

// Custom dice for DiceSoNice
Hooks.on('diceSoNiceReady', (dice3d) => {
    dice3d.addSystem({id: 'od6s', name: "OpenD6 Space"}, "default")
    dice3d.addDicePreset({
        type: "dw",
        labels: [game.settings.get('od6s', 'wild_die_one_face'), "2", "3", "4", "5", game.settings.get('od6s', 'wild_die_six_face')],
        colorset: "white",
        values: {min: 1, max: 6},
        system: "od6s"
    }, "dw")
    dice3d.addDicePreset({
        type: "db",
        labels: ["1", "2", "3", "4", "5", "6"],
        colorset: "black",
        values: {min: 1, max: 6},
        system: "od6s"
    }, "db")
})

Hooks.on('diceSoNiceRollStart', (messageId, context) => {
    const message = game.messages.get(messageId);
    if (message.getFlag('od6s','isExplosive') && message.getFlag('od6s','triggered')) {
        context.blind=true;
    }
    const roll = context.roll;
    let die;
    let len = roll.dice.length;
    // Customize colors for Dice So Nice
    for (die = 0; die < len; die++) {
        switch (roll.dice[die].options.flavor) {
            case game.i18n.localize("OD6S.WILD_DIE_FLAVOR").includes(roll.dice[die].options.flavor):
                roll.dice[die].options.colorset = "white";
                break;
            case "CP":
                roll.dice[die].options.colorset = "black";
                break;
            case "Bonus":
                roll.dice[die].options.colorset = "black";
                break;
            default:
                break;
        }
    }
})

Hooks.on('renderChatMessage', (message, html, data) => {
    ui.chat.scrollBottom();
})

Hooks.on('updateActiveEffect', async (effect) => {
    await od6sutilities.handleEffectChange(effect);
})

Hooks.on('deleteActiveEffect', async (effect) => {
    if(effect.statuses.has('stunned')) {
        const update = {};
        update.system = {};
        update.system.stuns = {};
        update.system.stuns.current = 0;
        //update.system.stuns.value = effect.target.system.stuns.value ? effect.target.system.stuns.value - 1 : 0;
        await effect.target.update(update);
    }
    await od6sutilities.handleEffectChange(effect);
})

Hooks.on("canvasReady", async () => {
    //Loop through all vehicle actors/tokens and sync vehicle data
    if (game.user.isGM) {
        if (typeof (game.scenes.active && game.scenes.active.tokens.size > 0) !== 'undefined') {
            for (const t in game.scenes.active.tokens) {
                if (['starship','vehicle'].includes(game.scenes?.active.tokens[t].type)) {
                    await game.scenes?.active.tokens[t].sendVehicleData();
                }
            }
        }
    }
})

// v12: hook is named after the overridden class; v13 ApplicationV2 uses "getChatMessageEntryContext"
Hooks.on("getOD6SChatLogEntryContext", async (html, options) => {
    await OD6SChat.chatContextMenu(html, options);
})
Hooks.on("getChatLogEntryContext", async (html, options) => {
    await OD6SChat.chatContextMenu(html, options);
})

Hooks.on("preUpdateActor", async (document, change, options, userId) => {
    if (change.system?.wounds && change.system.wounds.value > document.system.wounds.value) {
        if (game.settings.get('od6s', 'bodypoints') === 0) {
            const status = OD6S.woundsId[od6sutilities.getWoundLevel(change.system.wounds.value, document)];
            if (status === 'stunned') {
                change.system.stuns = {};
                change.system.stuns.value = document.system.stuns.value + 1;
                document.system.stuns.current < 1 ? change.system.stuns.current = 1 : change.system.stuns.current = document.system.stuns.current;
                change.system.stuns.rounds = 1;
            } else {
                if (document.system.stuns.current < 1) {
                    change.system.stuns = {};
                    change.system.stuns.current = 0;
                    change.system.stuns.rounds = 0;
                }
            }
        }
  } else if (change.system?.wounds && change.system.wounds.value < document.system.wounds.value) {
        const status = OD6S.woundsId[od6sutilities.getWoundLevel(change.system.wounds.value, document)];
        if (status === 'healthy') {
            change.system.stuns = {};
            change.system.stuns.value = 0;
            change.system.stuns.rounds = 0;
        }
    }
})

Hooks.on("updateActor", async (document, change, options, userId) => {
    if ((document.type === "vehicle" || document.type === "starship") && document.system.crewmembers.length > 0) {
        await document.sendVehicleData();
    }

    if(change.system?.stuns?.value) {
        if(game.settings.get('od6s','track_stuns')) {
            if (game.user.isGM) {
                if (document.system.stuns.value >= od6sutilities.getDiceFromScore(document.system.attributes.str.score).dice) {
                    // Actor has become unconscious
                    const roll = await new Roll("2d6").evaluate();
                    const flavor = document.name +
                        game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_01') +
                        roll.total +
                        game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_02');
                    await roll.toMessage({flavor: flavor});

                    let tokens;
                    tokens ??= document.getActiveTokens(true, false);
                    for (const token of tokens) {
                        await token.toggleEffect(CONFIG.statusEffects.find(e => e.id === 'unconscious', {
                            overlay: false,
                            active: true
                        }));
                    }
                }
            }
        }
    }

    if (change.system?.wounds?.value) {
        if(game.settings.get('od6s','auto_status')) {
            const status = OD6S.woundsId[od6sutilities.getWoundLevel(change.system.wounds.value, document)];
            if ((document.hasPlayerOwner && document.isOwner)) {
                let tokens;
                tokens ??= document.getActiveTokens(true, false);

                for (const s in OD6S.woundsId) {
                    const id = OD6S.woundsId[s]
                    if (id === 'healthy') continue;
                    const statusEffect = CONFIG.statusEffects.find(e => e.id === id)
                    if (game.user.isGM) {
                        for (const token of tokens) {
                            await token.toggleEffect(statusEffect, {
                                overlay: false,
                                active: false
                            });
                        }
                    }
                }

                for (const token of tokens) {
                    if (status === 'healthy') continue;
                    if (game.user.isGM) {
                        await token.toggleEffect(CONFIG.statusEffects.find(e => e.id === status, {
                            overlay: false,
                            active: true
                        }));
                    }
                }

                if (status === 'healthy') {
                    await document.unsetFlag('od6s', 'mortally_wounded');
                } else if (status === 'stunned') {
                    // Apply stunned flag
                    if (document.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                        await document.unsetFlag('od6s', 'mortally_wounded');
                    }
                } else if (status === 'wounded') {
                    if (document.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                        await document.unsetFlag('od6s', 'mortally_wounded');
                    }
                } else if (status === 'severely_wounded') {
                    if (document.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                        await document.unsetFlag('od6s', 'mortally_wounded');
                    }
                } else if (status === 'incapacitated') {
                    if (document.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                        await document.unsetFlag('od6s', 'mortally_wounded');
                    }

                    if (game.settings.get('od6s', 'auto_incapacitated')) {
                        const rollData = {
                            name: game.i18n.localize('OD6S.RESIST_INCAPACITATED'),
                            actor: document,
                            score: document.system.attributes.str.score,
                            type: 'incapacitated',
                            difficultylevel: 'OD6S.DIFFICULTY_MODERATE'
                        }
                        await od6sroll._onRollDialog(rollData);
                    } else {
                        await document.applyIncapacitatedFailure();
                    }
                } else if (status === 'mortally_wounded') {
                    await document.setFlag('od6s', 'mortally_wounded', 0)
                }


            } else if (!document.hasPlayerOwner && game.user.isGM) {
                let tokens;
                tokens ??= document.getActiveTokens(true, false);
                for (const s in OD6S.woundsId) {
                    const id = OD6S.woundsId[s]
                    if (id === 'healthy') continue;
                    const statusEffect = CONFIG.statusEffects.find(e => e.id === id)
                    for (const token of tokens) {
                        await token.toggleEffect(statusEffect, {
                            overlay: false,
                            active: false
                        });
                    }
                }

                for (const token of tokens) {
                    if (status === 'healthy') continue;
                    await token.toggleEffect(CONFIG.statusEffects.find(e => e.id === status, {
                        overlay: false,
                        active: true
                    }));
                }

                for (const token of tokens) {
                    if (status === 'stunned') {
                        // Apply stunned flag
                        if (token.actor.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                            await token.actor.unsetFlag('od6s', 'mortally_wounded');
                        }
                    } else if (status === 'wounded') {
                        if (token.actor.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                            await token.actor.unsetFlag('od6s', 'mortally_wounded');
                        }
                    } else if (status === 'severely_wounded') {
                        if (token.actor.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                            await token.actor.unsetFlag('od6s', 'mortally_wounded');
                        }
                    } else if (status === 'incapacitated') {
                        if (token.actor.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
                            await token.actor.unsetFlag('od6s', 'mortally_wounded');
                        }

                        const rollData = {
                            name: game.i18n.localize('OD6S.RESIST_INCAPACITATED'),
                            actor: token.actor,
                            score: token.actor.system.attributes.str.score,
                            type: 'incapacitated',
                            difficultylevel: 'OD6S.DIFFICULTY_MODERATE'
                        }
                        await od6sroll._onRollDialog(rollData);
                    } else if (status === 'mortally_wounded') {
                        await token.actor.setFlag('od6s', 'mortally_wounded', 1)
                    }
                }
            }
        }
    }
})

Hooks.on("updateToken", async (document, change, options, userId) => {
    if ((document.type === "vehicle" || document.type === "starship")
        && document.system.crewmembers.length > 0 && !document.system?.embedded_pilot) {
        await document.sendVehicleData();
    }
})

Hooks.on('i18nInit', () => {
    // v13: game.i18n.translations still accessible; guard in case the ITEM namespace changed
    try {
        if (game.i18n.translations?.ITEM) {
            game.i18n.translations.ITEM.TypeManifestation = OD6S.manifestationName;
        }
    } catch(e) {
        console.warn("OD6S | Could not set TypeManifestation i18n key:", e);
    }
})

Hooks.on("preDeleteToken", async (document, change, options, userId) => {
    if (document.actor.type === 'vehicle' || document.actor.type === 'starship') {
        if (document.actor.system.crew.value > 0) {
            for (let i = 0; i < document.actor.system.crewmembers.length; i++) {
                const crewMember = await od6sutilities.getActorFromUuid(document.actor.system.crewmembers[i].uuid);
                if (crewMember) {
                    try {
                        crewMember.removeFromCrew(document.actor.uuid);
                    } catch {
                        // Likely the other token was simultaneously deleted
                    }
                }
            }
        }
    } else {
        if (document.actor.getFlag('od6s', 'crew') !== '') {
            const vehicle = await od6sutilities.getActorFromUuid(document.actor.getFlag('od6s', 'crew'));
            if (vehicle) {
                try {
                    await vehicle.forceRemoveCrewmember(document.actor.uuid);
                } catch {
                    // Likely the other token was simultaneously deleted
                }
            }
        }
    }
})

Hooks.on("renderActorSheet", async (sheet) => {
    if ((sheet.actor.type === "vehicle" || sheet.actor.type === "starship") && sheet.actor.system.crewmembers.length > 0) {
        await sheet.actor.sendVehicleData();
    }
})

Hooks.on("preCreateCombatant", (combatant) => {
    if (combatant.actor.type === "container") return false;
    if ((combatant.actor.type === "vehicle" || combatant.actor.type === "starship") &&
        !combatant.actor.system?.embedded_pilot.value) {
        return false;
    }
})

Hooks.on("updateCombat", async (Combat, data, options, userId) => {
    if (game.user.isGM && Combat.round === 1 && Combat.turn === 0 && Combat.active && OD6S.startCombat) {
        // At the start of a new combat, make sure all actor's action lists are cleared
        OD6S.startCombat = false;
        for (let i = 0; i < Combat.combatants.length; i++) {
            await clearActionList(Combat.combatants[i].actor);
        }
    }

    if (game.user.isGM && Combat.round !== 0 && Combat.turn === 0 && Combat.active && !OD6S.startCombat) {
        // New round
    }

    // Actor has started their turn, clear their action list and defensive bonuses/penalties

    if (typeof (Combat.combatant.actor) !== 'undefined') {
        if (game.user.isGM) {

            if (!game.settings.get('od6s', 'reaction_skills')) {
                const update = {};
                update.id = Combat.combatant.actor.id;
                update.system = {};
                update.system.parry = {};
                update.system.parry.score = 0;
                update.system.dodge = {};
                update.system.dodge.score = 0;
                update.system.block = {};
                update.system.block.score = 0;
                await Combat.combatant.actor.update(update, {'diff': true});

                if (Combat.combatant.actor.isCrewMember()) {
                    if (Combat.combatant.actor.system.vehicle.dodge.score > 0) {
                        const vehicleId = Combat.combatant.actor.getFlag('od6s', 'crew');
                        const dodgeActor = await OD6S.socket.executeAsGM('getVehicleFlag', vehicleId, 'dodge_actor');
                        if (dodgeActor === Combat.combatant.actor.uuid) {
                            const vUpdate = {};
                            vUpdate.flags = {};
                            vUpdate.flags.od6s = {};
                            vUpdate.system = {};
                            vUpdate.system.dodge = {};
                            vUpdate.system.dodge.score = 0;
                            await OD6S.socket.executeAsGM('updateVehicle', vehicleId, vUpdate);
                            await OD6S.socket.executeAsGM('unsetVehicleFlag', vehicleId, 'dodge_actor');
                        }
                    }
                }
            }
            if (!OD6S.fatePointRound) {
                await Combat.combatant.actor.setFlag('od6s', 'fatepointeffect', false);
            }
        }
    }
})

Hooks.on('combatRound', async (Combat, data, options) => {

})

Hooks.on('combatTurn', async (Combat, data, options) => {

})

Hooks.on("preUpdateCombat", async (Combat, data, options, userId) => {
    // End-of-round stuff here
    if (data.turn === 0) {
        // Initiative
        if (game.user.isGM && game.settings.get('od6s', 'reroll_initiative')) {
            await OD6SInitiative._onPreUpdateCombat(Combat, data, options, userId);
        }
        if (game.user.isGM) {
            for (let i = 0; i < Combat.combatants.size; i++) {
                const combatant = Combat.combatants.contents[i].token;

                if (typeof (combatant) !== 'undefined') {
                    await clearActionList(combatant.actor);

                    let rounds = combatant.actor.system?.stuns?.rounds;
                    const update = {};
                    update.id = combatant.id;
                    update.system = {};

                    // Check if stun needs to be removed
                    if (rounds < 1) {
                        // Remove any stun status effects
                        const effect = combatant.actor.effects.contents.find(
                            i => i.label === game.i18n.localize(CONFIG.statusEffects.find(
                                e => e.id === 'stunned').label));

                        if (typeof (effect) !== 'undefined') {
                            await combatant.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
                        }
                        update.system.stuns = {};
                        update.system.stuns.rounds = 0;
                        update.system.stuns.current = 0;
                        update.system.stuns.value = combatant.actor.system.stuns.value;
                    } else if (rounds > 0) {
                        update.system.stuns = {};
                        update.system.stuns.rounds = rounds - 1;
                    }

                    if (game.settings.get('od6s', 'reaction_skills')) {
                        update.system.parry = {};
                        update.system.parry.score = 0;
                        update.system.dodge = {};
                        update.system.dodge.score = 0;
                        update.system.block = {};
                        update.system.block.score = 0;

                        if (combatant.actor.isCrewMember()) {
                            const vUpdate = {};
                            vUpdate.system = {};
                            vUpdate.system.dodge = {};
                            vUpdate.system.dodge.score = 0;
                            const vehicleId = combatant.actor.getFlag('od6s', 'crew');
                            const vehicle = await od6sutilities.getActorFromUuid(vehicleId);
                            if (typeof vehicle !== 'undefined') {
                                await vehicle.update(vUpdate);
                            }
                        }
                    }
                    await combatant.actor.update(update, {'diff': true});
                    if (OD6S.fatePointRound) {
                        await combatant.actor.setFlag('od6s', 'fatepointeffect', false);
                    }

                    if (game.settings.get('od6s', 'auto_mortally_wounded')) {
                        if (combatant.actor.getFlag('od6s', 'mortally_wounded') !== undefined) {
                            await combatant.actor.setFlag('od6s', 'mortally_wounded',
                                combatant.actor.getFlag('od6s', 'mortally_wounded') + 1);
                            if(combatant.hasPlayerOwner) {
                                OD6S.socket.executeForOthers("triggerRoll", 'mortally_wounded', combatant.uuid);
                            } else {
                                combatant.actor.triggerMortallyWoundedCheck();
                            }
                        }
                    }
                }
            }
        }
    }
})

Hooks.on("createCombat", async (Combat, combatant, info, data) => {
})

Hooks.on("preCreateCombat", async (Combat, combatant, info, data) => {
})

Hooks.on("deleteCombat", async function (Combat) {
    // Combat is over, clear all combatant action lists
    for (let i = 0; i < Combat.combatants.size; i++) {
        const combatant = Combat.combatants.contents[i].actor;
        if (typeof (combatant) !== 'undefined') {
            await clearActionList(combatant)
            const update = {};
            update.id = combatant.id;
            update.system = {};
            update.system.parry = {};
            update.system.parry.score = 0;
            update.system.dodge = {};
            update.system.dodge.score = 0;
            update.system.block = {};
            update.system.block.score = 0;
            await combatant.update(update, {'diff': true});
            await combatant.setFlag('od6s', 'fatepointeffect', false);
        }
    }
})

Hooks.on('createChatMessage', async function (msg) {

    if (game.user.isGM) {
        if (msg.getFlag('od6s', 'isOpposable') && OD6S.autoOpposed) {
            if ((msg.getFlag('od6s', 'type') === 'damage') ||
                msg.getFlag('od6s', 'type') === 'resistance') {
                await od6sutilities.waitFor3DDiceMessage(msg.id);
                await od6sutilities.autoOpposeRoll(msg);
            } else if (msg.getFlag('od6s', 'type') === 'explosive') {
                const targets = msg.getFlag('od6s', 'targets');
                for (const target in targets) {
                    while (OD6S.opposed.length > 0) {
                        // Loop until the previous message is handled
                        await new Promise(r => setTimeout(r, 100));
                    }
                    OD6S.opposed[0] = {
                        messageId: msg.id
                    };
                    const token = await game.scenes.active.tokens.get(targets[target].id);
                    if (typeof (token) !== 'undefined') {
                        await od6sutilities.generateOpposedRoll(token, msg);
                    }
                }

                // Delete the template and clear the flag from the item
                let actor;
                if (msg.speaker.token !== null && msg.speaker.token !== '') {
                    actor = game.scenes.get(msg.speaker.scene).tokens.get(msg.speaker.token).object.actor;
                } else {
                    actor = game.actors.get(msg.speaker.actor);
                }
                const item = actor.items.find(i => i.id === msg.getFlag('od6s', 'item'));

                await item.unsetFlag('od6s', 'explosiveSet');
                await item.unsetFlag('od6s', 'explosiveTemplate');
                await item.unsetFlag('od6s', 'explosiveOrigin');
                await item.unsetFlag('od6s', 'explosiveRange');
                await od6sutilities.wait(100);

                const template = await canvas.scene.getEmbeddedDocument('MeasuredTemplate', msg.getFlag('od6s', 'template'));
                if (typeof (template) !== "undefined") {
                    await template.setFlag('od6s', 'handled', true);
                    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [template.id])
                }
            }

            let target;
            if (msg.getFlag('od6s', 'target')) {
                target = await od6sutilities.getActorFromUuid(msg.getFlag('od6s', 'targetId'))
            }
            if (msg.getFlag('od6s', 'isOpposable') && OD6S.autoOpposed && !target?.hasPlayerOwner
                && (msg.getFlag('od6s', 'type') === 'damage') || msg.getFlag('od6s', 'type') === 'resistance') {
                await od6sutilities.waitFor3DDiceMessage(msg.id);
                await od6sutilities.autoOpposeRoll(msg);
            }
        }
    }

    await promptResistanceRolls(msg);
})

/**
 * Clear an actor's action list
 * @param actor
 * @returns {Promise<void>}
 */
async function clearActionList(actor) {
    if (actor !== null) {
        const actions = actor.itemTypes.action;
        for (let i = 0; i < actions.length; i++) {
            await actor.deleteEmbeddedDocuments('Item', [actions[i].id]);
        }
    }
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */

/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createOD6SMacro(data, slot) {

    if (data.type !== "Item" || data.type !== 'availableaction') return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.'))return ui.notifications.warn(game.i18n.localize('OD6S.WARN_NOT_OWNED'));
    const item = await Item.fromDropData(data);

    // Filter out certain item types
    if (item.type === '' ||
        item.type === 'charactertemplate' ||
        item.type === 'action' ||
        item.type === 'disadvantage' ||
        item.type === 'advantage' ||
        item.type === 'armor' ||
        item.type === 'gear' ||
        item.type === 'cybernetic' ||
        item.type === 'vehicle' ||
        item.type === 'base') {
        return ui.notifications.warn(game.i18n.localize('OD6S.WARN_INVALID_MACRO_ITEM'));
    }

    // Create the macro command
    const command = `game.od6s.rollItemMacro("${item._id}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: {"od6s.itemMacro": true}
        });
    }
    await game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemId
 * @return {Promise}
 */
export function rollItemMacro(itemId) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = canvas.tokens?.placeables.find(t => t.id === speaker.token)?.actor;
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.id === itemId) : null;
    if (!item) return ui.notifications.warn(game.i18n.localize('OD6S.WARN_NO_ITEM_ID') + " " + itemId);

    // Trigger the item roll
    return item.roll();
}

/**
 * Roll a Macro from an Item name.
 * @param {string} itemId
 * @return {Promise}
 */
export function rollItemNameMacro(name) {
    name = game.i18n.localize(name);
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = canvas.tokens?.placeables.find(t => t.id === speaker.token)?.actor;
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === name) : null;
    if (!item) return ui.notifications.warn(game.i18n.localize('OD6S.WARN_NO_ITEM_NAME') + " " + name);

    // Trigger the item roll
    return item.roll();
}

/**
 * Return either the customized or translated name of an attribute
 * @param attribute
 * @returns {string}
 */
export function getAttributeName(attribute) {
    attribute = attribute.toLowerCase();
    if (typeof (OD6S.attributes[attribute]) === "undefined") {
        const warnString = game.i18n.localize('OD6S.ERROR_ATTRIBUTE_KEY') + ": " + attribute;
        ui.notifications.warn(warnString);
    } else {
        return game.i18n.localize(OD6S.attributes[attribute].name);
    }
}

/**
 * Return either the customized or translated short name of an attribute
 * @param attribute
 * @returns {string}
 */
export function getAttributeShortName(attribute) {
    attribute = attribute.toLowerCase();
    return OD6S.attributes[attribute].shortName;
}

async function simpleRoll() {
    const html = await renderTemplate("systems/od6s/templates/simpleRoll.html",
        {"wilddie": true, "dice": 1, "pips": 0});
    new Dialog({
        title: game.i18n.localize('OD6S.ROLL'),
        content: html,
        buttons: {
            roll: {
                label: game.i18n.localize('OD6S.ROLL'),
                callback: async (dlg) => {
                    let wild = false;
                    let rollString = "";
                    let rollMode = 0;
                    let dice = $(dlg[0]).find("#dice")[0].value;
                    let pips = $(dlg[0]).find("#pips")[0].value;
                    let damageRoll = $(dlg[0]).find('#damageroll')[0].checked;
                    let damageType = $(dlg[0]).find('#damagetype')[0].value;
                    if (game.settings.get('od6s', 'use_wild_die')) {
                        wild = $(dlg[0]).find("#wilddie")[0].checked;
                    } else {
                        wild = false;
                    }
                    if (wild) {
                        dice -= 1;
                        if (dice < 0) {
                            ui.notifications.warn('OD6S.NOT_ENOUGH_DICE');
                            return;
                        }
                        if (dice > 0) rollString = dice + 'd6' + game.i18n.localize('OD6S.BASE_DIE_FLAVOR');
                        rollString += '+1dw' + game.i18n.localize('OD6S.WILD_DIE_FLAVOR');
                    } else {
                        rollString = dice + 'd6' + game.i18n.localize('OD6S.BASE_DIE_FLAVOR');
                    }
                    if (pips > 0) rollString += '+' + pips;

                    let label = game.i18n.localize('OD6S.ROLLING');
                    if (damageRoll) {
                        label += " " + game.i18n.localize('OD6S.DAMAGE') + "(" +
                            game.i18n.localize(OD6S.damageTypes[damageType]) + ")";
                    }
                    let roll = await new Roll(rollString).evaluate();

                    let flags = {
                        "type": "simple",
                        "wild": false,
                        "wildHandled": false,
                        "wildResult": OD6S.wildDieResult[OD6S.wildDieOneDefault],
                    };
                    if (damageRoll) {
                        flags = {
                            "type": "damage",
                            "source": game.i18n.localize('OD6S.DAMAGE'),
                            "damageType": damageType,
                            "isOpposable": true,
                            "wild": false,
                            "wildHandled": false,
                            "wildResult": OD6S.wildDieResult[OD6S.wildDieOneDefault],
                        }
                    }

                    if (game.settings.get('od6s', 'use_wild_die')) {
                        const WildDie = roll.terms.find(d => game.i18n.localize("OD6S.WILD_DIE_FLAVOR").includes(d.flavor))
                        if (WildDie.total === 1) {
                            flags.wild = true;
                            if (OD6S.wildDieOneDefault > 0 && OD6S.wildDieOneAuto === 0) {
                                flags.wildHandled = true;
                            }
                        } else {
                            flags.wild = false;
                        }
                    }

                    if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
                    let rollMessage = await roll.toMessage({
                        speaker: ChatMessage.getSpeaker(),
                        flavor: label,
                        flags: {
                            od6s: flags
                        },
                        rollMode: rollMode, create: true
                    });

                    if (flags.wild === true && OD6S.wildDieOneDefault === 2 && OD6S.wildDieOneAuto === 0) {
                        let replacementRoll = JSON.parse(JSON.stringify(rollMessage.rolls[0].toJSON()));
                        let highest = 0;
                        for (let i = 0; i < replacementRoll.terms[0].results.length; i++) {
                            replacementRoll.terms[0].results[i].result >
                            replacementRoll.terms[0].results[highest].result ?
                                highest = i : {}
                        }
                        replacementRoll.terms[0].results[highest].discarded = true;
                        replacementRoll.terms[0].results[highest].active = false;
                        replacementRoll.total -= (+replacementRoll.terms[0].results[highest].result);
                        const rollMessageUpdate = {};
                        rollMessageUpdate.system = {};
                        rollMessageUpdate.content = replacementRoll.total;
                        rollMessageUpdate.id = rollMessage.id;
                        rollMessageUpdate.rolls = [];
                        rollMessageUpdate.rolls[0] = replacementRoll;

                        if (game.user.isGM) {
                            if (rollMessage.getFlag('od6s', 'difficulty') && rollMessage.getFlag('od6s', 'success')) {
                                replacementRoll.total < rollMessage.getFlag('od6s', 'difficulty') ? await rollMessage.setFlag('od6s', 'success', false) :
                                    await rollMessage.setFlag('od6s', 'success', true);
                            }
                            await rollMessage.setFlag('od6s', 'originalroll', rollMessage.rolls[0])
                            await rollMessage.update(rollMessageUpdate, {"diff": true});
                        } else {
                            game.socket.emit('system.od6s', {
                                operation: 'updateRollMessage',
                                message: rollMessage,
                                update: rollMessageUpdate
                            })
                        }
                    }
                }
            }
        },
        default: "roll"
    }).render(true);
}

export class WildDie extends Die {
    constructor(termData) {
        termData.faces = 6;
        termData.modifiers = ["x6"];
        super(termData);
    }

    static DENOMINATION = "w";
}

export class CharacterPointDie extends Die {
    constructor(termData) {
        termData.faces = 6;
        termData.modifiers = ["x6"];
        super(termData);
    }
    static DENOMINATION = "b";
}

Hooks.once("socketlib.ready", () => {
    OD6S.socket = socketlib.registerSystem("od6s");
    OD6S.socket.register("checkCrewStatus", checkCrewStatus);
    OD6S.socket.register("sendVehicleData", sendVehicleData);
    OD6S.socket.register("modifyShields", modifyShields);
    OD6S.socket.register("unlinkCrew", unlinkCrew);
    OD6S.socket.register("addToVehicle", addToVehicle);
    OD6S.socket.register("updateVehicle", updateVehicle);
    OD6S.socket.register("triggerRoll", triggerRoll);
    OD6S.socket.register("triggerRollAction", triggerRollAction);
    OD6S.socket.register('updateExplosiveTemplate', updateExplosiveTemplate);
    OD6S.socket.register('deleteExplosiveTemplate', deleteExplosiveTemplate);
    OD6S.socket.register('getVehicleFlag', getVehicleFlag);
    OD6S.socket.register('setVehicleFlag', setVehicleFlag);
    OD6S.socket.register('unsetVehicleFlag', unsetVehicleFlag);
});

async function triggerRoll(type, actorId) {
    const actor = await od6sutilities.getActorFromUuid(actorId)
    if (type === 'mortally_wounded') {
        if (actor.hasPlayerOwner && actor.isOwner && !game.user.isGM) {
            actor.triggerMortallyWoundedCheck();
        } else if (!actor.hasPlayerOwner && game.user.isGM) {
            actor.triggerMortallyWoundedCheck();
        }
    }
}

async function triggerRollAction(type, actorId) {
    const actor = game.actors.get(actorId);
    return await actor.rollAction(type);
}

export async function updateExplosiveTemplate(data) {
    const template = canvas.templates.get(data.templateId);
    if (data.operation === "update") {
        return await template.document.update(data.update);
    } else if (data.operation === "setFlags") {
        for (const flag in data.flags) {
            await template.document.setFlag('od6s', data.flags[flag].flag, data.flags[flag].value);
        }
    }
}

export async function deleteExplosiveTemplate(data) {
    const template = canvas.templates.get(data.templateId);
    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [template.id]);
}

/**
 * Check is an actor is crewing a vehicle
 * @param actorId
 * @returns {boolean|*}
 */
async function checkCrewStatus(actorId) {
    const actor = await od6sutilities.getActorFromUuid(actorId);
    return actor.isCrewMember();
}

/**
 * Update actor's vehicle data
 * @param data
 */
async function sendVehicleData(data) {
    for (const e of data.crewmembers) {
        let actor = await od6sutilities.getActorFromUuid(e.uuid);
        const update = {};
        update.system = {};
        update.id = actor.id;
        update.system.vehicle = data;
        await actor.update(update);
    }
}

/**
 * Update vehicle's shields from actor
 * @param update
 * @returns {Promise<void>}
 */
async function modifyShields(update) {
    const actor = await od6sutilities.getActorFromUuid(update.uuid);
    await actor.update(update);
}

/**
 * Remove crewmwmber
 * @param vehicleId
 * @param crewId
 * @returns {Promise<void>}
 */
async function unlinkCrew(vehicleId, crewId) {
    const actor = await od6sutilities.getActorFromUuid(crew);
    await actor.sheet.unlinkCrew(vehicle);
}

/**
 * Add crewmember
 * @param vehicleId
 * @param crewId
 * @returns {Promise<void>}
 */
async function addToVehicle(vehicleId, crewId) {
    const actor = await od6sutilities.getActorFromUuid(crewId);
    return await actor.addToCrew(vehicleId);
}

/**
 * Update a vehicle
 * @param vehicleID
 * @param update
 * @returns {Promise<*>}
 */
async function updateVehicle(vehicleID, update) {
    const actor = await od6sutilities.getActorFromUuid(vehicleID);
    return await actor.update(update);
}


async function getVehicleFlag(vehicleID, flag) {
    const actor = await od6sutilities.getActorFromUuid(vehicleID);
    return await actor.getFlag('od6s', flag);
}

async function setVehicleFlag(vehicleID, flag) {
    const actor = await od6sutilities.getActorFromUuid(vehicleID);
    return await actor.setFlag('od6s', flag);
}

async function unsetVehicleFlag(vehicleID, flag) {
    const actor = await od6sutilities.getActorFromUuid(vehicleID);
    return await actor.unsetFlag('od6s', flag);
}

export async function getActorFromUuid(uuid) {
    return od6sutilities.getActorFromUuid(uuid);
}

export async function promptResistanceRolls(msg) {
    if(game.user.isGM) return;
    if (msg.getFlag('od6s','type') === 'damage' && OD6S.autoPromptPlayerResistance) {
        const target = game.scenes.active.tokens.get(msg.getFlag('od6s', 'targetId'));

        if (msg.getFlag('od6s', 'wild') && !msg.getFlag('od6s', 'wildHandled')) return;

        if (typeof (target) !== 'undefined' && target) {
            if (target.actor.type === 'starship' || target.actor.type === 'vehicle') {
                if(!target.actor.isOwner) return;
                const crew = await od6sutilities.getActorFromUuid(target.actor.system.crewmembers[0].uuid);
                if (typeof (crew) !== 'undefined' || crew !== null) {
                    if (crew?.hasPlayerOwner && crew?.isOwner) {
                        return crew.rollAction('vehicletoughness', msg);
                    }
                }
            }


            if (!game.user.isGM && target.actor.hasPlayerOwner && target.isOwner) {
                const resistType = msg.getFlag('od6s', 'damageType') + 'r';
                return target.actor.rollAction(resistType, msg);
            }
        }
    }
}
