/*jslint plusplus: true, sloppy: true, indent: 4 */
// LayoutMount: scans the DOM for <... data-widget="id"> placeholders and
// injects the canvas/wrapper elements each widget needs, then installs a
// ResizeObserver so container width changes trigger widget.resize().
//
// This decouples layout from widget code: users define their own layout by
// dropping <div data-widget="temperature"></div> anywhere in HTML and
// styling it with CSS. The `id` matches the manifest entry's id (see
// index-oo.html). DOM handlers (ForecastHandler etc.) have no canvas and
// are mounted purely so buildAll() finds them.

(function (global) {
    function LayoutMount() {
        this._observer = null;
    }

    LayoutMount.prototype.findEntry = function (manifest, id) {
        for (var i = 0; i < manifest.length; i++) {
            if (manifest[i].id === id) { return manifest[i]; }
        }
        return null;
    };

    // Inject the DOM elements a given widget needs into its placeholder.
    LayoutMount.prototype.injectFor = function (placeholder, entry) {
        var canvasID = entry.canvasID || (entry.config && entry.config.canvasID);
        if (!canvasID) { return; }
        if (document.getElementById(canvasID)) { return; }

        // MainChartWidget expects a wrapper div (id = canvasID + "CanvasDiv")
        // around the canvas, matching the pre-existing .OuterCanvasDiv pattern.
        if (global.MainChartWidget && entry.Ctor === global.MainChartWidget) {
            var canvasDivID = (entry.config && entry.config.canvasDivID) ||
                              (canvasID + "CanvasDiv");
            var wrapper = document.createElement("div");
            wrapper.id = canvasDivID;
            wrapper.className = "OuterCanvasDiv";
            var chartCanvas = document.createElement("canvas");
            chartCanvas.id = canvasID;
            wrapper.appendChild(chartCanvas);
            placeholder.appendChild(wrapper);
            return;
        }

        var canvas = document.createElement("canvas");
        canvas.id = canvasID;
        placeholder.appendChild(canvas);
    };

    // First pass: build DOM so widgets can resolve their canvases during
    // buildAll. Returns the list of placeholders for later observation.
    LayoutMount.prototype.mount = function (manifest, root) {
        root = root || document;
        var placeholders = root.querySelectorAll("[data-widget]"),
            found = [];
        for (var i = 0; i < placeholders.length; i++) {
            var ph = placeholders[i],
                id = ph.getAttribute("data-widget"),
                entry = this.findEntry(manifest, id);
            if (!entry) { continue; }
            this.injectFor(ph, entry);
            found.push({ placeholder: ph, id: id });
        }
        this._placeholders = found;
        return found;
    };

    // Second pass: after buildAll, hook ResizeObserver so container width
    // changes drive widget.resize(). Falls back silently on older browsers;
    // the existing window.resize listener in CanvasWidget still covers the
    // page-level case.
    LayoutMount.prototype.observe = function (registry) {
        if (typeof ResizeObserver === "undefined" || !this._placeholders) { return; }
        var obs = new ResizeObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                var el = entries[i].target,
                    id = el.getAttribute("data-widget"),
                    w = registry.get(id);
                if (w && typeof w.resize === "function") { w.resize(); }
            }
        });
        for (var j = 0; j < this._placeholders.length; j++) {
            obs.observe(this._placeholders[j].placeholder);
        }
        this._observer = obs;
    };

    global.LayoutMount = LayoutMount;
})(typeof window !== "undefined" ? window : this);
