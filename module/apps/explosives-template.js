import {od6sutilities} from "../system/utilities.js";
import OD6S from "../config/config-od6s.js";

export default class ExplosivesTemplate extends MeasuredTemplate {

    /**
     * Track the timestamp when the last mouse move event was captured.
     * @type {number}
     */
    #moveTime = 0;

    /* -------------------------------------------- */

    /**
     * The initially active CanvasLayer to re-activate after the workflow is complete.
     * @type {CanvasLayer}
     */
    #initialLayer;

    /* -------------------------------------------- */

    /**
     * Track the bound event handlers so they can be properly canceled later.
     * @type {object}
     */
    #events;

    // Cribbed heavily from DND5E ability-template
    async setExplosiveData(data, x, y) {
        this.exData = data;
        this.actorSheet = this.exData.actor.sheet;
        this.originX = x;
        this.originY = y;
        this.origin = {x: x, y: y};
        this.rangeLine = new PIXI.Graphics();
        this.rangeMeasure = new PIXI.Text({  text: "0 M"});
    }

    /**
     * Creates a preview of the template.
     * @returns {Promise}  A promise that resolves with the final measured template if created.
     */
    async drawPreview() {
        const initialLayer = canvas.activeLayer;

        // Draw the template and switch to the template layer
        await this.draw();
        this.layer.activate();
        this.layer.preview.addChild(this);
        this.layer.preview.addChild(this.rangeLine);
        this.layer.preview.addChild(this.rangeMeasure);

        // Hide the sheet that originated the preview
        this.actorSheet?.minimize();

        // Activate interactivity
        return this.activatePreviewListeners(initialLayer);
    }

    /**
     * Activate listeners for the template preview
     * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
     * @returns {Promise}                 A promise that resolves with the final measured template if created.
     */
    activatePreviewListeners(initialLayer) {
        return new Promise((resolve, reject) => {
            this.#initialLayer = initialLayer;
            this.#events = {
                cancel: this._onCancelPlacement.bind(this),
                confirm: this._onConfirmPlacement.bind(this),
                move: this._onMovePlacement.bind(this),
                resolve,
                reject,
                rotate: this._onRotatePlacement.bind(this)
            };

            // Activate listeners
            canvas.stage.on("mousemove", this.#events.move);
            canvas.stage.on("mousedown", this.#events.confirm);
            canvas.app.view.oncontextmenu = this.#events.cancel;
            canvas.app.view.onwheel = this.#events.rotate;
        });
    }

    /**
     * Shared code for when template placement ends by being confirmed or canceled.
     * @param {Event} event  Triggering event that ended the placement.
     */
    async _finishPlacement(event) {
        this.layer.preview.removeChild(this.rangeLine);
        this.layer.preview.removeChild(this.rangeMeasure);
        this.layer._onDragLeftCancel(event);
        canvas.stage.off("mousemove", this.#events.move);
        canvas.stage.off("mousedown", this.#events.confirm);
        canvas.app.view.oncontextmenu = null;
        canvas.app.view.onwheel = null;
        this.#initialLayer.activate();
        await this.actorSheet?.maximize();
    }

    /* -------------------------------------------- */

    /**
     * Move the template preview when the mouse moves.
     * @param {Event} event  Triggering mouse event.
     */
    _onMovePlacement(event) {
        event.stopPropagation();
        const now = Date.now(); // Apply a 20ms throttle
        const origin = {x: this.originX, y: this.originY};
        if ( now - this.#moveTime <= 20 ) return;
        const center = event.data.getLocalPosition(this.layer);
        const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2;
        const snapped = canvas.grid.getSnappedPosition(center.x, center.y, interval);
        this.document.updateSource({x: snapped.x, y: snapped.y});
        this.refresh();
        this.#moveTime = now;
        const distance = Math.floor(canvas.grid.measureDistance({x: this.originX, y: this.originY}, this.center));

        this.rangeLine.clear();
        //this.rangeLine.position.set(this.origin.x,this.origin.y);
        this.rangeLine.lineStyle(4, 0xffd900, 1);
        this.rangeLine.moveTo(this.origin.x, this.origin.y);
        this.rangeLine.lineTo(center.x, center.y);

        this.rangeMeasure.x = this.center.x - 30;
        this.rangeMeasure.y = this.center.y + 60;
        this.rangeMeasure.style.fill = 0xFFFFFF;
        this.rangeMeasure.text = distance + " M";

        const collisionCheck =
            CONFIG.Canvas.polygonBackends.move.testCollision(
                origin, this.center,
                {type: "move", mode: "any"})  || 
	        CONFIG.Canvas.polygonBackends.sight.testCollision(
                origin, this.center,
                {type: "sight", mode: "any"});
        this._preview = !!collisionCheck;
    }

    /* -------------------------------------------- */

    /**
     * Rotate the template preview by 3˚ increments when the mouse wheel is rotated.
     * @param {Event} event  Triggering mouse event.
     */
    _onRotatePlacement(event) {
        if ( event.ctrlKey ) event.preventDefault(); // Avoid zooming the browser window
        event.stopPropagation();
        const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
        const snap = event.shiftKey ? delta : 5;
        const update = {direction: this.document.direction + (snap * Math.sign(event.deltaY))};
        this.document.updateSource(update);
        this.refresh();
    }

    /* -------------------------------------------- */

    /**
     * Confirm placement when the left mouse button is clicked.
     * @param {Event} event  Triggering mouse event.
     */
    async _onConfirmPlacement(event) {
        if(CONFIG.Canvas.polygonBackends.move.testCollision(
            {x: this.originX, y: this.originY}, this.center, {type: "move", mode: "any"}) ||
	   CONFIG.Canvas.polygonBackends.sight.testCollision(
                {x: this.originX, y: this.originY}, this.center,
                {type: "sight", mode: "any"})) return;
        await this._finishPlacement(event);
        const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2;
        const destination = canvas.grid.getSnappedPosition(this.document.x, this.document.y, interval);
        this.document.updateSource(destination);
        this.#events.resolve(canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject()]));
    }

    /* -------------------------------------------- */

    /**
     * Cancel placement when the right mouse button is clicked.
     * @param {Event} event  Triggering mouse event.
     */
    async _onCancelPlacement(event) {
        await this._finishPlacement(event);
        this.#events.reject();
    }

}