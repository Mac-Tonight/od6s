// System Settings
import OD6S from "./config-od6s.js";
import od6sCustomLabelsConfiguration from "../apps/config-labels.js";
import od6sWildDieConfiguration from "../apps/config-wild-die.js";
import od6sDeadlinessConfiguration from "../apps/config-deadliness.js";
import od6sRevealConfiguration from "../apps/config-reveal.js";
import od6sRulesConfiguration from "../apps/config-rules.js";
import od6sDifficultyConfiguration from "../apps/config-difficulty.js"
import od6sCustomFieldsConfiguration from "../apps/config-custom-fields.js"
import od6sAutomationConfiguration from "../apps/config-automation.js"
import od6sInitiativeConfiguration from "../apps/config-initiative.js"
import od6sActiveAttributesConfiguration from "../apps/config-active-attributes.js";
import od6sCharacterPointConfiguration from "../apps/config-characterpoints.js";
import od6sMiscRulesConfiguration from "../apps/config-miscrules.js";
import od6sAttributesSortingConfiguration from "../apps/config-attributes-sorting.js";
import OD6SStarWarsConfiguration from "../apps/config-starwars.js";
import {od6sutilities} from "../system/utilities.js";
import {createOD6SMacro} from "../od6s.js"

export async function updateRerollInitiative(value) {
    if (value) {
        OD6S.initiative.reroll_character = game.settings.get('od6s', 'auto_reroll_character');
        OD6S.initiative.reroll_npc = game.settings.get('od6s', 'auto_reroll_npc');
    } else {
        OD6S.initiative.reroll_character = false;
        OD6S.initiative.reroll_npc = false;
        await game.settings.set('od6s', 'auto_reroll_character', false);
        await game.settings.set('od6s', 'auto_reroll_npc', false);
    }
}

export default function od6sSettings() {
    Hooks.once('init', async function () {
        await registerSettings();
    });
    Hooks.on('renderSettingsConfig', async function () {
        await registerSettings();
    });
    Hooks.once('i18nInit', async function () {
        await registerSettings();
    });
}

