/*jslint plusplus: true, sloppy: true, indent: 4 */
// ButtonsHandler: DOM handler for the five unit-toggle buttons.
// Uses window.app.registry to call draw()/configureGraph() on widgets.

(function (global) {
    function ButtonsHandler(config) {
        DomHandler.call(this, config);
        this.buttons = {
            altitude: null,
            pressure: null,
            wind:     null,
            rainfall: null,
            temp:     null
        };
    }
    WidgetBase.inherit(ButtonsHandler, DomHandler);

    ButtonsHandler.prototype.updateUnits = function (unitType) {
        window.dispatchEvent(new CustomEvent("unitChange_" + unitType));
    };

    ButtonsHandler.prototype.changeUnit = function (unit) {
        var uKeys = Object.keys(units[unit]), i = 0;
        while (currentUnits[unit] !== uKeys[i]) { i += 1; }
        if (i === uKeys.length - 1) {
            currentUnits[unit] = [uKeys[0]].toString();
        } else {
            currentUnits[unit] = [uKeys[i + 1]].toString();
        }
        this.updateUnits(unit);
    };

    ButtonsHandler.prototype.setUp = function () {
        var self = this;

        // Buttons are optional — custom layouts may omit any subset. Each
        // missing element is silently skipped (no label, no listener).
        var buttonSpec = {
            altitude: { id: "AltitudeButton", label: "buttonLabelAltitude" },
            pressure: { id: "PressureButton", label: "graphBaroLabel" },
            wind:     { id: "WindButton",     label: "windSpeedWind" },
            rainfall: { id: "RainfallButton", label: "rainfallTitle" },
            temp:     { id: "TempButton",     label: "temperatureTitle" }
        };

        var keys = Object.keys(buttonSpec), k;
        for (k = 0; k < keys.length; k++) {
            (function (unit) {
                var spec = buttonSpec[unit],
                    btn = document.getElementById(spec.id);
                self.buttons[unit] = btn;
                if (!btn) { return; }
                btn.innerHTML = useDict(spec.label);
                var handler = function () { self.changeUnit(unit); };
                btn.addEventListener("click", handler, false);
                self._listeners.push({ event: "click", handler: handler, target: btn });
            }(keys[k]));
        }
    };

    global.ButtonsHandler = ButtonsHandler;
})(typeof window !== "undefined" ? window : this);
