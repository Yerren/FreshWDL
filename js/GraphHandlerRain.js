/*jslint plusplus: true, sloppy: true, indent: 4 */

//Globals
var rainGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null
};

function drawRainGraphBar01() {
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
                    type: 'category'
                }]
			}
		};
	rainGraph.chart = new Chart(rainGraph.canvas, {
		type: "bar",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function resizeTextRainBar01() {
    parentDiv = rainGraph.canvasDiv.parentElement;
    rainGraph.chart.options.title.fontSize = parentDiv.clientWidth * 0.05;
    rainGraph.chart.options.scales.yAxes[0].scaleLabel.fontSize = parentDiv.clientWidth * 0.05;
    rainGraph.chart.options.scales.yAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.05;
    rainGraph.chart.options.scales.xAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.04;
}

function configureGraphRainBar01(baseIn, graphIn) {
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
    
    rainGraph.chart.destroy();
    
    //configure as bar chart
    drawRainGraphBar01();
    
    rainGraph.chart.data.datasets[0] = graphStyles[style];
    rainGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    rainGraph.chart.data.datasets[0].data = graphData;
    rainGraph.chart.data.labels = graphLabels;
    rainGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    rainGraph.chart.options.title.text = graphIn.title.toString();
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions)
    for (i = 0; i < tickKeys.length; i++) {
        rainGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    resizeCanvasRainG01();
    
}

function resizeCanvasRainG01() {
	//Dynamic Canvas Resizing for desktop
    var ratio = 0.7,
        parentDiv = rainGraph.canvasDiv.parentElement;
    
    //Weird fix for mobile, stops graphs appearing at 1/4 size. No idea why this works. Just roll with it. (Isn't needed for this one graph for some reason, but included anyway for safety)
    rainGraph.canvasDiv.style.width = "0px";
	rainGraph.canvasDiv.style.height = "0px";
	rainGraph.chart.resize();
	rainGraph.chart.update();
    //Weird fix end.
    
	//Always adjust to the smallest dimention
    rainGraph.canvasDiv.style.width = (parentDiv.clientWidth).toString() + "px";
    rainGraph.canvasDiv.style.height = (parentDiv.clientWidth * ratio * 0.95).toString() + "px";
    
	rainGraph.chart.resize();
    resizeTextRainBar01();
    rainGraph.chart.update();
}

function initializeRainGraph01() {
	//Initial Funtion Called
	//Define variables
	rainGraph.canvas = document.getElementById('rainGraphCanvas01').getContext("2d", {alpha: false});
	rainGraph.canvasDiv = document.getElementById('rainGraphCanvas01CanvasDiv');
    
	drawRainGraphBar01();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasRainG01();
		}, false);
	}
	
	resizeCanvasRainG01(); //Set canvas size initally
    checkOffLoaded();
}
