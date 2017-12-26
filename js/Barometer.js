/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var barometer01 = {
	stage: null,
	canvas: null,
	rectTop: null,
	rectCommand: null,
	rectStrokeCommand: null,
	textDisplayP: null,
	textDisplayRate: null,
	textDisplayT: null,
	textTitleBarometer: null,
	setupVars: {
        strokeSize: null,
		textDisplaySize: null,
		textTitleSize: null
	},
	values: {
        pressure: 0,
        trend: 0
	},
    valuesOld: {
        pressure: 0,
        trend: 0
	},
    config: {
        canvasID: "Barometer01",
        unitsIn: "pressure"
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function drawBarometerB01(pressureIn, trendIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //Check if widget actually needs to be updated
    if (pressureIn != barometer01.valuesOld.pressure || trendIn != barometer01.valuesOld.trend || unitChange === true) {
    
        //Sets inputs to new data
        barometer01.values.pressure = pressureIn;
        barometer01.values.trend = trendIn;

        //Adjust to units
        barometer01.values.pressure = formatDataToUnit(barometer01.values.pressure, barometer01.config.unitsIn, 2);
        barometer01.values.trend = formatDataToUnit(barometer01.values.trend, barometer01.config.unitsIn, 2, true);

        //Text Displays
        barometer01.textDisplayP.text = barometer01.values.pressure + units[barometer01.config.unitsIn.toString()][currentUnits[barometer01.config.unitsIn.toString()]][1].toString();
        
        //check if trend value is 0 or -0, and display "steady" if it is.
        if (parseFloat(barometer01.values.trend) != 0.0) {
            barometer01.textDisplayT.text = barometer01.values.trend + units[barometer01.config.unitsIn.toString()][currentUnits[barometer01.config.unitsIn.toString()]][1].toString() + "/hr";
        } else {
            barometer01.textDisplayT.text = "Steady";
        }
        
        barometer01.valuesOld.pressure = pressureIn;
        barometer01.valuesOld.trend = trendIn;
    }
    
}

function updateTopB01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    barometer01.setupVars.rectWidth = barometer01.canvas.width * 0.9;
    barometer01.setupVars.rectHeight = barometer01.canvas.height * 0.70;
    barometer01.setupVars.rectCornerRad = barometer01.canvas.height * 0.1;
    barometer01.setupVars.strokeSize = barometer01.canvas.width / 40;
    barometer01.setupVars.textDisplaySize = barometer01.canvas.width * 0.125;
    barometer01.setupVars.textRateSize = barometer01.canvas.width * 0.14;
    barometer01.setupVars.textTitleSize = barometer01.canvas.width * 0.19;
    barometer01.setupVars.edgeGap = (barometer01.canvas.width - barometer01.setupVars.rectWidth) / 2;

    barometer01.setupVars.posRect = {
        x: barometer01.setupVars.edgeGap,
        y: barometer01.canvas.height - barometer01.setupVars.rectHeight - barometer01.setupVars.edgeGap //ensures edge gap is same at bottom of canvas
    };
    barometer01.setupVars.posTitleBarometer = {
        x: sharpenValue(barometer01.canvas.width * (1 / 2)),
        y: sharpenValue(barometer01.canvas.height * (13 / 100))
    };
    barometer01.setupVars.posTextP = {
        x: sharpenValue(barometer01.canvas.width * (1 / 2)),
        y: sharpenValue(barometer01.canvas.height * (40 / 100))
    };
    barometer01.setupVars.posTextRate = {
        x: sharpenValue(barometer01.canvas.width * (1 / 2)),
        y: sharpenValue(barometer01.canvas.height * (60 / 100))
    };
    barometer01.setupVars.posTextT = {
        x: sharpenValue(barometer01.canvas.width * (1 / 2)),
        y: sharpenValue(barometer01.canvas.height * (75 / 100))
    };
    //Update the visual elements
    
	//Top
	barometer01.rectStrokeCommand.width = barometer01.setupVars.strokeSize;
	barometer01.rectCommand.x = barometer01.setupVars.posRect.x;
	barometer01.rectCommand.y = barometer01.setupVars.posRect.y;
	barometer01.rectCommand.w = barometer01.setupVars.rectWidth;
	barometer01.rectCommand.h = barometer01.setupVars.rectHeight;
	barometer01.rectCommand.radiusTR = barometer01.rectCommand.radiusTL = barometer01.rectCommand.radiusBR = barometer01.rectCommand.radiusBL = barometer01.setupVars.rectCornerRad;
	
    //Text Titles
	barometer01.textTitleBarometer.x = barometer01.setupVars.posTitleBarometer.x;
	barometer01.textTitleBarometer.y = barometer01.setupVars.posTitleBarometer.y;
	barometer01.textTitleBarometer.font = "bold " + barometer01.setupVars.textTitleSize + "px arial";
    
	//Text Displays
	barometer01.textDisplayP.x = barometer01.setupVars.posTextP.x;
	barometer01.textDisplayP.y = barometer01.setupVars.posTextP.y;
	barometer01.textDisplayP.font = "bold " + barometer01.setupVars.textDisplaySize + "px arial";
    
    barometer01.textDisplayRate.x = barometer01.setupVars.posTextRate.x;
	barometer01.textDisplayRate.y = barometer01.setupVars.posTextRate.y;
	barometer01.textDisplayRate.font = "bold " + barometer01.setupVars.textRateSize + "px arial";
    
    barometer01.textDisplayT.x = barometer01.setupVars.posTextT.x;
	barometer01.textDisplayT.y = barometer01.setupVars.posTextT.y;
	barometer01.textDisplayT.font = "bold " + barometer01.setupVars.textDisplaySize + "px arial";
}

function resizeCanvasB01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = barometer01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    barometer01.canvas.width = parentDiv.clientHeight * 0.3;
    barometer01.canvas.height = parentDiv.clientHeight * 0.3;

	//Update shapes according to new dimentions
	updateTopB01();
}


