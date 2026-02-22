export default class OD6SItemInfo extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "item-info";
        options.template = "systems/od6s/templates/item/item-info.html";
        options.width = 320;
        options.minimizable = true;
        options.resizable = true;
        options.classes =["od6s bordered", "od6s boxed", "od6s item-info-ok-button",
            "od6s .align-form-header","od6s align-center-header"];
        options.title = game.i18n.localize("OD6S.ITEM_INFO");
        return options;
    }

    getData() {
        return super.getData();
    }

    async _updateObject(event, formData) {
    }
}