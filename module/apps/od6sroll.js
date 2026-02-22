import {od6sutilities} from "../system/utilities.js";
import ExplosiveDialog from "./explosive-dialog.js";
import OD6S from "../config/config-od6s.js";

export class InitRollDialog extends Dialog {
    constructor(caller, data, options) {
        super(data, options);
        this.rollData = caller.rollData;
        this.cpLimit = OD6S.characterPointLimits.initiative;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.cpup').click(async () => {
            if ((+this.rollData.characterpoints) >= this.cpLimit) {
                ui.notifications.warn(game.i18n.localize("OD6S.MAX_CP"));
            } else if ((+this.rollData.characterpoints) >= this.rollData.actor.system.characterpoints.value) {
                ui.notifications.warn(game.i18n.localize("OD6S.NOT_ENOUGH_CP_ROLL"));
            } else {
                this.rollData.characterpoints++;
                await this.updateDialog();
            }
        });

        html.find('.bonusdice').change(async ev => {
            this.rollData.bonusdice = (+ev.target.valueAsNumber);
            //this.rollData.bonusdice = ev.currentTarget.dataset.bonusdice;
        })

        html.find('.bonuspips').change(async ev => {
            this.rollData.bonuspips = (+ev.target.valueAsNumber);
        })

        html.find('.cpdown').click(async () => {
            if (this.rollData.characterpoints > 0) {
                this.rollData.characterpoints--;
            }
            await this.updateDialog();
        });

        html.find('.usewilddie').click(async () => {
            this.rollData.wilddie = !Boolean(this.rollData.wilddie);
            await this.updateDialog();
        });
    }

    async updateDialog() {
        this.rollData.characterpoints > this.rollData.actor.system.characterpoints.value ? this.rollData.cpcostcolor = "red" :
            this.rollData.cpcostcolor = "black";
        const initTemplate = "systems/od6s/templates/initRoll.html";
        this.content = await renderTemplate(initTemplate, this.rollData);
        this.render();
    }
}

export class od6sInitRoll {

    activateListeners(html) {
        super.activateListeners(html);
    }

    static async _onInitRollDialog(combat, combatant) {
        const combatantId = combatant.id;
        const actor = combatant.actor;
        const actorData = actor.system;
        let initScore = actorData.initiative.score + actor.system.roll_mod;
        const dice = od6sutilities.getDiceFromScore(initScore).dice;
        const pips = od6sutilities.getDiceFromScore(initScore).pips;
        this.rollData = {
            label: game.i18n.localize('OD6S.INITIATIVE'),
            title: game.i18n.localize('OD6S.INITIATIVE'),
            dice: dice,
            pips: pips,
            wilddie: game.settings.get('od6s', 'use_wild_die'),
            showWildDie: game.settings.get('od6s', 'use_wild_die'),
            characterpoints: 0,
            cpcost: 0,
            cpcostcolor: "black",
            bonusdice: 0,
            bonuspips: 0,
            actor: actor,
            combat: combat,
            combatantId: combatantId,
            template: "systems/od6s/templates/initRoll.html"
        }

        const html = await renderTemplate(this.rollData.template, this.rollData);
        new InitRollDialog(this, {
            title: game.i18n.localize("OD6S.ROLL") + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.ROLL"),
                    callback: () => od6sInitRoll.initRollAction(
                        this
                    )
                }
            },
            default: "submit"
        }).render(true);
    }

    static async initRollAction(caller) {
        let rollString;
        let cpString;
        const rollData = caller.rollData;

        // Wild die explodes on a 6
        if (rollData.wilddie) {
            rollData.dice = (+rollData.dice) - 1;
            rollString = rollData.dice;
            rollString += "d6" + game.i18n.localize("OD6S.BASE_DIE_FLAVOR") + "+1dw" +
                game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
        } else {
            rollString = rollData.dice + "d6" + game.i18n.localize("OD6S.BASE_DIE_FLAVOR");
        }

        if (rollData.pips > 0) {
            rollString += "+" + rollData.pips;
        }

        // Character point dice also explode on a 6
        if (rollData.characterpoints > 0) {
            cpString = "+" + rollData.characterpoints + "db" +
                game.i18n.localize("OD6S.CHARACTER_POINT_DIE_FLAVOR");
            rollString += cpString;
        }

        // Bonus pips are not calculated to add new dice, just a bonus
        if (rollData.bonusdice > 0) {
            rollString += "+" + rollData.bonusdice + "d6" + game.i18n.localize("OD6S.BONUS_DIE_FLAVOR")
        }
        if (rollData.bonuspips > 0) {
            rollString += "+" + rollData.bonuspips;
        }

        // Add fraction of AGI and mods to break ties
        const fraction = ((+rollData.actor.system.attributes.per.score) * 0.01 +
            (+rollData.actor.system.initiative.mod) * 0.01 +
            (+rollData.actor.system.attributes.agi.score) * 0.01).toPrecision(2);
        rollString = rollString + "+" + (+fraction);

        // Apply costs
        if ((rollData.characterpoints > 0) && (rollData.actor.system.characterpoints.value > 0)) {
            const update = {};
            update.system = {};
            update.system.characterpoints = {};
            update.id = rollData.actor.id;
            update.system.characterpoints.value = rollData.actor.system.characterpoints.value -= rollData.characterpoints;
            await rollData.actor.update(update, {diff: true});
        }

        const messageOptions = {
            'flags.od6s.canUseCp': true
        };
        if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) messageOptions.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
        await game.combats.active.rollInitiative(rollData.combatantId, {
            "formula": rollString,
            "messageOptions": messageOptions
        });
    }
}

export class RollDialog extends Dialog {

    constructor(actorSheet, data, options) {
        super(data, options);
        this.actorSheet = actorSheet;
        this.rollData = this.actorSheet.rollData;
        this.cpLimit = OD6S.characterPointLimits;
    }

    activateListeners(html) {

        super.activateListeners(html);

        html.find('.cpup').click(async () => {
            let rollType = this.rollData.type;
            let actor = this.rollData.actor;
            if(rollType === 'weapon') {
                const item = this.rollData.actor.items.find(i=>i.id===this.rollData.itemid);
                const spec = item.system.specialization;
                if (actor.items.find(i=>i.type === 'specialization' && i.name === spec)) {
                    rollType = 'specialization'
                } else if (actor.items.find(i=>i.type === 'skill' && i.name === item.skill)) {
                    rollType = 'skill'
                } else {
                    rollType = 'attribute'
                }
            }

            if (rollType === "skill") {
                // Check if it is a dodge or parry
                if (this.rollData.title.includes("Parry")) {
                    rollType = "parry";
                } else if (this.rollData.title.includes("Dodge")) {
                    rollType = "dodge";
                } else if (this.rollData.title.includes("Block")) {
                    rollType = "block";
                }
            }

            if (this.rollData.subtype === 'vehicledodge') {
                rollType = "dodge";
            }
            if (this.rollData.subtype === 'parry') {
                rollType = "parry";
            }

            if ((+this.rollData.characterpoints) >= this.cpLimit[rollType]) {
                ui.notifications.warn(game.i18n.localize("OD6S.MAX_CP"));
            } else if ((+this.rollData.characterpoints) >= this.rollData.actor.system.characterpoints.value) {
                ui.notifications.warn(game.i18n.localize("OD6S.NOT_ENOUGH_CP_ROLL"));
            } else {
                this.rollData.characterpoints++;
                await this.updateDialog();
            }
        });

        html.find('.useattribute').change(async ev => {
            // Player has changed the underlying attribute to use for the roll, recalculate
            this.rollData.attribute = ev.target.value;
            const attributeScore = this.rollData.actor.system.attributes[ev.target.value].score;
            const skillScore = this.rollData.actor.items.filter(i => i.name === this.rollData.label)[0].system.score;
            const newScore = (+attributeScore) + (+skillScore);
            const newDice = od6sutilities.getDiceFromScore(newScore);
            this.rollData.dice = newDice.dice;
            this.rollData.pips = newDice.pips;
            await this.updateDialog();
        })

        html.find('.scaledice').change(async ev => {
            this.rollData.scaledice = (+ev.target.valueAsNumber);
        })

        html.find('.bonusdice').change(async ev => {
            this.rollData.bonusdice = (+ev.target.valueAsNumber);
            //this.rollData.bonusdice = ev.currentTarget.dataset.bonusdice;
        })

        html.find('.bonuspips').change(async ev => {
            this.rollData.bonuspips = (+ev.target.valueAsNumber);
        })

        html.find('.cpdown').click(async () => {
            if (this.rollData.characterpoints > 0) {
                this.rollData.characterpoints--;
            }
            await this.updateDialog();
        });

        html.find('.timer').change(async ev => {
            const item = this.rollData.actor.items.find(i=>i.id === this.rollData.itemid);
            await item.setFlag('od6s','explosiveTimer', ev.target.valueAsNumber);
            this.rollData.timer = ev.target.valueAsNumber;
            await this.updateDialog();
        })

        html.find('.contact').change(async ev => {
            const item = this.rollData.actor.items.find(i=>i.id === this.rollData.itemid);
            await item.setFlag('od6s','explosiveTimer', 0);
            this.rollData.contact = !this.rollData.contact;
            this.rollData.timer = "";
            await this.updateDialog();
        })

        html.find('.usefatepoint').click(async () => {
            this.rollData.fatepoint = !Boolean(this.rollData.fatepoint);
            if (this.rollData.fatepoint && (this.rollData.actor.system.fatepoints.value <= 0)) {
                ui.notifications.warn(game.i18n.localize("OD6S.NOT_ENOUGH_FP_ROLL"));
                this.rollData.fatepoint = !Boolean(this.rollData.fatepoint);
            }
            if (this.rollData.fatepoint) {
                this.rollData.dice = this.rollData.dice * 2;
                this.rollData.pips = this.rollData.pips * 2;
            } else {
                this.rollData.dice = this.rollData.originaldice;
                this.rollData.pips = this.rollData.originalpips;
            }
            await this.updateDialog();
        });

        html.find('.usewilddie').click(async () => {
            this.rollData.wilddie = !Boolean(this.rollData.wilddie);
            await this.updateDialog();
        });

        html.find('.fulldefense').click(async () => {
            this.rollData.fulldefense = !Boolean(this.rollData.fulldefense);
            // Full defense negates stun on the following turn
            if (this.rollData.actor.system.stuns.current) {
                if (this.rollData.actor.system.stuns.rounds > 0) {
                    if(this.rollData.fulldefense) {
                        this.rollData.stunnedpenalty = 0;
                    } else {
                        this.rollData.stunnedpenalty = this.rollData.actor.system.stuns.current;
                    }
                }
            }
            await this.updateDialog();
        });

        html.find('.stun').click(async () => {
            this.rollData.stun = !Boolean(this.rollData.stun);
            await this.updateDialog;
        })

        html.find('.difficulty').change(async (ev) => {
            this.rollData.difficulty = (+ev.target.valueAsNumber);
            await this.updateDialog();
        })

        html.find('.actionpenalty').change(async (ev) => {
            this.rollData.actionpenalty = (+ev.target.valueAsNumber);
            await this.updateDialog();
        })

        html.find('.woundpenalty').change(async (ev) => {
            this.rollData.woundpenalty = (+ev.target.valueAsNumber);
            await this.updateDialog();
        })

        html.find('.stunnedpenalty').change(async (ev) => {
            this.rollData.stunnedpenalty = (+ev.target.valueAsNumber);
            await this.updateDialog();
        })

        html.find('.otherpenalty').change(async (ev) => {
            this.rollData.otherpenalty = (+ev.target.valueAsNumber);
            await this.updateDialog();
        })

        html.find('.shots').change(async (ev) => {
            this.rollData.shots = (+ev.target.valueAsNumber);
            await this.updateDialog();
        })

        html.find('.target').change(async (ev) => {
            this.rollData.target = ev.target.value;
            await this.updateDialog();
        })

        html.find('.difficultylevel').change(async (ev) => {
            if (typeof (ev.currentTarget.dataset.skill) !== 'undefined') {
                this.rollData.skills[ev.currentTarget.dataset.skill].difficulty = ev.target.value;
            } else {
                this.rollData.difficultylevel = ev.target.value;
            }
            await this.updateDialog();
        })

        html.find('.range').change(async (ev) => {
            this.rollData.modifiers.range = ev.target.value;
            await this.updateDialog();
        })

        html.find('.attackoption').change(async (ev) => {
            this.rollData.multishot = ev.target.value === 'OD6S.ATTACK_RANGED_SINGLE_FIRE_AS_MULTI';
            this.rollData.modifiers.attackoption = ev.target.value;
            await this.updateDialog();
        })

        html.find('.calledshot').change(async (ev) => {
            this.rollData.modifiers.calledshot = ev.target.value;
            await this.updateDialog();
        })

        html.find('.cover').change(async (ev) => {
            this.rollData.modifiers.cover = ev.target.value;
            await this.updateDialog();
        })

        html.find('.coverlight').change(async (ev) => {
            this.rollData.modifiers.coverlight = ev.target.value;
            await this.updateDialog();
        })

        html.find('.coversmoke').change(async (ev) => {
            this.rollData.modifiers.coversmoke = ev.target.value;
            await this.updateDialog();
        })

        html.find('.miscmod').change(async (ev) => {
            this.rollData.modifiers.miscmod = ev.target.value;
            await this.updateDialog();
        })

        html.find('.vehiclespeed').change(async (ev) => {
            this.rollData.vehiclespeed = ev.target.value;
        })

        html.find('.vehiclecollisiontype').change(async (ev) => {
            this.rollData.vehiclecollisiontype = ev.target.value;
        })

        html.find('.vehicleterraindifficulty').change(async (ev) => {
            this.rollData.vehicleterraindifficulty = ev.target.value;
        })

        html.closest('.window-app.dialog').find('.header-button.close').click(async (ev) => {
                await od6sroll.cancelAction(ev);
        })
    }

