import {od6sutilities} from "../system/utilities.js";
import OD6S from "../config/config-od6s.js";

export class AdvanceDialog extends Dialog {

    constructor(actorSheet, advanceData, advanceTemplate, data, options) {
        super(data, options);
        this.actorSheet = actorSheet;
        this.advanceData = advanceData;
        this.advanceTemplate = advanceTemplate;
    }

    activateListeners(html) {

        super.activateListeners(html);

        html.find('.freeadvancecheckbox').change( async () => {
            /* Whenever this is toggled, reset values */
            this.advanceData.cpcost = 0;
            this.advanceData.score = this.advanceData.originalscore;
            this.advanceData.freeadvance = !(this.advanceData.freeadvance);
            await this.updateDialog();
        });

        html.find('.metaphysicsteachercheckbox').change( async () => {
            this.advanceData.metaphysicsteacher = !(this.advanceData.metaphysicsteacher);
            if (this.advanceData.metaphysicsteacher && this.advanceData.cpcost > 0) {
                this.advanceData.cpcost = Math.ceil(this.advanceData.cpcost/OD6S.advanceCostMetaphysicsSkill);
            } else if (!this.advanceData.metaphysicsteacher && this.advanceData.cpcost > 0) {
                this.advanceData.cpcost = Math.ceil(this.advanceData.cpcost * OD6S.advanceCostMetaphysicsSkill);
            }
            await this.updateDialog();
        });

        html.find('.advanceup').click(async () => {
            this.pipUp();
            await this.updateDialog();
        });

        html.find('.advancedown').click(async () => {
            this.pipDown()
            await this.updateDialog();
        });
    }

    async updateDialog() {
        this.advanceData.cpcost > this.actorSheet.actor.system.characterpoints.value ? this.advanceData.cpcostcolor="red" :
            this.advanceData.cpcostcolor="black";
        const advanceTemplate = this.advanceTemplate;
        this.data.content = await renderTemplate(advanceTemplate, this.advanceData);
        this.render();
    }

    /*
         Changed to allow custom advancements costs.
     */
    cpCost(up) {
        if (this.advanceData.freeadvance) {
            return
        }

        const item = this.actorSheet.actor.items.get(this.advanceData.itemid);
        let skillAttr = ''
        if(typeof(item) !== "undefined") {
            skillAttr = item.system.attribute;
        }
        let teacherCostMultiplier = OD6S.advanceCostMetaphysicsSkill;
        // Metaphysics costs are doubled without a teacher
        if (this.advanceData.metaphysicsteacher) {
            teacherCostMultiplier = 1;
        }

        let score;
        OD6S.flatSkills ? score = this.advanceData.base :
            score = od6sutilities.getDiceFromScore(this.advanceData.score);

        if (up) {
            // First advance in metaphysics costs 20cp
            if ( (this.advanceData.type === "attribute")
                &&  (this.advanceData.label === game.i18n.localize("OD6S.CHAR_METAPHYSICS"))
                &&  (this.advanceData.score === 0)) {

                // First meta advance costs 20cp
                this.advanceData.cpcost = 20;
                return
            }

            if (this.advanceData.type === "attribute") {
                this.advanceData.cpcost += Math.ceil((+score.dice) * OD6S.advanceCostAttribute);
            } else if (this.advanceData.type === "skill") {
                if(skillAttr === 'met') {
                    OD6S.flatSkills ? this.advanceData.cpcost +=
                            Math.ceil((+this.advanceData.base) * teacherCostMultiplier) :
                        this.advanceData.cpcost += Math.ceil((+score.dice) * teacherCostMultiplier);
                } else {
                    OD6S.flatSkills ? this.advanceData.cpcost += Math.ceil((+this.advanceData.base) * OD6S.advanceCostSkill) :
                        this.advanceData.cpcost += Math.ceil((+score.dice) * OD6S.advanceCostSkill);
                        if(item.system.isAdvancedSkill) this.advanceData.cpcost = this.advanceData.cpcost * 2;
                }
            } else if (this.advanceData.type === "specialization") {
                OD6S.flatSkills ? this.advanceData.cpcost += Math.ceil(((+this.advanceData.base) + 1) * OD6S.advanceCostSpecialization) :
                    this.advanceData.cpcost += Math.ceil(+score.dice * OD6S.advanceCostSpecialization);
            }
        } else {

            if ( (this.advanceData.type === "attribute")
                &&  (this.advanceData.label === game.i18n.localize("OD6S.CHAR_METAPHYSICS"))
                &&  (this.advanceData.score === OD6S.pipsPerDice)) {

                // First meta advance costs 20cp
                this.advanceData.cpcost = 0;
                return
            }

            if (this.advanceData.cpcost <= 0) {
                this.advanceData.cpcost = 0;
                return;
            }

            if (score.pips === 0) {
                -- score.dice;
            }
            if (this.advanceData.type === "attribute") {
                this.advanceData.cpcost -= Math.ceil((+score.dice) * OD6S.advanceCostAttribute);
            } else if (this.advanceData.type === "skill") {
                if(skillAttr === 'met') {
                    OD6S.flatSkills ? this.advanceData.cpcost -= Math.ceil((+this.advanceData.base) * teacherCostMultiplier) :
                        this.advanceData.cpcost -= Math.ceil((+score.dice) * teacherCostMultiplier);
                } else {
                    OD6S.flatSkills ? this.advanceData.cpcost -= Math.ceil((+this.advanceData.base) * OD6S.advanceCostSkill) :
                        this.advanceData.cpcost -= Math.ceil((+score.dice) * OD6S.advanceCostSkill);
                }
            } else if (this.advanceData.type === "specialization") {
                OD6S.flatSkills ? this.advanceData.cpcost -= Math.ceil((+this.advanceData.base) * OD6S.advanceCostSpecialization) :
                    this.advanceData.cpcost -= Math.ceil(+score.dice * OD6S.advanceCostSpecialization);
            }
        }
    }

