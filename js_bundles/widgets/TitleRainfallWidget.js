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

    // Width-driven resize. The default contain-fit logic deadlocks here
    // because the slot's grid row is `auto`: once the canvas shrinks, the
    // slot's clientHeight follows it down, so on a subsequent grow the
    // stale clientHeight pins the canvas to its previous (smaller) size.
    TitleRainfallWidget.prototype.resize = function () {
        if (!this.canvas) { return; }
        var parent = this.canvas.parentElement;
        if (!parent) { return; }
        var W = parent.clientWidth;
        if (W <= 0) { return; }
        this.canvas.width = W;
        this.canvas.height = W * this.aspectRatio;
        this.applyStageTransform();
        if (typeof this.updateTop === "function") { this.updateTop(); }
    };

    global.TitleRainfallWidget = TitleRainfallWidget;
})(typeof window !== "undefined" ? window : this);
