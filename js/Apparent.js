/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var apparent01 = {
	stage: null,
	canvas: null,
	rectTop: null,
	rectCommand: null,
	rectStrokeCommand: null,
	textDisplayT: null,
	textTitleApparent: null,
	setupVars: {
        strokeSize: null,
		textDisplaySize: null,
		textTitleSize: null
	},
	values: {
        temp: 0
	},
    valuesOld: {
        temp: 0
	},
    config: {
        canvasID: "Apparent01",
        unitsIn: "temp"
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function drawApparentA01(tempIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //Check if widget actually needs to be updated
    if (tempIn != apparent01.valuesOld.temp || unitChange === true) {
    
        //Sets inputs to new data
        apparent01.values.temp = tempIn;

        //Adjust to units
        apparent01.values.temp = formatDataToUnit(apparent01.values.temp, apparent01.config.unitsIn, 2);

        //Text Displays
        apparent01.textDisplayT.text = apparent01.values.temp + units[apparent01.config.unitsIn.toString()][currentUnits[apparent01.config.unitsIn.toString()]][1].toString();
        
        apparent01.valuesOld.temp = tempIn;
    }
    
}

function updateTopA01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    apparent01.setupVars.rectWidth = apparent01.canvas.width * 0.9;
    apparent01.setupVars.rectHeight = apparent01.canvas.height * 0.4;
    apparent01.setupVars.rectCornerRad = apparent01.canvas.height * 0.1;
    apparent01.setupVars.strokeSize = apparent01.canvas.width / 40;
    apparent01.setupVars.textDisplaySize = apparent01.canvas.width * 0.15;
    apparent01.setupVars.textTitleSize = apparent01.canvas.width * 0.19;
    apparent01.setupVars.edgeGap = (apparent01.canvas.width - apparent01.setupVars.rectWidth) / 2;

    apparent01.setupVars.posRect = {
        x: apparent01.setupVars.edgeGap,
        y: apparent01.canvas.height - apparent01.setupVars.rectHeight - apparent01.setupVars.edgeGap //ensures edge gap is same at bottom of canvas
    };
    apparent01.setupVars.posTitleApparent = {
        x: sharpenValue(apparent01.canvas.width * (1 / 2)),
        y: sharpenValue(apparent01.canvas.height * (20 / 100))
    };
    apparent01.setupVars.posTextT = {
        x: sharpenValue(apparent01.canvas.width * (1 / 2)),
        y: sharpenValue(apparent01.canvas.height * (71 / 100))
    };
    //Update the visual elements
    
	//Top
	apparent01.rectStrokeCommand.width = apparent01.setupVars.strokeSize;
	apparent01.rectCommand.x = apparent01.setupVars.posRect.x;
	apparent01.rectCommand.y = apparent01.setupVars.posRect.y;
	apparent01.rectCommand.w = apparent01.setupVars.rectWidth;
	apparent01.rectCommand.h = apparent01.setupVars.rectHeight;
	apparent01.rectCommand.radiusTR = apparent01.rectCommand.radiusTL = apparent01.rectCommand.radiusBR = apparent01.rectCommand.radiusBL = apparent01.setupVars.rectCornerRad;
	
    //Text Titles
	apparent01.textTitleApparent.x = apparent01.setupVars.posTitleApparent.x;
	apparent01.textTitleApparent.y = apparent01.setupVars.posTitleApparent.y;
	apparent01.textTitleApparent.font = "bold " + apparent01.setupVars.textTitleSize + "px arial";
    
	//Text Displays
	apparent01.textDisplayT.x = apparent01.setupVars.posTextT.x;
	apparent01.textDisplayT.y = apparent01.setupVars.posTextT.y;
	apparent01.textDisplayT.font = "bold " + apparent01.setupVars.textDisplaySize + "px arial";
}

function resizeCanvasA01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = apparent01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    apparent01.canvas.width = parentDiv.clientHeight * 0.3;
    apparent01.canvas.height = parentDiv.clientHeight * 0.17;

	//Update shapes according to new dimentions
	updateTopA01();
}


function setUpA01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	apparent01.rectTop = new createjs.Shape();
	apparent01.rectTop.snapToPixel = true;
	apparent01.rectTop.graphics.beginStroke("black");
	apparent01.rectTop.graphics.beginFill("#F6F6F6");
	apparent01.rectStrokeCommand = apparent01.rectTop.graphics.setStrokeStyle(0).command;
	apparent01.rectCommand = apparent01.rectTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	apparent01.stage.addChild(apparent01.rectTop);
    
	//Set up text displays
	apparent01.textDisplayT = new createjs.Text("", "0px Arial", "black");
	apparent01.textDisplayT.textBaseline = "middle";
	apparent01.textDisplayT.textAlign = "center";
	apparent01.stage.addChild(apparent01.textDisplayT);
    
    //Set up text titles
	apparent01.textTitleApparent = new createjs.Text("Apparent", "0px Arial", "black");
	apparent01.textTitleApparent.textBaseline = "middle";
	apparent01.textTitleApparent.textAlign = "center";
	apparent01.stage.addChild(apparent01.textTitleApparent);
}

function initializeApparentA01() {
	//The first function that is called
	//Define canvas and stage varaibles
	apparent01.canvas = document.getElementById(apparent01.config.canvasID.toString());
	apparent01.stage = new createjs.Stage(apparent01.canvas);
    
    //Creates information tooltip
    new Opentip(apparent01.canvas, "Perceived temperature based on temperature, humidity, sun, and wind.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpA01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasA01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasA01();
    
    checkOffLoaded();
}