// FreshWDL bundle loader.
//
// Exported sites (from the Layout Editor) reference this single file instead of
// listing every bundle individually, so adding a new widget/handler here will
// flow to existing deployments without anyone having to re-export. Order
// matters: scripts are document.write-ed in array order, and the runtime has
// load-order dependencies (e.g. WidgetBase must define the base class before
// any widgets/* subclass it).
//
// document.write is intentional: when this script is parsed inline, the writes
// inject <script src> tags that the HTML parser then loads/executes in order
// before parsing continues. Dynamic appendChild does NOT preserve execution
// order for external scripts inserted from a single tick, which would break
// the dependency chain.

(function () {
    var self = document.currentScript;
    var src = self && self.src;
    if (!src) {
        var scripts = document.getElementsByTagName("script");
        for (var i = scripts.length - 1; i >= 0; i--) {
            if (scripts[i].src && scripts[i].src.indexOf("/loader.js") !== -1) {
                src = scripts[i].src;
                break;
            }
        }
    }
    var base = src ? src.replace(/loader\.js(\?.*)?$/, "") : "";

    var BUNDLES = [
        "Loading.js",
        "easeljs-0.8.2.min.js",
        "tweenjs-0.6.2.min.js",
        "opentip-native.min.js",
        "moment-with-locales.min.js",
        "Chart.min.js",
        "Globals.js",
        "DataHelpers.js",
        "DataBindings.js",
        "WidgetBase.js",
        "CanvasWidget.js",
        "DomHandler.js",
        "WidgetText.js",
        "WidgetBar.js",
        "WidgetGauge.js",
        "WidgetChart.js",
        "widgets/ApparentWidget.js",
        "widgets/SolarBarWidget.js",
        "widgets/HumidityGaugeWidget.js",
        "widgets/MainChartWidget.js",
        "widgets/TemperatureBarWidget.js",
        "widgets/BarometerWidget.js",
        "widgets/MoonSunWidget.js",
        "widgets/StatusWidget.js",
        "widgets/TitleRainfallWidget.js",
        "widgets/UniBarWidget.js",
        "widgets/UVBarWidget.js",
        "widgets/WindGaugeWidget.js",
        "widgets/WindSpeedWidget.js",
        "widgets/WindSpeedGaugeWidget.js",
        "widgets/ButtonWidget.js",
        "handlers/ForecastHandler.js",
        "handlers/RecordsHandler.js",
        "handlers/ModalGraphHandler.js",
        "handlers/ButtonsHandler.js",
        "handlers/ModalHandler.js",
        "WidgetRegistry.js",
        "WidgetFactory.js",
        "DataManager.js",
        "LayoutMount.js",
        "App.js"
    ];

    for (var j = 0; j < BUNDLES.length; j++) {
        document.write('<script type="text/javascript" src="' + base + BUNDLES[j] + '"><\/script>');
    }
})();
