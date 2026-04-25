/*jslint plusplus: true, sloppy: true, indent: 4 */
// DomHandler: extends WidgetBase for div-based UI (forecast, records, modal,
// buttons, ticker). Does not own a canvas, stage, or frameUpdate listener.

(function (global) {
    function DomHandler(config) {
        WidgetBase.call(this, config);
        this.element = null;
    }
    WidgetBase.inherit(DomHandler, WidgetBase);

    DomHandler.prototype.resolveElement = function () {
        if (this.elementId) {
            this.element = document.getElementById(this.elementId);
        }
        return this.element;
    };

    DomHandler.prototype.show = function () {
        if (this.element) { this.element.style.display = "block"; }
    };

    DomHandler.prototype.hide = function () {
        if (this.element) { this.element.style.display = "none"; }
    };

    DomHandler.prototype.enable = function () { this.enabled = true; };
    DomHandler.prototype.disable = function () { this.enabled = false; };

    DomHandler.prototype.initialize = function () {
        this.resolveElement();
        this._wireConfigListeners();
        this.setUp();
        this.attachResizeHandlers();
        this.resize();
        this.markLoaded();
    };

    global.DomHandler = DomHandler;
})(typeof window !== "undefined" ? window : this);
