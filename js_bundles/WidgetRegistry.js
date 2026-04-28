/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetRegistry: holds created widget/handler instances by id, so other parts
// of the app (buttons, modal graph, ticker dispatch) can look them up without
// resorting to globals.

(function (global) {
    function WidgetRegistry() {
        this.items = {};
    }

    WidgetRegistry.prototype.register = function (id, widget) {
        if (!id) { return; }
        this.items[id] = widget;
    };

    WidgetRegistry.prototype.get = function (id) {
        return this.items[id] || null;
    };

    WidgetRegistry.prototype.has = function (id) {
        return Object.prototype.hasOwnProperty.call(this.items, id);
    };

    WidgetRegistry.prototype.unregister = function (id) {
        var w = this.items[id];
        if (w && typeof w.destroy === "function") { w.destroy(); }
        delete this.items[id];
        return w || null;
    };

    WidgetRegistry.prototype.getAll = function () {
        var out = [], key;
        for (key in this.items) {
            if (Object.prototype.hasOwnProperty.call(this.items, key)) {
                out.push(this.items[key]);
            }
        }
        return out;
    };
    WidgetRegistry.prototype.all = WidgetRegistry.prototype.getAll;

    // Call a named method on every registered widget that defines it.
    WidgetRegistry.prototype.broadcast = function (methodName) {
        var key, w;
        for (key in this.items) {
            if (Object.prototype.hasOwnProperty.call(this.items, key)) {
                w = this.items[key];
                if (w && typeof w[methodName] === "function") {
                    w[methodName]();
                }
            }
        }
    };

    // Tear down every widget and clear the registry. Widgets implementing
    // destroy() release their tracked listeners via WidgetBase.destroy.
    WidgetRegistry.prototype.destroyAll = function () {
        this.broadcast("destroy");
        this.items = {};
    };

    global.WidgetRegistry = WidgetRegistry;
})(typeof window !== "undefined" ? window : this);
