/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var moonSun01 = {
	stage: null,
	canvas: null,
	rectTop: null,
	rectCommand: null,
	rectStrokeCommand: null,
	textDisplaySR: null,
	textDisplaySS: null,
	textDisplayMR: null,
	textDisplayMS: null,
	textDisplayMP: null,
	textDisplayMA: null,
	textTitleSun: null,
	textTitleMoon: null,
	setupVars: {
        strokeSize: null,
		textDisplaySize: null,
		textTitleSize: null
	},
	values: {
        sunRise: 0,
        sunSet: 0,
        moonRise: 0,
        moonSet: 0,
        moonPhase: 0,
        moonAge: 0
	},
    valuesOld: {
        sunRise: 0,
        sunSet: 0,
        moonRise: 0,
        moonSet: 0,
        moonPhase: 0,
        moonAge: 0
	},
    config: {
        canvasID: "MoonSun01"
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function drawMoonSunMS01(sunRiseIn, sunSetIn, moonRiseIn, moonSetIn, moonPhaseIn, moonAgeIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //Check if widget actually needs to be updated
    if (sunRiseIn != moonSun01.valuesOld.sunRiseIn || sunSetIn != moonSun01.valuesOld.sunSetIn || moonRiseIn != moonSun01.valuesOld.moonRiseIn || moonSetIn != moonSun01.valuesOld.moonSetIn || moonPhaseIn != moonSun01.valuesOld.moonPhaseIn || moonAgeIn != moonSun01.valuesOld.moonAgeIn || unitChange === true) {
    
        //Sets inputs to new data
        moonSun01.values.sunRiseIn = sunRiseIn;
        moonSun01.values.sunSetIn = sunSetIn;
        moonSun01.values.moonRiseIn = moonRiseIn;
        moonSun01.values.moonSetIn = moonSetIn;
        moonSun01.values.moonPhaseIn = moonPhaseIn;
        moonSun01.values.moonAgeIn = moonAgeIn;

        //Adjust to units (no units for this widget)

        //Text Displays
        moonSun01.textDisplaySR.text = "Rise: " + moonSun01.values.sunRiseIn;
        moonSun01.textDisplaySS.text = "Set: " + moonSun01.values.sunSetIn;
        moonSun01.textDisplayMR.text = "Rise: " + moonSun01.values.moonRiseIn;
        moonSun01.textDisplayMS.text = "Set: " + moonSun01.values.moonSetIn;
        moonSun01.textDisplayMP.text = "Phase: " + moonSun01.values.moonPhaseIn + "%";
        moonSun01.textDisplayMA.text = "Age: " + moonSun01.values.moonAgeIn;
    }
    
    moonSun01.valuesOld.sunRiseIn = sunRiseIn;
    moonSun01.valuesOld.sunSetIn = sunSetIn;
    moonSun01.valuesOld.moonRiseIn = moonRiseIn;
    moonSun01.valuesOld.moonSetIn = moonSetIn;
    moonSun01.valuesOld.moonPhaseIn = moonPhaseIn;
    moonSun01.valuesOld.moonAgeIn = moonAgeIn;
    
}

function updateTopMS01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    moonSun01.setupVars.rectWidth = moonSun01.canvas.width * 0.9;
    moonSun01.setupVars.rectHeight = moonSun01.canvas.height * 0.9;
    moonSun01.setupVars.rectCornerRad = moonSun01.canvas.height * 0.1;
    moonSun01.setupVars.strokeSize = moonSun01.canvas.width / 40;
    moonSun01.setupVars.textDisplaySize = moonSun01.canvas.height / 10;
    moonSun01.setupVars.textTitleSize = moonSun01.canvas.height / 9;

    moonSun01.setupVars.posRect = {
        x: (moonSun01.canvas.width - moonSun01.setupVars.rectWidth) / 2,
        y: (moonSun01.canvas.height - moonSun01.setupVars.rectHeight) / 2
    };
    moonSun01.setupVars.posTitleSun = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (13 / 100))
    };
    moonSun01.setupVars.posTitleMoon = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (47 / 100))
    };
    moonSun01.setupVars.posTextSR = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (23 / 100))
    };
    moonSun01.setupVars.posTextSS = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (33 / 100))
    };
    moonSun01.setupVars.posTextMR = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (57 / 100))
    };
    moonSun01.setupVars.posTextMS = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (67 / 100))
    };
    moonSun01.setupVars.posTextMP = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (77 / 100))
    };
    moonSun01.setupVars.posTextMA = {
        x: sharpenValue(moonSun01.canvas.width * (1 / 2)),
        y: sharpenValue(moonSun01.canvas.height * (87 / 100))
    };
    
	//Update the visual elements
    
	//Top
	moonSun01.rectStrokeCommand.width = moonSun01.setupVars.strokeSize;
	moonSun01.rectCommand.x = moonSun01.setupVars.posRect.x;
	moonSun01.rectCommand.y = moonSun01.setupVars.posRect.y;
	moonSun01.rectCommand.w = moonSun01.setupVars.rectWidth;
	moonSun01.rectCommand.h = moonSun01.setupVars.rectHeight;
	moonSun01.rectCommand.radiusTR = moonSun01.rectCommand.radiusTL = moonSun01.rectCommand.radiusBR = moonSun01.rectCommand.radiusBL = moonSun01.setupVars.rectCornerRad;
	
    //Text Titles
	moonSun01.textTitleSun.x = moonSun01.setupVars.posTitleSun.x;
	moonSun01.textTitleSun.y = moonSun01.setupVars.posTitleSun.y;
	moonSun01.textTitleSun.font = "bold " + moonSun01.setupVars.textTitleSize + "px arial";
    
	moonSun01.textTitleMoon.x = moonSun01.setupVars.posTitleMoon.x;
	moonSun01.textTitleMoon.y = moonSun01.setupVars.posTitleMoon.y;
	moonSun01.textTitleMoon.font = "bold " + moonSun01.setupVars.textTitleSize + "px arial";
    
	//Text Displays
	moonSun01.textDisplaySR.x = moonSun01.setupVars.posTextSR.x;
	moonSun01.textDisplaySR.y = moonSun01.setupVars.posTextSR.y;
	moonSun01.textDisplaySR.font = "bold " + moonSun01.setupVars.textDisplaySize + "px arial";
    
    moonSun01.textDisplaySS.x = moonSun01.setupVars.posTextSS.x;
	moonSun01.textDisplaySS.y = moonSun01.setupVars.posTextSS.y;
	moonSun01.textDisplaySS.font = "bold " + moonSun01.setupVars.textDisplaySize + "px arial";
    
    moonSun01.textDisplayMR.x = moonSun01.setupVars.posTextMR.x;
	moonSun01.textDisplayMR.y = moonSun01.setupVars.posTextMR.y;
	moonSun01.textDisplayMR.font = "bold " + moonSun01.setupVars.textDisplaySize + "px arial";
    
    moonSun01.textDisplayMS.x = moonSun01.setupVars.posTextMS.x;
	moonSun01.textDisplayMS.y = moonSun01.setupVars.posTextMS.y;
	moonSun01.textDisplayMS.font = "bold " + moonSun01.setupVars.textDisplaySize + "px arial";
    
    moonSun01.textDisplayMP.x = moonSun01.setupVars.posTextMP.x;
	moonSun01.textDisplayMP.y = moonSun01.setupVars.posTextMP.y;
	moonSun01.textDisplayMP.font = "bold " + moonSun01.setupVars.textDisplaySize + "px arial";
    
    moonSun01.textDisplayMA.x = moonSun01.setupVars.posTextMA.x;
	moonSun01.textDisplayMA.y = moonSun01.setupVars.posTextMA.y;
	moonSun01.textDisplayMA.font = "bold " + moonSun01.setupVars.textDisplaySize + "px arial";
}

