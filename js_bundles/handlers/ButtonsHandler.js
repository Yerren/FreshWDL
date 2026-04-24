/*jslint plusplus: true, sloppy: true, indent: 4 */
// ButtonsHandler: DOM handler for the five unit-toggle buttons.
// OO conversion of legacy buttons global + updateUnits, changeUnit, initializeButtons.
// Uses window.app.registry to call draw()/configureGraph() on converted OO widgets.

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

        this.buttons.altitude = document.getElementById("AltitudeButton");
        this.buttons.pressure = document.getElementById("PressureButton");
        this.buttons.wind     = document.getElementById("WindButton");
        this.buttons.rainfall = document.getElementById("RainfallButton");
        this.buttons.temp     = document.getElementById("TempButton");

        this.buttons.altitude.innerHTML = useDict("buttonLabelAltitude");
        this.buttons.pressure.innerHTML = useDict("graphBaroLabel");
        this.buttons.wind.innerHTML     = useDict("windSpeedWind");
        this.buttons.rainfall.innerHTML = useDict("rainfallTitle");
        this.buttons.temp.innerHTML     = useDict("temperatureTitle");

        var unitKeys = ["altitude", "pressure", "wind", "rainfall", "temp"];
        for (var k = 0; k < unitKeys.length; k++) {
            (function (unit) {
                var btn = self.buttons[unit],
                    handler = function () { self.changeUnit(unit); };
                btn.addEventListener("click", handler, false);
                self._listeners.push({ event: "click", handler: handler, target: btn });
            }(unitKeys[k]));
        }
    };

    global.ButtonsHandler = ButtonsHandler;
})(typeof window !== "undefined" ? window : this);
