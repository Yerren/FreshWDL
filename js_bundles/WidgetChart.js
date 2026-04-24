/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetChart: CanvasWidget subclass that wraps Chart.js. Bypasses CreateJS
// stage and frameUpdate — Chart.js owns its own rendering. Reuses the canvas-
// resolution and resize wiring from CanvasWidget.
//
// All four main-page graphs (baro/rain/temp/wind) are instances of WidgetChart,
// driven by per-instance graphType/timeRange config passed to configureGraph().

(function (global) {
    function WidgetChart(config) {
        CanvasWidget.call(this, config);
        this.chart = null;
        this.chartContext = null;
        this.graphType = config.graphType || null;
        this.timeRange = config.timeRange || null;
        this.graphStyleKey = config.graphStyleKey || null;
        this.isBarChart = config.isBarChart || false;
        this.resizeBehavior = config.resizeBehavior || null;
    }
    WidgetBase.inherit(WidgetChart, CanvasWidget);

    // Chart.js needs a 2D context, not a CreateJS stage. `this.canvas` is the
    // canvas DOM element (matches CanvasWidget convention); `this.chartContext`
    // is the 2D context passed to new Chart().
    WidgetChart.prototype.resolveCanvas = function () {
        var canvasEl = null;
        if (this.config.canvas) {
            canvasEl = this.config.canvas;
        } else if (this.elementId) {
            canvasEl = document.getElementById(this.elementId);
        } else if (this.config.canvasID) {
            canvasEl = document.getElementById(this.config.canvasID);
        }
        this.canvas = canvasEl;
        if (canvasEl) {
            this.chartContext = canvasEl.getContext("2d", { alpha: false });
        }
        return this.canvas;
    };

    // No CreateJS stage.
    WidgetChart.prototype.createStage = function () {};
    // No frameUpdate listener — Chart.js handles its own redraw on .update().
    WidgetChart.prototype.attachFrameUpdate = function () {};
    // Opentip is not typically attached to chart canvases.
    WidgetChart.prototype.attachTooltip = function () {};

    // Concrete chart subclasses (or instances via config) implement the
    // configureGraph(dataType, timeRange) method to swap datasets/options.
    WidgetChart.prototype.configureGraph = function () {};

    global.WidgetChart = WidgetChart;
})(typeof window !== "undefined" ? window : this);
