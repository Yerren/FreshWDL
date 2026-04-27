/*jslint plusplus: true, sloppy: true, indent: 4 */
// BarometerWidget: pressure + trend rate. Fully declarative via the
// WidgetText template. Trend text carries custom "+" sign / "Steady"
// logic, computed in an extras function.

(function (global) {
    function BarometerWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "Barometer01";
        config.events = config.events || ["clientRawDataUpdate"];
        config.unitEvents = config.unitEvents || ["pressure"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("barometerDescription") : "");
        config.template = config.template || [
            '<shape type="roundedRect" x="5%" y="100%h - 67%h - 5%w" w="90%" h="67%"',
            '       radius="10%" strokeSize="2.5%" fill="#F6F6F6"/>',
            '<text x="50%" y="11%"  font="bold 19%w arial" maxWidth="stage">{{title}}</text>',
            '<text x="50%" y="40%"  font="bold 12.5%w arial">{{pressure|unit:pressure}}</text>',
            '<text x="50%" y="60%"  font="bold 14%w arial" maxWidth="stage">{{rateLabel}}</text>',
            '<text x="50%" y="75%"  font="bold 12.5%w arial" maxWidth="90%">{{trendDisplay}}</text>'
        ].join("\n");
        config.extras = config.extras || {
            title:     function () { return config.title || useDict("barometerTitle"); },
            rateLabel: function () { return useDict("barometerRate") + ":"; },
            trendDisplay: function () {
                var trend = formatDataToUnit(arrayClientraw[50], "pressure");
                var unitStr = units.pressure[currentUnits.pressure][1].toString();
                if (parseFloat(trend) !== 0.0) {
                    var s = trend + unitStr + "/hr";
                    if (parseFloat(trend) > 0) { s = "+" + s; }
                    return s;
                }
                return useDict("barometerSteady");
            }
        };
        WidgetText.call(this, config);
    }
    WidgetBase.inherit(BarometerWidget, WidgetText);

    BarometerWidget.prototype.aspectRatio = 1.0;

    global.BarometerWidget = BarometerWidget;
})(typeof window !== "undefined" ? window : this);
