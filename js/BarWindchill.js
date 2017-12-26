/*jslint plusplus: true, sloppy: true, indent: 4 */

//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var windchill01 = {
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
	}
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputWC01() {
	//Formats the temperature to be displayed correctly
	
    //Adjust to units
    windchill01.values.tempIn = formatDataToUnit(windchill01.values.tempIn, windchill01.values.unitsIn, roundTo);
    windchill01.values.highTempIn = formatDataToUnit(windchill01.values.highTempIn, windchill01.values.unitsIn, roundTo);
    windchill01.values.lowTempIn = formatDataToUnit(windchill01.values.lowTempIn, windchill01.values.unitsIn, roundTo);
    
	//Adjust Range if needed: if any of the inputs (current, high, low), are less than the current minimum of the range, decrease the minimum. If any of the inputs (current, high, low), are bigger than the current maximum of the range, increase the maximum. 
	while (windchill01.values.tempIn < windchill01.constants.minTemp || windchill01.values.highTempIn < windchill01.constants.minTemp || windchill01.values.lowTempIn < windchill01.constants.minTemp) {windchill01.constants.minTemp -= windchill01.largeDashTotal - 1; }
	while (windchill01.values.tempIn > windchill01.constants.maxTemp || windchill01.values.highTempIn > windchill01.constants.maxTemp || windchill01.values.lowTempIn > windchill01.constants.maxTemp) {windchill01.constants.maxTemp += windchill01.largeDashTotal - 1; }

    //Adjust Range if needed: if all of the inputs (current, high, low), are bigger than the current minimum of the range, increase the minimum. If all of the inputs (current, high, low), are less than the current maximum of the range, decrease the maximum. 
	while ((windchill01.values.tempIn >= windchill01.constants.minTemp + (windchill01.largeDashTotal - 1) && windchill01.constants.minTemp < windchill01.constants.minTempDEFAULT) && (windchill01.values.highTempIn >= windchill01.constants.minTemp + (windchill01.largeDashTotal - 1) && windchill01.constants.minTemp < windchill01.constants.minTempDEFAULT) && (windchill01.values.lowTempIn >= windchill01.constants.minTemp + (windchill01.largeDashTotal - 1) && windchill01.constants.minTemp < windchill01.constants.minTempDEFAULT)) {windchill01.constants.minTemp += windchill01.largeDashTotal - 1; }
	while ((windchill01.values.tempIn <= windchill01.constants.maxTemp - (windchill01.largeDashTotal - 1) && windchill01.constants.maxTemp > windchill01.constants.maxTempDEFAULT) && (windchill01.values.highTempIn <= windchill01.constants.maxTemp - (windchill01.largeDashTotal - 1) && windchill01.constants.maxTemp > windchill01.constants.maxTempDEFAULT) && (windchill01.values.lowTempIn <= windchill01.constants.maxTemp - (windchill01.largeDashTotal - 1) && windchill01.constants.maxTemp > windchill01.constants.maxTempDEFAULT)) {windchill01.constants.maxTemp -= windchill01.largeDashTotal - 1; }
	
    //Map the inputs to the current scale
	windchill01.values.tempOut = windchill01.values.tempIn.map(windchill01.constants.minTemp, windchill01.constants.maxTemp, 0.1, 0.98);
	windchill01.values.highTempOut = windchill01.values.highTempIn.map(windchill01.constants.minTemp, windchill01.constants.maxTemp, 1.04, 0.17);
	windchill01.values.lowTempOut = windchill01.values.lowTempIn.map(windchill01.constants.minTemp, windchill01.constants.maxTemp, 1.04, 0.17);
}

function drawWindchillBarWC01(tempIn, highTempIn, lowTempIn) {
    //Is called when new data is sent.
    
    //Sets inputs to new data
	windchill01.values.tempIn = Number(tempIn);
    windchill01.values.highTempIn = Number(highTempIn);
    windchill01.values.lowTempIn = Number(lowTempIn);

    //Starts the tweens (animations) of the inputs
	formatInputWC01();
	createjs.Tween.get(windchill01.tweens.barFill)
		.to({h: windchill01.values.tempOut}, 2000, createjs.Ease.quartInOut);
	createjs.Tween.get(windchill01.tweens.highTemp)
		.to({h: windchill01.values.highTempOut}, 2000, createjs.Ease.quartInOut);
	createjs.Tween.get(windchill01.tweens.lowTemp)
		.to({h: windchill01.values.lowTempOut}, 2000, createjs.Ease.quartInOut);

}

