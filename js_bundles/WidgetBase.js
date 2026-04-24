/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetBase: minimal shared root for all widgets and DOM handlers.
// ES5 constructor pattern (no classes, no Object.assign, no arrow functions).

(function (global) {
    function WidgetBase(config) {
        config = config || {};
        this.id = config.id || null;
        this.elementId = config.elementId || null;
        this.enabled = config.enabled !== false;
        this.config = config;
        this.values = {};
        this.valuesOld = {};
        this.tweens = {};
        this._listeners = [];

        // Compile declarative data bindings if present. Typos in specs throw
        // here so they fail loudly at bootstrap rather than on first tick.
        this._bindingResolvers = null;
        if (config.bindings && typeof DataBindings !== "undefined") {
            try {
                this._bindingResolvers = DataBindings.compile(config.bindings);
            } catch (e) {
                throw new Error("Widget '" + (this.id || "?") + "': " + e.message);
            }
        }
    }

    // Hand-rolled extend helper (replacement for ES2015 Object.assign; IE-safe).
    WidgetBase.extend = function (target, source) {
        if (!source) { return target; }
        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
        return target;
    };

    // Prototype-based inheritance helper.
    WidgetBase.inherit = function (Child, Parent) {
        function Tmp() { this.constructor = Child; }
        Tmp.prototype = Parent.prototype;
        Child.prototype = new Tmp();
        Child.superclass = Parent.prototype;
        return Child;
    };

    // Abstract hooks: subclasses override these. Base provides no-op defaults.
    WidgetBase.prototype.setUp = function () {};
    WidgetBase.prototype.draw = function () {};
    WidgetBase.prototype.onDataUpdate = function (eventName) {};
    WidgetBase.prototype.resize = function () {};

    // Resolve all compiled bindings and return { field: value, ... }.
    // Widgets call this in onDataUpdate() instead of reaching into the
    // global clientraw arrays directly.
    WidgetBase.prototype.readBindings = function () {
        return DataBindings.read(this._bindingResolvers);
    };

    // Listen for a clientraw-related event and route it through onDataUpdate.
    WidgetBase.prototype.listenForData = function (eventName) {
        var self = this;
        var handler = function () { self.onDataUpdate(eventName); };
        window.addEventListener(eventName, handler);
        this._listeners.push({ event: eventName, handler: handler });
    };

    // Listen for a "unitChange_<unitType>" dispatch and call redrawForUnitChange().
    WidgetBase.prototype.listenForUnitChange = function (unitType) {
        var self = this,
            eventName = "unitChange_" + unitType,
            handler = function () {
                if (typeof self.redrawForUnitChange === "function") {
                    self.redrawForUnitChange(unitType);
                }
            };
        window.addEventListener(eventName, handler);
        this._listeners.push({ event: eventName, handler: handler });
    };

    // Called by subclasses once setup is complete so App can gate the load screen.
    WidgetBase.prototype.markLoaded = function () {
        if (typeof checkOffLoaded === "function") {
            checkOffLoaded();
        }
    };

    // Initialize flow, invoked by the registry.
    WidgetBase.prototype.initialize = function () {
        // Subclasses should override and call their setUp/resize/listener wiring.
        this.setUp();
    };

    // Remove every tracked listener. Subclasses may override to tear down
    // additional resources (e.g. Chart.js instances, CreateJS stages) but
    // should call WidgetBase.prototype.destroy.call(this) to release listeners.
    WidgetBase.prototype.destroy = function () {
        var list = this._listeners || [];
        for (var i = 0; i < list.length; i++) {
            var entry = list[i];
            if (entry.target && typeof entry.target.removeListener === "function") {
                entry.target.removeListener(entry.handler);
            } else if (entry.target && typeof entry.target.removeEventListener === "function") {
                entry.target.removeEventListener(entry.event, entry.handler);
            } else {
                window.removeEventListener(entry.event, entry.handler);
            }
        }
        this._listeners = [];
    };

    global.WidgetBase = WidgetBase;
})(typeof window !== "undefined" ? window : this);