    async updateDialog() {
        if (this.rollData.actor.type === 'character') {
            this.rollData.characterpoints > this.rollData.actor.system.characterpoints.value ? this.rollData.cpcostcolor = "red" :
                this.rollData.cpcostcolor = "black";
        }
        this.data.content = await renderTemplate(this.rollData.template, this.rollData);
        this.render();
    }
}

export class od6sroll {

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _onRollItem(event) {
        const item = this.actor.items.find(i => i.id === event.currentTarget.dataset.itemId);
        if ((this.actor.type === 'vehicle' || this.actor.type === 'starship') && this.actor.system.embedded_pilot) {
            return item.roll();
        }
        if (item.system?.subtype.includes("vehicle")) {
            if (item.system.subtype === 'vehiclerangedweaponattack') {
                return this.actor.rollAction(item.system.itemId);
            } else if (item.system.subtype === 'vehiclesensors') {
                if (game.settings.get('od6s', 'sensors')) {
                    if (item.name.includes(game.i18n.localize('OD6S.SENSORS_PASSIVE'))) {
                        return this.actor.rollAction('vehiclesensorspassive');
                    } else if (item.name.includes(game.i18n.localize('OD6S.SENSORS_SCAN'))) {
                        return this.actor.rollAction('vehiclesensorsscan');
                    } else if (item.name.includes(game.i18n.localize('OD6S.SENSORS_SEARCH'))) {
                        return this.actor.rollAction('vehiclesensorssearch');
                    } else if (item.name.includes(game.i18n.localize('OD6S.SENSORS_FOCUS'))) {
                        return this.actor.rollAction('vehiclesensorsfocus');
                    }
                }
            } else {
                return this.actor.rollAction(item.system.subtype);
            }
        } else {
            return item.roll();
        }
    }

