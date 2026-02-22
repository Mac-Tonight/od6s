import {od6sutilities} from "../system/utilities.js";

export class OD6SAddCrew extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "add-crew";
        options.template = "systems/od6s/templates/actor/common/add-crew.html";
        options.height = 200;
        options.width = 300;
        options.minimizable = true;
        options.title = game.i18n.localize("OD6S.ADD_CREW");
        return options;
    }

    getData() {
        return super.getData();
    }

    async _updateObject(ev, formData) {
        if (ev.submitter.value === 'cancel') {
            return;
        }
        const actor = await od6sutilities.getActorFromUuid(formData.actor);
        await actor.sheet.linkCrew(formData.addcrew);
    }
}

export default OD6SAddCrew;