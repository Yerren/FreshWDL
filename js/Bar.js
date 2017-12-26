/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var tempBar = {
	stage: null,
	canvas: null,
	roundRectTop: null,
    roundRectFillTop: null,
	roundBot: null,
    roundBotFill: null,
	rectCommand: null,
	rectFillCommand: null,
	circCommand: null,
    circFillCommand: null,
	topStrokeCommand: null,
	botStrokeCommand: null,
	highMarker: null,
	highMarkerStrokeCommand: null,
	highMarkerStartCommand: null,
	highMarkerEndCommand: null,
	lowMarker: null,
	lowMarkerStrokeCommand: null,
	lowMarkerStartCommand: null,
	lowMarkerEndCommand: null,
	textDisplay: null,
	textTitle: null,
	highDisplay: null,
	lowDisplay: null,
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
        circRad: null,
        fillCircRad: null,
        cornerRad: null,
        cornerFillRad: null,
        strokeSize: null,
		textSize: null,
        posBar: {},
        posCirc: {},
        posFillCirc: {},
        posFillBar: {},
		posHLLabel: {},
        cutOffLength: null
	},
	constants: {
		minTemp: -10,
		minTempDEFAULT: -10,
		maxTemp: 30,
		maxTempDEFAULT: 30
	},
    tweens: {
        barFill: {
            h: 0
        },
		highTemp: {
			h: 1.04
		},
		lowTemp: {
			h: 1.04
		}
    },
	values: {
		tempIn: 0,
		tempOut: 0,
		highTempIn: 0,
		highTempOut: 0,
		lowTempIn: 0,
		lowTempOut: 0,
        unitsIn: "temp"
	},
	valuesOld: {
		tempIn: 0,
		highTempIn: 0,
		lowTempIn: 0
	}
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputTemp01() {
	//Formats the temperature to be displayed correctly
	
    //Adjust to units
    tempBar.values.tempIn = formatDataToUnit(tempBar.values.tempIn, tempBar.values.unitsIn, roundTo);
    tempBar.values.highTempIn = formatDataToUnit(tempBar.values.highTempIn, tempBar.values.unitsIn, roundTo);
    tempBar.values.lowTempIn = formatDataToUnit(tempBar.values.lowTempIn, tempBar.values.unitsIn, roundTo);
    
	//Adjust Range if needed: if any of the inputs (current, high, low), are less than the current minimum of the range, decrease the minimum. If any of the inputs (current, high, low), are bigger than the current maximum of the range, increase the maximum. 
	while (tempBar.values.tempIn < tempBar.constants.minTemp || tempBar.values.highTempIn < tempBar.constants.minTemp || tempBar.values.lowTempIn < tempBar.constants.minTemp) {tempBar.constants.minTemp -= tempBar.largeDashTotal - 1; }
	while (tempBar.values.tempIn > tempBar.constants.maxTemp || tempBar.values.highTempIn > tempBar.constants.maxTemp || tempBar.values.lowTempIn > tempBar.constants.maxTemp) {tempBar.constants.maxTemp += tempBar.largeDashTotal - 1; }

    //Adjust Range if needed: if all of the inputs (current, high, low), are bigger than the current minimum of the range, increase the minimum. If all of the inputs (current, high, low), are less than the current maximum of the range, decrease the maximum. 
	while ((tempBar.values.tempIn >= tempBar.constants.minTemp + (tempBar.largeDashTotal - 1) && tempBar.constants.minTemp < tempBar.constants.minTempDEFAULT) && (tempBar.values.highTempIn >= tempBar.constants.minTemp + (tempBar.largeDashTotal - 1) && tempBar.constants.minTemp < tempBar.constants.minTempDEFAULT) && (tempBar.values.lowTempIn >= tempBar.constants.minTemp + (tempBar.largeDashTotal - 1) && tempBar.constants.minTemp < tempBar.constants.minTempDEFAULT)) {tempBar.constants.minTemp += tempBar.largeDashTotal - 1; }
	while ((tempBar.values.tempIn <= tempBar.constants.maxTemp - (tempBar.largeDashTotal - 1) && tempBar.constants.maxTemp > tempBar.constants.maxTempDEFAULT) && (tempBar.values.highTempIn <= tempBar.constants.maxTemp - (tempBar.largeDashTotal - 1) && tempBar.constants.maxTemp > tempBar.constants.maxTempDEFAULT) && (tempBar.values.lowTempIn <= tempBar.constants.maxTemp - (tempBar.largeDashTotal - 1) && tempBar.constants.maxTemp > tempBar.constants.maxTempDEFAULT)) {tempBar.constants.maxTemp -= tempBar.largeDashTotal - 1; }
	
    //Map the inputs to the current scale
	tempBar.values.tempOut = tempBar.values.tempIn.map(tempBar.constants.minTemp, tempBar.constants.maxTemp, 0.1, 0.98);
	tempBar.values.highTempOut = tempBar.values.highTempIn.map(tempBar.constants.minTemp, tempBar.constants.maxTemp, 1.04, 0.17);
	tempBar.values.lowTempOut = tempBar.values.lowTempIn.map(tempBar.constants.minTemp, tempBar.constants.maxTemp, 1.04, 0.17);
}

