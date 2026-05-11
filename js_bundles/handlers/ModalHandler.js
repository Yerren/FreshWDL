/*jslint plusplus: true, sloppy: true, indent: 4 */
// ModalHandler: DOM handler for the graph popup modal.
// Exposes global.graphChange for the inline onchange="graphChange(this)" on the select menu.

(function (global) {
    function ModalHandler(config) {
        DomHandler.call(this, config);
        this.modal = null;
        this.span = null;
        this.selectMenu = null;
        this.graphInputs = {};
        this.graphs = { rain: null, baro: null, temp: null, wind: null };
        this.button = null;
        this.graphHandler = null;
    }
    WidgetBase.inherit(ModalHandler, DomHandler);

    ModalHandler.prototype.openModal = function (val1, val2, menuValue) {
        if (!this.graphHandler && global.app) {
            this.graphHandler = global.app.registry.get("modalGraph");
        }
        if (this.selectMenu) { this.selectMenu.value = menuValue; }
        if (this.modal) { this.modal.style.display = "block"; }
        if (this.graphHandler) {
            this.graphHandler.configureGraph(val1, val2);
            this.graphHandler.chart.resize();
        }
    };

    ModalHandler.prototype.setUp = function () {
        var self = this;

        this.graphHandler = global.app ? global.app.registry.get("modalGraph") : null;

        this.modal = document.getElementById("myModal");
        if (this.modal) { this.modal.style.display = "none"; }
        this.span = document.getElementById("graphClose");
        this.selectMenu = document.getElementById("selectMenu");

        if (this.selectMenu && typeof globalGraphs !== "undefined") {
            var gGkeys = Object.keys(globalGraphs), a, b;
            for (a = 0; a < gGkeys.length; a++) {
                var currentGraphKeys = Object.keys(globalGraphs[gGkeys[a]].graphs);
                for (b = 0; b < currentGraphKeys.length; b++) {
                    var optionLabel = gGkeys[a].toString() + currentGraphKeys[b].toString(),
                        opt = document.createElement("option");
                    opt.value = optionLabel;
                    this.graphInputs[optionLabel] = [gGkeys[a], currentGraphKeys[b]];
                    opt.text = globalGraphs[gGkeys[a]].graphs[currentGraphKeys[b]].title;
                    this.selectMenu.add(opt);
                }
            }
        }

        // Tolerant track(): silently skips missing targets so ModalHandler can
        // coexist with custom layouts that omit some/all of the graph canvases
        // or the GraphsButton.
        var track = function (target, event, handler) {
            if (!target) { return; }
            target.addEventListener(event, handler, false);
            self._listeners.push({ event: event, handler: handler, target: target });
        };

        track(this.span, "click", function () {
            if (self.modal) { self.modal.style.display = "none"; }
        });
        track(window, "click", function (event) {
            if (self.modal && event.target === self.modal) {
                self.modal.style.display = "none";
            }
        });

        this.graphs.rain = document.getElementById("rainGraphCanvas01");
        track(this.graphs.rain, "click", function () {
            self.openModal("rainfallBar", "dailyMonth", "rainfallBardailyMonth");
        });

        this.graphs.temp = document.getElementById("tempGraphCanvas01");
        track(this.graphs.temp, "click", function () {
            self.openModal("temp", "hourlyDay", "temphourlyDay");
        });

        this.graphs.baro = document.getElementById("baroGraphCanvas01");
        track(this.graphs.baro, "click", function () {
            self.openModal("barometer", "hourlyDay", "barometerhourlyDay");
        });

        this.graphs.wind = document.getElementById("windGraphCanvas01");
        track(this.graphs.wind, "click", function () {
            self.openModal("windSpeed", "hourlyDay", "windSpeedhourlyDay");
        });

        this.button = document.getElementById("GraphsButton");
        if (this.button) {
            this.button.innerHTML = useDict("buttonLabelGraphs");
            track(this.button, "click", function () {
                if (typeof globalGraphs === "undefined") { return; }
                var firstKey = Object.keys(globalGraphs)[0],
                    firstRange = Object.keys(globalGraphs[firstKey].graphs)[0];
                self.openModal(firstKey, firstRange, firstKey + firstRange);
            });
        }

        // Expose global for inline onchange="graphChange(this)" in UpperContent.js
        global.graphChange = function (obj) {
            if (!self.graphHandler && global.app) {
                self.graphHandler = global.app.registry.get("modalGraph");
            }
            var inputs = self.graphInputs[obj.value];
            if (inputs && self.graphHandler) {
                self.graphHandler.configureGraph(inputs[0], inputs[1]);
            }
        };
    };

    global.ModalHandler = ModalHandler;
})(typeof window !== "undefined" ? window : this);
