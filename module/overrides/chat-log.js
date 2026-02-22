/**
 * OD6S ChatLog override.
 *
 * v12: ChatLog extended Application v1; notify() was a straightforward override.
 * v13: ChatLog was migrated to ApplicationV2. The notify() method signature and
 *      internal properties (_lastMessageTime) may differ. This override uses
 *      optional chaining to stay compatible with both v12 and v13.
 *
 * If ChatLog is ApplicationV2 in v13, extending it here still works because ES6
 * class inheritance works regardless of the base class framework.
 */
export class OD6SChatLog extends ChatLog {
    notify(message) {
        if (typeof super.notify === 'function') super.notify(message);
        else {
            // v13 ApplicationV2 path: replicate the notification behavior manually
            if (this._lastMessageTime !== undefined) this._lastMessageTime = Date.now();
            if (!this.rendered) return;

            if (message.isContentVisible) {
                const icon = $('#chat-notification');
                if (icon.is(":hidden")) icon.fadeIn(100);
                const captured = this._lastMessageTime ?? Date.now();
                setTimeout(() => {
                    if ((Date.now() - captured > 3000) && icon.is(":visible")) icon.fadeOut(100);
                }, 3001);
            }

            if (message.sound) foundry.audio.AudioHelper.play({src: message.sound});
        }
    }
}