function updateTweensWC01() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Temp Bar Fill
    windchill01.rectFillCommand.h = windchill01.tweens.barFill.h * (windchill01.rectCommand.h - windchill01.rectCommand.y);
	windchill01.rectFillCommand.y = windchill01.rectCommand.h - windchill01.rectFillCommand.h;
	
	//High Marker
	windchill01.highMarkerEndCommand.y = windchill01.highMarkerStartCommand.y = windchill01.tweens.highTemp.h * (windchill01.rectCommand.h - windchill01.rectCommand.y);
	
	//Low Marker
	windchill01.lowMarkerEndCommand.y = windchill01.lowMarkerStartCommand.y = windchill01.tweens.lowTemp.h * (windchill01.rectCommand.h - windchill01.rectCommand.y);
	
	//High Display
	windchill01.highDisplay.y = windchill01.highMarkerEndCommand.y;
	windchill01.highDisplay.text = windchill01.values.highTempIn.toString() + units[windchill01.values.unitsIn.toString()][currentUnits[windchill01.values.unitsIn.toString()]][1].toString();
	
	//Low Display
	windchill01.lowDisplay.y = windchill01.lowMarkerEndCommand.y;
	windchill01.lowDisplay.text = windchill01.values.lowTempIn.toString() + units[windchill01.values.unitsIn.toString()][currentUnits[windchill01.values.unitsIn.toString()]][1].toString();
	
	//Labels
	for (i = 0; i < windchill01.largeDashTotal; i++) {
		windchill01.label[i].text = windchill01.constants.maxTemp - ((windchill01.constants.maxTemp - windchill01.constants.minTemp) / (windchill01.largeDashTotal - 1)) * i;
	}
	
	//Text Display
	windchill01.textDisplay.text = windchill01.values.tempIn.toString() + units[windchill01.values.unitsIn.toString()][currentUnits[windchill01.values.unitsIn.toString()]][1].toString();
}