function setUpB01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	barometer01.rectTop = new createjs.Shape();
	barometer01.rectTop.snapToPixel = true;
	barometer01.rectTop.graphics.beginStroke("black");
	barometer01.rectTop.graphics.beginFill("#F6F6F6");
	barometer01.rectStrokeCommand = barometer01.rectTop.graphics.setStrokeStyle(0).command;
	barometer01.rectCommand = barometer01.rectTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	barometer01.stage.addChild(barometer01.rectTop);
    
	//Set up text displays
	barometer01.textDisplayP = new createjs.Text("", "0px Arial", "black");
	barometer01.textDisplayP.textBaseline = "middle";
	barometer01.textDisplayP.textAlign = "center";
	barometer01.stage.addChild(barometer01.textDisplayP);
    
    barometer01.textDisplayRate = new createjs.Text("Rate:", "0px Arial", "black");
	barometer01.textDisplayRate.textBaseline = "middle";
	barometer01.textDisplayRate.textAlign = "center";
	barometer01.stage.addChild(barometer01.textDisplayRate);
    
    barometer01.textDisplayT = new createjs.Text("Rate:", "0px Arial", "black");
	barometer01.textDisplayT.textBaseline = "middle";
	barometer01.textDisplayT.textAlign = "center";
	barometer01.stage.addChild(barometer01.textDisplayT);
    
    //Set up text titles
	barometer01.textTitleBarometer = new createjs.Text("Barometer", "0px Arial", "black");
	barometer01.textTitleBarometer.textBaseline = "middle";
	barometer01.textTitleBarometer.textAlign = "center";
	barometer01.stage.addChild(barometer01.textTitleBarometer);
}

function initializeBarometerB01() {
	//The first function that is called
	//Define canvas and stage varaibles
	barometer01.canvas = document.getElementById(barometer01.config.canvasID.toString());
	barometer01.stage = new createjs.Stage(barometer01.canvas);
    
    //Creates information tooltip
    new Opentip(barometer01.canvas, "The weight of the air, adjusted for the station's altitude.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpB01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasB01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasB01();
    
    checkOffLoaded();
}