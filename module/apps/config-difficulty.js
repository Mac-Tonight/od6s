export default class od6sDifficultyConfiguration extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
        this.form = null;
        this.requiresWorldReload = false;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "custom_labels";
        options.template = "systems/od6s/templates/settings/settings.html";
        options.width = 600;
        options.minimizable = true;
        options.resizable = true;
        options.title = game.i18n.localize("OD6S.CONFIG_DIFFICULTY_MENU");
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

        data.settings = Array.from(game.settings.settings).filter(s => s[1].od6sDifficulty).map(i => i[1])
        data.settings.forEach(s => s.inputType = s.type == Boolean ? "checkbox" : "text")
        data.settings.forEach(s => s.choice = typeof(s.choices) === 'undefined'  ? false : true)
        data.settings.forEach(s => s.value = game.settings.get(s.namespace, s.key))
        return data;
    }

    async _updateObject(event, formData) {
        for(let setting in formData) {
            await game.settings.set("od6s", setting, formData[setting]);
            const s = game.settings.settings.get('od6s.'+setting);
            this.requiresWorldReload ||= s.requiresReload;
        }

    }
}