function updateTopWC01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    windchill01.setupVars.dashLength = windchill01.canvas.height * 0.075;
    windchill01.setupVars.dashGap = windchill01.canvas.height * 0.025;
    windchill01.setupVars.barWidth = windchill01.canvas.height * 0.075;
    windchill01.setupVars.barFillWidth = windchill01.setupVars.barWidth * 0.6;
    windchill01.setupVars.barHeight = windchill01.canvas.height * 0.8;
    windchill01.setupVars.barFillHeight = windchill01.setupVars.barHeight;
    windchill01.setupVars.circRad = windchill01.canvas.height * 0.1;
    windchill01.setupVars.fillCircRad = windchill01.setupVars.circRad * 0.85;
    windchill01.setupVars.cornerRad = windchill01.setupVars.barWidth / 2;
    windchill01.setupVars.cornerFillRad = windchill01.setupVars.barFillWidth / 2;
    windchill01.setupVars.strokeSize = windchill01.setupVars.barWidth / 40;
    windchill01.setupVars.textSize = windchill01.canvas.height / 17;
    windchill01.setupVars.textDisplaySize = windchill01.canvas.height / 19;
	windchill01.setupVars.textHLSize = windchill01.canvas.height / 21;
    windchill01.setupVars.posBar = {
        x: ((windchill01.canvas.height / 2) - (windchill01.setupVars.barWidth / 2)),
        y: ((windchill01.canvas.height / 2) - (windchill01.setupVars.barHeight / 2))
    };
    windchill01.setupVars.posCirc = {
        x: windchill01.canvas.height / 2,
        y: windchill01.canvas.height * (3 / 4) + windchill01.setupVars.circRad - windchill01.setupVars.circRad / 10
    };
    windchill01.setupVars.posFillCirc = {
        x: windchill01.canvas.height / 2,
        y: windchill01.canvas.height * (3 / 4) + windchill01.setupVars.circRad - windchill01.setupVars.circRad / 10
    };
    windchill01.setupVars.posTextTitle = {
        x: windchill01.canvas.height / 2,
        y: (windchill01.canvas.height - windchill01.setupVars.barHeight) / 2 - windchill01.setupVars.cornerRad
    };
    windchill01.setupVars.posDash = {
        x: (windchill01.canvas.height / 2) - (windchill01.setupVars.barWidth / 2) - windchill01.setupVars.dashLength - windchill01.setupVars.dashGap,
        y: (windchill01.canvas.height - windchill01.setupVars.barHeight) / 2 + windchill01.setupVars.cornerRad / 2
    };
	windchill01.setupVars.posHLLabel = {
		x: (windchill01.canvas.height / 2) + (windchill01.setupVars.barWidth / 2) + windchill01.setupVars.dashGap
	};
    windchill01.setupVars.posFillBar = {
        x: ((windchill01.canvas.height / 2) - (windchill01.setupVars.barFillWidth / 2)),
        y: ((windchill01.canvas.height / 2) - (windchill01.setupVars.barFillHeight / 2))
    };
    windchill01.setupVars.cutOffLength = windchill01.canvas.height * (299 / 400);

	//Update the visual elements
    
	//Top
	windchill01.topStrokeCommand.width = windchill01.setupVars.strokeSize;
	windchill01.rectCommand.x = windchill01.setupVars.posBar.x;
	windchill01.rectCommand.y = windchill01.setupVars.posBar.y;
	windchill01.rectCommand.w = windchill01.setupVars.barWidth;
	windchill01.rectCommand.h = windchill01.setupVars.barHeight;
	windchill01.rectCommand.radiusTR = windchill01.rectCommand.radiusTL = windchill01.rectCommand.radiusBR = windchill01.rectCommand.radiusBL = windchill01.setupVars.cornerRad;
    
	//Bot
	windchill01.botStrokeCommand.width = windchill01.setupVars.strokeSize;
	windchill01.circCommand.x = windchill01.setupVars.posCirc.x;
	windchill01.circCommand.y = windchill01.setupVars.posCirc.y;
	windchill01.circCommand.radius = windchill01.setupVars.circRad;
    
	//Dashes
	for (i = 0; i < (windchill01.largeDashTotal * 10 - 9); i++) {
		//Large
		var gap = sharpenValue(windchill01.setupVars.posDash.y + (((windchill01.setupVars.cutOffLength * (24 / 25) - windchill01.setupVars.posDash.y) / (windchill01.largeDashTotal - 1)) - (((windchill01.setupVars.cutOffLength * (24 / 25) - windchill01.setupVars.posDash.y) % ((windchill01.largeDashTotal - 1))) / windchill01.largeDashTotal - 1)) * (i / 10));
		if (i % 10 === 0) {
			windchill01.dashStrokeCommand[i].width = windchill01.setupVars.strokeSize;
			windchill01.dashStartCommand[i].x = windchill01.setupVars.posDash.x;
			windchill01.dashStartCommand[i].y = gap;
			windchill01.dashEndCommand[i].x = windchill01.setupVars.posDash.x + windchill01.setupVars.dashLength;
			windchill01.dashEndCommand[i].y = gap;
            
			//Text Label Positioning - located here as they line up with the large dashes
			windchill01.label[i / 10].y = gap;
			windchill01.label[i / 10].x = (windchill01.setupVars.posDash.x - windchill01.setupVars.dashLength) * (6 / 5);
			windchill01.label[i / 10].font = windchill01.setupVars.textSize + "px arial";
		} else if (i % 5 === 0) {
			//Med
			windchill01.dashStrokeCommand[i].width = windchill01.setupVars.strokeSize;
			windchill01.dashStartCommand[i].x = windchill01.setupVars.posDash.x + windchill01.setupVars.dashLength - (windchill01.setupVars.dashLength / 2);
			windchill01.dashStartCommand[i].y = gap;
			windchill01.dashEndCommand[i].x = (windchill01.setupVars.posDash.x + windchill01.setupVars.dashLength);
			windchill01.dashEndCommand[i].y = gap;
		} else {
			//Small
			windchill01.dashStrokeCommand[i].width = windchill01.setupVars.strokeSize;
			windchill01.dashStartCommand[i].x = windchill01.setupVars.posDash.x + windchill01.setupVars.dashLength - (windchill01.setupVars.dashLength / 3);
			windchill01.dashStartCommand[i].y = gap;
			windchill01.dashEndCommand[i].x = (windchill01.setupVars.posDash.x + windchill01.setupVars.dashLength);
			windchill01.dashEndCommand[i].y = gap;
		}
	}
	
	//Inner Circle fill
	windchill01.circFillCommand.x = windchill01.setupVars.posFillCirc.x;
	windchill01.circFillCommand.y = windchill01.setupVars.posFillCirc.y;
	windchill01.circFillCommand.radius = windchill01.setupVars.fillCircRad;
	
	//Bar Fill
	windchill01.rectFillCommand.x = windchill01.setupVars.posFillBar.x;
	windchill01.rectFillCommand.w = windchill01.setupVars.barFillWidth;
	windchill01.rectFillCommand.radiusTR = windchill01.rectFillCommand.radiusTL = windchill01.rectFillCommand.radiusBR = windchill01.rectFillCommand.radiusBL = windchill01.setupVars.cornerFillRad;
	
	//Text Display
	windchill01.textDisplay.x = windchill01.setupVars.posFillCirc.x;
	windchill01.textDisplay.y = windchill01.setupVars.posFillCirc.y;
	windchill01.textDisplay.font = "bold " + windchill01.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	windchill01.textTitle.x = windchill01.setupVars.posTextTitle.x;
	windchill01.textTitle.y = windchill01.setupVars.posTextTitle.y;
	windchill01.textTitle.font = "bold " + windchill01.setupVars.textDisplaySize + "px arial";
	
	//High Marker
	windchill01.highMarkerStrokeCommand.width = windchill01.setupVars.strokeSize * 4;
	windchill01.highMarkerStartCommand.x = (windchill01.canvas.height + windchill01.setupVars.barWidth) / 2;
	windchill01.highMarkerEndCommand.x = (windchill01.canvas.height - windchill01.setupVars.barWidth) / 2;
	
	//Low Marker
	windchill01.lowMarkerStrokeCommand.width = windchill01.setupVars.strokeSize * 4;
	windchill01.lowMarkerStartCommand.x = (windchill01.canvas.height + windchill01.setupVars.barWidth) / 2;
	windchill01.lowMarkerEndCommand.x = (windchill01.canvas.height - windchill01.setupVars.barWidth) / 2;
	
	//High Display
	windchill01.highDisplay.x = windchill01.setupVars.posHLLabel.x;
	windchill01.highDisplay.font = "bold " + windchill01.setupVars.textHLSize + "px arial";
	
	//Low Display
	windchill01.lowDisplay.x = windchill01.setupVars.posHLLabel.x;
	windchill01.lowDisplay.font = "bold " + windchill01.setupVars.textHLSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensWC01();
    
	//Set masks
	windchill01.roundRectTop.mask = new createjs.Shape(new createjs.Graphics().dr(0, 0, windchill01.canvas.height, windchill01.setupVars.cutOffLength));
	windchill01.roundRectFillTop.mask = new createjs.Shape(new createjs.Graphics().dr(0, 0, windchill01.canvas.height, windchill01.setupVars.cutOffLength * 1.1));
	windchill01.roundBot.mask = new createjs.Shape(new createjs.Graphics().dr(0, windchill01.setupVars.cutOffLength, windchill01.canvas.height, windchill01.canvas.height));
	
}