    pipUp() {
        // First meta advance goes straight to 1D
        const item = this.actorSheet.actor.items.get(this.advanceData.itemid);
        let skillAttr = ''
        if(typeof(item) !== "undefined") {
            skillAttr = item.system.attribute;
        }

        if ( (this.advanceData.type === "attribute")
            &&  (this.advanceData.label === game.i18n.localize("OD6S.CHAR_METAPHYSICS"))
            &&  (this.advanceData.score === 0)) {

            this.cpCost(true);
            this.advanceData.score = OD6S.pipsPerDice;
            return true;
        }

        if(OD6S.skillUsed && this.advanceData.type !== "attribute" && skillAttr !== 'met') {
            /* Only allow advances if the skill was used */
            if(!this.advanceData.used) {
                ui.notifications.warn(game.i18n.localize("OD6S.SKILL_MUST_BE_USED"));
                return false;
            }
        }

        /* Only allow one advance per dialog per attribute/item */
        if ((this.advanceData.originalscore < this.advanceData.score)
                && (!this.advanceData.freeadvance)) {
            ui.notifications.warn(game.i18n.localize("OD6S.ALREADY_ADVANCED") );
            return false;
        }

        /* Do not allow advances above attribute maximum */
        if ( (this.advanceData.type === "attribute")) {
            let attr = "";
            for (let attribute in OD6S.attributes) {
                if(OD6S.attributes[attribute].name === this.advanceData.label) {
                    attr = attribute;
                    break;
                }
            }
            if (attr === "") {
                // For some reason this happens on The Forge
                for (let attribute in OD6S.attributes) {
                    if(OD6S.attributes[attribute].name === this.advanceData.label) {
                        attr = attribute;
                        break;
                    }
                }
            }

            //Bypass the advancement check if the attribute wasn't found
            if (attr !== "") {
                if ((this.advanceData.score + 1) > this.actorSheet.actor.system.attributes[attr].max) {
                    ui.notifications.warn(game.i18n.localize("OD6S.WARN_ADVANCE_GREATER_THAN_MAX"));
                    return false;
                }
            }
        }

        this.cpCost(true);
        if(OD6S.flatSkills) this.advanceData.base ++;
        this.advanceData.score ++;
        return true;
    }

