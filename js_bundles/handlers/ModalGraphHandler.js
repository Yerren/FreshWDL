/*jslint plusplus: true, sloppy: true, indent: 4 */
// ModalGraphHandler: DOM handler for the modal Chart.js popup graph.
// Registered as "modalGraph" so App.onDataRefresh can call refresh().

(function (global) {
    function ModalGraphHandler(config) {
        config = config || {};
        config.events = config.events || ["graphDataUpdated"];
        DomHandler.call(this, config);
        this.canvas = null;
        this.canvasDiv = null;
        this.chart = null;
        this.header = null;
        this.footer = null;
        this.headerText = null;
        this.currentGraph = null;
    }
    WidgetBase.inherit(ModalGraphHandler, DomHandler);

    ModalGraphHandler.prototype.onDataUpdate = function () {
        this.refresh();
    };

    ModalGraphHandler.prototype.drawGraphLine = function () {
        var options = {
            chartArea: { backgroundColor: 'rgba(255, 255, 255, 1)' },
            scales: {
                display: true,
                yAxes: [{
                    scaleLabel: { display: true, labelString: null, fontSize: 20 }
                }],
                xAxes: [{
                    type: 'time',
                    ticks: {
                        minor: { autoSkip: true, autoSkipPadding: 0 },
                        major: { autoSkip: true, autoSkipPadding: 0 }
                    },
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {
                            day: "MMM D",
                            hour: "HH:mm",
                            millisecond: "h:mm:ss.SSS a",
                            minute: "HH:mm",
                            month: "MMM YYYY",
                            quarter: "[Q]Q - YYYY",
                            second: "h:mm:ss a",
                            week: "ll",
                            year: "YYYY"
                        }
                    }
                }]
            },
            legend: { display: false }
        };
        this.chart = new Chart(this.canvas.getContext("2d"), {
            type: "line",
            data: { datasets: [] },
            options: options
        });
    };

    ModalGraphHandler.prototype.drawGraphBar = function () {
        var options = {
            chartArea: { backgroundColor: 'rgba(255, 255, 255, 1)' },
            scales: {
                display: true,
                yAxes: [{
                    scaleLabel: { display: true, labelString: null, fontSize: 20 }
                }],
                xAxes: [{ type: 'category' }]
            }
        };
        this.chart = new Chart(this.canvas.getContext("2d"), {
            type: "bar",
            data: { labels: [], datasets: [] },
            options: options
        });
    };

    ModalGraphHandler.prototype.cleanCanvas = function () {
        this.chart.destroy();
        this.chart = null;
    };

    ModalGraphHandler.prototype.configureGraphLine = function (baseIn, graphIn) {
        baseIn = globalGraphs[baseIn];
        graphIn = baseIn.graphs[graphIn];

        var graphData = [], style = baseIn.style.toString(), multipleSets = false,
            graphData2, style2, i;

        if (graphIn.data.length > 1) {
            graphData2 = [];
            style2 = graphIn.additionalStyles.toString();
            multipleSets = true;
        }

        for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
            graphData[i] = {
                x: graphDict[graphIn.timestamp][i],
                y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit)
            };
            if (multipleSets) {
                graphData2[i] = {
                    x: graphDict[graphIn.timestamp][i],
                    y: formatDataToUnit(graphDict[graphIn.data[1]][i], baseIn.unit)
                };
            }
        }

        this.cleanCanvas();
        this.drawGraphLine();

        var unitLabel = units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString();
        this.chart.data.datasets[0] = graphStyles[style];
        this.chart.data.datasets[0].label = baseIn.label.toString() + " (" + unitLabel + ")";
        this.chart.data.datasets[0].data = graphData;
        this.chart.options.scales.xAxes[0].time.unit = graphIn.timeDisplay.toString();
        this.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + unitLabel + ")";

        if (this.currentGraph[1].toString() === "quarterDailyWeek") {
            this.chart.options.scales.xAxes[0].time.displayFormats.day = "ddd";
        } else {
            this.chart.options.scales.xAxes[0].time.displayFormats.day = "MMM D";
        }

        if (multipleSets) {
            this.chart.data.datasets[1] = graphStyles[style2];
            this.chart.data.datasets[0].label = graphIn.legendLabels[0] + " (" + unitLabel + ")";
            this.chart.data.datasets[1].label = graphIn.legendLabels[1] + " (" + unitLabel + ")";
            this.chart.data.datasets[1].data = graphData2;
        }

        var tickKeys = Object.keys(baseIn.tickOptions);
        for (i = 0; i < tickKeys.length; i++) {
            this.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
        }

        var legendKeys = Object.keys(graphIn.legendOptions);
        for (i = 0; i < legendKeys.length; i++) {
            this.chart.options.legend[legendKeys[i]] = graphIn.legendOptions[legendKeys[i]];
        }

        this.chart.update();

        this.headerText.innerHTML = graphIn.title;
        this.header.style.backgroundColor = graphStyles[style].borderColor;
        this.footer.style.backgroundColor = graphStyles[style].borderColor;

        this.resize();
    };

    ModalGraphHandler.prototype.configureGraphBar = function (baseIn, graphIn) {
        baseIn = globalGraphs[baseIn];
        graphIn = baseIn.graphs[graphIn];

        var graphData = [], graphLabels = [], style = baseIn.style.toString(), i;

        for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
            graphData[i] = formatDataToUnit(graphDict[graphIn.data][i], baseIn.unit);
            graphLabels[i] = graphDict[graphIn.timestamp][i].format(graphIn.timeDisplay.toString());
        }

        this.cleanCanvas();
        this.drawGraphBar();

        var unitLabel = units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString();
        this.chart.data.datasets[0] = graphStyles[style];
        this.chart.data.datasets[0].label = baseIn.label.toString() + " (" + unitLabel + ")";
        this.chart.data.datasets[0].data = graphData;
        this.chart.data.labels = graphLabels;
        this.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + unitLabel + ")";

        var tickKeys = Object.keys(baseIn.tickOptions);
        for (i = 0; i < tickKeys.length; i++) {
            this.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
        }

        this.chart.update();

        this.headerText.innerHTML = graphIn.title;
        this.header.style.backgroundColor = graphStyles[style].borderColor;
        this.footer.style.backgroundColor = graphStyles[style].borderColor;

        this.resize();
    };

    ModalGraphHandler.prototype.configureGraph = function (val1, val2) {
        var graphType = globalGraphs[val1]["graphType"];
        this.currentGraph = [val1, val2];
        if (graphType === "line") {
            this.configureGraphLine(val1, val2);
        } else if (graphType === "bar") {
            this.configureGraphBar(val1, val2);
        } else {
            console.log("Unrecognised Graph Type");
        }
    };

    ModalGraphHandler.prototype.refresh = function () {
        if (this.currentGraph) {
            this.configureGraph(this.currentGraph[0], this.currentGraph[1]);
        }
    };

    ModalGraphHandler.prototype.resize = function () {
        var size = 0.4;
        if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
            this.canvasDiv.style.width  = (document.documentElement.clientHeight * size * 2).toString() + "px";
            this.canvasDiv.style.height = (document.documentElement.clientHeight * size).toString() + "px";
        } else {
            this.canvasDiv.style.width  = (document.documentElement.clientWidth * size * 2).toString() + "px";
            this.canvasDiv.style.height = (document.documentElement.clientWidth * size).toString() + "px";
        }
        this.chart.resize();
    };

    ModalGraphHandler.prototype.setUp = function () {
        var gKeys = Object.keys(globalGraphs),
            ids = this.config.elementIds || {};

        this.canvas     = document.getElementById(ids.canvas     || "ModalCanvas");
        this.canvasDiv  = document.getElementById(ids.canvasDiv  || "ModalCanvasDiv");
        this.header     = document.getElementById(ids.header     || "graphHeader");
        this.footer     = document.getElementById(ids.footer     || "graphFooter");
        this.headerText = document.getElementById(ids.headerText || "graphHeaderText");

        this.currentGraph = [gKeys[0], Object.keys(globalGraphs[gKeys[0]].graphs)[0]];

        this.drawGraphLine();
    };

    global.ModalGraphHandler = ModalGraphHandler;
})(typeof window !== "undefined" ? window : this);
