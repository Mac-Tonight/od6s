import OD6S from "../config/config-od6s.js";
//import * as math from 'mathjs';

export class od6sutilities {

    static accessDeepProp(obj, path) {
        if (!path) return obj;
        const properties = path.split(".");
        return this.accessDeepProp(obj[properties.shift()], properties.join("."));
    }

    /**
     * Function that looks up a weapon item's range and determines if it needs to be calculated based off of an attribute
     * @param item
     */
    /*static checkWeaponRange(actor, item) {

     * Return range values for ranged weapons
     * @param actor
     * @param item
     * @returns {{}|boolean}
     */
    static async getWeaponRange(actor, item) {
        const regex = /[A-Za-z]/;
        const foundRange = {};
        foundRange.short = '';
        foundRange.medium = '';
        foundRange.long = '';

        const range = {};
        range.short = item.system.range.short;
        range.medium = item.system.range.medium;
        range.long = item.system.range.long;

        let baseDice = 0;

        if (regex.test(item.system.range.short) ||
            regex.test(item.system.range.medium) ||
            regex.test(item.system.range.long)) {
            // There is a non-numeric value, extract it and find the attribute
            for (const range in item.system.range) {
                for (const attr in OD6S.attributes) {
                    if (item.system.range[range].toLowerCase().includes(attr)) {
                        foundRange[range] = attr;
                        break;
                    }
                }
                if (foundRange[range] === '') {
                    // String is present, but attribute not found.  Flee!
                    ui.notifications.warn(game.i18n.localize('OD6S.WARN_INVALID_RANGE_ATTRIBUTE'));
                    return false;
                }
            }
        } else {
            // No strings in range values
            return range;
        }
        if ((new Set([foundRange.short, foundRange.medium, foundRange.long])).size === 1) {
            baseDice = Math.floor(actor.system.attributes[foundRange.short].score / OD6S.pipsPerDice) * OD6S.pipsPerDice;
            if (!game.settings.get('od6s', 'strength_damage')) {
                // CHeck for a lift skill
                const lift = actor.items.find(skill => skill.name === game.i18n.localize("OD6S.LIFT"));
                if (lift != null && typeof (lift) !== 'undefined') {

                    baseDice = od6sutilities.getScoreFromSkill(actor, '', lift, 'str');
                }
            }
        } else {
            // Range attribute does not match, flee.
            ui.notifications.warn(game.i18n.localize('OD6S.WARN_INVALID_RANGE_ATTRIBUTE'));
            return false;
        }

        const newRanges = {};
        const dice = this.getDiceFromScore(baseDice);

        if (game.settings.get('od6s', 'static_str_range')) {
            for (let r in range) {
                const e = range[r].match(/([+|\-][0-9])$/);
                if (e) {
                    newRanges[r] = (dice.dice * 4) + dice.pips + (+e[0]);
                } else {
                    newRanges[r] = (dice.dice * 4) + dice.pips;
                }
            }
        } else {
            //Generate a die roll
            let rollString = dice.dice + "d6";
            if (dice.pips > 0) rollString = rollString + "+" + dice.pips;
            const roll = await new Roll(rollString).evaluate();

            for (let r in range) {
                const e = range[r].match(/([+|\-][0-9])$/);
                if (e) {
                    newRanges[r] = roll.total + (+e[0]);
                } else {
                    newRanges[r] = roll.total;
                }
            }

            const flags = {}
            flags.type = "range";
            flags.range = newRanges;
            flags.origRange = range;
            let label = game.i18n.localize('OD6S.RANGE_ROLL') + ": " + item.name;
            let rollMode = 'roll';
            if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker(),
                flavor: label,
                flags: {
                    od6s: flags
                },
                rollMode: rollMode,
                create: true
            })
        }
        return newRanges;
    }

    static lookupAttributeKey(id) {
        const attr = id.toLowerCase();
        const key = Object.keys(OD6S.attributes).find(k=>OD6S.attributes[k].shortName.toLowerCase() === attr);

        if (typeof(key) !== "undefined" && key !== null) {
            return key
        } else {
            ui.notifications.warn(game.i18n.localize('OD6S.ATTRIBUTE_NOT_FOUND'));
            return false;
        }
    }

    static async scatterExplosive(range, origin, templateId) {
        let distance = 0;
        let distanceTerms = '';
        let scatter = 0;
        let angle = 0;

        const template = canvas.templates.get(templateId);
        const target = {x: template.x, y: template.y};
        const sourceRay = new Ray(origin, target);

        const flags = [];
        flags[0] = {
            flag: "originalX",
            value: template.document.x
        }
        flags[1] = {
            flag: "originalY",
            value: template.document.y
        }

        await OD6S.socket.executeAsGM('updateExplosiveTemplate', {operation: 'setFlags', templateId: templateId, flags: flags});

        const scatterRoll = await new Roll('1d6').evaluate();
        scatter = scatterRoll.total;

        switch(range) {
            case 'OD6S.RANGE_POINT_BLANK_SHORT':
                distanceTerms = '1d6';
                break;
            case 'OD6S.RANGE_SHORT_SHORT':
                distanceTerms = '1d6';
                break;
            case 'OD6S.RANGE_MEDIUM_SHORT':
                distanceTerms = '2d6';
                break;
            case 'OD6S.RANGE_LONG_SHORT':
                distanceTerms = '3d6';
                break;
            default:
                break;
        }

        const distanceRoll = await new Roll(distanceTerms).evaluate();
        //distance = (distanceRoll.total * game.scenes.active.SceneDimensions.size)/game.scenes.active.SceneDimensions.distance;
        distance = distanceRoll.total * (canvas.dimensions.distancePixels);

        switch(scatter) {
            case 1:
                angle = 180 * (Math.PI/180);
                break;
            case 2:
                angle = -90 * (Math.PI/180);
                break;
            case 3:
                angle = -45 * (Math.PI/180);
                break;
            case 4:
                angle = 0;
                break;
            case 5:
                angle = 45 * (Math.PI/180);
                break;
            case 6:
                angle = 90 * (Math.PI/180);
                break
            default:
                break;
        }

        let newAngle = sourceRay.angle + angle;

        const destRay = Ray.fromAngle(template.x, template.y, newAngle, distance);

        // Check if it would collide with a wall and stop it there
        const checkCollision = CONFIG.Canvas.polygonBackends.move.testCollision(
            destRay.A, destRay.B,
            {type: "move", mode: "closest"});

        let update = {};
        if(checkCollision !== null) {
            // Get the distance to the collision point, reduce by 5 pixes to ensure it stays on the origin side of the wall
            const distanceToCollision = (canvas.grid.measureDistance(destRay.A, checkCollision)
                * canvas.dimensions.distancePixels) - 5;
            const collisionRay = Ray.fromAngle(template.x, template.y, newAngle, distanceToCollision);
            update = {
                x: collisionRay.B.x,
                y: collisionRay.B.y
            }
        } else {
            update = {
                x: Math.floor(destRay.B.x),
                y: Math.floor(destRay.B.y)
            }
        }
        //await template.document.update(update);
        const data = {};
        data.operation = 'update';
        data.templateId = templateId;
        data.update = update;
        await OD6S.socket.executeAsGM('updateExplosiveTemplate', data);
        await od6sutilities.wait(100);
    }

    static async getExplosiveTargets(actor, itemId) {
        const item = actor.isToken ? actor.token.actor.items.get(itemId) : actor.items.get(itemId);
        const template = canvas.templates.get(item.getFlag('od6s','explosiveTemplate'));
        const tokens = canvas.tokens.placeables.filter(
            t => template._getGridHighlightPositions().find(o => o.x === t.x && o.y === t.y)
        )

        // Filter out tokens that have a wall between them and the origin
        const hitTokens = tokens.filter(
            t => (!CONFIG.Canvas.polygonBackends.move.testCollision(template.center, t.center, {type: "move", mode: "any"}) ||
                !CONFIG.Canvas.polygonBackends.move.testCollision(template.center, t.center, {type: "sight", mode: "any"}))
        );

        // Calculate range to each
        const targets = [];
        for (let target of hitTokens) {
            const thisTarget = {};
            thisTarget.id = target.id;
            thisTarget.range = canvas.grid.measureDistance(template.center, target.center);
            thisTarget.zone = this.getBlastRadius(item, thisTarget.range);
            thisTarget.name = target.name;
            targets.push(thisTarget);
        }

        return targets;
    }

    static async detonateExplosives(combat) {
        // Find all active templates on the scene and detonate
        const templates = combat.scene.templates.filter(i => i.flags.od6s.explosive === true);
        for (const i in templates) {
            const template = templates[i];
            await template.update({hidden: false});
            let actor;
            if (typeof(template.getFlag('od6s','token')) === 'undefined' || template.getFlag('od6s','token') === '') {
                actor = await od6sutilities.getActorFromUuid(template.getFlag('od6s', 'actor'))
            } else {
                actor = game.scenes.active.tokens.get(template.getFlag('od6s', 'token')).actor;
            }

            const data = {};
            data.flags = {};
            data.flags.od6s = {
                actorId: template.getFlag('od6s','actor'),
                tokenId: template.getFlag('od6s', 'token'),
                itemId: template.getFlag('od6s','item'),
                templateId: template.id,
                targets: await this.getExplosiveTargets(actor, template.getFlag('od6s','item')),
                triggered: true
            }

            // Regenerate the original message
            if(template.getFlag('od6s','message')) {
                const origMessage = game.messages.get(template.getFlag('od6s','message'));
                if(typeof(origMessage) !== 'undefined') {
                    let cloneMessage = origMessage.clone(data);
                    await origMessage.unsetFlag('od6s', 'isExplosive');
                    let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;
                    if(origMessage.whisper.length > 0) {
                        rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
                    } else if (origMessage.blind) {
                        rollMode = CONST.DICE_ROLL_MODES.BLIND;
                    } else {
                    }
                    await ChatMessage.deleteDocuments([origMessage.id]);
                    cloneMessage.flags.od6s.canUseCp = false;
                    const newMessage = cloneMessage.rolls[0].toMessage(cloneMessage, {rollMode: rollMode});
                }
            }
        }
    }

    static async detonateExplosive(data) {
        const message = game.messages.get(data.messageId);
        let actor;
        if (typeof(data.tokenId) === 'undefined' || data.tokenId === '') {
            actor = await od6sutilities.getActorFromUuid(data.actorId);
        } else {
            const token = game.scenes.active.tokens.get(data.tokenId);
            actor = token.actor;
        }

        let targets;
        if (message) {
            targets = await game.messages.get(data.messageId).getFlag('od6s', 'targets');
        } else {
            targets = await this.getExplosiveTargets(actor, data.itemId);
        }

        const item = actor.items.get(data.itemId);

        if (game.settings.get('od6s', 'auto_explosive')) {
            const template = await canvas.scene.getEmbeddedDocument('MeasuredTemplate', item.getFlag('od6s', 'explosiveTemplate'));

            if (typeof (template) !== 'undefined') {
                if(template.isOwner) {
                    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [template.id]);
                } else {
                    await OD6S.socket.executeAsGM('deleteExplosiveTemplate', {templateId: template.id});
                }
            }
        }



        // Create damage chat message
        const msgData = {};

        msgData.flags = {};
        msgData.flags.od6s = {};
        msgData.flags.od6s.targets = [];
        msgData.flags.od6s.item = item.id;
        msgData.flags.od6s.isOpposable = true;
	    msgData.flags.od6s.damageType = item.system.damage.type;
        msgData.flags.od6s.stun = data.stun;
        msgData.flags.od6s.attackMessage = data.messageId;

        msgData.flags.od6s.type = "explosive";

        if (this.boolCheck(data.stun)) {
            msgData.flavor = game.i18n.localize("OD6S.EXPLOSIVE_STUN_DAMAGE");
        } else {
            msgData.flavor = game.i18n.localize("OD6S.EXPLOSIVE_DAMAGE");
        }
        msgData.speaker = {};
        msgData.speaker.alias = actor.name;
        msgData.speaker.actor = actor.id;
        msgData.speaker.token = actor.isToken ? actor.token.id : '';
        msgData.speaker.scene = game.scenes.active.id;

        let rollMode = 'roll';
        let rollString = "";
        if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

        if(game.settings.get('od6s','explosive_zones')) {
            // Separate rolls for each zone; damage score represents whole dice
            const zoneDamage = [];
            for (const i in item.system.blast_radius) {
                const zone = item.system.blast_radius[i];
                const zoneTargets = targets.filter(target => target.zone === (+i));
                if (zoneTargets.length < 1) continue;
                if (zone.damage < 1) {
                    ui.notifications.warn(game.i18n.localize("OD6S.WARN_NO_DICE_FOR_ZONE"));
                    return false;
                }
                let dice = zone.damage;
                if (game.settings.get('od6s', 'use_wild_die')) {
                    dice = dice - 1;
                    if (dice < 1) {
                        rollString = "1dw" + game.i18n.localize("OD6S.WILD_DIE_FLAVOR") + " ["
                            + game.i18n.localize('OD6S.ZONE') + "]" ;
                    } else {
                        rollString = dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR') + "+1dw" +
                            game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
                    }
                } else {
                    rollString = dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR');
                }
                const roll  = await new Roll(rollString).evaluate();
                for (const target in zoneTargets) {
                    const targetId = zoneTargets[target].id;
                    if (typeof (actor) === 'undefined') actor = game.scenes.active.tokens.get(targetId).actor;
                    if (typeof (actor) === 'undefined') continue;
                    let damage = 0;
                    if(!message) {
                        // TODO: Figure out a better way to deal with this
                        damage = roll.total;
                    } else if (actor.dodge > message.getFlag('od6s', 'total')) {
                        damage = 0;
                    } else {
                        damage = roll.total;
                    }
                    if (game.settings.get('od6s', 'auto_explosive')) {
                    } else {
                        msgData.flags.od6s.apply = true;
                    }
                    msgData.flags.od6s.targets[target] = zoneTargets[target];
                    msgData.flags.od6s.targets[target].damage = damage;
                }
                if (this.boolCheck(data.stun)) {
                    msgData.flavor = game.i18n.localize('OD6S.ZONE') + " " + i + " "
                        + game.i18n.localize("OD6S.EXPLOSIVE_STUN_DAMAGE");
                } else {
                    msgData.flavor = game.i18n.localize('OD6S.ZONE') + " " + i + " "
                        + game.i18n.localize("OD6S.EXPLOSIVE_DAMAGE");
                }
                await roll.toMessage(msgData);
                msgData.flags.od6s.targets = [];
            }
        } else {
            msgData.flags.od6s.targets = targets;
            // One roll, with a fraction for zones > 1
            let dice = (this.boolCheck(data.stun)) ? od6sutilities.getDiceFromScore(item.system.stun.score)
                : od6sutilities.getDiceFromScore(item.system.damage.score);
            if (this.boolCheck(data.stun)) {
                if (item.system.stun.score === 0 || item.system.stun.score === '') {
                    ui.notifications.warn(game.i18n.localize('OD6S.WARN_EXPLOSIVE_CONFIGURED_FOR_ZONES'));
                    return;
                }
            } else {
                if (item.system.damage.score === 0 || item.system.damage.score === '') {
                    ui.notifications.warn(game.i18n.localize('OD6S.WARN_EXPLOSIVE_CONFIGURED_FOR_ZONES'));
                    return;
                }
            }
            if (game.settings.get('od6s', 'use_wild_die')) {
                dice.dice = (+dice.dice) - 1;
                if (dice.dice < 1) {
                    rollString = "1dw" + game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
                } else {
                    rollString = dice.dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR') + "+1dw" +
                        game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
                }
            } else {
                rollString = dice.dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR');
            }
            let roll = await new Roll(rollString).evaluate();
            // Iterate over targets
            for (const i in targets) {
                const target = targets[i];
                let damage = roll.total;
                let actor = await game.actors.get(target.id);
                if (typeof (actor) === 'undefined') actor = game.scenes.active.tokens.get(target.id).actor;
                if(typeof(actor) === 'undefined') continue;
                if(actor.dodge > message.getFlag('od6s','total')) {
                    damage = 0;
                } else {
                    switch(target.zone) {
                        case 1:
                            // full damage
                            break;
                        case 2:
                            damage = Math.floor(damage * 0.5);
                            break;
                        case 3:
                            damage = Math.floor(damage *0.25);
                            break;
                        default:
                            damage = 0;
                    }

                    msgData.flags.od6s.targets[i].damage = damage;

                    if (game.settings.get('od6s', 'auto_explosive')) {
                    } else {
                        msgData.flags.od6s.apply = true;
                    }
                }
            }
            const damageMessage = await roll.toMessage(msgData,);
        }
    }

    /**
     *
     * @param item
     * @param range (in meters)
     * @returns zone
     */
    static getBlastRadius(item, range) {
        let zone = 1;
        let maxZone = game.settings.get('od6s', 'explosive_zones') ? 4 : 3;

        for (let i=1; i < maxZone + 1; i++) {
            if (range > item.system.blast_radius[i].range) {
                zone++;
            } else {
                break;
            }
        }

        return zone;
    }

    /**
     * Function which returns a number of dice and pips from a raw score.
     * e.g. a score of 14 translates to "4D+2", a score of 15 is "5D+0".
     * @param score
     * @returns {{dice: number, pips: number}}
     */
    static getDiceFromScore(score) {
        const dice = Math.floor(score / OD6S.pipsPerDice);
        const pips = score % OD6S.pipsPerDice;
        return {
            dice,
            pips
        }
    }

    static getTextFromDice(dice) {
        return `${dice.dice}D+${dice.pips}`;
    }

    /**
     * Get a score from a number of dice and pips.
     * @param dice
     * @param pips
     * @returns {number}
     */
    static getScoreFromDice(dice, pips) {
        return (+dice * OD6S.pipsPerDice) + (+pips);
    }

    static async getDifficultyFromLevel(level) {
        let difficulty = 0;

        if (OD6S.randomDifficulty) {
            if (OD6S.difficulty[level].max === 0) {
                difficulty = 0;
            } else {
                if (game.settings.get('od6s', 'random_dice_difficulty')) {
                    const dice = OD6S.difficulty[level].dice;
                    const terms = dice + "D6";
                    const roll = await new Roll(terms).evaluate();
                    difficulty = roll.total;
                } else {
                    let min = 0;
                    let max = OD6S.difficulty[level].max;
                    switch (level) {
                        case "OD6S.DIFFICULTY_VERY_EASY":
                            min = 1;
                            break;

                        case  "OD6S.DIFFICULTY_EASY":
                            min = OD6S.difficulty['OD6S.DIFFICULTY_VERY_EASY'].max + 1;
                            break;

                        case "OD6S.DIFFICULTY_MODERATE":
                            min = OD6S.difficulty['OD6S.DIFFICULTY_EASY'].max + 1;
                            break;

                        case "OD6S.DIFFICULTY_DIFFICULT":
                            min = OD6S.difficulty['OD6S.DIFFICULTY_MODERATE'].max + 1;
                            break;

                        case "OD6S.DIFFICULTY_VERY_DIFFICULT":
                            min = OD6S.difficulty['OD6S.DIFFICULTY_DIFFICULT'].max + 1;
                            break;

                        case "OD6S.DIFFICULTY_HEROIC":
                            min = OD6S.difficulty['OD6S.DIFFICULTY_VERY_DIFFICULT'].max + 1;
                            break;

                        case "OD6S.DIFFICULTY_LEGENDARY":
                            min = OD6S.difficulty['OD6S.DIFFICULTY_VERY_DIFFICULT'].max + 1;
                            break;

                        case 'default':
                            // Shouldn't be here
                            min = 1;
                    }
                    difficulty = Math.floor(twist.random() * (max - min + 1) + min);
                }
            }
        } else {
            difficulty = OD6S.difficulty[level].max;
        }

        return difficulty;
    }

    /**
     * Get the action penalty from the actor's wound level vs. the system wound levels
     * @param actor
     * @returns {number}
     */
    static getWoundPenalty(actor) {
        if (OD6S.woundConfig === 1) {
            if (actor.type === 'character') {
                return OD6S.deadliness[3][actor.system.wounds.value].penalty;
            } else if (actor.type === 'npc') {
                return OD6S.deadliness[3][actor.system.wounds.value].penalty;
            } else if (actor.type === 'creature') {
                return OD6S.deadliness[3][actor.system.wounds.value].penalty;
            } else if (actor.type === 'vehicle') {
                return 0;
            } else if (actor.type === 'starship') {
                return 0;
            }
        } else {
            if (actor.type === 'character') {
                return OD6S.deadliness[game.settings.get('od6s', 'deadliness')][actor.system.wounds.value].penalty;
            } else if (actor.type === 'npc') {
                return OD6S.deadliness[game.settings.get('od6s', 'npc-deadliness')][actor.system.wounds.value].penalty;
            } else if (actor.type === 'creature') {
                return OD6S.deadliness[game.settings.get('od6s', 'creature-deadliness')][actor.system.wounds.value].penalty;
            } else if (actor.type === 'vehicle') {
                return 0;
            } else if (actor.type === 'starship') {
                return 0;
            }
        }
    }

    static getWoundLevel(value, actor) {
        if (OD6S.woundConfig === 1) {
            if (actor.type === 'character') {
                return OD6S.deadliness[3][value].core;
            } else if (actor.type === 'npc') {
                return OD6S.deadliness[3][value].core;
            } else if (actor.type === 'creature') {
                return OD6S.deadliness[3][value].core;
            }
        } else {
            if (actor.type === 'character') {
                return OD6S.deadliness[game.settings.get('od6s', 'deadliness')][value].core;
            } else if (actor.type === 'npc') {
                return OD6S.deadliness[game.settings.get('od6s', 'npc-deadliness')][value].core;
            } else if (actor.type === 'creature') {
                return OD6S.deadliness[game.settings.get('od6s', 'creature-deadliness')][value].core;
            }
        }
    }

    static getDifficultyLevelSelect() {
        const levels = {};
        for (const i in OD6S.difficulty) {
            if (OD6S.difficulty[i].min > 0) {
                const level = {};
                level[i] = game.i18n.localize(i);
                Object.assign(levels, level);
            }
        }
        return levels;
    }

    static getActiveAttributes() {
        const attr = [];
        for (let attribute in OD6S.attributes) {
            if (OD6S.attributes[attribute].active) {
                attr.push(attribute);
            }
        }
        return attr;
    }

    static getActiveAttributesSelect() {
        const list = this.getActiveAttributes();
        const names = {};
        for (let a = 0; a < list.length; a++) {
            const key = list[a];
            if (typeof (OD6S.attributes[key].name) !== 'undefined') {
                names[key] = OD6S.attributes[key].name;
            }
        }
        return names;
    }

    static async getSkillsFromTemplate(items) {
        let foundSkills = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type === 'skill') {
                foundSkills.push(await this.getItemByName(items[i].name));
            }
        }
        return foundSkills;
    }

    /**
     * Search for and get an item from compendia by id
     * @param itemName
     * @returns {Promise<Entity|null>}
     * @private
     */
    static
    async _getItemFromCompendiumId(id) {
        let itemList = '';
        let packs = '';
        game.packs.keys();
        if (game.settings.get('od6s', 'hide_compendia')) {
            packs = await game.packs.filter(p => p.metadata.packageName !== 'od6s')
        } else {
            packs = await game.packs;
        }
        for (let p of packs) {
            await p.getIndex().then(index => itemList = index);
            let searchResult = itemList.find(t => t._id === id);
            if (searchResult) {
                return await p.getDocument(searchResult._id);
            }
        }
        return null;
    }

    /**
     * Search for and get an item from compendia by name
     * @param itemName
     * @returns {Promise<Entity|null>}
     * @private
     */
    static
    async _getItemFromCompendium(itemName) {
        let itemList = '';
        let packs = '';
        game.packs.keys();
        if (game.settings.get('od6s', 'hide_compendia')) {
            packs = await game.packs.filter(p => p.metadata.packageName !== 'od6s')
        } else {
            packs = await game.packs;
        }
        for (let p of packs) {
            await p.getIndex().then(index => itemList = index);
            let searchResult = itemList.find(t => t.name === itemName);
            if (searchResult) {
                return await p.getDocument(searchResult._id);
            }
        }
        return null;
    }

    /**
     * Get an item from the world
     * @param itemName
     * @returns {Promise<*>}
     * @private
     */
    static
    async _getItemFromWorld(itemName) {
        return game.items.contents.find(t => t.name === itemName);
    }

    /**
     * Get an item, preferring world over compendia
     * @param itemName
     * @returns {Promise<*>}
     * @private
     */

    static async getItemByName(itemName) {
        let item = await this._getItemFromWorld(itemName);
        if (typeof (item) !== "undefined" && item !== null) return item;
        item = await this._getItemFromCompendium(itemName);
        if (typeof (item) !== "undefined" && item !== null) return item;
    }

    /**
     * Get all items of a certain type from compendia
     * @param itemType
     * @returns {Promise<[]>}
     */
    static getItemsFromCompendiumByType(itemType) {
        let searchResult = [];
        let packs = '';
        game.packs.keys();
        if (game.settings.get('od6s', 'hide_compendia')) {
            packs = game.packs.filter(p => p.metadata.packageName !== 'od6s' && p.documentName === 'Item')
        } else {
            packs = game.packs.filter(p => p.documentName === 'Item');
        }

        for (let p of packs) {
            const items = p.index.filter(i => i.type === itemType);
            searchResult = searchResult.concat(items);
        }

        searchResult.sort((a, b) => a.name.localeCompare(b.name));
        return searchResult;
    }

    /**
     * Get all items of a certain type from the world
     * @param itemType
     * @returns {Promise<[]>}
     */
    static getItemsFromWorldByType(itemType) {
        let searchResult = [];
        for (let i = 0; i < game.items.contents.length; i++) {
            if (game.items.contents[i].type === itemType) {
                let item = {
                    _id: game.items.contents[i]._id,
                    name: game.items.contents[i].name,
                    type: game.items.contents[i].type,
                    description: game.items.contents[i].system.description
                }
                searchResult.push(item);
            }
        }
        return searchResult;
    }

    /**
     * Get all items from both compendium and world by type, preferring world to compendia
     * @param itemType
     * @returns {*}
     */
    static getAllItemsByType(itemType) {
        let cItems = this.getItemsFromCompendiumByType(itemType);
        let wItems = this.getItemsFromWorldByType(itemType);
        let allItems = cItems.map((x) => x);
        // Prefer world items over compendium items
        this.mergeByProperty(allItems, wItems, 'name');
        allItems.sort((a, b) => a.name.localeCompare(b.name));
        return allItems;
    }

    /**
     * Merge two arrays by element property
     * @param target
     * @param source
     * @param prop
     */
    static
    mergeByProperty = (target, source, prop) => {
        source.forEach(sourceElement => {
            let targetElement = target.find(targetElement => {
                return sourceElement[prop] === targetElement[prop];
            })
            targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
        })
    }

    /**
     * Get an actor document from a UUID
     * @param uuid
     * @returns {Promise<void>}
     */
    static async getActorFromUuid(uuid) {
        const document = await fromUuid(uuid);
        let actor;

        if (document === null || !(document?.documentName === 'Actor' || document?.documentName === 'Token')) {
            // Try getting an actor with id instead of uuid
            actor = game.actors.get(uuid);
            if (typeof (actor) !== 'undefined' && actor !== null) {
                return actor;
            } else {
                // Try getting a token
                actor = game.scenes.active.tokens.get(uuid)?.actor;
                if (typeof (actor) === 'undefined' || actor === null) {
                    return;
                }
            }
        } else if (document.actor?.isToken || document.documentName === 'Token') {
            actor = game.scenes.active.tokens.get(document.id).actor;
        } else {
            actor = game.actors.get(document.id);
        }

        return actor;
    }

    static async getTokenFromUuid(uuid) {
        const document = await fromUuid(uuid);
        if (document === null || document.documentName !== 'Actor') return;
        return game.scenes.viewed.tokens.get(document.token.id);
    }

    /**
     * Search for a spec, skill, or attribute and return the score
     * @param actor
     * @param spec
     * @param skill
     * @param attribute
     * @returns {*|number}
     */
    static getScoreFromSkill(actor, spec, skill, attribute) {
        let score = 0;
        let found = false;
        // Look for a spec, then a skill, then finally attribute
        if (typeof (spec) !== "undefined" && spec !== '') {
            const foundSpec = actor.items.find(s => s.name === spec && s.type === 'specialization');
            if (foundSpec) {
                score = foundSpec.system.score;
                found = true;
            }
        }
        if (!found && typeof (skill) !== "undefined" && skill !== '') {
            const foundSkill = actor.items.find(s => s.name === skill && s.type === 'skill');
            if (foundSkill) {
                score = foundSkill.system.score;
            }
        }
        score += actor.system.attributes[attribute.toLowerCase()].score;
        return score;
    }

    /**
     * Return the total sensor score based on skill
     * @param actor
     * @param score
     * @returns {*}
     */
    static getSensorTotal(actor, score) {
        let skillName = '';
        if (actor.getFlag('od6s', 'crew')) {
            if (typeof (actor.system.vehicle.sensors.skill) !== 'undefined'
                && actor.system.vehicle.sensors.skill !== '') {
                skillName = actor.system.vehicle.sensors.skill
            }
        }
        if (skillName === '') {
            skillName = game.i18n.localize(OD6S.default_sensor_skill);
        }
        return (+score) + od6sutilities.getScoreFromSkill(actor, '', skillName, 'mec');
    }

    static async autoOpposeRoll(msg) {
        if (msg.getFlag('od6s','opposedRollDone')) return;
        if (game.settings.get('od6s', 'use_wild_die')
            && msg.getFlag('od6s', 'wild') && !msg.getFlag('od6s', 'wildHandled')) return;
        const token = game.scenes.active.tokens.get(msg.getFlag('od6s', 'targetId'))
        if (typeof (token) !== 'undefined') {
            await msg.setFlag('od6s','opposedRollDone', true)
            await this.generateOpposedRoll(token, msg);
        }
        if (OD6S.opposed.length > 0) {
            if (msg.getFlag('od6s', 'type') === 'damage'||msg.getFlag('od6s', 'type') === 'explosive') {
                // Shouldn't be here, damage needs to come before resistance.
                OD6S.opposed = [];
                OD6S.opposed.push({
                    messageId: msg.id
                });
            } else if (msg.getFlag('od6s', 'type') === 'resistance') {
                OD6S.opposed.push({
                    messageId: msg.id
                });
                return await this.handleOpposedRoll();
            }
        } else {
            if (msg.getFlag('od6s', 'type') === 'damage'||msg.getFlag('od6s', 'type') === 'explosive') {
                OD6S.opposed.push({
                    messageId: msg.id
                });
            } else {
                OD6S.opposed = [];
            }
        }
    }

    static
    async handleOpposedRoll() {
        let type = '';
        let winner = '';
        let loser = '';
        let diff = 0;
        let result = '';
        let damageFlavor = '';
        let stunned = false;
        let data = {};
        data.flags = {};
        let collision = false;
        let passengerDamage = '';
        const message1 = await game.messages.get(OD6S.opposed[0].messageId);
        const message2 = await game.messages.get(OD6S.opposed[1].messageId);
        const messageType1 = message1.getFlag('od6s', 'type');
        const messageType2 = message2.getFlag('od6s', 'type');
        OD6S.opposed = [];

        if (((messageType1 === 'damage' || messageType1 === 'explosive') && message2.getFlag('od6s', 'type') === 'resistance') ||
            (messageType1) === 'resistance' && (messageType2 === 'damage' || messageType2 === 'explosive')) {
            type = "damageresult";
        } else {
            type = "opposedcheck";
        }

        collision = (message1.getFlag('od6s', 'isVehicleCollision') || message2.getFlag('od6s', 'isVehicleCollision'))
        collision = (collision === 'true');

        if (typeof (game.actors.get(message1.speaker.actor)) !== "undefined") {
            message1.actorType = game.actors.get(message1.speaker.actor).type;
        } else {
            message1.actorType = "system";
        }

        if (typeof (game.actors.get(message2.speaker.actor)) !== "undefined") {
            message1.actorType = game.actors.get(message2.speaker.actor).type;
        } else {
            message2.actorType = "system";
        }

        message1.flavorName = message1.alias;
        message2.flavorName = message2.alias;

        if (message1.getFlag('od6s', 'vehicle')) {
            message1.actorType = "vehicle";
            let vehicleActor = await od6sutilities.getActorFromUuid(message1.getFlag('od6s', 'vehicle'));
            message1.flavorName = vehicleActor.name;
        }
        if (message2.getFlag('od6s', 'vehicle')) {
            message2.actorType = "vehicle";
            let vehicleActor = await od6sutilities.getActorFromUuid(message2.getFlag('od6s', 'vehicle'));
            message2.flavorName = vehicleActor.name;
        }

        if(messageType1 === 'explosive' || messageType2 === 'explosive') {
            if (messageType1 === 'explosive') {
                const targetId = message2.speaker.token;
                const damage = message1.getFlag('od6s', 'targets').find(t => t.id === targetId).damage;
                const resistance = message2.rolls[0].total;
                if (damage > resistance) {
                    winner = message1;
                    loser = message2;
                } else {
                    winner = message2;
                    loser = message1;
                }
                diff = damage - resistance
            } else {
                const targetId =  message1.speaker.token !== null ? message1.speaker.token : message.speaker.actor;
                const damage = message2.getFlag('od6s', 'targets').find(t=>t.id === targetId).damage;
                const resistance = message1.rolls[0].total;
                if (damage > resistance) {
                    winner = message2;
                    loser = message1;
                } else {
                    winner = message1;
                    loser = message2;
                }
                diff = damage - resistance;
            }
        } else {
            if (message1.rolls[0].total > message2.rolls[0].total) {
                winner = message1;
                loser = message2;
            } else {
                winner = message2;
                loser = message1;
            }
            diff = (+winner.rolls[0].total) - (+loser.rolls[0].total);
        }

        const stun = await message1.getFlag('od6s', 'stun') || await message2.getFlag('od6s', 'stun');
        let stunEffect = 'unconscious';

        diff = (+winner.rolls[0].total) - (+loser.rolls[0].total);

        if (type === "damageresult") {

            if (loser.actorType === "vehicle" || loser.actorType === "starship") {
                damageFlavor = game.i18n.localize('OD6S.DAMAGES');
            } else {
                if (this.boolCheck(data.stun)) {
                    damageFlavor = game.i18n.localize('OD6S.STUNS');
                } else {
                    damageFlavor = game.i18n.localize("OD6S.INJURES");
                }
            }

            if (winner.getFlag('od6s', 'type') === "damage" || winner.getFlag('od6s', 'type') === 'explosive') {
                if (this.boolCheck(stun)) {
                    data.content = winner.alias + " " + damageFlavor + " " + loser.flavorName;
                    stunned = true;
                    if (OD6S.stunScaling) {
                        if (winner.rolls[0].total >= (3 * loser.rolls[0].total)) {
                            stunEffect = 'unconscious';
                        } else if (winner.rolls[0].total >= (2 * loser.rolls[0].total)) {
                            stunEffect = '-2D';
                        } else {
                            stunEffect = '-1D';
                        }
                    }

                    if (stunEffect === 'unconscious') {
                        if (OD6S.stunDice) {
                            const roll = await new Roll("2d6").evaluate();
                            result = loser.flavorName + game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_01') +
                                roll.total + game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_02');
                        } else {
                            result = loser.flavorName + game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_01') +
                                diff + game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_02');
                        }
                    } else {
                        if (stunEffect === '-2D') {
                            result = game.i18n.localize('OD6S.WOUNDS_STUNNED') + " " + stunEffect;
                        } else if (stunEffect === '-1D') {
                            result = game.i18n.localize('OD6S.WOUNDS_STUNNED') + " " + stunEffect;
                        }
                    }
                } else {
                    data.content = winner.alias + " " + damageFlavor + " " + loser.flavorName;
                    if (OD6S.woundConfig > 0 && loser.actorType !== 'vehicle' && loser.actorType !== 'starship') {
                        result = diff;
                    } else {
                        result = this.getInjury(diff, loser.actorType);
                    }
                }
            } else {
                data.content = winner.alias + " " + game.i18n.localize("OD6S.RESISTS") + " " + loser.alias;
                if (winner.actorType === "vehicle" || winner.actorType === "starship") {
                    result = 'OD6S.NO_DAMAGE';
                } else {
                    if (OD6S.woundConfig > 0 && loser.actorType !== 'vehicle' && loser.actorType !== 'starship') {
                        result = 0;
                    } else {
                        result = 'OD6S.NO_INJURY';
                    }
                }
            }
        } else {
            data.flavor = message1.alias + " " + game.i18n.localize("OD6S.VS") + " " + message2.alias;
            data.content = winner.alias + " " + game.i18n.localize("OD6S.WINS");
        }

        let loserId = loser.speaker.token;
        if (loser.actorType === "vehicle" || loser.actorType === "starship") {
            let token = await this.getTokenFromUuid(loser.getFlag('od6s','vehicle'));
            //let token = await this.getActorFromUuid(loser.getFlag('od6s', 'vehicle'));
            //let token = await game.scenes.active.tokens.get(loser.getFlag('od6s','vehicle'));
            if (typeof (token) !== 'undefined') {
                loserId = token.id;
            } else {
                loserId = await this.getActorFromUuid(loser.getFlag('od6s', 'vehicle'));
            }
            if (OD6S.passengerDamageDice) {
                passengerDamage = OD6S.vehicle_damage[result].passenger_damage_dice + "D";
            } else {
                passengerDamage = game.i18n.localize(OD6S.vehicle_damage[result].passenger_damage);
            }
        }

        let apply = false;
        if (OD6S.woundConfig > 0 && loser.actorType !== 'vehicle' && loser.actorType !== 'starship') {
            if (result > 0 || stunned) apply = true;
        } else if (result !== 'OD6S.NO_INJURY' && result !== 'OD6S.NO_DAMAGE') {
            apply = true;
        }

        data.flags.od6s = {
            "isOpposed": true,
            "type": type,
            "isVisible": false,
            "result": result,
            "apply": apply,
            "applied": false,
            "stun": this.boolCheck(stun),
            "stunEffect": stunEffect,
            "loserIsVehicle": loser.actorType === 'vehicle' || loser.actorType === 'starship',
            "loserId": loserId,
            "isCollision": collision,
            "passengerDamage": passengerDamage
        }
        await ChatMessage.create(data);
    }

    static
    async generateOpposedRoll(token, msg) {
        const type = msg.getFlag('od6s', 'damageType');
        if (!token.actor.hasPlayerOwner) {
            if (msg.getFlag('od6s', 'type') === 'damage' || msg.getFlag('od6s','type') === 'explosive') {
                const type = msg.getFlag('od6s', 'damageType');
                if (token.actor.type === 'vehicle' || token.actor.type === 'starship') {
                    if (token.actor.system.embedded_pilot.value || token.actor.system.crewmembers.length < 1) {
                        return await token.actor.rollAction('vehicletoughness', msg);
                    } else {
                        const actor = await od6sutilities.getActorFromUuid(token.actor.system.crewmembers[0].uuid);
                        return actor.rollAction('vehicletoughness', msg);
                    }
                }
                if (type === 'e') {
                    return await token.actor.rollAction('er', msg);
                } else if (type === 'p') {
                    return await token.actor.rollAction('pr', msg);
                }
            }
        } else {

        }
    }

    static getActorOwner(actor) {
        const permissionObject = getProperty(actor ?? {}, "ownership") ?? {};

        const playerOwners = Object.entries(permissionObject)
            .filter(
                ([id, level]) =>
                    !game.users.get(id)?.isGM && game.users.get(id)?.active && level === 3
            )
            .map(([id]) => id);

        if (playerOwners.length > 0) {
            return game.users.get(playerOwners[0]);
        } else {
            // default to GM
            return game.users.activeGM;
        }
    }

    static getInjury(damage, actorType) {
        let resultMessage = '';
        if (actorType === "vehicle" || actorType === "starship") {
            for (let result in OD6S.vehicle_damage) {
                if (damage >= OD6S.vehicle_damage[result].damage) {
                    resultMessage = result;
                } else {
                    break;
                }
            }
        } else {
            for (let result in OD6S.damage) {
                if (damage >= OD6S.damage[result]) {
                    resultMessage = result;
                } else {
                    break;
                }
            }
        }
        return resultMessage;
    }

    static waitFor3DDiceMessage(targetMessageId) {
        function buildHook(resolve) {
            Hooks.once('diceSoNiceRollComplete', (messageId) => {
                if (targetMessageId === messageId)
                    resolve(true);
                else
                    buildHook(resolve)
            });
        }

        return new Promise((resolve, reject) => {
            if (game.dice3d) {
                buildHook(resolve);
            } else {
                resolve(true);
            }
        });
    }


    static async handleEffectChange(effect) {
    }

    static getTemplateFromMessage(message){
        let actor;
        if (message.speaker.token !== '') {
            actor = game.scenes.get(message.speaker.scene).tokens.get(message.speaker.token).object.actor;
        } else {
            actor = game.actors.get(message.speaker.actor);
        }
        const item = actor.items.get(message.getFlag('od6s', 'itemId'));
        const data = {};
        data.actor = actor;
        data.item = item;
        data.template = canvas.scene.getEmbeddedDocument('MeasuredTemplate', item.getFlag('od6s', 'explosiveTemplate'));;
        return data;
    }

    static async wait(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    static getMeleeDamage(actor, weapon) {
        if (weapon.system.damage.str) {
            return (+actor.system.strengthdamage.score) + (+weapon.system.damage.score);
        } else {
            return (+weapon.system.damage.score);
        }
    }

    static evaluateChange(change, caller) {
        let ctx = {};
        if (caller.documentName === 'Actor') {
            ctx = caller;
        } else {
            ctx = caller.actor;
        }
        let newValue = change.value;
        // Pull all variables from string
        const regex = new RegExp(/@.*?@/g)
        const matches = change.value.matchAll(regex);
        for (const m of matches) {
            const match = m[0];
            let valueString = match.replace(/@/g, '');
            valueString = valueString.replace(/^system\.items\./, '');
            valueString = valueString.replace(/^items\./, '');
            if(valueString.match(/^(skill|specialization|weapon|vehicle-weapon|starship-weapon)/)) {
                const c = valueString.split('.');
                const item = ctx.items.find(item => item.name === c[1] && item.type === c[0]);
                if(typeof(item) === 'undefined' || item === null) return 0;
                const stripName = new RegExp(`^(skill|specialization|weapon|vehicle-weapon|starship-weapon)s?\.${c[2]}\.`)
                if(c[0].match(/(skill|specialization)s?/) && c[3] === 'score') {
                    newValue = newValue.replace(match, item.getScore());
                } else {
                    valueString = valueString.replace(stripName, '');
                    const value = foundry.utils.getProperty(item, valueString);
                    newValue = newValue.replace(match, value)
                }
            } else {
                // From actor
                const value = foundry.utils.getProperty(ctx, valueString);
                newValue = newValue.replace(match, value);
            }
        }
        if (typeof(newValue) === 'undefined' || newValue.includes('undefined') && game.user.isGM()) {
            ui.notifications.warn(game.i18n.localize('OD6S.WARN_EFFECT_PARSE') + ' ' + change.value);
            return 0;
        }
        return math.evaluate(newValue);
    }

    static applyDerivedEffect(obj, change) {
        const valueString = change.value.replace(/^.*@/, '');
        if(valueString.match(/^(skill|skills|specilaziation|specializations)/)) {

        }
        const derived = foundry.utils.getProperty(obj, valueString);
        if (typeof (derived !== 'undefined') && derived !== null) {
            const origValue = foundry.utils.getProperty(obj, change.key);
            if (typeof (origValue) !== 'undefined' || origValue !== null) {
                let multiplier = 1;
                if (change.value.startsWith('-')) {
                    multiplier = -1
                }
                const newValue = (origValue + derived) * multiplier;
                foundry.utils.setProperty(obj, change.key, newValue);
            }
        }
    }

    static boolCheck(value) {
        if (typeof value === "string") {
            return value === "true";
        } else {
            return value;
        }
    }
}