function drawTemperatureBarTemp01(tempIn, highTempIn, lowTempIn, unitChange) {
    //Is called when new data is sent.
    unitChange = unitChange || false;
    
    //check to see if any reason to update
    if (tempBar.valuesOld.TempIn != tempIn || tempBar.valuesOld.highTempIn != highTempIn || tempBar.valuesOld.lowTempIn != lowTempIn || unitChange === true) {
        //Sets inputs to new data
        tempBar.values.tempIn = Number(tempIn);
        tempBar.values.highTempIn = Number(highTempIn);
        tempBar.values.lowTempIn = Number(lowTempIn);

        //Starts the tweens (animations) of the inputs
        formatInputTemp01();
        createjs.Tween.get(tempBar.tweens.barFill)
            .to({h: tempBar.values.tempOut}, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(tempBar.tweens.highTemp)
            .to({h: tempBar.values.highTempOut}, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(tempBar.tweens.lowTemp)
            .to({h: tempBar.values.lowTempOut}, 2000, createjs.Ease.quartInOut);
        
        tempBar.valuesOld.TempIn = tempIn;
        tempBar.valuesOld.highTempIn = highTempIn;
        tempBar.valuesOld.lowTempIn = lowTempIn;
    }
}

function updateTweensTemp01() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Temp Bar Fill
    tempBar.rectFillCommand.h = tempBar.tweens.barFill.h * (tempBar.rectCommand.h - tempBar.rectCommand.y);
	tempBar.rectFillCommand.y = tempBar.rectCommand.h - tempBar.rectFillCommand.h;
	
	//High Marker
	tempBar.highMarkerEndCommand.y = tempBar.highMarkerStartCommand.y = tempBar.tweens.highTemp.h * (tempBar.rectCommand.h - tempBar.rectCommand.y);
	
	//Low Marker
	tempBar.lowMarkerEndCommand.y = tempBar.lowMarkerStartCommand.y = tempBar.tweens.lowTemp.h * (tempBar.rectCommand.h - tempBar.rectCommand.y);
	
	//High Display
	tempBar.highDisplay.y = tempBar.highMarkerEndCommand.y;
	tempBar.highDisplay.text = tempBar.values.highTempIn.toString() + units[tempBar.values.unitsIn.toString()][currentUnits[tempBar.values.unitsIn.toString()]][1].toString();
	
	//Low Display
	tempBar.lowDisplay.y = tempBar.lowMarkerEndCommand.y;
	tempBar.lowDisplay.text = tempBar.values.lowTempIn.toString() + units[tempBar.values.unitsIn.toString()][currentUnits[tempBar.values.unitsIn.toString()]][1].toString();
	
	//Labels
	for (i = 0; i < tempBar.largeDashTotal; i++) {
		tempBar.label[i].text = tempBar.constants.maxTemp - ((tempBar.constants.maxTemp - tempBar.constants.minTemp) / (tempBar.largeDashTotal - 1)) * i;
	}
	
	//Text Display
	tempBar.textDisplay.text = tempBar.values.tempIn.toString() + units[tempBar.values.unitsIn.toString()][currentUnits[tempBar.values.unitsIn.toString()]][1].toString();
}

function updateTopTemp01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    tempBar.setupVars.dashLength = tempBar.canvas.height * 0.075;
    tempBar.setupVars.dashGap = tempBar.canvas.height * 0.025;
    tempBar.setupVars.barWidth = tempBar.canvas.height * 0.075;
    tempBar.setupVars.barFillWidth = tempBar.setupVars.barWidth * 0.6;
    tempBar.setupVars.barHeight = tempBar.canvas.height * 0.8;
    tempBar.setupVars.barFillHeight = tempBar.setupVars.barHeight;
    tempBar.setupVars.circRad = tempBar.canvas.height * 0.1;
    tempBar.setupVars.fillCircRad = tempBar.setupVars.circRad * 0.85;
    tempBar.setupVars.cornerRad = tempBar.setupVars.barWidth / 2;
    tempBar.setupVars.cornerFillRad = tempBar.setupVars.barFillWidth / 2;
    tempBar.setupVars.strokeSize = tempBar.setupVars.barWidth / 40;
    tempBar.setupVars.textSize = tempBar.canvas.height / 17;
    tempBar.setupVars.textDisplaySize = tempBar.canvas.height / 19;
	tempBar.setupVars.textHLSize = tempBar.canvas.height / 21;
    tempBar.setupVars.posBar = {
        x: ((tempBar.canvas.height / 2) - (tempBar.setupVars.barWidth / 2)),
        y: ((tempBar.canvas.height / 2) - (tempBar.setupVars.barHeight / 2))
    };
    tempBar.setupVars.posCirc = {
        x: tempBar.canvas.height / 2,
        y: tempBar.canvas.height * (3 / 4) + tempBar.setupVars.circRad - tempBar.setupVars.circRad / 10
    };
    tempBar.setupVars.posFillCirc = {
        x: tempBar.canvas.height / 2,
        y: tempBar.canvas.height * (3 / 4) + tempBar.setupVars.circRad - tempBar.setupVars.circRad / 10
    };
    tempBar.setupVars.posTextTitle = {
        x: tempBar.canvas.height / 2,
        y: (tempBar.canvas.height - tempBar.setupVars.barHeight) / 2 - tempBar.setupVars.cornerRad
    };
    tempBar.setupVars.posDash = {
        x: (tempBar.canvas.height / 2) - (tempBar.setupVars.barWidth / 2) - tempBar.setupVars.dashLength - tempBar.setupVars.dashGap,
        y: (tempBar.canvas.height - tempBar.setupVars.barHeight) / 2 + tempBar.setupVars.cornerRad / 2
    };
	tempBar.setupVars.posHLLabel = {
		x: (tempBar.canvas.height / 2) + (tempBar.setupVars.barWidth / 2) + tempBar.setupVars.dashGap
	};
    tempBar.setupVars.posFillBar = {
        x: ((tempBar.canvas.height / 2) - (tempBar.setupVars.barFillWidth / 2)),
        y: ((tempBar.canvas.height / 2) - (tempBar.setupVars.barFillHeight / 2))
    };
    tempBar.setupVars.cutOffLength = tempBar.canvas.height * (299 / 400);

	//Update the visual elements
    
	//Top
	tempBar.topStrokeCommand.width = tempBar.setupVars.strokeSize;
	tempBar.rectCommand.x = tempBar.setupVars.posBar.x;
	tempBar.rectCommand.y = tempBar.setupVars.posBar.y;
	tempBar.rectCommand.w = tempBar.setupVars.barWidth;
	tempBar.rectCommand.h = tempBar.setupVars.barHeight;
	tempBar.rectCommand.radiusTR = tempBar.rectCommand.radiusTL = tempBar.rectCommand.radiusBR = tempBar.rectCommand.radiusBL = tempBar.setupVars.cornerRad;
    
	//Bot
	tempBar.botStrokeCommand.width = tempBar.setupVars.strokeSize;
	tempBar.circCommand.x = tempBar.setupVars.posCirc.x;
	tempBar.circCommand.y = tempBar.setupVars.posCirc.y;
	tempBar.circCommand.radius = tempBar.setupVars.circRad;
    
	//Dashes
	for (i = 0; i < (tempBar.largeDashTotal * 10 - 9); i++) {
		//Large
		var gap = sharpenValue(tempBar.setupVars.posDash.y + (((tempBar.setupVars.cutOffLength * (24 / 25) - tempBar.setupVars.posDash.y) / (tempBar.largeDashTotal - 1)) - (((tempBar.setupVars.cutOffLength * (24 / 25) - tempBar.setupVars.posDash.y) % ((tempBar.largeDashTotal - 1))) / tempBar.largeDashTotal - 1)) * (i / 10));
		if (i % 10 === 0) {
			tempBar.dashStrokeCommand[i].width = tempBar.setupVars.strokeSize;
			tempBar.dashStartCommand[i].x = tempBar.setupVars.posDash.x;
			tempBar.dashStartCommand[i].y = gap;
			tempBar.dashEndCommand[i].x = tempBar.setupVars.posDash.x + tempBar.setupVars.dashLength;
			tempBar.dashEndCommand[i].y = gap;
            
			//Text Label Positioning - located here as they line up with the large dashes
			tempBar.label[i / 10].y = gap;
			tempBar.label[i / 10].x = (tempBar.setupVars.posDash.x - tempBar.setupVars.dashLength) * (6 / 5);
			tempBar.label[i / 10].font = tempBar.setupVars.textSize + "px arial";
		} else if (i % 5 === 0) {
			//Med
			tempBar.dashStrokeCommand[i].width = tempBar.setupVars.strokeSize;
			tempBar.dashStartCommand[i].x = tempBar.setupVars.posDash.x + tempBar.setupVars.dashLength - (tempBar.setupVars.dashLength / 2);
			tempBar.dashStartCommand[i].y = gap;
			tempBar.dashEndCommand[i].x = (tempBar.setupVars.posDash.x + tempBar.setupVars.dashLength);
			tempBar.dashEndCommand[i].y = gap;
		} else {
			//Small
			tempBar.dashStrokeCommand[i].width = tempBar.setupVars.strokeSize;
			tempBar.dashStartCommand[i].x = tempBar.setupVars.posDash.x + tempBar.setupVars.dashLength - (tempBar.setupVars.dashLength / 3);
			tempBar.dashStartCommand[i].y = gap;
			tempBar.dashEndCommand[i].x = (tempBar.setupVars.posDash.x + tempBar.setupVars.dashLength);
			tempBar.dashEndCommand[i].y = gap;
		}
	}
	
	//Inner Circle fill
	tempBar.circFillCommand.x = tempBar.setupVars.posFillCirc.x;
	tempBar.circFillCommand.y = tempBar.setupVars.posFillCirc.y;
	tempBar.circFillCommand.radius = tempBar.setupVars.fillCircRad;
	
	//Bar Fill
	tempBar.rectFillCommand.x = tempBar.setupVars.posFillBar.x;
	tempBar.rectFillCommand.w = tempBar.setupVars.barFillWidth;
	tempBar.rectFillCommand.radiusTR = tempBar.rectFillCommand.radiusTL = tempBar.rectFillCommand.radiusBR = tempBar.rectFillCommand.radiusBL = tempBar.setupVars.cornerFillRad;
	
	//Text Display
	tempBar.textDisplay.x = tempBar.setupVars.posFillCirc.x;
	tempBar.textDisplay.y = tempBar.setupVars.posFillCirc.y;
	tempBar.textDisplay.font = "bold " + tempBar.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	tempBar.textTitle.x = tempBar.setupVars.posTextTitle.x;
	tempBar.textTitle.y = tempBar.setupVars.posTextTitle.y;
	tempBar.textTitle.font = "bold " + tempBar.setupVars.textDisplaySize + "px arial";
	
	//High Marker
	tempBar.highMarkerStrokeCommand.width = tempBar.setupVars.strokeSize * 4;
	tempBar.highMarkerStartCommand.x = (tempBar.canvas.height + tempBar.setupVars.barWidth) / 2;
	tempBar.highMarkerEndCommand.x = (tempBar.canvas.height - tempBar.setupVars.barWidth) / 2;
	
	//Low Marker
	tempBar.lowMarkerStrokeCommand.width = tempBar.setupVars.strokeSize * 4;
	tempBar.lowMarkerStartCommand.x = (tempBar.canvas.height + tempBar.setupVars.barWidth) / 2;
	tempBar.lowMarkerEndCommand.x = (tempBar.canvas.height - tempBar.setupVars.barWidth) / 2;
	
	//High Display
	tempBar.highDisplay.x = tempBar.setupVars.posHLLabel.x;
	tempBar.highDisplay.font = "bold " + tempBar.setupVars.textHLSize + "px arial";
	
	//Low Display
	tempBar.lowDisplay.x = tempBar.setupVars.posHLLabel.x;
	tempBar.lowDisplay.font = "bold " + tempBar.setupVars.textHLSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensTemp01();
    
	//Set masks
	tempBar.roundRectTop.mask = new createjs.Shape(new createjs.Graphics().dr(0, 0, tempBar.canvas.height, tempBar.setupVars.cutOffLength));
	tempBar.roundRectFillTop.mask = new createjs.Shape(new createjs.Graphics().dr(0, 0, tempBar.canvas.height, tempBar.setupVars.cutOffLength * 1.1));
	tempBar.roundBot.mask = new createjs.Shape(new createjs.Graphics().dr(0, tempBar.setupVars.cutOffLength, tempBar.canvas.height, tempBar.canvas.height));
	
}

