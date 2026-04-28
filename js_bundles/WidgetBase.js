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
        this._dirty = true;

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

    // Compare each field of newValues against this.valuesOld. Returns true
    // (and atomically commits the new values into valuesOld) when any field
    // differs or `force` is truthy; returns false otherwise. Replaces the
    // hand-rolled `valuesOld.X != X && ... ; ... ; valuesOld.X = X` pattern
    // duplicated across the bar widgets. Loose equality matches the legacy
    // behaviour (some callers pass strings, others numbers).
    WidgetBase.prototype.hasChanged = function (newValues, force) {
        var k, changed = !!force;
        if (!changed) {
            for (k in newValues) {
                if (Object.prototype.hasOwnProperty.call(newValues, k) &&
                        this.valuesOld[k] != newValues[k]) {
                    changed = true;
                    break;
                }
            }
        }
        if (!changed) { return false; }
        for (k in newValues) {
            if (Object.prototype.hasOwnProperty.call(newValues, k)) {
                this.valuesOld[k] = newValues[k];
            }
        }
        return true;
    };

    // Mark the widget as needing a redraw on the next frameUpdate. CanvasWidget's
    // frame handler clears the flag after stage.update(); non-canvas widgets
    // ignore it.
    WidgetBase.prototype.markDirty = function () { this._dirty = true; };

    // Listen for a clientraw-related event and route it through onDataUpdate.
    WidgetBase.prototype.listenForData = function (eventName) {
        var self = this;
        var handler = function () { self.onDataUpdate(eventName); self._dirty = true; };
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
                self._dirty = true;
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

    // Wire each event in config.events through onDataUpdate, and each unit
    // type in config.unitEvents through redrawForUnitChange.
    WidgetBase.prototype._wireConfigListeners = function () {
        var events = (this.config && this.config.events) || [],
            unitEvents = (this.config && this.config.unitEvents) || [], i;
        for (i = 0; i < events.length; i++) { this.listenForData(events[i]); }
        for (i = 0; i < unitEvents.length; i++) { this.listenForUnitChange(unitEvents[i]); }
    };

    // Default resize wiring: window resize (desktop) or orientation media-
    // query (mobile). Subclasses inherit this; the matching teardown lives
    // in destroy() which removes via target.removeListener for the mql case.
    WidgetBase.prototype.attachResizeHandlers = function () {
        var self = this,
            handler = function () { self.resize(); };
        if (typeof onMobile !== "undefined" && onMobile === false) {
            window.addEventListener("resize", handler, false);
            this._listeners.push({ event: "resize", handler: handler });
        } else {
            // Deprecated MediaQueryList.addListener: kept for IE9+ floor —
            // destroy() pairs this with mql.removeListener via target.
            var mql = window.matchMedia("(orientation: portrait)");
            mql.addListener(handler);
            this._listeners.push({ event: "orientation", handler: handler, target: mql });
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
