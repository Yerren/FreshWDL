/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var status01 = {
	stage: null,
	canvas: null,
    blankBlinkColour: null,
	circle: null,
    circColourCommand: null,
	circCommand: null,
	circStrokeCommand: null,
	textDisplayS: null,
	textDisplayD: null,
    blinkColour: null,
	setupVars: {
        circRad: null,
        strokeSize: null,
		textDisplaySize: null,
        edgeGap: null
	},
    tweens: {
        circRad: {
            percent: 0
        }
    },
	values: {
        status: null,
        dataStatus: null,
        lastSuccessTime: null
	},
    valuesOld: {
        status: null,
        dataStatus: null
	},
    config: {
        canvasID: "Status01"
    }
};

function checkDataStatus() {
    //Checks if sucessful data was found
    if (dataCollectErrorCR === true && dataCollectErrorCRE === true && dataCollectErrorCRD === true && dataCollectErrorCRH === true) {
        //Partial Error
        return ["Full Error", moment().format("HH:mm:ss")];
    } else if ((dataCollectErrorCR === true || dataCollectErrorCRE === true || dataCollectErrorCRD === true || dataCollectErrorCRH === true) && noDataChanged === true) {
        //Partial Error
        return ["Partial Error, No New Data", moment().format("HH:mm:ss")];
    } else if (dataCollectErrorCR === true || dataCollectErrorCRE === true || dataCollectErrorCRD === true || dataCollectErrorCRH === true) {
        //Partial Error
        return ["Partial Error, New Data", moment().format("HH:mm:ss")];
    } else if (noDataChanged === true) {
        //No New Data
        return ["No New Data", moment().format("HH:mm:ss")];
    } else {
        //No Errors
        return ["Normal", moment().format("HH:mm:ss")];
    }
}

function drawStatusS01(statusIn) {
    //Is called when new data is sent.
    
    var dataStatusIn = checkDataStatus();
    
    //The one widget which doesn't need to be checked if widget actually needs to be updated (Breaks it if you do)
    
    //Sets inputs to new data
    status01.values.status = statusIn.replace(/_/g, " ");
    //Format Data Status, and set blink colour
    if (dataStatusIn[0] == "Full Error") {
        status01.values.dataStatus = "No data since: " + status01.values.lastSuccessTime.toString();
        status01.blinkColour = "rgba(209, 32, 32, 0.4)"; //Same as high temp
    } else if (dataStatusIn[0] == "Partial Error, New Data") {
        status01.values.dataStatus = "New data received at: " + dataStatusIn[1];
        status01.values.lastSuccessTime = dataStatusIn[1];
        status01.blinkColour = "rgba(234, 242, 45, 0.9)"; //Same as UV
    } else if (dataStatusIn[0] == "Partial Error, No New Data") {
        status01.blinkColour = "rgba(234, 242, 45, 0.9)"; //Same as UV
    } else if (dataStatusIn[0] == "No New Data") {
        status01.blinkColour = status01.blankBlinkColour;
    } else if (dataStatusIn[0] == "Normal") {
        status01.values.dataStatus = "New data received at: " + dataStatusIn[1];
        status01.values.lastSuccessTime = dataStatusIn[1];
        status01.blinkColour = "rgba(23, 145, 27, 0.4)"; //Same as wind direction
    } else {
        console.log("Invalid dataStatus");
    }

    //Text Displays
    status01.textDisplayS.text = status01.values.status;
    status01.textDisplayD.text = status01.values.dataStatus;

    status01.valuesOld.status = statusIn;
    status01.valuesOld.dataStatus = dataStatusIn;
    
}

function updateTweensS01() {
    //Updates any tweened or changing objects. This is called every frame
    if (status01.tweens.circRad.percent < 0.01) {
    	status01.circStrokeCommand.width = 0; //fix for glitching effect
        status01.circCommand.radius = 0;
        status01.circColourCommand.style = status01.blinkColour; //Only change colour when not visable
    } else {
        status01.circStrokeCommand.width = status01.setupVars.strokeSize * Math.pow((status01.tweens.circRad.percent / 100), 2); //fix for glitching effect
    	status01.circCommand.radius = status01.setupVars.circRad * (status01.tweens.circRad.percent / 100);
    }
    
}

