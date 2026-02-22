import {od6sutilities} from "../system/utilities.js";
import {od6sroll} from "../apps/od6sroll.js";
import OD6S from "../config/config-od6s.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class OD6SActor extends Actor {

    get visible() {
        if (this.type === "container" && !game.user.isGM) {
            return this.system.visible;
        } else {
            return super.visible;
        }
    }

    /**
     * Augment the basic actor data with additional dynamic data.
     */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
    }

    async _onCreate(data, options, user) {
        await super._onCreate(data, options, user);
        if (game.user.isGM || this.isOwner) {
            if (this.type === 'character') {
                const update = {};
                update.system = {
                    'created.value': false
                }
                update.id = this.id;
                await this.prototypeToken.update({
                    _id: this.id,
                    id: this.id,
                    displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
                    vision: true,
                    actorLink: true,
                    disposition: 1
                });
                await this.update(update);
            } else {
                await this.prototypeToken.update({
                    _id: this.id,
                    id: this.id,
                    displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
                });
            }

            if (this.type === 'container') {
                await this.prototypeToken.update({
                    _id: this.id,
                    id: this.id,
                    vision: false,
                    actorLink: true,
                    disposition: 0
                });
                const update = {};
                update.id = this.id;
                update[`ownership.default`] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
                await this.update(update);
            }
        }
    }

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.

        // Set all mod values to zero
        if(this.type.match(/^(character|npc|creature)/)) {
            for (const a in this.system.attributes) {
                this.system.attributes[a].mod = 0;
                this.system.attributes[a].label = OD6S.attributes[a].name;
            }

            const mList = {...OD6S.data_tab.offense, ...OD6S.data_tab.defense}
            for (const m in mList) {
                this.system[m].mod = 0;
            }
        }

        if (['starship', 'vehicle'].includes(this.type)) {
            this.system.sensors.mod = 0;
            for (const a in this.system.attributes) {
                this.system.attributes[a].mod = 0;
                this.system.attributes[a].label = OD6S.attributes[a].name;
            }
        }

        if (typeof(this.system.use_wild_die) === 'undefined') {
            if (this.type !== 'vehicle' && this.type !== 'starship' && this.type !== 'container' && this.type !== 'base') {
                this.system.use_wild_die = true;
            }
        }
    }

    getActionScoreText(action) {
        if (['character', 'creature', 'npc'].includes(this.type)) {
            const actionData = OD6S.actions[action];
            if(typeof actionData === 'undefined') {
                // Could be a vehicle action
                //return this.getVehicleActionScoreText(action)
            }
            if (actionData.skill !== '') {
                const skill = this.items.find(s => s.name === game.i18n.localize(actionData.skill) && s.type === 'skill');
                if (typeof skill !== 'undefined' && skill !== '') {
                    return skill.getScoreText();
                }
            }
            const dice = od6sutilities.getDiceFromScore(this.system.attributes[actionData.base].score);
            return `${dice.dice}D+${dice.pips}`;
        }
    }

    getVehicleActionScore(action) {
        let vehicle;
        let pilot;

        if(this.type === 'character' || this.type === 'npc' || this.type === 'creature') {
            vehicle = this.system.vehicle
            pilot = this;
        } else {
            vehicle = this.system;
            if (this.system.embedded_pilot.value) {
                pilot = this;
            } else {
                pilot = null;
            }
        }

        if(action === 'maneuver') {
            let score = vehicle.maneuverability.score;
            if (pilot) {
                let found = false;
                const spec = pilot.items.find(i => i.type === "specialization" &&
                    i.name === vehicle.specialization.value);
                if (typeof spec !== 'undefined') {
                    score = (+score) + (+spec.system.score) + (pilot.system.attributes[vehicle.attribute.value].score)
                    found = true;
                }

                if (!found) {
                    const skill = pilot.items.find(i => i.type === "skill" && i.name === vehicle.skill.value);
                    if (typeof (skill) !== 'undefined') {
                        score = (+score) + (+skill.system.score) + (pilot.system.attributes[vehicle.attribute.value].score);
                        found = true;
                    }
                }
                if (!found) {
                    score = (+score) + (pilot.system.attributes[vehicle.attribute.value].score);
                }
            }
            return score;
        } else if (action === 'ranged_attack') {
            // TODO
        } else if (action === 'ram') {
            // TODO
        } else if (action === 'dodge') {
            // TODO
        } else {
        }
    }

    getVehicleActionScoreText(action) {
        const dice = od6sutilities.getDiceFromScore(this.getVehicleActionScore(action));
        if (typeof dice.dice === 'undefined' || isNaN(dice.dice)) return;
        return `${dice.dice}D+${dice.pips}`;
    }

    async prepareDerivedData() {
        let actorData = this.system;

        if(this.type.match(/^(character|npc|creature)/)) {
            if (OD6S.woundConfig === 1) {
                actorData.wounds.value =
                    Object.keys(Object.fromEntries(Object.entries(OD6S.deadliness[3]).filter(([k, v]) => v.description === this.getWoundLevelFromBodyPoints())))[0];
            } else if (OD6S.woundConfig === 2) {
                actorData.wounds.value = 0;
            }

            // Remove mortally wounded flag if actor is not mortally wounded
            if (this.getFlag('od6s', 'mortally_wounded')) {
                if (OD6S.woundsId[od6sutilities.getWoundLevel(this.system.wounds.value, this)] !== 'mortally_wounded') {
                    await this.unsetFlag('od6s','mortally_wounded');
                }
            }
        }

        if (['character','npc'].includes(this.type)) {
            this.system.species.label = OD6S.speciesLabelName;
        }

        if (this.type === 'character') {
            this.system.chartype.label = OD6S.typeLabel;
        }

        this.applyMods();

        if (this.type !== 'container') this.setInitiative(actorData);

        // Iterate over custom active effects and handle them
        const changes = [];
        const itemRegex = new RegExp(`^(system)?.?(items)?\.?(skill|specialization|weapon|vehicke-weapon|starship-weapon)s?`);

        for ( const effect of this.allApplicableEffects() ) {
            if (!effect.active) continue;
            changes.push(...effect.changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM &&
                !c.key.match(itemRegex)));
        }

        for (const change in changes) {
            if(changes[change].key.match(itemRegex)) continue;
            const changeValue = od6sutilities.evaluateChange(changes[change], this)
            const origValue = foundry.utils.getProperty(this, changes[change].key);
            if (typeof(origValue) === 'undefined' || origValue === null) continue;
            foundry.utils.setProperty(this, changes[change].key, changeValue + origValue)
            this.applyMods();
        }

        // Iterate over owned items and apply custom active effects
        for (const item in this.items.contents) {
            const i = this.items.contents[item];
            i.findActiveEffects();
            i.applyMods();

            if(i.type === 'skill' || i.type === 'specialization') {
                if (i.system.isAdvancedSkill) {
                    i.system.total = i.system.score;
                    i.system.text = od6sutilities.getTextFromDice(od6sutilities.getDiceFromScore(i.system.score));
                } else {
                    i.system.total = i.system.score + this.system.attributes[i.system.attribute].score;
                    i.system.totalText = od6sutilities.getTextFromDice(od6sutilities.getDiceFromScore(i.system.total));
                }
            }
        }

        if (this.type !== 'container') {
            for (const a in this.system.attributes) {
                const dice = od6sutilities.getDiceFromScore(this.system.attributes[a].score);
                this.system.attributes[a].text = `${od6sutilities.getTextFromDice(dice)}`;
            }
        }

        if (['starship', 'vehicle'].includes(this.type)) {
            if (this.system.crew.value > 0) {
                await this.sendVehicleData();
            }
        }
    }

    applyMods() {
        let actorData = this.system;

        for (let a in actorData.attributes) {
            actorData.attributes[a].score = actorData.attributes[a].base + actorData.attributes[a].mod;
            if(this.type.match(/^(character|npc|creature)/)) {
                actorData.strengthdamage.score = this.setStrengthDamageBonus();
            }
        }

        if(this.type.match(/^(character|npc|creature)/)) {
            this.system.pr.score = this.setResistance('pr')
            this.system.pr.text = od6sutilities.getTextFromDice(od6sutilities.getDiceFromScore(this.system.pr.score));
            this.system.er.score = this.setResistance('er')
            this.system.er.text = od6sutilities.getTextFromDice(od6sutilities.getDiceFromScore(this.system.er.score));
            this.system.noArmor = {};
            this.system.noArmor.mod = 0;
            this.system.noArmor.score = this.setResistance('noArmor');
            this.system.noArmor.text = od6sutilities.getTextFromDice(od6sutilities.getDiceFromScore(this.system.noArmor.score));
            this.system.noArmor.label = game.i18n.localize("OD6S.RESISTANCE_NO_ARMOR")
        }
    }

    /**
     * Calculate the strength damage score.  This is one-half the dice of either Lift or Strength
     * added ability to have custom skill and custom multipliers.
     * @return {undefined}
     */
    setStrengthDamageBonus() {
        let damage = 0;
        if(!this.type.match(/^(character|npc|creature)/)) return 0;

        // If game setting is true, use straight strength score plus modifier
        if (game.settings.get('od6s', 'strength_damage')) {
            return this.system.attributes?.str.score + this.system.strengthdamage?.mod;
        }

        const liftSkill = this.items.find(skill => skill.name === OD6S.strDamSkill);
        const base = liftSkill ? liftSkill.system.score + this.system.attributes.str.score : this.system.attributes.str.score;

        if (game.settings.get('od6s', 'od6_bonus')) {
            // Use base directly multiplied by the multiplier
            const modifiedBase = base * OD6S.strDamMultiplier;
            damage = OD6S.strDamRound ? Math.floor(modifiedBase) : Math.ceil(modifiedBase);
        } else {
            // Calculate based on dice conversion and then apply half dice logic
            const dice = Math.ceil(base / OD6S.pipsPerDice);
            const halfDice = OD6S.strDamRound ? Math.floor(dice / 2) : Math.ceil(dice / 2);
            damage = (halfDice * OD6S.pipsPerDice) + this.system.strengthdamage.mod;
        }

        damage += this.system.strengthdamage.mod; // Always add modifier to the damage
        return damage;
    }

    /**
     *
     * Set initiative for an actor
     *
     * @param actorData
     *
     */
    setInitiative() {
        if (this.type === 'container' || this.type === 'base') return
        if (this.type === 'vehicle' || this.type === 'starship') {
            if (!this.system.embedded_pilot) return;
        }
        let formula;
        // Base init is the character's perception score.  Special abilities and optional rules may add to it.
        // Using perception can be overridden in system config options
        // 0.7.3 add an option to change the base attribute
        let score = this.system.attributes[OD6S.initiative.attribute].score + this.system.initiative.mod;
        let dice = od6sutilities.getDiceFromScore(score);
        let tiebreaker = (+(this.system.attributes.per.score / 100 + this.system.attributes.agi.score / 100).toPrecision(2));
        dice.dice--;
        formula = dice.dice + "d6[Base]" + "+" + dice.pips + "+1d6x6[Wild]+" + tiebreaker;
        this.system.initiative.formula = formula;
        this.system.initiative.score = score;
        return this.system;
    }

    async rollAttribute(attribute) {
        const data = {
            "actor": this,
            "itemId": "",
            "name": OD6S.attributes[attribute].name,
            "score": this.system.attributes[attribute].score,
            "type": "attribute"
        }
        await od6sroll._onRollDialog(data);
    }

    async rollAction(actionId,msg) {
        let actor = this;
        const vehicle = (actor.type === 'starship' || actor.type === 'starship') ? actor.system : actor.system?.vehicle
        let itemId = '';
        let name = '';
        let score = 0;
        let type = '';

        let scaleMod = 0;

        let scale = 0;
        if (game.settings.get('od6s','dice_for_scale') && typeof(msg) !== 'undefined' &&
            (actionId === 'vehicletoughness' || actionId === 'er' || actionId === 'pr') ) {
            const attackMessage = game.messages.get(msg.getFlag('od6s','attackMessage'));
            const attackerScale = attackMessage.getFlag('od6s','attackerScale');
            if(this.type === 'vehicle' || this.type === 'starship') {
                scale = this.system.scale.score;
            } else {
                if(this.system?.vehicle?.uuid !== 'undefined' && this.system?.vehicle?.uuid !== '') {
                    if(attackMessage.getFlag('od6s','type') === 'vehicleweapon' ||
                       attackMessage.getFlag('od6s','type') === 'starshipweapon') {
                        const vehicle = await od6sutilities.getActorFromUuid(this.system.vehicle.uuid);
                        scale = vehicle.system.scale.score;
                    }
                }
            }

            if (attackerScale > scale) {
                // Attacker is larger
            } else if (attackerScale < scale) {
                // Attacker is smaller
                scaleMod = scale - attackerScale;
            } else if (attackerScale === scale) {
                // same size
                scaleMod = 0;
            }
        }

        switch (actionId) {
            case "rangedattack":
            case "meleeattack":
            case "brawlattack":
            case "dodge":
            case "parry":
            case "block":
                type = actionId;
                for (let k in OD6S.actions) {
                    if (OD6S.actions[k].rollable && OD6S.actions[k].type === type) {
                        name = game.i18n.localize(OD6S.actions[k].name);
                        if (OD6S.actions[k].skill) {
                            const skill = actor.items.find(i => i.name === name);
                            if (skill !== null && typeof (skill) !== 'undefined') {
                                score = (+skill.system.score) +
                                    (+this.system.attributes[skill.system.attribute.toLowerCase()].score);
                            } else {
                                score = actor.system.attributes[OD6S.actions[k].base].score;
                            }
                        } else {
                            score = actor.system.attributes[OD6S.actions[k].base].score;
                        }
                    }
                }
                break;
            case 'vehiclerangedattack':
                // We know nothing about skills or fire control, just use the defaults
                type = actionId;
                name = game.i18n.localize('OD6S.ACTION_VEHICLE_RANGED_ATTACK');
                score = od6sutilities.getScoreFromSkill(actor, '', game.i18n.localize('OD6S.GUNNERY_SKILL'), 'mec');
                break;
            case 'vehicleramattack':
            case 'vehicledodge':
            case 'vehiclemaneuver':
                type = actionId;
                for (let k in OD6S.vehicle_actions) {
                    if (OD6S.vehicle_actions[k].rollable && OD6S.vehicle_actions[k].type === type) {
                        type = actionId;
                        name = game.i18n.localize(OD6S.vehicle_actions[k].name);
                        score = od6sutilities.getScoreFromSkill(
                            actor,
                            vehicle.specialization.value,
                            vehicle.skill.value,
                            OD6S.vehicle_actions[k].base) + vehicle.maneuverability.score;
                    }
                }
                break;
            case 'vehicletoughness':
                type = "vehicletoughness";
                if (this.type === 'vehicle' || this.type === 'starship') {
                    score = this.system.toughness.score;
                    if (this.type === 'vehicle') {
                        name = game.i18n.localize(OD6S.vehicleToughnessName);
                    } else {
                        name = game.i18n.localize(OD6S.starshipToughnessName);
                    }
                } else {
                    score = this.system.vehicle.toughness.score;
                    if (vehicle.type === 'vehicle') {
                        name = game.i18n.localize(OD6S.vehicleToughnessName);
                    } else {
                        name = game.i18n.localize(OD6S.starshipToughnessName);
                    }
                }
                break;
            case 'vehicleshieldsfront':
                type = "vehicletoughness";
                score = vehicle.shields.arcs.front.value + vehicle.toughness.score;
                name = game.i18n.localize(vehicle.shields.arcs.front.label) + " " +
                    game.i18n.localize('OD6S.SHIELDS');
                break;
            case 'vehicleshieldsrear':
                type = "vehicletoughness";
                score = vehicle.shields.arcs.rear.value + vehicle.toughness.score;
                name = game.i18n.localize(vehicle.shields.arcs.rear.label) + " " +
                    game.i18n.localize('OD6S.SHIELDS');
                break;
            case 'vehicleshieldsleft':
                type = "vehicletoughness";
                score = vehicle.shields.arcs.left.value + vehicle.toughness.score;
                name = game.i18n.localize(vehicle.shields.arcs.left.label) + " " +
                    game.i18n.localize('OD6S.SHIELDS');
                break;
            case 'vehicleshieldsright':
                type = "vehicletoughness";
                score = vehicle.shields.arcs.right.value + vehicle.toughness.score;
                name = game.i18n.localize(vehicle.shields.arcs.right.label) + " " +
                    game.i18n.localize('OD6S.SHIELDS');
                break;
            case 'vehiclesensorspassive':
            case 'vehiclesensorsfocus':
            case 'vehiclesensorsscan':
            case 'vehiclesensorssearch':
                const sensorType = actionId.replace('vehiclesensors', '');
                score = od6sutilities.getSensorTotal(actor, vehicle.sensors.types[sensorType].score);
                name = game.i18n.localize('OD6S.SENSORS') + ": " +
                    game.i18n.localize(vehicle.sensors.types[sensorType].label);
                break;
            case "er":
                name = game.i18n.localize(actor.system.er.label);
                score = actor.system.er.score;
                break;

            case "pr":
                name = game.i18n.localize(actor.system.pr.label);
                score = actor.system.pr.score;
                break;

            case "noArmor":
                name = game.i18n.localize(actor.system.noArmor.label);
                score = actor.system.noArmor.score;
                break;

            default:
                let item = actor.items.find(i => i.id === actionId);
                if (item !== null && typeof (item) !== 'undefined') {
                    return await item.roll()
                } else {
                    type = 'vehiclerangedweaponattack';
                    item = actor.system.vehicle.vehicle_weapons.find(i => i.id === actionId);
                    if (item !== null && typeof (item) !== 'undefined') {
                        name = item.name;
                        itemId = item._id;
                        // Add spec/skill/attribute/fire control
                        score = od6sutilities.getScoreFromSkill(
                            actor,
                            item.system.specialization.value,
                            game.i18n.localize(item.system.skill.value),
                            item.system.attribute.value) + (+item.system.fire_control.score);
                    }
                }
        }

        const data = {
            "actor": this,
            "itemId": itemId,
            "name": name,
            "score": score,
            "type": "action",
            "subtype": type,
            "scale": scaleMod
        }

        return await od6sroll._onRollDialog(data);
    }

    async applyDamage(damage) {
        const update = {};
        update.id = this.id;
        update._id = this.id;
        update.system = {};
        update.system.damage = {};
        update.system.damage.value = this.calculateNewDamageLevel(damage);
        await this.update(update);
    }

    calculateNewDamageLevel(damage) {
        if (damage === 'OD6S.DAMAGE_DESTROYED') return damage;
        const currentDamageLevel = this.system.damage.value;
        if (currentDamageLevel === 'OD6S.NO_DAMAGE') {
            return (damage);
        } else if (currentDamageLevel === 'OD6S.DAMAGE_VERY_LIGHT') {
            if (damage === 'OD6S.DAMAGE_VERY_LIGHT') return damage;
            return damage;
        } else if (currentDamageLevel === 'OD6S.DAMAGE_LIGHT') {
            if (damage === 'OD6S.DAMAGE_VERY_LIGHT') return currentDamageLevel;
            if (damage === 'OD6S.DAMAGE_LIGHT') return damage;
            return damage;
        } else if (currentDamageLevel === 'OD6S.DAMAGE_HEAVY') {
            if (damage === 'OD6S.DAMAGE_VERY_LIGHT') return currentDamageLevel;
            if (damage === 'OD6S.DAMAGE_LIGHT') return 'OD6S.DAMAGE_SEVERE';
            if (damage === 'OD6S.DAMAGE_HEAVY') return 'OD6S.DAMAGE_SEVERE';
            return damage;
        } else if (currentDamageLevel === 'OD6S.DAMAGE_SEVERE') {
            if (damage === 'OD6S.DAMAGE_VERY_LIGHT') return currentDamageLevel;
            if (damage === 'OD6S.DAMAGE_LIGHT') return 'OD6S.DAMAGE_DESTROYED';
            if (damage === 'OD6S.DAMAGE_HEAVY') return 'OD6S.DAMAGE_DESTROYED';
            if (damage === 'OD6S.DAMAGE_SEVERE') return 'OD6S.DAMAGE_DESTROYED';
        }
    }

    async applyWounds(wound) {
        const update = {};
        const newValue = this.calculateNewWoundLevel(wound);
        update.id = this.id;
        update._id = this.id;
        let armorUpdates = [];
        if(wound === 'OD6S.WOUNDS_STUNNED') {
            update[`system.stuns.current`] = 1;
            update[`system.stuns.rounds`] = 1;
            update[`system.stuns.value`] = this.system.stuns.value + 1;
        }

        if (game.settings.get('od6s', 'weapon_armor_damage') && game.settings.get('od6s', 'auto_armor_damage')) {
            if (this.itemTypes.armor.length) {
                this.itemTypes.armor.forEach((value, index, array) => {
                    let armorDamage = 0;
                    let damaged =  typeof(value.system.damaged === "undefined") ? 0 : value.system.damaged;

                    if (value.system.equipped.value) {
                        switch (wound) {
                            case 'OD6S.WOUNDS_WOUNDED':
                                if (damaged <= 1) armorDamage = 1;
                                break;
                            case 'OD6S.WOUNDS_SEVERELY_WOUNDED':
                                if (damaged <= 1) armorDamage = 1;
                                break;
                            case 'OD6S.WOUNDS_INCAPACITATED':
                                if (damaged <= 2) armorDamage = 2;
                                break;
                            case 'OD6S.WOUNDS_MORTALLY_WOUNDED':
                                if (damaged <= 3) armorDamage = 3;
                                break;
                            case 'OD6S.WOUNDS_DEAD':
                                if (damaged <= 4) armorDamage = 4;
                                break;
                            default:
                                break;
                        }
                        if(armorDamage > 0) {
                           const armorUpdate = {};
                           armorUpdate._id = value._id;
                           armorUpdate.system = {};
                           armorUpdate.system.damaged = armorDamage;
                           armorUpdates.push(armorUpdate);
                        }
                    }
                })
            }
        }
        if(armorUpdates.length > 0) {
            await this.updateEmbeddedDocuments('Item', armorUpdates);
        }

        update[`system.wounds.value`] = newValue;
        await this.update(update);
    }

    async triggerMortallyWoundedCheck() {
        if (this.getFlag('od6s', 'mortally_wounded') !== 'undefined') {
            const rollData = {
                name: game.i18n.localize('OD6S.RESIST_MORTALLY_WOUNDED'),
                actor: this,
                score: this.system.attributes.str.score,
                type: 'mortally_wounded',
                difficulty: this.getFlag('od6s','mortally_wounded'),
                difficultyLevel: 'OD6S.DIFFICULTY_CUSTOM'
            }
            await od6sroll._onRollDialog(rollData);
        }
    }

    async applyMortallyWoundedFailure() {
        let tokens;
        tokens ??= this.getActiveTokens();

        if(game.settings.get('od6s','auto_status')) {
            for (const token of tokens) {
                await token.toggleEffect(CONFIG.statusEffects.find(e => e.id === 'dead', {
                    overlay: false,
                    active: true
                }));
            }
        }

        const object = OD6S.deadliness[OD6S.deadlinessLevel[this.type]]
        const dead = Object.keys(object).find(
            key=> object[key].core === 'OD6S.WOUNDS_DEAD');
        const update = {
            system: {
                wounds: {
                    value: dead
                }
            }
        }

        await this.update(update)
        await this.unsetFlag('od6s','mortally_wounded');
    }

    async applyIncapacitatedFailure() {
        let tokens;
        tokens ??= this.getActiveTokens();

        const roll = await new Roll("10d6").evaluate();
        const flavor = this.name + game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_01') +
            roll.total + game.i18n.localize('OD6S.CHAT_UNCONSCIOUS_02');
        if (game.modules.get("dice-so-nice")?.active) game.dice3d.messageHookDisabled=true;
        await roll.toMessage({flavor: flavor});
        if (game.modules.get("dice-so-nice")?.active) game.dice3d.messageHookDisabled=false;

        for (const token of tokens) {
            await token.toggleEffect(CONFIG.statusEffects.find(e => e.id === 'unconscious', {
                overlay: false,
                active: true
            }));
        }
    }

    findFirstWoundLevel(table, wound) {
        for (const level in table) {
            if (table[level].core === wound) return level;
        }
    }

    calculateNewWoundLevel(wound) {
        const deadlinessTable = OD6S.deadliness[OD6S.deadlinessLevel[this.type]];
        const currentWoundLevel = this.system.wounds.value;
        const currentWoundCore = deadlinessTable[currentWoundLevel].core;
        if (wound === 'OD6S.WOUNDS_DEAD') return this.findFirstWoundLevel(deadlinessTable, wound);
        // If the wound table has no "stunned" result promote it to a Wound
        if (wound === 'OD6S.WOUNDS_STUNNED' && !this.findFirstWoundLevel(deadlinessTable, wound))
            wound = 'OD6S.WOUNDS_WOUNDED';
        // No incapacitated, promote it to Mortally Wounded
        if (wound === 'OD6S.WOUNDS_INCAPACITATED' && !this.findFirstWoundLevel(deadlinessTable, wound)) wound = 'OD6S.WOUNDS_MORTALLY_WOUNDED';

        if (currentWoundCore === 'OD6S.WOUNDS_HEALTHY') {
            return this.findFirstWoundLevel(deadlinessTable, wound);
        } else if (currentWoundCore === 'OD6S.WOUNDS_STUNNED') {
            if(OD6S.stunDamageIncrement) {
                return (+currentWoundLevel) + 1;
            } else {
                return this.findFirstWoundLevel(deadlinessTable, wound);
            }
        } else if (currentWoundCore === 'OD6S.WOUNDS_WOUNDED') {
            if (!OD6S.stunDamageIncrement) {
                if (wound === 'OD6S.WOUNDS_STUNNED') return currentWoundLevel;
            }
            if (wound === 'OD6S.WOUNDS_STUNNED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_WOUNDED') return (+currentWoundLevel) + 1;
            return this.findFirstWoundLevel(deadlinessTable, wound);
        } else if (currentWoundCore === 'OD6S.WOUNDS_SEVERELY_WOUNDED') {
            if (!OD6S.stunDamageIncrement) {
                if (wound === 'OD6S.WOUNDS_STUNNED') return currentWoundLevel;
            }
            if (wound === 'OD6S.WOUNDS_STUNNED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_WOUNDED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_SEVERELY_WOUNDED') return (+currentWoundLevel) + 1;
            return this.findFirstWoundLevel(deadlinessTable, wound);
        } else if (currentWoundCore === 'OD6S.WOUNDS_INCAPACITATED') {
            if (!OD6S.stunDamageIncrement) {
                if (wound === 'OD6S.WOUNDS_STUNNED') return currentWoundLevel;
            }
            if (wound === 'OD6S.WOUNDS_STUNNED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_WOUNDED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_SEVERELY_WOUNDED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_INCAPACITATED') return (+currentWoundLevel) + 1;
            return this.findFirstWoundLevel(deadlinessTable, wound);
        } else if (currentWoundCore === 'OD6S.WOUNDS_MORTALLY_WOUNDED') {
            if (!OD6S.stunDamageIncrement) {
                if (wound === 'OD6S.WOUNDS_STUNNED') return currentWoundLevel;
                if (wound === 'OD6S.WOUNDS_WOUNDED') return currentWoundLevel;
                if (wound === 'OD6S.WOUNDS_SEVERELY_WOUNDED') return currentWoundLevel;
            }
            if (wound === 'OD6S.WOUNDS_STUNNED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_WOUNDED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_SEVERELY_WOUNDED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_INCAPACITATED') return (+currentWoundLevel) + 1;
            if (wound === 'OD6S.WOUNDS_MORTALLY_WOUNDED') return (+currentWoundLevel + 1);
            return this.findFirstWoundLevel(deadlinessTable, wound);
        }
    }

    getWoundLevelFromBodyPoints(bp) {
        if (this.type === 'vehicle' || this.type === 'starship') return;
        let bodyPointsCurrent;
        if (typeof (bp) !== 'undefined') {
            bodyPointsCurrent = bp;
        } else {
            bodyPointsCurrent = this.system.wounds.body_points.current
        }

        if (bodyPointsCurrent < 1) return 'OD6S.WOUNDS_DEAD';
        const ratio = Math.ceil(bodyPointsCurrent / this.system.wounds.body_points.max * 100)
        let level;
        for (const key in OD6S.bodyPointLevels) {
            if (ratio < OD6S.bodyPointLevels[key]) {
                level = key;
            } else {
                break;
            }
        }
        if (typeof (level) === 'undefined') level = 'OD6S.WOUNDS_HEALTHY';
        return level;
    }

    async setWoundLevelFromBodyPoints(bp) {
        const update = {};
        update[`system.wounds.body_points.current`] = bp;
        update._id = this.id;
        update.id = this.id;
        await this.update(update);
        update[`system.wounds.value`] =
            Object.keys(Object.fromEntries(Object.entries(OD6S.deadliness[3]).filter(([k, v]) => v.description === this.getWoundLevelFromBodyPoints())))[0];
        await this.update(update);
    }

    // Changed to allow for custom skill and multiplier.
    setResistance(type) {
        let dr = 0;
        if (['vehicle', 'starship', 'container', 'base'].includes(this.type)) return 0;

        // Accumulate DR from equipped and undamaged armor
        if (this.itemTypes.armor && type !== 'noArmor') {
            this.itemTypes.armor.forEach(armor => {
                if (armor.system.equipped.value) {
                    dr += armor.system[type];
                    if (armor.system.damaged > 0) {
                        dr -= OD6S.armorDamage[armor.system.damaged].penalty;
                        dr = Math.max(0, dr);
                    }
                }
            });
        }

        if (OD6S.resistanceOption) {
            const staminaItem = this.items.find(skill => skill.name === OD6S.resistanceSkill);
            const staminaScore = staminaItem ? parseInt(staminaItem.system.score, 10) : 0;
            const staminaAttr= staminaItem ? staminaItem.system.attribute : 'str';
            const strScore = parseInt(this.system.attributes[staminaAttr].score, 10);

            // Default the resistance multiplier if not set or zero
            if (!OD6S.resistanceMultiplier || OD6S.resistanceMultiplier === 0) {
                OD6S.resistanceMultiplier = 1;
            }

            const damageResistance = OD6S.resistanceRound ?
                Math.floor((staminaScore + strScore) * OD6S.resistanceMultiplier) :
                Math.ceil((staminaScore + strScore) * OD6S.resistanceMultiplier);

            dr += damageResistance + this.system[type].mod;
        } else {
            dr += this.system.attributes.str.score + this.system[type].mod;
        }
        return dr;
    }


    /**
     * Adds an embedded pilot to a vehcile
     * @param pilotActor
     * @returns {Promise<void>}
     */
    async addEmbeddedPilot(pilotActor) {
        /* Copy attributes and items to vehicle */
        const update = {};

        const newItems = await this.createEmbeddedDocuments('Item',
            pilotActor.items.filter(s => s.type === 'skill' || s.type === "specialization"));
        const itemIds = newItems.keys();
        update[`system.attributes`] = pilotActor.system.attributes;
        update[`system.embedded_pilot.actor`] = pilotActor;
        await this.update(update);
    }

    /**
     * Flags the actor as a member of a vehicle crew
     * @param vehicleID
     */
    async addToCrew(vehicleId) {
        if (this.isCrewMember()) {
            const currentVehicle = await fromUuid(await this.getFlag('od6s', 'crew'));
            const newVehicle = await fromUuid(vehicleId);

            const data = {
                "vehicleId": vehicleId,
                "currentVehicleName": currentVehicle.name,
                "newVehicleName": newVehicle.name
            };

            const addTemplate = "systems/od6s/templates/actor/common/verify-new-crew.html";
            const html = await renderTemplate(addTemplate, data);
            const label = game.i18n.localize("OD6S.TRANSFER_VEHICLE");

            new Dialog({
                title: label,
                content: html,
                width: 400,
                buttons: {
                    submit: {
                        label: game.i18n.localize("OD6S.OK"),
                        callback: dlg => this._verifyAddToCrew(currentVehicle.uuid, vehicleId)
                    },
                },
                default: "submit"
            }).render(true);
        } else {
            return await this.setFlag('od6s', 'crew', vehicleId);
        }
    }

    async _verifyAddToCrew(currentVehicleId, newVehicleId) {
        const oldVehicle = await fromUuid(currentVehicleId);
        let oldActor;
        if (oldVehicle.documentName === "Token") {
            oldActor = oldVehicle.actor;
        } else {
            oldActor = oldVehicle;
        }
        await oldActor.sheet.unlinkCrew(this.uuid);

        const newVehicle = await fromUuid(newVehicleId);
        let newActor;
        if (newVehicle.documentName === "Token") {
            newActor = newVehicle.actor;
        } else {
            newActor = newVehicle;
        }

        await newActor.sheet.linkCrew(this.uuid);
    }

    /**
     * Remove an actor as a vehicle crew member
     * @param vehicleID
     */
    async removeFromCrew(vehicleID) {
        if (this.getFlag('od6s', 'crew') !== vehicleID) {
            ui.notifications.warn(game.i18n.localize('OD6S.NOT_CREW_MEMBER'))
        } else {
            try {
                await this.unsetFlag('od6s', 'crew');
            } catch (error) {
                console.error(error)
            }
        }
    }

    async forceRemoveCrewmember(crewID) {
        let crewMembers = this.system.crewmembers.filter(e => e.uuid !== crewID);
        const update = {};
        update.system = {};
        update.system.crewmembers = crewMembers;
        await this.update(update);
    }

    /**
     * Check crew member flag
     * @returns {boolean}
     */
    isCrewMember() {
        return this.getFlag('od6s', 'crew');
    }

    async useCharacterPointOnRoll(message) {
        // Roll 1d6x6 and deduct a character point from the actor
        //const actor = game.actors.get(message.speaker.actor);
        // Bail if out of character points
        if (this.system.characterpoints.value < 1) {
            ui.notifications.warn(game.i18n.localize("OD6S.NOT_ENOUGH_CP_ROLL"));
            return;
        }
        const rollString = "1d6x6[CP]";
        let roll = await new Roll(rollString).evaluate();
        if (game.modules.get('dice-so-nice') && game.modules.get('dice-so-nice').active) {
            game.dice3d.showForRoll(roll, game.user, true, false, false);
        }

        const update = {};
        update.id = this.id;
        update.system = {};
        update.system.characterpoints = {};
        update.system.characterpoints.value = this.system.characterpoints.value -= 1;

        switch (message.getFlag('od6s', 'subtype')) {
            case "dodge":
                update.dodge = {};
                update.dodge.score = this.system.dodge.score + roll.total;
                break;
            case "parry":
                update.parry = {};
                update.parry.score = this.system.parry.score + roll.total;
                break;
            case "block":
                update.block = {};
                update.block.score = this.system.block.score + roll.total;
                break;
            default:
                break;
        }

        await this.update(update);

        // Update original message and re-display
        let replacementRoll = JSON.parse(JSON.stringify(message.rolls[0]));
        replacementRoll.dice.push(roll.dice[0]);
        replacementRoll.total += roll.total;

        const messageUpdate = {};
        messageUpdate.system = {};
        messageUpdate.content = replacementRoll.total;
        messageUpdate.id = message.id;
        messageUpdate._id = message._id;
        messageUpdate.rolls = [replacementRoll];

        if (game.user.isGM) {
            await message.update(messageUpdate, {"diff": true});
            await message.setFlag('od6s', 'total', replacementRoll.total);
            if ((+messageUpdate.content) >= (message.getFlag('od6s', 'difficulty'))) {
                await message.setFlag('od6s', 'success', true);
            }
        } else {
            game.socket.emit('system.od6s', {
                operation: 'updateRollMessage',
                message: message,
                update: messageUpdate
            })
        }

        // Is this an init roll?
        if (message.getFlag('core', 'initiativeRoll')) {
            if (game.user.isGM) {
                if (game.combat !== null) {
                    const combatant = game.combat.combatants.find(c => c.actor.id === this.id);
                    const update = {
                        id: combatant.id,
                        _id: combatant.id,
                        initiative: replacementRoll.total
                    }
                    await combatant.update(update);
                }
            } else {
                game.socket.emit('system.od6s', {
                    operation: "updateInitRoll",
                    message: message,
                    update: messageUpdate
                })
            }
        }
    }

    async modifyShields(update) {
        await OD6S.socket.executeAsGM("modifyShields", update);
    }

    /**
     * Send vehicle data to GM to populate crew vehicle data
     * @returns {Promise<void>}
     */
    async sendVehicleData(uuid) {
        const data = {};
        data.uuid = this.uuid;
        data.name = this.name;
        data.type = this.type;
        data.move = this.system.move;
        data.maneuverability = this.system.maneuverability;
        data.toughness = this.system.toughness;
        data.crewmembers = this.system.crewmembers;
        data.items = this.items;
        data.attribute = this.system.attribute;
        data.skill = this.system.skill;
        data.specialization = this.system.specialization;
        data.damage = this.system.damage;
        data.shields = this.system.shields;
        data.scale = this.system.scale;
        data.sensors = this.system.sensors;
        data.armor = this.system.armor;
        data.dodge = this.system.dodge;
        data.ranged = this.system.ranged;
        data.ranged_damage = this.system.ranged_damage;
        data.ram = this.system.ram;
        data.ram_damage = this.system.ram_damage;
        data.vehicle_weapons = [];
        for (let i = 0; i < data.items.size; i++) {
            if (this.items.contents[i].type === "vehicle-weapon" || this.items.contents[i].type === "starship-weapon") {
                let newItem = this.items.contents[i].toObject()
                newItem.id = this.items.contents[i].id;
                data.vehicle_weapons.push(newItem);
            }
        }

        if (game.user.isGM) {
            let crew;
            if(typeof uuid !== 'undefined') {
                crew = data.crewmembers.filter(c=>c.uuid === uuid);
            } else {
                crew = data.crewmembers;
            }

            for (const e of crew) {
                let actor = await od6sutilities.getActorFromUuid(e.uuid);
                if (actor) {
                    const update = {};
                    update.id = actor.id;
                    update._id = actor.id;
                    update.system = {}
                    update.system.vehicle = data;
                    await actor.update(update);
                }
            }
        } else {
            await OD6S.socket.executeAsGM("sendVehicleData", data);
        }
    }

    /**
     * Roll a generic collision for a vehicle.
     * @returns {Promise<void>}
     */
    async vehicleCollision() {
        if (this.type !== 'vehicle' && this.type !== 'starship') {
            ui.notifications.warn(game.i18n.localize('OD6S.WARN_ACTOR_NOT_VEHICLE'));
            return;
        }
        const html = await renderTemplate("systems/od6s/templates/actor/vehicle/collision.html");
        new Dialog({
            title: game.i18n.localize('OD6S.ROLL_COLLISION_DAMAGE'),
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize('OD6S.ROLL'),
                    callback: async (dlg) => {
                        const speed = $(dlg[0]).find("#vehiclespeed")[0].value;
                        const speedValue = OD6S.vehicle_speeds[speed].damage;
                        const type = $(dlg[0]).find("#vehiclecollisiontype")[0].value;
                        const typeValue = OD6S.collision_types[type].score;
                        const mod = $(dlg[0]).find("#vehiclecollisionmod")[0].value;
                        const score = (+speedValue) + (+typeValue) + (+mod * OD6S.pipsPerDice);
                        const dice = od6sutilities.getDiceFromScore(score);
                        let rollString;
                        if (game.settings.get('od6s', 'use_wild_die')) {
                            dice.dice = dice.dice - 1;
                            if (dice.dice < 1) {
                                rollString = "+1dw" + game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
                            } else {
                                rollString = dice.dice + "d6" + game.i18n.localize('OD6S.BASE_DIE_FLAVOR') + "+1dw" +
                                    game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
                            }
                        } else {
                            rollString = dice.dice + "d6" + +game.i18n.localize('OD6S.BASE_DIE_FLAVOR');
                        }
                        dice.pips ? rollString += "+" + dice.pips : null;
                        let roll = await new Roll(rollString).evaluate();
                        let label = game.i18n.localize('OD6S.DAMAGE') + " (" +
                            game.i18n.localize(OD6S.damageTypes['p']) + ") "
                            + game.i18n.localize("OD6S.FROM") + " " + game.i18n.localize("OD6S.COLLISION");

                        const flags = {
                            "type": "damage",
                            "source": game.i18n.localize("OD6S.COLLISION"),
                            "damageType": "p",
                            "targetName": null,
                            "targetId": null,
                            "isOpposable": true,
                            "wild": false,
                            "wildHandled": false,
                            "wildResult": OD6S.wildDieResult[OD6S.wildDieOneDefault],
                            "total": roll.total,
                            "isVehicleCollision": true
                        }

                        if (game.settings.get('od6s', 'use_wild_die')) {
                            const wildFlavor = game.i18n.localize('OD6S.WILD_DIE_FLAVOR').replace(/[\[\]]/g, "");
                            if (roll.terms.find(d => d.flavor === wildFlavor).total === 1) {
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
                            speaker: ChatMessage.getSpeaker({actor: game.actors.find(a => a.id === this.id)}),
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
                            replacementRoll.total -= (+replacementRoll.terms[0].results[highest].result) + 1;
                            flags.total = replacementRoll.total;
                            const rollMessageUpdate = {};
                            rollMessageupdate.system = {};
                            rollMessageUpdate.content = replacementRoll.total;
                            rollMessageUpdate.id = rollMessage.id;
                            rollMessageUpdate._id = rollMessage._id;
                            rollMessageUpdate.roll = replacementRoll;

                            if (rollMessage.getFlag('od6s', 'difficulty') && rollMessage.getFlag('od6s', 'success')) {
                                replacementRoll.total < rollMessage.getFlag('od6s', 'difficulty') ? await rollMessage.setFlag('od6s', 'success', false) :
                                    await rollMessage.setFlag('od6s', 'success', true);
                            }

                            await rollMessage.setFlag('od6s', 'originalroll', rollMessage.roll)

                            await rollMessage.update(rollMessageUpdate, {"diff": true});
                        }
                    }
                }
            },
            default: roll
        }).render(true);
    }

    /**
     * Handle creating a new item for a vehicle cargo hold
     * @param event
     * @private
     */
    async onCargoHoldItemCreate(event) {
        event.preventDefault();

        const documentName = 'Item';
        let types, folders, label, title, template;
        types = game.system.documentTypes[documentName];
        let data = {};
        folders = game.folders.filter(f => (f.type === documentName) && f.displayed);
        label = game.i18n.localize('OD6S.ITEM');
        title = game.i18n.format("OD6S.CREATE_ITEM", {entity: label});
        template = 'templates/sidebar/document-create.html';

        if (game.settings.get('od6s', 'hide_advantages_disadvantages')) {
            types = types.filter(function (value, index, arr) {
                return value !== 'advantage';
            })
            types = types.filter(function (value, index, arr) {
                return value !== 'disadvantage';
            })
        }

        types = types.filter(t => OD6S.cargo_hold.includes(t));
        types = types.filter(t => !t.startsWith(this.type));

        types = types.sort(function (a, b) {
            return a.localeCompare(b);
        })

        // Render the entity creation form
        const html = await renderTemplate(template, {
            name: data.name || game.i18n.format("OD6S.NEW_ITEM", {entity: label}),
            type: data.type || types[0],
            types: types.reduce((obj, t) => {
                const label = CONFIG[documentName]?.typeLabels?.[t] ?? t;
                obj[t] = game.i18n.has(label) ? game.i18n.localize(label) : t;
                return obj;
            }, {}),
            hasTypes: types.length > 1
        });

        // Render the confirmation dialog window
        return Dialog.prompt({
            title: title,
            content: html,
            label: title,
            callback: html => {
                const form = html[0].querySelector("form");
                const fd = new FormDataExtended(form);
                data = foundry.utils.mergeObject(data, fd.toObject());
                if (!data.folder) delete data["folder"];
                if (types.length === 1) data.type = types[0];
                data.name = data.name || game.i18n.localize('OD6S.NEW') + " " + game.i18n.localize(OD6S.itemLabels[data.type]);
                return this.createEmbeddedDocuments('Item', [data]);
            },
            rejectClose: false
        });
    }
}