function resizeCanvasMS01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = moonSun01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    moonSun01.canvas.width = parentDiv.clientHeight;
    moonSun01.canvas.height = parentDiv.clientHeight;

	//Update shapes according to new dimentions
	updateTopMS01();
}


function setUpMS01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	moonSun01.rectTop = new createjs.Shape();
	moonSun01.rectTop.snapToPixel = true;
	moonSun01.rectTop.graphics.beginStroke("black");
	moonSun01.rectTop.graphics.beginFill("#F6F6F6");
	moonSun01.rectStrokeCommand = moonSun01.rectTop.graphics.setStrokeStyle(0).command;
	moonSun01.rectCommand = moonSun01.rectTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	moonSun01.stage.addChild(moonSun01.rectTop);
    
	//Set up text displays
	moonSun01.textDisplaySR = new createjs.Text("Rise: 24:59", "0px Arial", "black");
	moonSun01.textDisplaySR.textBaseline = "middle";
	moonSun01.textDisplaySR.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textDisplaySR);
    
    moonSun01.textDisplaySS = new createjs.Text("Set: 24:59", "0px Arial", "black");
	moonSun01.textDisplaySS.textBaseline = "middle";
	moonSun01.textDisplaySS.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textDisplaySS);
    
    moonSun01.textDisplayMR = new createjs.Text("Rise: 24:59", "0px Arial", "black");
	moonSun01.textDisplayMR.textBaseline = "middle";
	moonSun01.textDisplayMR.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textDisplayMR);
    
    moonSun01.textDisplayMS = new createjs.Text("Set: 24:59", "0px Arial", "black");
	moonSun01.textDisplayMS.textBaseline = "middle";
	moonSun01.textDisplayMS.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textDisplayMS);
    
    moonSun01.textDisplayMP = new createjs.Text("100%", "0px Arial", "black");
	moonSun01.textDisplayMP.textBaseline = "middle";
	moonSun01.textDisplayMP.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textDisplayMP);
    
    moonSun01.textDisplayMA = new createjs.Text("33", "0px Arial", "black");
	moonSun01.textDisplayMA.textBaseline = "middle";
	moonSun01.textDisplayMA.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textDisplayMA);
    
    //Set up text titles
	moonSun01.textTitleSun = new createjs.Text("Sun", "0px Arial", "black");
	moonSun01.textTitleSun.textBaseline = "middle";
	moonSun01.textTitleSun.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textTitleSun);
    
    //Set up text titles
	moonSun01.textTitleMoon = new createjs.Text("Moon", "0px Arial", "black");
	moonSun01.textTitleMoon.textBaseline = "middle";
	moonSun01.textTitleMoon.textAlign = "center";
	moonSun01.stage.addChild(moonSun01.textTitleMoon);
}

function initializeMoonSunMS01() {
	//The first function that is called
	//Define canvas and stage varaibles
	moonSun01.canvas = document.getElementById(moonSun01.config.canvasID.toString());
	moonSun01.stage = new createjs.Stage(moonSun01.canvas);
    
    //Creates information tooltip (none for this widget)
    //new Opentip(moonSun01.canvas, "Information",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpMS01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasMS01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasMS01();
    
    checkOffLoaded();
}