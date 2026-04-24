/*jslint plusplus: true, sloppy: true, indent: 4 */
// ModalHandler: DOM handler for the graph popup modal.
// OO conversion of legacy modal global + initModalHandler.
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
        this.selectMenu.value = menuValue;
        this.modal.style.display = "block";
        if (this.graphHandler) {
            this.graphHandler.configureGraph(val1, val2);
            this.graphHandler.chart.resize();
        }
    };

    ModalHandler.prototype.setUp = function () {
        var self = this;

        this.graphHandler = global.app ? global.app.registry.get("modalGraph") : null;

        this.modal = document.getElementById("myModal");
        this.modal.style.display = "none";
        this.span = document.getElementById("graphClose");
        this.selectMenu = document.getElementById("selectMenu");

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

        var track = function (target, event, handler) {
            target.addEventListener(event, handler, false);
            self._listeners.push({ event: event, handler: handler, target: target });
        };

        track(this.span, "click", function () { self.modal.style.display = "none"; });
        track(window, "click", function (event) {
            if (event.target === self.modal) { self.modal.style.display = "none"; }
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
        this.button.innerHTML = useDict("buttonLabelGraphs");
        track(this.button, "click", function () {
            var firstKey = Object.keys(globalGraphs)[0],
                firstRange = Object.keys(globalGraphs[firstKey].graphs)[0];
            self.openModal(firstKey, firstRange, firstKey + firstRange);
        });

        // Expose global for inline onchange="graphChange(this)" in UpperContent.js
        global.graphChange = function (obj) {
            var inputs = self.graphInputs[obj.value];
            if (inputs && self.graphHandler) {
                self.graphHandler.configureGraph(inputs[0], inputs[1]);
            }
        };
    };

    global.ModalHandler = ModalHandler;
})(typeof window !== "undefined" ? window : this);
