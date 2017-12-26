/*jslint plusplus: true, sloppy: true, indent: 4 */

//Globals
var baroGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null
};

function drawBaroGraphLine01() {
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
	baroGraph.chart = new Chart(baroGraph.canvas, {
		type: "line",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function resizeTextBaroG01() {
    parentDiv = baroGraph.canvasDiv.parentElement;
    baroGraph.chart.options.title.fontSize = parentDiv.clientWidth * 0.05;
    baroGraph.chart.options.scales.yAxes[0].scaleLabel.fontSize = parentDiv.clientWidth * 0.05;
    baroGraph.chart.options.scales.yAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.05;
    baroGraph.chart.options.scales.xAxes[0].ticks.fontSize = parentDiv.clientWidth * 0.04;
}

function configureGraphBaroLine01(baseIn, graphIn) {
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
    
    baroGraph.chart.destroy();
    
    //configure as line chart
    drawGraphLine();
    baroGraph.chart.data.datasets[0] = graphStyles[style];
    baroGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    baroGraph.chart.data.datasets[0].data = graphData;
    baroGraph.chart.options.scales.xAxes[0].time.displayFormats.hour = graphIn.timeDisplay.toString();
    baroGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    baroGraph.chart.options.title.text = graphIn.title.toString();
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions);
    for (i = 0; i < tickKeys.length; i++) {
        baroGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    resizeCanvasBaroG01();
    
}

function resizeCanvasBaroG01() {
	//Dynamic Canvas Resizing for desktop
    var ratio = 0.7,
        parentDiv = baroGraph.canvasDiv.parentElement;
    
    //Weird fix for mobile, stops graphs appearing at 1/4 size. No idea why this works. Just roll with it.
    baroGraph.canvasDiv.style.width = "0px";
	baroGraph.canvasDiv.style.height = "0px";
	baroGraph.chart.resize();
	baroGraph.chart.update();
    //Weird fix end.
    
	//Always adjust to the smallest dimention
    baroGraph.canvasDiv.style.width = (parentDiv.clientWidth).toString() + "px";
    baroGraph.canvasDiv.style.height = (parentDiv.clientWidth * ratio * 0.95).toString() + "px";
    
	baroGraph.chart.resize();
    resizeTextBaroG01();
    baroGraph.chart.update();
}

function initializeBaroGraph01() {
	//Initial Funtion Called
	//Define variables
	baroGraph.canvas = document.getElementById('baroGraphCanvas01').getContext("2d", {alpha: false});
	baroGraph.canvasDiv = document.getElementById('baroGraphCanvas01CanvasDiv');
	
	drawBaroGraphLine01();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasBaroG01();
		}, false);
	}
	
	resizeCanvasBaroG01(); //Set canvas size initally 
    checkOffLoaded();
}