function resizeCanvasWC01() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 2,
        parentDiv = windchill01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    windchill01.canvas.width = parentDiv.clientHeight / ratio;
    windchill01.canvas.height = parentDiv.clientHeight;
	
    windchill01.stage.x = -(windchill01.canvas.height / 4.5);
    
	//Update shapes according to new dimentions
	updateTopWC01();
}

function setUpWC01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	windchill01.roundRectTop = new createjs.Shape();
	windchill01.roundRectTop.snapToPixel = true;
	windchill01.roundRectTop.graphics.beginStroke("black");
	windchill01.roundRectTop.graphics.beginFill("#F6F6F6");
	windchill01.topStrokeCommand = windchill01.roundRectTop.graphics.setStrokeStyle(0).command;
	windchill01.rectCommand = windchill01.roundRectTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	windchill01.stage.addChild(windchill01.roundRectTop);
	
	//Set up bottom 
	windchill01.roundBot  = new createjs.Shape();
	windchill01.roundBot.snapToPixel = true;
	windchill01.roundBot.graphics.beginStroke("black");
	windchill01.roundBot.graphics.beginFill("#F6F6F6");
	windchill01.botStrokeCommand = windchill01.roundBot.graphics.setStrokeStyle(0).command;
	windchill01.circCommand = windchill01.roundBot.graphics.drawCircle(0, 0, 0).command;
	windchill01.stage.addChild(windchill01.roundBot);
	
	//Set up Dashes
	for (i = 0; i < windchill01.largeDashTotal * 10; i++) {
		windchill01.dash[i] = new createjs.Shape();
		windchill01.dash[i].snapToPixel = true;
		windchill01.dash[i].graphics.beginStroke("black", 1);
		windchill01.dashStrokeCommand[i] = windchill01.dash[i].graphics.setStrokeStyle(0).command;
		windchill01.dashStartCommand[i] = windchill01.dash[i].graphics.moveTo(0, 0).command;
		windchill01.dashEndCommand[i] = windchill01.dash[i].graphics.lineTo(0, 0).command;
		windchill01.stage.addChild(windchill01.dash[i]);
	}
    
    //Set up fill circle
    windchill01.roundBotFill = new createjs.Shape();
	windchill01.roundBotFill.snapToPixel = true;
	windchill01.roundBotFill.graphics.beginFill("rgb(255, 221, 37)");
    windchill01.roundBotFill.graphics.setStrokeStyle(0);
	windchill01.circFillCommand = windchill01.roundBotFill.graphics.drawCircle(0, 0, 0).command;
	windchill01.stage.addChild(windchill01.roundBotFill);
    
    //Set up fill rectange
    windchill01.roundRectFillTop = new createjs.Shape();
	windchill01.roundRectFillTop.snapToPixel = true;
	windchill01.roundRectFillTop.graphics.beginFill("rgb(255, 221, 37)");
    windchill01.roundRectFillTop.graphics.setStrokeStyle(0);
	windchill01.rectFillCommand = windchill01.roundRectFillTop.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
	windchill01.stage.addChild(windchill01.roundRectFillTop);
	
	//Set up text labels
	for (i = 0; i < windchill01.largeDashTotal; i++) {
		windchill01.label[i] = new createjs.Text("0px Arial", "black");
		windchill01.label[i].textBaseline = "middle";
		windchill01.label[i].textAlign = "right";
		windchill01.stage.addChild(windchill01.label[i]);
	}
    
	//Set up text display
	windchill01.textDisplay = new createjs.Text("0px Arial", "black");
	windchill01.textDisplay.textBaseline = "middle";
	windchill01.textDisplay.textAlign = "center";
	windchill01.stage.addChild(windchill01.textDisplay);
	
    //Set up title
	windchill01.textTitle = new createjs.Text("Windchill", "0px Arial", "black");
	windchill01.textTitle.textBaseline = "middle";
	windchill01.textTitle.textAlign = "center";
	windchill01.stage.addChild(windchill01.textTitle);
    
	//Set up high temp marker
	windchill01.highMarker = new createjs.Shape();
	windchill01.highMarker.snapToPixel = true;
	windchill01.highMarker.graphics.beginStroke("rgb(" + colour.temp + ")", 1);
	windchill01.highMarkerStrokeCommand = windchill01.highMarker.graphics.setStrokeStyle(0).command;
	windchill01.highMarkerStartCommand = windchill01.highMarker.graphics.moveTo(0, 0).command;
	windchill01.highMarkerEndCommand = windchill01.highMarker.graphics.lineTo(0, 0).command;
	windchill01.stage.addChild(windchill01.highMarker);
	
	//Set up low temp marker
	windchill01.lowMarker = new createjs.Shape();
	windchill01.lowMarker.snapToPixel = true;
	windchill01.lowMarker.graphics.beginStroke("rgb(" + colour.tempLow + ")", 1);
	windchill01.lowMarkerStrokeCommand = windchill01.lowMarker.graphics.setStrokeStyle(0).command;
	windchill01.lowMarkerStartCommand = windchill01.lowMarker.graphics.moveTo(0, 0).command;
	windchill01.lowMarkerEndCommand = windchill01.lowMarker.graphics.lineTo(0, 0).command;
	windchill01.stage.addChild(windchill01.lowMarker);
	
	//Set up high temp label
	windchill01.highDisplay = new createjs.Text("", "0px Arial", "rgb(" + colour.temp + ")");
	windchill01.highDisplay.textBaseline = "middle";
	windchill01.highDisplay.textAlign = "left";
	windchill01.stage.addChild(windchill01.highDisplay);
	
	//Set up low temp label
	windchill01.lowDisplay = new createjs.Text("", "0px Arial", "rgb(" + colour.tempLow + ")");
	windchill01.lowDisplay.textBaseline = "middle";
	windchill01.lowDisplay.textAlign = "left";
	windchill01.stage.addChild(windchill01.lowDisplay);
}

function initializeWC01() {
	//The first function that is called
    
	//Define canvas and stage varaibles
	windchill01.canvas = document.getElementById('Windchill01');
	windchill01.stage = new createjs.Stage(windchill01.canvas);
    
    //Creates information tooltip
    new Opentip(windchill01.canvas, "How cold it actually feels. Calculated by combining heat and wind speed.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpWC01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWC01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasWC01();
    
    checkOffLoaded();
}