import {od6sroll} from "../apps/od6sroll.js";
import {od6sInitRoll} from "../apps/od6sroll.js";
import {od6sadvance} from "./advance.js";
import {od6sspecialize} from "./specialize.js";
import {od6sattributeedit} from "./attribute-edit.js";
import {od6sutilities} from "../system/utilities.js";
import {OD6SAddCrew} from "./add-crew.js";
import {OD6SAddEmbeddedCrew} from "./add-embedded-crew.js";
import {OD6SAddItem} from "./add-item.js";
import OD6SItemInfo from "../apps/item-info.js";
import OD6S from "../config/config-od6s.js";
import OD6SCreateCharacter from "../apps/character-creation.js";

/**
 * Extend the basic ActorSheet for OpenD6 Space actors.
 * @extends {ActorSheet}
 */
export class OD6SActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["od6s", "sheet", "actor"],
            width: 915,
            height: 800,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}]
        });
    }

    /** @override */
    get template() {
        return `systems/od6s/templates/actor/common/actor-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData(options = {}) {
        const data = super.getData(options);

        const { type } = this.actor;

        if (['character', 'npc', 'creature'].includes(type)) {
            this._prepareCharacterItems(data);
        } else if (type === 'vehicle') {
            this._prepareVehicleItems(data);
        } else if (type === 'starship') {
            this._prepareStarshipItems(data);
        } else if (type === 'container') {
            this._prepareContainerItems(data);
        }

        data.items = data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        if (type !== 'container') {
            const isCreature = (type === 'creature');
            const attributes = [];
            for (const i in OD6S.attributes) {
                const cfg = OD6S.attributes[i];
                // Creature-only attributes (e.g. Orneriness) are exclusive to creature sheets
                if (cfg.creatureOnly && !isCreature) continue;
                // Creature sheets omit Knowledge, Mechanical, and Technical
                if (isCreature && OD6S.creatureExcludedAttributes?.has(i)) continue;

                const entry = this.actor.system.attributes[i];
                if (!entry) continue; // guard against unmigrated actors
                entry.id = i;
                entry.sort = cfg.sort;
                entry.active = cfg.active;
                attributes.push(entry);
            }
            data.attrs = attributes.sort((a, b) => a.sort - b.sort);
        }

        return data;
    }

    /**
     * Ensure common flags exist the first time a sheet is rendered.
     * Moved here from getData() to avoid unawaited async writes inside a sync getter.
     * @override
     */
    async _onFirstRender(context, options) {
        await super._onFirstRender?.(context, options);
        const actor = this.actor;
        if (actor.getFlag('od6s', 'fatepointeffect') === undefined)
            actor.setFlag('od6s', 'fatepointeffect', false);
        if (actor.getFlag('od6s', 'crew') === undefined)
            actor.setFlag('od6s', 'crew', '');
        if (actor.getFlag('od6s', 'hasTakenTurn') === undefined)
            actor.setFlag('od6s', 'hasTakenTurn', false);
    }

    /* -------------------------------------------- */
    /*  Item Preparation                             */
    /* -------------------------------------------- */

    /**
     * Applies attribute-based score bonuses to skills and specializations in-place.
     * Shared by character, vehicle, and starship item prep.
     * @param {Object[]} items     - raw item array from sheetData
     * @param {Object}   actorData - sheetData.actor
     */
    _applySkillScores(items, actorData) {
        for (const i of items) {
            if (i.type === 'skill') {
                if (!OD6S.flatSkills &&
                    i.system.score !== undefined &&
                    i.system.attribute !== undefined &&
                    !i.system.isAdvancedSkill) {
                    i.system.score = (+i.system.score) +
                        (+actorData.system.attributes[i.system.attribute.toLowerCase()].score);
                }
            } else if (i.type === 'specialization') {
                if (!OD6S.flatSkills) {
                    i.system.score = (+i.system.score) +
                        (+actorData.system.attributes[i.system.attribute.toLowerCase()].score);
                }
            }
        }
    }

    /**
     * Organize and classify Items for Character/NPC/Creature sheets.
     * @param {Object} sheetData
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        const buckets = {
            gear: [],
            skills: [],
            specializations: [],
            weapons: [],
            armor: [],
            advantages: [],
            disadvantages: [],
            specialabilities: [],
            cybernetics: [],
            manifestations: [],
            actions: []
        };

        const typeMap = {
            gear: 'gear',
            weapon: 'weapons',
            armor: 'armor',
            advantage: 'advantages',
            disadvantage: 'disadvantages',
            specialability: 'specialabilities',
            cybernetic: 'cybernetics',
            manifestation: 'manifestations',
            action: 'actions'
        };

        for (const i of sheetData.items) {
            i.img = i.img || CONST.DEFAULT_TOKEN;
            if (i.type === 'skill') {
                buckets.skills.push(i);
            } else if (i.type === 'specialization') {
                buckets.specializations.push(i);
            } else if (typeMap[i.type]) {
                buckets[typeMap[i.type]].push(i);
            }
        }

        this._applySkillScores([...buckets.skills, ...buckets.specializations], actorData);

        const bySort = arr => arr.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        actorData.gear             = bySort(buckets.gear);
        actorData.skills           = buckets.skills.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        actorData.specializations  = bySort(buckets.specializations);
        actorData.weapons          = bySort(buckets.weapons);
        actorData.armor            = bySort(buckets.armor);
        actorData.advantages       = bySort(buckets.advantages);
        actorData.disadvantages    = bySort(buckets.disadvantages);
        actorData.specialabilities = bySort(buckets.specialabilities);
        actorData.cybernetics      = bySort(buckets.cybernetics);
        actorData.manifestations   = bySort(buckets.manifestations);
        actorData.actions          = bySort(buckets.actions);
    }

    /**
     * Organize items for Vehicle sheets.
     * @param {Object} sheetData
     */
    _prepareVehicleItems(sheetData) {
        const actorData = sheetData.actor;
        const vehicle_weapons = [];
        const vehicle_gear    = [];
        const cargo_hold      = [];
        const skills          = [];
        const specializations = [];

        for (const i of sheetData.items) {
            i.img = i.img || CONST.DEFAULT_TOKEN;
            if (i.type === 'skill')             { skills.push(i); }
            else if (i.type === 'specialization') { specializations.push(i); }
            else if (i.type === 'vehicle-weapon') { vehicle_weapons.push(i); }
            else if (i.type === 'vehicle-gear')   { vehicle_gear.push(i); }
            else if (['armor', 'weapon', 'gear'].includes(i.type)) { cargo_hold.push(i); }
        }

        this._applySkillScores([...skills, ...specializations], actorData);

        actorData.vehicle_weapons = vehicle_weapons;
        actorData.vehicle_gear    = vehicle_gear;
        actorData.cargo_hold      = cargo_hold;
        actorData.skills          = skills;
        actorData.specializations = specializations;
    }

    /**
     * Organize items for Starship sheets.
     * @param {Object} sheetData
     */
    _prepareStarshipItems(sheetData) {
        const actorData = sheetData.actor;
        const starship_weapons = [];
        const starship_gear    = [];
        const cargo_hold       = [];
        const skills           = [];
        const specializations  = [];

        for (const i of sheetData.items) {
            i.img = i.img || CONST.DEFAULT_TOKEN;
            if (i.type === 'skill')              { skills.push(i); }
            else if (i.type === 'specialization')  { specializations.push(i); }
            else if (i.type === 'starship-weapon') { starship_weapons.push(i); }
            else if (i.type === 'starship-gear')   { starship_gear.push(i); }
            else if (['armor', 'weapon', 'gear'].includes(i.type)) { cargo_hold.push(i); }
        }

        this._applySkillScores([...skills, ...specializations], actorData);

        actorData.starship_weapons = starship_weapons;
        actorData.starship_gear    = starship_gear;
        actorData.cargo_hold       = cargo_hold;
        actorData.skills           = skills;
        actorData.specializations  = specializations;
    }

    /**
     * Organize items for Container sheets.
     * @param {Object} sheetData
     */
    _prepareContainerItems(sheetData) {
        if (!this.actor.isOwner) return;
        const actorData = sheetData.actor;
        const container = [];
        for (const i of sheetData.items) {
            i.img = i.img || CONST.DEFAULT_TOKEN;
            container.push(i);
        }
        actorData.container = container;
    }

    /* -------------------------------------------- */
    /*  Sort Helpers                                 */
    /* -------------------------------------------- */

    _sortItems(items, sortType) {
        if (sortType === 'alpha') {
            return items.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    _resetSortToAlpha(items) {
        items = items.sort((a, b) => a.name.localeCompare(b.name));
        let sortNumber = 1000;
        for (const i in items) {
            items[i].sort = sortNumber;
            sortNumber += 500;
        }
        return items;
    }

    async _alphaSortAllItems() {
        const items = this._resetSortToAlpha(this.actor.items.contents);
        const updates = items.map(i => ({ _id: i._id, sort: i.sort }));
        await this.actor.updateEmbeddedDocuments('Item', updates);
    }

    /* -------------------------------------------- */
    /*  Event Listeners                              */
    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        // Alpha sort items
        html.find('.alpha-item-sort-button').click(async () => {
            await this._alphaSortAllItems();
        });

        // Stun Tracker reset
        html.find('.track_stuns_counter').click(async ev => {
            ev.preventDefault();
            await this.actor.update({ system: { stuns: { value: 0 } } });
            this.render();
        });

        // Embedded Pilot
        html.find('.embedded-pilot-add').click(async ev => {
            ev.preventDefault();
            const data = {
                targets: game.collections.get('Actor').filter(a => a.type === 'npc' && !a.isToken),
                actor: this.actor.uuid
            };
            await new OD6SAddEmbeddedCrew(data).render({force: true});
        });

        html.find('.embedded-pilot-remove').click(async () => {
            let removeSkills = this.actor.skills.map(i => i._id)
                .concat(this.actor.specializations.map(i => i._id));
            if (removeSkills.length > 0) {
                await this.actor.deleteEmbeddedDocuments('Item', removeSkills);
            }
            const update = { system: {} };
            for (const a in this.actor.system.attributes) {
                update[`system.attributes.${a}.base`] = 0;
                update[`system.embedded_pilot.actor`] = "";
            }
            await this.actor.update(update);
            this.render();
        });

        // Character Creation
        html.find('.create-character').click(async () => {
            const newChar = new OD6SCreateCharacter(this.actor,
                od6sutilities.getAllItemsByType('character-template'));
            newChar.render({force: true});
            await this.close();
        });

        // Roll Body Points
        html.find('.rollbodypoints').click(async () => {
            const confirmText = `<p>${game.i18n.localize("OD6S.CONFIRM_ROLL_BODYPOINTS")}</p>`;
            await Dialog.prompt({
                title: `${game.i18n.localize("OD6S.ROLL")} ${game.i18n.localize(OD6S.bodyPointsName)}`,
                content: confirmText,
                callback: () => this._rollBodyPoints()
            });
        });

        // Purchase click event
        html.find('.item-purchase').click(async ev => {
            if (game.user.character === undefined) {
                ui.notifications.warn(game.i18n.localize('OD6S.WARN_NO_CHARACTER_ASSIGNED'));
                return;
            }
            if (OD6S.cost === '0') {
                await this.rollPurchase(ev, game.user.character.id);
            } else {
                await this._onPurchase(ev.currentTarget.dataset.itemId, game.user.character.id);
            }
        });

        // Transfer click event
        html.find('.item-transfer').click(async ev => {
            if (game.user.character === undefined) {
                ui.notifications.warn(game.i18n.localize('OD6S.WARN_NO_CHARACTER_ASSIGNED'));
                return;
            }
            await this._onTransfer(
                ev.currentTarget.dataset.itemId,
                ev.currentTarget.dataset.senderId,
                ev.currentTarget.dataset.recId
            );
        });

        // Edit body points
        html.find('.editbodypoints').change(async ev => {
            await this.actor.setWoundLevelFromBodyPoints(ev.target.value);
            this.render();
        });

        // Edit funds
        html.find('.edit-funds').change(async ev => {
            const oldScore = od6sutilities.getDiceFromScore(this.actor.system.funds.score);
            let { dice, pips } = oldScore;
            if (ev.target.id === 'funds-dice')       dice = +ev.target.value;
            else if (ev.target.id === 'funds-pips')  pips = +ev.target.value;
            await this.actor.update({ [`system.funds.score`]: od6sutilities.getScoreFromDice(dice, pips) });
            this.render();
        });

        // Edit maneuverability
        html.find('.edit-maneuverability').change(async ev => {
            const oldScore = od6sutilities.getDiceFromScore(this.actor.system.maneuverability.score);
            let { dice, pips } = oldScore;
            if (ev.target.id === 'maneuverability-dice')      dice = +ev.target.value;
            else if (ev.target.id === 'maneuverability-pips') pips = +ev.target.value;
            await this.actor.update({ [`system.maneuverability.score`]: od6sutilities.getScoreFromDice(dice, pips) });
            this.render();
        });

        // Edit toughness
        html.find('.edit-toughness').change(async ev => {
            const oldScore = od6sutilities.getDiceFromScore(this.actor.system.toughness.score);
            let { dice, pips } = oldScore;
            if (ev.target.id === 'toughness-dice')      dice = +ev.target.value;
            else if (ev.target.id === 'toughness-pips') pips = +ev.target.value;
            await this.actor.update({ [`system.toughness.score`]: od6sutilities.getScoreFromDice(dice, pips) });
            this.render();
        });

        // Edit item quantity
        html.find('.edit-quantity').change(async ev => {
            const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
            await item.update({ [`system.quantity`]: ev.target.value });
        });

        // Use a consumable
        html.find('.use-consumable').click(async ev => {
            const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
            await item.update({ [`system.quantity`]: item.system.quantity - 1 });
            await this._syncEffectsForItem(item);
        });

        // Activate a manifestation
        html.find('.active-checkbox').click(async ev => {
            ev.preventDefault();
            const item = this.actor.items.find(i => i.id === ev.currentTarget.dataset.itemId);
            if (!item) return;
            if (item.system.attack) return;
            await item.update({ 'system.active': !item.system.active });
            await this._syncManifestationEffects(item);
            this.render();
        });

        // Equip an item
        html.find('.equip-checkbox').change(async ev => {
            const item = this.actor.items.find(i => i.id === ev.currentTarget.dataset.itemId);
            if (!item) return;
            await item.update({ 'system.equipped.value': !item.system.equipped.value });
            await this._syncEquipEffects(item);
            this.render();
        });

        // Free edit attribute
        const attributeEditDialog = new od6sattributeedit();
        html.find('.attribute-edit').click(attributeEditDialog._onAttributeEdit.bind(this));

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));
        html.find('.cargo-hold-add').click(this.actor.onCargoHoldItemCreate.bind(this.actor));

        // Active Effects
        html.find('.effect-edit').click(async ev => {
            const effect = this.actor.effects.get(ev.currentTarget.dataset.effectId);
            await effect.sheet.render(true);
        });

        html.find('.effect-delete').click(async ev => {
            await this.actor.deleteEmbeddedDocuments('ActiveEffect', [ev.currentTarget.dataset.effectId]);
        });

        // Edit Inventory Item
        html.find('.item-edit').click(async ev => {
            let itemId = ev.currentTarget.dataset.itemId;
            if (!itemId) {
                itemId = $(ev.currentTarget).parents(".item").data("itemId");
            }
            this.actor.items.get(itemId)?.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(async ev => {
            ev.preventDefault();
            await this.deleteItem(ev);
        });

        // Rollable abilities
        const rollDialog   = new od6sroll();
        const advanceDialog  = new od6sadvance();
        const specDialog     = new od6sspecialize();
        html.find('.rolldialog').click(rollDialog._onRollEvent.bind(this));
        html.find('.initrolldialog').click(od6sInitRoll._onInitRollDialog.bind(this));
        html.find('.actionroll').click(rollDialog._onRollItem.bind(this));
        html.find('.advancedialog').click(advanceDialog._onAdvance.bind(this));
        html.find('.specializedialog').click(specDialog._onSpecialize.bind(this));

        // Reset character template
        html.find('.reset-template').click(() => {
            Dialog.prompt({
                title: game.i18n.localize("OD6S.CLEAR_TEMPLATE"),
                content: `<p>${game.i18n.localize("OD6S.CONFIRM_TEMPLATE_CLEAR")}</p>`,
                callback: () => this._onClearCharacterTemplate()
            });
        });

        html.find('.reset-species-template').click(() => {
            Dialog.prompt({
                title: game.i18n.localize("OD6S.CLEAR_SPECIES_TEMPLATE"),
                content: `<p>${game.i18n.localize("OD6S.CONFIRM_SPECIES_TEMPLATE_CLEAR")}</p>`,
                callback: () => this._onClearSpeciesTemplate()
            });
        });

        // Force-exit from vehicle
        html.find(".vehicle-exit").click(async ev => {
            ev.preventDefault();
            await this.actor.setFlag('od6s', 'crew', '');
        });

        // Add Item to actor using a button
        html.find('.item-add').click(async ev => {
            ev.preventDefault();
            await this.addItem(ev);
        });

        // Open a crewmember's character sheet
        html.find(".crew-member").click(async ev => {
            const actor = await od6sutilities.getActorFromUuid(ev.currentTarget.dataset.uuid);
            if (actor.testUserPermission(game.user, "OWNER")) actor.sheet.render({force: true});
        });

        // Add/remove crew to vehicles
        html.find(".crew-add").click(async ev => {
            ev.preventDefault();
            if (!game.scenes.active) return;
            let tokens = game.scenes.active.tokens.filter(
                t => t.actor != null && t.actor.type !== "vehicle" && t.actor.type !== "starship"
            );

            if (!tokens.length) { ui.notifications.warn(game.i18n.localize('OD6S.NO_TOKENS')); return; }

            if (game.user.isGM) {
                tokens = tokens.filter(t => !t.actor.isCrewMember());
            } else {
                tokens = tokens.filter(t => t.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY);
                const crewed = [];
                for (const t of tokens) {
                    if (await OD6S.socket.executeAsGM("checkCrewStatus", t.actor.uuid)) crewed.push(t);
                }
                tokens = tokens.filter(t => !crewed.includes(t));
            }

            if (!tokens.length) { ui.notifications.warn(game.i18n.localize('OD6S.NO_TOKENS')); return; }

            new OD6SAddCrew({ crew: [], targets: tokens, actor: this.actor.uuid, type: this.actor.type }).render(true);
        });

        html.find('.crew-delete').click(async ev => {
            ev.preventDefault();
            const { crewid, vehicleid } = ev.currentTarget.dataset;
            if (!game.user.isGM && this.actor.uuid === crewid) {
                return OD6S.socket.executeAsGM('unlinkCrew', crewid, vehicleid);
            } else if (game.user.isGM && this.actor.uuid === crewid) {
                const vehicle = await od6sutilities.getActorFromUuid(vehicleid);
                await vehicle.sheet.unlinkCrew(this.actor.uuid);
            } else {
                return this.unlinkCrew(crewid);
            }
        });

        // Add/remove actions
        html.find('.addaction').click(() => this._onActionAdd());

        html.find('.combat-action').contextmenu(ev => this._onAvailableActionAdd(ev));
        html.find('.combat-action').click(async ev => this._rollAvailableAction(ev));
        html.find('.vehicle-action').click(async ev => this._rollAvailableVehicleAction(ev));

        // Edit misc action
        html.find('.editmiscaction').change(async ev => {
            const action = this.actor.items.find(i => i.id === ev.currentTarget.dataset.itemId);
            await action.update({ name: ev.target.value });
            this.render();
        });

        // Edit active effect
        html.find('.edit-effect').click(async ev => this._editEffect(ev));

        // Fate point in effect checkbox
        html.find('.fatepointeffect').change(async () => {
            if (this.actor.system.fatepoints.value < 1) {
                await this.actor.setFlag('od6s', 'fatepointeffect', false);
                this.render();
                return;
            }
            const inEffect = this.actor.getFlag('od6s', 'fatepointeffect');
            await this.actor.setFlag('od6s', 'fatepointeffect', !inEffect);
            if (!inEffect) {
                await this.actor.update({
                    system: { fatepoints: { value: this.actor.system.fatepoints.value - 1 } }
                }, { diff: true });
            }
        });

        // Vehicle shield arc allocation (vehicle sheet)
        html.find('.arc').click(async ev => {
            const { arc, direction } = ev.currentTarget.dataset;
            const shields = this.actor.system.shields;
            let { allocated } = shields;
            let newValue = shields.arcs[arc].value;
            let doUpdate = false;

            if (direction === "up" && allocated < shields.value) {
                newValue++; allocated++; doUpdate = true;
            } else if (direction !== "up" && shields.arcs[arc].value > 0) {
                newValue--;
                allocated > 0 ? allocated-- : ui.notifications.error(game.i18n.localize('OD6S.ALLOCATION_ERROR'));
                doUpdate = true;
            }

            if (doUpdate) {
                await this.actor.update({
                    system: {
                        shields: {
                            allocated,
                            arcs: { [arc]: { value: newValue } }
                        }
                    }
                }, { diff: true });
            }
        });

        // Show item details
        html.find('.show-item-details').click(async ev => {
            ev.preventDefault();
            let item = game.actors.get(ev.currentTarget.dataset.actorId)?.items.get(ev.currentTarget.dataset.itemId);
            if (!item) {
                const name = ev.currentTarget.dataset.itemName;
                item = await od6sutilities._getItemFromWorld(name)
                    ?? await od6sutilities._getItemFromCompendium(name);
            }
            if (item) new OD6SItemInfo(item).render(true);
        });

        html.find('.merchant-quantity-owner').change(async ev => {
            const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
            await this.actor.updateEmbeddedDocuments('Item', [{ _id: item.id, system: { quantity: ev.target.value } }]);
        });

        html.find('.merchant-cost-owner').change(async ev => {
            const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
            await this.actor.updateEmbeddedDocuments('Item', [{ _id: item.id, system: { cost: ev.target.value } }]);
        });

        html.find('.merchant-price-owner').change(async ev => {
            const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
            await this.actor.updateEmbeddedDocuments('Item', [{ _id: item.id, system: { price: ev.target.value } }]);
        });

        // Vehicle shield arc allocation (crew member view)
        html.find('.c-arc').click(async ev => {
            const actor = await od6sutilities.getActorFromUuid(ev.currentTarget.dataset.uuid);
            const { arc, direction } = ev.currentTarget.dataset;
            const shields = this.actor.system.vehicle.shields;
            let { allocated } = shields;
            let newValue = shields.arcs[arc].value;
            let doUpdate = false;

            if (direction === "up" && allocated < shields.value) {
                newValue++; allocated++; doUpdate = true;
            } else if (direction !== "up" && shields.arcs[arc].value > 0) {
                newValue--;
                allocated > 0 ? allocated-- : ui.notifications.error(game.i18n.localize('OD6S.ALLOCATION_ERROR'));
                doUpdate = true;
            }

            if (doUpdate) {
                const update = {
                    system: {
                        shields: {
                            allocated,
                            arcs: { [arc]: { value: newValue } }
                        }
                    }
                };
                if (game.user.isGM) {
                    await actor.update(update, { diff: true });
                } else {
                    update.uuid = ev.currentTarget.dataset.uuid;
                    this.actor.modifyShields(update);
                }
            }
        });

        // Skill/spec usage tracking
        html.find('.skill-used-checkbox, .spec-used-checkbox').change(async ev => {
            const item = this.actor.items.get($(ev.currentTarget).data('item-id'));
            if (item) await item.update({ 'system.used.value': ev.currentTarget.checked })
                .catch(err => console.error('Failed to update item used status:', err));
        });

        html.find('.session-reset-button').click(() => {
            html.find('.skill-used-checkbox, .spec-used-checkbox').each((_, checkbox) => {
                const item = this.actor.items.get($(checkbox).data('item-id'));
                if (item) {
                    item.update({ 'system.used.value': false })
                        .catch(err => console.error('Failed to reset item used status:', err));
                    $(checkbox).prop('checked', false);
                }
            });
        });

        // Drag events
        if (this.actor.isOwner) {
            if (this.actor.type === 'container' && !game.user.isGM) return;
            const handler = ev => this._onDragStart(ev);
            html.find('li.item').each((_, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
            html.find('li.availableaction').each((_, li) => {
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", this._dragAvailableCombatAction, false);
            });
            html.find('li.assignedaction').each((_, li) => {
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", this._dragAssignedCombatAction, false);
            });
            html.find('li.crew-list').each((_, li) => {
                li.setAttribute('draggable', true);
                li.addEventListener("dragstart", this._dragCrewMember, false);
            });
        }
    }

    /* -------------------------------------------- */
    /*  Active Effect Sync Helpers                   */
    /* -------------------------------------------- */

    /**
     * Enable active effects sourced from a given item (used when a consumable is used).
     * @param {Item} item
     */
    async _syncEffectsForItem(item) {
        const actorEffects = this.actor.getEmbeddedCollection('ActiveEffect');
        if (!actorEffects.size) return;
        const updates = [];
        actorEffects.forEach(e => {
            const docId = this._getEffectSourceItemId(e);
            if (docId && this.actor.items.find(i => i.id === docId) && e.disabled) {
                updates.push({ _id: e.id, disabled: false });
            }
        });
        if (updates.length) await this.actor.updateEmbeddedDocuments('ActiveEffect', updates);
    }

    /**
     * Sync active effects tied to a manifestation's active state.
     * @param {Item} item
     */
    async _syncManifestationEffects(item) {
        const actorEffects = this.actor.getEmbeddedCollection('ActiveEffect');
        if (!actorEffects.size) return;
        const updates = [];
        actorEffects.forEach(e => {
            const docId = this._getEffectSourceItemId(e);
            if (!docId) return;
            const effectItem = this.actor.items.find(i => i.id === docId);
            if (effectItem && !effectItem.system.consumable && effectItem.type === 'manifestation') {
                if (e.disabled === effectItem.system.active) {
                    updates.push({ _id: e.id, disabled: !item.system.active });
                }
            }
        });
        if (updates.length) await this.actor.updateEmbeddedDocuments('ActiveEffect', updates);
    }

    /**
     * Sync active effects when an item is equipped/unequipped.
     * @param {Item} item
     */
    async _syncEquipEffects(item) {
        const actorEffects = this.actor.getEmbeddedCollection('ActiveEffect');
        if (!actorEffects.size) return;
        const effectUpdates = [];
        const itemUpdates   = [];

        actorEffects.forEach(e => {
            const docId = this._getEffectSourceItemId(e);
            if (!docId) return;
            const effectItem = this.actor.items.find(i => i.id === docId);
            if (!effectItem || effectItem.system.consumable || !OD6S.equippable.includes(effectItem.type)) return;
            if (e.disabled !== effectItem.system.equipped.value) return;

            if (!effectItem.system.equipped.value) {
                for (const c of e.changes) {
                    if (c.key.startsWith('system.items.skills') && c.mode === 2) {
                        const skillName = c.key.split('.')[3];
                        const skillItem = this.actor.items.find(i => i.name === skillName);
                        if (skillItem) itemUpdates.push({ _id: skillItem.id, system: { mod: 0 } });
                    }
                }
            }
            effectUpdates.push({ _id: e.id, disabled: !item.system.equipped.value });
        });

        if (effectUpdates.length) await this.actor.updateEmbeddedDocuments('ActiveEffect', effectUpdates);
        for (const u of itemUpdates) {
            const a = this.actor.items.find(i => i.id === u._id);
            await a?.update(u);
        }
    }

    /**
     * Extract the source item id from an active effect's origin string.
     * Handles both world actors (`Actor.x.Item.y`) and scene token actors
     * (`Scene.s.Token.t.Actor.x.Item.y`).
     * @param {ActiveEffect} effect
     * @returns {string|null}
     */
    _getEffectSourceItemId(effect) {
        const parts = effect.origin?.split('.') ?? [];
        const itemIdx = parts.indexOf('Item');
        return itemIdx !== -1 ? parts[itemIdx + 1] : null;
    }

    /* -------------------------------------------- */
    /*  Item / Action Management                     */
    /* -------------------------------------------- */

    async deleteItem(ev) {
        // If this is a skill, deny if there are existing specializations
        if (ev.currentTarget.dataset.type === "skill") {
            for (const i of this.actor.items) {
                if (i.type === "specialization" && i.skill === ev.currentTarget.dataset.itemId) {
                    ui.notifications.error(game.i18n.localize("OD6S.ERR_SKILL_HAS_SPEC"));
                    return;
                }
            }
        }

        let itemId = ev.currentTarget.dataset.itemId;
        if (!itemId) itemId = $(ev.currentTarget).parents(".item").data("itemId");

        if (ev.currentTarget.dataset.confirm !== "false") {
            await Dialog.prompt({
                title: game.i18n.localize("OD6S.DELETE"),
                content: `<p>${game.i18n.localize("OD6S.DELETE_CONFIRM")}</p>`,
                callback: async () => {
                    await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
                    this.render(false);
                }
            });
        } else {
            await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
            this.render(false);
        }
    }

    async addItem(ev, caller = this) {
        const data = {};
        data.type     = ev.currentTarget.dataset.type;
        data.attrname = ev.currentTarget.dataset.attrname;
        data.new      = !(ev.currentTarget.dataset.new !== undefined && ev.currentTarget.dataset.new === 'false');
        data.label       = `${game.i18n.localize('OD6S.ADD')} ${game.i18n.localize(OD6S.itemLabels[data.type])}`;
        data.label_empty = `${game.i18n.localize('OD6S.ADD_EMPTY')} ${game.i18n.localize(OD6S.itemLabels[data.type])}`;

        let worldItems     = game.items.filter(i => i.type === data.type);
        let compendiumItems = [];
        const cEntries     = od6sutilities.getItemsFromCompendiumByType(data.type);

        if (data.type === 'skill') {
            worldItems = worldItems.filter(i => i.system.attribute === data.attrname);
            for (const i of cEntries) {
                const item = await od6sutilities._getItemFromCompendium(i.name);
                if (item.system.attribute === data.attrname) compendiumItems.push(item);
            }
        } else {
            for (const i of cEntries) {
                compendiumItems.push(await od6sutilities._getItemFromCompendium(i.name));
            }
        }

        if (data.type === 'skill') {
            worldItems      = worldItems.filter(i => !this.actor.items.find(r => r.name === i.name));
            compendiumItems = compendiumItems.filter(i => !this.actor.items.find(r => r.name === i.name));
        }

        // Prefer world items over compendium duplicates
        compendiumItems = compendiumItems.filter(i => !worldItems.find(r => r.name === i.name));

        data.items = [...worldItems, ...compendiumItems].sort((a, b) => {
            const x = a.name.toUpperCase(), y = b.name.toUpperCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });

        data.serializeditems = JSON.stringify(data.items);
        data.actor      = this.actor.id;
        data.token      = this.actor.isToken ? this.actor.token._id : '';
        data.actorType  = this.actor.type;

        if (data.type === 'skill' || data.type === 'spec') {
            if (data.type === 'skill' && data.attrname === 'met' &&
                game.settings.get('od6s', 'metaphysics_attribute_optional')) {
                data.score = OD6S.pipsPerDice;
            } else {
                data.score = this.actor.system.attributes[data.attrname].base;
            }
        } else {
            data.score = 0;
        }

        data.caller = caller;
        await new OD6SAddItem(data).render(true);
    }

    /**
     * Adds a generic 'misc' action to the action list.
     */
    async _onActionAdd() {
        await this._createAction({ name: game.i18n.localize('OD6S.ACTION_OTHER'), subtype: 'misc' });
        this.render();
    }

    /**
     * Add an action via right-click on a combat action button.
     */
    async _onAvailableActionAdd(event) {
        await this._createAction({
            name:    event.currentTarget.dataset.name,
            type:    "availableaction",
            subtype: event.currentTarget.dataset.type,
            itemId:  event.currentTarget.dataset.id,
            rollable: event.currentTarget.dataset.rollable
        });
    }

    /**
     * Handle creating a new Owned Item via a create button in the sheet.
     * @param {Event} event
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type   = header.dataset.type;
        const data   = foundry.utils.deepClone({ ...header.dataset });
        const name   = `${game.i18n.localize('OD6S.NEW')} ${game.i18n.localize('ITEM.Type' + type.capitalize())}`;
        const itemData = { name, type, data };
        delete itemData.data["type"];
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    /* -------------------------------------------- */
    /*  Drop Handlers                                */
    /* -------------------------------------------- */

    /**
     * Handle dropping an item group onto the actor.
     */
    async _onDropItemGroup(event, item) {
        if (!this.actor.isOwner) return false;
        if (!item.system.actor_types.includes(this.actor.type)) return false;
        const templateItems = await this._templateItems(item.system.items);
        if (templateItems.length) await this.actor.createEmbeddedDocuments('Item', templateItems);
    }

    /**
     * Handle dropping a species template onto the actor.
     */
    async _onDropSpeciesTemplate(event, item) {
        if (!this.actor.isOwner) return false;
        if (!['character', 'npc'].includes(this.actor.type)) return false;
        if (this.actor.items.find(E => E.type === 'species-template')) {
            ui.notifications.error(game.i18n.localize("OD6S.ERROR_SPECIES_TEMPLATE_ALREADY_ASSIGNED"));
            return false;
        }

        const update = { system: { attributes: {} } };
        for (const attribute in item.system.attributes) {
            update.system.attributes[attribute] = {
                min: item.system.attributes[attribute].min,
                max: item.system.attributes[attribute].max
            };
        }
        update['system.species.content'] = item.name;
        await this.actor.update(update, { diff: true });

        const templateItems = await this._templateItems(item.system.items);
        templateItems.push(item);
        if (templateItems.length) await this.actor.createEmbeddedDocuments('Item', templateItems);
    }

    /**
     * Handle dropping a character template onto the actor.
     */
    async _onDropCharacterTemplate(event, item) {
        if (!this.actor.isOwner) return false;
        if (this.actor.type !== 'character') return false;
        if (this.actor.items.find(E => E.type === 'character-template')) {
            ui.notifications.error(game.i18n.localize("OD6S.ERROR_TEMPLATE_ALREADY_ASSIGNED"));
            return false;
        }
        await this._addCharacterTemplate(item);
    }

    async _addCharacterTemplate(item) {
        const itemData = item.system;
        const update = { system: {} };

        update.system['chartype.content']              = item.name;
        if (!update.system['species.content'])
            update.system['species.content']           = itemData.species;
        update.system['fatepoints.value']              = itemData.fp;
        update.system['characterpoints.value']         = itemData.cp;
        update.system['credits.value']                 = itemData.credits;
        update.system['funds.score']                   = itemData.funds;
        update.system['move.value']                    = itemData.move;
        update.system['background.content']            = itemData.description;
        update.system['metaphysicsextranormal.value']  = itemData.me;

        for (const attribute in itemData.attributes) {
            update.system[`attributes.${attribute}.base`] = itemData.attributes[attribute];
        }
        await this.actor.update(update, { diff: true });

        const templateItems = await this._templateItems(itemData.items);
        templateItems.push(item);
        if (templateItems.length) await this.actor.createEmbeddedDocuments('Item', templateItems);
    }

    /**
     * Resolves an array of template item descriptors to actual Item documents.
     * @param {Object[]} itemList
     * @returns {Promise<Object[]>}
     */
    async _templateItems(itemList) {
        const templateItems = [];
        for (const i of itemList) {
            let templateItem = await od6sutilities._getItemFromWorld(i.name)
                ?? await od6sutilities._getItemFromCompendium(i.name);
            if (!templateItem) continue;

            if ((i.type === 'advantage' || i.type === 'disadvantage') &&
                game.settings.get('od6s', 'hide_advantages_disadvantages')) continue;

            if (i.description) templateItem.description = i.description;

            // Skip duplicates for these item types
            if (['skill', 'specialization', 'specialability', 'disadvantage', 'advantage'].includes(i.type)) {
                if (this.actor.items.filter(e => e.type === i.type && e.name === i.name).length) continue;
            }

            // Metaphysics skills default to 1D if the attribute is not used
            if (templateItem.type === 'skill' && templateItem.system.attribute === 'met' &&
                game.settings.get('od6s', 'metaphysics_attribute_optional')) {
                templateItem.system.base = OD6S.pipsPerDice;
            }

            templateItems.push(templateItem);
        }
        return templateItems;
    }

    /** @override */
    async _onDrop(event) {
        event.preventDefault();
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        const allowed = Hooks.call("dropActorSheetData", this.actor, this, data);
        if (allowed === false) return;

        switch (data.type) {
            case "ActiveEffect":
                return this._onDropActiveEffect(event, data);
            case "Actor":
                return this._onDropActor(event, data);
            case "Item": {
                const item = await Item.fromDropData(data);
                switch (item.type) {
                    case "character-template":
                        return this._onDropCharacterTemplate(event, item, data);
                    case "item-group":
                        return this._onDropItemGroup(event, item, data);
                    case "species-template":
                        return this._onDropSpeciesTemplate(event, item, data);
                    case "skill":
                        if (!item.system.attribute) {
                            ui.notifications.error(game.i18n.localize('OD6S.MISSING_ATTRIBUTE'));
                            return;
                        }
                        return this._onDropItem(event, data);
                    case "specialization":
                        if (!item.system.attribute) {
                            ui.notifications.error(game.i18n.localize('OD6S.MISSING_ATTRIBUTE'));
                            return;
                        }
                        if (!item.system.skill) {
                            ui.notifications.error(game.i18n.localize('OD6S.MISSING_SKILL'));
                            return;
                        }
                        if (!this.actor.items.find(i => i.type === 'specialization' && i.name === item.name)) {
                            ui.notifications.warn(game.i18n.localize('OD6S.DOES_NOT_POSSESS_SKILL'));
                            return;
                        }
                        return this._onDropItem(event, data);
                    default:
                        return this._onDropItem(event, data);
                }
            }
            case "Folder":
                return this._onDropFolder(event, data);
            case "availableaction":
                return this._createAction(data);
            case "assignedaction":
                data.type = "action";
                data._id  = data.itemId;
                return this._onSortItem(event, data);
            case "crewmember":
                return this._onSortCrew(event, data);
        }
        this.render();
    }

    /** @override */
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        const item     = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        // Verify the actor can have this item type
        if (this.actor.type !== 'starship' && this.actor.type !== 'vehicle') {
            if (!OD6S.allowedItemTypes[this.actor.type]?.includes(itemData.type)) return false;
        }

        // Disable active effects on items that need to be equipped first
        if (this.actor.type === 'character') {
            if (!['cybernetic', 'advantage', 'disadvantage', 'specialability'].includes(itemData.type)) {
                itemData.effects.forEach(e => { e.disabled = true; });
            }
        } else if (this.actor.type === 'container') {
            if (this._isEquippable(itemData.type)) itemData.system.equipped.value = false;
        } else {
            if (OD6S.allowedItemTypes[this.actor.type]?.includes(itemData.type)) {
                if (this._isEquippable(itemData.type)) itemData.system.equipped.value = true;
            } else {
                if (this._isEquippable(itemData.type)) itemData.system.equipped.value = false;
                itemData.effects.forEach(e => { e.disabled = true; e.transfer = false; });
            }
        }

        // Handle item sorting within the same actor
        if (item.parent !== null && data.uuid.startsWith(item.parent.uuid)) {
            if ((this.actor.type === 'starship' || this.actor.type === 'vehicle') &&
                !OD6S.allowedItemTypes[this.actor.type]?.includes(itemData.type)) {
                await this._onSortItem(event, itemData);
                await this._onSortCargoItem(event, itemData);
            } else if (this.actor.type === 'container') {
                await this._onSortContainerItem(event, itemData);
            } else {
                await this._onSortItem(event, itemData);
            }
        } else {
            // Dragging from one sheet to another
            let sourceActor;
            if (data.actorId && data.tokenId) {
                const scene = game.scenes.get(data.sceneId);
                sourceActor = scene?.tokens.get(data.tokenId)?.actor;
            } else if (data.actorId) {
                sourceActor = game.actors.get(data.actorId);
            }

            if (sourceActor) {
                if (game.user.isGM || sourceActor.isOwner) {
                    const created = await this._onDropItemCreate(itemData);
                    if (created) await sourceActor.deleteEmbeddedDocuments('Item', [itemData._id]);
                } else {
                    ui.notifications.warn('OD6S.WARN_NOT_DELETING_ITEM_OWNER');
                }
            } else {
                await this._onDropItemCreate(itemData);
            }
        }
        this.render();
    }

    /* -------------------------------------------- */
    /*  Sort Methods                                 */
    /* -------------------------------------------- */

    _onSortItem(event, itemData) {
        const items     = this.actor.items;
        const source    = items.get(itemData._id);
        const dropTarget = event.target.closest("li[data-item-id]");
        if (!dropTarget) return;
        const target    = items.get(dropTarget.dataset.itemId);
        if (!target || source.id === target.id) return;

        const siblings = [];
        for (const el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id) siblings.push(items.get(siblingId));
        }

        const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
        const updateData  = sortUpdates.map(u => { const d = u.update; d._id = u.target._id; return d; });
        return this.actor.updateEmbeddedDocuments("Item", updateData);
    }

    async _onSortCrew(event, data) {
        const crewMembers = [...this.actor.system.crewmembers];
        const source      = crewMembers.find(c => c.uuid === data.crewUuid);
        const dropTarget  = event.target.closest("li[data-crew-uuid]");
        if (!dropTarget) return;
        const target      = crewMembers.find(c => c.uuid === dropTarget.dataset.crewUuid);

        const siblings = [];
        for (const el of dropTarget.parentElement.children) {
            const siblingUuid = el.dataset.crewUuid;
            if (siblingUuid && siblingUuid !== source.uuid) {
                siblings.push(crewMembers.find(c => c.uuid === siblingUuid));
            }
        }

        const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
        for (const u of sortUpdates) {
            const member = crewMembers.find(c => c.uuid === u.target.uuid);
            if (member) member.sort = +u.update.sort;
        }
        crewMembers.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
        await this.actor.update({ system: { crewmembers: crewMembers } });
    }

    async _onSortContainerItem(event, itemData) {
        const source     = this.actor.items.get(itemData._id);
        const dropTarget = event.target.closest("[data-item-id]");
        const targetId   = dropTarget?.dataset.itemId ?? null;
        const siblings   = this.actor.items.filter(i => i.type === source.type && i._id !== source._id);
        const target     = siblings.find(s => s._id === targetId);

        if (target && source.type !== target.type) return;

        const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
        const updateData  = sortUpdates.map(u => { const d = u.update; d._id = u.target._id; return d; });
        await this.actor.updateEmbeddedDocuments("Item", updateData);
    }

    async _onSortCargoItem(event, itemData) {
        const source     = this.actor.items.get(itemData._id);
        const siblings   = this.actor.items.filter(i => i._id !== source._id);
        const dropTarget = event.target.closest("[data-item-id]");
        const target     = siblings.find(s => s._id === (dropTarget?.dataset.itemId ?? null));

        const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
        const updateData  = sortUpdates.map(u => { const d = u.update; d._id = u.target._id; return d; });
        return this.actor.updateEmbeddedDocuments("Item", updateData);
    }

    /* -------------------------------------------- */
    /*  Action Roll Helpers                          */
    /* -------------------------------------------- */

    async _rollBodyPoints() {
        const strDice   = od6sutilities.getDiceFromScore(
            this.actor.system.attributes.str.score + this.actor.system.attributes.str.mod
        );
        let rollString;
        if (game.settings.get('od6s', 'use_wild_die')) {
            rollString = strDice.dice < 2 ? "1dw" : `${strDice.dice - 1}d6+1dw`;
        } else {
            rollString = `${strDice.dice}d6`;
        }
        rollString += `+${strDice.pips + 20}`;

        const label    = `${game.i18n.localize('OD6S.ROLLING')} ${game.i18n.localize(OD6S.bodyPointsName)}`;
        const rollMode = game.user.isGM && game.settings.get('od6s', 'hide-gm-rolls')
            ? CONST.DICE_ROLL_MODES.PRIVATE : 0;

        const roll = await new Roll(rollString).evaluate();
        await roll.toMessage({ speaker: ChatMessage.getSpeaker(), flavor: label, rollMode, create: true });
        await this.actor.update({ [`system.wounds.body_points.max`]: roll.total });
    }

    async rollPurchase(ev, buyerId) {
        const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (!item) return ui.notifications.warn(game.i18n.localize('OD6S.ITEM_NOT_FOUND'));
        await od6sroll._onRollDialog({
            name:            `${game.i18n.localize('OD6S.PURCHASE')} ${item.name}`,
            itemId:          item.id,
            actor:           game.actors.get(buyerId),
            seller:          this.actor.id,
            type:            'purchase',
            difficultyLevel: OD6S.difficultyShort[item.system.price],
            score:           game.actors.get(buyerId).system.funds.score
        });
    }

    async _onPurchase(itemId, buyerId) {
        const buyer  = game.actors.get(buyerId);
        const item   = this.actor.items.get(itemId);

        if (OD6S.cost === '1') {
            if ((+buyer.system.credits.value) < (+item.system.cost)) {
                ui.notifications.warn(game.i18n.localize('OD6S.WARN_NOT_ENOUGH_CURRENCY'));
                return;
            }
            await buyer.update({ [`system.credits.value`]: (+buyer.system.credits.value) - (+item.system.cost) });
        }

        const boughtItem = JSON.parse(JSON.stringify(item));
        boughtItem.system.quantity = 1;

        if (item.type === 'gear') {
            const existing = buyer.items.find(i => i.name === item.name);
            if (existing) {
                await existing.update({ [`system.quantity`]: (+existing.system.quantity) + 1 });
            } else {
                await buyer.createEmbeddedDocuments('Item', [boughtItem]);
            }
        } else {
            await buyer.createEmbeddedDocuments('Item', [boughtItem]);
        }

        if (item.system.quantity > 0) {
            await item.update({ 'system.quantity': (+item.system.quantity) - 1 });
        }
    }

    async _onTransfer(itemId, senderId, recId) {
        const sender   = game.actors.get(senderId);
        const receiver = game.actors.get(recId);
        const item     = sender.items.get(itemId);
        const recItem  = JSON.parse(JSON.stringify(item));
        recItem.quantity = 1;

        if (item.type === 'gear') {
            const existing = receiver.items.find(i => i.name === item.name);
            if (existing) {
                await existing.update({ [`system.quantity`]: (+existing.system.quantity) + 1 });
            } else {
                await receiver.createEmbeddedDocuments('Item', [recItem]);
            }
            if (item.system.quantity > 0) {
                await item.update({ 'system.quantity': (+item.system.quantity) - 1 });
            }
            if ((sender.type === 'character' || sender.type === 'container') && item.system.quantity === 0) {
                await sender.deleteEmbeddedDocuments('Item', [item.id]);
            }
        } else {
            await receiver.createEmbeddedDocuments('Item', [recItem]);
            await sender.deleteEmbeddedDocuments('Item', [item.id]);
        }
        this.render();
    }

    /* -------------------------------------------- */
    /*  Template Clearing                            */
    /* -------------------------------------------- */

    async _onClearSpeciesTemplate() {
        const item = this.actor.items.find(E => E.type === 'species-template');
        if (!item) return false;

        const update = { system: {} };
        for (const attribute in this.actor.system.attributes) {
            if (attribute !== 'met') {
                update[`system.attributes.${attribute}`] = {
                    min: OD6S.pipsPerDice * OD6S.speciesMinDice,
                    max: OD6S.pipsPerDice * OD6S.speciesMaxDice
                };
            }
        }

        const characterTemplate = this.actor.items.find(E => E.type === 'character-template');
        update[`system.species.content`] = characterTemplate?.system.species ?? '';

        if (item.system.items != null) {
            for (const templateItem of item.system.items) {
                const actorItem = this.actor.items.find(I => I.name === templateItem.name);
                if (actorItem) await this.actor.deleteEmbeddedDocuments('Item', [actorItem.id]);
            }
        }

        await this.actor.update(update, { diff: true });
        await this.actor.deleteEmbeddedDocuments('Item', [item.id]);
        this.render();
        return true;
    }

    async _onClearCharacterTemplate() {
        const item = this.actor.items.find(E => E.type === 'character-template');
        if (!item) return false;

        const itemData = item.system;
        const update   = { system: {} };

        for (const attribute in itemData.attributes) {
            update.system[`attributes.${attribute}.base`] = 0;
        }
        update.system['chartype.content']              = "";
        const speciesTemplate = this.actor.items.find(E => E.type === 'species-template');
        if (!speciesTemplate) update.system['species.content'] = "";
        update.system['fatepoints.value']              = 0;
        update.system['characterpoints.value']         = 0;
        update.system['credits.value']                 = 0;
        update.system['funds.score']                   = 0;
        update.system['background.content']            = "";
        update.system['metaphysicsextranormal.value']  = false;
        update.system['move.value']                    = 10;
        await this.actor.update(update, { diff: true });

        if (itemData.items != null) {
            for (const templateItem of itemData.items) {
                const actorItem = this.actor.items.find(I => I.name === templateItem.name);
                if (actorItem) await this.actor.deleteEmbeddedDocuments('Item', [actorItem.id]);
            }
        }
        if (this.actor.items.get(item.id)) {
            await this.actor.deleteEmbeddedDocuments('Item', [item.id]);
        }
        this.render();
        return true;
    }

    /* -------------------------------------------- */
    /*  Crew / Vehicle Management                    */
    /* -------------------------------------------- */

    async _onDropActor(event, data) {
        if (!this.actor.isOwner) return false;
        if (this.actor.type !== "vehicle" && this.actor.type !== "starship") return false;

        if (this.actor.system.embedded_pilot?.value) {
            let pilotActor;
            if (data.uuid.startsWith('Compendium')) {
                pilotActor = await fromUuid(data.uuid);
            } else {
                pilotActor = await od6sutilities.getActorFromUuid(data.uuid);
            }
            if (!pilotActor) {
                ui.notifications.warn(game.i18n.localize('OD6S.ACTOR_NOT_FOUND'));
                return false;
            }
            await this.actor.addEmbeddedPilot(pilotActor);
        } else {
            await this.linkCrew(data.uuid);
        }
    }

    async linkCrew(uuid) {
        if (this.actor.system.crewmembers.some(c => c.uuid === uuid)) return;
        const actor  = await od6sutilities.getActorFromUuid(uuid);
        const result = game.user.isGM
            ? await actor.addToCrew(this.actor.uuid)
            : await OD6S.socket.executeAsGM('addToVehicle', this.actor.uuid, uuid);

        if (result) {
            const crewmembers = [...this.actor.system.crewmembers, { uuid: actor.uuid, name: actor.name, sort: 0 }];
            await this.actor.update({ system: { crewmembers } });
        }
    }

    async unlinkCrew(crewID) {
        const crewMembers = this.actor.system.crewmembers.filter(e => e.uuid !== crewID);

        if (await fromUuid(crewID)) {
            if (game.user.isGM) {
                const actor = await od6sutilities.getActorFromUuid(crewID);
                await actor.removeFromCrew(this.actor.uuid);
            } else {
                game.socket.emit('system.od6s', {
                    operation: 'removeFromVehicle',
                    message: { actorId: crewID, vehicleId: this.actor.uuid }
                });
            }
        }

        await this.actor.update({ system: { crewmembers: crewMembers } });
    }

    /* -------------------------------------------- */
    /*  Action Roll Dispatch                         */
    /* -------------------------------------------- */

    async _rollAvailableVehicleAction(ev) {
        const data       = ev.currentTarget.dataset;
        const actorData  = this.actor.system;
        const rollData   = { score: 0, scale: 0 };

        if (data.rollable !== "true") return;

        if (['vehicleramattack', 'vehiclemaneuver', 'vehicledodge'].includes(data.type)) {
            rollData.score = od6sutilities.getScoreFromSkill(this.actor,
                    actorData.vehicle.specialization.value,
                    actorData.vehicle.skill.value,
                    OD6S.vehicle_actions[data.id].base)
                + actorData.vehicle.maneuverability.score;
        } else if (data.type === 'vehiclesensors') {
            rollData.score = +od6sutilities.getScoreFromSkill(this.actor, '',
                actorData.vehicle.sensors.skill, OD6S.vehicle_actions[data.id].base) + (+data.score);
        } else if (data.type === 'vehicleshields') {
            rollData.score = od6sutilities.getScoreFromSkill(this.actor, '',
                actorData.vehicle.shields.skill.value, OD6S.vehicle_actions[data.id].base);
        } else {
            const item = actorData.vehicle.vehicle_weapons.find(i => i.id === data.id);
            if (item) {
                rollData.score = od6sutilities.getScoreFromSkill(this.actor,
                    item.system.specialization.value,
                    game.i18n.localize(item.system.skill.value),
                    item.system.attribute.value) + item.system.fire_control.score;
                rollData.scale       = item.system.scale.score;
                rollData.damage      = item.system.damage.score;
                rollData.damage_type = item.system.damage.type;
            }
        }

        if (!rollData.scale) rollData.scale = actorData.vehicle.scale.score;
        rollData.name    = game.i18n.localize(data.name);
        rollData.type    = 'action';
        rollData.actor   = this.actor;
        rollData.subtype = data.type;
        await od6sroll._onRollDialog(rollData);
    }

    async _rollAvailableAction(ev) {
        const data     = ev.currentTarget.dataset;
        const rollData = { token: this.token };
        let name       = game.i18n.localize(data.name);
        let flatPips   = 0;

        if (data.rollable !== "true") return;

        if (data.id) {
            const item = this.actor.items.find(i => i.id === data.id);
            if (item) return item.roll(data.type === 'parry');
        }

        if (['dodge', 'parry', 'block'].includes(data.type)) {
            const actionKey = { dodge: 'dodge', parry: 'parry', block: 'block' }[data.type];
            name = game.i18n.localize(OD6S.actions[actionKey].skill);
        }

        if (data.type === 'attribute') {
            name             = data.name;
            rollData.attribute = data.id;
        } else {
            let skill = this.actor.items.find(i => i.type === 'skill' && i.name === name);
            if (skill) {
                if (OD6S.flatSkills) {
                    rollData.score = +this.actor.system.attributes[skill.system.attribute.toLowerCase()].score;
                    flatPips       = +skill.system.score;
                } else {
                    rollData.score = (+skill.system.score) +
                        (+this.actor.system.attributes[skill.system.attribute.toLowerCase()].score);
                }
            } else {
                skill = await od6sutilities._getItemFromWorld(name)
                    ?? await od6sutilities._getItemFromCompendium(name);
                if (skill) {
                    rollData.score = +this.actor.system.attributes[skill.system.attribute.toLowerCase()].score;
                } else {
                    for (const a in OD6S.actions) {
                        if (OD6S.actions[a].type === data.type) {
                            rollData.score = +this.actor.system.attributes[OD6S.actions[a].base].score;
                            break;
                        }
                    }
                }
            }
        }

        if (flatPips > 0) rollData.flatpips = flatPips;
        rollData.name    = name;
        rollData.type    = 'action';
        rollData.actor   = this.actor;
        rollData.subtype = data.type;
        await od6sroll._onRollDialog(rollData);
    }

    /* -------------------------------------------- */
    /*  Miscellaneous                                */
    /* -------------------------------------------- */

    async _editEffect(ev) {
        const effect = this.actor.effects.find(e => e.id === ev.currentTarget.dataset.effectId);
        new ActiveEffectConfig(effect).render(true);
    }

    async _createAction(data) {
        if (data.name?.startsWith('OD6S.')) data.name = game.i18n.localize(data.name);

        if (['dodge', 'parry', 'block', 'vehicledodge'].includes(data.subtype)) {
            if (this.actor.itemTypes.action.find(i => i.system.subtype === data.subtype)) {
                ui.notifications.warn(game.i18n.localize('OD6S.ACTION_ONLY_ONE'));
                return;
            }
        }

        return this.actor.createEmbeddedDocuments('Item', [{
            name: data.name,
            type: 'action',
            system: {
                type:    data.type,
                subtype: data.subtype,
                rollable: data.rollable,
                itemId:  data.itemId
            }
        }]);
    }

    _isEquippable(itemType) {
        return OD6S.equippable.includes(itemType);
    }

    _onDragStart(event) {
        const li = event.currentTarget;
        if ("link" in event.target.dataset) return;
        let dragData;
        if (li.dataset.itemId) {
            dragData = this.actor.items.get(li.dataset.itemId)?.toDragData();
        }
        if (li.dataset.effectId) {
            dragData = this.actor.effects.get(li.dataset.effectId)?.toDragData();
        }
        if (li.dataset.crewUuid) {
            dragData = li.dataset.crewUuid;
        }
        if (!dragData) return;
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    async _dragAvailableCombatAction(event) {
        const data = event.target.children[0].dataset;
        event.dataTransfer.setData("text/plain", JSON.stringify({
            name:    data.name,
            type:    "availableaction",
            subtype: data.subtype ?? data.type,
            itemId:  data.id,
            rollable: data.rollable
        }));
    }

    async _dragAssignedCombatAction(event) {
        const data = event.target.children[0].dataset;
        event.dataTransfer.setData("text/plain", JSON.stringify({
            name:    data.name,
            type:    "assignedaction",
            subtype: data.subtype ?? data.type,
            itemId:  data.itemId,
            rollable: data.rollable,
            id:      data.id
        }));
    }

    async _dragCrewMember(event) {
        event.dataTransfer.setData("text/plain", JSON.stringify({
            crewUuid: event.target.dataset.crewUuid,
            type:     "crewmember"
        }));
    }
}

export default OD6SActorSheet;
