export class OD6SCompendiumDirectory extends CompendiumDirectory {

    async getData(options) {
        let context = await super.getData(options);

        if (foundry.utils.isNewerVersion(game.version,'11')) {
            // For each document, assign a default image if one is not already present, and calculate the style string
            const packageTypeIcons = {
                "world": World.icon,
                "system": System.icon,
                "module": Module.icon
            };
            const packContext = {};
            for ( const pack of this.collection ) {
                if (game.settings.get('od6s', 'hide_compendia')
                    && pack.metadata.packageName === 'od6s'
                    && pack.documentName !== 'Macro') continue;

                if (game.settings.get('od6s', 'hide_advantages_disadvantages')
                    && (pack.metadata.name === 'advantages'
                    || pack.metadata.name === 'disadvantages')) continue;

                packContext[pack.collection] = {
                    locked: pack.locked,
                    customOwnership: "ownership" in pack.config,
                    collection: pack.collection,
                    name: pack.metadata.packageName,
                    label: pack.metadata.label,
                    icon: CONFIG[pack.metadata.type].sidebarIcon,
                    hidden: this.activeFilters?.length ? !this.activeFilters.includes(pack.metadata.type) : false,
                    banner: pack.banner,
                    sourceIcon: packageTypeIcons[pack.metadata.packageType]
                };
            }

            // Return data to the sidebar
            context = foundry.utils.mergeObject(context, {
                folderIcon: CONFIG.Folder.sidebarIcon,
                label: game.i18n.localize("PACKAGE.TagCompendium"),
                labelPlural: game.i18n.localize("SIDEBAR.TabCompendium"),
                sidebarIcon: "fas fa-atlas",
                filtersActive: !!this.activeFilters.length
            });
            context.packContext = packContext;
            return context;
        } else {
            // Filter packs for visibility
            let basePacks = game.packs.filter(p => game.user.isGM || !p.private);
            let packs;
            // If hidden compendia is turned on, filter out 'od6s' item compendia
            if (game.settings.get('od6s', 'hide_compendia')) {
                //packs = basePacks.filter(p => p.metadata.system !== 'od6s');
                packs = basePacks.filter(function (obj) {
                    return !(obj.metadata.packageName === 'od6s' && obj.documentName !== 'Macro');
                })
            } else {
                // Hide advantages/disadvantages if set
                if (game.settings.get('od6s', 'hide_advantages_disadvantages')) {
                    basePacks = basePacks.filter(p => p.metadata.name !== 'advantages');
                    basePacks = basePacks.filter(p => p.metadata.name !== 'disadvantages');
                }
                packs = basePacks
            }

            // Sort packs by Entity type
            const packData = packs.sort((a, b) => a.documentName.localeCompare(b.documentName)).reduce((obj, pack) => {
                const documentName = pack.documentName;
                if (!obj.hasOwnProperty(documentName)) obj[documentName] = {
                    label: documentName,
                    packs: []
                };
                obj[documentName].packs.push(pack);
                return obj;
            }, {});

            // Sort packs within type
            for (let p of Object.values(packData)) {
                p.packs = p.packs.sort((a, b) => a.title.localeCompare(b.title));
            }

            context.packs = packData;
            return foundry.utils.mergeObject(context, {packs: packData});
        }
    }

}