export async function registerSettings() {
    game.settings.registerMenu("od6s", "custom_labels_menu", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_LABELS"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_LABELS_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_LABELS"),
        type: od6sCustomLabelsConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "custom_fields_menu", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_FIELDS"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_FIELDS_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_CUSTOM_FIELDS"),
        type: od6sCustomFieldsConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "wild_die_menu", {
        name: game.i18n.localize("OD6S.CONFIG_WILD_DIE_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_WILD_DIE_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_WILD_DIE_MENU_LABEL"),
        type: od6sWildDieConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "character_point_menu", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINT_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINT_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINT_MENU"),
        type: od6sCharacterPointConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "deadliness_menu", {
        name: game.i18n.localize("OD6S.CONFIG_DEADLINESS_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_DEADLINESS_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_DEADLINESS_MENU"),
        type: od6sDeadlinessConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "reveal_menu", {
        name: game.i18n.localize("OD6S.CONFIG_REVEAL_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_REVEAL_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_REVEAL_MENU_LABEL"),
        type: od6sRevealConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "rules_options_menu", {
        name: game.i18n.localize("OD6S.CONFIG_RULES_OPTIONS_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_RULES_OPTIONS_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_RULES_OPTIONS_MENU_LABEL"),
        type: od6sRulesConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "initiative_menu", {
        name: game.i18n.localize("OD6S.CONFIG_INITIATIVE_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_INITIATIVE_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_INITIATIVE_MENU_LABEL"),
        type: od6sInitiativeConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "automation_menu", {
        name: game.i18n.localize("OD6S.CONFIG_AUTOMATION_OPTIONS_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTOMATION_OPTIONS_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_AUTOMATION_OPTIONS_MENU_LABEL"),
        type: od6sAutomationConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "difficulty_menu", {
        name: game.i18n.localize("OD6S.CONFIG_DIFFICULTY_MENU"),
        hint: game.i18n.localize("OD6S.CONFIG_DIFFICULTY_MENU_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_DIFFICULTY_MENU_LABEL"),
        type: od6sDifficultyConfiguration,
        restricted: true
    })

    game.settings.registerMenu("od6s", "misc_menu", {
        name: game.i18n.localize("OD6S.CONFIG_MISC_RULES"),
        hint: game.i18n.localize("OD6S.CONFIG_MISC_RULES_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MISC"),
        type: od6sMiscRulesConfiguration,
        restricted: true
    })

    game.settings.registerMenu('od6s', 'active_attributes_menu', {
        name: game.i18n.localize("OD6S.CONFIG_ACTIVE_ATTRIBUTES"),
        hint: game.i18n.localize("OD6S.CONFIG_ACTIVE_ATTRIBUTES_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_ACTIVE_ATTRIBUTES_MENU"),
        type: od6sActiveAttributesConfiguration,
        restricted: true
    })

    game.settings.registerMenu('od6s', 'attributes_sorting_menu', {
        name: game.i18n.localize("OD6S.CONFIG_ATTRIBUTES_SORTING"),
        hint: game.i18n.localize("OD6S.CONFIG_ATTRIBUTES_SORTING_DESCRIPTION"),
        label: game.i18n.localize("OD6S.CONFIG_ATTRIBUTES_SORTING_MENU"),
        type: od6sAttributesSortingConfiguration,
        restricted: true
    })

    game.settings.registerMenu('od6s', 'starwars_config_menu', {
        name: game.i18n.localize("OD6S.SW.CONFIG_MENU_NAME"),
        hint: game.i18n.localize("OD6S.SW.CONFIG_MENU_HINT"),
        label: game.i18n.localize("OD6S.SW.CONFIG_MENU_LABEL"),
        type: OD6SStarWarsConfiguration,
        restricted: true,
        icon: 'fas fa-jedi'
    })

    game.settings.register('od6s', 'sw_config_state', {
        scope: 'world',
        config: false,
        type: Object,
        default: {}
    })

    game.settings.register('od6s', 'attributes_sorting', {
        scope: "world",
        config: false,
        type: Object,
        default: {}
    })

    game.settings.register("od6s", "character_points_skill_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_SKILL_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_SKILL_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 2,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.skill = value : 2)
    })

    game.settings.register("od6s", "character_points_attribute_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_ATTRIBUTE_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_ATTRIBUTE_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 2,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.attribute = value : 2)
    })

    game.settings.register("od6s", "character_points_specialization_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_SPECIALIZATION_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_SPECIALIZATION_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.specialization = value : 2)
    })

    game.settings.register("od6s", "character_points_dodge_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_DODGE_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_DODGE_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.dodge = value : 2)
    })

    game.settings.register("od6s", "character_points_parry_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_PARRY_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_PARRY_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.parry = value : 2)
    })

    game.settings.register("od6s", "character_points_block_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_BLOCK_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_BLOCK_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.block = value : 2)
    })

    game.settings.register("od6s", "character_points_dr_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_DR_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_DR_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.dr = value : 2)
    })

    game.settings.register("od6s", "character_points_init_limit", {
        name: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_INIT_LIMIT"),
        hint: game.i18n.localize("OD6S.CONFIG_CHARACTER_POINTS_INIT_LIMIT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCharacterPoints: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.characterPointLimits.init = value : 2)
    })

    game.settings.register("od6s", "auto_opposed", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_OPPOSED"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_OPPOSED_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.autoOpposed = value : true)
    })

    game.settings.register("od6s", "auto_explosive", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_EXPLOSIVE"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_EXPLOSIVE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.autoPromptPlayerResistance = value : true)
    })

    game.settings.register("od6s", "auto_prompt_player_resistance", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_PROMPT_PLAYER_RESISTANCE"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_PROMPT_PLAYER_RESISTANCE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.autoPromptPlayerResistance = value : true)
    })

    /*
    game.settings.register("od6s", "auto_stunned", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_STUNNED"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_STUNNED_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true
    })
     */

    game.settings.register("od6s", "auto_incapacitated", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_INCAPACITATED"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_INCAPACITATED_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true
    })

    game.settings.register("od6s", "auto_mortally_wounded", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_MORTALLY_WOUNDED"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_MORTALLY_WOUNDED_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true
    })

    game.settings.register("od6s", "auto_status", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_STATUS"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_STATUS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: true,
        requiresReload: true
    })

    game.settings.register("od6s", "auto_armor_damage", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_ARMOR_DAMAGE"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_ARMOR_DAMAGE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.autoOpposed = value : true)
    })

    game.settings.register("od6s", "auto_skill_used", {
        name: game.i18n.localize("OD6S.CONFIG_AUTO_SKILL_USED"),
        hint: game.i18n.localize("OD6S.CONFIG_AUTO_SKILL_USED_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sAutomation: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.autoSkillUsed = value : true)
    })

    game.settings.register("od6s", "initiative_attribute", {
        name: game.i18n.localize("OD6S.CONFIG_INITIATIVE_ATTRIBUTE"),
        hint: game.i18n.localize("OD6S.CONFIG_INITIATIVE_ATTRIBUTE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sInitiative: true,
        type: String,
        default: 'per',
        requiresReload: true,
        choices: od6sutilities.getActiveAttributesSelect(),
        onChange: value => (OD6S.initiative.attribute = value)
    })

    game.settings.register("od6s", "reroll_initiative", {
        name: game.i18n.localize("OD6S.CONFIG_INITIATIVE_REROLL"),
        hint: game.i18n.localize("OD6S.CONFIG_INITIATIVE_REROLL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sInitiative: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (updateRerollInitiative(value))
    })

    game.settings.register("od6s", "auto_reroll_npc", {
        name: game.i18n.localize("OD6S.CONFIG_INITIATIVE_AUTO_REROLL_NPCS"),
        hint: game.i18n.localize("OD6S.CONFIG_INITIATIVE_AUTO_REROLL_NPCS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sInitiative: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.initiative.reroll_npc = value : false)
    })

    game.settings.register("od6s", "auto_reroll_character", {
        name: game.i18n.localize("OD6S.CONFIG_INITIATIVE_AUTO_REROLL_CHARACTER"),
        hint: game.i18n.localize("OD6S.CONFIG_INITIATIVE_AUTO_REROLL_CHARACTER_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sInitiative: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.initiative.reroll_character = value : false)
    })

    game.settings.register("od6s", "auto_init_dsn", {
        name: game.i18n.localize("OD6S.CONFIG_INITIATIVE_AUTO_DSN"),
        hint: game.i18n.localize("OD6S.CONFIG_INITIATIVE_AUTO_DSN_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sInitiative: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (value ? OD6S.initiative.dsn = value : false)
    })

    game.settings.register("od6s", "customize_species_label", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_SPECIES_LABEL"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_SPECIES_LABEL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.speciesLabelName = value : game.i18n.localize('OD6S.CHAR_SPECIES'))
    })

    game.settings.register("od6s", "customize_type_label", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_TYPE_LABEL"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_TYPE_LABEL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.typeLabelName = value : game.i18n.localize('OD6S.CHAR_TYPE'))
    })

    game.settings.register("od6s", "customize_fate_points", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_FATE_POINTS"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_FATE_POINTS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.fatePointsName = value : game.i18n.localize('OD6S.CHAR_FATE_POINTS'))
    })

    game.settings.register("od6s", "customize_fate_points_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_FATE_POINTS_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_FATE_POINTS_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        requiresReload: true,
        onChange: value => (value ? OD6S.fatePointsShortName = value : game.i18n.localize('OD6S.CHAR_FATE_POINTS_SHORT'))
    })

    game.settings.register("od6s", "customize_use_a_fate_point", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_USE_FATE_POINT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_USE_FATE_POINT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        requiresReload: true,
        onChange: value => (value ? OD6S.useAFatePointName = value : game.i18n.localize('OD6S.CHAR_USE_FATE_POINT'))
    })

    game.settings.register("od6s", "custom_field_1", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_1"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_1_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_1_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_1_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_1_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_1_type", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_1_TYPE"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_1_TYPE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        type: String,
        requiresReload: true,
        choices: {
            "number": game.i18n.localize("OD6S.NUMBER"),
            "string": game.i18n.localize("OD6S.STRING")
        }
    })

    game.settings.register("od6s", "custom_field_1_actor_types", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        actorType: true,
        default: 1,
        requiresReload: true,
        type: Number
    })

    game.settings.register("od6s", "custom_field_2", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_2"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_2_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_2_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_2_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_2_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_2_type", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_2_TYPE"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_2_TYPE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        type: String,
        requiresReload: true,
        choices: {
            "number": game.i18n.localize("OD6S.NUMBER"),
            "string": game.i18n.localize("OD6S.STRING")
        }
    })

    game.settings.register("od6s", "custom_field_2_actor_types", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        actorType: true,
        default: 1,
        requiresReload: true,
        type: Number
    })

    game.settings.register("od6s", "custom_field_3", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_3"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_3_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_3_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_3_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_3_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_3_type", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_3_TYPE"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_3_TYPE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        type: String,
        requiresReload: true,
        choices: {
            "number": game.i18n.localize("OD6S.NUMBER"),
            "string": game.i18n.localize("OD6S.STRING")
        }
    })

    game.settings.register("od6s", "custom_field_3_actor_types", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        actorType: true,
        default: 1,
        requiresReload: true,
        type: Number
    })

    game.settings.register("od6s", "custom_field_4", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_4"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_4_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_4_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_4_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_4_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "custom_field_4_type", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_4_TYPE"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_4_TYPE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        default: "",
        type: String,
        requiresReload: true,
        choices: {
            "number": game.i18n.localize("OD6S.NUMBER"),
            "string": game.i18n.localize("OD6S.STRING")
        }
    })

    game.settings.register("od6s", "custom_field_4_actor_types", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOM_CHARACTER_SHEET_FIELD_ACTOR_TYPES_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sCustomField: true,
        actorType: true,
        default: 1,
        requiresReload: true,
        type: Number
    })

    game.settings.register("od6s", "customize_currency_label", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CURRENCY_LABEL"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CURRENCY_LABEL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.currencyName = value : game.i18n.localize('OD6S.CREDITS'))
    })

    game.settings.register("od6s", "customize_vehicle_toughness", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_VEHICLE_TOUGHNESS"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_VEHICLE_TOUGHNESS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.vehicle_toughnessName = value : game.i18n.localize('OD6S.TOUGHNESS'))
    })

    game.settings.register("od6s", "customize_starship_toughness", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_STARSHIP_TOUGHNESS"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_STARSHIP_TOUGHNESS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.starship_toughnessName = value : game.i18n.localize('OD6S.TOUGHNESS'))
    })

    game.settings.register("od6s", "interstellar_drive_name", {
        name: game.i18n.localize('OD6S.CONFIG_INTERSTELLAR_DRIVE_NAME'),
        hint: game.i18n.localize('OD6S.CONFIG_INTERSTELLAR_DRIVE_NAME_DESCRIPTION'),
        scope: "world",
        config: false,
        default: "Interstellar Drive",
        requiresReload: true,
        type: String
    })

    game.settings.register("od6s", "customize_manifestations", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MANIFESTATIONS"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MANIFESTATIONS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.manifestationsName = value : game.i18n.localize('OD6S.CHAR_MANIFESTATIONS'))
    })

    game.settings.register("od6s", "customize_manifestation", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MANIFESTATION"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MANIFESTATION_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.manifestationName = value : game.i18n.localize('OD6S.CHAR_MANIFESTATIONS'))
    })

    game.settings.register("od6s", "customize_metaphysics_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.met.name = value : game.i18n.localize('OD6S.CHAR_METAPHYSICS'))
    })

    game.settings.register("od6s", "customize_metaphysics_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.met.name = value : game.i18n.localize('OD6S.CHAR_METAPHYSICS'))
    })

    game.settings.register("od6s", "customize_metaphysics_extranormal", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_EXTRANORMAL"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_EXTRANORMAL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.metaphysicsExtranormalName = value : game.i18n.localize('OD6S.CHAR_METAPHYSICS_EXTRANORMAL'))
    })

    game.settings.register("od6s", "customize_metaphysics_skill_channel", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_SKILL_CHANNEL"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_SKILL_CHANNEL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        onChange: value => (value ? OD6S.channelSkillName = value : game.i18n.localize('OD6S.METAPHYSICS_SKILL_CHANNEL'))
    })

    game.settings.register("od6s", "customize_metaphysics_skill_sense", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_SKILL_SENSE"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_SKILL_SENSE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.senseSkillName = value : game.i18n.localize('OD6S.METAPHYSICS_SKILL_SENSE'))
    })

    game.settings.register("od6s", "customize_metaphysics_skill_transform", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_SKILL_TRANSFORM"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_METAPHYSICS_SKILL_TRANSFORM_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        default: "",
        type: String,
        requiresReload: true,
        onChange: value => (value ? OD6S.transformSkillName = value : game.i18n.localize('OD6S.METAPHYSICS_SKILL_TRANSFORM'))
    })

    game.settings.register("od6s", "customize_agility_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_AGILITY_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_AGILITY_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.agi.name = value : game.i18n.localize('OD6S.CHAR_AGILITY'))
    })

    game.settings.register("od6s", "customize_agility_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_AGILITY_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_AGILITY_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.agi.shortName = value : game.i18n.localize('OD6S.CHAR_AGILITY_SHORT'))
    })

    game.settings.register("od6s", "customize_strength_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_STRENGTH_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_STRENGTH_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.str.name = value : game.i18n.localize('OD6S.CHAR_STRENGTH'))
    })

    game.settings.register("od6s", "customize_strength_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_STRENGTH_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_STRENGTH_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.str.shortName = value : game.i18n.localize('OD6S.CHAR_STRENGTH_SHORT'))
    })

    game.settings.register("od6s", "customize_mechanical_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MECHANICAL_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MECHANICAL_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.mec.name = value : game.i18n.localize('OD6S.CHAR_MECHANICAL'))
    })

    game.settings.register("od6s", "customize_mechanical_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MECHANICAL_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_MECHANICAL_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.mec.shortName = value : game.i18n.localize('OD6S.CHAR_MECHANICAL_SHORT'))
    })

    game.settings.register("od6s", "customize_knowledge_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_KNOWLEDGE_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_KNOWLEDGE_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.kno.name = value : game.i18n.localize('OD6S.CHAR_KNOWLEDGE'))
    })

    game.settings.register("od6s", "customize_knowledge_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_KNOWLEDGE_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_KNOWLEDGE_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.kno.shortName = value : game.i18n.localize('OD6S.CHAR_KNOWLEDGE_SHORT'))
    })

    game.settings.register("od6s", "customize_perception_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_PERCEPTION_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_PERCEPTION_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.per.name = value : game.i18n.localize('OD6S.CHAR_PERCEPTION'))
    })

    game.settings.register("od6s", "customize_perception_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_PERCEPTION_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_PERCEPTION_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.per.shortName = value : game.i18n.localize('OD6S.CHAR_PERCEPTION_NAME'))
    })

    game.settings.register("od6s", "customize_technical_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_TECHNICAL_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_TECHNICAL_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.tec.name = value : game.i18n.localize('OD6S.CHAR_TECHNICAL'))
    })

    game.settings.register("od6s", "customize_technical_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_TECHNICAL_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_TECHNICAL_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.tec.shortName = value : game.i18n.localize('OD6S.CHAR_TECHNICAL_NAME'))
    })

    game.settings.register("od6s", "customize_ca1_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA1_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA1_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.ca1.name = value : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_01'))
    })

    game.settings.register("od6s", "customize_ca1_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA1_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA1_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.ca1.shortName = value : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_01_SHORT'))
    })

    game.settings.register("od6s", "customize_ca2_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA2_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA2_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.ca2.name = value : game.i28n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_02'))
    })

    game.settings.register("od6s", "customize_ca2_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA2_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA2_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.ca2.shortName = value : game.i28n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_02_SHORT'))
    })

    game.settings.register("od6s", "customize_ca3_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA3_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA3_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.ca3.name = value : game.i38n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_03'))
    })

    game.settings.register("od6s", "customize_ca3_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA3_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA3_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.ca3.shortName = value : game.i38n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_03_SHORT'))
    })

    game.settings.register("od6s", "customize_ca4_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA4_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA4_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: '',
        requiresReload: true,
        onChange: value => (value ? OD6S.attributes.ca4.name = value : game.i48n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_04'))
    })

    game.settings.register("od6s", "customize_ca4_name_short", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA4_NAME_SHORT"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_CA4_NAME_SHORT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        onChange: value => (value ? OD6S.attributes.ca4.shortName = value : game.i48n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_04_SHORT'))
    })

    game.settings.register("od6s", "customize_body_points_name", {
        name: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_BODY_POINTS_NAME"),
        hint: game.i18n.localize("OD6S.CONFIG_CUSTOMIZE_BODY_POINTS_NAME_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sLabel: true,
        type: String,
        default: "",
        requiresReload: true,
        onChange: value => (value ? OD6S.bodyPointsName = value : game.i18n.localize('OD6S.BODY_POINTS'))
    })

    game.settings.register("od6s", "hide_compendia", {
        name: game.i18n.localize("OD6S.CONFIG_HIDE_COMPENDIA"),
        hint: game.i18n.localize("OD6S.CONFIG_HIDE_COMPENDIA_DESCRIPTION"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: () => {
            ui.compendium.render();
        }
    })

    game.settings.register("od6s", "deadliness", {
        name: game.i18n.localize("OD6S.CONFIG_DEADLINESS"),
        hint: game.i18n.localize("OD6S.CONFIG_DEADLINESS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sDeadliness: true,
        default: 3,
        type: Number,
        requiresReload: true,
        choices: {
            "1": game.i18n.localize("OD6S.CONFIG_DEADLINESS_1"),
            "2": game.i18n.localize("OD6S.CONFIG_DEADLINESS_2"),
            "3": game.i18n.localize("OD6S.CONFIG_DEADLINESS_3"),
            "4": game.i18n.localize("OD6S.CONFIG_DEADLINESS_4"),
            "5": game.i18n.localize("OD6S.CONFIG_DEADLINESS_5")
        },
        onChange: value => (OD6S.deadlinessLevel["character"] = value)
    })

    game.settings.register("od6s", "npc-deadliness", {
        name: game.i18n.localize("OD6S.CONFIG_NPC_DEADLINESS"),
        hint: game.i18n.localize("OD6S.CONFIG_NPC_DEADLINESS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sDeadliness: true,
        default: 4,
        type: Number,
        requiresReload: true,
        choices: {
            "1": game.i18n.localize("OD6S.CONFIG_DEADLINESS_1"),
            "2": game.i18n.localize("OD6S.CONFIG_DEADLINESS_2"),
            "3": game.i18n.localize("OD6S.CONFIG_DEADLINESS_3"),
            "4": game.i18n.localize("OD6S.CONFIG_DEADLINESS_4"),
            "5": game.i18n.localize("OD6S.CONFIG_DEADLINESS_5")
        },
        onChange: value => (OD6S.deadlinessLevel["npc"] = value)
    })

    game.settings.register("od6s", "creature-deadliness", {
        name: game.i18n.localize("OD6S.CONFIG_CREATURE_DEADLINESS"),
        hint: game.i18n.localize("OD6S.CONFIG_CREATURE_DEADLINESS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sDeadliness: true,
        default: 4,
        type: Number,
        requiresReload: true,
        choices: {
            "1": game.i18n.localize("OD6S.CONFIG_DEADLINESS_1"),
            "2": game.i18n.localize("OD6S.CONFIG_DEADLINESS_2"),
            "3": game.i18n.localize("OD6S.CONFIG_DEADLINESS_3"),
            "4": game.i18n.localize("OD6S.CONFIG_DEADLINESS_4"),
            "5": game.i18n.localize("OD6S.CONFIG_DEADLINESS_5")
        },
        onChange: value => (OD6S.deadlinessLevel["creature"] = value)
    })

    /* TODO
    game.settings.register("od6s", "scale-wounds", {
        name: game.i18n.localize("OD6S.CONFIG_SCALE_WOUNDS"),
        hint: game.i18n.localize("OD6S.CONFIG_SCALE_WOUNDS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sDeadliness: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => (OD6S.woundScaling = value)
    })
    */

    game.settings.register("od6s", "scale-stun", {
        name: game.i18n.localize("OD6S.CONFIG_SCALE_STUN"),
        hint: game.i18n.localize("OD6S.CONFIG_SCALE_STUN_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sDeadliness: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => (OD6S.stunScaling = value)
    })


    game.settings.register("od6s", "hide-skill-cards", {
        name: game.i18n.localize("OD6S.CONFIG_HIDE_SKILL_ROLLS"),
        hint: game.i18n.localize("OD6S.CONFIG_HIDE_SKILL_ROLLS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sReveal: true,
        type: Boolean,
        requiresReload: true,
        default: true
    })

    game.settings.register("od6s", "hide-combat-cards", {
        name: game.i18n.localize("OD6S.CONFIG_HIDE_ATTACK_ROLLS"),
        hint: game.i18n.localize("OD6S.CONFIG_HIDE_ATTACK_ROLLS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sReveal: true,
        type: Boolean,
        requiresReload: true,
        default: true
    })

    game.settings.register("od6s", "roll-modifiers", {
        name: game.i18n.localize("OD6S.CONFIG_SHOW_MODIFIERS"),
        hint: game.i18n.localize("OD6S.CONFIG_SHOW_MODIFIERS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sReveal: true,
        type: Boolean,
        requiresReload: true,
        default: true
    })

    game.settings.register("od6s", "show-roll-difficulty", {
        name: game.i18n.localize("OD6S.CONFIG_SHOW_DIFFICULTY_DROPDOWN"),
        hint: game.i18n.localize("OD6S.CONFIG_SHOW_DIFFICULTY_DROPDOWN_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sReveal: true,
        type: Boolean,
        requiresReload: true,
        default: true
    })

    game.settings.register("od6s", "hide-gm-rolls", {
        name: game.i18n.localize("OD6S.CONFIG_HIDE_GM_ROLLS"),
        hint: game.i18n.localize("OD6S.CONFIG_HIDE_GM_ROLLS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sReveal: true,
        type: Boolean,
        requiresReload: true,
        default: true
    })

    game.settings.register("od6s", "use_wild_die", {
        name: game.i18n.localize("OD6S.CONFIG_USE_WILD_DIE"),
        hint: game.i18n.localize("OD6S.CONFIG_USE_WILD_DIE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sWildDie: true,
        type: Boolean,
        requiresReload: true,
        default: true
    })

    game.settings.register("od6s", "default_wild_one", {
        name: game.i18n.localize("OD6S.CONFIG_WILD_DIE_ONE"),
        hint: game.i18n.localize("OD6S.CONFIG_WILD_DIE_ONE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sWildDie: true,
        default: 0,
        type: Number,
        choices: {
            "0": game.i18n.localize("OD6S.CONFIG_WILD_DIE_0"),
            "1": game.i18n.localize("OD6S.CONFIG_WILD_DIE_1"),
            "2": game.i18n.localize("OD6S.CONFIG_WILD_DIE_2"),
            "3": game.i18n.localize("OD6S.CONFIG_WILD_DIE_3")
        },
        requiresReload: true,
        onChange: value => (OD6S.wildDieOneDefault = value)
    })

    game.settings.register("od6s", "default_wild_die_one_handle", {
        name: game.i18n.localize("OD6S.CONFIG_WILD_DIE_ONE_HANDLE"),
        hint: game.i18n.localize("OD6S.CONFIG_WILD_DIE_ONE_HANDLE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sWildDie: true,
        default: 0,
        type: Number,
        requiresReload: true,
        choices: {
            "0": game.i18n.localize("OD6S.CONFIG_WILD_DIE_HANDLE_0"),
            "1": game.i18n.localize("OD6S.CONFIG_WILD_DIE_HANDLE_1")
        },
        onChange: value => (OD6S.wildDieOneAuto = value)
    })

    game.settings.register("od6s", "wild_die_one_face", {
        name: game.i18n.localize('OD6S.CONFIG_WILD_DIE_ONE_FACE'),
        hint: game.i18n.localize("OD6S.CONFIG_WILD_DIE_ONE_FACE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sWildDie: true,
        default: "systems/od6s/icons/skull-shield.png",
        type: String,
        filePicker: "image"
    })

    game.settings.register("od6s", "wild_die_six_face", {
        name: game.i18n.localize('OD6S.CONFIG_WILD_DIE_SIX_FACE'),
        hint: game.i18n.localize("OD6S.CONFIG_WILD_DIE_SIX_FACE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sWildDie: true,
        default: "systems/od6s/icons/eclipse-flare.png",
        type: String,
        requiresReload: true,
        filePicker: "image"
    })

    game.settings.register("od6s", "bodypoints", {
        name: game.i18n.localize("OD6S.CONFIG_USE_BODY"),
        hint: game.i18n.localize("OD6S.CONFIG_USE_BODY_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: 0,
        type: Number,
        choices: {
            "0": game.i18n.localize("OD6S.CONFIG_USE_WOUNDS"),
            "1": game.i18n.localize("OD6S.CONFIG_USE_WOUNDS_WITH_BODY"),
            "2": game.i18n.localize("OD6S.CONFIG_USE_BODY_ONLY")
        },
        requiresReload: true,
        onChange: value => (OD6S.woundConfig = value)
    })

    game.settings.register("od6s", "stun_damage_increment", {
        name: game.i18n.localize("OD6S.CONFIG_STUN_DAMAGE_INCREMENT"),
        hint: game.i18n.localize("OD6S.CONFIG_STUN_DAMAGE_INCREMENT_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: true,
        type: Boolean,
        requiresReload: true,
        onChange: value => (OD6S.stunDamageIncrement = value)
    })

    game.settings.register("od6s", "highhitdamage", {
        name: game.i18n.localize("OD6S.CONFIG_USE_OPTIONAL_DAMAGE"),
        hint: game.i18n.localize("OD6S.CONFIG_USE_OPTIONAL_DAMAGE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => (OD6S.highHitDamage = value)
    })

    game.settings.register("od6s", "weapon_armor_damage", {
        name: game.i18n.localize("OD6S.CONFIG_USE_WEAPON_ARMOR_DAMAGE"),
        hint: game.i18n.localize("OD6S.CONFIG_USE_WEAPON_ARMOR_DAMAGE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => (OD6S.highHitDamage = value)
    })

    game.settings.register("od6s", "track_stuns", {
        name: game.i18n.localize("OD6S.CONFIG_TRACK_STUNS"),
        hint: game.i18n.localize("OD6S.CONFIG_TRACK_STUNS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => (OD6S.trackStuns = value)
    })

    /* TODO

            game.settings.register("od6s", "initoptions", {
              name:  game.i18n.localize("OD6S.CONFIG_INITIATIVE_SETTING"),
              hint:  game.i18n.localize("OD6S.CONFIG_INITIATIVE_SETTING_DESCRIPTION"),
              scope: "world",
              config: true,
              default: 1,
              type: Number,
              choices: {
                "0":  game.i18n.localize("OD6S.CONFIG_INITIATIVE_1"),
                "1":  game.i18n.localize("OD6S.CONFIG_INITIATIVE_2"),
                "2":  game.i18n.localize("OD6S.CONFIG_INITIATIVE_3"),
                "3":  game.i18n.localize("OD6S.CONFIG_INITIATIVE_4")
              }
            })

            game.settings.register("od6s", "initbonus", {
              name:  game.i18n.localize("OD6S.CONFIG_USE_INIT_BONUS"),
              hint:  game.i18n.localize("OD6S.CONFIG_USE_INIT_BONUS_DESCRIPTION"),
              scope: "world",
              config: true,
              default: false,
              type: Boolean
            })

            game.settings.register("od6s", "fastcombat", {
              name:  game.i18n.localize("OD6S.CONFIG_FAST_COMBAT"),
              hint:  game.i18n.localize("OD6S.CONFIG_FAST_COMBAT_DESCRIPTION"),
              scope: "world",
              config: true,
              default: false,
              type: Boolean
            })
            */

    game.settings.register("od6s", "hide_advantages_disadvantages", {
        name: game.i18n.localize("OD6S.CONFIG_HIDE_ADVANTAGES_DISADVANTAGES"),
        hint: game.i18n.localize("OD6S.CONFIG_HIDE_ADVANTAGES_DISADVANTAGES_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: () => {
            ui.compendium.render();
        }
    })

    game.settings.register("od6s", "brawl_attribute", {
        name: game.i18n.localize("OD6S.CONFIG_BRAWL_ATTRIBUTE"),
        hint: game.i18n.localize("OD6S.CONFIG_BRAWL_ATTRIBUTE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        default: "agi",
        type: String,
        choices: {
            "agi": game.i18n.localize(OD6S.attributes.agi.name),
            "str": game.i18n.localize(OD6S.attributes.str.name),
        }
    })

    game.settings.register("od6s", "specialization_dice", {
        name: game.i18n.localize('OD6S.CONFIG_SPECIALIZATION_DICE'),
        hint: game.i18n.localize('OD6S.CONFIG_SPECIALIZATION_DICE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.specializationDice = value
    })

    game.settings.register("od6s", "parry_skills", {
        name: game.i18n.localize("OD6S.CONFIG_PARRY_SKILLS"),
        hint: game.i18n.localize("OD6S.CONFIG_PARRY_SKILLS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        default: false
    })

    game.settings.register("od6s", "reaction_skills", {
        name: game.i18n.localize("OD6S.CONFIG_REACTION_SKILLS"),
        hint: game.i18n.localize("OD6S.CONFIG_REACTION_SKILLS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        requiresReload: true,
        default: false
    })

    game.settings.register("od6s", "defense_lock", {
        name: game.i18n.localize("OD6S.CONFIG_DEFENSE_LOCK"),
        hint: game.i18n.localize("OD6S.CONFIG_DEFENSE_LOCK_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        default: false,
        onChange: value => OD6S.defenseLock = value
    })

    game.settings.register("od6s", "fate_point_round", {
        name: game.i18n.localize("OD6S.CONFIG_FATE_POINT_ROUND"),
        hint: game.i18n.localize("OD6S.CONFIG_FATE_POINT_ROUND_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => OD6S.fatePointRound = value
    })

    game.settings.register("od6s", "fate_point_climactic", {
        name: game.i18n.localize("OD6S.CONFIG_FATE_POINT_CLIMACTIC"),
        hint: game.i18n.localize("OD6S.CONFIG_FATE_POINT_CLIMACTIC_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        default: false,
        onChange: value => OD6S.fatePointClimactic = value
    })

    game.settings.register("od6s", "strength_damage", {
        name: game.i18n.localize("OD6S.CONFIG_STRENGTH_DAMAGE"),
        hint: game.i18n.localize("OD6S.CONFIG_STRENGTH_DAMAGE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        requiresReload: true,
        default: false
    })

    game.settings.register("od6s", "metaphysics_attribute_optional", {
        name: game.i18n.localize("OD6S.CONFIG_METAPHYSICS_ATTRIBUTE_OPTIONAL"),
        hint: game.i18n.localize("OD6S.CONFIG_METAPHYSICS_ATTRIBUTE_OPTIONAL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sRules: true,
        type: Boolean,
        default: false
    })

    game.settings.register("od6s", "dice_for_scale", {
        name: game.i18n.localize('OD6S.CONFIG_DICE_FOR_SCALE'),
        hint: game.i18n.localize('OD6S.CONFIG_DICE_FOR_SCALE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        requiresReload: true,
        type: Boolean
    })

    game.settings.register("od6s", "sensors", {
        name: game.i18n.localize('OD6S.CONFIG_SENSORS'),
        hint: game.i18n.localize('OD6S.CONFIG_SENSORS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean
    })

    game.settings.register("od6s", "vehicle_difficulty", {
        name: game.i18n.localize('OD6S.CONFIG_VEHICLE_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_VEHICLE_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: true,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.vehicleDifficulty = value
    })

    game.settings.register("od6s", "stun_dice", {
        name: game.i18n.localize('OD6S.CONFIG_STUN_DICE'),
        hint: game.i18n.localize('OD6S.CONFIG_STUN_DICE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        onChange: value => OD6S.passengerDamageDice = value
    })

    game.settings.register("od6s", "passenger_damage_dice", {
        name: game.i18n.localize('OD6S.CONFIG_PASSENGER_DAMAGE_DICE'),
        hint: game.i18n.localize('OD6S.CONFIG_PASSENGER_DAMAGE_DICE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        onChange: value => OD6S.passengerDamageDice = value
    })

    game.settings.register("od6s", "dice_for_grenades", {
        name: game.i18n.localize('OD6S.CONFIG_GRENADE_DAMAGE_DICE'),
        hint: game.i18n.localize('OD6S.CONFIG_GRENADE_DAMAGE_DICE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.grenadeDamageDice = value
    })

    game.settings.register("od6s", "explosive_end_of_round", {
        name: game.i18n.localize('OD6S.CONFIG_EXPLOSIVE_END_OF_ROUND'),
        hint: game.i18n.localize('OD6S.CONFIG_EXPLOSIVE_END_OF_ROUND_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean
    })

    game.settings.register("od6s", "hide_explosive_templates", {
        name: game.i18n.localize('OD6S.CONFIG_HIDE_EXPLOSIVE_TEMPLATES'),
        hint: game.i18n.localize('OD6S.CONFIG_HIDE_EXPLOSIVE_TEMPLATES_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: true,
        type: Boolean,
        onChange: value => OD6S.hideExplosiveTemplates = value
    })

    game.settings.register("od6s", "explosive_zones", {
        name: game.i18n.localize('OD6S.CONFIG_EXPLOSIVE_ZONES'),
        hint: game.i18n.localize('OD6S.CONFIG_EXPLOSIVE_ZONES_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean
    })

    game.settings.register("od6s", "map_range_to_difficulty", {
        name: game.i18n.localize('OD6S.CONFIG_MAP_RANGE_TO_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_MAP_RANGE_TO_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        onChange: value => OD6S.mapRange = value
    })

    game.settings.register("od6s", "melee_difficulty", {
        name: game.i18n.localize('OD6S.CONFIG_MELEE_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_MELEE_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.meleeDifficulty = value
    })

    game.settings.register("od6s", "cost", {
        name: game.i18n.localize('OD6S.CONFIG_COST'),
        hint: game.i18n.localize('OD6S.CONFIG_COST_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: "1",
        type: String,
        choices: {
            "0": game.i18n.localize("OD6S.CONFIG_COST_PRICE"),
            "1": game.i18n.localize("OD6S.CONFIG_COST_COST"),
        },
        onChange: value => OD6S.cost = value
    })

    game.settings.register("od6s", "funds_fate", {
        name: game.i18n.localize('OD6S.CONFIG_FUNDS_FATE'),
        hint: game.i18n.localize('OD6S.CONFIG_FUNDS_FATE'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.fundsWild = value
    })

    game.settings.register("od6s", "random_hit_locations", {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_HIT_LOCATIONS'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_HIT_LOCATIONS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        onChange: value => OD6S.randomHitLocations = value
    })

    game.settings.register("od6s", "pip_per_dice", {
        name: game.i18n.localize('OD6S.CONFIG_PIP_PER_DICE'),
        hint: game.i18n.localize('OD6S.CONFIG_PIP_PER_DICE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: 3,
        type: Number,
        onChange: value => OD6S.pipsPerDice = value
    })

    game.settings.register("od6s", "flat_skills", {
        name: game.i18n.localize('OD6S.CONFIG_FLAT_SKILLS'),
        hint: game.i18n.localize('OD6S.CONFIG_FLAT_SKILLS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.flatSkills = value
    })

    game.settings.register("od6s", "skill_used", {
        name: game.i18n.localize('OD6S.CONFIG_SKILL_USED'),
        hint: game.i18n.localize('OD6S.CONFIG_SKILL_USED_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: true,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.flatSkills = value
    })

    game.settings.register("od6s", "spec_link", {
        name: game.i18n.localize('OD6S.CONFIG_SPEC_LINK'),
        hint: game.i18n.localize('OD6S.CONFIG_SPEC_LINK_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: true,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.flatSkills = value
    })

    game.settings.register("od6s", "initial_attributes", {
        name: game.i18n.localize('OD6S.CONFIG_INITIAL_ATTRIBUTES'),
        hint: game.i18n.localize('OD6S.CONFIG_INITIAL_ATTRIBUTES_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: OD6S.initialAttributes,
        type: Number,
        onChange: value => OD6S.initialAttributes = value
    })

    game.settings.register("od6s", "initial_skills", {
        name: game.i18n.localize('OD6S.CONFIG_INITIAL_SKILLS'),
        hint: game.i18n.localize('OD6S.CONFIG_INITIAL_SKILLS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: OD6S.initialSkills,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.initialSkills = value
    })

    game.settings.register("od6s", "initial_character_points", {
        name: game.i18n.localize('OD6S.CONFIG_INITIAL_CHARACTER_POINTS'),
        hint: game.i18n.localize('OD6S.CONFIG_INITIAL_CHARACTER_POINTS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: OD6S.initialCharacterPoints,
        type: Number,
        onChange: value => OD6S.initialCharacterPoints = value
    })

    game.settings.register("od6s", "initial_fate_points", {
        name: game.i18n.localize('OD6S.CONFIG_INITIAL_FATE_POINTS'),
        hint: game.i18n.localize('OD6S.CONFIG_INITIAL_FATE_POINTS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: OD6S.initialFatePoints,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.initialFatePoints = value
    })

    game.settings.register("od6s", "initial_move", {
        name: game.i18n.localize('OD6S.CONFIG_INITIAL_MOVE'),
        hint: game.i18n.localize('OD6S.CONFIG_INITIAL_MOVE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sRules: true,
        default: OD6S.initialMove,
        type: Number,
        onChange: value => OD6S.initialMove = value
    })

    game.settings.register('od6s', 'default_difficulty_very_easy', {
        name: game.i18n.localize('OD6S.DIFFICULTY_VERY_EASY'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 5,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_VERY_EASY"].max = value
    })

    game.settings.register('od6s', 'default_difficulty_easy', {
        name: game.i18n.localize('OD6S.DIFFICULTY_EASY'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 10,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_EASY"].max = value
    })

    game.settings.register('od6s', 'default_difficulty_moderate', {
        name: game.i18n.localize('OD6S.DIFFICULTY_MODERATE'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 15,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_MODERATE"].max = value
    })

    game.settings.register('od6s', 'default_difficulty_difficult', {
        name: game.i18n.localize('OD6S.DIFFICULTY_DIFFICULT'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 20,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_DIFFICULT"].max = value
    })

    game.settings.register('od6s', 'default_difficulty_very_difficult', {
        name: game.i18n.localize('OD6S.DIFFICULTY_VERY_DIFFICULT'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 25,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_VERY_DIFFICULT"].max = value
    })

    game.settings.register('od6s', 'default_difficulty_heroic', {
        name: game.i18n.localize('OD6S.DIFFICULTY_HEROIC'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 30,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_HEROIC"].max = value
    })

    game.settings.register('od6s', 'default_difficulty_legendary', {
        name: game.i18n.localize('OD6S.DIFFICULTY_LEGENDARY'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 40,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.difficulty["OD6S.DIFFICULTY_LEGENDARY"].max = value
    })

    game.settings.register('od6s', 'default_ranged_attack_difficulty', {
        name: game.i18n.localize('OD6S.CONFIG_RANGED_ATTACK_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_RANGED_ATTACK_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 10,
        type: Number,
        requiresReload: true,
        onChange: value => (OD6S.baseRangedAttackDifficulty = value)
    })

    game.settings.register('od6s', 'default_melee_attack_difficulty', {
        name: game.i18n.localize('OD6S.CONFIG_MELEE_ATTACK_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_MELEE_ATTACK_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 10,
        type: Number,
        requiresReload: true,
        onChange: value => (OD6S.baseMeleeAttackDifficulty = value)
    })

    game.settings.register('od6s', 'default_brawl_attack_difficulty', {
        name: game.i18n.localize('OD6S.CONFIG_BRAWL_ATTACK_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_BRAWL_ATTACK_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 10,
        type: Number,
        requiresReload: true,
        onChange: value => (OD6S.baseBrawlAttackDifficulty = value)
    })

    game.settings.register('od6s', 'default_brawl_attack_difficulty_level', {
        name: game.i18n.localize('OD6S.CONFIG_BRAWL_ATTACK_DIFFICULTY_LEVEL'),
        hint: game.i18n.localize('OD6S.CONFIG_BRAWL_ATTACK_DIFFICULTY_LEVEL_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 'OD6S.DIFFICULTY_VERY_EASY',
        type: String,
        choices: od6sutilities.getDifficultyLevelSelect(),
        requiresReload: true,
        onChange: value => (OD6S.baseBrawlAttackDifficultyLevel = value)
    })

    game.settings.register('od6s', 'default_unknown_difficulty', {
        name: game.i18n.localize('OD6S.CONFIG_DEFAULT_UNKNOWN_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_DEFAULT_UNKNOWN_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: false,
        type: Boolean,
        requiresReload: true
    })

    game.settings.register('od6s', 'random_difficulty', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DICE_DIFFICULTY'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DICE_DIFFICULTY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_very_easy', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_VERY_EASY'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_VERY_EASY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 1,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_easy', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_EASY'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_EASY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 2,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_moderate', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_MODERATE'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_MODERATE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 4,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_difficult', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_DIFFICULT'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_DIFFICULT_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 6,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_very_difficult', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_VERY_DIFFICULT'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_VERY_DIFFICULT_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 8,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_heroic', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_HEROIC'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_HEROIC_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 9,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register('od6s', 'random_dice_difficulty_legendary', {
        name: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_LEGENDARY'),
        hint: game.i18n.localize('OD6S.CONFIG_RANDOM_DIFFICULTY_LEGENDARY_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sDifficulty: true,
        default: 10,
        type: Number,
        requiresReload: true,
        onChange: value => OD6S.randomDifficulty = value
    })

    game.settings.register("od6s", "highlight_effects", {
        name: game.i18n.localize('OD6S.CONFIG_HIGHLIGHT_EFFECTS'),
        hint: game.i18n.localize('OD6S.CONFIG_HIGHLIGHT_EFFECTS_DESCRIPTION'),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.highlightEffects = value
    })

    game.settings.register("od6s", "show_skill_specialization", {
        name: game.i18n.localize('OD6S.CONFIG_SHOW_SKILL_SPECIALIZATION'),
        hint: game.i18n.localize('OD6S.CONFIG_SHOW_SKILL_SPECIALIZATION_DESCRIPTION'),
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        requiresReload: true,
        onChange: value => OD6S.showSkillSpecialization = value
    })

    game.settings.register("od6s", "show_metaphysics_attributes", {
        name: game.i18n.localize('OD6S.CONFIG_SHOW_METAPHYSICS_ATTRIBUTES'),
        hint: game.i18n.localize('OD6S.CONFIG_SHOW_METAPHYSICS_ATTRIBUTES_DESCRIPTION'),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        requiresReload: true
    })

    game.settings.register("od6s", "customize_agi_active", {
        name: game.i18n.localize("OD6S.CONFIG_AGI_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.agi.active = value)
    })

    game.settings.register("od6s", "customize_str_active", {
        name: game.i18n.localize("OD6S.CONFIG_STR_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.str.active = value)
    })

    game.settings.register("od6s", "customize_mec_active", {
        name: game.i18n.localize("OD6S.CONFIG_MEC_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.mec.active = value)
    })

    game.settings.register("od6s", "customize_kno_active", {
        name: game.i18n.localize("OD6S.CONFIG_KNO_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.kno.active = value)
    })

    game.settings.register("od6s", "customize_per_active", {
        name: game.i18n.localize("OD6S.CONFIG_PER_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.per.active = value)
    })

    game.settings.register("od6s", "customize_tec_active", {
        name: game.i18n.localize("OD6S.CONFIG_TEC_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.tec.active = value)
    })

    game.settings.register("od6s", "customize_ca1_active", {
        name: game.i18n.localize("OD6S.CONFIG_CA1_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (OD6S.attributes.ca1.active = value)
    })

    game.settings.register("od6s", "customize_ca2_active", {
        name: game.i18n.localize("OD6S.CONFIG_CA2_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (OD6S.attributes.ca2.active = value)
    })

    game.settings.register("od6s", "customize_ca3_active", {
        name: game.i18n.localize("OD6S.CONFIG_CA3_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (OD6S.attributes.ca3.active = value)
    })

    game.settings.register("od6s", "customize_ca4_active", {
        name: game.i18n.localize("OD6S.CONFIG_CA4_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange: value => (OD6S.attributes.ca4.active = value)
    })

    game.settings.register("od6s", "customize_met_active", {
        name: game.i18n.localize("OD6S.CONFIG_MET_ACTIVE"),
        scope: "world",
        config: false,
        od6sActiveAttributesConfiguration: true,
        type: Boolean,
        default: true,
        requiresReload: true,
        onChange: value => (OD6S.attributes.met.active = value)
    })

    //* these are the setting for the Misc Rules Options.
    game.settings.register("od6s", "melee_range", {
        name: game.i18n.localize("OD6S.CONFIG_MELEE_RANGE"),
        hint: game.i18n.localize("OD6S.CONFIG_MELEE_RANGE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange:  value => (OD6S.meleeRange = value)
    })

    game.settings.register("od6s", "static_str_range", {
        name: game.i18n.localize("OD6S.CONFIG_STATIC_STR_RANGE"),
        hint: game.i18n.localize("OD6S.CONFIG_STATIC_STR_RANGE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        onChange:  value => (OD6S.meleeRange = value)
    })

    // place Custom Character Advancements Costs title here
    game.settings.register("od6s", "character_advanceCostAttribute", {
        name: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTATTRIBUTE"),
        hint: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTATTRIBUTE_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: 10,
        requiresReload: true,
        onChange: value => (value ? OD6S.advanceCostAttribute = value : 10)
    })

    game.settings.register("od6s", "character_advanceCostSkill", {
        name: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTSKILL"),
        hint: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTSKILL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: 1,
        requiresReload: true,
        onChange: value => (value ? OD6S.advanceCostSkill = value : 1)
    })

    game.settings.register("od6s", "character_metaphysics_advanceCostSkill", {
        name: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTSKILL_METAPHYSICS"),
        hint: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTSKILL_METAPHYSICS_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: 2,
        requiresReload: true,
        onChange: value => (value ? OD6S.advanceCostMetaphysicsSkill = value : 2)
    })

    game.settings.register("od6s", "character_advanceCostSpecialization", {
        name: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTSPECIALIZATION"),
        hint: game.i18n.localize("OD6S.CONFIG_ADVANCECOSTSPECIALIZATION_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: .5,
        requiresReload: true,
        onChange: value => (value ? OD6S.advanceCostSpecialization = value : .5)
    })

    // place Enhanced Bonus Damage title here
    game.settings.register("od6s", "character_highhitmultiplier", {
        name: game.i18n.localize("OD6S.CONFIG_HIGHHITMULTIPLIER"),
        hint: game.i18n.localize("OD6S.CONFIG_HIGHHITMULTIPLIER_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: 5,
        requiresReload: true,
        onChange: value => (value ? OD6S.highHitDamageMultiplier = value : 5)
    })

    game.settings.register("od6s", "highhit_pipsordice", {
        name: game.i18n.localize('OD6S.CONFIG_HIGHHITPIPSORDICE'),
        hint: game.i18n.localize('OD6S.CONFIG_HIGHHITPIPSORDICE_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: false,
        type: Boolean,
        onChange: value => (OD6S.highHitDamagePipsOrDice = value)
    })

    game.settings.register("od6s", "highhit_round", {
        name: game.i18n.localize('OD6S.CONFIG_HIGHHITROUND'),
        hint: game.i18n.localize('OD6S.CONFIG_HIGHHITROUND_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: false,
        type: Boolean,
        onChange: value => (OD6S.highHitDamageRound = value)
    })

    // place Customizable Resistance title here
    game.settings.register("od6s", "customize_resistanceOption", {
        name: game.i18n.localize("OD6S.CONFIG_RESISTANCE_OPTION"),
        hint: game.i18n.localize("OD6S.CONFIG_RESISTANCE_OPTION_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: false,
        type: Boolean,
        onChange: value => (OD6S.resistanceOption = value)
    })

    game.settings.register("od6s", "customize_resistanceSkill", {
        name: game.i18n.localize("OD6S.CONFIG_RESISTANCESKILL"),
        hint: game.i18n.localize("OD6S.CONFIG_RESISTANCESKILL_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: 'Stamina',
        type: String,
        onChange: value => (value ? OD6S.resistanceSkill = value : game.i18n.localize('OD6S.CONFIG_RESISTANCE_SKILL'))
    })

    game.settings.register("od6s", "resistance_round", {
        name: game.i18n.localize('OD6S.CONFIG_RESISTANCEROUND'),
        hint: game.i18n.localize('OD6S.CONFIG_RESISTANCEROUND_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: false,
        type: Boolean,
        onChange: value => (OD6S.resistanceRound = value)
    })

    game.settings.register("od6s", "character_resistanceMultiplier", {
        name: game.i18n.localize("OD6S.CONFIG_RESISTANCEMULTIPLIER"),
        hint: game.i18n.localize("OD6S.CONFIG_RESISTANCEMULTIPLIER_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: 1,
        requiresReload: true,
        onChange: value => (value ? OD6S.resistanceMultiplier = value : 1)
    })
    // place Customizable Strength Bonus title here
    game.settings.register("od6s", "customize_strDamSkill", {
        name: game.i18n.localize('OD6S.CONFIG_STRDAMSKILL'),
        hint: game.i18n.localize('OD6S.CONFIG_STRDAMSKILL_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: String,
        default: "Lift",
        requiresReload: true,
        onChange: value => (value ? OD6S.strDamSkill = value : game.i18n.localize('OD6S.CHAR_STRDAMSKILL'))
    })

    game.settings.register("od6s", "od6_bonus", {
        name: game.i18n.localize('OD6S.CONFIG_OD6BONUS'),
        hint: game.i18n.localize('OD6S.CONFIG_OD6BONUS_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: false,
        type: Boolean,
        onChange: value => (OD6S.od6Bonus = value)
    })

    game.settings.register("od6s", "character_strDamMultiplier", {
        name: game.i18n.localize("OD6S.CONFIG_STRDAMMULTIPLIER"),
        hint: game.i18n.localize("OD6S.CONFIG_STRDAMMULTIPLIER_DESCRIPTION"),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        type: Number,
        default: 0.5,
        requiresReload: true,
        onChange: value => (value ? OD6S.strDamMultiplier = value : 0.5)
    })

    game.settings.register("od6s", "strDam_round", {
        name: game.i18n.localize('OD6S.CONFIG_STRDAMROUND'),
        hint: game.i18n.localize('OD6S.CONFIG_STRDAMROUND_DESCRIPTION'),
        scope: "world",
        config: false,
        od6sMiscRules: true,
        default: false,
        type: Boolean,
        onChange: value => (OD6S.strDamRound = value)
    })

    updateConfig();
}

export function updateConfig() {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createOD6SMacro(data, slot));

    // Misc Rules Options
    OD6S.meleeRange = game.settings.get('od6s','melee_range');
    OD6S.highHitDamageRound = game.settings.get('od6s', 'highhit_round');
    OD6S.highHitDamagePipsOrDice = game.settings.get('od6s', 'highhit_pipsordice');
    OD6S.highHitDamageMultiplier = game.settings.get('od6s', 'character_highhitmultiplier');
    OD6S.advanceCostAttribute = game.settings.get('od6s', 'character_advanceCostAttribute');
    OD6S.advanceCostSkill = game.settings.get('od6s', 'character_advanceCostSkill');
    OD6S.advanceCostMetaphysicsSkill = game.settings.get('od6s', 'character_metaphysics_advanceCostSkill');
    OD6S.advanceCostSpecialization = game.settings.get('od6s', 'character_advanceCostSpecialization');
    OD6S.resistanceOption = game.settings.get('od6s','customize_resistanceOption');
    OD6S.resistanceSkill = game.settings.get('od6s', 'customize_resistanceSkill');
    OD6S.resistanceRound = game.settings.get('od6s', 'resistance_round');
    OD6S.resistanceMultiplier = game.settings.get('od6s', 'character_resistanceMultiplier');
    OD6S.strDamRound = game.settings.get('od6s', 'strDam_round');
    OD6S.strDamMultiplier = game.settings.get('od6s', 'character_strDamMultiplier');
    OD6S.strDamSkill = game.settings.get('od6s', 'customize_strDamSkill');
    OD6S.od6Bonus = game.settings.get('od6s', 'od6_bonus');

    // end Misc Rules Options.


    // Set customizations
    OD6S.speciesLabelName = game.settings.get('od6s','customize_species_label') ?
        game.settings.get('od6s', 'customize_species_label') : game.i18n.localize('OD6S.CHAR_SPECIES');
    OD6S.typeLabel = game.settings.get('od6s','customize_type_label') ?
        game.settings.get('od6s', 'customize_type_label') : game.i18n.localize('OD6S.CHAR_TYPE');
    OD6S.fatePointsName = game.settings.get('od6s', 'customize_fate_points') ?
        game.settings.get('od6s', 'customize_fate_points') : game.i18n.localize('OD6S.CHAR_FATE_POINTS');
    OD6S.fatePointsShortName = game.settings.get('od6s', 'customize_fate_points_short') ?
        game.settings.get('od6s', 'customize_fate_points_short') : game.i18n.localize('OD6S.CHAR_FATE_POINTS_SHORT');

    OD6S.manifestationsName = game.settings.get('od6s', 'customize_manifestations') ?
        game.settings.get('od6s', 'customize_manifestations') : game.i18n.localize('OD6S.CHAR_MANIFESTATIONS');

    OD6S.manifestationName = game.settings.get('od6s', 'customize_manifestation') ?
        game.settings.get('od6s', 'customize_manifestation') : game.i18n.localize('OD6S.CHAR_MANIFESTATION');

    OD6S.metaphysicsExtranormalName = game.settings.get('od6s', 'customize_metaphysics_extranormal') ?
        game.settings.get('od6s', 'customize_metaphysics_extranormal') : game.i18n.localize('OD6S.CHAR_METAPHYSICS_EXTRANORMAL');

    OD6S.vehicleToughnessName = game.settings.get('od6s', 'customize_vehicle_toughness') ?
        game.settings.get('od6s', 'customize_vehicle_toughness') : game.i18n.localize('OD6S.TOUGHNESS');

    OD6S.starshipToughnessName = game.settings.get('od6s', 'customize_starship_toughness') ?
        game.settings.get('od6s', 'customize_starship_toughness') : game.i18n.localize('OD6S.TOUGHNESS');

    OD6S.useAFatePointName = game.settings.get('od6s', 'customize_use_a_fate_point') ?
        game.settings.get('od6s', 'customize_use_a_fate_point') : game.i18n.localize('OD6S.USE_FATE_POINT');

    OD6S.attributes.agi.name = game.settings.get('od6s', 'customize_agility_name') ?
        game.settings.get('od6s', 'customize_agility_name') : game.i18n.localize('OD6S.CHAR_AGILITY');
    OD6S.attributes.agi.shortName = game.settings.get('od6s', 'customize_agility_name_short') ?
        game.settings.get('od6s', 'customize_agility_name_short') : game.i18n.localize('OD6S.CHAR_AGILITY_SHORT');

    OD6S.attributes.str.name = game.settings.get('od6s', 'customize_strength_name') ?
        game.settings.get('od6s', 'customize_strength_name') : game.i18n.localize('OD6S.CHAR_STRENGTH');
    OD6S.attributes.str.shortName = game.settings.get('od6s', 'customize_strength_name_short') ?
        game.settings.get('od6s', 'customize_strength_name_short') : game.i18n.localize('OD6S.CHAR_STRENGTH_SHORT');

    OD6S.attributes.mec.name = game.settings.get('od6s', 'customize_mechanical_name') ?
        game.settings.get('od6s', 'customize_mechanical_name') : game.i18n.localize('OD6S.CHAR_MECHANICAL');
    OD6S.attributes.mec.shortName = game.settings.get('od6s', 'customize_mechanical_name_short') ?
        game.settings.get('od6s', 'customize_mechanical_name_short') : game.i18n.localize('OD6S.CHAR_MECHANICAL_SHORT');

    OD6S.attributes.kno.name = game.settings.get('od6s', 'customize_knowledge_name') ?
        game.settings.get('od6s', 'customize_knowledge_name') : game.i18n.localize('OD6S.CHAR_KNOWLEDGE');
    OD6S.attributes.kno.shortName = game.settings.get('od6s', 'customize_knowledge_name_short') ?
        game.settings.get('od6s', 'customize_knowledge_name_short') : game.i18n.localize('OD6S.CHAR_KNOWLEDGE_SHORT');

    OD6S.attributes.per.name = game.settings.get('od6s', 'customize_perception_name') ?
        game.settings.get('od6s', 'customize_perception_name') : game.i18n.localize('OD6S.CHAR_PERCEPTION');
    OD6S.attributes.per.shortName = game.settings.get('od6s', 'customize_perception_name_short') ?
        game.settings.get('od6s', 'customize_perception_name_short') : game.i18n.localize('OD6S.CHAR_PERCEPTION_SHORT');

    OD6S.attributes.tec.name = game.settings.get('od6s', 'customize_technical_name') ?
        game.settings.get('od6s', 'customize_technical_name') : game.i18n.localize('OD6S.CHAR_TECHNICAL');
    OD6S.attributes.tec.shortName = game.settings.get('od6s', 'customize_technical_name_short') ?
        game.settings.get('od6s', 'customize_technical_name_short') : game.i18n.localize('OD6S.CHAR_TECHNICAL_SHORT');

    OD6S.attributes.ca1.name = game.settings.get('od6s', 'customize_ca1_name') ?
        game.settings.get('od6s', 'customize_ca1_name') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_01');
    OD6S.attributes.ca1.shortName = game.settings.get('od6s', 'customize_ca1_name_short') ?
        game.settings.get('od6s', 'customize_ca1_name_short') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_01_SHORT');

    OD6S.attributes.ca2.name = game.settings.get('od6s', 'customize_ca2_name') ?
        game.settings.get('od6s', 'customize_ca2_name') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_02');
    OD6S.attributes.ca2.shortName = game.settings.get('od6s', 'customize_ca2_name_short') ?
        game.settings.get('od6s', 'customize_ca2_name_short') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_02_SHORT');

    OD6S.attributes.ca3.name = game.settings.get('od6s', 'customize_ca3_name') ?
        game.settings.get('od6s', 'customize_ca3_name') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_03');
    OD6S.attributes.ca3.shortName = game.settings.get('od6s', 'customize_ca3_name_short') ?
        game.settings.get('od6s', 'customize_ca3_name_short') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_03_SHORT');

    OD6S.attributes.ca4.name = game.settings.get('od6s', 'customize_ca4_name') ?
        game.settings.get('od6s', 'customize_ca4_name') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_04');
    OD6S.attributes.ca4.shortName = game.settings.get('od6s', 'customize_ca4_name_short') ?
        game.settings.get('od6s', 'customize_ca4_name_short') : game.i18n.localize('OD6S.CHAR_CUSTOM_ATTRIBUTE_04_SHORT');

    OD6S.attributes.met.name = game.settings.get('od6s', 'customize_metaphysics_name') ?
        game.settings.get('od6s', 'customize_metaphysics_name') : game.i18n.localize('OD6S.CHAR_METAPHYSICS');
    OD6S.attributes.met.shortName = game.settings.get('od6s', 'customize_metaphysics_name_short') ?
        game.settings.get('od6s', 'customize_metaphysics_name_short') : game.i18n.localize('OD6S.CHAR_METAPHYSICS_SHORT');

    // Orneriness: creature-only attribute, fixed name (not customizable)
    OD6S.attributes.orn.name = game.i18n.localize('OD6S.CHAR_ORNERINESS');
    OD6S.attributes.orn.shortName = game.i18n.localize('OD6S.CHAR_ORNERINESS_SHORT');

    OD6S.interstellarDriveName = game.settings.get('od6s', 'interstellar_drive_name') ?
        game.settings.get('od6s', 'interstellar_drive_name') : game.i18n.localize('OD6S.INTERSTELLAR_DRIVE');

    OD6S.bodyPointsName = game.settings.get('od6s', 'customize_body_points_name') ?
        game.settings.get('od6s', 'customize_body_points_name') : game.i18n.localize('OD6S.BODY_POINTS');

    OD6S.wildDieOneDefault = game.settings.get('od6s', 'default_wild_one');
    OD6S.wildDieOneAuto = game.settings.get('od6s', 'default_wild_die_one_handle');

    OD6S.vehicleDifficulty = game.settings.get('od6s', 'vehicle_difficulty');

    OD6S.stunDice = game.settings.get('od6s', 'stun_dice');

    OD6S.passengerDamageDice = game.settings.get('od6s', 'passenger_damage_dice');

    OD6S.grenadeDamageDice = game.settings.get('od6s', 'dice_for_grenades');

    OD6S.highlightEffects = game.settings.get('od6s', 'highlight_effects');

    OD6S.randomHitLocations = game.settings.get('od6s', 'random_hit_locations');

    OD6S.mapRange = game.settings.get('od6s', 'map_range_to_difficulty');
    OD6S.meleeDifficulty = game.settings.get('od6s', 'melee_difficulty');
    OD6S.randomDifficulty = game.settings.get('od6s', 'random_difficulty');

    OD6S.baseRangedAttackDifficulty = game.settings.get('od6s','default_ranged_attack_difficulty');
    OD6S.baseMeleeAttackDifficulty = game.settings.get('od6s','default_melee_attack_difficulty');
    OD6S.baseBrawlAttackDifficulty = game.settings.get('od6s','default_brawl_attack_difficulty');
    OD6S.baseBrawlAttackDifficultyLevel = game.settings.get('od6s','default_brawl_attack_difficulty_level');

    OD6S.trackStuns = game.settings.get('od6s', 'track_stuns');

    OD6S.currencyName = game.settings.get('od6s', 'customize_currency_label') ?
        game.settings.get('od6s', 'customize_currency_label') : game.i18n.localize('OD6S.CHAR_CREDITS');

    if (game.settings.get('od6s', 'default_difficulty_very_easy'))
        OD6S.difficulty["OD6S.DIFFICULTY_VERY_EASY"].max = game.settings.get('od6s', 'default_difficulty_very_easy')

    if (game.settings.get('od6s', 'default_difficulty_easy'))
        OD6S.difficulty["OD6S.DIFFICULTY_EASY"].max = game.settings.get('od6s', 'default_difficulty_easy');

    if (game.settings.get('od6s', 'default_difficulty_moderate'))
        OD6S.difficulty["OD6S.DIFFICULTY_MODERATE"].max = game.settings.get('od6s', 'default_difficulty_moderate');

    if (game.settings.get('od6s', 'default_difficulty_difficult'))
        OD6S.difficulty["OD6S.DIFFICULTY_DIFFICULT"].max = game.settings.get('od6s', 'default_difficulty_difficult');

    if (game.settings.get('od6s', 'default_difficulty_very_difficult'))
        OD6S.difficulty["OD6S.DIFFICULTY_VERY_DIFFICULT"].max = game.settings.get('od6s', 'default_difficulty_very_difficult');

    if (game.settings.get('od6s', 'default_difficulty_heroic'))
        OD6S.difficulty["OD6S.DIFFICULTY_HEROIC"].max = game.settings.get('od6s', 'default_difficulty_heroic');

    if (game.settings.get('od6s', 'default_difficulty_legendary'))
        OD6S.difficulty["OD6S.DIFFICULTY_LEGENDARY"].max = game.settings.get('od6s', 'default_difficulty_legendary');

    if (game.settings.get('od6s', 'parry_skills')) {
        OD6S.actions.parry.skill = "OD6S.MELEE_PARRY";
        OD6S.actions.block.skill = "OD6S.BRAWLING_PARRY";
        OD6S.actions.block.name = "OD6S.BRAWLING_PARRY";
    } else {
        OD6S.actions.parry.skill = "OD6S.MELEE_COMBAT";
        OD6S.actions.block.skill = "OD6S.BRAWL";
        OD6S.actions.block.name = "OD6S.ACTION_BRAWL_BLOCK"
    }

    OD6S.difficulty['OD6S.DIFFICULTY_VERY_EASY'].dice = game.settings.get('od6s','random_dice_difficulty_very_easy');
    OD6S.difficulty['OD6S.DIFFICULTY_EASY'].dice = game.settings.get('od6s','random_dice_difficulty_easy');
    OD6S.difficulty['OD6S.DIFFICULTY_MODERATE'].dice = game.settings.get('od6s','random_dice_difficulty_moderate');
    OD6S.difficulty['OD6S.DIFFICULTY_DIFFICULT'].dice = game.settings.get('od6s','random_dice_difficulty_difficult');
    OD6S.difficulty['OD6S.DIFFICULTY_VERY_DIFFICULT'].dice = game.settings.get('od6s','random_dice_difficulty_very_difficult');
    OD6S.difficulty['OD6S.DIFFICULTY_HEROIC'].dice = game.settings.get('od6s','random_dice_difficulty_heroic');
    OD6S.difficulty['OD6S.DIFFICULTY_LEGENDARY'].dice = game.settings.get('od6s','random_dice_difficulty_legendary');

    OD6S.fatePointRound = game.settings.get('od6s', 'fate_point_round');
    OD6S.fatePointClimactic = game.settings.get('od6s', 'fate_point_climactic');

    OD6S.woundConfig = game.settings.get('od6s', 'bodypoints');

    OD6S.highHitDamage = game.settings.get('od6s', 'highhitdamage');

    OD6S.autoOpposed = game.settings.get('od6s', 'auto_opposed');

    OD6S.autoPromptPlayerResistance = game.settings.get('od6s','auto_prompt_player_resistance');

    OD6S.autoSkillUsed = game.settings.get('od6s', 'auto_skill_used');

    OD6S.autoExplosive = game.settings.get('od6s','auto_explosive');

    OD6S.hideExplosiveTemplates = game.settings.get('od6s', 'hide_explosive_templates');

    OD6S.cost = game.settings.get('od6s', 'cost');
    OD6S.fundsFate = game.settings.get('od6s', 'funds_fate');

    OD6S.opposed = [];

    OD6S.pipsPerDice = game.settings.get('od6s', 'pip_per_dice');

    OD6S.deadlinessLevel['character'] = game.settings.get('od6s', 'deadliness');
    OD6S.deadlinessLevel['npc'] = game.settings.get('od6s', 'npc-deadliness');
    OD6S.deadlinessLevel['creature'] = game.settings.get('od6s', 'creature-deadliness');

    OD6S.stunScaling = game.settings.get('od6s', 'scale-stun');
    //OD6S.woundScaling = game.settings.get('od6s', 'scale-wounds');

    OD6S.flatSkills = game.settings.get('od6s', 'flat_skills');

    OD6S.specLink = game.settings.get('od6s', 'spec_link');

    OD6S.skillUsed = game.settings.get('od6s', 'skill_used');

    OD6S.showSkillSpecialization = game.settings.get('od6s', 'show_skill_specialization');

    OD6S.specializationDice = game.settings.get('od6s', 'specialization_dice');

    OD6S.initialAttributes = game.settings.get('od6s','initial_attributes');
    OD6S.initialSkills = game.settings.get('od6s', 'initial_skills');
    OD6S.initialCharacterPoints = game.settings.get('od6s', 'initial_character_points');
    OD6S.initialFatePoints = game.settings.get('od6s', 'initial_fate_points');
    OD6S.initialMove = game.settings.get('od6s','initial_move');

    if (game.settings.get('od6s', 'customize_metaphysics_skill_channel'))
        OD6S.channelSkillName = game.settings.get('od6s', 'customize_metaphysics_skill_channel');
    if (game.settings.get('od6s', 'customize_metaphysics_skill_sense'))
        OD6S.senseSkillName = game.settings.get('od6s', 'customize_metaphysics_skill_sense');
    if (game.settings.get('od6s', 'customize_metaphysics_skill_transform'))
        OD6S.transformSkillName = game.settings.get('od6s', 'customize_metaphysics_skill_transform');

    OD6S.initiative.reroll = game.settings.get('od6s', 'reroll_initiative');
    if(game.settings.get('od6s', 'reroll_initiative')) {
        OD6S.initiative.reroll_character = game.settings.get('od6s', 'auto_reroll_character');
        OD6S.initiative.reroll_npc = game.settings.get('od6s', 'auto_reroll_npc');
    } else {
        OD6S.initiative.reroll_character = false;
        OD6S.initiative.reroll_npc = false;
    }

    OD6S.initiative.attribute = game.settings.get('od6s', 'initiative_attribute');

    OD6S.stunDamageIncrement = game.settings.get('od6s','stun_damage_increment')

    const attrSort = game.settings.get('od6s','attributes_sorting');
    for (const attribute in OD6S.attributes) {
        // orn is creature-only and not configurable via the active-attributes settings page
        if (OD6S.attributes[attribute].creatureOnly) continue;
        const key = "customize_" + attribute + "_active";
        OD6S.attributes[attribute].active = game.settings.get('od6s', key);
        if(typeof(attrSort[attribute]) !== "undefined") {
            OD6S.attributes[attribute].sort = attrSort[attribute].sort;
        }
    }
}

