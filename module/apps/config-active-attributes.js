import OD6S from "../config/config-od6s.js"

export default class od6sActiveAttributesConfiguration extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
        this.form = null;
        this.requiresWorldReload = false;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "custom_labels";
        options.template = "systems/od6s/templates/settings/active-attributes.html";
        options.width = 600;
        options.minimizable = true;
        options.resizable = true;
        options.title = game.i18n.localize("OD6S.CONFIG_ACTIVE_ATTRIBUTES");
        options.submitOnChange = true;
        options.closeOnSubmit = false;
        options.submitOnClose = true;
        return options;
    }

    async activateListeners(html) {
        super.activateListeners(html);

        html.find('.submit').click( async () => {
            if(this.requiresWorldReload) await SettingsConfig.reloadConfirm({world: this.requiresWorldReload});
            await this.close();
        })
    }

    getData() {
        let data = super.getData;

        data.settings = Array.from(game.settings.settings).filter(s => s[1].od6sActiveAttributesConfiguration).map(i => i[1])
        data.settings.forEach(s => s.inputType = s.type == Boolean ? "checkbox" : "text")
        data.settings.forEach(s => s.choice = typeof(s.choices) === 'undefined'  ? false : true)
        data.settings.forEach(s => s.value = game.settings.get(s.namespace, s.key))
        return data;
    }

    async _updateObject(event, formData) {
        for(let setting in formData) {
            if (setting.includes("actor_types")) {
                let value = formData[setting][0];
                for(let type in OD6S.actorMasks) {
                    value = formData[setting].includes(type) ?
                        this.updateActorTypes(value,type,true) : this.updateActorTypes(value,type,false);
                }
                await game.settings.set("od6s", setting, value);
            } else {
                await game.settings.set("od6s", setting, formData[setting]);
            }
            const s = game.settings.settings.get('od6s.'+setting);
            this.requiresWorldReload ||= s.requiresReload;
        }
    }

    updateActorTypes(value, type, op) {
        if (op) {
            value |= (1 << OD6S.actorMasks[type]);
        } else {
            value &= ~(1 << OD6S.actorMasks[type]);
        }
        return value;
    }
}
