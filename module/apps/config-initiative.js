export default class od6sInitiativeConfiguration extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
        this.form = null;
        this.requiresWorldReload = false;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "custom_labels";
        options.template = "systems/od6s/templates/settings/initiative-settings.html";
        options.width = 600;
        options.minimizable = true;
        options.resizable = true;
        options.title = game.i18n.localize("OD6S.CONFIG_INITIATIVE_MENU");
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

        data.settings = Array.from(game.settings.settings).filter(s => s[1].od6sInitiative).map(i => i[1])
        data.settings.forEach(s => s.inputType = s.type == Boolean ? "checkbox" : "text")
        data.settings.forEach(s => s.choice = typeof(s.choices) === 'undefined'  ? false : true)
        data.settings.forEach(s => s.value = game.settings.get(s.namespace, s.key))

        if (data.settings.filter(s=> s.key === 'reroll_initiative').choice === false) {
            data.settings.filter(s=> s.key === 'auto_reroll_character').choice = false;
            data.settings.filter(s=> s.key === 'auto_reroll_npc').choice = false;
            data.settings.filter(s=> s.key === 'auto_reroll_character').value = false;
            data.settings.filter(s=> s.key === 'auto_reroll_npc').value = false;
        }

        return data;
    }

    async _updateObject(event, formData) {
        for(let setting in formData) {
            await game.settings.set("od6s", setting, formData[setting]).then(() => {
                this.render(true)
            });
            const s = game.settings.settings.get('od6s.'+setting);
            this.requiresWorldReload ||= s.requiresReload;
        }

        if(formData.reroll_initiative === false) {
            await game.settings.set("od6s", 'auto_reroll_character', false).then(() => {
                this.render(true)
            });
            await game.settings.set("od6s", 'auto_reroll_npc', false).then(() => {
                this.render(true)
            });
        }
    }
}