    pipDown() {
        // First meta advance goes straight to 1D
        if ( (this.advanceData.type === "attribute")
            &&  (this.advanceData.label === game.i18n.localize("OD6S.CHAR_METAPHYSICS"))
            &&  (this.advanceData.score === OD6S.pipsPerDice)) {

            this.cpCost(false);
            this.advanceData.score = 0;
            return(true);
        }

        /* Decrement pips down by 2->1->0, then take a die, keep track of original score */
        if (this.advanceData.score < 1) {
            // Can't go below zero
            return(false);
        }

        if(this.advanceData.score <= this.advanceData.originalscore) {
            // Can't go below the original score
            return(false);
        }

        this.cpCost(false);
        if(OD6S.flatSkills) this.advanceData.base --;
        this.advanceData.score --;
        return(true);
    }
}

export class od6sadvance {

    activateListeners(html)
    {
        super.activateListeners(html);
    }

    async _onAdvance(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let originalScore = 0;
        let cpcost = 0;
        let dice = dataset.dice;
        let pips = dataset.pips;
        let base = dataset.base;
        let freeAdvance = Boolean(false);
        let itemid = 0;
        let used = false;
        let metaPhysicsSkill = false;
        let metaphysicsteacher = false;
        const actorData = this.actor.system;

        /* Determine the type of thing we're trying to advance so we can set the correct data fields */
        if (dataset.type === "skill") {
            const skill = this.actor.getEmbeddedDocument("Item", dataset.itemId);
            let attribute;
            for (attribute in this.actor.system.attributes) {
                if (skill.system.attribute === attribute) {
                    originalScore = (+skill.system.base);
                    if (!OD6S.flatSkills)
                        originalScore += (+actorData.attributes[attribute].base)
                }
            }
            if (skill.system.attribute === 'met') {
                metaPhysicsSkill = true;
            }
            itemid = dataset.itemId;
            used = skill.system.used.value;
        } else if (dataset.type === "attribute") {
            const attrname = dataset.attrname;
            originalScore = actorData.attributes[attrname].base;
        } else if (dataset.type === "specialization") {
            const spec = this.actor.getEmbeddedDocument("Item", dataset.itemId);
            const skill = this.actor.getEmbeddedDocument("Item", spec.system.skill);
            used = spec.system.used.value;
            let attribute;
            for (attribute in this.actor.system.attributes) {
                if (spec.system.attribute === attribute) {
                    originalScore = (+spec.system.base);
                    if (!OD6S.flatSkills)
                        originalScore += (+actorData.attributes[attribute].base)
                }
            }
            itemid = dataset.itemId;
        }

        /* Structure to pass to dialog */
        let advanceData = {
            label: dataset.label,
            score: originalScore,
            base: base,
            cpcost: cpcost,
            cpcostcolor: "black",
            freeadvance: freeAdvance,
            type: dataset.type,
            originalscore: originalScore,
            itemid: itemid,
            used: used,
            metaPhysicsSkill: metaPhysicsSkill,
            metaphysicsteacher: metaphysicsteacher
        }

        const advanceTemplate = "systems/od6s/templates/actor/character/advance.html";
        const html = await renderTemplate(advanceTemplate, advanceData);

        let d;
        if(OD6S.flatSkills) {
            d = new AdvanceDialog(this, advanceData, advanceTemplate, {
                title: game.i18n.localize("OD6S.ADVANCE") + "!",
                content: html,
                buttons: {
                    advance: {
                        label: game.i18n.localize("OD6S.ADVANCE"),
                        callback: dlg => od6sadvance.advanceAction(
                            d.actorSheet.actor,
                            d.advanceData,
                            event,
                            $(dlg[0]).find("#base")[0].base)
                    }
                },
                default: "advance"
            }).render(true);
        } else {
            d = new AdvanceDialog(this, advanceData, advanceTemplate, {
                title: game.i18n.localize("OD6S.ADVANCE") + "!",
                content: html,
                buttons: {
                    advance: {
                        label: game.i18n.localize("OD6S.ADVANCE"),
                        callback: dlg => od6sadvance.advanceAction(
                            d.actorSheet.actor,
                            d.advanceData,
                            event,
                            $(dlg[0]).find("#dice")[0].value,
                            $(dlg[0]).find("#pips")[0].value)
                    }
                },
                default: "advance"
            }).render(true);
        }
    }

