import OD6S from "../config/config-od6s.js";


export default class od6sAttributesSortingConfiguration extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
        this.form = null;
        this.requiresWorldReload = true;

        const attributes = [];
        for (const i in OD6S.attributes ) {
            const entry = {};
            entry.id = i;
            entry.name = OD6S.attributes[i].name;
            entry.sort = OD6S.attributes[i].sort;
            entry.active = OD6S.attributes[i].active;
            attributes.push(entry);
        }
        this.attributes = attributes.sort((a,b) => (a.sort) - (b.sort));
        this.dragStart = null;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "custom_attributes_sorting";
        options.template = "systems/od6s/templates/settings/attributes-sorting.html";
        options.width = 600;
        options.minimizable = true;
        options.resizable = true;
        options.title = game.i18n.localize("OD6S.CONFIG_ATTRIBUTES_SORTING");
        options.submitOnChange = true;
        options.closeOnSubmit = false;
        options.submitOnClose = true;
        options.dragDrop = [{dropSelector: null}];
        return options;
    }

    async activateListeners(html) {
        super.activateListeners(html);
        let handler = ev => this._onDragStart(ev);

        html.find('li.attributes-sort-list').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        html.find('.submit').click( async () => {
            const attrSort = {};
            for (const i in this.attributes) {
                const key = this.attributes[i].id;
                attrSort[key] = {};
                attrSort[key].sort = this.attributes[i].sort;
            }
            await game.settings.set('od6s', 'attributes_sorting', attrSort);
            if(this.requiresWorldReload) await SettingsConfig.reloadConfirm({world: this.requiresWorldReload});
            await this.close();
        })
    }

    getData(options) {
        let data = super.getData(options);
        data.attributes = this.attributes;
	    return data;
    }

    _onDragStart(ev) {
        this.dragStart = ev.target.dataset.attributeId;
    }

    _onDrop(ev) {
        // Change sorting order
        const source = this.attributes.find(a=>a.id===this.dragStart);
        this.dragStart = null;
        const dropTarget = ev.target.closest("li[data-attribute-id]");
        if(!dropTarget) return;
        const target = this.attributes.find(a=>a.id===dropTarget.dataset.attributeId);
        if(source === target) return;

        const attributes = [];
        if (source.sort < target.sort) {
            for (let i = 0; i < this.attributes.length; i++) {
                if(i <= target.sort && i > source.sort) {
                    attributes.push({
                        id: this.attributes[i].id,
                        name: this.attributes[i].name,
                        sort: this.attributes[i].sort - 1,
                        active: this.attributes[i].active
                    })
                } else if (i === source.sort) {
                    attributes.push({
                        id: source.id,
                        name: source.name,
                        sort: target.sort,
                        active: source.active
                    })
                } else {
                    attributes.push(this.attributes[i]);
                }
            }
        } else {
            for (let i = 0; i < this.attributes.length; i++) {
                if(i >= target.sort && i < source.sort) {
                    attributes.push({
                        id: this.attributes[i].id,
                        name: this.attributes[i].name,
                        sort: this.attributes[i].sort + 1,
                        active: this.attributes[i].active
                    })
                } else if (i === source.sort) {
                    attributes.push({
                        id: source.id,
                        name: source.name,
                        sort: target.sort,
                        active: source.active
                    })
                } else {
                    attributes.push(this.attributes[i]);
                }
            }
        }
        this.attributes = attributes.sort((a,b) => (a.sort || 0) - (b.sort || 0));
        this.getData();
        this.render();
    }

    async _updateObject(event, formData) {

    }
}
