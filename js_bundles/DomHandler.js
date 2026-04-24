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

    DomHandler.prototype.attachResizeHandlers = function () {
        var self = this,
            handler = function () { self.resize(); };
        if (typeof onMobile !== "undefined" && onMobile === false) {
            window.addEventListener("resize", handler, false);
            this._listeners.push({ event: "resize", handler: handler });
        } else {
            // See CanvasWidget.attachResizeHandlers: addListener is kept for
            // IE9+ compatibility; destroy() removes it via target.removeListener.
            var mql = window.matchMedia("(orientation: portrait)");
            mql.addListener(handler);
            this._listeners.push({ event: "orientation", handler: handler, target: mql });
        }
    };

    DomHandler.prototype.initialize = function () {
        this.resolveElement();

        var events = this.config.events || [];
        for (var i = 0; i < events.length; i++) {
            this.listenForData(events[i]);
        }
        var unitEvents = this.config.unitEvents || [];
        for (var j = 0; j < unitEvents.length; j++) {
            this.listenForUnitChange(unitEvents[j]);
        }

        this.setUp();
        this.attachResizeHandlers();
        this.resize();
        this.markLoaded();
    };

    global.DomHandler = DomHandler;
})(typeof window !== "undefined" ? window : this);
