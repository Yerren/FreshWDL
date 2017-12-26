/*jslint plusplus: true, sloppy: true, indent: 4 */

//Globals
var windGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null
};

function drawWindGraphLine01() {
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
	windGraph.chart = new Chart(windGraph.canvas, {
		type: "line",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function resizeTextWindG01() {
    parentDiv = windGraph.canvasDiv.parentElement;
    windGraph.chart.options.title.fontSize = parentDiv.clientWidth * 0.05;
    windGraph.chart.options.scales.yAxes[0].scaleLabel.fontSize = parentDiv.clientWidth * 0.05;
    windGraph.chart.options.scales.yAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.05;
    windGraph.chart.options.scales.xAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.04;
}

function configureGraphWindLine01(baseIn, graphIn) {
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
    
    windGraph.chart.destroy();
    
    //configure as line chart
    drawGraphLine();
    windGraph.chart.data.datasets[0] = graphStyles[style];
    windGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    windGraph.chart.data.datasets[0].data = graphData;
    windGraph.chart.options.scales.xAxes[0].time.displayFormats.hour = graphIn.timeDisplay.toString();
    windGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    windGraph.chart.options.title.text = graphIn.title.toString();
    
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions);
    for (i = 0; i < tickKeys.length; i++) {
        windGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    resizeCanvasWindG01();
}

function resizeCanvasWindG01() {
	//Dynamic Canvas Resizing for desktop
    var ratio = 0.7,
        parentDiv = windGraph.canvasDiv.parentElement;
    
    //Weird fix for mobile, stops graphs appearing at 1/4 size. No idea why this works. Just roll with it.
    windGraph.canvasDiv.style.width = "0px";
	windGraph.canvasDiv.style.height = "0px";
	windGraph.chart.resize();
	windGraph.chart.update();
    //Weird fix end.
    
	//Always adjust to the smallest dimention
    windGraph.canvasDiv.style.width = (parentDiv.clientWidth).toString() + "px";
    windGraph.canvasDiv.style.height = (parentDiv.clientWidth * ratio * 0.95).toString() + "px";
    
	windGraph.chart.resize();
    resizeTextWindG01();
    windGraph.chart.update();
}

function initializeWindGraph01() {
	//Initial Funtion Called
	//Define variables
	windGraph.canvas = document.getElementById('windGraphCanvas01').getContext("2d", {alpha: false});
	windGraph.canvasDiv = document.getElementById('windGraphCanvas01CanvasDiv');
	
	drawWindGraphLine01();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWindG01();
		}, false);
	}
	
	resizeCanvasWindG01(); //Set canvas size initally
    checkOffLoaded();
}