function resizeCanvasTemp01() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 2,
        parentDiv = tempBar.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    tempBar.canvas.width = parentDiv.clientWidth;
    tempBar.canvas.height = parentDiv.clientWidth * ratio;
	
    tempBar.stage.x = -(tempBar.canvas.height / 4.5);
    
	//Update shapes according to new dimentions
	updateTopTemp01();
}

function setUpTemp01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	tempBar.roundRectTop = new createjs.Shape();
	tempBar.roundRectTop.snapToPixel = true;
	tempBar.roundRectTop.graphics.beginStroke("black");
	tempBar.roundRectTop.graphics.beginFill("#F6F6F6");
	tempBar.topStrokeCommand = tempBar.roundRectTop.graphics.setStrokeStyle(0).command;
	tempBar.rectCommand = tempBar.roundRectTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	tempBar.stage.addChild(tempBar.roundRectTop);
	
	//Set up bottom 
	tempBar.roundBot  = new createjs.Shape();
	tempBar.roundBot.snapToPixel = true;
	tempBar.roundBot.graphics.beginStroke("black");
	tempBar.roundBot.graphics.beginFill("#F6F6F6");
	tempBar.botStrokeCommand = tempBar.roundBot.graphics.setStrokeStyle(0).command;
	tempBar.circCommand = tempBar.roundBot.graphics.drawCircle(0, 0, 0).command;
	tempBar.stage.addChild(tempBar.roundBot);
	
	//Set up Dashes
	for (i = 0; i < tempBar.largeDashTotal * 10; i++) {
		tempBar.dash[i] = new createjs.Shape();
		tempBar.dash[i].snapToPixel = true;
		tempBar.dash[i].graphics.beginStroke("black", 1);
		tempBar.dashStrokeCommand[i] = tempBar.dash[i].graphics.setStrokeStyle(0).command;
		tempBar.dashStartCommand[i] = tempBar.dash[i].graphics.moveTo(0, 0).command;
		tempBar.dashEndCommand[i] = tempBar.dash[i].graphics.lineTo(0, 0).command;
		tempBar.stage.addChild(tempBar.dash[i]);
	}
    
    //Set up fill circle
    tempBar.roundBotFill = new createjs.Shape();
	tempBar.roundBotFill.snapToPixel = true;
	tempBar.roundBotFill.graphics.beginFill("rgb(255, 221, 37)");
    tempBar.roundBotFill.graphics.setStrokeStyle(0);
	tempBar.circFillCommand = tempBar.roundBotFill.graphics.drawCircle(0, 0, 0).command;
	tempBar.stage.addChild(tempBar.roundBotFill);
    
    //Set up fill rectange
    tempBar.roundRectFillTop = new createjs.Shape();
	tempBar.roundRectFillTop.snapToPixel = true;
	tempBar.roundRectFillTop.graphics.beginFill("rgb(255, 221, 37)");
    tempBar.roundRectFillTop.graphics.setStrokeStyle(0);
	tempBar.rectFillCommand = tempBar.roundRectFillTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	tempBar.stage.addChild(tempBar.roundRectFillTop);
	
	//Set up text labels
	for (i = 0; i < tempBar.largeDashTotal; i++) {
		tempBar.label[i] = new createjs.Text("0px Arial", "black");
		tempBar.label[i].textBaseline = "middle";
		tempBar.label[i].textAlign = "right";
		tempBar.stage.addChild(tempBar.label[i]);
	}
    
	//Set up text display
	tempBar.textDisplay = new createjs.Text("0px Arial", "black");
	tempBar.textDisplay.textBaseline = "middle";
	tempBar.textDisplay.textAlign = "center";
	tempBar.stage.addChild(tempBar.textDisplay);
	
    //Set up title
	tempBar.textTitle = new createjs.Text("Temperature", "0px Arial", "black");
	tempBar.textTitle.textBaseline = "middle";
	tempBar.textTitle.textAlign = "center";
	tempBar.stage.addChild(tempBar.textTitle);
    
	//Set up high temp marker
	tempBar.highMarker = new createjs.Shape();
	tempBar.highMarker.snapToPixel = true;
	tempBar.highMarker.graphics.beginStroke("rgb(" + colour.temp + ")", 1);
	tempBar.highMarkerStrokeCommand = tempBar.highMarker.graphics.setStrokeStyle(0).command;
	tempBar.highMarkerStartCommand = tempBar.highMarker.graphics.moveTo(0, 0).command;
	tempBar.highMarkerEndCommand = tempBar.highMarker.graphics.lineTo(0, 0).command;
	tempBar.stage.addChild(tempBar.highMarker);
	
	//Set up low temp marker
	tempBar.lowMarker = new createjs.Shape();
	tempBar.lowMarker.snapToPixel = true;
	tempBar.lowMarker.graphics.beginStroke("rgb(" + colour.tempLow + ")", 1);
	tempBar.lowMarkerStrokeCommand = tempBar.lowMarker.graphics.setStrokeStyle(0).command;
	tempBar.lowMarkerStartCommand = tempBar.lowMarker.graphics.moveTo(0, 0).command;
	tempBar.lowMarkerEndCommand = tempBar.lowMarker.graphics.lineTo(0, 0).command;
	tempBar.stage.addChild(tempBar.lowMarker);
	
	//Set up high temp label
	tempBar.highDisplay = new createjs.Text("", "0px Arial", "rgb(" + colour.temp + ")");
	tempBar.highDisplay.textBaseline = "middle";
	tempBar.highDisplay.textAlign = "left";
	tempBar.stage.addChild(tempBar.highDisplay);
	
	//Set up low temp label
	tempBar.lowDisplay = new createjs.Text("", "0px Arial", "rgb(" + colour.tempLow + ")");
	tempBar.lowDisplay.textBaseline = "middle";
	tempBar.lowDisplay.textAlign = "left";
	tempBar.stage.addChild(tempBar.lowDisplay);
}

function initializeTemp01() {
	//The first function that is called
    
	//Define canvas and stage varaibles
	tempBar.canvas = document.getElementById('TempBar01');
	tempBar.stage = new createjs.Stage(tempBar.canvas);
    
    //Creates information tooltip
    new Opentip(tempBar.canvas, "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpTemp01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasTemp01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasTemp01();
    
    checkOffLoaded();
}