    async _onRollEvent(event) {
        event.preventDefault();
        const eventData = {};
        const dataset = event.currentTarget.dataset;

        let score = dataset.score;
        if (typeof score === "string") {
            score = parseInt(score.replace(/['"]+/g, ''));
        }

        eventData.name = dataset.label;
        eventData.score = score;
        eventData.type = dataset.type;
        eventData.actor = this.actor;
        eventData.token = dataset.token;
        eventData.itemId = dataset.itemId ? dataset.itemId : "";
        eventData.subtype = dataset?.subtype;

        await od6sroll._onRollDialog(eventData);
    }

    async rollPurchase(data) {
        await this._onRollDialog(data);
    }

    static async _metaphysicsRollDialog(item, actor) {
        const skills = {};

        for (let s in item.system.skills) {
            let name;
            switch (s) {
                case 'channel':
                    name = OD6S.channelSkillName;
                    break;
                case 'sense':
                    name = OD6S.senseSkillName;
                    break;
                case 'transform':
                    name = OD6S.transformSkillName;
                    break;
                default:
                    break;
            }
            if (item.system.skills[s].value) {
                const skill = actor.items.filter(i => i.name === name);
                if (typeof (skill[0]) !== 'undefined') {
                    skills[s] = {};
                    skills[s].difficulty = OD6S.difficultyShort[item.system.skills[s].difficulty];
                    skills[s].skill = skill[0];
                } else {
                    return ui.notifications.warn(
                        OD6S.metaphysicsSkills[s] + game.i18n.localize("OD6S.WARN_SKILL_NOT_FOUND")
                    )
                }
            }
        }

        const actions = Object.keys(skills).length;
        const actionpenalty = (+actions) + (actor.actions.length) - 1;
        const stunnedpenalty = actor.system.stuns.current;

        this.rollData = {
            title: item.name,
            skills: skills,
            wilddie: (game.settings.get('od6s', 'use_wild_die') && actor.system.use_wild_die),
            showWildDie: game.settings.get('od6s', 'use_wild_die'),
            actor: actor,
            actionpenalty: actionpenalty,
            stunnedpenalty: stunnedpenalty,
            template: "systems/od6s/templates/metaphysicsRoll.html"
        }

        const html = await renderTemplate(this.rollData.template, this.rollData);

        new RollDialog(this, {
            title: game.i18n.localize("OD6S.ROLL") + " " + item.name + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.ROLL"),
                    callback: () => od6sroll.rollAction(this)
                }
            },
            default: "submit"
        }).render(true);
    }

    static async _onRollDialog(data) {
        let attribute;
        let range = "OD6S.RANGE_POINT_BLANK_SHORT";
        let woundPenalty = 0;
        let damageType = '';
        let damageScore = 0;
        let stunDamageType = '';
        let stunDamageScore = 0;
        let damageModifiers = [];
        let targets = [];
        let difficulty = 0;
        let isAttack = false;
        let isVisible = false;
        let isOpposable = false;
        let isKnown = false;
        let difficultyLevel = game.settings.get('od6s','default_unknown_difficulty') ? 'OD6S.DIFFICULTY_UNKNOWN' : 'OD6S.DIFFICULTY_EASY';
        let bonusmod = 0;
        let bonusdice = {};
        let penaltydice = 0;
        let miscMod = 0;
        let scaleMod = 0;
        let scaleDice = 0;
        let canUseCp = true;
        let canUseFp = true;
        let vehicle = '';
        let vehicleSpeed = 'cruise';
        let vehicleCollisionType = 't_bone';
        let vehicleTerrainDifficulty = 'OD6S.DIFFICULTY_EASY';
        let damageSource = '';
        let attackerScale = 0;
        let defenderScale = 0;
        let flatPips = 0;
        let specSkill = '';
        let isExplosive = false;
        let timer = 0;
        let contact = false;
        let canStun = false;
        let onlyStun = false;
        let actorToken = data.actor.isToken ? data.actor.token : data.actor.getActiveTokens()[0];

        if (typeof(data.itemId) !== 'undefined' && data.itemId !== '') {
            let item = data.actor.items.get(data.itemId);
            if(typeof(item) === 'undefined') {
                if (data.type === 'action' && data.subtype === 'vehiclerangedweaponattack') {
                    item = data.actor.system.vehicle.vehicle_weapons.find(i=>i.id === data.itemId);
                }
            }
            if(item.system.subtype?.toLowerCase()=== 'explosive') {
                isExplosive = true;
                if(!item.getFlag('od6s','explosiveSet')) {
                    const exdata = {};
                    exdata.options = OD6S.explosives;
                    exdata.item = item;
                    exdata.actor = data.actor;
                    //exdata.token = actorToken;
                    exdata.type = 'OD6S.EXPLOSIVE_THROWN';
                    exdata.auto = game.settings.get('od6s', 'auto_explosive');

                    await new ExplosiveDialog(exdata).render(true);
                    return;
                }
            }
        }

        if (typeof (data.flatpips) !== 'undefined' && data.flatpips > 0) {
            flatPips = data.flatpips;
        }

        if ((data.type === 'funds' || data.type === 'purchase') && !OD6S.fundsFate) {
            canUseCp = false;
            canUseFp = false;
        }

        if (OD6S.vehicleDifficulty) {
            vehicleTerrainDifficulty = 'OD6S.TERRAIN_EASY';
        }

        if ((typeof (data.subtype) !== 'undefined' && data.subtype.includes('vehicle'))
            || data.type.includes('vehicle')) {
            if (data.actor.type === 'vehicle' || data.actor.type === 'starship') {
                vehicle = data.actor.uuid;
            } else {
                vehicle = data.actor.system.vehicle.uuid;
            }
        }

        if (typeof (data.difficulty) !== 'undefined') {
            difficulty = data.difficulty;
        }

        if (typeof (data.difficultyLevel) !== 'undefined') {
            difficultyLevel = data.difficultyLevel;
        }

        if (data.actor.system.sheetmode.value !== "normal") {
            ui.notifications.warn(game.i18n.localize("OD6S.WARN_SHEET_MODE_NOT_NORMAL"));
            return;
        }

        if (data.subtype === game.i18n.localize('OD6S.RANGED') ||
            data.subtype === game.i18n.localize('OD6S.THROWN') ||
            data.subtype === game.i18n.localize('OD6S.MISSILE') ||
            data.subtype === game.i18n.localize('OD6S.EXPLOSIVE')) {
            data.subtype = "rangedattack";
            isAttack = true;
        }

        if (data.subtype === game.i18n.localize('OD6S.MELEE')) {
            data.subtype = "meleeattack"
            isAttack = true;
        }

        if (game.user.targets.size > 0) {
            // Push each targeted token onto the targets array
            game.user.targets.forEach((t) => {
                targets.push(t);
            })
        }

        if (data.subtype === 'meleeattack' || data.subtype === 'brawlattack') {
            if (targets.length > 0 && OD6S.meleeRange) {
                // Check if target is adjacent
                const actorToken = data.actor.getActiveTokens()[0];
                // Adjust for token size
                const fudge = Math.floor((((actorToken.width + targets[0].width)/canvas.grid.size) * 0.5) - 1);
                const distance = Math.floor(canvas.grid.measurePath([actorToken.center, targets[0].center]).distance) - fudge;
                if(distance !== 0 && distance/canvas.grid.distance > 1.5) {
                    ui.notifications.warn(game.i18n.localize('OD6S.OUT_OF_MELEE_BRAWL_RANGE'));
                    return false;
                }
            }
        }

        // See if this is a weapon attack
        if (data.type === 'weapon' || data.type === 'starship-weapon' || data.type === 'vehicle-weapon') {
            const weapon = data.actor.getEmbeddedDocument('Item', data.itemId);
            damageSource = weapon.name;
            damageType = weapon.system.damage.type;
            damageScore = weapon.system.damage.score;
            stunDamageType = weapon.system?.stun?.type;
            stunDamageScore = weapon.system?.stun?.score;
            isAttack = true;
            if (data.subtype === 'meleeattack') {
                damageScore = od6sutilities.getMeleeDamage(data.actor, weapon);
                if (stunDamageScore > 0) {
                    stunDamageScore = weapon.system.damage.str ? stunDamageScore + data.actor.system.strengthdamage.score : stunDamageScore;
                }
            }
            if (weapon.system.scale.score) attackerScale = weapon.system.scale.score;
            if (weapon.system.mods.damage !== 0) damageScore += weapon.system.mods.damage;
            if (weapon.system.mods.difficulty !== 0) miscMod += weapon.system.mods.difficulty;
            if (weapon.system.mods.attack !== 0) bonusmod += weapon.system.mods.attack;

            if (OD6S.meleeDifficulty) {
                weapon.system.difficulty ? difficultyLevel = weapon.system.difficulty : difficultyLevel = 'OD6S.DIFFICULTY_EASY';
            }

            if(isExplosive) {
                onlyStun = weapon.system.stun?.stun_only;
                if (game.settings.get('od6s','explosive_zones')) {
                    canStun = onlyStun || weapon.system.blast_radius["1"].stun_damage > 0;
                } else {
                    canStun = onlyStun || weapon.system.stun.damage > 0;
                }
            } else {
                onlyStun = weapon.system.stun?.stun_only;
                canStun = onlyStun || weapon.system.stun?.score > 0 ;
            }

            if(data.subtype === 'rangedattack') {
                data.range = await od6sutilities.getWeaponRange(data.actor, weapon);
                if (data.range === false) return false;
            } else {
                data.range = weapon.system.range;
            }

            //onlyStun = weapon.system?.stun?.stun_only;
            //canStun = weapon.system?.stun?.score > 0 || onlyStun;

            /*if (data.subtype === 'meleeattack') {
                const strmod = {
                    "name": 'OD6S.STRENGTH_DAMAGE_BONUS',
                    "value": data.actor.system.strengthdamage.score
                }
                damageModifiers.push(strmod);
            }*/

            if (weapon.system.damaged > 0) {
               const damageMod = {
                   "name": 'OD6S.WEAPON_DAMAGED',
                   "value": -(OD6S.weaponDamage[weapon.system.damaged].penalty),
                   "level": OD6S.weaponDamage[weapon.system.damaged].label
               }
               damageModifiers.push(damageMod);
            }

            if (weapon.system.damage.muscle) {
                const strmod = {
                    "name": 'OD6S.STRENGTH_DAMAGE_BONUS',
                    "value": data.actor.system.strengthdamage.score
                }
                damageModifiers.push(strmod);
            }

            // Check for effect modifiers
            const stats = weapon.system.stats
            let found = false;
            if (typeof (stats.specialization) !== 'undefined' && stats.specialization !== '') {
                if (data.actor.items.filter(i => i.type === 'specialization' && i.name === stats.specialization)) {
                    bonusmod += (+this.getEffectMod('specialization', stats.specialization, data.actor));
                    found = true;
                }
            }

            if (!found && typeof (stats.skill) !== 'undefined' && stats.skill !== '') {
                if (data.actor.items.filter(i => i.type === 'skill' && i.name === stats.skill)) {
                    bonusmod += (+this.getEffectMod('skill', stats.skill, data.actor));
                }
            }
        }

        if (data.subtype === 'vehiclerangedweaponattack') {
            let vehicleWeapon = {};
            if (data.actor.type === 'vehicle') {
                if (data.actor.system.embedded_pilot) {
                    vehicleWeapon = data.actor.items.filter(i => i._id === data.itemId)[0];
                } else {
                    vehicleWeapon = data.actor.vehicle_weapons.filter(i => i._id === data.itemId)[0];
                }
            } else if (data.actor.type === 'starship') {
                if (data.actor.system.embedded_pilot) {
                    vehicleWeapon = data.actor.items.filter(i => i._id === data.itemId)[0];
                } else {
                    vehicleWeapon = data.actor.starship_weapons.filter(i => i._id === data.itemId)[0];
                }
            } else {
                vehicleWeapon = data.actor.system.vehicle.vehicle_weapons.filter(i => i.id === data.itemId)[0];
            }

            isAttack = true;
            if (typeof (vehicleWeapon) !== 'undefined') {
                damageScore = vehicleWeapon.system.damage.score;
                damageType = vehicleWeapon.system.damage.type;
                if (vehicleWeapon.system.mods.damage !== 0) damageScore += vehicleWeapon.system.mods.damage;
                if (vehicleWeapon.system.mods.difficulty !== 0) miscMod += vehicleWeapon.system.mods.difficulty;
                if (vehicleWeapon.system.mods.attack !== 0) bonusmod += vehicleWeapon.system.mods.attack;
                if (vehicleWeapon.system.scale.score) {
                    attackerScale = vehicleWeapon.system.scale.score;
                } else if (data.actor.type === 'vehicle' || data.actor.type === 'starship' || data.actor.system?.embedded_pilot) {
                    attackerScale = data.actor.system.scale.score;
                } else {
                    attackerScale = data.actor.system.vehicle.scale.score;
                }
            } else {
                damageScore = data.damage;
                damageType = data.damage_type;
                attackerScale = data.actor.system.vehicle.scale.score;
            }
            damageSource = data.name;
        }

        if (data.subtype === 'vehicleramattack') {
            damageType = 'p';
            damageSource = 'OD6S.COLLISION';
            isAttack = true;
            const vehicle = (data.actor.type === 'starship' || data.actor.type === 'starship') ? data.actor.system : data.actor.system.vehicle
            if (vehicle.ram_damage.score > 0) {
                const rangedmod = {
                    "name": 'OD6S.ACTIVE_EFFECTS',
                    "value": vehicle.ram_damage.score
                }
                damageModifiers.push(rangedmod);
            }
            if (vehicle.ram.score > 0) {
                bonusmod += (+vehicle.ram.score);
            }
        }

        if (data.type === 'brawlattack' || data.subtype === 'brawlattack') {
            damageType = 'p';
            damageScore = data.actor.system.strengthdamage.score;
            isAttack = true;
            canStun = true;
            stunDamageScore = damageScore;
            stunDamageType = 'p';
        }

        if (data.type === 'vehicletoughness') {
            canUseCp = canUseFp = false;
            data.subtype = data.type;
            data.type = 'resistance';
        }

        if (targets.length === 1) {
            if (!attackerScale && isAttack) {
                if (typeof (data.subtype) !== 'undefined' && data.subtype.includes('vehicle')) {
                    if (data.actor.system.crew.value) {
                        attackerScale = data.actor.system.scale.score;
                    } else {
                        attackerScale = data.actor.system.vehicle.scale.score;
                    }
                } else {
                    if (typeof (data.actor.system.scale.score) === 'undefined') {
                        attackerScale = 0;
                    } else {
                        attackerScale = data.actor.system.scale.score;
                    }
                }
            }

            if (typeof (targets[0].actor.system.scale.score) === 'undefined') {
                defenderScale = 0;
            } else {
                defenderScale = targets[0].actor.system.scale.score;
            }
            if (attackerScale !== defenderScale) {
                scaleMod = attackerScale - defenderScale;
            }
        }

        if (data.type === 'action') {
            let skill = '';
            switch (data.subtype) {
                case 'vehicletoughness':
                    canUseCp = canUseFp = false;
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    data.type = 'resistance';
                    break;
                case 'attribute':
                    data.score = data.actor.system.attributes[data.attribute].score;
                    isVisible = !game.settings.get('od6s', 'hide-skill-cards');
                    break;
                case 'vehiclerangedattack':
                    // Use mec as base, skill dropdown in dialog
                    data.score = data.actor.system.attributes.mec.score;
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    break;
                case 'vehiclerangedweaponattack':
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    break;
                case 'vehicleramattack':
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    break;
                case 'rangedattack':
                    // Use agi as base, skill dropdown in dialog
                    data.score = data.actor.system.attributes.agi.score;
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    break;
                case 'meleeattack':
                    // Look for Melee Combat skill; use agi if not found.  Show skills/specs in dialog
                    skill = await data.actor.items.find(i => i.type === 'skill'
                        && i.name === game.i18n.localize('OD6S.MELEE_COMBAT'));
                    if (typeof (skill) !== 'undefined') {
                        if (OD6S.flatSkills) {
                            data.score = data.actor.system.attributes[skill.system.attribute.toLowerCase()].score;
                            flatPips = skill.system.score;
                        } else {
                            data.score = skill.system.score +
                                data.actor.system.attributes[skill.system.attribute.toLowerCase()].score;
                        }
                    } else {
                        data.score = data.actor.system.attributes.agi.score;
                    }
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    break;
                case 'brawlattack':
                    // Look for Brawl skill; use agi if not found.  Show skills/specs in dialog
                    skill = await data.actor.items.find(i => i.type === 'skill'
                        && i.name === game.i18n.localize('OD6S.BRAWL'));
                    if (typeof (skill) !== 'undefined') {
                        if (OD6S.flatSkills) {
                            data.score = data.actor.system.attributes[skill.system.attribute.toLowerCase()].score;
                            flatPips = skill.system.score;
                        } else {
                            data.score = skill.system.score +
                                data.actor.system.attributes[skill.system.attribute.toLowerCase()].score;
                        }
                    } else {
                        const bAttr = game.settings.get('od6s', 'brawl_attribute')
                        data.score = data.actor.system.attributes[bAttr].score;
                    }
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
                    break;
                case '':
                    if (data.name === game.i18n.localize('OD6S.ENERGY_RESISTANCE') ||
                        data.name === game.i18n.localize('OD6S.PHYSICAL_RESISTANCE') ||
                        data.name === game.i18n.localize('OD6S.RESISTANCE_NO_ARMOR')) {
                        data.type = 'resistance';
                    }
                    isVisible = !game.settings.get('od6s', 'hide-combat-cards');
            }
        }

        let rollValues = od6sutilities.getDiceFromScore(data.score);

        let stunnedPenalty = 0;
        if (data.actor.type === 'character' || data.actor.type === 'npc' || data.actor.type === 'creature') {
            stunnedPenalty = data.actor.system.stuns.current ? data.actor.system.stuns.current : 0;
        }

        let actionPenalty = ((+data.actor.itemTypes.action.length) > 0) ? (+data.actor.itemTypes.action.length) - 1 : 0;
        if (data.type === 'mortally_wounded' ||
            data.type === 'incapacitated' ||
            data.type === 'damage' ||
            data.type === 'resistance' ||
            data.type === 'funds' ||
            data.type === 'purchase') {
            woundPenalty = 0;
            actionPenalty = 0;
            stunnedPenalty = 0;
            isVisible = true;
        } else {
            woundPenalty = od6sutilities.getWoundPenalty(data.actor);
        }

        if (data.type === 'funds') {
            isVisible = !game.settings.get('od6s', 'hide-skill-cards');
        }

        if (data.score < OD6S.pipsPerDice && !(OD6S.flatSkills && (data.type === 'skill' || data.type === 'specialization'))) {
            /* no score for this, we're done. */
            ui.notifications.warn(game.i18n.localize("OD6S.SCORE_TOO_LOW"));
            return;
        }

        if (data.type === 'skill' && data.name === 'Dodge') {
            data.subtype = 'dodge';
        }

        if ((data.type === 'skill') || (data.type === 'specialization')) {
            isVisible = !game.settings.get('od6s', 'hide-skill-cards');
            // Get the attribute of the skill or spec
            attribute = data.actor.items.filter(i => i.id === data.itemId)[0].system.attribute.toLowerCase();
            if (typeof (attribute) === 'undefined') {
                attribute = null;
            } else {
                if (OD6S.flatSkills) {
                    // Check if attribute of skill has at least 1 dice
                    const attributeValues = od6sutilities.getDiceFromScore(data.actor.system.attributes[attribute].score);
                    if (attributeValues.dice === 0) {
                        ui.notifications.warn(game.i18n.localize("OD6S.SCORE_TOO_LOW"));
                        return;
                    }
                    rollValues.dice = (+attributeValues.dice);
                    rollValues.pips = (+attributeValues.pips);
                }
            }
        } else {
            attribute = null;
        }

        // See if there are any effects that should add a bonus to a skill roll
        if (data.type === 'skill') {
            const skillName = data.actor.items.filter(i => i.id === data.itemId)[0].name;
            bonusmod += (+this.getEffectMod('skill', skillName, data.actor));
        }

        if (data.type === 'specialization') {
            const specName = data.actor.items.filter(i => i.id === data.itemId)[0].name;
            bonusmod += (+this.getEffectMod('specialization', specName, data.actor));
        }

        let fatepointeffect = false;

        if (data.actor.getFlag('od6s', 'fatepointeffect') && canUseFp) {
            // Double all dice while fate point is active
            rollValues.dice = (+rollValues.dice) * 2;
            rollValues.pips = (+rollValues.pips) * 2;

            fatepointeffect = true;
        }

        if (data.subtype === 'parry' && data.type === 'weapon') {
            data.name = data.name + " " + game.i18n.localize('OD6S.PARRY');
        }

        const canOppose =  ['skill', 'attribute', 'specialization', 'damage', 'resistance', 'toughness'];
        if (canOppose.includes(data.type)) isOpposable = true;
        if (data.type === 'action' && canOppose.includes(data.subtype)) isOpposable = true;

        if (data.type === 'action' &&
            data.subtype === "meleeattack" &&
            data.name === game.i18n.localize('OD6S.ACTION_MELEE_ATTACK')) {
            // Treat as an improvised weapon.
            miscMod += 5;
            damageScore = data.actor.system.strengthdamage.score;
        }

        if (data.subtype === 'rangedattack' ||
            data.subtype === 'vehiclerangedattack' ||
            data.subtype === 'vehiclerangedweaponattack') {
            range = "OD6S.RANGE_SHORT_SHORT";

            let rangeDifficulty = game.settings.get('od6s', 'map_range_to_difficulty');
            if (targets.length === 1 || (isExplosive && game.settings.get('od6s','auto_explosive'))) {
                if (data.itemId) {
                    const item = data.actor.items.get(data.itemId);
                    if (typeof (data.token) !== 'undefined' && data.token !== '') {
                        let distance = 0;
                        if (isExplosive) {
                            distance = item.getFlag('od6s', 'explosiveRange');
                        } else {
                            distance = Math.floor(canvas.grid.measureDistance(actorToken, targets[0], {gridSpaces: true}));
                        }
                        // Determine range
                        if (distance < 3) {
                            range = "OD6S.RANGE_POINT_BLANK_SHORT";
                            if (rangeDifficulty) difficultyLevel = 'OD6S.DIFFICULTY_VERY_EASY'
                        } else if (distance <= data.range.short) {
                            range = "OD6S.RANGE_SHORT_SHORT"
                            if (rangeDifficulty) difficultyLevel = 'OD6S.DIFFICULTY_EASY'
                        } else if (distance <= data.range.medium) {
                            range = "OD6S.RANGE_MEDIUM_SHORT"
                            if (rangeDifficulty) difficultyLevel = 'OD6S.DIFFICULTY_MODERATE'
                        } else if (distance <= data.range.long) {
                            range = "OD6S.RANGE_LONG_SHORT"
                            if (rangeDifficulty) difficultyLevel = 'OD6S.DIFFICULTY_DIFFICULT'
                        } else {
                            if (isExplosive) {
                                const template = canvas.templates.get(item.getFlag('od6s', 'explosiveTemplate'));
                                if (typeof (template) !== 'undefined' && template !== null) {
                                    await template.destroy();
                                    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [template.id]);
                                    await item.unsetFlag('od6s', 'explosiveSet');
                                    await item.unsetFlag('od6s', 'explosiveTemplate');
                                    await item.unsetFlag('od6s', 'explosiveRange');
                                }
                            }
                            return ui.notifications.warn(game.i18n.localize('OD6S.OUT_OF_RANGE'));
                        }
                    }
                }
            }

            if (data.subtype.startsWith('vehicle')) {
                if (data.actor.system?.embedded_pilot?.value && typeof (data.actor.system?.ranged.score) !== 'undefined') {
                    bonusmod += (+data.actor.system.ranged.score);
                } else if (typeof (data.actor.system?.vehicle?.ranged?.score) !== 'undefined') {
                    bonusmod += (+data.actor.system.vehicle.ranged.score);
                }
            } else {
                bonusmod += (+data.actor.system.ranged.mod);
            }
        }

        if (data.subtype === 'vehicleramattack') {
            const vehicle = (data.actor.type === 'starship' || data.actor.type === 'starship')
                ? data.actor.system : data.actor.system.vehicle
            if (typeof (vehicle.ram.score) !== 'undefined') {
                bonusmod += (+vehicle.ram.score);
            }
        }

        if (data.subtype === 'meleeattack') {
            bonusmod += (+data.actor.system.melee.mod);
        }

        if (data.subtype === 'brawlattack') {
            bonusmod += (+data.actor.system.brawl.mod);
            canStun = true;
            damageScore = data.actor.system.strengthdamage.score;
            stunDamageScore = damageScore;
            stunDamageType = 'p';
        }

        if (data.subtype === 'dodge') {
            bonusmod += (+data.actor.system.dodge.mod);
        }

        if (data.subtype === 'parry') {
            bonusmod += (+data.actor.system.parry.mod);
        }

        if (data.subtype === 'block') {
            bonusmod += (+data.actor.system.block.mod);
        }

        if (OD6S.flatSkills) {
            bonusdice.dice = 0;
            bonusdice.pips = (+bonusmod);
        } else {
            bonusdice = od6sutilities.getDiceFromScore(bonusmod);
        }

        if (od6sutilities.getScoreFromDice(bonusdice.dice, bonusdice.pips) < 0) {
            // Turn into into a penalty
            penaltydice = bonusdice.dice * -1;
            bonusdice.dice = 0;
            bonusdice.pips = 0;
        }

        if (OD6S.flatSkills && flatPips === 0 && (data.type === 'skill' || data.type === 'specialization')) {
            bonusdice.pips = (+bonusdice.pips) + (+data.score);
        } else if (OD6S.flatSkills && flatPips > 0) {
            bonusdice.pips = (+bonusdice.pips) + (+flatPips);
        }

        if (isAttack) {
            isVisible = !game.settings.get('od6s', 'hide-combat-cards');
            if (game.settings.get('od6s', 'dice_for_scale')) {
                if (scaleMod < 0) {
                    // Smaller vs. Bigger - easier to hit
                    data.score = data.score + (scaleMod * -1);
                    scaleDice = od6sutilities.getDiceFromScore(scaleMod).dice * -1;
                    rollValues.dice = (+rollValues.dice) + (+scaleDice);
                }
            }
        }

        if (data.type === 'specialization' || data.type === 'weapon') {
            if (OD6S.showSkillSpecialization) {
                const item = data.actor.items.get(data.itemId);
                if (typeof (item) !== 'undefined') {
                    if (item.type === 'specialization') {
                        specSkill = item.system.skill;
                    } else {
                        if (data.name === item.system.stats.specialization) {
                            specSkill = item.system.stats.skill;
                        }
                    }
                }
            }
        }

        if (data.type === 'damage') {
            if(data?.itemId !== 'undefined' || data?.itemId !== '') {
                const item = data.actor.items.get(data.itemId);
                if(item.system.damaged > 0) {
                    const score = od6sutilities.getScoreFromDice(rollValues.dice, rollValues.pips) - OD6S.weaponDamage[item.system.damaged].penalty;
                    rollValues.dice = od6sutilities.getDiceFromScore(score).dice;
                    rollValues.pips = od6sutilities.getDiceFromScore(score).pips;
                }
            }
        }

        let seller = '';
        if (data.type === 'purchase') {
            seller = data.seller;
            data.type = 'funds';
            data.subtype = 'purchase';
        }

        if(data.type === 'resistance') {
            if (game.settings.get('od6s', 'dice_for_scale')) {
                if (typeof(data.scale) === 'undefined' || data.scale === null) {
                    data.scale = 0;
                }
                scaleMod = data.scale;
                scaleDice = od6sutilities.getDiceFromScore(data.scale).dice;
            }
        }

        if(data.actor.system.roll_mod !== 0) {
            data.score = (+data.score) + (+data.actor.system.roll_mod);
            rollValues = od6sutilities.getDiceFromScore(data.score);
        }

        this.rollData = {
            label: data.name,
            title: data.name,
            dice: rollValues.dice,
            pips: rollValues.pips,
            specSkill: specSkill,
            originaldice: rollValues.dice,
            originalpips: rollValues.pips,
            score: data.score,
            wilddie: game.settings.get('od6s', 'use_wild_die') && data.actor.system.use_wild_die,
            showWildDie: game.settings.get('od6s', 'use_wild_die'),
            canusefp: canUseFp,
            fatepoint: Boolean(false),
            fatepointeffect: fatepointeffect,
            characterpoints: 0,
            canusecp: canUseCp,
            contact: contact,
            cpcost: 0,
            cpcostcolor: "black",
            bonusdice: bonusdice.dice,
            bonuspips: bonusdice.pips,
            isvisible: isVisible,
            isknown: isKnown,
            isExplosive: isExplosive,
            type: data.type,
            subtype: data.subtype,
            attribute: attribute,
            actor: data.actor,
            token: actorToken,
            actionpenalty: actionPenalty,
            woundpenalty: woundPenalty,
            stunnedpenalty: stunnedPenalty,
            otherpenalty: penaltydice,
            multishot: false,
            shots: 1,
            fulldefense: false,
            itemid: data.itemId,
            targets: targets,
            target: targets[0],
            timer: timer,
            damagetype: damageType,
            damagescore: damageScore,
            stundamagetype: stunDamageType,
            stundamagescore: stunDamageScore,
            damagemodifiers: damageModifiers,
            difficultylevel: difficultyLevel,
            isoppasable: isOpposable,
            difficulty: difficulty,
            scaledice: scaleDice,
            seller: seller,
            vehicle: vehicle,
            vehiclespeed: vehicleSpeed,
            vehiclecollisiontype: vehicleCollisionType,
            vehicleterraindifficulty: vehicleTerrainDifficulty,
            source: damageSource,
            range: range,
            template: "systems/od6s/templates/roll.html",
            only_stun: onlyStun,
            can_stun: canStun,
            stun: onlyStun,
            attackerScale: attackerScale,
            modifiers: {
                range: range,
                attackoption: 'OD6S.ATTACK_STANDARD',
                calledshot: '',
                cover: '',
                coverlight: '',
                coversmoke: '',
                miscmod: miscMod,
                scalemod: scaleMod
            }
        }

        const html = await renderTemplate(this.rollData.template, this.rollData);
        new RollDialog(this, {
            title: game.i18n.localize("OD6S.ROLL") + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.ROLL"),
                    callback: () => od6sroll.rollAction()
                }
            },
            default: "submit"
        }).render(true);

    }

    static async cancelAction(ev) {
        if(this.rollData?.isExplosive) {
            const item = this.rollData.actor.items.find(i=> i.id === this.rollData.itemid);
            if(item.getFlag('od6s','explosiveTemplate') !== '' || item.getFlag('od6s','explosiveTemplate') !== 'undefined') {
                try {
                    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [item.getFlag('od6s', 'explosiveTemplate')]);
                } catch {}
            }
            await item.unsetFlag('od6s', 'explosiveSet');
            await item.unsetFlag('od6s', 'explosiveTemplate');
        }
    }

    static async rollAction(test, ev) {
        const rollData = this.rollData;
        const actor = this.rollData.actor
        let rollMin = 0;
        let rollString;
        let cpString;
        let targetName;
        let targetId;
        let targetType;
        let damageScore = rollData.stun ? rollData.stundamagescore : rollData.damagescore;
        let damageType = rollData.stun ? rollData.stundamagetype : rollData.damagetype;
        let baseDamage;
        let strModDice;
        let doUpdate = false;
        let update = {};

        rollData.score = parseInt(rollData.score);

        let baseAttackDifficulty = 10;

        if(rollData.subtype?.includes('attack')) {
            if(rollData.subtype === 'rangedattack') {
                baseAttackDifficulty = OD6S.baseRangedAttackDifficulty;
            } else if(rollData.subtype === 'meleeattack') {
                baseAttackDifficulty = OD6S.baseMeleeAttackDifficulty;
            } else if(rollData.subtype === 'brawlattack') {
                baseAttackDifficulty = OD6S.baseBrawlAttackDifficulty;
            }
        }

        let difficulty = rollData.difficulty

        if (actor.type !== 'vehicle' && actor.type !== 'starship') {
            strModDice = od6sutilities.getDiceFromScore(rollData.actor.system.strengthdamage.score);
        }



        rollData.isknown = true;
        let rollMode = 'roll';
        // Using a fate point doubles the dice and pips of the roll
        if (rollData.fatepoint) {
            rollData.dice = (+rollData.originaldice * 2);
            rollData.pips = (+rollData.originalpips * 2);
            await actor.setFlag('od6s', 'fatepointeffect', true)
        }

        if (rollData.scaledice < 0) {
            rollData.otherpenalty += rollData.scaledice;
        }

        if (rollData.type === "resistance" && game.settings.get('od6s','dice_for_scale')) {
            rollData.dice = (+rollData.dice)+(+rollData.scaledice);
        }

        // Subtract Penalties
        rollData.dice = (+rollData.dice) - (+rollData.actionpenalty) -
            (+rollData.woundpenalty) -
            (+rollData.stunnedpenalty) -
            (+rollData.otherpenalty);

        // Wild die explodes on a 6
        if (rollData.wilddie) {
            rollData.dice = (+rollData.dice) - 1;
            if (rollData.dice === 0) {
                rollString = "1dw" + game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
            } else if (rollData.dice <= 0) {
                rollString = '';
            } else {
                rollString = rollData.dice + "d6" + game.i18n.localize("OD6S.BASE_DIE_FLAVOR") + "+1dw" +
                    game.i18n.localize("OD6S.WILD_DIE_FLAVOR");
            }
        } else {
            if (rollData.dice <= 0) {
                rollString = ''
            } else {
                rollString = rollData.dice + "d6" + game.i18n.localize("OD6S.BASE_DIE_FLAVOR");
            }
        }

        if (rollData.pips > 0) {
            rollString += "+" + rollData.pips;
        }

        // Character point dice also explode on a 6
        if (rollData.characterpoints > 0) {
            cpString = "+" + rollData.characterpoints + "db"
                + game.i18n.localize("OD6S.CHARACTER_POINT_DIE_FLAVOR");
            rollString += cpString;
        }

        // Bonus pips are not calculated to add new dice, just a bonus
        if (rollData.bonusdice > 0) {
            rollString += "+" + rollData.bonusdice + "d6" + game.i18n.localize("OD6S.BONUS_DIE_FLAVOR");
        }
        if (rollData.bonuspips > 0) {
            rollString += "+" + rollData.bonuspips;
        }

        // Apply costs
        if ((rollData.characterpoints > 0) && (actor.system.characterpoints.value > 0)) {
            doUpdate = true;
            actor.system.characterpoints.value -= rollData.characterpoints;
        }

        if (rollData.fatepoint && (actor.system.fatepoints.value > 0)) {
            doUpdate = true;
            actor.system.fatepoints.value -= 1;
        }

        if (typeof (rollData.target) !== 'undefined') {
            targetName = rollData.target.name;
            targetId = rollData.target.id;
            targetType = rollData.target.actor.type;
        }

        // Now, determine the target number to beat, if necessary
        if (rollData.difficulty) {
            difficulty = rollData.difficulty;
        } else {
            difficulty = await this.getDifficulty(rollData);
        }
        const baseDifficulty = difficulty;
        const modifiers = this.applyDifficultyEffects(rollData);

        // Hide if "Unknown"
        if (rollData.difficultylevel === 'OD6S.DIFFICULTY_UNKNOWN') {
            rollData.isvisible = false;
            rollData.isknown = false;
        }

        if (game.settings.get('od6s', 'hide-skill-cards')) {
            rollData.isknown = false;
        }

        if (rollData.subtype === 'dodge' || rollData.subtype === 'parry' || rollData.subtype === 'block') {
            rollData.isknown = true;
            rollData.isvisible = true;
        }

        modifiers.forEach(m => {
            difficulty = (+difficulty) + (+m.value);
        })

        //if (difficulty < 0) difficulty = 0;

        if (rollData.subtype === 'brawlattack') {
            damageScore = actor.system.strengthdamage.score;
            damageType = 'p';
        }

        baseDamage = damageScore;
        // Determine damage modifiers, if any
        const damageEffects = this.applyDamageEffects(rollData);
        rollData.damagemodifiers = rollData.damagemodifiers.concat(damageEffects);

        if (typeof (rollData.damagemodifiers) !== 'undefined' && rollData.damagemodifiers.length) {
            rollData.damagemodifiers.forEach(d => {
                if (d.name === game.i18n.localize("OD6S.SCALE")) {
                    if (game.settings.get('od6s', 'dice_for_scale')) {
                        damageScore = (+damageScore) + (d.value);
                    }
                } else {
                    if (rollData.actor.getFlag('od6s', 'fatepointeffect') &&
                        d.name === 'OD6S.STRENGTH_DAMAGE_BONUS') {
                    } else {
                        damageScore = (+damageScore) + (d.value);
                    }
                }
            })
        }

        let damageDice = od6sutilities.getDiceFromScore(damageScore);
        if (rollData.actor.getFlag('od6s', 'fatepointeffect')) {
            const strMod = rollData.damagemodifiers.find(d => d.name === 'OD6S.STRENGTH_DAMAGE_BONUS');
            if (strMod) {
                damageDice.dice = damageDice.dice + strModDice.dice * 2;
                damageDice.pips = damageDice.pips + strModDice.pips * 2;
                strModDice.dice = strModDice.dice * 2;
                strModDice.pips = strModDice.pips * 2;
            }
        }

        if (rollData.subtype === 'vehicleramattack') {
            damageScore = (+damageScore) +
                (+OD6S.vehicle_speeds[rollData.vehiclespeed].damage) +
                (+OD6S.collision_types[rollData.vehiclecollisiontype].score);
            baseDamage = damageScore;
            damageDice = od6sutilities.getDiceFromScore(damageScore);
        }

        if (typeof (rollData.damagemodifiers) !== 'undefined' && rollData.damagemodifiers.length) {
            rollData.damagemodifiers.forEach(d => {
                if (d.pips !== undefined && d.pips > 0) {
                    damageDice.pips = damageDice.pips + (+d.pips)
                }
            })
        }

        let scaleBonus = 0;
        for (let i = 0; i < rollData.damagemodifiers.length; i++) {
            if (rollData.damagemodifiers[i].name === game.i18n.localize("OD6S.SCALE")) {
                if (!game.settings.get('od6s', 'dice_for_scale')) {
                    scaleBonus = rollData.damagemodifiers[i].value;
                }
            }
        }

        let scaleDice = 0;
        if (game.settings.get('od6s', 'dice_for_scale')) {
            if (rollData.modifiers.scalemod > 0) {
                damageScore = (+damageScore) + (+rollData.modifiers.scalemod);
            } else {
                scaleDice = rollData.scaledice;
            }
        }

        let flags = {
            "actorId": rollData.actor.id,
            "targetName": targetName,
            "targetId": targetId,
            "targetType": targetType,
            "baseDifficulty": baseDifficulty,
            "difficulty": difficulty,
            "difficultyLevel": rollData.difficultylevel,
            "baseDamage": baseDamage,
            "damageScore": damageScore,
            "damageDice": damageDice,
            "strModDice": strModDice,
            "damageScaleBonus": scaleBonus,
            "damageScaleDice": scaleDice,
            "damageModifiers": rollData.damagemodifiers,
            "damageType": damageType,
            "damageTypeName": OD6S.damageTypes[damageType],
            "stun": rollData.stun,
            "fatepointineffect": rollData.fatepointeffect,
            "isExplosive": rollData.isExplosive,
            "range": rollData.modifiers.range,
            "type": rollData.type,
            "subtype": rollData.subtype ? rollData.subtype : '',
            "multiShot": rollData.multishot,
            "modifiers": modifiers,
            "isEditable": true,
            "editing": false,
            "isVisible": rollData.isvisible,
            "isKnown": rollData.isknown,
            "isOpposable": rollData.isoppasable,
            "wild": false,
            "wildHandled": false,
            "wildResult": OD6S.wildDieResult[OD6S.wildDieOneDefault],
            "canUseCp": rollData.canusecp,
            "specSkill": rollData.specSkill,
            "vehicle": rollData.vehicle,
            "vehiclespeed": rollData.vehiclespeed,
            "vehicleterraindifficulty": rollData.vehicleterraindifficulty,
            "source": rollData.source,
            "location": "",
            "seller": rollData.seller,
            "purchasedItem": '',
            "itemId": rollData.itemid ? rollData.itemid : "",
            "attackerScale": rollData.attackerScale
        }

        if (rollData.itemid) {
            const item = rollData.actor.items.get(rollData.itemid);
            if (typeof (item) !== 'undefined' && item.type !== '') {
                if (item.type === 'specialization') {
                    const skill = rollData.actor.items.find(i => i.name === item.system.skill);
                    if (typeof (skill) !== 'undefined' && skill.name !== '') {
                        if (skill.system.min === true || String(skill.system.min).toLowerCase() === 'true') {
                            rollMin = od6sutilities.getDiceFromScore(item.system.score +
                                rollData.actor.system.attributes[item.system.attribute].score).dice * OD6S.pipsPerDice;
                        }
                    }
                    if(OD6S.autoSkillUsed) {
                        await item.update({'system.used.value': true});
                    }
                } else if (item.type === "skill") {
                    if (item.system.min === true || String(item.system.min).toLowerCase() === 'true') {
                        rollMin = od6sutilities.getDiceFromScore(item.system.score +
                            rollData.actor.system.attributes[item.system.attribute].score).dice * OD6S.pipsPerDice;
                    }
                    if(OD6S.autoSkillUsed) {
                        await item.update({'system.used.value': true});
                    }
                } else if (item.type === "weapon") {
                    let found = false;
                    const itemData = item.system;
                    if ( itemData.type === 'specialization' && typeof (itemData.stats.specialization) !== 'undefined' &&
                        itemData.stats.specialization !== 'null' && itemData.stats.specialization !== '') {
                        const spec = rollData.actor.items.find(i => i.name === itemData.stats.specialization);
                        if (typeof (spec) !== 'undefined' && spec.name !== '') {
                            found = true
                            const skill = rollData.actor.items.find(i => i.name === spec.system.skill);
                            if (typeof (skill) !== 'undefined' && skill.name !== '') {
                                if (skill.system.min === true || String(skill.system.min).toLowerCase() === 'true') {
                                    rollMin = od6sutilities.getDiceFromScore(spec.system.score +
                                        rollData.actor.system.attributes[skill.system.attribute].score).dice * OD6S.pipsPerDice;
                                }
                                if(OD6S.autoSkillUsed) {
                                    await spec.update({'system.used.value': true});
                                }
                            }
                        }
                    }

                    if (!found && typeof (itemData.stats.skill) !== 'undefined' &&
                        itemData.stats.skill !== 'null' && itemData.stats.skill !== '') {
                        const skill = rollData.actor.items.find(i => i.name === itemData.stats.skill);
                        if (typeof (skill) !== 'undefined' && skill.name !== '') {
                            if (skill.system.min === true || String(skill.system.min).toLowerCase() === 'true') {
                                rollMin = od6sutilities.getDiceFromScore(skill.system.score +
                                    rollData.actor.system.attributes[skill.system.attribute].score).dice * OD6S.pipsPerDice;
                            }
                            if(OD6S.autoSkillUsed) {
                                await skill.update({'system.used.value': true});
                            }
                        }
                    }
                }
            }
            if (rollMin > 0) {
                rollString = "max(" + rollString + "," + rollMin + ")";
            }
        }

        if (rollData.isExplosive) {
            flags.showButton = true;
            if(!game.settings.get('od6s', 'explosive_end_of_round')) {
                flags.triggered = true;
            }
            if(game.settings.get('od6s','auto_explosive')
                && !game.settings.get('od6s','explosive_end_of_round')) {
                flags.targets = await od6sutilities.getExplosiveTargets(
                    rollData.actor.isToken ? rollData.actor.token.actor : rollData.actor, rollData.itemid
                )
            }
        }

        // Let's roll!
        if (rollString === '') {
            ui.notifications.warn(game.i18n.localize('OD6S.ZERO_DICE'));
            return;
        }

        let roll = await new Roll(rollString).evaluate();

        let label = ''
        if (OD6S.showSkillSpecialization && rollData.specSkill !== '') {
            label = rollData.label ? `${game.i18n.localize('OD6S.ROLLING')} ${rollData.specSkill}: ${rollData.label}` : '';
        } else {
            label = rollData.label ? `${game.i18n.localize('OD6S.ROLLING')} ${rollData.label}` : '';
        }

        if (typeof (rollData.vehicle) !== 'undefined' && rollData.vehicle !== ''
            && (rollData.actor.type !== 'vehicle' || rollData.actor.type !== 'starship')) {
            const vehicle = await od6sutilities.getActorFromUuid(rollData.vehicle);
            label = label + " " + game.i18n.localize('OD6S.FOR') + " " + vehicle.name;
        }

        let useWildDie = true;

        if(!game.settings.get('od6s', 'use_wild_die')) {
            useWildDie = false;
        } else {
            if(!rollData.wilddie) {
                useWildDie = rollData.wilddie;
            } else {
                useWildDie = rollData.actor.system.use_wild_die;
            }
        }

        if (useWildDie && rollMin < 1) {
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

        flags.success = roll.total >= difficulty;
        flags.total = roll.total;
        flags.stun = rollData.stun;

        if (OD6S.randomHitLocations && flags.success) {
            flags.location = OD6S.hitLocations[roll.total.toString().slice(-1)];
        }

        /*
         *   Enhancements for high hit damage:
         *   - Allows use of pips or dice for extra damage.
         *   - Configurable threshold (e.g. 5 or 10 points over difficulty).
         *   - Optional rounding for near-threshold hits. 'down' requires full threshold, 'up' mean partial threshold suffices.
        */
        if (rollData.actor.type === 'character' && OD6S.highHitDamage && flags.success) {
            let extra;
            const difference = roll.total - difficulty;

            // round up or down
            if (OD6S.highHitDamageRound) {
                extra = Math.floor(difference / OD6S.highHitDamageMultiplier);
            } else {
                extra = Math.ceil(difference / OD6S.highHitDamageMultiplier);
            }

            // Adds extra damage as dice or pips
            if (OD6S.highHitDamagePipsOrDice) {
                // True means add as dice
                flags.damageModifiers.push({
                    "name": 'OD6S.HIGH_HIT_DAMAGE',
                    "value": extra, // Adds extra dice
                    "pips": 0
                });
                flags.damageDice.dice += extra;
            } else {
                // False means add as pips
                flags.damageModifiers.push({
                    "name": 'OD6S.HIGH_HIT_DAMAGE',
                    "value": 0,
                    "pips": extra // Adds extra pips
                });
                flags.damageDice.pips += extra;
            }
        }

        if (rollData.modifiers.calledshot && flags.success) {
            switch (rollData.modifiers.calledShot) {
                case 'OD6S.CALLED_SHOT_NONE':
                case 'OD6S.CALLED_SHOT_LARGE':
                case 'OD6S.CALLED_SHOT_MEDIUM':
                case 'OD6S.CALLED_SHOT_SMALL':
                    flags.location = "";
                    break;
                default:
                    flags.location = rollData.modifiers.calledshot;
            }

        }
        if (rollMin > 0) {
            label = label + " (" + game.i18n.localize('OD6S.SKILL_MINIMUM') + ": " + rollMin + ")";
        }

        if (game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')) {
            rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
        }
        let rollMessage = await roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: actor}),
                flavor: label,
                flags: {od6s: flags}
            },
            {rollMode: rollMode, create: true}
        );

        if (flags.wild === true && parseInt(OD6S.wildDieOneDefault) === 2 && parseInt(OD6S.wildDieOneAuto) === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));

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
            rollMessageUpdate.content = replacementRoll.total;
            rollMessageUpdate.rolls = rollMessage.rolls;
            rollMessageUpdate.rolls[0] = replacementRoll;
            rollMessageUpdate.flags = {};
            rollMessageUpdate.flags.od6s = {};
            const newSuccess = replacementRoll.total >= rollMessage.getFlag('od6s', 'difficulty')

            if (game.user.isGM) {
                if (rollMessage.getFlag('od6s', 'difficulty') && rollMessage.getFlag('od6s', 'success')) {
                    rollMessageUpdate.flags.od6s.success = newSuccess;
                }
                rollMessageUpdate.flags.od6s.originalroll = rollMessage.rolls[0];
                rollMessageUpdate.flags.od6s.wildHandled = true;
                await rollMessage.update(rollMessageUpdate);
            } else {
                game.socket.emit('system.od6s', {
                    operation: 'updateRollMessage',
                    message: rollMessage,
                    update: rollMessageUpdate
                })
            }

            if (rollData.type === 'incapacitated' && !newSuccess && flags.success) {
                await rollData.actor.applyIncapacitatedFailure();
            }

            if (rollData.type === 'mortally_wounded' && !newSuccess && flags.success) {
                await rollData.actor.applyMortallyWoundedFailure();
            }
        }

        if(rollData.isExplosive) {
            const item = rollData.actor.items.find(i => i.id === rollData.itemid);
            const origin = item.getFlag('od6s', 'explosiveOrigin');
            const templateId = item.getFlag('od6s', 'explosiveTemplate');
            const template = canvas.templates.get(templateId);
            await template.document.setFlag('od6s','message', rollMessage.id);

            if(rollData.actor.isToken) {
                await template.document.setFlag('od6s','token', rollData.actor.token.id);
            } else {
                await template.document.setFlag('od6s','token', '');
            }
            if (game.settings.get('od6s', 'auto_explosive')) {
                await template.document.setFlag('od6s', 'originalOwner', game.user.owner);
                await template.document.setFlag('od6s', 'templateId', rollMessage._id);

                if (!flags.success) {
                    // Scatter the template
                    await od6sutilities.scatterExplosive(rollData.range, origin, templateId);
                    await od6sutilities.wait(100);
                    const newTargets = await od6sutilities.getExplosiveTargets(rollData.actor, rollData.itemid);
                    if (Object.keys(newTargets).length === 0) {
                        await rollMessage.unsetFlag('od6s', 'showButton');
                        await rollMessage.setFlag('od6s', 'showButton', false);
                    }
                    await rollMessage.unsetFlag('od6s', 'targets');
                    await rollMessage.setFlag('od6s', 'targets', newTargets);
                    await od6sutilities.wait(100);
                }
            }
            if(!game.settings.get('od6s','explosive_end_of_round')) {
                await template.document.update({hidden: false});
            }
        }

        if (rollData.subtype === 'dodge' || rollData.subtype === 'parry' || rollData.subtype === 'block') {
            doUpdate = true;
            if (rollData.fulldefense) {
                actor.system[rollData.subtype].score = (+flags.total + baseAttackDifficulty);
            } else {
                actor.system[rollData.subtype].score = (+flags.total);
            }
        }

        if (rollData.subtype === 'vehicledodge') {
            let vehicle = {};
            if (rollData.actor.type === 'vehicle' || rollData.actor.type === 'starship') {
                vehicle = rollData.actor;
            } else {
                vehicle = await od6sutilities.getActorFromUuid(actor.system.vehicle.uuid);
            }
            const vehicleUpdate = {};
            vehicleUpdate.system = {};
            vehicleUpdate.system.dodge = {};
            vehicleUpdate.flags = {};
            if(!game.settings.get("od6s", "reaction_skills")) {
                vehicleUpdate.flags.od6s = {};
                vehicleUpdate.flags.od6s.dodge_actor = actor.uuid;
            }

            if (rollData.fulldefense) {
                vehicleUpdate.system.dodge.score = (+roll.total + baseAttackDifficulty);
            } else {
                vehicleUpdate.system.dodge.score = (+roll.total);
            }

            if (game.user.isGM) {
                await vehicle.update(vehicleUpdate);
            } else {
                await OD6S.socket.executeAsGM('updateVehicle', actor.system.vehicle.uuid, vehicleUpdate);
            }
        }

        if (doUpdate) {
            let update = {};
            update.system = {};
            update.system.fatepoints = actor.system.fatepoints;
            update.system.characterpoints = actor.system.characterpoints;
            update.system.dodge = {};
            update.system.dodge.score = actor.system.dodge.score;
            update.system.parry = {};
            update.system.parry.score = actor.system.parry.score;
            update.system.block = {};
            update.system.block.score = actor.system.block.score;
            await actor.update(update);
        }

        if (!rollMessage.getFlag('od6s', 'wildHandled')) {
            if (rollData.type === 'incapacitated' && !rollMessage.getFlag('od6s', 'success')) {
                await rollData.actor.applyIncapacitatedFailure();
            }

            if (rollData.type === 'mortally_wounded' && !rollMessage.getFlag('od6s', 'success')) {
                await rollData.actor.applyMortallyWoundedFailure();
            }
        }

        if (rollData.subtype === 'purchase') {
            await rollMessage.setFlag('od6s', 'purchasedItem', rollData.itemid);
        }

        if (rollData.subtype === 'purchase' && rollMessage.getFlag('od6s', 'success')) {
            if (!rollMessage.getFlag('od6s', 'wild')) {
                const seller = game.actors.get(rollData.seller);
                seller.sheet._onPurchase(rollData.itemid, rollData.actor.id);
            } else if (rollMessage.getFlag('od6s', 'wildHandled')) {
                const seller = game.actors.get(rollData.seller);
                seller.sheet._onPurchase(rollData.itemid, rollData.actor.id);
            } else if (rollMessage.getFlag('od6s', 'wildHandled')) {
                const seller = game.actors.get(rollData.seller);
                await seller.sheet._onPurchase(rollData.itemid, rollData.actor.id);
            }
        }
        await actor.render();
        return await game.messages.render();
    }

    /**
     * Get the base difficulty for a roll
     * @param rollData
     * @returns {number|*}
     */
    static async getDifficulty(rollData) {
        if (rollData.isExplosive && rollData.range === 'OD6S.RANGE_POINT_BLANK_SHORT' && !game.settings.get('od6s','map_range_to_difficulty')) {
            // Thrown explosives at point blank range are difficulty 0
            return 5;
        }

        const target = typeof (rollData.target) !== 'undefined';
        // If the roll is an attack and has a target, get the appropriate defense value from the target, if any
        switch (rollData.subtype) {
            case 'vehiclemaneuver':
                if (OD6S.vehicleDifficulty) {
                    return OD6S.vehicle_speeds[rollData.vehiclespeed].mod
                } else {
                    return await od6sutilities.getDifficultyFromLevel(rollData.vehicleterraindifficulty)
                }
            case 'vehicleramattack':
                if (OD6S.vehicleDifficulty) {
                    if (target && (+rollData.target.actor.system.dodge.score) > 0) {
                        return (+rollData.target.actor.system.dodge.score) + (+OD6S.vehicle_speeds[rollData.vehiclespeed].mod);
                    } else {
                        return (+OD6S.vehicle_speeds[rollData.vehiclespeed].mod);
                    }
                } else {
                    if (target && (+rollData.target.actor.system.dodge.score) > 0) {
                        return (+rollData.target.actor.system.dodge.score) + (await od6sutilities.getDifficultyFromLevel(rollData.vehicleterraindifficulty));
                    } else {
                        return await od6sutilities.getDifficultyFromLevel(rollData.vehicleterraindifficulty);
                    }
                }
            case 'vehiclerangedattack':
            case 'vehiclerangedweaponattack':
            case 'rangedattack':
                if (target && (+rollData.target.actor.system.dodge.score) > 0) {
                    return (+rollData.target.actor.system.dodge.score);
                } else {
                    if (OD6S.mapRange) {
                        return await od6sutilities.getDifficultyFromLevel(OD6S.ranges[rollData.modifiers.range].map);
                    }
                    return OD6S.baseRangedAttackDifficulty;
                }
            case 'meleeattack':
                if (target) {
                    const targetData = rollData.target.actor.system;

                    if (OD6S.defenseLock) {
                        if (targetData.parry.score === 0) {
                            if (OD6S.meleeDifficulty) {
                                return await od6sutilities.getDifficultyFromLevel(rollData.difficultylevel);
                            } else {
                                return baseMeleeAttackDifficulty;
                            }
                        } else {
                            return targetData.parry.score;
                        }
                    }

                    if (rollData.target.actor.type !== 'vehicle' && rollData.target.actor.type !== 'starship') {
                        if (targetData.block.score === 0 && targetData.dodge.score === 0 && targetData.parry.score === 0) {
                            if (OD6S.meleeDifficulty) {
                                return await od6sutilities.getDifficultyFromLevel(rollData.difficultylevel);
                            } else {
                                return OD6S.baseMeleeAttackDifficulty;
                            }
                        } else {
                            // Look at dodge, parry, and block take the highest
                            if (targetData.dodge.score >= targetData.parry.score && targetData.dodge.score >= targetData.block.score) {
                                return targetData.dodge.score;
                            } else if (targetData.parry.score >= targetData.dodge.score && targetData.parry.score >= targetData.block.score) {
                                return targetData.parry.score;
                            } else {
                                return targetData.block.score;
                            }
                        }
                    } else {
                        // Attacking a vehicle with a melee weapon
                        if (targetData.dodge.score === 0) {
                            if(OD6S.meleeDifficulty) {
                                return await od6sutilities.getDifficultyFromLevel(rollData.difficultylevel);
                            } else {
                                return OD6S.baseMeleeAttackDifficulty;
                            }
                        } else {
                            return targetData.dodge.score;
                        }
                    }
                } else {
                    return OD6S.meleeDifficulty ? await od6sutilities.getDifficultyFromLevel(rollData.difficultylevel) : OD6S.baseMeleeAttackDifficulty;
                }
            case 'brawlattack':
                if (target) {
                    const targetData = rollData.target.actor.system;

                    if (OD6S.defenseLock) {
                        if (targetData.block.score === 0) {
                            if (OD6S.meleeDifficulty) {
                                return await od6sutilities.getDifficultyFromLevel(OD6S.baseBrawlAttackDifficultyLevel);
                            } else {
                                return OD6S.baseBrawlAttackDifficulty;
                            }
                        } else {
                            return targetData.block.score;
                        }
                    }

                    if (rollData.target.actor.type !== 'vehicle' && rollData.target.actor.type !== 'starship') {
                        if (targetData.block.score === 0 && targetData.dodge.score === 0 && targetData.parry.score === 0) {
                            if (OD6S.meleeDifficulty) {
                                return await od6sutilities.getDifficultyFromLevel(OD6S.baseBrawlAttackDifficultyLevel);
                            } else {
                                return OD6S.baseBrawlAttackDifficulty;
                            }
                        } else {
                            // Look at dodge, parry, and block take the highest
                            if (targetData.dodge.score >= targetData.parry.score && targetData.dodge.score >= targetData.block.score) {
                                return targetData.dodge.score;
                            } else if (targetData.parry.score >= targetData.dodge.score && targetData.parry.score >= targetData.block.score) {
                                return targetData.parry.score;
                            } else {
                                return targetData.block.score;
                            }
                        }
                    } else {
                        if (targetData.dodge.score === 0) {
                            return OD6S.baseBrawlAttackDifficulty;
                        } else {
                            return targetData.dodge.score;
                        }
                    }
                } else {
                    return OD6S.meleeDifficulty ? await od6sutilities.getDifficultyFromLevel(OD6S.baseBrawlAttackDifficultyLevel) : OD6S.baseBrawlAttackDifficulty;
                }

            default:
        }

        switch (rollData.type) {
            case 'resistance':
            case 'dodge':
            case 'parry':
            case 'block':
                return 0;

            default:
                return await od6sutilities.getDifficultyFromLevel(rollData.difficultylevel);
        }
    }

    /**
     * Assemble difficulty modifiers based on roll data and target conditions
     * @param rollData
     * @returns {[]}
     * @constructor
     */
    static applyDifficultyEffects(rollData) {
        const mods = rollData.modifiers;
        let difficultyModifiers = [];
        let modifiers = [];

        // First, handle modifiers passed to the roll
        if (rollData.subtype === 'rangedattack' ||
            rollData.subtype === 'vehiclerangedattack' ||
            rollData.subtype === 'vehcilerangedweaponattack') {
            if (!OD6S.mapRange && OD6S.ranges[mods.range].difficulty) {
                modifiers.push({
                    "name": game.i18n.localize(OD6S.ranges[mods.range].name),
                    "value": OD6S.ranges[mods.range].difficulty
                })
            }

            if (OD6S.rangedAttackOptions[mods.attackoption].attack) {
                let value;
                if (OD6S.rangedAttackOptions[mods.attackoption].multi) {
                    value = OD6S.rangedAttackOptions[mods.attackoption].attack * (rollData.shots - 1);
                } else {
                    value = OD6S.rangedAttackOptions[mods.attackoption].attack;
                }

                modifiers.push({
                    "name": game.i18n.localize(mods.attackoption),
                    "value": value
                })
            }
        }

        if (rollData.subtype === 'vehiclemaneuver' || rollData.subtype === 'vehicleramattack') {
            if (OD6S.vehicleDifficulty) {
                if (OD6S.terrain_difficulty[rollData.vehicleterraindifficulty].mod) {
                    modifiers.push({
                        "name": game.i18n.localize(rollData.vehicleterraindifficulty),
                        "value": OD6S.terrain_difficulty[rollData.vehicleterraindifficulty].mod
                    })
                }
            } else {
                if (OD6S.vehicle_speeds[rollData.vehiclespeed].mod) {
                    modifiers.push({
                        "name": game.i18n.localize("OD6S.VEHICLE_SPEED") + "(" +
                            game.i18n.localize(OD6S.vehicle_speeds[rollData.vehiclespeed].name) + ")",
                        "value": OD6S.vehicle_speeds[rollData.vehiclespeed].mod
                    })
                }
            }
        }

        if (rollData.subtype === 'vehicleramattack') {
            modifiers.push({
                "name": game.i18n.localize("OD6S.ACTION_VEHICLE_RAM"),
                "value": 10
            })
        }

        if (rollData.subtype === 'meleeattack') {
            if (!OD6S.meleeDifficulty && OD6S.ranges[mods.range].difficulty) {
                modifiers.push({
                    "name": game.i18n.localize(OD6S.ranges[mods.range].name),
                    "value": OD6S.ranges[mods.range].difficulty
                })
            }

            if (OD6S.meleeAttackOptions[mods.attackoption].attack) {
                modifiers.push({
                    "name": game.i18n.localize(mods.attackoption),
                    "value": OD6S.meleeAttackOptions[mods.attackoption].attack
                })
            }
        }

        if (rollData.subtype === 'brawlattack') {
            if (!OD6S.meleeDifficulty && OD6S.ranges[mods.range].difficulty) {
                modifiers.push({
                    "name": game.i18n.localize(OD6S.ranges[mods.range].name),
                    "value": OD6S.ranges[mods.range].difficulty
                })
            }

            if (OD6S.brawlAttackOptions[mods.attackoption].attack) {
                modifiers.push({
                    "name": game.i18n.localize(mods.attackoption),
                    "value": OD6S.brawlAttackOptions[mods.attackoption].attack
                })
            }
        }

        if (mods.cover !== '' && OD6S.cover["OD6S.COVER"][mods.cover].modifier !== 0) {
            modifiers.push({
                "name": game.i18n.localize(mods.cover),
                "value": OD6S.cover["OD6S.COVER"][mods.cover].modifier
            })
        }

        if (mods.coverlight !== '' && OD6S.cover["OD6S.COVER_LIGHT"][mods.coverlight].modifier !== 0) {
            modifiers.push({
                "name": game.i18n.localize(mods.coverlight),
                "value": OD6S.cover["OD6S.COVER_LIGHT"][mods.coverlight].modifier
            })
        }

        if (mods.coversmoke !== '' && OD6S.cover["OD6S.COVER_SMOKE"][mods.coversmoke].modifier !== 0) {
            modifiers.push({
                "name": game.i18n.localize(mods.coversmoke),
                "value": OD6S.cover["OD6S.COVER_SMOKE"][mods.coversmoke].modifier
            })
        }

        if (mods.calledshot !== '' && OD6S.calledShot[mods.calledshot].modifier !== 0) {
            modifiers.push({
                "name": game.i18n.localize('OD6S.CALLED_SHOT') + "-" + game.i18n.localize(mods.calledshot),
                "value": OD6S.calledShot[mods.calledshot].modifier
            })
        }

        if (mods.scalemod !== 0) {
            if (!game.settings.get('od6s', 'dice_for_scale')) {
                modifiers.push({
                    "name": game.i18n.localize("OD6S.SCALE"),
                    "value": mods.scalemod
                })
            }
        }

        if (mods.miscmod !== 0) {
            modifiers.push({
                "name": game.i18n.localize("OD6S.MISC"),
                "value": mods.miscmod
            })
        }

        modifiers.forEach(m => {
            difficultyModifiers.push(m);
        })
        return difficultyModifiers;
    }

    static applyDamageEffects(rollData) {
        const mods = rollData.modifiers;
        let modifiers = [];

        if (rollData.subtype === 'rangedattack' ||
            rollData.subtype === 'vehiclerangedattack' ||
            rollData.subtype === 'vehcilerangedweaponattack') {
            if (OD6S.rangedAttackOptions[mods.attackoption].damage) {
                let value;
                if (OD6S.rangedAttackOptions[mods.attackoption].multi) {
                    value = OD6S.rangedAttackOptions[mods.attackoption].damage * (rollData.shots - 1);
                } else {
                    value = OD6S.rangedAttackOptions[mods.attackoption].damage;
                }

                modifiers.push({
                    "name": mods.attackoption,
                    "value": value
                })
            }
        }

        if (rollData.subtype === 'meleeattack') {
            if (OD6S.meleeAttackOptions[mods.attackoption].damage) {
                modifiers.push({
                    "name": mods.attackoption,
                    "value": OD6S.meleeAttackOptions[mods.attackoption].damage
                })
            }
        }

        if (rollData.subtype === 'brawlattack') {
            if (OD6S.brawlAttackOptions[mods.attackoption].damage) {
                modifiers.push({
                    "name": mods.attackoption,
                    "value": OD6S.brawlAttackOptions[mods.attackoption].damage
                })
            }
        }

        if (mods.calledshot !== '' && OD6S.calledShot[mods.calledshot].damage !== 0) {
            modifiers.push({
                "name": game.i18n.localize('OD6S.CALLED_SHOT') + "-" + game.i18n.localize(mods.calledshot),
                "value": 0,
                "pips": OD6S.calledShot[mods.calledshot].damage,
            })
        }

        if (mods.scalemod !== 0) {
            modifiers.push({
                "name": game.i18n.localize("OD6S.SCALE"),
                "value": mods.scalemod
            })
        }

        return modifiers;
    }

    static getEffectMod(type, name, actor) {
        // See if there are any effects that should add a bonus to a skill roll
        if (type === 'skill') {
            if (typeof (actor.system.customeffects?.skills[name]) !== 'undefined') {
                return actor.system.customeffects.skills[name];
            }
        }

        if (type === 'specialization') {
            if (typeof (actor.system.customeffects?.specializations[name]) !== 'undefined') {
                return actor.system.customeffects.specializations[name];
            }

            // See if the base skill has any modifiers
            const spec = actor.items.filter(i => i.type === type && i.name === name)[0];
            if (typeof (spec) !== 'undefined') {
                if (typeof (actor.system.customeffects.skills[spec.system.skill]) !== 'undefined') {
                    return actor.system.customeffects.skills[spec.system.skill];
                }
            }
        }

        return 0;
    }

    static getRange(value, actor) {
        if(isNaN(value) && value?.toLowerCase().startsWith('str')) {
            const regex = /str/i;
            const newValue = value.replace(regex, actor.system.attributes.str.score);
            return (eval(newValue));
        } else {
            return value;
        }
    }
}
