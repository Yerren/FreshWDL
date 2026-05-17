/*jslint plusplus: true, sloppy: true, indent: 4 */
// ButtonWidget: grid-placed button that toggles a unit, opens the records
// modal, or opens the graphs modal. Style is one of "original", "pill", "flat".

(function (global) {
    var ROLE_LABELS = {
        "units-altitude": "buttonLabelAltitude",
        "units-pressure": "graphBaroLabel",
        "units-wind":     "windSpeedWind",
        "units-rainfall": "rainfallTitle",
        "units-temp":     "temperatureTitle",
        "records":        "buttonLabelRecords",
        "graphs":         "buttonLabelGraphs"
    };

    function ButtonWidget(config) {
        DomHandler.call(this, config);
        this.role         = config.role         || "units-pressure";
        this.buttonStyle  = config.buttonStyle  || "original";
        this.buttonColour = config.buttonColour || "";
        this.btn          = null;
        this._recordsHandler = null;
        this._graphsHandler  = null;
    }
    WidgetBase.inherit(ButtonWidget, DomHandler);

    ButtonWidget.prototype.setUp = function () {
        var self = this,
            slot = document.querySelector('[data-widget="' + this.id + '"]');
        if (!slot) { return; }

        var btn = document.createElement("button"),
            labelKey = ROLE_LABELS[this.role],
            handler;

        btn.innerHTML = labelKey ? useDict(labelKey) : this.role;
        btn.className = "fwdl-btn fwdl-btn--" + this.buttonStyle;

        if (this.buttonColour) {
            if (this.buttonStyle === "flat") {
                btn.style.borderColor = this.buttonColour;
                btn.style.color       = this.buttonColour;
            } else {
                btn.style.backgroundColor = this.buttonColour;
            }
        }

        this.btn = btn;
        slot.appendChild(btn);

        if (this.role.indexOf("units-") === 0) {
            var unit = this.role.slice(6);
            handler = function () {
                // Delegate to ButtonsHandler so unit-cycling logic stays in one place.
                var h = global.app ? global.app.registry.get("buttons") : null;
                if (h) { h.changeUnit(unit); }
            };
        } else if (this.role === "records") {
            this._recordsHandler = global.app ? global.app.registry.get("records") : null;
            handler = function () {
                if (!self._recordsHandler && global.app) {
                    self._recordsHandler = global.app.registry.get("records");
                }
                var h = self._recordsHandler;
                if (h && h.modal) {
                    h.modal.style.display = "block";
                    h.resize();
                }
            };
        } else if (this.role === "graphs") {
            this._graphsHandler = global.app ? global.app.registry.get("modalHandler") : null;
            handler = function () {
                if (!self._graphsHandler && global.app) {
                    self._graphsHandler = global.app.registry.get("modalHandler");
                }
                var h = self._graphsHandler;
                if (h && typeof globalGraphs !== "undefined") {
                    var firstKey   = Object.keys(globalGraphs)[0],
                        firstRange = Object.keys(globalGraphs[firstKey].graphs)[0];
                    h.openModal(firstKey, firstRange, firstKey + firstRange);
                }
            };
        }

        if (handler) {
            btn.addEventListener("click", handler, false);
            this._listeners.push({ event: "click", handler: handler, target: btn });
        }
    };

    ButtonWidget.prototype.resize = function () {
        if (!this.btn) { return; }
        var slot = this.btn.parentNode;
        if (!slot || !slot.clientHeight || !slot.clientWidth) { return; }
        var size = Math.round(Math.min(slot.clientHeight, slot.clientWidth) * 0.28);
        this.btn.style.fontSize = size + "px";
        // Scale down if the text overflows the button width (e.g. uppercase + letter-spacing).
        if (this.btn.scrollWidth > this.btn.clientWidth && this.btn.clientWidth > 0) {
            size = Math.floor(size * this.btn.clientWidth / this.btn.scrollWidth * 0.92);
            this.btn.style.fontSize = size + "px";
        }
    };

    global.ButtonWidget = ButtonWidget;
})(typeof window !== "undefined" ? window : this);
