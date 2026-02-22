import {od6sutilities} from "../system/utilities.js";
import OD6S from "../config/config-od6s.js";
import OD6SAddItem from "../actor/add-item.js";

export default class OD6SCreateCharacter extends FormApplication {

    constructor(actor, templates) {
        super();
        this.actor = actor;
        this.characterTemplates = templates;
        this.selectedTemplate = "";
        this.templateData = {};
        this.skillScore = OD6S.initialSkills;
        this.specScore = 0;
        this.custom = {};
        this.done = false;
        this.custom.templateName = game.i18n.localize('OD6S.CREATE_CUSTOM_TEMPLATE');
        this.custom.attributeScore = OD6S.initialAttributes;
        this.skillScore = OD6S.initialSkills;
        this.custom.characterPoints = OD6S.initialCharacterPoints;
        this.custom.fatePoints = OD6S.initialFatePoints;
        this.custom.move = OD6S.initialMove;
        this.custom.attributeDice = OD6S.initialAttributes;
        this.custom.attributes = {};
        for (let a in OD6S.attributes) {
            this.custom.attributes[a] = 0;
        }
        this.custom.me = false;
        this.step = 1;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "create-character";
        options.template = "systems/od6s/templates/actor/character/create-character.html";
        options.width = 800;
        options.minHeight = 900;
        options.height = "auto";
        options.minimizable = true;
        options.resizable = true;
        options.overflowY = "auto";
        options.title = game.i18n.localize("OD6S.CREATE_CHARACTER");
        return options;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.skill-add').click(async ev => {
            ev.preventDefault();
            await this.actor.sheet.addItem(ev, this);
        })

        html.find('.skill-delete').click(async ev => {
            ev.preventDefault();
            const skill = this.actor.items.find(s=>s._id===ev.currentTarget.dataset.itemId);
            this.skillScore = this.skillScore + skill.system.base;
            await this.actor.sheet.deleteItem(ev);
            await this.actor.sheet.getData();
            this.render(true);
        });

        html.find('.spec-delete').click(async ev => {
            ev.preventDefault();
            const spec = this.actor.items.find(s=>s._id===ev.currentTarget.dataset.itemId);
            const skill = this.actor.items.find(s=>s.name === spec.system.skill);
            this.specScore = this.specScore + spec.system.base - skill.system.base;

            //Add spec dice back to skill dice
            if(OD6S.specializationDice) {
                if(this.specScore === OD6S.pipsPerDice * OD6S.specStartingPipsPerDie) {
                    this.specScore = 0;
                    this.skillScore = this.skillScore + OD6S.pipsPerDice;
                }
            }

            await this.actor.sheet.deleteItem(ev);
            await this.actor.sheet.getData();
            this.render(true);
        });

        html.find('.increase-dialog').click(async (ev) => {
            ev.preventDefault();
            if (this.skillScore < 1) {
                ui.notifications.warn(game.i18n.localize('OD6S.NOT_ENOUGH_SKILL_DICE'));
                return;
            }
            const skill = this.actor.items.find(i => i._id === ev.currentTarget.dataset.itemId);
            if (typeof (skill) !== 'undefined' && skill !== '') {
                const updates = [];
                const skillUpdate = {};
                skillUpdate._id = skill._id;
                skillUpdate.id = skill.id;
                skillUpdate[`system.base`] = (+ev.currentTarget.dataset.base) + 1;
                updates.push(skillUpdate);
                const specs = this.actor.items.filter(i => i.type === 'specialization' && i.system.skill === skill.name);
                if(specs.length > 0) {
                    for (let i = 0; i < specs.length; i++) {
                            const specUpdate = {};
                            const spec = specs[i];
                            specUpdate._id = spec.id;
                            specUpdate[`system.base`] = spec.system.base + 1;
                            updates.push(specUpdate);
                        }
                }
                await this.actor.updateEmbeddedDocuments('Item', updates);
                await this.actor.sheet.getData();
                this.skillScore = this.skillScore - 1;
            }
            this.render();
        })

        html.find('.increase-spec-dialog').click(async (ev) => {
            ev.preventDefault();
            if (this.specScore < 1) return;
            const spec = this.actor.items.find(i => i._id === ev.currentTarget.dataset.itemId);
            if (typeof (spec) !== 'undefined' && spec !== '') {
                const update = {};
                update[`system.base`] = (+ev.currentTarget.dataset.base) + 1;
                await spec.update(update);
                await this.actor.sheet.getData();
                this.specScore = this.specScore - 1;
            }
            this.render();
        })

        html.find('.decrease-dialog').click(async (ev) => {
            ev.preventDefault();
            if (this.skillScore >= OD6S.initialSkills) return;
            if (ev.currentTarget.dataset.base < 1) return;
            const skill = this.actor.items.find(i => i._id === ev.currentTarget.dataset.itemId);
            if (typeof (skill) !== 'undefined' && skill !== '') {
                const updates = [];
                const skillUpdate = {};
                skillUpdate._id = skill._id;
                skillUpdate.id = skill.id;
                skillUpdate[`system.base`] = (+ev.currentTarget.dataset.base) - 1;
                updates.push(skillUpdate);
                const specs = this.actor.items.filter(i => i.type === 'specialization' && i.system.skill === skill.name);
                if(specs.length > 0) {
                    for (let i = 0; i < specs.length; i++) {
                        const specUpdate = {};
                        const spec = specs[i];
                        specUpdate._id = spec.id;
                        specUpdate[`system.base`] = spec.system.base - 1;
                        updates.push(specUpdate);
                    }
                }
                await this.actor.updateEmbeddedDocuments('Item', updates);
                await this.actor.sheet.getData();
                this.skillScore = this.skillScore + 1;
            }
            this.render();
        })

        html.find('.decrease-spec-dialog').click(async (ev) => {
            ev.preventDefault();
            if (ev.currentTarget.dataset.base <= 1) return;
            const spec = this.actor.items.find(i => i._id === ev.currentTarget.dataset.itemId);
            if (typeof (spec) !== 'undefined' && spec !== '') {
                const update = {};
                update[`system.base`] = (+ev.currentTarget.dataset.base) - 1;
                await spec.update(update);
                await this.actor.sheet.getData();
                this.specScore = this.specScore + 1;
            }
            this.render();
        })

        html.find('.specialize-dialog').click(async (ev) => {
            ev.preventDefault();
            if(this.specScore === 0) {
                if (this.skillScore < OD6S.pipsPerDice) {
                    ui.notifications.warning('OD6S.NOT_ENOUGH_SKILL_DICE');
                    return;
                }
            }
            const specData = ev.currentTarget.dataset;
            const specTemplate = "systems/od6s/templates/apps/character-creation/specialize.html";
            const html = await renderTemplate(specTemplate, specData);
            new Dialog({
                title: game.i18n.localize("OD6S.CREATE_SPECIALIZATION"),
                content: html,
                buttons: {
                    submit: {
                        label: game.i18n.localize("OD6S.CREATE_SPECIALIZATION"),
                        callback: async dlg => await this.addSpec($(dlg[0]).find("#specname")[0].value, specData)
                    }
                },
                default: "submit"
            }).render(true, {focus: true});
        })

        html.find('.template-dropdown').change(async (ev) => {
            ev.preventDefault();

            if (ev.target.value === "custom") {
                this.selectedTemplate = ev.target.value;
                this.templateData = {};
            } else {
                this.selectedTemplate = ev.target.value;
                this.templateData =
                    await od6sutilities.getItemByName(
                        this.characterTemplates.find(i => i._id === this.selectedTemplate).name);
            }
            await this.actor.sheet._onClearCharacterTemplate();
            this.render();
        })

        html.find('.character-create-button').click(async (ev) => {
            ev.preventDefault();

            if (ev.target.value === "next") {
                if (this.step === 1) {
                    // Copy the template to the actor, clearing it first for safety
                    await this.actor.sheet._onClearCharacterTemplate();
                    await this.actor.deleteEmbeddedDocuments("Item", this.actor.items.map(i => i.id));
                    const template = await od6sutilities.getItemByName(
                        this.characterTemplates.find(i => i._id === this.selectedTemplate).name);
                    await this.actor.sheet._addCharacterTemplate(template);
                    await this.actor.sheet.getData();
                }
                this.step = this.step + 1;
            } else if (ev.target.value === "back") {
                if (this.step === 2) {
                    await this.actor.sheet._onClearCharacterTemplate();
                    await this.actor.deleteEmbeddedDocuments("Item", this.actor.items.map(i => i.id));
                }
                this.skillScore = OD6S.initialSkills;
                this.specScore = 0;
                this.step = this.step - 1;
            } else if (ev.target.value === "cancel") {
                return this.close();
            } else if (ev.target.value === "finish") {
                let update = {};
                if((this.actor.img === '' || this.actor.img === "icons/svg/mystery-man.svg")
                    && typeof(this.templateData.img) !== 'undefined' && this.templateData.img !== '') {
                    update.img = this.templateData.img;
                }
                update[`system.created.value`] = true;
                await this.actor.update(update);
                return this.close();
            }
            this.render();
        })

        html.find('.create-custom-template-name').change(async (ev) => {
            ev.preventDefault();

            this.customTemplate.name = ev.target.value;
            this.render();
        })

        html.find('.fate-points').change(async (ev) => {
            ev.preventDefault();

            this.custom.fatePoints = ev.target.value;
            this.render();
        })

        html.find('.character-points').change(async (ev) => {
            ev.preventDefault();

            this.custom.characterPoints = ev.target.value;
            this.render();
        })

        html.find('.move').change(async (ev) => {
            ev.preventDefault();

            this.custom.move = ev.target.value;
            this.render();
        })

        html.find('.me').change(async (ev) => {
            ev.preventDefault();

            this.custom.me = !this.custom.me;
            this.render();
        })

        html.find('.add-spec-dice').click((ev) => {
            ev.preventDefault();
            if(this.skillScore < OD6S.pipsPerDice) {
                ui.notifications.warn('OD6S.NOT_ENOUGH_SKILL_DICE');
            } else {
                this.skillScore = this.skillScore - OD6S.pipsPerDice;
                this.specScore = this.specScore + (OD6S.pipsPerDice *3);
            }
            this.render();
        })

        html.find('.remove-spec-dice').click((ev) => {
            ev.preventDefault();
            if(this.specScore < (OD6S.pipsPerDice * 3)) {
                ui.notifications.warn('OD6S.NOT_ENOUGH_SPECIALIZATION_DICE');
            } else {
                this.skillScore = this.skillScore + OD6S.pipsPerDice;
                this.specScore = this.specScore - (OD6S.pipsPerDice *3);
            }
            this.render();
        })

    }

    async addSpec(name, data) {
        if (typeof(name) === 'undefined' || name === '') {
            ui.notifications.warn(game.i18n.localize("OD6S.ERR_SPECIALIZATION_NAME"));
            return;
        }

        if(this.actor.specializations.find(s=>s.name===name)) {
            ui.notifications.warn(game.i18n.localize("OD6S.ERR_SPECIALIZATION_EXISTS"));
            return;
        }

        const skill = this.actor.getEmbeddedDocument("Item", data.itemId, true);

        // Create new specialization item, derived from original skill
        let base = skill.system.base;
        let add = 0;
        if(OD6S.specializationDice) {
            add = OD6S.pipsPerDice
            base = base + add;
        } else {
            add = 1;
            base = base + add;
        }

        const newItemData = {
            name: name,
            type: "specialization",
            system: {
                attribute: skill.system.attribute,
                description: data.specname,
                base: base,
                time: skill.time,
                skill: skill.name
            }
        }
        await this.actor.createEmbeddedDocuments('Item', [newItemData]);
        this.actor.sheet.getData();

        if(this.specScore === 0) {
            this.specScore = (OD6S.pipsPerDice * OD6S.specStartingPipsPerDie) - add;
            this.skillScore = this.skillScore - OD6S.pipsPerDice;
        } else {
            this.specScore = this.specScore - add;
        }

        this.render();
    }

    async getData() {
        let data = super.getData()
        if (this.actor.system.chartype.content !== "") {
            const idx = this.characterTemplates.findIndex(t => t.name === this.actor.system.chartype.content);
            this.selectedTemplate = this.characterTemplates[idx]._id;
            this.templateData =
                await od6sutilities.getItemByName(
                    this.characterTemplates.find(i => i._id === this.selectedTemplate).name);
            if (typeof (this.templateData) === 'undefined' || this.templateData === null || this.templateData === '') {
                ui.notifications.error(game.i18n.localize("OD6S.ERROR_TEMPLATE_NOT_FOUND"));
                return false;
            }
        }

        const attrs = [];
        if (Object.keys(this.templateData).length !== 0) {
            for (const attribute in this.templateData.system.attributes) {
                const attr = {};
                attr.id = attribute;
                attr.score = this.templateData.system.attributes[attribute];
                attr.sort = OD6S.attributes[attribute].sort;
                attr.active = OD6S.attributes[attribute].active;
                attrs.push(attr);
            }
            data.attrs = attrs.sort((a,b) => (a.sort || 0) - (b.sort || 0));
        } else {
            data.attrs = []
        }

        if(this.skillScore === 0 && this.specScore === 0) {
            this.done = true;
        } else {
            this.done = false;
        }

        data.done = this.done;
        data.characterTemplates = this.characterTemplates;
        data.selectedTemplate = this.selectedTemplate;
        data.templateData = this.templateData;
        data.step = this.step;
        data.actor = this.actor;
        data.skillScore = this.skillScore;
        data.specScore = this.specScore;
        data.custom = this.custom;
        if (typeof (this.templateData.system) !== 'undefined' && typeof (this.templateData.system.items) !== 'undefined') {
            data.skills = await od6sutilities.getSkillsFromTemplate(this.templateData.system.items.filter(i=>i.type === 'skill'));
        }
        return data;
    }

    async close(options = {}) {
        await super.close(options);
        if(this.done) {
            this.actor.sheet.render(true);
        } else {
            await this.actor.sheet._onClearCharacterTemplate();
            await this.actor.deleteEmbeddedDocuments("Item", this.actor.items.map(i => i.id));
        }
    }

    async _updateObject(ev, formData) {
    }
}