    static async advanceAction(actor, advanceData, event, dice, pips) {

        const actorData = actor.system;
        let update = '';
        const actorUpdate = {};
        const updates = [];
        actorUpdate.system = {};
        let specs = [];

        /* freeadvance was checked, use form data instead */
        if (advanceData.freeadvance) {
            OD6S.flatSkills ? advanceData.score = advanceData.base :
                advanceData.score = od6sutilities.getScoreFromDice(dice, pips);
        }

        /* Character Point cost is too high. */
        if (!advanceData.freeadvance) {
            if (advanceData.cpcost > actorData.characterpoints.value) {
                ui.notifications.warn(game.i18n.localize("OD6S.NOT_ENOUGH_CP_ADVANCE"));
                return;
            }
        }

        /* Determine item or attribute */
        if (event.currentTarget.dataset.type === "attribute") {
            actorUpdate.system.attributes = {};
            actorUpdate.system.attributes[event.currentTarget.dataset.attrname] = {};
            actorUpdate.system.attributes[event.currentTarget.dataset.attrname].base = advanceData.score;
        }

        if(event.currentTarget.dataset.type === "skill") {
            const skill = actor.items.get(advanceData.itemid);

            if(OD6S.specLink) {
                /* Also advance any specializations derived from this skill */
                specs = actor.items.filter(i => i.type === 'specialization' &&
                    i.system.skill === skill.name);
            }

            /* Add/subtract to item score, not displayed/aggregate score */
            let newScore;
            let newSkillScore;

            OD6S.flatSkills ? newScore = advanceData.base : newScore = advanceData.score - advanceData.originalscore;
            if (!OD6S.flatSkills) {
                newSkillScore = (+newScore) +
                    (+actor.getEmbeddedDocument("Item", advanceData.itemid, true).system.base);
            }

            updates.push ({
                _id: advanceData.itemid,
                "system.base": newSkillScore
            });

            if(OD6S.specLink) {
                for (const spec in specs) {
                    let newSpecScore;
                    if (!OD6S.flatSkills) {
                        newSpecScore = (+newScore) +
                            (+specs[spec].system.base);
                    }
                    updates.push({
                        _id: specs[spec]._id,
                        "system.base": newSpecScore
                    })
                }
            }
        }

        if(event.currentTarget.dataset.type === "specialization") {
            const specs = actor.items.filter(i => i.type === "specialization");
            /* Add/subtract to item score, not displayed/aggregate score */
            let newScore;
            OD6S.flatSkills ? newScore = advanceData.base : newScore = advanceData.score - advanceData.originalscore;
            if (!OD6S.flatSkills) {
                newScore = (+newScore) +
                    (+actor.getEmbeddedDocument("Item", advanceData.itemid, true).system.base);
            }
            updates.push ({
                _id: advanceData.itemid,
                "system.base": newScore
            });
        }

        if (advanceData.cpcost > 0) {
            actorUpdate.system.characterpoints = {};
            actorUpdate.system.characterpoints.value = actorData.characterpoints.value -= (+advanceData.cpcost);
            if (actorUpdate.system.characterpoints.value < 0) {
                actorUpdate.system.characterpoints.value = 0;
            }
        }

        actorUpdate.id = actor.id;

        await actor.update(actorUpdate, {diff: true});
        if(updates.length > 0) {await actor.updateEmbeddedDocuments("Item", updates)}
        actor.render();
    }
}
