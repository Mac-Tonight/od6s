/**
 * Star Wars D6 configuration helper for OpenD6 Space.
 * Sets system settings to match Star Wars D6 Second Edition rules and terminology.
 * Formerly the 'starwarsd6-essentialcompanion-od6s' module by Darth Banjo, now integrated.
 */
export default class OD6SStarWarsConfiguration extends FormApplication {

    constructor(object={}, options={}) {
        super(options);
        this.object = object;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'od6s-starwars-config';
        options.template = 'systems/od6s/templates/settings/starwars-config.html';
        options.resizable = false;
        options.minimizable = false;
        options.editable = true;
        options.submitOnChange = false;
        options.submitOnClose = false;
        options.closeOnSubmit = true;
        options.width = 500;
        options.title = game.i18n.localize('OD6S.SW.CONFIG_NAME');
        return options;
    }

    getData(options) {
        const state = game.settings.get('od6s', 'sw_config_state');
        return {
            hint: game.i18n.localize('OD6S.SW.CONFIG_HINT'),
            options: [
                { id: 'labels', on: state.labels ?? true,  desc: 'OD6S.SW.FORM_LABELS' },
                { id: 'fields', on: state.fields ?? true,  desc: 'OD6S.SW.FORM_FIELDS' },
                { id: 'deadly', on: state.deadly ?? true,  desc: 'OD6S.SW.FORM_DEADLY' },
                { id: 'rules',  on: state.rules  ?? true,  desc: 'OD6S.SW.FORM_RULES'  },
            ]
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('button.cancel').on('click', e => { e.preventDefault(); this.close(); });
        html.find('button.submit').on('click', e => { e.preventDefault(); this.submit(); });
    }

    async _updateObject(event, formData) {
        await game.settings.set('od6s', 'sw_config_state', formData);
        if (formData.labels) await this._updateLabels();
        if (formData.fields) await this._updateFields();
        if (formData.deadly) await this._updateDeadly();
        if (formData.rules)  await this._updateRules();
        ui.notifications.info(game.i18n.localize('OD6S.SW.CONFIG_APPLIED'));
    }

    async _updateLabels() {
        const loc = key => game.i18n.localize(key);
        await game.settings.set('od6s', 'customize_fate_points',                 loc('OD6S.SW.FATE_POINTS'));
        await game.settings.set('od6s', 'customize_fate_points_short',           loc('OD6S.SW.FATE_POINTS_SHORT'));
        await game.settings.set('od6s', 'customize_currency_label',              loc('OD6S.SW.CURRENCY'));
        await game.settings.set('od6s', 'customize_vehicle_toughness',           loc('OD6S.SW.VEHICLE_TOUGHNESS'));
        await game.settings.set('od6s', 'customize_starship_toughness',          loc('OD6S.SW.STARSHIP_TOUGHNESS'));
        await game.settings.set('od6s', 'interstellar_drive_name',               loc('OD6S.SW.HYPERDRIVE'));
        await game.settings.set('od6s', 'customize_metaphysics_extranormal',     loc('OD6S.SW.FORCE_SENSITIVE'));
        await game.settings.set('od6s', 'customize_manifestations',              loc('OD6S.SW.FORCE_POWERS'));
        await game.settings.set('od6s', 'customize_manifestation',               loc('OD6S.SW.FORCE_POWER'));
        await game.settings.set('od6s', 'customize_metaphysics_name',            loc('OD6S.SW.THE_FORCE'));
        await game.settings.set('od6s', 'customize_metaphysics_name_short',      loc('OD6S.SW.THE_FORCE'));
        await game.settings.set('od6s', 'customize_metaphysics_skill_channel',   loc('OD6S.SW.CONTROL'));
        await game.settings.set('od6s', 'customize_metaphysics_skill_sense',     loc('OD6S.SW.SENSE'));
        await game.settings.set('od6s', 'customize_metaphysics_skill_transform', loc('OD6S.SW.ALTER'));
        await game.settings.set('od6s', 'customize_agility_name',                loc('OD6S.SW.DEXTERITY'));
        await game.settings.set('od6s', 'customize_agility_name_short',          loc('OD6S.SW.DEX_SHORT'));
        await game.settings.set('od6s', 'customize_strength_name_short',         loc('OD6S.SW.STR_SHORT'));
        await game.settings.set('od6s', 'customize_mechanical_name_short',       loc('OD6S.SW.MEC_SHORT'));
        await game.settings.set('od6s', 'customize_knowledge_name_short',        loc('OD6S.SW.KNO_SHORT'));
        await game.settings.set('od6s', 'customize_perception_name_short',       loc('OD6S.SW.PER_SHORT'));
        await game.settings.set('od6s', 'customize_technical_name_short',        loc('OD6S.SW.TEC_SHORT'));
    }

    async _updateFields() {
        await game.settings.set('od6s', 'custom_field_1',              game.i18n.localize('OD6S.SW.DARK_SIDE_POINTS'));
        await game.settings.set('od6s', 'custom_field_1_short',        game.i18n.localize('OD6S.SW.DARK_SIDE_POINTS_SHORT'));
        await game.settings.set('od6s', 'custom_field_1_type',         'number');
        await game.settings.set('od6s', 'custom_field_1_actor_types',  3);
    }

    async _updateDeadly() {
        await game.settings.set('od6s', 'deadliness',      3);
        await game.settings.set('od6s', 'npc-deadliness',  3);
        await game.settings.set('od6s', 'creature-deadliness', 3);
    }

    async _updateRules() {
        await game.settings.set('od6s', 'hide_advantages_disadvantages', true);
        await game.settings.set('od6s', 'hide_compendia',               true);
        await game.settings.set('od6s', 'bodypoints',                   0);
        await game.settings.set('od6s', 'highhitdamage',                false);
        await game.settings.set('od6s', 'brawl_attribute',              game.i18n.localize('OD6S.SW.BRAWL_ATTRIBUTE'));
        await game.settings.set('od6s', 'parry_skills',                 true);
        await game.settings.set('od6s', 'reaction_skills',              true);
        await game.settings.set('od6s', 'defense_lock',                 true);
        await game.settings.set('od6s', 'fate_point_round',             true);
        await game.settings.set('od6s', 'fate_point_climactic',         true);
        await game.settings.set('od6s', 'strength_damage',              true);
        await game.settings.set('od6s', 'metaphysics_attribute_optional', true);
        await game.settings.set('od6s', 'dice_for_scale',               true);
        await game.settings.set('od6s', 'sensors',                      true);
        await game.settings.set('od6s', 'vehicle_difficulty',           true);
        await game.settings.set('od6s', 'passenger_damage_dice',        true);
        await game.settings.set('od6s', 'show_skill_specialization',    true);
        await game.settings.set('od6s', 'dice_for_grenades',            true);
        await game.settings.set('od6s', 'map_range_to_difficulty',      true);
        await game.settings.set('od6s', 'melee_difficulty',             true);
        await game.settings.set('od6s', 'random_hit_locations',         true);
        await game.settings.set('od6s', 'pip_per_dice',                 3);
        await game.settings.set('od6s', 'flat_skills',                  false);
    }
}
