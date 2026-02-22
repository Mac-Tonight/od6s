import '../config/settings-od6s.js';
import OD6S from "../config/config-od6s.js";
import {od6sutilities} from "./utilities.js";
import {getAttributeName, getAttributeShortName} from "../od6s.js";

export default function od6sHandlebars() {
    Hooks.once('init', async function () {

        Handlebars.registerHelper('isExplosivesAuto', function() {
            return game.settings.get('od6s', 'auto_explosive');
        })

        Handlebars.registerHelper('notExplosivesEndOfRound', function() {
            return !game.settings.get('od6s', 'explosive_end_of_round');
        })

        Handlebars.registerHelper('getExplosiveZones', function(key) {
            const zones = game.settings.get('od6s', 'explosive_zones') ? 4 : 3;
            return (key <= zones);
        })

        Handlebars.registerHelper('getExplosiveZonesCount', function() {
            const zones = [];
            for (let i = 1; i <= (game.settings.get('od6s', 'explosive_zones') ? 4 : 3); i++) {
                zones.push(i);
            }
            return zones;
        });

        Handlebars.registerHelper('getExplosiveTargets', async (actorId, itemId) => {
            return await od6sutilities.getExplosiveTargets(actorId, itemId);
        })

        Handlebars.registerHelper('checkExplosiveTargets', (targets) => {

            if (typeof (targets) === 'undefined' || targets === '') {
                return false;
            }
            return Object.keys(targets).length > 0;
        })

        Handlebars.registerHelper('skillHasSpecs', function (actor, skill) {
            return actor.specializations.filter(s=> s.system.skill === skill.name).length > 0;
        })

        Handlebars.registerHelper('skillUsed', function (item) {
            if (OD6S.skillUsed) {
            }
        });

        Handlebars.registerHelper('isAttributeActive', function (key) {
            return OD6S.attributes[key].active;
        });

        Handlebars.registerHelper('getTemplateSkills', function (data, key) {
            if (typeof data.items !== 'undefined') {
                return data.items.filter(i => i.type === 'skill');
            }
        });

        Handlebars.registerHelper('itemNotInTemplate', function (itemName, template) {
            if (typeof (template) !== 'undefined') {
                return !template.system.items.find(i => i.name === itemName);
            } else {
                return true;
            }
        });

        Handlebars.registerHelper('specializationDice', function () {
            return OD6S.specializationDice;
        });

        Handlebars.registerHelper('isdefined', function (value) {
            return value === 0 ? true : typeof (value) !== undefined && value !== null;
        });

        Handlebars.registerHelper('concat', function () {
            let outStr = '';
            for (let arg in arguments) {
                if (typeof arguments[arg] != 'object') {
                    outStr += arguments[arg];
                }
            }
            return outStr;
        });

        Handlebars.registerHelper('add', function () {
            let sum = 0;
            for (let i = 0; i < arguments.length - 1; i++) {
                sum += parseInt(arguments[i]);
            }
            return sum;
        })

        Handlebars.registerHelper('abs', function (num) {
            return Math.abs(num);
        })

        Handlebars.registerHelper('isRanged', function (type) {
            return type !== game.i18n.localize("OD6S.MELEE");
        })

        Handlebars.registerHelper('isExplosive', function (type) {
            return type === game.i18n.localize("OD6S.EXPLOSIVE");
        })

        Handlebars.registerHelper('isExplosiveDice', function (type) {
            return type === game.i18n.localize("OD6S.EXPLOSIVE") &&
                OD6S.grenadeDamageDice;
        })

        Handlebars.registerHelper('isMuscle', function (type) {
            switch (type) {
                case game.i18n.localize("OD6S.THROWN"):
                case game.i18n.localize("OD6S.MISSILE"):
                    return true;
                default:
                    return false;
            }

        })

        Handlebars.registerHelper('getMeleeDifficulty', function (type) {
            return OD6S.meleeDifficulty;
        })

        Handlebars.registerHelper('getMeleeDifficultyLevels', function (type) {
            return OD6S.meleeDifficulties;
        })

        Handlebars.registerHelper('getMapRange', function (type) {
            return OD6S.mapRange;
        })

        Handlebars.registerHelper('getModColor', function (mod) {
            if (OD6S.highlightEffects) {
                if (mod > 0) {
                    return " moddedup"
                } else if (mod < 0) {
                    return " moddeddown"
                } else {
                    return
                }
            } else {
                return
            }
        })

        Handlebars.registerHelper('compareSubtype', function (subType, compare) {
            const testString = subType.toUpperCase();
            let compareString = compare.toUpperCase();
            if (game.i18n.localize(compare) === subType) {
                return true;
            } else {
                const e = OD6S.weaponTypeKeys.find(type => type.name === subType);
                if (e?.key === compareString) {
                    return true;
                } else {
                    return (compareString === testString);
                }
            }
        })

        Handlebars.registerHelper('displayRange', function (subType) {
            if (subType === 'meleeattack' || subType === 'brawlattack') {
                if (OD6S.meleeDifficulty) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        })

        Handlebars.registerHelper('getPilotManeuverTotal', function (actor) {
            let found = false;
            let score = actor.system.maneuverability.score;
            if (!found) {
                const spec = actor.items.find(i => i.type === "specialization" &&
                    i.name === actor.system.specialization.value);
                if (typeof (spec) !== 'undefined') {
                    score = (+score) + (+spec.system.score) + (actor.system.attributes[actor.system.attribute.value].score)
                    found = true;
                }
            }
            if (!found) {
                const skill = actor.items.find(i => i.type === "skill" && i.name === actor.system.skill.value);
                if (typeof (skill) !== 'undefined') {
                    score = (+score) + (+skill.system.score) + (actor.system.attributes[actor.system.attribute.value].score);
                    found = true;
                }
            }
            if (!found) {
                score = (+score) + (actor.system.attributes[actor.system.attribute.value].score);
            }
            return score;
        })

        Handlebars.registerHelper('getPilotSensorsTotal', function (actor, sensor) {
            let found = false;
            let score = actor.system.sensors.types[sensor].score;
            if (!found) {
                const skillType = game.i18n.localize('OD6S.SENSORS');
                const skill =
                    actor.items.find(i => i.type === "skill" && i.name === skillType);
                if (typeof (skill) !== 'undefined') {
                    score = (+score) + (+skill.system.score) + (actor.system.attributes['mec'].score);
                    found = true;
                }
            }
            if (!found) {
                score = (+score) + (actor.system.attributes[actor.system.attribute.value].score);
            }
            return score;
        })

        Handlebars.registerHelper('getPilotWeaponTotal', function (actor, weapon) {
            let found = false;
            let score = weapon.system.fire_control.score;
            if (!found) {
                const spec = actor.items.find(i => i.type === "specialization" &&
                    i.name === weapon.system.stats.specialization);
                if (typeof (spec) !== 'undefined') {
                    score = (+score) + (+spec.system.score) + (actor.system.attributes[weapon.system.stats.attribute].score)
                    found = true;
                }
            }
            if (!found) {
                const skill = actor.items.find(i => i.type === "skill" && i.name === weapon.system.stats.skill);
                if (typeof (skill) !== 'undefined') {
                    score = (+score) + (+skill.system.score) + (actor.system.attributes[weapon.system.stats.attribute].score);
                    found = true;
                }
            }
            if (!found) {
                score = (+score) + (actor.system.attributes[weapon.system.stats.attribute].score);
            }
            const dice = od6sutilities.getDiceFromScore(score);
            return dice.dice + "D+" + dice.pips;
        })

        Handlebars.registerHelper('getSensorsConfig', function () {
            return game.settings.get('od6s', 'sensors');
        })

        Handlebars.registerHelper('getSensorTotal', function (actor, sensorScore) {
            return od6sutilities.getSensorTotal(actor, sensorScore);
            /* const skill = (actor.items.find(i => i.type === 'skill' &&
                i.name === game.i18n.localize('OD6S.SENSORS')));
            if (typeof(skill) !== 'undefined') {
                return skill.system.score + sensorScore + actor.system.attributes.mec.score;
            } else {
                return  actor.system.attributes.mec.score + sensorScore;
            }*/
        })

        Handlebars.registerHelper('getActorNameFromId', function (actorID) {
            let actor;
            // Is it a token?
            actor = game.scenes.active.tokens.filter(t => t.id === actorID);
            if (actor.length === 0) {
                actor = game.actors.filter(actor => actor.id === actorID);
            }
            if (actor.length === 0) return;
            return actor[0].name;
        })

        Handlebars.registerHelper('getActorNameFromUuid', function (uuid) {
            return getActorNameFromUuid(uuid);
        })

        Handlebars.registerHelper('showWildDie', function () {
            return game.settings.get('od6s', 'use_wild_die');
        })

        Handlebars.registerHelper('getRollTypeForCard', function (type, subtype) {
            let label = '';
            switch (type) {
                case "weapon":
                    switch (subtype) {
                        case "rangedattack":
                            label = "OD6S.CARD_RANGED_ATTACK";
                            break;
                        case "meleeattack":
                            label = "OD6S.CARD_MELEE_ATTACK";
                            break;
                        case "brawlattack":
                            label = "OD6S.CARD_BRAWL_ATTACK";
                            break
                        default:
                            create - attribute - column
                    }
                    break;
                case "action":
                    switch (subtype) {
                        case "rangedattack":
                            label = "OD6S.CARD_RANGED_ATTACK";
                            break;
                        case "meleeattack":
                            label = "OD6S.CARD_MELEE_ATTACK";
                            break;
                        case "brawlattack":
                            label = "OD6S.CARD_BRAWL_ATTACK";
                            break;
                        case "dodge":
                            label = "OD6S.CARD_DODGE";
                            break;
                        case "parry":
                            label = "OD6S.CARD_PARRY";
                            break;
                        case "block":
                            label = "OD6S.CARD_BLOCK";
                            break;
                        default:
                    }
                    break;

                default:
            }
            return label;
        })

        Handlebars.registerHelper('isMetaphysicsAttributeOptional', function () {
            return game.settings.get('od6s', 'metaphysics_attribute_optional');
        })

        Handlebars.registerHelper('getTemplateMetaphysicsSkills', function (data) {
            const templateSkills = od6sutilities.getSkillsFromTemplate(data.system.items);
            let metaSkills = [];
            for (let skill in templateSkills) {
                const foundSkill = od6sutilities.getItemByName(skill.name);
                if (typeof (foundSkill) !== "undefined") {
                    if (foundSkill.system.attribute === "met") {
                        metaSkills.push;
                    }
                }
            }
        })

        Handlebars.registerHelper('isSkillOrAttribute', function (type, subtype) {
            if (typeof (type) === 'undefined') type = '';
            if (typeof (subtype) === 'undefined') subtype = '';

            let test = (type === 'funds' || type === "skill" || subtype === "skill" ||
                type === "specialization" || subtype === "specialization" ||
                type === "attribute" || subtype === "attribute" || subtype === 'vehiclemaneuver');

            return type === 'mortally_wounded' || type === 'incapacitated' || type === 'funds' || type === "skill" || subtype === "skill" ||
                type === "specialization" || subtype === "specialization" ||
                type === "attribute" || subtype === "attribute" || subtype === 'vehiclemaneuver';
        })

        Handlebars.registerHelper('hitsOrMisses', function (success) {
            return success ? game.i18n.localize('OD6S.HITS') : game.i18n.localize('OD6S.MISSES');
        })

        Handlebars.registerHelper('onSuccess', function (success, roll, target) {
            //Get the level of success and return the message
            let resultMessage = '';
            if (success) {
                const difference = roll - target;
                if (difference < 0) {
                    // Actually a failure
                    return 'OD6S.FAILURE';
                }
                for (let result in OD6S.result) {
                    if (difference >= OD6S.result[result].difference) {
                        resultMessage = result;
                    } else {
                        break;
                    }
                }
            } else {
                resultMessage = 'OD6S.FAILURE'
            }

            return resultMessage;
        })

        Handlebars.registerHelper('getResultDescription', function (success) {
            return OD6S.result[success].description;
        })

        Handlebars.registerHelper('isAttack', function (subtype) {
            if (typeof (subtype) === 'undefined') {
                return false;
            } else {
                return subtype.endsWith('attack');
            }
        })

        Handlebars.registerHelper('toLowerCase', function (str) {
            return str.toLowerCase();
        });

        Handlebars.registerHelper('toUpperCase', function (str) {
            return str.toUpperCase();
        });

        Handlebars.registerHelper('diceFromScore', function (score) {
            return Math.floor(score / OD6S.pipsPerDice);
        });

        Handlebars.registerHelper('scaleDiceFromScore', function (score) {
            return Math.floor(score / OD6S.pipsPerDice) * -1;
        });

        Handlebars.registerHelper('pipsFromScore', function (score) {
            return score % OD6S.pipsPerDice;
        });

        Handlebars.registerHelper('scalePipsFromScore', function (score) {
            return score % OD6S.pipsPerDice * -1;
        });

        Handlebars.registerHelper('maxPips', function () {
            return OD6S.pipsPerDice - 1;
        });

        Handlebars.registerHelper('getAttackOptions', function (type) {
            if (type === 'rangedattack') {
                return OD6S.rangedAttackOptions;
            }

            if (type === 'meleeattack') {
                return OD6S.meleeAttackOptions;
            }

            if (type === 'brawlattack') {
                return OD6S.brawlAttackOptions;
            }

            if (type === 'explosive') {
                return OD6S.explosiveAttackOptions;
            }
        })

        Handlebars.registerHelper('getCharacterTemplates', function () {
            return od6sutilities.getAllItemsByType('character-template');
        })

        Handlebars.registerHelper('templateItemTypes', function (type, actorTypes) {
            let itemTypes = {};
            let templateItems = [];

            // Item group, filter by actor types
            if (type === "item-group") {
                for (const [key, items] of Object.entries(OD6S.allowedItemTypes)) {
                    if (actorTypes.includes(key)) {
                        for (let i of items) {
                            if (OD6S.templateItemTypes['item-group'].includes(i)) {
                                templateItems.push(i);
                            }
                        }
                    }
                }
            } else {
                templateItems = OD6S.templateItemTypes[type];
            }
            // Remove advantages and disadvantages if hidden
            if (game.settings.get('od6s', 'hide_advantages_disadvantages')) {
                templateItems = templateItems.filter(t => t !== 'advantage' || t !== 'disadvantage');
            }

            for (let e of templateItems) {
                itemTypes[e] = game.system.template.Item[e];
                if (e === 'manifestation') {
                    itemTypes[e].label = OD6S.manifestationsName;
                }
            }
            return itemTypes;
        })

        Handlebars.registerHelper('hideAdvantagesDisadvantages', function () {
            return game.settings.get('od6s', 'hide_advantages_disadvantages');
        });

        Handlebars.registerHelper('getWoundLevels', function (type) {
            return OD6S.deadliness[OD6S.deadlinessLevel[type]];
        });

        Handlebars.registerHelper('woundsFromValue', function (value, type) {
            const max = Object.keys(OD6S.deadliness[OD6S.deadlinessLevel[type]]).length;
            if (value > max) {
                return max;
            } else {
                return OD6S.deadliness[OD6S.deadlinessLevel[type]][value].description;
            }
        });

        Handlebars.registerHelper('getActorTypeConfig', function (value, type) {
            return ((value >> OD6S.actorMasks[type]) % 2 != 0);
        })

        Handlebars.registerHelper('getVehicleDamageLevels', function () {
            return OD6S.vehicle_damage;
        })

        Handlebars.registerHelper('getDamageTypes', function () {
            return OD6S.damageTypes;
        })

        Handlebars.registerHelper('getDamageType', function (type) {
            return OD6S.damageTypes[type];
        })

        Handlebars.registerHelper('getWeaponTypes', function () {
            return OD6S.weaponTypes;
        })

        Handlebars.registerHelper('getMeleeDamage', function (actor, weapon) {
            return od6sutilities.getMeleeDamage(actor, weapon);
        })

        Handlebars.registerHelper('getActionPenalties', function (actions) {
            // Get penalties associated with the number of actions
            return (actions > 0) ? actions - 1 : 0;
        })

        Handlebars.registerHelper('getWoundPenalties', function (actor) {
            // Get penalties associated with the number of actions
            return od6sutilities.getWoundPenalty(actor)
        })

        Handlebars.registerHelper('getFlag', function (message, flag) {
            return message.getFlag('od6s', flag);
        })

        Handlebars.registerHelper('getDRScore', function (actor) {
            // Get the actor's total DR
            return od6sutilities.getDamageResistance(actor)
        })

        Handlebars.registerHelper('getActions', function () {
            // Return a list of available actions
            return OD6S.actions;
        })

        Handlebars.registerHelper('getVehicleActions', function (actor) {
            // Return a list of available vehicle actions
            if (actor.type === 'character' || actor.type === 'npc') {
                if (typeof (actor.system.vehicle.name) != 'undefined') {
                    let actions = {...OD6S.vehicle_actions};
                    if (actor.system.vehicle.shields.value === 0) {
                        delete actions['shields'];
                    }
                    if (!actor.system.vehicle.sensors.value || actor.system.vehicle.type === 'starship') {
                        delete actions['sensors'];
                    }
                    return actions;
                }
            }
        })

        Handlebars.registerHelper('useWeaponArmorDamage', function () {
            return game.settings.get('od6s','weapon_armor_damage');
        })

        Handlebars.registerHelper('getArmorDamageLevels', function () {
            let levels = {};
            for (let level in OD6S.armorDamage) {
                levels[level] = OD6S.armorDamage[level].label;
            }
            return levels;
        })

        Handlebars.registerHelper('getWeaponDamageLevels', function () {
            let levels = {};
            for (let level in OD6S.weaponDamage) {
                levels[level] = OD6S.weaponDamage[level].label;
            }
            return levels;
        })

        Handlebars.registerHelper('getInitiative', function (actor) {
            return actor.system.initiative.score;
        })

        Handlebars.registerHelper('isEvenAttribute', function (value) {
            return value % 2 === 0;
        })

        Handlebars.registerHelper('showMetaphysics', function (sheetMode) {
            if (game.settings.get('od6s', 'metaphysics_attribute_optional')) return false;
            if (!OD6S.attributes['met'].active) return false;

            if (sheetMode === 'normal') {
                return !!game.settings.get('od6s', 'show_metaphysics_attributes');
            }

            return true;
        })

        Handlebars.registerHelper('getMetaphysicsName', function () {
            return getAttributeName('met');
        })

        Handlebars.registerHelper('getManifestationsName', function () {
            return game.i18n.localize(OD6S.manifestationsName);
        })

        Handlebars.registerHelper('getFatePointsName', function () {
            return game.i18n.localize(OD6S.fatePointsName);
        })

        Handlebars.registerHelper('getFatePointsShortName', function () {
            return game.i18n.localize(OD6S.fatePointsShortName);
        })

        Handlebars.registerHelper('getMetaphysicsExtranormalName', function () {
            return game.i18n.localize(OD6S.metaphysicsExtranormalName);
        })

        Handlebars.registerHelper('getToughnessName', function (type) {
            if (type === 'vehicle') return game.i18n.localize(OD6S.vehicleToughnessName);
            if (type === 'starship') return game.i18n.localize(OD6S.starshipToughnessName);
        })

        Handlebars.registerHelper('getCustomField1', function () {
            const customField = game.settings.get('od6s', 'custom_field_1');
            if (typeof (customField) === 'undefined') {
                return "";
            }
            return customField;
        })

        Handlebars.registerHelper('getCustomField1Short', function () {
            const customField = game.settings.get('od6s', 'custom_field_1_short');
            if (typeof (customField) === 'undefined' || customField === '') {
                return game.settings.get('od6s', 'custom_field_1');
            } else {
                return game.settings.get('od6s', 'custom_field_1_short');
            }
        })

        Handlebars.registerHelper('getCustomField1Type', function () {
            const thisType = game.settings.get('od6s', 'custom_field_1_type');
            if (thisType === "string") {
                return "text";
            }
            if (thisType === "number") {
                return "number";
            }
        })

        Handlebars.registerHelper('getCustomField1FType', function () {
            const thisType = game.settings.get('od6s', 'custom_field_1_type')
            if (thisType === "string") {
                return "String";
            }

            if (thisType === "number") {
                return "Number";
            }
        })

        Handlebars.registerHelper('getCustomField2', function () {
            const customField = game.settings.get('od6s', 'custom_field_2');
            if (typeof (customField) === 'undefined') {
                return "";
            }
            return customField;
        })

        Handlebars.registerHelper('getCustomField2Short', function () {
            const customField = game.settings.get('od6s', 'custom_field_2_short');
            if (typeof (customField) === 'undefined' || customField === '') {
                return game.settings.get('od6s', 'custom_field_2');
            } else {
                return game.settings.get('od6s', 'custom_field_2_short');
            }
        })

        Handlebars.registerHelper('getCustomField2Type', function () {
            const thisType = game.settings.get('od6s', 'custom_field_2_type');
            if (thisType === "string") {
                return "text";
            }
            if (thisType === "number") {
                return "number";
            }
        })


        Handlebars.registerHelper('getCustomField2FType', function () {
            const thisType = game.settings.get('od6s', 'custom_field_2_type')
            if (thisType === "string") {
                return "String";
            }

            if (thisType === "number") {
                return "Number";
            }
        })

        Handlebars.registerHelper('getCustomField3', function () {
            const customField = game.settings.get('od6s', 'custom_field_3');
            if (typeof (customField) === 'undefined') {
                return "";
            }
            return customField;
        })

        Handlebars.registerHelper('getCustomField3Short', function () {
            const customField = game.settings.get('od6s', 'custom_field_3_short');
            if (typeof (customField) === 'undefined' || customField === '') {
                return game.settings.get('od6s', 'custom_field_3');
            } else {
                return game.settings.get('od6s', 'custom_field_3_short');
            }
        })

        Handlebars.registerHelper('getCustomField3Type', function () {
            const thisType = game.settings.get('od6s', 'custom_field_3_type');
            if (thisType === "string") {
                return "text";
            }
            if (thisType === "number") {
                return "number";
            }
        })

        Handlebars.registerHelper('getCustomField3FType', function () {
            const thisType = game.settings.get('od6s', 'custom_field_3_type')
            if (thisType === "string") {
                return "String";
            }

            if (thisType === "number") {
                return "Number";
            }
        })

        Handlebars.registerHelper('getCustomField4', function () {
            const customField = game.settings.get('od6s', 'custom_field_4');
            if (typeof (customField) === 'undefined') {
                return "";
            }
            return customField;
        })

        Handlebars.registerHelper('getCustomField4Short', function () {
            const customField = game.settings.get('od6s', 'custom_field_4_short');
            if (typeof (customField) === 'undefined' || customField === '') {
                return game.settings.get('od6s', 'custom_field_4');
            } else {
                return game.settings.get('od6s', 'custom_field_4_short');
            }
        })

        Handlebars.registerHelper('getCustomField4Type', function () {
            const thisType = game.settings.get('od6s', 'custom_field_4_type');
            if (thisType === "string") {
                return "text";
            }
            if (thisType === "number") {
                return "number";
            }
        })

        Handlebars.registerHelper('getCustomField4FType', function () {
            const thisType = game.settings.get('od6s', 'custom_field_4_type')
            if (thisType === "string") {
                return "String";
            }

            if (thisType === "number") {
                return "Number";
            }
        })

        Handlebars.registerHelper('isCustomFieldUsed', function (fieldNum, type) {
            const field = 'custom_field_' + fieldNum + '_actor_types';
            const actorTypes = game.settings.get('od6s', field);
            const mask = 1 << OD6S.actorMasks[type];
            return (actorTypes & mask) != 0;
        })

        Handlebars.registerHelper('getCurrencyLabel', function () {
            return OD6S.currencyName;
        })

        Handlebars.registerHelper('actionsCount', async function (actor) {
            return (actor.actions.length);
        })

        Handlebars.registerHelper('setDice', function (dice, actionPenalty, woundPenalty, stunnedPenalty, otherPenalty) {
            let newDice = (+dice) - (+actionPenalty) - (+woundPenalty) - (+stunnedPenalty) - (+otherPenalty);
            if (newDice <= 0) {
                newDice = 0;
            }
            return newDice;
        })

        Handlebars.registerHelper('getAttributeName', function (attribute) {
            return getAttributeName(attribute);
        })

        Handlebars.registerHelper('getAttributeShortName', function (attribute) {
            return getAttributeShortName(attribute);
        })

        Handlebars.registerHelper('getAttributes', function () {
            const active = {};
            for (const attribute in OD6S.attributes) {
                if (OD6S.attributes[attribute].active) active[attribute] = OD6S.attributes[attribute];
            }
            return active;
        })

        Handlebars.registerHelper('getRanges', function () {
            return OD6S.ranges;
        })

        Handlebars.registerHelper('rangeToItem', function (range) {
            return Object.keys(OD6S.ranges).find(key => object[key].name === range).item;
        })

        Handlebars.registerHelper('getStrRange', function (messageId, range, type) {
            const message = game.messages.get(messageId);
            const ranges = message.getFlag('od6s', type);
            const rangeKey = Object.keys(OD6S.ranges).find(key => OD6S.ranges[key].name === range);
            const itemKey = OD6S.ranges[rangeKey].item;
            return ranges[itemKey];
        })

        Handlebars.registerHelper('getDifficultyLevels', function () {
            const levels = [];
            levels.push('- -');
            for (const level in OD6S.difficulty) {
                if(OD6S.difficulty[level].max > 0) {
                    levels.push(level);
                }
            }
            return levels;
        })

        Handlebars.registerHelper('getDifficulties', function () {
            return OD6S.difficulty;
        })

        Handlebars.registerHelper('getDifficultiesShort', function () {
            return OD6S.difficultyShort;
        })

        Handlebars.registerHelper('getDifficultyFromShort', function () {
            return OD6S.difficulty.filter()
        })

        Handlebars.registerHelper('getTerrainDifficulties', function () {
            if (OD6S.vehicleDifficulty) {
                return OD6S.terrain_difficulty;
            } else {
                return Object.fromEntries(
                    Object.entries(OD6S.difficulty).filter(([key]) => key !== 'OD6S.DIFFICULTY_UNKNOWN' &&
                        key !== 'OD6S.DIFFICULTY_CUSTOM'));
            }
        })

        Handlebars.registerHelper('getVehicleSpeeds', function () {
            return OD6S.vehicle_speeds;
        })

        Handlebars.registerHelper('getCollisionTypes', function () {
            return OD6S.collision_types;
        })

        Handlebars.registerHelper('isDefense', function (value) {
            return value === 'dodge' || value === 'parry' || value === 'block' || value === 'vehicledodge';
        })

        Handlebars.registerHelper('useParrySkill', function () {
            return game.settings.get('od6s', 'parry_skills');
        })

        Handlebars.registerHelper('getCover', function (type) {
            return OD6S.cover[type];
        })

        Handlebars.registerHelper('getCalledShot', function () {
            return OD6S.calledShot;
        })

        Handlebars.registerHelper('getGravity', function () {
            return OD6S.gravity;
        })

        Handlebars.registerHelper('getInterstellarDriveName', function () {
            return OD6S.interstellarDriveName;
        })

        Handlebars.registerHelper('isGmOrOwner', function (id) {
            if (game.user.isGM) return true;
            return game.actors.find(a => a.id === id).isOwner;
        })

        Handlebars.registerHelper('getUseFatePoint', function () {
            return game.i18n.localize(OD6S.useAFatePointName);
        })

        Handlebars.registerHelper('isCardVisible', function (message) {
            if (game.user.isGM) return true;
            return message.flags.od6s.isVisible;
        })

        Handlebars.registerHelper('showDifficulty', function () {
            return game.settings.get('od6s', 'show-roll-difficulty');
        })

        Handlebars.registerHelper('showModifiers', function () {
            return game.settings.get('od6s', 'roll-modifiers');
        })

        Handlebars.registerHelper('isHideAllRolls', function () {
            return !game.settings.get('od6s', 'roll-modifiers');
        })

        Handlebars.registerHelper('diceForScale', function () {
            return game.settings.get('od6s', 'dice_for_scale');
        })

        Handlebars.registerHelper('isKnown', function (isKnown) {
            if (game.user.isGM) return true;
            return isKnown;
        })

        Handlebars.registerHelper('isCrewMember', function (actor) {
            return actor.isCrewMember();
        })

        Handlebars.registerHelper('getChatTemplate', function (messageId) {
            const messageType = game.messages.get(messageId).getFlag('od6s', 'type')
            switch (messageType) {
                case "explosive":
                    return OD6S.chatTemplates.explosive;
                case "range":
                    return OD6S.chatTemplates.range;
                case "opposed":
                    return OD6S.chatTemplates.opposed;
                case "damageresult":
                    return OD6S.chatTemplates.damageresult;
                case "attribute":
                case "skill":
                case "specialization":
                case "weapon":
                case "starship-weapon":
                case "vehicle-weapon":
                case "action":
                case "damage":
                case "simple":
                case "resistance":
                case "funds":
                case "incapacitated":
                case "mortally_wounded":
                    return OD6S.chatTemplates.roll;
                default:
                    return OD6S.chatTemplates.generic;
            }
        })

        Handlebars.registerHelper('isExplosiveSet', async (actorUuid,weaponId) => {
            const actor = await od6sutilities.getActorFromUuid(actorUuid);
            const weapon = actor.items.get(weaponId);
        })

        Handlebars.registerHelper('getActorTypeLabel', (type) => {
            return OD6S.actorTypeLabels[type];
        })

        Handlebars.registerHelper('getCyberneticsLocations', () => {
            return OD6S.cyberneticsLocations;
        })

        Handlebars.registerHelper('getCybernetics', function (actor, location) {
            return actor.items.filter(i => i.type === "cybernetic" && i.system.location === location);
        })

        Handlebars.registerHelper('hasCybernetics', function (actor) {
            return actor.items.filter(i => i.type === "cybernetic").length;
        })

        Handlebars.registerHelper('getManifestations', function (actor) {
            return actor.items.filter(i => i.type === "manifestation");
        })

        Handlebars.registerHelper('getConfig', function (key, subKey) {
            if (typeof subKey !== 'undefined' && subKey !== '') {
                return OD6S[key][subKey];
            }
            return OD6S[key];
        })

        Handlebars.registerHelper('getWildDieDefault', function (key) {
            return OD6S.wildDieResult[OD6S.wildDieOneDefault] === key;
        })

        Handlebars.registerHelper('getSystemConfig', function (config) {
            return game.settings.get('od6s', config);
        })

        Handlebars.registerHelper('showScaleDamage', function (v) {
            let string = "";
            v > 0 ? string += "+" : string += "-";
            string += Math.abs(v);
            return string;
        })

        Handlebars.registerHelper('sumManeuverability', function (actor, m, type) {
            if (typeof (m) === 'undefined' || Object.keys(m).length === 0) return;
            let data = {};
            const skillTypes = ["specialization", "skill", 'attribute']
            data.score = 0;
            data.skillScore = 0;
            data.skill = ''

            // Look for a spec, then a skill, then finally attribute
            for (let s of skillTypes) {
                if (s === 'specialization' && typeof (m.specialization.value) !== "undefined" && m.specialization.value !== '') {
                    const spec = actor.items.find(spec => spec.name === m.specialization.value && spec.type === 'specialization');
                    if (spec) {
                        data.score = m.maneuverability.score + spec.system.score + actor.system.attributes[spec.system.attribute].score;
                        data.skillScore = spec.system.score + actor.system.attributes[spec.system.attribute].score;
                        data.skill = spec.name;
                        break;
                    }
                }
                if (s === 'skill' && typeof (m.skill.value) !== "undefined" && m.skill.value !== '') {
                    const skill = actor.items.find(skill => skill.name === m.skill.value && skill.type === 'skill');
                    if (skill) {
                        data.score = m.maneuverability.score + skill.system.score + actor.system.attributes[skill.system.attribute].score;
                        data.skillScore = skill.system.score + actor.system.attributes[skill.system.attribute].score;
                        data.skill = skill.name;
                        break;
                    }
                }
                if (s === 'attribute') {
                    data.score = actor.system.attributes[m.attribute.value].score + m.maneuverability.score;
                    data.skillScore = actor.system.attributes[m.attribute.value].score;
                    data.skill = game.i18n.localize(actor.system.attributes[m.attribute.value].label);
                }
            }
            return data[type];
        })

        Handlebars.registerHelper('getBodyTemplate', function (type) {
            return "systems/od6s/templates/actor/" + type + "/body-sheet.html";
        })

        Handlebars.registerHelper('getHeaderFormTemplate', function (type) {
            return "systems/od6s/templates/actor/" + type + "/header-sheet.html";
        })

        Handlebars.registerHelper('displayCharacterTemplateClear', function (actor) {
            const template = actor.items.find(E => E.type === 'character-template');
            if (actor.sheetmode === 'freeedit') {
                if (template) {
                    return true;
                } else {
                    return false;
                }
            }
        })

        Handlebars.registerHelper('displaySpeciesTemplateClear', function (actor) {
            const template = actor.items.find(E => E.type === 'species-template');
            if (template) {
                return true;
            } else {
                return false;
            }
        })

        Handlebars.registerHelper('getHitLocation', function (type, location) {

            if (OD6S.randomHitLocations && location !== '') {
                if (type !== 'vehicle' && type !== 'starship') {
                    return game.i18n.localize("OD6S.LOCATION") + ":" + " " + game.i18n.localize(location);
                }
            } else {
                return '';
            }
        })

        Handlebars.registerHelper('showWounds', function () {
            return (OD6S.woundConfig < 2);
        })

        Handlebars.registerHelper('showBodyPoints', function () {
            return (OD6S.woundConfig > 0);
        })

        Handlebars.registerHelper('showBodyPointsDamage', function (isVehicle) {
            return (game.settings.get('od6s', 'bodypoints') > 0
                && !isVehicle);
        })

        Handlebars.registerHelper('getBodyPointsLabel', function () {
            return OD6S.bodyPointsName;
        })

        Handlebars.registerHelper('getWoundLevel', function (actor) {
            return actor.getWoundLevelFromBodyPoints();
        })

        Handlebars.registerHelper('getCargoHoldItems', function (itemType, actorType) {
            return !OD6S.allowedItemTypes[actorType].includes(itemType);
        })

        Handlebars.registerHelper('getWoundsTemplate', function () {
            return "systems/od6s/templates/actor/common/wounds.html";
        })

        Handlebars.registerHelper('flatSkills', function () {
            return OD6S.flatSkills;
        })

        Handlebars.registerHelper('getCost', function () {
            return OD6S.cost;
        })

        Handlebars.registerHelper('getPrices', function () {
            return OD6S.difficultyShort;
        })

        Handlebars.registerHelper('getContainerItemCategories', function () {
            const categories = {};
            for (let i of OD6S.allowedItemTypes['container']) {
                categories[i] = OD6S.itemLabels[i]
            }
            return categories;
        })

        Handlebars.registerHelper('getCheckedItemType', function (key, itemTypes) {
            return Boolean(itemTypes[key]);
        })

        Handlebars.registerHelper('getContainerItems', function (type, items) {
            const categoryItems = items.filter(i => i.type === type);
            return categoryItems;
        })

        Handlebars.registerHelper('isGM', function () {
            return game.user.isGM;
        })

        Handlebars.registerHelper('getCharacterInventoryForContainer', function () {
            const items = game.user.character.items.filter(i => OD6S.equippable.includes(i.type));
            return game.user.character.items.filter(i => OD6S.equippable.includes(i.type));
        })

        Handlebars.registerHelper('getCharacterActorId', function () {
            return game.user.character.id;
        })

        Handlebars.registerHelper('and', function () {
            // Get function args and remove last one (meta object); every(Boolean) checks AND
            return Array.prototype.slice.call(arguments, 0, arguments.length - 1).every(Boolean);
        });

        Handlebars.registerHelper('or', function () {
            // Get function args and remove last one (meta object); some(Boolean) checks OR
            return Array.prototype.slice.call(arguments, 0, arguments.length - 1).some(Boolean);
        });

        Handlebars.registerHelper('isAttributeActive', function (attribute) {
            return OD6S.attributes[attribute].active;
        })

        // Returns true for attributes that only appear on creature sheets (e.g. Orneriness)
        Handlebars.registerHelper('isCreatureOnlyAttribute', function (key) {
            return OD6S.attributes[key]?.creatureOnly === true;
        })

        // Returns true for attributes excluded from the creature sheet (Knowledge, Mechanical, Technical)
        Handlebars.registerHelper('isCreatureExcluded', function (key) {
            return OD6S.creatureExcludedAttributes?.has(key) ?? false;
        })

        Handlebars.registerHelper('getActiveAttributes', function (attributes) {
            const active = {};
            for (const attr in attributes) {
                if(attributes[attr].active) {
                    active[attr] = attributes[attr];
                }
            }
            return active;
        })

        Handlebars.registerHelper('showPenalties', function (type) {
            return (type !== 'funds' &&
                type !== 'resistance' &&
                type !== 'incapacitated' &&
                type !== 'mortally_wounded')
        });

        await loadHandleBarTemplates();
    })
}

async function loadHandleBarTemplates() {
    const charPath = 'systems/od6s/templates/actor/character/';
    const charTabPath = charPath + 'tabs/';
    const containerPath = 'systems/od6s/templates/actor/container/';
    const commonPath = 'systems/od6s/templates/actor/common/';
    const commonTabPath = 'systems/od6s/templates/actor/common/tabs/';
    const npcPath = 'systems/od6s/templates/actor/npc/';
    const npcTabPath = npcPath + 'tabs/';
    const creaturePath = 'systems/od6s/templates/actor/creature/';
    const creatureTabPath = creaturePath + 'tabs/';
    const vehiclePath = 'systems/od6s/templates/actor/vehicle/'
    const vehicleTabPath = 'systems/od6s/templates/actor/vehicle/tabs/'
    const starshipPath = 'systems/od6s/templates/actor/starship/'
    const starshipTabPath = 'systems/od6s/templates/actor/starship/tabs/'
    const chatPath = 'systems/od6s/templates/chat/'
    const templatePaths = [
        charTabPath + "biography.html",
        charTabPath + "attributes.html",
        charTabPath + "inventory.html",
        charTabPath + "metaphysics.html",
        commonTabPath + "attribute-column.html",
        commonTabPath + "cybernetics.html",
        commonTabPath + "special-abilities.html",
        commonTabPath + "combat.html",
        commonTabPath + "data.html",
        commonTabPath + "vehicle.html",
        commonTabPath + "description.html",
        commonTabPath + "cargo-hold.html",
        commonTabPath + "cargo-hold.html",
        npcTabPath + "main.html",
        creatureTabPath + "main.html",
        chatPath + "generic.html",
        chatPath + "roll.html",
        chatPath + "opposed.html",
        chatPath + "damageresult.html",
        chatPath + "explosive.html",
        chatPath + "explosive-button.html",
        chatPath + "range.html",
        chatPath + "chat-inner.html",
        "systems/od6s/templates/item/item-effects.html",
        "systems/od6s/templates/item/item-labels-tags.html",
        charPath + "body-sheet.html",
        charPath + "header-sheet.html",
        charPath + "create-character-template.html",
        charPath + "create-character-skills.html",
        charPath + "create-attribute-column.html",
        charPath + "create-attribute-column-custom.html",
        charPath + "create-skill-column.html",
        commonPath + "wounds.html",
        containerPath + "body-sheet.html",
        containerPath + "header-sheet.html",
        npcPath + "header-sheet.html",
        npcPath + "body-sheet.html",
        creaturePath + "header-sheet.html",
        creaturePath + "body-sheet.html",
        vehiclePath + "body-sheet.html",
        vehiclePath + "body-sheet.html",
        vehiclePath + "header-sheet.html",
        vehicleTabPath + "main.html",
        vehicleTabPath + "data.html",
        starshipPath + "body-sheet.html",
        starshipPath + "header-sheet.html",
        starshipPath + "header-sheet.html",
        starshipTabPath + "main.html",
        starshipTabPath + "data.html"
    ]
    return loadTemplates(templatePaths);
}
