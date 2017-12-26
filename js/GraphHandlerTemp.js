/*jslint plusplus: true, sloppy: true, indent: 4 */

//Globals
var tempGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null
};

function drawTempGraphLine01() {
	//Draws the graph
    var options = {
            chartArea: {
                backgroundColor: 'rgba(255, 255, 255, 1)'
            },
            title: {
                display: true,
                text: 'Custom Chart Title'
            },
			scales: {
                display: true,
				yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: null
                    }
				}],
                xAxes: [{
                    type: 'time'
                }]
			}
		};
	tempGraph.chart = new Chart(tempGraph.canvas, {
		type: "line",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function resizeTextTempG01() {
    parentDiv = tempGraph.canvasDiv.parentElement;
    tempGraph.chart.options.title.fontSize = parentDiv.clientWidth * 0.05;
    tempGraph.chart.options.scales.yAxes[0].scaleLabel.fontSize = parentDiv.clientWidth * 0.05;
    tempGraph.chart.options.scales.yAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.05;
    tempGraph.chart.options.scales.xAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.04;
}

function configureGraphTempLine01(baseIn, graphIn) {
    //Display line graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        style = baseIn.style.toString();
    
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = {
            x: graphDict[graphIn.timestamp][i],
            y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit, 2)
        };
    }
    
    tempGraph.chart.destroy();
    
    //configure as line chart
    drawGraphLine();
    tempGraph.chart.data.datasets[0] = graphStyles[style];
    tempGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    tempGraph.chart.data.datasets[0].data = graphData;
    tempGraph.chart.options.scales.xAxes[0].time.displayFormats.hour = graphIn.timeDisplay.toString();
    tempGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    tempGraph.chart.options.title.text = graphIn.title.toString();
    
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions);
    for (i = 0; i < tickKeys.length; i++) {
        tempGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    resizeCanvasTempG01();
}

function resizeCanvasTempG01() {
	//Dynamic Canvas Resizing for desktop
    var ratio = 0.7,
        parentDiv = tempGraph.canvasDiv.parentElement;
    
    //Weird fix for mobile, stops graphs appearing at 1/4 size. No idea why this works. Just roll with it.
    tempGraph.canvasDiv.style.width = "0px";
	tempGraph.canvasDiv.style.height = "0px";
	tempGraph.chart.resize();
	tempGraph.chart.update();
    //Weird fix end.
    
	//Always adjust to the smallest dimention
    tempGraph.canvasDiv.style.width = (parentDiv.clientWidth).toString() + "px";
    tempGraph.canvasDiv.style.height = (parentDiv.clientWidth * ratio * 0.95).toString() + "px";
    
	tempGraph.chart.resize();
    resizeTextTempG01();
    tempGraph.chart.update();
}

function initializeTempGraph01() {
	//Initial Funtion Called
	//Define variables
	tempGraph.canvas = document.getElementById('tempGraphCanvas01').getContext("2d", {alpha: false});
	tempGraph.canvasDiv = document.getElementById('tempGraphCanvas01CanvasDiv');
	
	drawTempGraphLine01();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasTempG01();
		}, false);
	}
	
	resizeCanvasTempG01(); //Set canvas size initally
    checkOffLoaded();
}
