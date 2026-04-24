/*jslint plusplus: true, sloppy: true, indent: 4 */
// App: top-level bootstrap. Owns the WidgetRegistry, WidgetFactory, and
// DataManager; wires the CreateJS ticker that fires the frameUpdate event;
// and kicks off the initial build/polling sequence.
//
// Replaces the legacy initAll() + inline updateClientraw*/setInterval calls +
// initializeTicker() at the bottom of WidgetsHandlers.js.

(function (global) {
    function App(config) {
        config = config || {};
        this.manifest = (config.manifest || []).slice();
        this.registry = new WidgetRegistry();
        this.factory = new WidgetFactory(this.registry);
        this.factory.setManifest(this.manifest);

        this.runDataManager = config.runDataManager !== false;
        this.runTicker = config.runTicker !== false;
        this.dataManager = this.runDataManager ? new DataManager({
            intervalMs: config.intervalMs || 5000
        }) : null;

        this.layoutMount = (typeof LayoutMount !== "undefined") ? new LayoutMount() : null;

        this.tickerEvent = null;
        this.tickHandler = null;
    }

    // Legacy initializeTicker / tickHandler.
    App.prototype.initializeTicker = function () {
        this.tickerEvent = new CustomEvent("frameUpdate");
        var self = this;
        this.tickHandler = function () { window.dispatchEvent(self.tickerEvent); };
        createjs.Ticker.setFPS(60);
        createjs.Ticker.addEventListener("tick", this.tickHandler);
    };

    App.prototype.start = function () {
        if (typeof global.initialiseLayout === "function") {
            global.initialiseLayout();
        }
        if (this.layoutMount) {
            this.layoutMount.mount(this.manifest);
        }
        this.factory.buildAll();
        if (this.layoutMount) {
            this.layoutMount.observe(this.registry);
        }
        if (this.runTicker) { this.initializeTicker(); }
        if (this.runDataManager) {
            global.loaded = true;
            this.dataManager.start();
        }
    };

    App.prototype.stop = function () {
        if (this.tickHandler) {
            createjs.Ticker.removeEventListener("tick", this.tickHandler);
            this.tickHandler = null;
        }
        if (this.dataManager) { this.dataManager.stop(); }
    };

    App.prototype.destroy = function () {
        this.stop();
        if (this.registry) { this.registry.destroyAll(); }
    };

    global.App = App;
})(typeof window !== "undefined" ? window : this);
