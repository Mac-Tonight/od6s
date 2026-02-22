import OD6S from "../config/config-od6s.js";
import {od6sutilities} from "../system/utilities.js";

export class SpecializeDialog extends Dialog {

    constructor(newItemData, specializeTemplate, data, options) {
        super(data, options);
        this.newItemData = newItemData;
        this.specializeTemplate = specializeTemplate;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.freeadvancecheckbox').change( async () => {
            /* Whenever this is toggled, reset cpcost */
            this.newItemData.freeadvance = !(this.newItemData.freeadvance);
            if (this.newItemData.freeadvance) {
                this.newItemData.cpcost = 0;
            } else {
                this.newItemData.cpcost = this.newItemData.originalcpcost;
            }
            await this.updateDialog();
        });
        
        html.find('.specializationname').change(async ev => {
            this.newItemData.specname = ev.target.value;
            await this.updateDialog();
        })

        html.find('.dice').change(async ev => {
            this.newItemData.dice = ev.target.value;
            await this.updateDialog();
        })

        html.find('.pips').change(async ev => {
            this.newItemData.dice = ev.target.value;
            await this.updateDialog();
        })
    }

    async updateDialog() {
        this.data.content = await renderTemplate(this.specializeTemplate, this.newItemData);
        this.render();
    }
}

export class od6sspecialize {

    activateListeners(html)
    {
        super.activateListeners(html);
    }

    async _onSpecialize(event) {
        event.preventDefault();
        // Create the specialization item, tied to the correct attribute/skill
        const skill = this.actor.getEmbeddedDocument("Item",
            event.currentTarget.dataset.itemId, true);
        const derivedScore = (+skill.system.score) + (+this.actor.system.attributes[skill.system.attribute.toLowerCase()].score) + 1
        const cpCost = Math.floor(Math.floor(derivedScore/OD6S.pipsPerDice)/2);
        let newItemData = {
            specname: "",
            type: "specialization",
            skill: skill.name,
            attribute: skill.system.attribute,
            description: skill.system.description,
            score: derivedScore,
            cpcost: cpCost,
            originalcpcost: cpCost,
            actor: this.actor,
            freeadvance: false,
            dice: od6sutilities.getDiceFromScore(derivedScore - 1).dice,
            pips: od6sutilities.getDiceFromScore(derivedScore - 1).pips
        }

        const specializeTemplate = "systems/od6s/templates/actor/common/specialize.html";
        const html = await renderTemplate(specializeTemplate, newItemData);
        new SpecializeDialog(newItemData, specializeTemplate, {
            title: game.i18n.localize("OD6S.CREATE_SPECIALIZATION") + "!",
            content: html,
            buttons: {
                submit: {
                    label: game.i18n.localize("OD6S.CREATE_SPECIALIZATION"),
                    callback: dlg => od6sspecialize.addSpecialization(
                        this,
                        newItemData,
                        skill.id
                       )
                }
            },
            default: "submit"
        }).render(true);

    }

    static async addSpecialization(actorSheet, itemData, skillId, dice, pips) {
        // Can't have a blank name
        if (typeof(itemData.specname)==='undefined' || itemData.specname==="" ) {
            ui.notifications.error(game.i18n.localize("OD6S.ERR_SPECIALIZATION_NAME"));
            return;
        }

        // Can't spend what you don't have
        if (actorSheet.actor.type === "character") {
            if ((+itemData.cpcost) > (+actorSheet.actor.system.characterpoints.value) &&
                actorSheet.actor.system.sheetmode.value !== "freeedit") {
                ui.notifications.warn(game.i18n.localize("OD6S.NOT_ENOUGH_CP_SPEC"));
                return;
            }
        }

        // Create new specialization item, derived from original skill
        let newItemData = foundry.utils.deepClone(actorSheet.actor.getEmbeddedDocument("Item",
            skillId, true));
        let base = 0;
        if(actorSheet.actor.type === "npc") {
            // Get the score from the form
            base = (+od6sutilities.getScoreFromDice(itemData.dice, itemData.pips)) -
                itemData.actor.system.attributes[itemData.attribute].base;
        } else {
            base = (+newItemData.system.base) + 1;
        }

        newItemData = {
            name: itemData.specname,
            type: itemData.type,
            system: {
                attribute: itemData.attribute,
                description: itemData.specname,
                base: base,
                time: itemData.time,
                skill: itemData.skill
            }
        }

        await actorSheet.actor.createEmbeddedDocuments('Item', [newItemData]);

        // Deduct character points
        if (actorSheet.actor.type === "character") {
            if ((+itemData.cpcost) > 0 &&  actorSheet.actor.system.sheetmode.value !== "freeedit") {
                const update = {};
                update.id = actorSheet.actor.id;
                update.system = {};
                update.system.characterpoints = {};
                update.system.characterpoints.value -= actorSheet.actor.system.characterpoints.value;
                await actorSheet.actor.update(update, {diff: true});
            }
        }

        actorSheet.render();
    }
}
