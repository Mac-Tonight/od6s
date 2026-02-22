export default class od6sWildDieConfiguration extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
        this.form = null;
        this.requiresWorldReload = false;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "wild_die";
        options.template = "systems/od6s/templates/settings/wild-die.html";
        options.width = 600;
        options.height = 400;
        options.minimizable = true;
        options.resizable = true;
        options.title = game.i18n.localize("OD6S.CONFIG_WILD_DIE_MENU");
        options.submitOnChange = true;
        options.closeOnSubmit = false;
        options.submitOnClose = true;
        return options;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.use_wild_die').change( async () => {
            this.show = !this.show;
            await this.render();
        })

        html.find('.submit').click( async () => {
            if(this.requiresWorldReload) await SettingsConfig.reloadConfirm({world: this.requiresWorldReload});
            await this.close();
        })
    }

    getData() {
        let data = super.getData;

        data.settings = Array.from(game.settings.settings).filter(s => s[1].od6sWildDie).map(i => i[1])
        data.settings.forEach(s => s.inputType = s.type === Boolean ? "checkbox" : "text")
        data.settings.forEach(s => s.choice = typeof(s.choices) === 'undefined'  ? false : true)
        data.settings.forEach(s => s.value = game.settings.get(s.namespace, s.key))
        if (typeof(this.show) === 'undefined') {
            this.show = data.settings.find(s => s.key === 'use_wild_die').value;
        }
        data.show = this.show;
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