function updateTopS01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    status01.setupVars.circRad = status01.canvas.height * 0.2;
    status01.setupVars.strokeSize = status01.canvas.height * 0.2;
    status01.setupVars.textDisplaySize = status01.canvas.height * 0.4;
    status01.setupVars.edgeGap = (status01.canvas.height - status01.setupVars.circRad) / 4;
    
    status01.setupVars.posCirc = {
        x: status01.setupVars.circRad + status01.setupVars.edgeGap,
        y: status01.canvas.height / 2
    };
    status01.setupVars.posTextD = {
        x: sharpenValue((status01.setupVars.circRad + status01.setupVars.edgeGap) * (2)),
        y: sharpenValue(status01.canvas.height * (47 / 100 ))
    };
    status01.setupVars.posTextS = {
        x: sharpenValue((status01.setupVars.circRad + status01.setupVars.edgeGap) * (2)),
        y: sharpenValue(status01.canvas.height * (53 / 100))
    };
    //Update the visual elements
    
	//Circle
    status01.circStrokeCommand.width = status01.setupVars.strokeSize;
	status01.circCommand.x = status01.setupVars.posCirc.x;
	status01.circCommand.y = status01.setupVars.posCirc.y;
    
	//Text Displays
	status01.textDisplayS.x = status01.setupVars.posTextS.x;
	status01.textDisplayS.y = status01.setupVars.posTextS.y;
	status01.textDisplayS.font = status01.setupVars.textDisplaySize + "px arial";
    
    status01.textDisplayD.x = status01.setupVars.posTextD.x;
	status01.textDisplayD.y = status01.setupVars.posTextD.y;
	status01.textDisplayD.font = status01.setupVars.textDisplaySize + "px arial";
}

function resizeCanvasS01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = status01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    status01.canvas.width = parentDiv.clientHeight * 6.19;
    status01.canvas.height = parentDiv.clientHeight * 0.4; // 0.4 to match with forcast div

	//Update shapes according to new dimentions
	updateTopS01();
}


function setUpS01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up status circle
    status01.blankBlinkColour = "rgba(100, 100, 100, 0.4)";
	status01.circle  = new createjs.Shape();
	status01.circle.snapToPixel = true;
	status01.circColourCommand = status01.circle.graphics.beginStroke(status01.blankBlinkColour).command;
	status01.circStrokeCommand = status01.circle.graphics.setStrokeStyle(0).command;
	status01.circCommand = status01.circle.graphics.drawCircle(0, 0, 0).command;
	status01.stage.addChild(status01.circle);
    
	//Set up text displays
	status01.textDisplayS = new createjs.Text("", "0px Arial", "black");
	status01.textDisplayS.textBaseline = "top";
	status01.textDisplayS.textAlign = "left";
	status01.stage.addChild(status01.textDisplayS);
    
    status01.textDisplayD = new createjs.Text("", "0px Arial", "black");
	status01.textDisplayD.textBaseline = "bottom";
	status01.textDisplayD.textAlign = "left";
	status01.stage.addChild(status01.textDisplayD);
    
    //Set up looping Tween
    createjs.Tween.get(status01.tweens.circRad, {loop: -1}) //
        .to({percent: 100}, 2500, createjs.Ease.quartInOut);
}

function initializeStatusS01() {
	//The first function that is called
	//Define canvas and stage varaibles
	status01.canvas = document.getElementById(status01.config.canvasID.toString());
	status01.stage = new createjs.Stage(status01.canvas);
    
    //Creates information tooltip
    new Opentip(status01.canvas, "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpS01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasS01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasS01();
    
    checkOffLoaded();
}