export class OD6SAddEmbeddedCrew extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "add-embedded-crew";
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

        const document = await fromUuid(formData.actor);
        const crew = await fromUuid(formData.addcrew);
        if(document.documentName === 'Actor') {
            await document.addEmbeddedPilot(crew);
            document.sheet.render();
        } else {
            await document.actor.addEmbeddedPilot(crew);
            document.actor.sheet.render('false');
        }
    }
}

export default OD6SAddEmbeddedCrew;