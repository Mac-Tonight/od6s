import {od6sutilities} from "../system/utilities.js";
import OD6S from "../config/config-od6s.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class OD6SItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["od6s", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

    /** @override */
    get template() {
        const path = "systems/od6s/templates/item";
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        return super.getData();
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. would go here.
        html.find('.editskill').change(this._editSkill.bind(this));
        html.find('.editspecialization').change(this._editSpecialization.bind(this));
        html.find('.editweapondamage').change(this._editWeaponDamage.bind(this));
        html.find('.editweaponstun').change(this._editWeaponStunDamage.bind(this));
        html.find('.editweaponfirecontrol').change(this._editWeaponFireControl.bind(this));
        html.find('.editarmor').change(this._editArmor.bind(this));
        html.find('.edittemplateattribute').click(this._editTemplateAttribute.bind(this));
        html.find('.template-item-add').click(this._addTemplateItem.bind(this));
        html.find('.template-item-edit').click(this._editTemplateItem.bind(this));
        html.find('.template-item-delete').click(this._deleteTemplateItem.bind(this));
        html.find('.effect-add').click(this._addEffect.bind(this));
        html.find('.effect-edit').click(this._editEffect.bind(this));
        html.find('.effect-delete').click(this._deleteEffect.bind(this));

        html.find('.label-add').click(this._addLabel.bind(this));
        html.find('.label-edit').change(this._editLabel.bind(this));
        html.find('.label-delete').click(this._deleteLabel.bind(this));

        html.find('.add-actor-type').click(this._addActorType.bind(this));
        html.find('.delete-actor-type').click(this._deleteActorType.bind(this));

        html.find('li.item').each((i, li) => {
            if (li.classList.contains("inventory-header")) return;
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        })
    }

    async _addActorType() {
        const data =
            {"actorTypes": game.od6s.OD6SActor.TYPES.filter(i => !this.item.system.actor_types.includes(i))};
        const addTemplate = "systems/od6s/templates/item/item-add-actor-type.html";
        const html = await renderTemplate(addTemplate, data);
        const label = game.i18n.localize("OD6S.ACTOR_TYPE")
        new Dialog({
            title: game.i18n.localize("OD6S.ADD") + " " + label,
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.ADD"),
                    callback: dlg => this._addActorTypeAction(
                        $(dlg[0]).find("#actor-type")[0].value
                    )
                }
            },
            default: "submit"
        }).render(true);
    }

    async _addActorTypeAction(type) {
        const update = {};
        update.id = this.item.id;
        update.system = {};
        update.system.actor_types = this.item.system.actor_types;
        update.system.actor_types.push(type);
        await this.item.update(update);
    }

    async _deleteActorType(ev) {
        const type = ev.currentTarget.dataset.type;
        const update = {};
        update.id = this.item.id;
        update.system = {};
        update.system.actor_types = this.item.system.actor_types.filter(i => i !== type);
        // Remove all items that are no longer allowed
        update.system.items = [];
        for (let i of this.item.system.items) {
            for (let t of update.system.actor_types) {
                if (OD6S.allowedItemTypes[t].includes(i.type)) {
                    update.system.items.push(i);
                    break;
                }
            }
        }
        await this.item.update(update);
    }

    async _addLabel(ev) {
        const itemData = {"id": this.item.id};
        const addTemplate = "systems/od6s/templates/item/item-add-label.html";
        const html = await renderTemplate(addTemplate, itemData);
        const label = game.i18n.localize("OD6S.LABEL");

        new Dialog({
            title: game.i18n.localize("OD6S.ADD") + " " + label + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.ADD"),
                    callback: dlg => this._addLabelAction(
                        $(dlg[0]).find("#key")[0].value,
                        $(dlg[0]).find("#value")[0].value)
                }
            },
            default: "submit"
        }).render(true);
    }

    async _addLabelAction(key, value) {
        if (this.item.system.labels[key]) {
            ui.notifications.warn(game.i18n.localize("OD6S.LABEL_ALREADY_EXISTS"))
            return;
        }
        const update = {};
        update.id = this.item.id;
        update[`system.labels.${key}`] = value;

        await this.item.update(update);
    }

    async _editLabel(ev) {
        const update = {};
        update.id = this.item.id;
        update[`system.labels.${ev.currentTarget.dataset.key}`] = ev.target.value;
        await this.item.update(update);
    }

    async _deleteLabel(ev) {
        const update = {};
        update.id = this.item.id;
        update.system = this.item.system;
        update[`system.labels.-=${ev.currentTarget.dataset.key}`] = null;
        await this.item.update(update);
    }

    async _addEffect() {
        const name = game.i18n.localize('OD6S.NEW_ACTIVE_EFFECT')
        const effect = await this.document.createEmbeddedDocuments("ActiveEffect",
            [
                {label: name},
            ]
        );
        const sheet = new ActiveEffectConfig(effect[0]);
        sheet.render(true);
    }

    async _editEffect(ev) {
        const effect = this.document.getEmbeddedDocument("ActiveEffect", ev.currentTarget.dataset.effectId);
        const sheet = new ActiveEffectConfig(effect);
        sheet.render(true);
    }

    async _deleteEffect(ev) {
        await this.document.deleteEmbeddedDocuments("ActiveEffect", [ev.currentTarget.dataset.effectId]);
    }

    async _editSkill(event) {
        // Prepare item update
        const itemId = event.currentTarget.dataset.itemId;
        let newScore;

        const oldDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.base);

        if (event.target.id === "dice") {
            newScore = od6sutilities.getScoreFromDice(event.target.value,
                oldDice.pips);
        } else if (event.target.id === "pips") {
            newScore = od6sutilities.getScoreFromDice(oldDice.dice,
                event.target.value);
        }
        if (this.actor != null) {
            const skills = this.actor.items.filter(i => i.type === "skill");
            let update = skills.map(() => {
                return {
                    id: itemId,
                    _id: itemId,
                    "system.base": newScore
                }
            })
            await this.actor.updateEmbeddedDocuments("Item", update);
            await this.item.sheet.render(false, {"log": true});
        } else {
            const update = {
                id: this.item.id,
                _id: this.item.id,
                "system.base": newScore
            }
            await this.item.update(update);
        }
    }

    async _editSpecialization(event) {
        // Prepare item update
        const itemId = event.currentTarget.dataset.itemId;
        let newScore;

        const oldDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.score);

        if (event.target.id === "system.die.dice") {
            newScore = od6sutilities.getScoreFromDice(event.target.value,
                oldDice.pips);
        } else if (event.target.id === "system.die.pips") {
            newScore = od6sutilities.getScoreFromDice(oldDice.dice,
                event.target.value);
        }
        if (this.actor != null) {
            const skills = this.actor.items.filter(i => i.type === "specialization");
            let update = skills.map(() => {
                return {
                    id: itemId,
                    _id: itemId,
                    'system.base': newScore
                }
            })
            await this.actor.updateEmbeddedDocuments("Item", update);
            await this.item.sheet.render(false, {"log": true});
        } else {
            const update = {
                id: itemId,
                "system.base": newScore
            }
            await this.item.update(update, {'diff': true});
        }
    }

    async _editWeaponDamage(event) {
        // Prepare item update
        const itemId = event.currentTarget.dataset.itemId;
        let newDamage;
        if (event.currentTarget.dataset.score === "") {
            event.currentTarget.dataset.score = 0;
        }
        const oldDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.score);

        if (event.target.id === "dice") {
            newDamage = od6sutilities.getScoreFromDice(event.target.value, oldDice.pips);
        } else if (event.target.id === "pips") {
            newDamage = od6sutilities.getScoreFromDice(oldDice.dice, event.target.value);
        }

        if (this.actor != null) {
            const updates = [];

            let update = {
                _id: itemId
            }
            update.system = {};
            update.system.damage = {};
            update.system.damage.score = newDamage;
            updates.push(update);

            if (this.actor.isToken) {
                if (this.actor.token.linked) {
                    await this.actor.updateEmbeddedDocuments("Item", updates);
                } else {
                    await this.actor.updateEmbeddedDocuments("Item", updates);
                }
            } else {
                await this.actor.updateEmbeddedDocuments("Item", updates);
            }
        } else {
            const update = {
                "system.damage.score": newDamage,
            }
            await this.item.update(update, {'diff': true});
        }
    }

    async _editWeaponStunDamage(event) {
        // Prepare item update
        const itemId = event.currentTarget.dataset.itemId;
        let newDamage;
        if (event.currentTarget.dataset.score === "") {
            event.currentTarget.dataset.score = 0;
        }
        const oldDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.score);

        if (event.target.id === "dice") {
            newDamage = od6sutilities.getScoreFromDice(event.target.value, oldDice.pips);
        } else if (event.target.id === "pips") {
            newDamage = od6sutilities.getScoreFromDice(oldDice.dice, event.target.value);
        }

        if (this.actor != null) {
            const updates = [];

            let update = {
                _id: itemId
            }
            update.system = {};
            update.system.stun = {};
            update.system.stun.score = newDamage;
            updates.push(update);

            if (this.actor.isToken) {
                if (this.actor.token.linked) {
                    await this.actor.updateEmbeddedDocuments("Item", updates);
                } else {
                    await this.actor.updateEmbeddedDocuments("Item", updates);
                }
            } else {
                await this.actor.updateEmbeddedDocuments("Item", updates);
            }
        } else {
            const update = {
                "system.stun.score": newDamage,
            }
            await this.item.update(update, {'diff': true});
        }
    }

    async _editWeaponFireControl(event) {
        // Prepare item update
        const itemId = event.currentTarget.dataset.itemId;
        let newScore;
        if (event.currentTarget.dataset.score === "") {
            event.currentTarget.dataset.score = 0;
        }
        const oldDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.score);

        if (event.target.id === "dice") {
            newScore = od6sutilities.getScoreFromDice(event.target.value, oldDice.pips);
        } else if (event.target.id === "pips") {
            newScore = od6sutilities.getScoreFromDice(oldDice.dice, event.target.value);
        }

        if (this.actor != null) {
            const weapons = this.actor.items.filter(i => i.type === "vehicle-weapon" || i.type === 'starship-weapon');
            let update = weapons.map(() => {
                return {
                    id: itemId,
                    _id: itemId,
                    "system.fire_control.score": newScore
                }
            })
            await this.actor.updateEmbeddedDocuments("Item", update);
        } else {
            const update = {
                id: this.item.id,
                "system.fire_control.score": newScore,
            }
            await this.item.update(update, {'diff': true});
        }
    }

    async _getGameItemsByType(type) {
        let compendia = await od6sutilities.getItemsFromCompendiumByType(type);
        let world = await od6sutilities.getItemsFromWorldByType(type);
        let data = compendia.concat(world);
        return data.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        })
    }

    async _addTemplateItem(event) {
        // Prepare a list of character template items that can be added
        const type = event.currentTarget.dataset.type;
        const templateItems = await Promise.all(await this._getGameItemsByType(type));
        const newItem = {
            templateItems: templateItems
        }

        const addTemplate = "systems/od6s/templates/item/item-template-add.html";
        let html = await renderTemplate(addTemplate, newItem);
        const label = game.i18n.localize(game.system.template.Item[event.currentTarget.dataset.type].label);

        new Dialog({
            title: game.i18n.localize("OD6S.ADD") + " " + label + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.ADD"),
                    callback: dlg => this._addTemplateItemAction(
                        $(dlg[0]).find("#itemname")[0].value,
                        event.currentTarget.dataset.type,
                        this)
                }
            },
            default: "submit"
        }).render(true);
    }

    async _addTemplateItemAction(name, type, itemSheet) {
        if (this.item.type === 'item-group') {
            let allowed = false;
            for (const [key, items] of Object.entries(OD6S.allowedItemTypes)) {
                if (this.item.system.actor_types.includes(key)) {
                    for (let i of items) {
                        if (OD6S.templateItemTypes['item-group'].includes(i)) {
                            allowed = true;
                            break;
                        }
                    }
                }
            }
            if (!allowed) return;
        } else {
            if (!OD6S.templateItemTypes[this.item.type].includes(type)) return;
        }

        const item = await od6sutilities.getItemByName(name);
        let description;
        if (typeof (item) !== "undefined" && item !== null) {
            description = item.system.description;
        } else {
            description = "";
        }

        const newItem = {
            name: name,
            type: type,
            description: description
        }

        itemSheet.item.system.items.push(newItem);
        const update = {};
        update.id = itemSheet.id;
        update.system = itemSheet.item.system;
        await itemSheet.item.update(update, {diff: true});
        await this.render();
    }

    async _editTemplateItem(event) {
        const item = await this.item.system.items.find(i => i.name === event.currentTarget.dataset.name)
        const itemData = {
            name: event.currentTarget.dataset.name,
            type: event.currentTarget.dataset.type,
            description: item.description
        }

        const editTemplate = "systems/od6s/templates/item/item-template-item-edit.html";
        const html = await renderTemplate(editTemplate, itemData);
        const label = game.i18n.localize(game.system.template.Item[event.currentTarget.dataset.type].label);

        new Dialog({
            title: game.i18n.localize("OD6S.EDIT") + " " + label + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.EDIT"),
                    callback: dlg => this._editTemplateItemAction(
                        $(dlg[0]).find("#itemdesc")[0].value,
                        event,
                        this)
                }
            },
            default: "submit"
        }).render(true);
    }

    async _editTemplateItemAction(desc, event, itemSheet) {
        const data = event.currentTarget.dataset;
        const newItem = {
            name: data.name,
            type: data.type,
            description: desc
        }

        const itemIndex = itemSheet.item.system.items.findIndex(
            i => i.name === data.name && i.type === data.type);
        itemSheet.item.system.items[itemIndex] = newItem;
        const update = {};
        update.id = itemSheet.item.id;
        update.system = itemSheet.item.system;
        await itemSheet.item.update(update, {diff: false});
        await this.render();
    }

    async _deleteTemplateItem(event) {
        const confirmText = "<p>" + game.i18n.localize("OD6S.DELETE_CONFIRM") + "</p>";
        await Dialog.prompt({
            title: game.i18n.localize("OD6S.DELETE"),
            content: confirmText,
            callback: async () => {
                const itemIndex = this.item.system.items.findIndex(
                    i => i.name === event.currentTarget.dataset.name
                        && i.type === event.currentTarget.dataset.type);
                this.item.system.items.splice(itemIndex, 1);
                const update = {};
                update.id = this.item.id;
                update.system = this.item.system;
                await this.item.update(update, {diff: true})
                this.render();
            }
        })
    }

    async _editTemplateAttribute(event) {
        const score = event.currentTarget.dataset.score;
        /* Structure to pass to dialog */
        let editData = {
            score: score
        }

        const editTemplate = "systems/od6s/templates/item/item-attribute-edit.html";
        const html = await renderTemplate(editTemplate, editData);

        new Dialog({
            title: game.i18n.localize("OD6S.EDIT") + " " + event.currentTarget.dataset.label + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.EDIT_ATTRIBUTE"),
                    callback: dlg => this._editAttributeAction(
                        $(dlg[0]).find("#dice")[0].value,
                        $(dlg[0]).find("#pips")[0].value,
                        event,
                        this)
                }
            },
            default: "submit"
        }).render(true);
    }

    async _editAttributeAction(dice, pips, event, itemSheet) {
        const newScore = od6sutilities.getScoreFromDice(dice, pips);
        const attrname = event.currentTarget.dataset.attrname;
        switch (event.currentTarget.dataset.sub) {
            case "base":
                itemSheet.item.system.attributes[attrname] = newScore;
                break;
            case "min":
                itemSheet.item.system.attributes[attrname].min = newScore;
                break;
            case "max":
                itemSheet.item.system.attributes[attrname].max = newScore;
                break;
        }
        const update = {};
        update.id = itemSheet.item.id;
        update.system = itemSheet.item.system;
        await itemSheet.item.update(update, {diff: true});
        this.render();
    }

    async _editArmor(event) {
        // Prepare item update
        const itemId = event.currentTarget.dataset.itemId;
        let newScore;
        let update = {};
        update.id = itemId;
        update._id = itemId;
        update.system = {};

        const oldPrDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.pr);
        const oldErDice = od6sutilities.getDiceFromScore(event.currentTarget.dataset.er);

        if (event.target.id === "prDice") {
            newScore = od6sutilities.getScoreFromDice(event.target.value, oldPrDice.pips);
            update.system.pr = newScore;
        } else if (event.target.id === "prPips") {
            newScore = od6sutilities.getScoreFromDice(oldPrDice.dice, event.target.value);
            update.system.pr = newScore;
        } else if (event.target.id === "erDice") {
            newScore = od6sutilities.getScoreFromDice(event.target.value, oldErDice.pips);
            update.system.er = newScore;
        } else if (event.target.id === "erPips") {
            newScore = od6sutilities.getScoreFromDice(oldErDice.dice, event.target.value);
            update.system.er = newScore;
        }

        if (this.actor != null) {
            await this.actor.updateEmbeddedDocuments("Item", [update]);
        } else {
            await this.item.update(update);
        }
    }

    /**
     * Override
     */
    async _onDrop(event) {
        event.preventDefault();
        // Try to extract the data
        let data;
        try {
            //data = JSON.parse(event.dataTransfer.getData('text/plain'));
            data = TextEditor.getDragEventData(event)
        } catch (err) {
            return false;
        }

        // Handle different data types
        let item = '';
        switch (data.type) {
            case "Item":
                item = await this._onDropItem(event, data);
        }

        if (typeof (item) === 'undefined') {
            return;
        }

        // Determine if this item type is allowed on the template
        return await this._addTemplateItemAction(item.name, item.type, this);
    }

    async _onDropItem(event, data) {
        const item = await Item.implementation.fromDropData(data);

        switch (this.item.type) {
            case 'item-group':
            case 'species-template':
            case 'character-template':
                return item;

            case 'weapon':
                if (item.type === 'specialization') {
                    this.item.system.stats.specialization = item.system.name;
                    await this.item.update(this.item.system, {diff: true});
                }
        }

    }
}
