/*jslint plusplus: true, sloppy: true, indent: 4 */
// TitleRainfallWidget: single static title label. Fully declarative via the
// WidgetText template system.

(function (global) {
    function TitleRainfallWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "TitleRainfall01";
        config.template = config.template ||
            '<text x="50%" y="50%" font="bold 10%w arial" maxWidth="stage">{{title}}</text>';
        config.extras = config.extras || {
            title: function () { return useDict("rainfallTitle"); }
        };
        WidgetText.call(this, config);
    }
    WidgetBase.inherit(TitleRainfallWidget, WidgetText);

    TitleRainfallWidget.prototype.aspectRatio = 0.12 / 0.99;

    global.TitleRainfallWidget = TitleRainfallWidget;
})(typeof window !== "undefined" ? window : this);
