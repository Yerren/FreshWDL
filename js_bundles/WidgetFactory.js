/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetFactory: maps config entries to concrete widget constructors, decides
// which widgets are enabled (via widgetList/graphList), builds them, runs
// initialize(), and registers them with the WidgetRegistry.
//
// Each entry in the manifest binds a widget id to:
//   - Ctor: the constructor function (e.g. ApparentWidget)
//   - config: the per-instance config object (merged with defaults)
//   - enabledKey: the key inside widgetList / graphList that gates creation
//   - enabledIn: "widgetList" (default) or "graphList"
//   - canvasID: canvas element id for enabled-false fallback (hides the canvas)

(function (global) {
    function WidgetFactory(registry) {
        this.registry = registry || null;
        this.manifest = [];
    }

    WidgetFactory.prototype.setRegistry = function (registry) {
        this.registry = registry;
    };

    WidgetFactory.prototype.addEntry = function (entry) {
        this.manifest.push(entry);
    };

    WidgetFactory.prototype.setManifest = function (entries) {
        this.manifest = entries.slice();
    };

    WidgetFactory.prototype.isEnabled = function (entry) {
        if (!entry.enabledKey) { return true; }
        var source = entry.enabledIn === "graphList" ?
            (typeof graphList !== "undefined" ? graphList : null) :
            (typeof widgetList !== "undefined" ? widgetList : null);
        if (!source) { return false; }
        var node = source[entry.enabledKey];
        if (!node) { return false; }
        return node.enabled === true;
    };

    // Hide the canvas element for disabled widgets (legacy behaviour from
    // initAll: canvas.style.display = "none" when not enabled).
    WidgetFactory.prototype.hideDisabled = function (entry) {
        var canvasID = entry.canvasID || (entry.config && entry.config.canvasID);
        if (!canvasID) { return; }
        var el = document.getElementById(canvasID);
        if (el) { el.style.display = "none"; }
    };

    WidgetFactory.prototype.buildOne = function (entry) {
        if (!entry || !entry.Ctor) { return null; }
        if (!this.isEnabled(entry)) {
            this.hideDisabled(entry);
            return null;
        }
        var src = entry.config || {}, config = {}, key;
        for (key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) { config[key] = src[key]; }
        }
        config.id = config.id || entry.id;
        var instance = new entry.Ctor(config);
        if (typeof instance.initialize === "function") {
            instance.initialize();
        }
        if (this.registry) {
            this.registry.register(config.id, instance);
        }
        return instance;
    };

    WidgetFactory.prototype.buildAll = function () {
        var built = [];
        for (var i = 0; i < this.manifest.length; i++) {
            var instance = this.buildOne(this.manifest[i]);
            if (instance) { built.push(instance); }
        }
        return built;
    };

    global.WidgetFactory = WidgetFactory;
})(typeof window !== "undefined" ? window : this);
