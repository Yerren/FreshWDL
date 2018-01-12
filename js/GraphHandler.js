/*jslint plusplus: true, sloppy: true, indent: 4 */

//Globals
var modalGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null,
    header: null,
    footer: null,
    headerText: null,
    currentGraph: null
};

function drawGraphLine() {
	//Draws the graph
    var options = {
            chartArea: {
                backgroundColor: 'rgba(255, 255, 255, 1)'
            },
			scales: {
                display: true,
				yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: null,
                        fontSize: 20
                    }
				}],
                xAxes: [{
                    type: 'time'
                }]
			},
            legend: {
                display: false
            }
        
		};
	modalGraph.chart = new Chart(modalGraph.canvas.getContext("2d", {alpha: false}), {
		type: "line",
		data: {
			datasets: []
		},
		options: options
	});
}

function drawGraphBar() {
	//Draws the graph
    var options = {
            chartArea: {
                backgroundColor: 'rgba(255, 255, 255, 1)'
            },
			scales: {
                display: true,
				yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: null,
                        fontSize: 20
                    }
				}],
                xAxes: [{
                    type: 'category'
                }]
			}
		};
	modalGraph.chart = new Chart(modalGraph.canvas.getContext("2d", {alpha: false}), {
		type: "bar",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function cleanCanvas() {
    var newCanvas = document.createElement("CANVAS"),
        newID = modalGraph.canvas.id;
    newCanvas.id = newID;
    modalGraph.canvasDiv.removeChild(modalGraph.canvas);
    modalGraph.canvasDiv.innerHTML = "";
    modalGraph.canvasDiv.appendChild(newCanvas);
    modalGraph.canvas = newCanvas;
}

function configureGraphLine(baseIn, graphIn) {
    //Display line graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        style = baseIn.style.toString(),
        multipleSets = false;
    
    //if 2 dataSets
    if (graphIn.data.length > 1) {
        var graphData2 = [],
            style2 = graphIn.additionalStyles.toString(),
            multipleSets = true;
    }
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = {
            x: graphDict[graphIn.timestamp][i],
            y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit, 2)
        };
        //if 2 dataSets
        if (multipleSets == true) {
            graphData2[i] = {
                x: graphDict[graphIn.timestamp][i],
                y: formatDataToUnit(graphDict[graphIn.data[1]][i], baseIn.unit, 2)
            };
        }
    }
    
    cleanCanvas();
    
    //configure as line chart
    drawGraphLine();
    modalGraph.chart.data.datasets[0] = graphStyles[style];
    modalGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    modalGraph.chart.data.datasets[0].data = graphData;
    modalGraph.chart.options.scales.xAxes[0].time.displayFormats.hour = graphIn.timeDisplay.toString();
    modalGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    //if 2 dataSets
    if (multipleSets == true) {
        modalGraph.chart.data.datasets[1] = graphStyles[style2];
        modalGraph.chart.data.datasets[0].label = graphIn.legendLabels[0] + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
        modalGraph.chart.data.datasets[1].label = graphIn.legendLabels[1] + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
        modalGraph.chart.data.datasets[1].data = graphData2;
    }
    
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions);
    for (i = 0; i < tickKeys.length; i++) {
        modalGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    //configure legend
    var legendKeys = Object.keys(graphIn.legendOptions);
    for (i = 0; i < tickKeys.length; i++) {
        modalGraph.chart.options.legend[legendKeys[i]] = graphIn.legendOptions[legendKeys[i]];
    }
    
    
    modalGraph.chart.update();
    
    //update modal header and footer
    modalGraph.headerText.innerHTML = graphIn.title;
    modalGraph.header.style.backgroundColor = graphStyles[style].borderColor;
    modalGraph.footer.style.backgroundColor = graphStyles[style].borderColor;
    
    resizeCanvasModG01();
}

function configureGraphBar(baseIn, graphIn) {
    //Display bar graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        graphLabels = [],
        style = baseIn.style.toString();   
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = formatDataToUnit(graphDict[graphIn.data][i], baseIn.unit, 2);
        graphLabels[i] = graphDict[graphIn.timestamp][i].format(graphIn.timeDisplay.toString());
    }
    
    cleanCanvas();
    
    //configure as bar chart
    drawGraphBar();
    
    modalGraph.chart.data.datasets[0] = graphStyles[style];
    modalGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    modalGraph.chart.data.datasets[0].data = graphData;
    modalGraph.chart.data.labels = graphLabels;
    modalGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions)
    for (i = 0; i < tickKeys.length; i++) {
        modalGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    
    modalGraph.chart.update();
    
    //update modal header and footer
    modalGraph.headerText.innerHTML = graphIn.title;
    modalGraph.header.style.backgroundColor = graphStyles[style].borderColor;
    modalGraph.footer.style.backgroundColor = graphStyles[style].borderColor;
    
    resizeCanvasModG01();
}

function configureGraph(val1, val2) {
    //calls the appropriate configure graph function
    var graphType = globalGraphs[val1]["graphType"];
    modalGraph.currentGraph = [val1, val2];
    if (graphType == "line") {
        configureGraphLine(val1, val2);
    } else if (graphType == "bar") {
        configureGraphBar(val1, val2);
    } else {
        console.log("Unrecognised Graph Type");
    }
}

function resizeCanvasModG01() {
	//Dynamic Canvas Resizing for desktop
	var size = 0.4;
	//Always adjust to the smallest dimention
	if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
		modalGraph.canvasDiv.style.width = (document.documentElement.clientHeight * size * 2).toString() + "px";
		modalGraph.canvasDiv.style.height = (document.documentElement.clientHeight * size).toString() + "px";
	} else {
		modalGraph.canvasDiv.style.width = (document.documentElement.clientWidth * size * 2).toString() + "px";
		modalGraph.canvasDiv.style.height = (document.documentElement.clientWidth * size).toString() + "px";
	}
		
	modalGraph.chart.resize();
}

function initializeModalGraph01() {
	//Initial Funtion Called
	//Define variables
	modalGraph.canvas = document.getElementById('ModalCanvas');
	modalGraph.canvasDiv = document.getElementById('ModalCanvasDiv');
    modalGraph.header = document.getElementById("graphHeader");
    modalGraph.footer = document.getElementById("graphFooter");
    modalGraph.headerText = document.getElementById("graphHeaderText");
    modalGraph.currentGraph = ["barometer", "hourlyDay"];
	
	drawGraphLine();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasModG01();
		}, false);
	}
	
	resizeCanvasModG01(); //Set canvas size initally
    
    checkOffLoaded();
}
