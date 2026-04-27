/*jslint plusplus: true, sloppy: true, indent: 4 */
// ApparentWidget: apparent temperature. Fully declarative via WidgetText
// template.

(function (global) {
    function ApparentWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "Apparent01";
        config.events = config.events || ["clientRawDataUpdate"];
        config.unitEvents = config.unitEvents || ["temp"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("apparentDescription") : "");
        config.template = config.template || [
            '<shape type="roundedRect" x="5%" y="100%h - 40%h - 5%w" w="90%" h="40%"',
            '       radius="10%" strokeSize="2.5%" fill="#F6F6F6"/>',
            '<text x="50%" y="20%" font="bold 19%w arial" maxWidth="stage">{{title}}</text>',
            '<text x="50%" y="71%" font="bold 15%w arial">{{temp|unit:temp}}</text>'
        ].join("\n");
        config.extras = config.extras || {
            title: function () { return config.title || useDict("apparentTitle"); }
        };
        WidgetText.call(this, config);
    }
    WidgetBase.inherit(ApparentWidget, WidgetText);

    ApparentWidget.prototype.aspectRatio = 17 / 30;

    global.ApparentWidget = ApparentWidget;
})(typeof window !== "undefined" ? window : this);
