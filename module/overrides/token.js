import OD6S from "../config/config-od6s.js";

export class OD6SToken extends Token {

    /* Override */
    _canDrag(user, event) {
        if (!this.controlled) return false;
        // v13: interactionData structure may differ; guard gracefully
        try {
            if (!user.isGM && event?.interactionData?.object?.actor?.type === 'container') return false;
        } catch (e) { /* ignore */ }
        const tool = game.activeTool;
        if ((tool !== "select") || game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL)) return false;
        const blockMove = game.paused && !game.user.isGM;
        return !this._movement && !blockMove;
    }

    /**
     * v13: drawEffects was removed. We now filter hidden effects via _getStatusEffects override.
     * This getter filters out status effects that non-owners should not see (OD6S.hiddenStatusEffects).
     */
    get _statusEffects() {
        const baseEffects = super._statusEffects ?? [];
        if (this.isOwner) return baseEffects;
        return baseEffects.filter(status => {
            return !OD6S.hiddenStatusEffects?.includes(status.id ?? status);
        });
    }

    /**
     * v13 fallback: if drawEffects still exists on the parent (legacy), keep the v12-style override.
     * In v13 this method was removed from Token; the guard prevents errors.
     */
    async drawEffects() {
        if (typeof super.drawEffects !== 'function') return; // No longer exists in v13
        const wasVisible = this.effects.visible;
        this.effects.visible = false;
        this.effects.removeChildren().forEach(c => c.destroy());
        this.effects.bg = this.effects.addChild(new PIXI.Graphics());
        this.effects.bg.visible = false;
        this.effects.overlay = null;

        const tokenEffects = this.document.effects;
        const actorEffects = this.actor?.temporaryEffects || [];
        let overlay = { src: this.document.overlayEffect, tint: null };

        if ( tokenEffects.length || actorEffects.length ) {
            const promises = [];
            for ( let f of actorEffects ) {
                const status = [...(f.statuses ?? [])][0];
                if ( !f.icon ) continue;
                if (!this.isOwner && OD6S.hiddenStatusEffects?.includes(status)) continue;
                const tint = Color.from(f.tint ?? null);
                if ( f.getFlag("core", "overlay") ) {
                    if ( overlay ) promises.push(this._drawEffect(overlay.src, overlay.tint));
                    overlay = {src: f.icon, tint};
                    continue;
                }
                promises.push(this._drawEffect(f.icon, tint));
            }
            for ( let f of tokenEffects ) {
                const status = [...(f.statuses ?? [])][0];
                if (!this.isOwner && OD6S.hiddenStatusEffects?.includes(status)) continue;
                promises.push(this._drawEffect(f, null));
            }
            await Promise.all(promises);
        }

        this.effects.overlay = await this._drawOverlay(overlay.src, overlay.tint);
        this.effects.bg.visible = true;
        this.effects.visible = wasVisible;
        this._refreshEffects();
    }
}
