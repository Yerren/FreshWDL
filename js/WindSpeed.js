/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var windSpeed = {
	stage: null,
	canvas: null,
	rectLeft: null,
    rectFillLeft: null,
	rectLeftCommand: null,
	rectFillLeftCommand: null,
    rectRight: null,
    rectFillRight: null,
	rectRightCommand: null,
	rectFillRightCommand: null,
	leftStrokeCommand: null,
	rightStrokeCommand: null,
	botStrokeCommand: null,
	windHighMarker: null,
	windHighMarkerStrokeCommand: null,
	windHighMarkerStartCommand: null,
	windHighMarkerEndCommand: null,
	gustHighMarker: null,
	gustHighMarkerStrokeCommand: null,
	gustHighMarkerStartCommand: null,
	gustHighMarkerEndCommand: null,
	textDisplayWind: null,
	textTitle: null,
	textTitleWind: null,
	textTitleGust: null,
    textDisplayGust: null,
	windHighDisplay: null,
	gustHighDisplay: null,
	largeDashTotal: 5,
	dashStrokeCommand: [],
	dashStartCommand: [],
	dashEndCommand: [],
	dash: [],
	label: [],
	setupVars: {
        dashes: [],
        dashGap: null,
        barWidth: null,
        barFillWidth: null,
        barHeight: null,
        barFillHeight: null,
        strokeSize: null,
		textSize: null,
        posBar: {},
        posFillBar: {},
		posLabels: {},
        cutOffLength: null
	},
	constants: {
		minSpeed: 0,
		minSpeedDEFAULT: 0,
		maxSpeed: 40,
		maxSpeedDEFAULT: 40
	},
    tweens: {
        barFillLeft: {
            h: 0
        },
        barFillRight: {
            h: 0
        },
		windHighSpeed: {
			h: 1.04
		},
		gustHighSpeed: {
			h: 1.04
		}
    },
	values: {
		speedIn: 0,
		speedOut: 0,
        gustIn: 0,
        gustOut: 0,
		windHighSpeedIn: 0,
		windHighSpeedOut: 0,
		gustHighSpeedIn: 0,
		gustHighSpeedOut: 0,
        unitsIn: "wind"
	},
    valuesOld: {
		speedIn: 0,
		speedOut: 0,
        gustIn: 0,
        gustOut: 0
	}
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputWS01() {
	//Formats the speedrature to be displayed correctly
	
    //Adjust to units
    windSpeed.values.speedIn = formatDataToUnit(windSpeed.values.speedIn, windSpeed.values.unitsIn, roundTo);
    windSpeed.values.gustIn = formatDataToUnit(windSpeed.values.gustIn, windSpeed.values.unitsIn, roundTo);
    windSpeed.values.windHighSpeedIn = formatDataToUnit(windSpeed.values.windHighSpeedIn, windSpeed.values.unitsIn, roundTo);
    windSpeed.values.gustHighSpeedIn = formatDataToUnit(windSpeed.values.gustHighSpeedIn, windSpeed.values.unitsIn, roundTo);
    
	//Adjust Range if needed: if any of the inputs (current, windHigh, gustHigh), are less than the current minimum of the range, decrease the minimum. If any of the inputs (current, windHigh, gustHigh), are bigger than the current maximum of the range, increase the maximum. 
	while (windSpeed.values.speedIn < windSpeed.constants.minSpeed || windSpeed.values.gustIn < windSpeed.constants.minSpeed || windSpeed.values.windHighSpeedIn < windSpeed.constants.minSpeed || windSpeed.values.gustHighSpeedIn < windSpeed.constants.minSpeed) {windSpeed.constants.minSpeed -= windSpeed.largeDashTotal - 1; }
	while (windSpeed.values.speedIn > windSpeed.constants.maxSpeed || windSpeed.values.gustIn > windSpeed.constants.maxSpeed || windSpeed.values.windHighSpeedIn > windSpeed.constants.maxSpeed || windSpeed.values.gustHighSpeedIn > windSpeed.constants.maxSpeed) {windSpeed.constants.maxSpeed += windSpeed.largeDashTotal - 1; }

    //Adjust Range if needed: if all of the inputs (current, windHigh, gustHigh), are bigger than the current minimum of the range, increase the minimum. If all of the inputs (current, windHigh, gustHigh), are less than the current maximum of the range, decrease the maximum. 
	while (windSpeed.values.speedIn >= windSpeed.constants.minSpeed + (windSpeed.largeDashTotal - 1) && windSpeed.values.gustIn >= windSpeed.constants.minSpeed + (windSpeed.largeDashTotal - 1) && windSpeed.values.windHighSpeedIn >= windSpeed.constants.minSpeed + (windSpeed.largeDashTotal - 1) && windSpeed.values.gustHighSpeedIn >= windSpeed.constants.minSpeed + (windSpeed.largeDashTotal - 1) && windSpeed.constants.minSpeed < windSpeed.constants.minSpeedDEFAULT) {windSpeed.constants.minSpeed += windSpeed.largeDashTotal - 1; }
	while (windSpeed.values.speedIn <= windSpeed.constants.maxSpeed - (windSpeed.largeDashTotal - 1) && windSpeed.values.gustIn <= windSpeed.constants.maxSpeed - (windSpeed.largeDashTotal - 1) && windSpeed.values.windHighSpeedIn <= windSpeed.constants.maxSpeed - (windSpeed.largeDashTotal - 1) && windSpeed.values.gustHighSpeedIn <= windSpeed.constants.maxSpeed - (windSpeed.largeDashTotal - 1) && windSpeed.constants.maxSpeed > windSpeed.constants.maxSpeedDEFAULT) {windSpeed.constants.maxSpeed -= windSpeed.largeDashTotal - 1; }
	
    //Map the inputs to the current scale
	windSpeed.values.speedOut = windSpeed.values.speedIn.map(windSpeed.constants.minSpeed, windSpeed.constants.maxSpeed, 0, 1);
	windSpeed.values.gustOut = windSpeed.values.gustIn.map(windSpeed.constants.minSpeed, windSpeed.constants.maxSpeed, 0, 1);
	windSpeed.values.windHighSpeedOut = windSpeed.values.windHighSpeedIn.map(windSpeed.constants.minSpeed, windSpeed.constants.maxSpeed, 1, 0);
	windSpeed.values.gustHighSpeedOut = windSpeed.values.gustHighSpeedIn.map(windSpeed.constants.minSpeed, windSpeed.constants.maxSpeed, 1, 0);
}

function drawSpeedBarWS01(speedIn, gustIn, windHighSpeedIn, gustHighSpeedIn, unitChange) {
    //Is called when new data is sent.
    unitChange = unitChange || false;
    
    //Check if widget actually needs to be updated
    if (speedIn != windSpeed.valuesOld.speedIn || gustIn != windSpeed.valuesOld.gustIn || windHighSpeedIn != windSpeed.valuesOld.windHighSpeedIn || gustHighSpeedIn != windSpeed.valuesOld.gustHighSpeedIn || unitChange === true) {
        //Sets inputs to new data
        windSpeed.values.speedIn = speedIn;
        windSpeed.values.gustIn = gustIn;
        windSpeed.values.windHighSpeedIn = windHighSpeedIn;
        windSpeed.values.gustHighSpeedIn = gustHighSpeedIn;

        //Starts the tweens (animations) of the inputs
        formatInputWS01();
        createjs.Tween.get(windSpeed.tweens.barFillLeft)
            .to({h: windSpeed.values.speedOut}, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(windSpeed.tweens.barFillRight)
            .to({h: windSpeed.values.gustOut}, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(windSpeed.tweens.windHighSpeed)
            .to({h: windSpeed.values.windHighSpeedOut}, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(windSpeed.tweens.gustHighSpeed)
            .to({h: windSpeed.values.gustHighSpeedOut}, 2000, createjs.Ease.quartInOut);
        
        windSpeed.valuesOld.speedIn = speedIn;
        windSpeed.valuesOld.gustIn = gustIn;
        windSpeed.valuesOld.windHighSpeedIn = windHighSpeedIn;
        windSpeed.valuesOld.gustHighSpeedIn = gustHighSpeedIn;
    }
}

function updateTweensWS01() {
    //Updates any tweened or changing objects. This is called every frame
    
    //Speed Bar Fill
    windSpeed.rectFillLeftCommand.h = windSpeed.tweens.barFillLeft.h * (windSpeed.rectLeftCommand.h);
	windSpeed.rectFillLeftCommand.y = windSpeed.rectLeftCommand.h - windSpeed.rectFillLeftCommand.h + windSpeed.rectLeftCommand.y;
    
    //Gust Bar Fill
    windSpeed.rectFillRightCommand.h = windSpeed.tweens.barFillRight.h * (windSpeed.rectRightCommand.h);
	windSpeed.rectFillRightCommand.y = windSpeed.rectRightCommand.h - windSpeed.rectFillRightCommand.h + windSpeed.rectRightCommand.y;
	
	//High Wind Marker
	windSpeed.windHighMarkerEndCommand.y = windSpeed.windHighMarkerStartCommand.y = windSpeed.tweens.windHighSpeed.h * windSpeed.rectLeftCommand.h + windSpeed.rectLeftCommand.y;
	
	//High Gust Marker
	windSpeed.gustHighMarkerEndCommand.y = windSpeed.gustHighMarkerStartCommand.y = windSpeed.tweens.gustHighSpeed.h * windSpeed.rectRightCommand.h + windSpeed.rectRightCommand.y;
	
	//High Display
	windSpeed.windHighDisplay.text = "max:\n" + windSpeed.values.windHighSpeedIn.toString();
	
	//Low Display
	windSpeed.gustHighDisplay.text = "max:\n" + windSpeed.values.gustHighSpeedIn.toString();
	
	//Labels
	for (i = 0; i < windSpeed.largeDashTotal; i++) {
		windSpeed.label[i].text = windSpeed.constants.maxSpeed - ((windSpeed.constants.maxSpeed - windSpeed.constants.minSpeed) / (windSpeed.largeDashTotal - 1)) * i;
	}
	
	//Text Display Wind
	windSpeed.textDisplayWind.text = windSpeed.values.speedIn.toString() + "\n" + units[windSpeed.values.unitsIn.toString()][currentUnits[windSpeed.values.unitsIn.toString()]][1].toString();
    
    //Text Display Gust
	windSpeed.textDisplayGust.text = windSpeed.values.gustIn.toString() + "\n" + units[windSpeed.values.unitsIn.toString()][currentUnits[windSpeed.values.unitsIn.toString()]][1].toString();
}

function updateTopWS01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    windSpeed.setupVars.dashLength = windSpeed.canvas.height * 0.075;
    windSpeed.setupVars.dashGap = windSpeed.canvas.height * 0.025;
    windSpeed.setupVars.barWidth = windSpeed.canvas.height * 0.15;
    windSpeed.setupVars.barFillWidth = windSpeed.setupVars.barWidth * 0.6;
    windSpeed.setupVars.barHeight = windSpeed.canvas.height * 0.8;
    windSpeed.setupVars.barFillHeight = windSpeed.setupVars.barHeight;
    windSpeed.setupVars.strokeSize = windSpeed.setupVars.barWidth / 40;
    windSpeed.setupVars.textSize = windSpeed.canvas.height / 17;
    windSpeed.setupVars.textDisplaySize = windSpeed.canvas.height / 20;
    windSpeed.setupVars.posBarLeft = {
        x: ((windSpeed.canvas.height / 2) - (windSpeed.setupVars.barWidth / 2)),
        y: ((windSpeed.canvas.height / 2) - (windSpeed.setupVars.barHeight / 2))
    };
    windSpeed.setupVars.posBarRight = {
        x: ((windSpeed.canvas.height / 2) + (windSpeed.setupVars.barWidth / 2)),
        y: ((windSpeed.canvas.height / 2) - (windSpeed.setupVars.barHeight / 2))
    };
    windSpeed.setupVars.posTextLabelLeft = {
        x: windSpeed.setupVars.posBarLeft.x + windSpeed.setupVars.barWidth / 2,
        y: windSpeed.setupVars.barHeight * (125 / 119)
    };
    windSpeed.setupVars.posTextLabelRight = {
        x: windSpeed.setupVars.posBarRight.x + windSpeed.setupVars.barWidth / 2,
        y: windSpeed.setupVars.posTextLabelLeft.y
    };
    windSpeed.setupVars.posTextTitle = {
        x: windSpeed.setupVars.posBarRight.x,
        y: (windSpeed.canvas.height - windSpeed.setupVars.barHeight) * (4 / 9)
    };
    windSpeed.setupVars.posDash = {
        x: (windSpeed.canvas.height / 2) - (windSpeed.setupVars.barWidth / 2) - windSpeed.setupVars.dashLength - windSpeed.setupVars.dashGap,
        y: (windSpeed.canvas.height - windSpeed.setupVars.barHeight) / 2
    };
	windSpeed.setupVars.posLabelWind = {
		x: windSpeed.setupVars.posBarLeft.x + windSpeed.setupVars.barWidth / 2,
        y: windSpeed.setupVars.barHeight * (112 / 100)
	};
    windSpeed.setupVars.posLabelGust = {
		x: sharpenValue(windSpeed.setupVars.posBarRight.x + windSpeed.setupVars.barWidth / 2),
        y: sharpenValue(windSpeed.setupVars.posLabelWind.y)
	};
    windSpeed.setupVars.posTextTitleWind = {
        x: windSpeed.setupVars.posBarLeft.x + windSpeed.setupVars.barWidth / 2,
        y: (windSpeed.canvas.height - windSpeed.setupVars.barHeight) * (5 / 9)
    };
    windSpeed.setupVars.posTextTitleGust = {
        x: windSpeed.setupVars.posBarRight.x + windSpeed.setupVars.barWidth / 2,
        y: windSpeed.setupVars.posTextTitleWind.y
    };

	//Update the visual elements
    
	//Rectangles
	windSpeed.leftStrokeCommand.width = windSpeed.setupVars.strokeSize;
	windSpeed.rectLeftCommand.x = windSpeed.setupVars.posBarLeft.x;
	windSpeed.rectLeftCommand.y = windSpeed.setupVars.posBarLeft.y;
	windSpeed.rectLeftCommand.w = windSpeed.setupVars.barWidth;
	windSpeed.rectLeftCommand.h = windSpeed.setupVars.barHeight;
    
    windSpeed.rightStrokeCommand.width = windSpeed.setupVars.strokeSize;
	windSpeed.rectRightCommand.x = windSpeed.setupVars.posBarRight.x;
	windSpeed.rectRightCommand.y = windSpeed.setupVars.posBarRight.y;
	windSpeed.rectRightCommand.w = windSpeed.setupVars.barWidth;
	windSpeed.rectRightCommand.h = windSpeed.setupVars.barHeight;
    
	//Dashes
    var gap = (windSpeed.setupVars.barHeight - windSpeed.setupVars.posDash.y) / ((windSpeed.largeDashTotal - 1) * 2 - 1);
    //I literally have no idea why to use " -1 * 2 - 1" but it works.
	for (i = 0; i < (windSpeed.largeDashTotal * 2 - 1); i++) {
        var dashY = sharpenValue(gap * i + windSpeed.setupVars.posDash.y);
		//Large
		if (i % 2 === 0) {
			windSpeed.dashStrokeCommand[i].width = windSpeed.setupVars.strokeSize;
			windSpeed.dashStartCommand[i].x = windSpeed.setupVars.posDash.x;
			windSpeed.dashStartCommand[i].y = dashY;
			windSpeed.dashEndCommand[i].x = windSpeed.setupVars.posDash.x + windSpeed.setupVars.dashLength;
			windSpeed.dashEndCommand[i].y = dashY;
            
			//Text Label Positioning - located here as they line up with the large dashes
			windSpeed.label[i / 2].y = dashY;
			windSpeed.label[i / 2].x = (windSpeed.setupVars.posDash.x - windSpeed.setupVars.dashLength) * (6 / 5);
			windSpeed.label[i / 2].font = windSpeed.setupVars.textSize + "px arial";
		} else {
			//Med
			windSpeed.dashStrokeCommand[i].width = windSpeed.setupVars.strokeSize;
			windSpeed.dashStartCommand[i].x = windSpeed.setupVars.posDash.x + windSpeed.setupVars.dashLength - (windSpeed.setupVars.dashLength / 2);
			windSpeed.dashStartCommand[i].y = dashY;
			windSpeed.dashEndCommand[i].x = (windSpeed.setupVars.posDash.x + windSpeed.setupVars.dashLength);
			windSpeed.dashEndCommand[i].y = dashY;
		}
	}
	
	//Bar Fill
	windSpeed.rectFillLeftCommand.x = windSpeed.setupVars.posBarLeft.x;
	windSpeed.rectFillLeftCommand.w = windSpeed.setupVars.barWidth;
    
    windSpeed.rectFillRightCommand.x = windSpeed.setupVars.posBarRight.x;
	windSpeed.rectFillRightCommand.w = windSpeed.setupVars.barWidth;
	
    //Text Title
	windSpeed.textTitle.x = windSpeed.setupVars.posTextTitle.x;
	windSpeed.textTitle.y = windSpeed.setupVars.posTextTitle.y;
	windSpeed.textTitle.font = "bold " + (windSpeed.setupVars.textDisplaySize * 1.5) + "px arial";
    
    //Text titles for wind and gust
	windSpeed.textTitleWind.x = windSpeed.setupVars.posTextTitleWind.x;
	windSpeed.textTitleWind.y = windSpeed.setupVars.posTextTitleWind.y;
	windSpeed.textTitleWind.font = windSpeed.setupVars.textDisplaySize + "px arial";
    
	windSpeed.textTitleGust.x = windSpeed.setupVars.posTextTitleGust.x;
	windSpeed.textTitleGust.y = windSpeed.setupVars.posTextTitleGust.y;
	windSpeed.textTitleGust.font = windSpeed.setupVars.textDisplaySize + "px arial";
    
	//Text Display Wind
	windSpeed.textDisplayWind.x = windSpeed.setupVars.posTextLabelLeft.x;
	windSpeed.textDisplayWind.y = windSpeed.setupVars.posTextLabelLeft.y;
	windSpeed.textDisplayWind.font = "bold " + windSpeed.setupVars.textDisplaySize + "px arial";
    
    //Text Display Gust
	windSpeed.textDisplayGust.x = windSpeed.setupVars.posTextLabelRight.x;
	windSpeed.textDisplayGust.y = windSpeed.setupVars.posTextLabelRight.y;
	windSpeed.textDisplayGust.font = "bold " + windSpeed.setupVars.textDisplaySize + "px arial";
	
	//High Wind Marker
	windSpeed.windHighMarkerStrokeCommand.width = windSpeed.setupVars.strokeSize * 4;
	windSpeed.windHighMarkerStartCommand.x =  windSpeed.setupVars.posBarLeft.x;
	windSpeed.windHighMarkerEndCommand.x = windSpeed.setupVars.posBarLeft.x + windSpeed.setupVars.barWidth;
	
	//High Gust Marker
	windSpeed.gustHighMarkerStrokeCommand.width = windSpeed.setupVars.strokeSize * 4;
	windSpeed.gustHighMarkerStartCommand.x = windSpeed.setupVars.posBarRight.x;
	windSpeed.gustHighMarkerEndCommand.x = windSpeed.setupVars.posBarRight.x + windSpeed.setupVars.barWidth;
	
	//High Wind Display
	windSpeed.windHighDisplay.x = windSpeed.setupVars.posLabelWind.x;
    windSpeed.windHighDisplay.y = windSpeed.setupVars.posLabelWind.y;
	windSpeed.windHighDisplay.font = windSpeed.setupVars.textDisplaySize + "px arial";
	
	//High Gust Display
	windSpeed.gustHighDisplay.x = windSpeed.setupVars.posLabelGust.x;
    windSpeed.gustHighDisplay.y = windSpeed.setupVars.posLabelGust.y;
	windSpeed.gustHighDisplay.font = windSpeed.setupVars.textDisplaySize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensWS01();
}

function resizeCanvasWS01() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 1.5,
        parentDiv = windSpeed.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    windSpeed.canvas.width = parentDiv.clientHeight / ratio;
    windSpeed.canvas.height = parentDiv.clientHeight;
	
    windSpeed.stage.x = -(windSpeed.canvas.height / (ratio * (33 / 10)));
    
	//Update shapes according to new dimentions
	updateTopWS01();
}

function setUpWS01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
    
	//Set up rectangles
	windSpeed.rectLeft = new createjs.Shape();
	windSpeed.rectLeft.snapToPixel = true;
	windSpeed.rectLeft.graphics.beginStroke("black");
	windSpeed.rectLeft.graphics.beginFill("#F6F6F6");
	windSpeed.leftStrokeCommand = windSpeed.rectLeft.graphics.setStrokeStyle(0).command;
	windSpeed.rectLeftCommand = windSpeed.rectLeft.graphics.drawRect(0, 0, 0, 0).command;
	windSpeed.stage.addChild(windSpeed.rectLeft);

	windSpeed.rectRight = new createjs.Shape();
	windSpeed.rectRight.snapToPixel = true;
	windSpeed.rectRight.graphics.beginStroke("black");
	windSpeed.rectRight.graphics.beginFill("#F6F6F6");
	windSpeed.rightStrokeCommand = windSpeed.rectRight.graphics.setStrokeStyle(0).command;
	windSpeed.rectRightCommand = windSpeed.rectRight.graphics.drawRect(0, 0, 0, 0).command;
	windSpeed.stage.addChild(windSpeed.rectRight);
	
	//Set up Dashes
	for (i = 0; i < windSpeed.largeDashTotal * 2; i++) {
		windSpeed.dash[i] = new createjs.Shape();
		windSpeed.dash[i].snapToPixel = true;
		windSpeed.dash[i].graphics.beginStroke("black", 1);
		windSpeed.dashStrokeCommand[i] = windSpeed.dash[i].graphics.setStrokeStyle(0).command;
		windSpeed.dashStartCommand[i] = windSpeed.dash[i].graphics.moveTo(0, 0).command;
		windSpeed.dashEndCommand[i] = windSpeed.dash[i].graphics.lineTo(0, 0).command;
		windSpeed.stage.addChild(windSpeed.dash[i]);
	}
    
    //Set up fill rectanges
    windSpeed.rectFillLeft = new createjs.Shape();
	windSpeed.rectFillLeft.snapToPixel = true;
	windSpeed.rectFillLeft.graphics.beginFill("rgb(" + colour.wind + ")");
    windSpeed.rectFillLeft.graphics.setStrokeStyle(0);
	windSpeed.rectFillLeftCommand = windSpeed.rectFillLeft.graphics.drawRect(0, 0, 0, 0).command;
	windSpeed.stage.addChild(windSpeed.rectFillLeft);
    
    windSpeed.rectFillRight = new createjs.Shape();
	windSpeed.rectFillRight.snapToPixel = true;
	windSpeed.rectFillRight.graphics.beginFill("rgb(" + colour.windGust + ")");
    windSpeed.rectFillRight.graphics.setStrokeStyle(0);
	windSpeed.rectFillRightCommand = windSpeed.rectFillRight.graphics.drawRect(0, 0, 0, 0).command;
	windSpeed.stage.addChild(windSpeed.rectFillRight);
	
	//Set up text labels
	for (i = 0; i < windSpeed.largeDashTotal; i++) {
		windSpeed.label[i] = new createjs.Text("", "0px Arial", "black");
		windSpeed.label[i].textBaseline = "middle";
		windSpeed.label[i].textAlign = "right";
		windSpeed.stage.addChild(windSpeed.label[i]);
	}
    
    //Set up text title
	windSpeed.textTitle = new createjs.Text("Wind Speed", "0px Arial", "black");
	windSpeed.textTitle.textBaseline = "bottom";
	windSpeed.textTitle.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.textTitle);
    
    //Set up text wind and gust titles
	windSpeed.textTitleWind = new createjs.Text("Wind", "0px Arial", "black");
	windSpeed.textTitleWind.textBaseline = "top";
	windSpeed.textTitleWind.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.textTitleWind);
    
    windSpeed.textTitleGust = new createjs.Text("Gust", "0px Arial", "black");
	windSpeed.textTitleGust.textBaseline = "top";
	windSpeed.textTitleGust.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.textTitleGust);
    
	//Set up text displays
	windSpeed.textDisplayWind = new createjs.Text("", "0px Arial", "black");
	windSpeed.textDisplayWind.textBaseline = "bottom";
	windSpeed.textDisplayWind.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.textDisplayWind);
    
    windSpeed.textDisplayGust = new createjs.Text("", "0px Arial", "black");
	windSpeed.textDisplayGust.textBaseline = "bottom";
	windSpeed.textDisplayGust.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.textDisplayGust);
	
	//Set up windHigh speed marker
	windSpeed.windHighMarker = new createjs.Shape();
	windSpeed.windHighMarker.snapToPixel = true;
	windSpeed.windHighMarker.graphics.beginStroke("rgb(" + colour.wind + ")", 1);
	windSpeed.windHighMarkerStrokeCommand = windSpeed.windHighMarker.graphics.setStrokeStyle(0).command;
	windSpeed.windHighMarkerStartCommand = windSpeed.windHighMarker.graphics.moveTo(0, 0).command;
	windSpeed.windHighMarkerEndCommand = windSpeed.windHighMarker.graphics.lineTo(0, 0).command;
	windSpeed.stage.addChild(windSpeed.windHighMarker);
	
	//Set up gustHigh speed marker
	windSpeed.gustHighMarker = new createjs.Shape();
	windSpeed.gustHighMarker.snapToPixel = true;
	windSpeed.gustHighMarker.graphics.beginStroke("rgb(" + colour.windGust + ")", 1);
	windSpeed.gustHighMarkerStrokeCommand = windSpeed.gustHighMarker.graphics.setStrokeStyle(0).command;
	windSpeed.gustHighMarkerStartCommand = windSpeed.gustHighMarker.graphics.moveTo(0, 0).command;
	windSpeed.gustHighMarkerEndCommand = windSpeed.gustHighMarker.graphics.lineTo(0, 0).command;
	windSpeed.stage.addChild(windSpeed.gustHighMarker);
	
	//Set up windHigh speed label
	windSpeed.windHighDisplay = new createjs.Text("0", "0px Arial", "black");
	windSpeed.windHighDisplay.textBaseline = "top";
	windSpeed.windHighDisplay.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.windHighDisplay);
	
	//Set up gustHigh speed label
	windSpeed.gustHighDisplay = new createjs.Text("0", "0px Arial", "black");
	windSpeed.gustHighDisplay.textBaseline = "top";
	windSpeed.gustHighDisplay.textAlign = "center";
	windSpeed.stage.addChild(windSpeed.gustHighDisplay);
}

function initializeWS01() {
	//The first function that is called
    
	//Define canvas and stage varaibles
	windSpeed.canvas = document.getElementById('WindSpeed01');
	windSpeed.stage = new createjs.Stage(windSpeed.canvas);
    
    //Creates information tooltip
    new Opentip(windSpeed.canvas, "Green bar indicates average wind speed.\nPurple bar indicates gust speed.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpWS01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not algustHigh this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWS01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasWS01();
    
    checkOffLoaded();
}