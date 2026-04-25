/*jslint plusplus: true, sloppy: true, indent: 4 */
// MainChartWidget: config-driven WidgetChart subclass for the four main-page
// Chart.js graphs (baroGraph / rainGraph / tempGraph / windGraph).

(function (global) {
    function MainChartWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || null;
        config.events = config.events || ["graphDataUpdated"];
        if (!config.unitEvents && config.defaultBase &&
                typeof globalGraphs !== "undefined" && globalGraphs[config.defaultBase]) {
            config.unitEvents = [globalGraphs[config.defaultBase].unit];
        }
        WidgetChart.call(this, config);

        this.graphType = config.graphType || "line";
        this.defaultBase = config.defaultBase || null;
        this.defaultRange = config.defaultRange || null;
        this.canvasDivID = config.canvasDivID ||
            (config.canvasID ? config.canvasID + "CanvasDiv" : null);
        this.canvasDiv = null;
    }
    WidgetBase.inherit(MainChartWidget, WidgetChart);

    MainChartWidget.prototype.setUp = function () {
        this.canvasDiv = document.getElementById(this.canvasDivID);
        this.drawChart();
    };

    MainChartWidget.prototype.onDataUpdate = function () {
        if (this.defaultBase && this.defaultRange) {
            this.configureGraph(this.defaultBase, this.defaultRange);
        }
    };

    MainChartWidget.prototype.redrawForUnitChange = function () {
        if (this.defaultBase && this.defaultRange) {
            this.configureGraph(this.defaultBase, this.defaultRange);
        }
    };

    MainChartWidget.prototype.drawChart = function () {
        var xAxis;
        if (this.graphType === "bar") {
            xAxis = { type: 'category' };
        } else {
            xAxis = {
                type: 'time',
                ticks: {
                    minor: { autoSkip: true, autoSkipPadding: 0 },
                    major: { autoSkip: true, autoSkipPadding: 0 }
                },
                time: {
                    unit: 'hour',
                    unitStepSize: 1,
                    displayFormats: { hour: "HH:mm" }
                }
            };
        }
        var options = {
            chartArea: { backgroundColor: 'rgba(255, 255, 255, 1)' },
            title: { display: true, text: "" },
            scales: {
                display: true,
                yAxes: [{
                    scaleLabel: { display: true, labelString: null }
                }],
                xAxes: [xAxis]
            }
        };
        this.chart = new Chart(this.chartContext, {
            type: this.graphType,
            data: { labels: [], datasets: [] },
            options: options
        });
    };

    MainChartWidget.prototype.resizeText = function () {
        var parentDiv = this.canvasDiv.parentElement;
        this.chart.options.title.fontSize = parentDiv.clientWidth * 0.05;
        this.chart.options.scales.yAxes[0].scaleLabel.fontSize = parentDiv.clientWidth * 0.05;
        this.chart.options.scales.yAxes[0].ticks.minor.fontSize =
            this.chart.options.scales.yAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.05;
        this.chart.options.scales.xAxes[0].ticks.minor.fontSize =
            this.chart.options.scales.xAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.04;
    };

    MainChartWidget.prototype.resize = function () {
        var ratio = 0.7,
            parentDiv = this.canvasDiv.parentElement;

        this.canvasDiv.style.width = (parentDiv.clientWidth).toString() + "px";
        this.canvasDiv.style.height = (parentDiv.clientWidth * ratio * 0.95).toString() + "px";

        this.chart.resize();
        this.resizeText();
        this.chart.update();
    };

    MainChartWidget.prototype.configureGraph = function (baseKey, rangeKey) {
        var baseIn, graphIn;
        try {
            baseIn = globalGraphs[baseKey];
            graphIn = baseIn.graphs[rangeKey];
        } catch (err) {
            console.log("Graph not enabled.");
            return;
        }

        var graphData = [],
            graphLabels = [],
            style = baseIn.style.toString(),
            i;

        if (this.graphType === "bar") {
            for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
                graphData[i] = formatDataToUnit(graphDict[graphIn.data][i], baseIn.unit);
                graphLabels[i] = graphDict[graphIn.timestamp][i].format(graphIn.timeDisplay.toString());
            }
        } else {
            for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
                graphData[i] = {
                    x: graphDict[graphIn.timestamp][i],
                    y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit)
                };
            }
        }

        var datasetStyle = WidgetBase.extend({}, graphStyles[style]),
            unitLabel = baseIn.label.toString() + " (" +
                units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
        datasetStyle.label = unitLabel;
        datasetStyle.data = graphData;
        this.chart.data.datasets[0] = datasetStyle;

        if (this.graphType === "bar") {
            this.chart.data.labels = graphLabels;
        } else {
            this.chart.options.scales.xAxes[0].time.unit = graphIn.timeDisplay.toString();
        }

        this.chart.options.scales.yAxes[0].scaleLabel.labelString = unitLabel;
        this.chart.options.title.text = graphIn.title.toString();

        var tickKeys = Object.keys(baseIn.tickOptions);
        for (i = 0; i < tickKeys.length; i++) {
            this.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
        }

        this.chart.update();
    };

    global.MainChartWidget = MainChartWidget;
})(typeof window !== "undefined" ? window : this);
