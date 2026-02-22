import {od6sutilities} from "../system/utilities.js";
import {OD6SItem} from "../item/item.js";

export class OD6SAddItem extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
        this.object.selected = 0;
        this.object.description = this.object?.items[0]?.system?.description;
        this.dice = 0;
        this.pips = 0;
        if (typeof(this.object.description) === 'undefined') this.object.description = "";
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "add-item";
        options.template = "systems/od6s/templates/actor/common/add-item.html";
        options.height = 300;
        options.width = 300;
        options.minimizable = true;
        options.title = game.i18n.localize("OD6S.ADD");
        return options;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.select-skill').change(ev => {
            this.object.selected = +ev.currentTarget.value;
            this.object.description = this.object.items[this.object.selected].system?.description;
            if (typeof(this.object.description) === 'undefined') this.object.description = "";
            this.setPosition({ height: "auto" })
            this.render();
        })

        html.find('.addskill').change(ev => {
            if(ev.target.id === 'dice') {
                this.dice = +(ev.target.value);
            } else if(ev.target.id === 'pips') {
                this.pips = +(ev.target.value);
            }
        })
    }

    getData() {
        return super.getData();
    }

    async _updateObject(ev, formData) {
        if (ev.submitter.value === 'cancel') {
            return;
        }

        let actor;
        if(formData.token !== '') {
            const token = game.scenes.active.tokens.get(formData.token);
            actor = token.actor;
        } else {
            actor = await game.actors.get(formData.actor);
        }

        if (ev.submitter.value === 'selected') {
            const items = JSON.parse(formData.serializeditems);

            if (items[formData['add-item']].type === "skill" || items[formData['add-item']].type === "specialization") {
                items[formData['add-item']].system.base = (od6sutilities.getScoreFromDice(this.dice, this.pips))
            }
            const result = await actor.createEmbeddedDocuments('Item', [items[formData['add-item']]]);
            await actor.sheet.getData();
            this.object.caller.render(false);
        }

        if (ev.submitter.value === 'empty') {
            const itemData = {};
            itemData.system = {};
            itemData.type = formData.type;

            if (itemData.type === "skill" || itemData.type === "specialization") {
                itemData.system.attribute = formData.attrname;
            }

            itemData.name = game.i18n.localize('OD6S.NEW_ITEM');
            const item = await new OD6SItem(itemData);
            await actor.createEmbeddedDocuments('Item', [item.toObject()]);
            this.caller?.render(false);
        }
    }
}

export default OD6SAddItem;
