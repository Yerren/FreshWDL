/*jslint plusplus: true, sloppy: true, indent: 4 */

//APPARENT 
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
        apparent01.values.temp = formatDataToUnit(apparent01.values.temp, apparent01.config.unitsIn);

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
	apparent01.stage = new createjs.Stage(apparent01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        apparent01.stage.update();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawApparentA01(arrayClientraw[130]);
    });
    //Creates information tooltip
    new Opentip(apparent01.canvas, "Perceived temperature based on temperature, humidity, sun, and wind.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpA01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasA01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasA01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasA01();
    
    checkOffLoaded();
}

//TEMPERATURE BAR
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
        cutOffLength: null,
        minHLspace: null
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
    tempBar.values.tempIn = formatDataToUnit(tempBar.values.tempIn, tempBar.values.unitsIn);
    tempBar.values.highTempIn = formatDataToUnit(tempBar.values.highTempIn, tempBar.values.unitsIn);
    tempBar.values.lowTempIn = formatDataToUnit(tempBar.values.lowTempIn, tempBar.values.unitsIn);
    
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
	
    //Adjust y position of HL labels if they would otherwise overlap
    var highLabelY = tempBar.highMarkerEndCommand.y,
        lowLabelY = tempBar.lowMarkerEndCommand.y
    while ((lowLabelY - highLabelY) / tempBar.canvas.height < tempBar.setupVars.minHLspace) {
        lowLabelY += 1;
        highLabelY -= 1;
    }
    
	//High Display
	tempBar.highDisplay.y = highLabelY;
	tempBar.highDisplay.text = tempBar.values.highTempIn.toString() + units[tempBar.values.unitsIn.toString()][currentUnits[tempBar.values.unitsIn.toString()]][1].toString();
	
	//Low Display
	tempBar.lowDisplay.y = lowLabelY;
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
    tempBar.setupVars.minHLspace = 0.04;
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
	tempBar.stage = new createjs.Stage(tempBar.canvas);
    
    window.addEventListener("frameUpdate", function () {
        tempBar.stage.update();
        updateTweensTemp01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawTemperatureBarTemp01(arrayClientraw[4], arrayClientraw[46], arrayClientraw[47]);
    });
    
    //Creates information tooltip
    new Opentip(tempBar.canvas, "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpTemp01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasTemp01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasTemp01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasTemp01();
    
    checkOffLoaded();
}
//BAROMETER
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
        barometer01.values.pressure = formatDataToUnit(barometer01.values.pressure, barometer01.config.unitsIn);
        barometer01.values.trend = formatDataToUnit(barometer01.values.trend, barometer01.config.unitsIn);

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
	barometer01.stage = new createjs.Stage(barometer01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        barometer01.stage.update();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawBarometerB01(arrayClientraw[6], arrayClientraw[50]);
    });
    
    
    //Creates information tooltip
    new Opentip(barometer01.canvas, "The weight of the air, adjusted for the station's altitude.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpB01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasB01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasB01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasB01();
    
    checkOffLoaded();
}

//WINDCHILL BAR
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
        cutOffLength: null,
        minHLspace: null
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

function formatInputWC01() {
	//Formats the temperature to be displayed correctly
	
    //Adjust to units
    windchill01.values.tempIn = formatDataToUnit(windchill01.values.tempIn, windchill01.values.unitsIn);
    windchill01.values.highTempIn = formatDataToUnit(windchill01.values.highTempIn, windchill01.values.unitsIn);
    windchill01.values.lowTempIn = formatDataToUnit(windchill01.values.lowTempIn, windchill01.values.unitsIn);
    
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

function drawWindchillBarWC01(tempIn, highTempIn, lowTempIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    if (windchill01.valuesOld.TempIn != tempIn || windchill01.valuesOld.highTempIn != highTempIn || windchill01.valuesOld.lowTempIn != lowTempIn || unitChange === true) {
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
        
        windchill01.valuesOld.TempIn = tempIn;
        windchill01.valuesOld.highTempIn = highTempIn;
        windchill01.valuesOld.lowTempIn = lowTempIn;
    }

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
	
    //Adjust y position of HL labels if they would otherwise overlap
    var highLabelY = windchill01.highMarkerEndCommand.y,
        lowLabelY = windchill01.lowMarkerEndCommand.y
    while ((lowLabelY - highLabelY) / windchill01.canvas.height < windchill01.setupVars.minHLspace) {
        lowLabelY += 1;
        highLabelY -= 1;
    }
    
	//High Display
	windchill01.highDisplay.y = highLabelY;
	windchill01.highDisplay.text = windchill01.values.highTempIn.toString() + units[windchill01.values.unitsIn.toString()][currentUnits[windchill01.values.unitsIn.toString()]][1].toString();
	
	//Low Display
	windchill01.lowDisplay.y = lowLabelY;
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
	windchill01.setupVars.minHLspace = 0.04;
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
	windchill01.stage = new createjs.Stage(windchill01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        windchill01.stage.update();
        updateTweensWC01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawWindchillBarWC01(arrayClientraw[44], arrayClientraw[77], arrayClientraw[78]);
    });
    
    //Creates information tooltip
    new Opentip(windchill01.canvas, "How cold it actually feels. Calculated by combining heat and wind speed.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpWC01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWC01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasWC01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasWC01();
    
    checkOffLoaded();
}

//BAROMETER GRAPH
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
                    type: 'time',
                    ticks: {
                        minor: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        },
                        major: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        }
                    },
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {hour: "HH:mm"}
                    }
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
    baroGraph.chart.options.scales.yAxes[0].ticks.minor.fontSize = baroGraph.chart.options.scales.yAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.05;
    baroGraph.chart.options.scales.xAxes[0].ticks.minor.fontSize = baroGraph.chart.options.scales.xAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.04;
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
            y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit)
        };
    }
    
    baroGraph.chart.destroy();
    baroGraph.chart = null;
    
    //configure as line chart
    drawBaroGraphLine01();
    baroGraph.chart.data.datasets[0] = graphStyles[style];
    baroGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    baroGraph.chart.data.datasets[0].data = graphData;
    baroGraph.chart.options.scales.xAxes[0].time.unit = graphIn.timeDisplay.toString();
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
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasBaroG01();
        });
    }
	
	resizeCanvasBaroG01(); //Set canvas size initally 
    checkOffLoaded();
}

//RAIN GRAPH
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
    rainGraph.chart.options.scales.yAxes[0].ticks.minor.fontSize = rainGraph.chart.options.scales.yAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.05;
    rainGraph.chart.options.scales.xAxes[0].ticks.minor.fontSize = rainGraph.chart.options.scales.xAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.04;
}

function configureGraphRainBar01(baseIn, graphIn) {
    //Display bar graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        graphLabels = [],
        style = baseIn.style.toString();
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = formatDataToUnit(graphDict[graphIn.data][i], baseIn.unit);
        graphLabels[i] = graphDict[graphIn.timestamp][i].format(graphIn.timeDisplay.toString());
    }
    
    rainGraph.chart.destroy();
    rainGraph.chart = null;
    
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
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasRainG01();
        });
    }
	
	resizeCanvasRainG01(); //Set canvas size initally
    checkOffLoaded();
}

//TEMPERATURE GRAPH
//Globals
var tempGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null
};

function drawTempGraphLine01() {
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
                    type: 'time',
                    ticks: {
                        minor: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        },
                        major: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        }
                    },
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {hour: "HH:mm"}
                    }
                }]
			}
		};
	tempGraph.chart = new Chart(tempGraph.canvas, {
		type: "line",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function resizeTextTempG01() {
    parentDiv = tempGraph.canvasDiv.parentElement;
    tempGraph.chart.options.title.fontSize = parentDiv.clientWidth * 0.05;
    tempGraph.chart.options.scales.yAxes[0].scaleLabel.fontSize = parentDiv.clientWidth * 0.05;
    tempGraph.chart.options.scales.yAxes[0].ticks.minor.fontSize = tempGraph.chart.options.scales.yAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.05;
    tempGraph.chart.options.scales.xAxes[0].ticks.minor.fontSize = tempGraph.chart.options.scales.xAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.04;
}

function configureGraphTempLine01(baseIn, graphIn) {
    //Display line graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        style = baseIn.style.toString();
    
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = {
            x: graphDict[graphIn.timestamp][i],
            y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit)
        };
    }
    
    tempGraph.chart.destroy();
    tempGraph.chart = null;
    
    //configure as line chart
    drawTempGraphLine01();;
    tempGraph.chart.data.datasets[0] = graphStyles[style];
    tempGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    tempGraph.chart.data.datasets[0].data = graphData;
    tempGraph.chart.options.scales.xAxes[0].time.unit = graphIn.timeDisplay.toString();
    tempGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    tempGraph.chart.options.title.text = graphIn.title.toString();
    
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions);
    for (i = 0; i < tickKeys.length; i++) {
        tempGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    resizeCanvasTempG01();
}

function resizeCanvasTempG01() {
	//Dynamic Canvas Resizing for desktop
    var ratio = 0.7,
        parentDiv = tempGraph.canvasDiv.parentElement;
    
	//Always adjust to the smallest dimention
    tempGraph.canvasDiv.style.width = (parentDiv.clientWidth).toString() + "px";
    tempGraph.canvasDiv.style.height = (parentDiv.clientWidth * ratio * 0.95).toString() + "px";
    
	tempGraph.chart.resize();
    resizeTextTempG01();
    tempGraph.chart.update();
}

function initializeTempGraph01() {
	//Initial Funtion Called
	//Define variables
	tempGraph.canvasDiv = document.getElementById('tempGraphCanvas01CanvasDiv');
	
	drawTempGraphLine01();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasTempG01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasTempG01();
        });
    }
	
	resizeCanvasTempG01(); //Set canvas size initally
    checkOffLoaded();
}

//WIND GRAPH
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
                    type: 'time',
                    ticks: {
                        minor: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        },
                        major: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        }
                    },
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {hour: "HH:mm"}
                    }
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
    windGraph.chart.options.scales.yAxes[0].ticks.minor.fontSize = windGraph.chart.options.scales.yAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.05;
    windGraph.chart.options.scales.xAxes[0].ticks.minor.fontSize = windGraph.chart.options.scales.xAxes[0].ticks.major.fontSize = parentDiv.clientWidth * 0.04;
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
            y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit)
        };
    }
    
    windGraph.chart.destroy();
    windGraph.chart = null;
    
    //configure as line chart
    drawWindGraphLine01();
    windGraph.chart.data.datasets[0] = graphStyles[style];
    windGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    windGraph.chart.data.datasets[0].data = graphData;
    windGraph.chart.options.scales.xAxes[0].time.unit = graphIn.timeDisplay.toString();
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
	windGraph.canvasDiv = document.getElementById('windGraphCanvas01CanvasDiv');
	
	drawWindGraphLine01();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWindG01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasWindG01();
        });
    }
	
	resizeCanvasWindG01(); //Set canvas size initally
    checkOffLoaded();
}

//HUMIDITY
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var humidityGauge = {
	stage: null,
	canvas: null,
    outerCircle: null,
    innerCircle: null,
    innerDot: null,
    outerCircleStrokeCommand: null,
    outerCircleCommand: null,
    innerCircleCommand: null,
    innerDotCommand: null,
    pointer: null,
    textTitle: null,
    dash: [],
    dashStrokeCommand: [],
    dashStartCommand: [],
    dashEndCommand: [],
    label: [],
    botLine: null,
    botLineStrokeCommand: null,
    botLineStartCommand: null,
    botLineEndCommand: null,
    largeDashTotal: 11,
    pointerCommand: {
        tip: null,
        lBase: null,
        rBase: null
    },
	setupVars: {
        outerCircleRad: null,
        innerCricleRad: null,
        posOuterCircle: null,
        posInnerCircle: null,
        posPointer: null,
        strokeSize: null,
        dashEndRad: null,
        posBotLine: null,
        labelCentreRad: null,
        textSize: null,
        textTitleSize: null,
        posTextTitle: null,
        textDisplaySize: null,
        posTextDisplay: null
	},
    tweens: {
        r: 0
    },
	values: {
		humidityIn: 0,
		humidityOut: 0,
        unitsIn: "humidity"
	},
    valuesOLD: {
		humidityIn: 0
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function drawHumidityGaugeHum01(humidityIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    if (humidityGauge.valuesOLD.humidityIn != humidityIn || unitChange === true) {
        var halfAngleDeg = (Math.PI - Math.acos((humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.posOuterCircle.y) / humidityGauge.setupVars.outerCircleRad)) * (180 / Math.PI);

        humidityGauge.values.humidityIn = parseFloat(humidityIn, 0);
        humidityGauge.values.humidityOut = humidityGauge.values.humidityIn.map(0, 100, -halfAngleDeg, halfAngleDeg);
        createjs.Tween.get(humidityGauge.tweens)
            .to({r: humidityGauge.values.humidityOut}, 2000, createjs.Ease.quartInOut);
        
        humidityGauge.valuesOLD.humidityIn = humidityIn;
    }
}

function updateTweensHum01() {
    //Updates any tweened or changing objects. This is called every frame
    humidityGauge.pointer.rotation = humidityGauge.tweens.r;
    humidityGauge.textDisplay.text = humidityGauge.values.humidityIn.toString() + "%";
}

function updateTopHum01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    humidityGauge.setupVars.outerCircleRad = humidityGauge.canvas.width * 0.4;
    humidityGauge.setupVars.innerCricleRad = humidityGauge.canvas.width * 0.05;
    humidityGauge.setupVars.cutOffLength = humidityGauge.setupVars.outerCircleRad * 2;
    humidityGauge.setupVars.strokeSize = humidityGauge.canvas.width / 80;
    humidityGauge.setupVars.dashEndRad = humidityGauge.setupVars.outerCircleRad * (3 / 4);
    humidityGauge.setupVars.labelCentreRad = humidityGauge.setupVars.outerCircleRad * (5 / 8);
    humidityGauge.setupVars.textSize = humidityGauge.canvas.width / 15;
    humidityGauge.setupVars.textTitleSize = humidityGauge.canvas.width / 13;
    humidityGauge.setupVars.textDisplaySize = humidityGauge.canvas.width / 10;
    humidityGauge.setupVars.posOuterCircle = {
        x: humidityGauge.canvas.width / 2,
        y: humidityGauge.canvas.height / 2
    };
    humidityGauge.setupVars.posInnerCircle = {
        x: humidityGauge.canvas.width / 2,
        y: humidityGauge.canvas.height / 2
    };
    humidityGauge.setupVars.posPointer = {
        xT: humidityGauge.canvas.width / 2,
        yT: humidityGauge.canvas.height * (1 / 5),
        xL: humidityGauge.canvas.width * (97 / 200),
        yL: humidityGauge.canvas.height * (3 / 5),
        xR: humidityGauge.canvas.width * (103 / 200),
        yR: humidityGauge.canvas.height * (3 / 5)
    };
    humidityGauge.setupVars.posBotLine = {
        xL: humidityGauge.setupVars.posOuterCircle.x - Math.sqrt(Math.pow(humidityGauge.setupVars.outerCircleRad, 2) - Math.pow((humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.posOuterCircle.x), 2)),
        xR: humidityGauge.setupVars.posOuterCircle.x + Math.sqrt(Math.pow(humidityGauge.setupVars.outerCircleRad, 2) - Math.pow((humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.posOuterCircle.x), 2)),
        y: humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.strokeSize / 10
    };
    humidityGauge.setupVars.posTextTitle = {
        x: humidityGauge.setupVars.posOuterCircle.x,
        y: humidityGauge.setupVars.cutOffLength * (110 / 103)
    };
    humidityGauge.setupVars.posTextDisplay = {
        x: humidityGauge.setupVars.posOuterCircle.x,
        y: humidityGauge.setupVars.cutOffLength * (103 / 110)
    };
	//Update the visual elements
    
	//Outer Circle
	humidityGauge.outerCircleStrokeCommand.width = humidityGauge.setupVars.strokeSize;
	humidityGauge.outerCircleCommand.x = humidityGauge.setupVars.posOuterCircle.x;
	humidityGauge.outerCircleCommand.y = humidityGauge.setupVars.posOuterCircle.y;
	humidityGauge.outerCircleCommand.radius = humidityGauge.setupVars.outerCircleRad;
    
    //Bottom line
    humidityGauge.botLineStrokeCommand.width = humidityGauge.setupVars.strokeSize;
    humidityGauge.botLineStartCommand.x = humidityGauge.setupVars.posBotLine.xL;
	humidityGauge.botLineStartCommand.y = humidityGauge.setupVars.posBotLine.y;
    humidityGauge.botLineEndCommand.x = humidityGauge.setupVars.posBotLine.xR;
	humidityGauge.botLineEndCommand.y = humidityGauge.setupVars.posBotLine.y;
    
	//Inner Circle fill
	humidityGauge.innerCircleCommand.x = humidityGauge.setupVars.posInnerCircle.x;
	humidityGauge.innerCircleCommand.y = humidityGauge.setupVars.posInnerCircle.y;
	humidityGauge.innerCircleCommand.radius = humidityGauge.setupVars.innerCricleRad;
    
    //Inner Circle fill
	humidityGauge.innerDotCommand.x = humidityGauge.setupVars.posInnerCircle.x;
	humidityGauge.innerDotCommand.y = humidityGauge.setupVars.posInnerCircle.y;
	humidityGauge.innerDotCommand.radius = humidityGauge.setupVars.innerCricleRad / 4;
    
    //Text Disaply
	humidityGauge.textDisplay.x = humidityGauge.setupVars.posTextDisplay.x;
	humidityGauge.textDisplay.y = humidityGauge.setupVars.posTextDisplay.y;
	humidityGauge.textDisplay.font = "bold " + humidityGauge.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	humidityGauge.textTitle.x = humidityGauge.setupVars.posTextTitle.x;
	humidityGauge.textTitle.y = humidityGauge.setupVars.posTextTitle.y;
	humidityGauge.textTitle.font = "bold " + humidityGauge.setupVars.textTitleSize + "px arial";
    
    //Pointer
    humidityGauge.pointerCommand.tip.x = humidityGauge.setupVars.posPointer.xT;
    humidityGauge.pointerCommand.tip.y = humidityGauge.setupVars.posPointer.yT;
    humidityGauge.pointerCommand.lBase.x = humidityGauge.setupVars.posPointer.xL;
    humidityGauge.pointerCommand.lBase.y = humidityGauge.setupVars.posPointer.yL;
    humidityGauge.pointerCommand.rBase.x = humidityGauge.setupVars.posPointer.xR;
    humidityGauge.pointerCommand.rBase.y = humidityGauge.setupVars.posPointer.yR;
    humidityGauge.pointer.regX = humidityGauge.canvas.width / 2;
    humidityGauge.pointer.regY = humidityGauge.canvas.height / 2;
    humidityGauge.pointer.x = humidityGauge.canvas.width / 2;
    humidityGauge.pointer.y = humidityGauge.canvas.height / 2;
	
	//Set masks
	humidityGauge.outerCircle.mask = new createjs.Shape(new createjs.Graphics().dr(0, 0, humidityGauge.canvas.width, humidityGauge.setupVars.cutOffLength));
    
    //Dashes
    var halfAngle = Math.PI - Math.acos((humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.posOuterCircle.y) / humidityGauge.setupVars.outerCircleRad),
        segment = (halfAngle) / (humidityGauge.largeDashTotal - 1);
    
    for (i = 0; i < (humidityGauge.largeDashTotal * 2 - 1); i++) {
        var angle = halfAngle - (segment * i) + Math.PI;
        humidityGauge.dash[i].regX = -humidityGauge.canvas.width / 2;
        humidityGauge.dash[i].regY = -humidityGauge.canvas.height / 2;
		//Large
		if (i % 2 === 0) {
			humidityGauge.dashStrokeCommand[i].width = humidityGauge.setupVars.strokeSize;
			humidityGauge.dashStartCommand[i].x = Math.sin(angle) * humidityGauge.setupVars.outerCircleRad;
			humidityGauge.dashStartCommand[i].y = Math.cos(angle) * humidityGauge.setupVars.outerCircleRad;
			humidityGauge.dashEndCommand[i].x = Math.sin(angle) * humidityGauge.setupVars.dashEndRad;
			humidityGauge.dashEndCommand[i].y = Math.cos(angle) * humidityGauge.setupVars.dashEndRad;
            
			//Text Label Positioning - located here as they line up with the large dashes
            humidityGauge.label[i / 2].regX = -humidityGauge.canvas.width / 2;
            humidityGauge.label[i / 2].regY = -humidityGauge.canvas.height / 2;
            humidityGauge.label[i / 2].x = Math.sin(angle) * humidityGauge.setupVars.labelCentreRad;
			humidityGauge.label[i / 2].y = Math.cos(angle) * humidityGauge.setupVars.labelCentreRad;
			humidityGauge.label[i / 2].font = humidityGauge.setupVars.textSize + "px arial";
		} else {
			//Med
			humidityGauge.dashStrokeCommand[i].width = humidityGauge.setupVars.strokeSize;
			humidityGauge.dashStartCommand[i].x = Math.sin(angle) * humidityGauge.setupVars.outerCircleRad;
			humidityGauge.dashStartCommand[i].y = Math.cos(angle) * humidityGauge.setupVars.outerCircleRad;
			humidityGauge.dashEndCommand[i].x = Math.sin(angle) * (humidityGauge.setupVars.dashEndRad + humidityGauge.setupVars.outerCircleRad) / 2;
			humidityGauge.dashEndCommand[i].y = Math.cos(angle) * (humidityGauge.setupVars.dashEndRad + humidityGauge.setupVars.outerCircleRad) / 2;
		}
	}
	
}

function resizeCanvasHum01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = humidityGauge.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    humidityGauge.canvas.width = parentDiv.clientWidth;
    humidityGauge.canvas.height = parentDiv.clientWidth;
    
    //Fix position of guage
	humidityGauge.stage.y = humidityGauge.canvas.height * -0.09;
	
	//Update shapes according to new dimentions
	updateTopHum01();
}

function setUpHum01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later

	//Set up outer Circle
	humidityGauge.outerCircle = new createjs.Shape();
	humidityGauge.outerCircle.snapToPixel = true;
	humidityGauge.outerCircle.graphics.beginStroke("black");
	humidityGauge.outerCircle.graphics.beginFill("#F6F6F6");
	humidityGauge.outerCircleStrokeCommand = humidityGauge.outerCircle.graphics.setStrokeStyle(0).command;
	humidityGauge.outerCircleCommand = humidityGauge.outerCircle.graphics.drawCircle(0, 0, 0).command;
	humidityGauge.stage.addChild(humidityGauge.outerCircle);
    
    //Set up bottom line
    humidityGauge.botLine = new createjs.Shape();
    humidityGauge.botLine.snapToPixel = true;
    humidityGauge.botLine.graphics.beginStroke("black", 1);
    humidityGauge.botLineStrokeCommand = humidityGauge.botLine.graphics.setStrokeStyle(100).command;
    humidityGauge.botLineStartCommand = humidityGauge.botLine.graphics.moveTo(0, 0).command;
    humidityGauge.botLineEndCommand = humidityGauge.botLine.graphics.lineTo(0, 0).command;
    humidityGauge.stage.addChild(humidityGauge.botLine);
    
    //Set up pointer
    humidityGauge.pointer = new createjs.Shape();
	humidityGauge.pointer.snapToPixel = true;
    humidityGauge.pointer.graphics.beginFill("black");
    humidityGauge.pointer.graphics.setStrokeStyle(10);
	humidityGauge.pointerCommand.tip = humidityGauge.pointer.graphics.moveTo(10, 0).command;
    humidityGauge.pointerCommand.lBase = humidityGauge.pointer.graphics.lineTo(0, 10).command;
    humidityGauge.pointerCommand.rBase = humidityGauge.pointer.graphics.lineTo(10, 10).command;
    humidityGauge.pointer.graphics.closePath();
	humidityGauge.stage.addChild(humidityGauge.pointer);
    
    //Set up inner circle
    humidityGauge.innerCircle = new createjs.Shape();
	humidityGauge.innerCircle.snapToPixel = true;
	humidityGauge.innerCircle.graphics.beginFill("black");
    humidityGauge.innerCircle.graphics.setStrokeStyle(0);
	humidityGauge.innerCircleCommand = humidityGauge.innerCircle.graphics.drawCircle(0, 0, 0).command;
	humidityGauge.stage.addChild(humidityGauge.innerCircle);
    
    //Set up inner dot
    humidityGauge.innerDot = new createjs.Shape();
	humidityGauge.innerDot.snapToPixel = true;
	humidityGauge.innerDot.graphics.beginFill("rgb(" + colour.humidity + ")");
    humidityGauge.innerDot.graphics.setStrokeStyle(0);
	humidityGauge.innerDotCommand = humidityGauge.innerDot.graphics.drawCircle(0, 0, 0).command;
	humidityGauge.stage.addChild(humidityGauge.innerDot);
    
    //Set up text display (current value)
	humidityGauge.textDisplay = new createjs.Text(" ", "0px Arial", "black");
	humidityGauge.textDisplay.textBaseline = "middle";
	humidityGauge.textDisplay.textAlign = "center";
	humidityGauge.stage.addChild(humidityGauge.textDisplay);
    
    //Set up text title (bottom text)
	humidityGauge.textTitle = new createjs.Text(" ", "0px Arial", "black");
	humidityGauge.textTitle.textBaseline = "middle";
	humidityGauge.textTitle.textAlign = "center";
	humidityGauge.stage.addChild(humidityGauge.textTitle);
	humidityGauge.textTitle.text = "Humidity (%)";
    
    //Set up text labels
	for (i = 0; i < humidityGauge.largeDashTotal; i++) {
        var labelText = Math.round((100 * i / (humidityGauge.largeDashTotal - 1)), 0);
		humidityGauge.label[i] = new createjs.Text(labelText.toString(), "black");
		humidityGauge.label[i].textBaseline = "middle";
		humidityGauge.label[i].textAlign = "center";
		humidityGauge.stage.addChild(humidityGauge.label[i]);
	}
    
    //Set up dashes
    for (i = 0; i < humidityGauge.largeDashTotal * 2; i++) {
		humidityGauge.dash[i] = new createjs.Shape();
		humidityGauge.dash[i].snapToPixel = true;
		humidityGauge.dash[i].graphics.beginStroke("black", 1);
		humidityGauge.dashStrokeCommand[i] = humidityGauge.dash[i].graphics.setStrokeStyle(110).command;
		humidityGauge.dashStartCommand[i] = humidityGauge.dash[i].graphics.moveTo(0, 0).command;
		humidityGauge.dashEndCommand[i] = humidityGauge.dash[i].graphics.lineTo(0, 0).command;
		humidityGauge.stage.addChild(humidityGauge.dash[i]);
	}
}

function initializeHum01() {
	//The first function that is called
    
	//Define canvas and stage varaibles
	humidityGauge.stage = new createjs.Stage(humidityGauge.canvas);
    
    window.addEventListener("frameUpdate", function () {
        humidityGauge.stage.update();
        updateTweensHum01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawHumidityGaugeHum01(arrayClientraw[5]);
    });
    
    
    //Creates information tooltip
    new Opentip(humidityGauge.canvas, "The amount of water vapour in the air as a percentage of the amount the air is capable of holding.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpHum01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasHum01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasHum01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasHum01();
    
    checkOffLoaded();
}

//MOONSUN
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
        
        moonSun01.valuesOld.sunRiseIn = sunRiseIn;
        moonSun01.valuesOld.sunSetIn = sunSetIn;
        moonSun01.valuesOld.moonRiseIn = moonRiseIn;
        moonSun01.valuesOld.moonSetIn = moonSetIn;
        moonSun01.valuesOld.moonPhaseIn = moonPhaseIn;
        moonSun01.valuesOld.moonAgeIn = moonAgeIn;
    }
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
	moonSun01.stage = new createjs.Stage(moonSun01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        moonSun01.stage.update();
    });
    window.addEventListener("clientRawExtraDataUpdate", function () {
        drawMoonSunMS01(arrayClientrawExtra[556], arrayClientrawExtra[557], arrayClientrawExtra[558], arrayClientrawExtra[559], arrayClientrawExtra[560], arrayClientrawExtra[561]);
    });
    
    //Creates information tooltip (none for this widget)
    //new Opentip(moonSun01.canvas, "Information",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpMS01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasMS01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasMS01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasMS01();
    
    checkOffLoaded();
}

//SOLAR BAR
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var solarBar01 = {
    size: 0.4,
    widthScaler: 0.5,
	stage: null,
	canvas: null,
	rectTop: null,
    rectFillTop: null,
	rectCommand: null,
	rectFillCommand: null,
	topStrokeCommand: null,
	botStrokeCommand: null,
	textDisplay: null,
	textPercentage: null,
	textSunHours: null,
	textTitle: null,
	textMaxLabel: null,
	setupVars: {
        barWidth: null,
        barFillWidth: null,
        barHeight: null,
        barFillHeight: null,
        strokeSize: null,
		textDisplaySize: null,
		textTitleSize: null,
		textMaxLabelSize: null,
        posBar: {},
        posFillBar: {}
	},
    tweens: {
        barFill: {
            h: 0
        }
    },
	values: {
		uniIn: 0,
		sunHoursIn: 0,
		percentIn: 0,
		percentOut: 0
	},
    valuesOLD: {
		uniIn: 0,
		sunHoursIn: 0,
		percentIn: 0,
	},
    config: {
        unitsIn: "solar",
        title: "Solar",
        canvasID: "SolarBar01",
        textMaxLabel: "100%"
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputSol01() {
	//Formats the universal to be displayed correctly
    
    //Adjust to units
    solarBar01.values.percentIn = formatDataToUnit(solarBar01.values.percentIn, solarBar01.config.unitsIn);
    
    //Map the inputs to the current scale (as a proportion)
	solarBar01.values.percentOut = solarBar01.values.percentIn.map(0, 100, 0, 1);
}

function drawSolarBarSol01(percentIn, uniIn, sunHoursIn, unitChange) {
    //Is called when new data is sent.
    unitChange = unitChange || false;
    
    if (solarBar01.valuesOLD.uniIn != percentIn || solarBar01.valuesOLD.percentIn != uniIn || solarBar01.valuesOLD.sunHoursIn != sunHoursIn || unitChange === true) {
        //Sets inputs to new data
        solarBar01.values.uniIn = Number(uniIn);
        solarBar01.values.percentIn = Number(percentIn);
        solarBar01.values.sunHoursIn = Number(sunHoursIn);

        //Starts the tweens (animations) of the inputs
        formatInputSol01();
        createjs.Tween.get(solarBar01.tweens.barFill)
            .to({h: solarBar01.values.percentOut}, 2000, createjs.Ease.quartInOut);
        
        solarBar01.valuesOLD.uniIn = percentIn;
        solarBar01.valuesOLD.percentIn = uniIn;
        solarBar01.valuesOLD.sunHoursIn = sunHoursIn;
    }
}

function updateTweensSol01() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Uni Bar Fill
    solarBar01.rectFillCommand.h = solarBar01.tweens.barFill.h * (solarBar01.rectCommand.h);
	solarBar01.rectFillCommand.y = solarBar01.rectCommand.h - solarBar01.rectFillCommand.h + solarBar01.rectCommand.y;
	
	//Text Displays
	solarBar01.textDisplay.text = solarBar01.values.uniIn.toString() + units[solarBar01.config.unitsIn.toString()][currentUnits[solarBar01.config.unitsIn.toString()]][1].toString();
    
	solarBar01.textPercentage.text = solarBar01.values.percentIn.toString() + "%";
    
	solarBar01.textSunHours.text = "Sun Hours: " + solarBar01.values.sunHoursIn.toString();
}

function updateTopSol01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    solarBar01.setupVars.barWidth = solarBar01.canvas.height * 0.075;
    solarBar01.setupVars.barFillWidth = solarBar01.setupVars.barWidth;
    solarBar01.setupVars.barHeight = solarBar01.canvas.height * 0.75;
    solarBar01.setupVars.barFillHeight = solarBar01.setupVars.barHeight;
    solarBar01.setupVars.strokeSize = solarBar01.setupVars.barWidth / 40;
    solarBar01.setupVars.textDisplaySize = solarBar01.canvas.height / 20;
    solarBar01.setupVars.textTitleSize = solarBar01.canvas.height / 15;
    solarBar01.setupVars.textMaxLabelSize = solarBar01.canvas.height / 19;
    solarBar01.setupVars.posBar = {
        x: ((solarBar01.canvas.height / 2) - (solarBar01.setupVars.barWidth / 2)),
        y: ((solarBar01.canvas.height / 2) - (solarBar01.canvas.height * 0.8 / 2))
    };
    solarBar01.setupVars.posTextPercentage = {
        x: solarBar01.setupVars.posBar.x + solarBar01.setupVars.barWidth / 2,
        y: solarBar01.setupVars.barHeight * (201 / 170)
    };
    solarBar01.setupVars.posTextSunHours = {
        x: solarBar01.setupVars.posBar.x - solarBar01.setupVars.barWidth / 4,
        y: solarBar01.setupVars.barHeight * (201 / 155)
    };
    solarBar01.setupVars.posText = {
        x: solarBar01.setupVars.posBar.x + solarBar01.setupVars.barWidth / 2,
        y: solarBar01.setupVars.barHeight * (201 / 162)
    };
    solarBar01.setupVars.posTextTitle = {
        x: solarBar01.setupVars.posBar.x + solarBar01.setupVars.barWidth / 2,
        y: solarBar01.canvas.height * 0.8 * (1 / 17)
    };
    solarBar01.setupVars.posTextMaxLabel = {
        x: solarBar01.setupVars.posBar.x - solarBar01.setupVars.barWidth * (1 / 4),
        y: (solarBar01.canvas.height - solarBar01.setupVars.barHeight) / 2
    };
    solarBar01.setupVars.posFillBar = {
        x: ((solarBar01.canvas.height / 2) - (solarBar01.setupVars.barFillWidth / 2)),
        y: ((solarBar01.canvas.height / 2) - (solarBar01.setupVars.barFillHeight / 2))
    };
    
	//Update the visual elements
    
	//Top
	solarBar01.topStrokeCommand.width = solarBar01.setupVars.strokeSize;
	solarBar01.rectCommand.x = solarBar01.setupVars.posBar.x;
	solarBar01.rectCommand.y = solarBar01.setupVars.posBar.y;
	solarBar01.rectCommand.w = solarBar01.setupVars.barWidth;
	solarBar01.rectCommand.h = solarBar01.setupVars.barHeight;
	
	//Bar Fill
	solarBar01.rectFillCommand.x = solarBar01.setupVars.posFillBar.x;
	solarBar01.rectFillCommand.w = solarBar01.setupVars.barFillWidth;
	
	//Text Displays
	solarBar01.textDisplay.x = solarBar01.setupVars.posText.x;
	solarBar01.textDisplay.y = solarBar01.setupVars.posText.y;
	solarBar01.textDisplay.font = "bold " + solarBar01.setupVars.textDisplaySize + "px arial";

	solarBar01.textPercentage.x = solarBar01.setupVars.posTextPercentage.x;
	solarBar01.textPercentage.y = solarBar01.setupVars.posTextPercentage.y;
	solarBar01.textPercentage.font = "bold " + solarBar01.setupVars.textDisplaySize + "px arial";
    
    solarBar01.textSunHours.x = solarBar01.setupVars.posTextSunHours.x;
	solarBar01.textSunHours.y = solarBar01.setupVars.posTextSunHours.y;
	solarBar01.textSunHours.font = solarBar01.setupVars.textDisplaySize * 0.9 + "px arial";
    
    //Text Title
	solarBar01.textTitle.x = solarBar01.setupVars.posTextTitle.x;
	solarBar01.textTitle.y = solarBar01.setupVars.posTextTitle.y;
	solarBar01.textTitle.font = "bold " + solarBar01.setupVars.textTitleSize + "px arial";
    
    //Text Max Label
	solarBar01.textMaxLabel.x = solarBar01.setupVars.posTextMaxLabel.x;
	solarBar01.textMaxLabel.y = solarBar01.setupVars.posTextMaxLabel.y;
	solarBar01.textMaxLabel.font = "bold " + solarBar01.setupVars.textMaxLabelSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensSol01();
}

function resizeCanvasSol01() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 3,
        parentDiv = solarBar01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    solarBar01.canvas.width = parentDiv.clientHeight / ratio;
    solarBar01.canvas.height = parentDiv.clientHeight;
    
    solarBar01.stage.x = -(solarBar01.canvas.width / 1.2);

	//Update shapes according to new dimentions
	updateTopSol01();
}


function setUpSol01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	solarBar01.rectTop = new createjs.Shape();
	solarBar01.rectTop.snapToPixel = true;
	solarBar01.rectTop.graphics.beginStroke("black");
	solarBar01.rectTop.graphics.beginFill("#F6F6F6");
	solarBar01.topStrokeCommand = solarBar01.rectTop.graphics.setStrokeStyle(0).command;
	solarBar01.rectCommand = solarBar01.rectTop.graphics.drawRect(0, 0, 0, 0).command;
	solarBar01.stage.addChild(solarBar01.rectTop);
    
    //Set up fill rectange
    solarBar01.rectFillTop = new createjs.Shape();
	solarBar01.rectFillTop.snapToPixel = true;
	solarBar01.rectFillTop.graphics.beginFill("rgb(" + colour[solarBar01.config.unitsIn.toString()].toString()+ ")");
    solarBar01.rectFillTop.graphics.setStrokeStyle(0);
	solarBar01.rectFillCommand = solarBar01.rectFillTop.graphics.drawRect(0, 0, 0, 0).command;
	solarBar01.stage.addChild(solarBar01.rectFillTop);
    
	//Set up text displays
	solarBar01.textDisplay = new createjs.Text("0px Arial", "black");
	solarBar01.textDisplay.textBaseline = "middle";
	solarBar01.textDisplay.textAlign = "center";
	solarBar01.stage.addChild(solarBar01.textDisplay);
    
    solarBar01.textPercentage = new createjs.Text("0px Arial", "black");
	solarBar01.textPercentage.textBaseline = "middle";
	solarBar01.textPercentage.textAlign = "center";
	solarBar01.stage.addChild(solarBar01.textPercentage);
    
    solarBar01.textSunHours = new createjs.Text("0px Arial", "black");
	solarBar01.textSunHours.textBaseline = "middle";
	solarBar01.textSunHours.textAlign = "center";
	solarBar01.stage.addChild(solarBar01.textSunHours);
    
    //Set up text title (top text)
	solarBar01.textTitle = new createjs.Text("0px Arial", "black");
	solarBar01.textTitle.textBaseline = "middle";
	solarBar01.textTitle.textAlign = "center";
	solarBar01.stage.addChild(solarBar01.textTitle);
	solarBar01.textTitle.text = solarBar01.config.title;
    
    //Set up max label
	solarBar01.textMaxLabel = new createjs.Text("0px Arial", "black");
	solarBar01.textMaxLabel.textBaseline = "middle";
	solarBar01.textMaxLabel.textAlign = "right";
	solarBar01.stage.addChild(solarBar01.textMaxLabel);
	solarBar01.textMaxLabel.text = solarBar01.config.textMaxLabel;
}

function initializeSolarBarSol01() {
	//The first function that is called
	//Define canvas and stage varaibles
	solarBar01.stage = new createjs.Stage(solarBar01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        solarBar01.stage.update();
        updateTweensSol01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawSolarBarSol01(arrayClientraw[34], arrayClientraw[127], arrayClientrawExtra[696]);
    });
    window.addEventListener("clientRawExtraDataUpdate", function () {
        drawSolarBarSol01(arrayClientraw[34], arrayClientraw[127], arrayClientrawExtra[696]);
    });
    
    //Creates information tooltip
    new Opentip(solarBar01.canvas, "The intensity of the sun's radiation.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpSol01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasSol01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasSol01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasSol01();
    
    checkOffLoaded();
}

//STATUS
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
        stationName: null,
        time: null
	},
    config: {
        canvasID: "Status01"
    }
};

function checkDataStatus() {
    //Checks if sucessful data was found
    if (dataCollectErrorCR === true && dataCollectErrorCRE === true && dataCollectErrorCRD === true && dataCollectErrorCRH === true) {
        //Partial Error
        return "Full Error";
    } else if ((dataCollectErrorCR === true || dataCollectErrorCRE === true || dataCollectErrorCRD === true || dataCollectErrorCRH === true) && noDataChanged === true) {
        //Partial Error
        return "Partial Error, No New Data";
    } else if (dataCollectErrorCR === true || dataCollectErrorCRE === true || dataCollectErrorCRD === true || dataCollectErrorCRH === true) {
        //Partial Error
        return "Partial Error, New Data";
    } else if (noDataChanged === true) {
        //No New Data
        return "No New Data";
    } else {
        //No Errors
        return "Normal";
    }
}

function drawStatusS01(statusIn, stationTimeIn) {
    //Is called when new data is sent.
    
    var dataStatusIn = checkDataStatus(),
        stationNameIn = stationTimeIn.substring(0, stationTimeIn.indexOf("-")),
        timeIn = stationTimeIn.substring(stationTimeIn.indexOf("-") + 1);
    
    //The one widget which doesn't need to be checked if widget actually needs to be updated (Breaks it if you do)
    
    //Sets inputs to new data
    status01.values.status = statusIn.replace(/_/g, " ");
    status01.values.stationName = stationNameIn.replace(/_/g, " ");
    status01.values.time = timeIn;
    //Format Data Status, and set blink colour
    if (dataStatusIn == "Full Error") {
        status01.values.dataStatus = status01.values.stationName.toString() +  " | No data since: " + status01.values.time.toString();
        status01.blinkColour = "rgba(209, 32, 32, 0.9)"; //Same as high temp
    } else if (dataStatusIn == "Partial Error, New Data") {
        status01.values.dataStatus = status01.values.stationName.toString() +  " | Latest data received at: " + status01.values.time.toString();
        status01.blinkColour = "rgba(234, 242, 45, 0.9)"; //Same as UV
    } else if (dataStatusIn == "Partial Error, No New Data") {
        status01.blinkColour = "rgba(234, 242, 45, 0.9)"; //Same as UV
    } else if (dataStatusIn == "No New Data") {
        status01.blinkColour = status01.blankBlinkColour;
    } else if (dataStatusIn == "Normal") {
        status01.values.dataStatus = status01.values.stationName.toString() +  " | Latest data received at: " + status01.values.time.toString();
        status01.blinkColour = "rgba(23, 145, 27, 0.9)"; //Same as wind direction
    } else {
        console.log("Invalid dataStatus");
    }

    //Text Displays
    status01.textDisplayS.text = status01.values.status;
    status01.textDisplayD.text = status01.values.dataStatus;
    
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
    status01.blankBlinkColour = "rgba(100, 100, 100, 0.9)";
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
    
    window.addEventListener("frameUpdate", function () {
        status01.stage.update();
        updateTweensS01();
    });
    
    //Creates information tooltip
    new Opentip(status01.canvas, "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpS01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasS01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasS01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasS01();
    
    checkOffLoaded();
}

//TITLE RAINFALL
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var titleRainfall01 = {
	stage: null,
	canvas: null,
	textTitleRainfall: null,
	setupVars: {
		textTitleSize: null
	},
	values: {
        temp: 0
	},
    valuesOld: {
        temp: 0
	},
    config: {
        canvasID: "TitleRainfall01"
    }
};

function updateTopTR01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    titleRainfall01.setupVars.textTitleSize = titleRainfall01.canvas.width * 0.1;
    titleRainfall01.setupVars.posTitleRainfall = {
        x: sharpenValue(titleRainfall01.canvas.width * (1 / 2)),
        y: sharpenValue(titleRainfall01.canvas.height * (1 / 2))
    };
    
    //Update the visual elements
    //Text Titles
	titleRainfall01.textTitleRainfall.x = titleRainfall01.setupVars.posTitleRainfall.x;
	titleRainfall01.textTitleRainfall.y = titleRainfall01.setupVars.posTitleRainfall.y;
	titleRainfall01.textTitleRainfall.font = "bold " + titleRainfall01.setupVars.textTitleSize + "px arial";
}

function resizeCanvasTR01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = titleRainfall01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    titleRainfall01.canvas.width = parentDiv.clientHeight * 0.99;
    titleRainfall01.canvas.height = parentDiv.clientHeight * 0.12;

	//Update shapes according to new dimentions
	updateTopTR01();
}


function setUpTR01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
    
    //Set up text titles
	titleRainfall01.textTitleRainfall = new createjs.Text("Rainfall", "0px Arial", "black");
	titleRainfall01.textTitleRainfall.textBaseline = "middle";
	titleRainfall01.textTitleRainfall.textAlign = "center";
	titleRainfall01.stage.addChild(titleRainfall01.textTitleRainfall);
}

function initializeTitleRainfallTR01() {
	//The first function that is called
	//Define canvas and stage varaibles
	titleRainfall01.stage = new createjs.Stage(titleRainfall01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        titleRainfall01.stage.update();
    });
    
    //Creates information tooltip
    //new Opentip(titleRainfall01.canvas, "Perceived temperature based on temperature, humidity, sun, and wind.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpTR01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasTR01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasTR01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasTR01();
    
    checkOffLoaded();
}

//RAIN BAR 1
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var uniBar01 = {
    size: 0.4,
    widthScaler: 0.5,
	stage: null,
	canvas: null,
	rectTop: null,
    rectFillTop: null,
	rectCommand: null,
	rectFillCommand: null,
	topStrokeCommand: null,
	botStrokeCommand: null,
	textDisplay: null,
	textTitle: null,
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
		textDisplaySize: null,
		textTitleSize: null,
        posBar: {},
        posFillBar: {},
		posHLLabel: {}
	},
	constants: {
		minUni: 0,
		minUniDEFAULT: 0,
		maxUni: 4,
		maxUniDEFAULT: 4
	},
    tweens: {
        barFill: {
            h: 0
        }
    },
	values: {
		uniIn: 0,
		uniOut: 0
	},
    valuesOLD: {
		uniIn: 0
	},
    config: {
        unitsIn: "rainfall",
        title: "Daily",
        canvasID: "RainBar1",
        tickScaler: 1
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputUni01() {
	//Formats the universal to be displayed correctly
	var gapNum = uniBar01.largeDashTotal - 1;
    
    //Adjust to units
    uniBar01.values.uniIn = formatDataToUnit(uniBar01.values.uniIn, uniBar01.config.unitsIn);
    
	//Adjust Range if needed: if the input is less than the current minimum of the range, decrease the minimum. If the input is bigger than the current maximum of the range, increase the maximum. 
	while (uniBar01.values.uniIn < uniBar01.constants.minUni) {uniBar01.constants.minUni -= uniBar01.config.tickScaler * (gapNum); }
	while (uniBar01.values.uniIn > uniBar01.constants.maxUni) {uniBar01.constants.maxUni += uniBar01.config.tickScaler * (gapNum); }

    //Adjust Range if needed: if the input is bigger than the current minimum of the range, increase the minimum. If the input is less than the current maximum of the range, decrease the maximum. 
	while ((uniBar01.values.uniIn >= uniBar01.constants.minUni + uniBar01.config.tickScaler * (gapNum) && uniBar01.constants.minUni < uniBar01.constants.minUniDEFAULT)) {uniBar01.constants.minUni += uniBar01.config.tickScaler * (gapNum); }
	while ((uniBar01.values.uniIn <= uniBar01.constants.maxUni - uniBar01.config.tickScaler * (gapNum) && uniBar01.constants.maxUni > uniBar01.constants.maxUniDEFAULT)) {uniBar01.constants.maxUni -= uniBar01.config.tickScaler * (gapNum); }
	
    //Map the inputs to the current scale (as a percentage)
	uniBar01.values.uniOut = uniBar01.values.uniIn.map(uniBar01.constants.minUni, uniBar01.constants.maxUni, 0, 1);
}

function drawUniratureBarUni01(uniIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //check if widget actually needs to be updated
    if (uniBar01.valuesOLD.uniIn != uniIn || unitChange === true) {
        //Sets inputs to new data
        uniBar01.values.uniIn = uniIn;

        //Starts the tweens (animations) of the inputs
        formatInputUni01();
        createjs.Tween.get(uniBar01.tweens.barFill)
            .to({h: uniBar01.values.uniOut}, 2000, createjs.Ease.quartInOut);
        
        uniBar01.valuesOLD.uniIn = uniIn;
    }
    
}

function updateTweensUni01() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Uni Bar Fill
    uniBar01.rectFillCommand.h = uniBar01.tweens.barFill.h * (uniBar01.rectCommand.h);
	uniBar01.rectFillCommand.y = uniBar01.rectCommand.h - uniBar01.rectFillCommand.h + uniBar01.rectCommand.y;
	
	//Labels
	for (i = 0; i < uniBar01.largeDashTotal; i++) {
		uniBar01.label[i].text = uniBar01.constants.maxUni - ((uniBar01.constants.maxUni - uniBar01.constants.minUni) / (uniBar01.largeDashTotal - 1)) * i;
	}
	
	//Text Display
	uniBar01.textDisplay.text = uniBar01.values.uniIn.toString() + units[uniBar01.config.unitsIn.toString()][currentUnits[uniBar01.config.unitsIn.toString()]][1].toString();
}

function updateTopUni01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    uniBar01.setupVars.dashLength = uniBar01.canvas.height * 0.075;
    uniBar01.setupVars.dashGap = uniBar01.canvas.height * 0.025;
    uniBar01.setupVars.barWidth = uniBar01.canvas.height * 0.075;
    uniBar01.setupVars.barFillWidth = uniBar01.setupVars.barWidth;
    uniBar01.setupVars.barHeight = uniBar01.canvas.height * 0.8;
    uniBar01.setupVars.barFillHeight = uniBar01.setupVars.barHeight;
    uniBar01.setupVars.strokeSize = uniBar01.setupVars.barWidth / 40;
    uniBar01.setupVars.textSize = uniBar01.canvas.height / 17;
    uniBar01.setupVars.textDisplaySize = uniBar01.canvas.height / 19;
    uniBar01.setupVars.textTitleSize = uniBar01.canvas.height / 15;
    uniBar01.setupVars.posBar = {
        x: ((uniBar01.canvas.height / 2) - (uniBar01.setupVars.barWidth / 2)),
        y: ((uniBar01.canvas.height / 2) - (uniBar01.setupVars.barHeight / 2))
    };
    uniBar01.setupVars.posDash = {
        x: (uniBar01.canvas.height / 2) - (uniBar01.setupVars.barWidth / 2) - uniBar01.setupVars.dashLength - uniBar01.setupVars.dashGap,
        y: (uniBar01.canvas.height - uniBar01.setupVars.barHeight) / 2
    };
    uniBar01.setupVars.posText = {
        x: uniBar01.setupVars.posBar.x,
        y: uniBar01.setupVars.barHeight * (201 / 170)
    };
    uniBar01.setupVars.posTextTitle = {
        x: uniBar01.setupVars.posBar.x,
        y: uniBar01.setupVars.barHeight * (1 / 17)
    };
    uniBar01.setupVars.posFillBar = {
        x: ((uniBar01.canvas.height / 2) - (uniBar01.setupVars.barFillWidth / 2)),
        y: ((uniBar01.canvas.height / 2) - (uniBar01.setupVars.barFillHeight / 2))
    };
    
	//Update the visual elements
    
	//Top
	uniBar01.topStrokeCommand.width = uniBar01.setupVars.strokeSize;
	uniBar01.rectCommand.x = uniBar01.setupVars.posBar.x;
	uniBar01.rectCommand.y = uniBar01.setupVars.posBar.y;
	uniBar01.rectCommand.w = uniBar01.setupVars.barWidth;
	uniBar01.rectCommand.h = uniBar01.setupVars.barHeight;
    
	//Dashes
    var gap = (uniBar01.setupVars.barHeight - uniBar01.setupVars.posDash.y) / ((uniBar01.largeDashTotal) * 10 - 15);
    //This just works... 
	for (i = 0; i < (uniBar01.largeDashTotal * 10 - 9); i++) {
        var dashY = sharpenValue(gap * i + uniBar01.setupVars.posDash.y);
		//Large
		if (i % 10 === 0) {
			uniBar01.dashStrokeCommand[i].width = uniBar01.setupVars.strokeSize;
			uniBar01.dashStartCommand[i].x = uniBar01.setupVars.posDash.x;
			uniBar01.dashStartCommand[i].y = dashY;
			uniBar01.dashEndCommand[i].x = uniBar01.setupVars.posDash.x + uniBar01.setupVars.dashLength;
			uniBar01.dashEndCommand[i].y = dashY;
            
			//Text Label Positioning - located here as they line up with the large dashes
			uniBar01.label[i / 10].y = dashY;
			uniBar01.label[i / 10].x = (uniBar01.setupVars.posDash.x - uniBar01.setupVars.dashLength) * (6 / 5);
			uniBar01.label[i / 10].font = uniBar01.setupVars.textSize + "px arial";
		} else if (i % 5 === 0) {
			//Med
			uniBar01.dashStrokeCommand[i].width = uniBar01.setupVars.strokeSize;
			uniBar01.dashStartCommand[i].x = uniBar01.setupVars.posDash.x + uniBar01.setupVars.dashLength - (uniBar01.setupVars.dashLength / 2);
			uniBar01.dashStartCommand[i].y = dashY;
			uniBar01.dashEndCommand[i].x = (uniBar01.setupVars.posDash.x + uniBar01.setupVars.dashLength);
			uniBar01.dashEndCommand[i].y = dashY;
		} else {
			//Small
			uniBar01.dashStrokeCommand[i].width = uniBar01.setupVars.strokeSize;
			uniBar01.dashStartCommand[i].x = uniBar01.setupVars.posDash.x + uniBar01.setupVars.dashLength - (uniBar01.setupVars.dashLength / 3);
			uniBar01.dashStartCommand[i].y = dashY;
			uniBar01.dashEndCommand[i].x = (uniBar01.setupVars.posDash.x + uniBar01.setupVars.dashLength);
			uniBar01.dashEndCommand[i].y = dashY;
		}
	}
	
	//Bar Fill
	uniBar01.rectFillCommand.x = uniBar01.setupVars.posFillBar.x;
	uniBar01.rectFillCommand.w = uniBar01.setupVars.barFillWidth;
	
	//Text Display
	uniBar01.textDisplay.x = uniBar01.setupVars.posText.x;
	uniBar01.textDisplay.y = uniBar01.setupVars.posText.y;
	uniBar01.textDisplay.font = "bold " + uniBar01.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	uniBar01.textTitle.x = uniBar01.setupVars.posTextTitle.x;
	uniBar01.textTitle.y = uniBar01.setupVars.posTextTitle.y;
	uniBar01.textTitle.font = "bold " + uniBar01.setupVars.textTitleSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensUni01();
}

function resizeCanvasUni01() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 2.5,
        parentDiv = uniBar01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    uniBar01.canvas.width = parentDiv.clientWidth / 3.01;
    uniBar01.canvas.height = parentDiv.clientWidth * ratio / 3.0;
    
    uniBar01.stage.x = -(uniBar01.canvas.width / 2);

	//Update shapes according to new dimentions
	updateTopUni01();
}

function setUpUni01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	uniBar01.rectTop = new createjs.Shape();
	uniBar01.rectTop.snapToPixel = true;
	uniBar01.rectTop.graphics.beginStroke("black");
	uniBar01.rectTop.graphics.beginFill("#F6F6F6");
	uniBar01.topStrokeCommand = uniBar01.rectTop.graphics.setStrokeStyle(0).command;
	uniBar01.rectCommand = uniBar01.rectTop.graphics.drawRect(0, 0, 0, 0).command;
	uniBar01.stage.addChild(uniBar01.rectTop);
	
	//Set up Dashes
	for (i = 0; i < uniBar01.largeDashTotal * 10; i++) {
		uniBar01.dash[i] = new createjs.Shape();
		uniBar01.dash[i].snapToPixel = true;
		uniBar01.dash[i].graphics.beginStroke("black", 1);
		uniBar01.dashStrokeCommand[i] = uniBar01.dash[i].graphics.setStrokeStyle(0).command;
		uniBar01.dashStartCommand[i] = uniBar01.dash[i].graphics.moveTo(0, 0).command;
		uniBar01.dashEndCommand[i] = uniBar01.dash[i].graphics.lineTo(0, 0).command;
		uniBar01.stage.addChild(uniBar01.dash[i]);
	}
    
    //Set up fill rectange
    uniBar01.rectFillTop = new createjs.Shape();
	uniBar01.rectFillTop.snapToPixel = true;
	uniBar01.rectFillTop.graphics.beginFill("rgba(" + colour[uniBar01.config.unitsIn.toString()].toString() + ", 0.6)");
    uniBar01.rectFillTop.graphics.setStrokeStyle(0);
	uniBar01.rectFillCommand = uniBar01.rectFillTop.graphics.drawRect(0, 0, 0, 0).command;
	uniBar01.stage.addChild(uniBar01.rectFillTop);
	
	//Set up text labels
	for (i = 0; i < uniBar01.largeDashTotal; i++) {
		uniBar01.label[i] = new createjs.Text("0px Arial", "black");
		uniBar01.label[i].textBaseline = "middle";
		uniBar01.label[i].textAlign = "right";
		uniBar01.stage.addChild(uniBar01.label[i]);
	}
    
	//Set up text display
	uniBar01.textDisplay = new createjs.Text("0px Arial", "black");
	uniBar01.textDisplay.textBaseline = "middle";
	uniBar01.textDisplay.textAlign = "center";
	uniBar01.stage.addChild(uniBar01.textDisplay);
    
    //Set up text title (top text)
	uniBar01.textTitle = new createjs.Text("0px Arial", "black");
	uniBar01.textTitle.textBaseline = "middle";
	uniBar01.textTitle.textAlign = "center";
	uniBar01.stage.addChild(uniBar01.textTitle);
	uniBar01.textTitle.text = uniBar01.config.title;
}

function initializeUniBarUni01() {
	//The first function that is called
	//Define canvas and stage varaibles
	uniBar01.stage = new createjs.Stage(uniBar01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        uniBar01.stage.update();
        updateTweensUni01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawUniratureBarUni01(arrayClientraw[7]);
    });
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUni01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUni01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasUni01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasUni01();
    
    checkOffLoaded();
}

//RAIN BAR 2
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var uniBar02 = {
    size: 0.4,
    widthScaler: 0.5,
	stage: null,
	canvas: null,
	rectTop: null,
    rectFillTop: null,
	rectCommand: null,
	rectFillCommand: null,
	topStrokeCommand: null,
	botStrokeCommand: null,
	textDisplay: null,
	textTitle: null,
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
		textDisplaySize: null,
		textTitleSize: null,
        posBar: {},
        posFillBar: {},
		posHLLabel: {}
	},
	constants: {
		minUni: 0,
		minUniDEFAULT: 0,
		maxUni: 4,
		maxUniDEFAULT: 4
	},
    tweens: {
        barFill: {
            h: 0
        }
    },
	values: {
		uniIn: 0,
		uniOut: 0
	},
    valuesOLD: {
		uniIn: 0
	},
    config: {
        unitsIn: "rainfall",
        title: "Monthly",
        canvasID: "RainBar2",
        tickScaler: 5
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputUni02() {
	//Formats the universal to be displayed correctly
	var gapNum = uniBar02.largeDashTotal - 1;
    
    //Adjust to units
    uniBar02.values.uniIn = formatDataToUnit(uniBar02.values.uniIn, uniBar02.config.unitsIn);
    
	//Adjust Range if needed: if the input is less than the current minimum of the range, decrease the minimum. If the input is bigger than the current maximum of the range, increase the maximum. 
	while (uniBar02.values.uniIn < uniBar02.constants.minUni) {uniBar02.constants.minUni -= uniBar02.config.tickScaler * (gapNum); }
	while (uniBar02.values.uniIn > uniBar02.constants.maxUni) {uniBar02.constants.maxUni += uniBar02.config.tickScaler * (gapNum); }

    //Adjust Range if needed: if the input is bigger than the current minimum of the range, increase the minimum. If the input is less than the current maximum of the range, decrease the maximum. 
	while ((uniBar02.values.uniIn >= uniBar02.constants.minUni + uniBar02.config.tickScaler * (gapNum) && uniBar02.constants.minUni < uniBar02.constants.minUniDEFAULT)) {uniBar02.constants.minUni += uniBar02.config.tickScaler * (gapNum); }
	while ((uniBar02.values.uniIn <= uniBar02.constants.maxUni - uniBar02.config.tickScaler * (gapNum) && uniBar02.constants.maxUni > uniBar02.constants.maxUniDEFAULT)) {uniBar02.constants.maxUni -= uniBar02.config.tickScaler * (gapNum); }
	
    //Map the inputs to the current scale (as a percentage)
	uniBar02.values.uniOut = uniBar02.values.uniIn.map(uniBar02.constants.minUni, uniBar02.constants.maxUni, 0, 1);
}

function drawUniratureBarUni02(uniIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //check if widget actually needs to be updated
    if (uniBar02.valuesOLD.uniIn != uniIn || unitChange === true) {
        //Sets inputs to new data
        uniBar02.values.uniIn = uniIn;

        //Starts the tweens (animations) of the inputs
        formatInputUni02();
        createjs.Tween.get(uniBar02.tweens.barFill)
            .to({h: uniBar02.values.uniOut}, 2000, createjs.Ease.quartInOut);
        
        uniBar02.valuesOLD.uniIn = uniIn;
    }
    
}

function updateTweensUni02() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Uni Bar Fill
    uniBar02.rectFillCommand.h = uniBar02.tweens.barFill.h * (uniBar02.rectCommand.h);
	uniBar02.rectFillCommand.y = uniBar02.rectCommand.h - uniBar02.rectFillCommand.h + uniBar02.rectCommand.y;
	
	//Labels
	for (i = 0; i < uniBar02.largeDashTotal; i++) {
		uniBar02.label[i].text = uniBar02.constants.maxUni - ((uniBar02.constants.maxUni - uniBar02.constants.minUni) / (uniBar02.largeDashTotal - 1)) * i;
	}
	
	//Text Display
	uniBar02.textDisplay.text = uniBar02.values.uniIn.toString() + units[uniBar02.config.unitsIn.toString()][currentUnits[uniBar02.config.unitsIn.toString()]][1].toString();
}

function updateTopUni02() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    uniBar02.setupVars.dashLength = uniBar02.canvas.height * 0.075;
    uniBar02.setupVars.dashGap = uniBar02.canvas.height * 0.025;
    uniBar02.setupVars.barWidth = uniBar02.canvas.height * 0.075;
    uniBar02.setupVars.barFillWidth = uniBar02.setupVars.barWidth;
    uniBar02.setupVars.barHeight = uniBar02.canvas.height * 0.8;
    uniBar02.setupVars.barFillHeight = uniBar02.setupVars.barHeight;
    uniBar02.setupVars.strokeSize = uniBar02.setupVars.barWidth / 40;
    uniBar02.setupVars.textSize = uniBar02.canvas.height / 17;
    uniBar02.setupVars.textDisplaySize = uniBar02.canvas.height / 19;
    uniBar02.setupVars.textTitleSize = uniBar02.canvas.height / 15;
    uniBar02.setupVars.posBar = {
        x: ((uniBar02.canvas.height / 2) - (uniBar02.setupVars.barWidth / 2)),
        y: ((uniBar02.canvas.height / 2) - (uniBar02.setupVars.barHeight / 2))
    };
    uniBar02.setupVars.posDash = {
        x: (uniBar02.canvas.height / 2) - (uniBar02.setupVars.barWidth / 2) - uniBar02.setupVars.dashLength - uniBar02.setupVars.dashGap,
        y: (uniBar02.canvas.height - uniBar02.setupVars.barHeight) / 2
    };
    uniBar02.setupVars.posText = {
        x: uniBar02.setupVars.posBar.x,
        y: uniBar02.setupVars.barHeight * (201 / 170)
    };
    uniBar02.setupVars.posTextTitle = {
        x: uniBar02.setupVars.posBar.x,
        y: uniBar02.setupVars.barHeight * (1 / 17)
    };
    uniBar02.setupVars.posFillBar = {
        x: ((uniBar02.canvas.height / 2) - (uniBar02.setupVars.barFillWidth / 2)),
        y: ((uniBar02.canvas.height / 2) - (uniBar02.setupVars.barFillHeight / 2))
    };

	//Update the visual elements
    
	//Top
	uniBar02.topStrokeCommand.width = uniBar02.setupVars.strokeSize;
	uniBar02.rectCommand.x = uniBar02.setupVars.posBar.x;
	uniBar02.rectCommand.y = uniBar02.setupVars.posBar.y;
	uniBar02.rectCommand.w = uniBar02.setupVars.barWidth;
	uniBar02.rectCommand.h = uniBar02.setupVars.barHeight;
    
	//Dashes
    var gap = (uniBar02.setupVars.barHeight - uniBar02.setupVars.posDash.y) / ((uniBar02.largeDashTotal) * 10 - 15);
    //This just works... 
	for (i = 0; i < (uniBar02.largeDashTotal * 10 - 9); i++) {
		//Large
        var dashY = sharpenValue(gap * i + uniBar02.setupVars.posDash.y);
		if (i % 10 === 0) {
			uniBar02.dashStrokeCommand[i].width = uniBar02.setupVars.strokeSize;
			uniBar02.dashStartCommand[i].x = uniBar02.setupVars.posDash.x;
			uniBar02.dashStartCommand[i].y = dashY;
			uniBar02.dashEndCommand[i].x = uniBar02.setupVars.posDash.x + uniBar02.setupVars.dashLength;
			uniBar02.dashEndCommand[i].y = dashY;
            
			//Text Label Positioning - located here as they line up with the large dashes
			uniBar02.label[i / 10].y = dashY;
			uniBar02.label[i / 10].x = (uniBar02.setupVars.posDash.x - uniBar02.setupVars.dashLength) * (6 / 5);
			uniBar02.label[i / 10].font = uniBar02.setupVars.textSize + "px arial";
		} else if (i % 5 === 0) {
			//Med
			uniBar02.dashStrokeCommand[i].width = uniBar02.setupVars.strokeSize;
			uniBar02.dashStartCommand[i].x = uniBar02.setupVars.posDash.x + uniBar02.setupVars.dashLength - (uniBar02.setupVars.dashLength / 2);
			uniBar02.dashStartCommand[i].y = dashY;
			uniBar02.dashEndCommand[i].x = (uniBar02.setupVars.posDash.x + uniBar02.setupVars.dashLength);
			uniBar02.dashEndCommand[i].y = dashY;
		} else {
			//Small
			uniBar02.dashStrokeCommand[i].width = uniBar02.setupVars.strokeSize;
			uniBar02.dashStartCommand[i].x = uniBar02.setupVars.posDash.x + uniBar02.setupVars.dashLength - (uniBar02.setupVars.dashLength / 3);
			uniBar02.dashStartCommand[i].y = dashY;
			uniBar02.dashEndCommand[i].x = (uniBar02.setupVars.posDash.x + uniBar02.setupVars.dashLength);
			uniBar02.dashEndCommand[i].y = dashY;
		}
	}
	
	//Bar Fill
	uniBar02.rectFillCommand.x = uniBar02.setupVars.posFillBar.x;
	uniBar02.rectFillCommand.w = uniBar02.setupVars.barFillWidth;
	
	//Text Display
	uniBar02.textDisplay.x = uniBar02.setupVars.posText.x;
	uniBar02.textDisplay.y = uniBar02.setupVars.posText.y;
	uniBar02.textDisplay.font = "bold " + uniBar02.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	uniBar02.textTitle.x = uniBar02.setupVars.posTextTitle.x;
	uniBar02.textTitle.y = uniBar02.setupVars.posTextTitle.y;
	uniBar02.textTitle.font = "bold " + uniBar02.setupVars.textTitleSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensUni02();
}

function resizeCanvasUni02() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 2.5,
        parentDiv = uniBar02.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    uniBar02.canvas.width = parentDiv.clientWidth / 3.01;
    uniBar02.canvas.height = parentDiv.clientWidth * ratio / 3.0;

    uniBar02.stage.x = -(uniBar02.canvas.width / 2);
    
	//Update shapes according to new dimentions
	updateTopUni02();
}

function setUpUni02() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	uniBar02.rectTop = new createjs.Shape();
	uniBar02.rectTop.snapToPixel = true;
	uniBar02.rectTop.graphics.beginStroke("black");
	uniBar02.rectTop.graphics.beginFill("#F6F6F6");
	uniBar02.topStrokeCommand = uniBar02.rectTop.graphics.setStrokeStyle(0).command;
	uniBar02.rectCommand = uniBar02.rectTop.graphics.drawRect(0, 0, 0, 0).command;
	uniBar02.stage.addChild(uniBar02.rectTop);
	
	//Set up Dashes
	for (i = 0; i < uniBar02.largeDashTotal * 10; i++) {
		uniBar02.dash[i] = new createjs.Shape();
		uniBar02.dash[i].snapToPixel = true;
		uniBar02.dash[i].graphics.beginStroke("black", 1);
		uniBar02.dashStrokeCommand[i] = uniBar02.dash[i].graphics.setStrokeStyle(0).command;
		uniBar02.dashStartCommand[i] = uniBar02.dash[i].graphics.moveTo(0, 0).command;
		uniBar02.dashEndCommand[i] = uniBar02.dash[i].graphics.lineTo(0, 0).command;
		uniBar02.stage.addChild(uniBar02.dash[i]);
	}
    
    //Set up fill rectange
    uniBar02.rectFillTop = new createjs.Shape();
	uniBar02.rectFillTop.snapToPixel = true;
	uniBar02.rectFillTop.graphics.beginFill("rgba(" + colour[uniBar02.config.unitsIn.toString()].toString() + ", 0.6)");
    uniBar02.rectFillTop.graphics.setStrokeStyle(0);
	uniBar02.rectFillCommand = uniBar02.rectFillTop.graphics.drawRect(0, 0, 0, 0).command;
	uniBar02.stage.addChild(uniBar02.rectFillTop);
	
	//Set up text labels
	for (i = 0; i < uniBar02.largeDashTotal; i++) {
		uniBar02.label[i] = new createjs.Text("0px Arial", "black");
		uniBar02.label[i].textBaseline = "middle";
		uniBar02.label[i].textAlign = "right";
		uniBar02.stage.addChild(uniBar02.label[i]);
	}
    
	//Set up text display
	uniBar02.textDisplay = new createjs.Text("0px Arial", "black");
	uniBar02.textDisplay.textBaseline = "middle";
	uniBar02.textDisplay.textAlign = "center";
	uniBar02.stage.addChild(uniBar02.textDisplay);
    
    //Set up text title (top text)
	uniBar02.textTitle = new createjs.Text("0px Arial", "black");
	uniBar02.textTitle.textBaseline = "middle";
	uniBar02.textTitle.textAlign = "center";
	uniBar02.stage.addChild(uniBar02.textTitle);
	uniBar02.textTitle.text = uniBar02.config.title;
}

function initializeUniBarUni02() {
	//The first function that is called
	//Define canvas and stage varaibles
	uniBar02.stage = new createjs.Stage(uniBar02.canvas);
    
    window.addEventListener("frameUpdate", function () {
        uniBar02.stage.update();
        updateTweensUni02();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawUniratureBarUni02(arrayClientraw[8]);
    });
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUni02();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUni02();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasUni02();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasUni02();
    
    checkOffLoaded();
}

//RAIN BAR 3
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var uniBar03 = {
    size: 0.4,
    widthScaler: 0.5,
	stage: null,
	canvas: null,
	rectTop: null,
    rectFillTop: null,
	rectCommand: null,
	rectFillCommand: null,
	topStrokeCommand: null,
	botStrokeCommand: null,
	textDisplay: null,
	textTitle: null,
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
		textDisplaySize: null,
		textTitleSize: null,
        posBar: {},
        posFillBar: {},
		posHLLabel: {}
	},
	constants: {
		minUni: 0,
		minUniDEFAULT: 0,
		maxUni: 4,
		maxUniDEFAULT: 4
	},
    tweens: {
        barFill: {
            h: 0
        }
    },
	values: {
		uniIn: 0,
		uniOut: 0
	},
    valuesOLD: {
		uniIn: 0
	},
    config: {
        unitsIn: "rainfall",
        title: "Annual",
        canvasID: "RainBar3",
        tickScaler: 5
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputUni03() {
	//Formats the universal to be displayed correctly
	var gapNum = uniBar03.largeDashTotal - 1;
    
    //Adjust to units
    uniBar03.values.uniIn = formatDataToUnit(uniBar03.values.uniIn, uniBar03.config.unitsIn);
    
	//Adjust Range if needed: if the input is less than the current minimum of the range, decrease the minimum. If the input is bigger than the current maximum of the range, increase the maximum. 
	while (uniBar03.values.uniIn < uniBar03.constants.minUni) {uniBar03.constants.minUni -= uniBar03.config.tickScaler * (gapNum); }
	while (uniBar03.values.uniIn > uniBar03.constants.maxUni) {uniBar03.constants.maxUni += uniBar03.config.tickScaler * (gapNum); }

    //Adjust Range if needed: if the input is bigger than the current minimum of the range, increase the minimum. If the input is less than the current maximum of the range, decrease the maximum. 
	while ((uniBar03.values.uniIn >= uniBar03.constants.minUni + uniBar03.config.tickScaler * (gapNum) && uniBar03.constants.minUni < uniBar03.constants.minUniDEFAULT)) {uniBar03.constants.minUni += uniBar03.config.tickScaler * (gapNum); }
	while ((uniBar03.values.uniIn <= uniBar03.constants.maxUni - uniBar03.config.tickScaler * (gapNum) && uniBar03.constants.maxUni > uniBar03.constants.maxUniDEFAULT)) {uniBar03.constants.maxUni -= uniBar03.config.tickScaler * (gapNum); }
	
    //Map the inputs to the current scale (as a percentage)
	uniBar03.values.uniOut = uniBar03.values.uniIn.map(uniBar03.constants.minUni, uniBar03.constants.maxUni, 0, 1);
}

function drawUniratureBarUni03(uniIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //check if widget actually needs to be updated
    if (uniBar03.valuesOLD.uniIn != uniIn || unitChange === true) {
        //Sets inputs to new data
        uniBar03.values.uniIn = uniIn;

        //Starts the tweens (animations) of the inputs
        formatInputUni03();
        createjs.Tween.get(uniBar03.tweens.barFill)
            .to({h: uniBar03.values.uniOut}, 2000, createjs.Ease.quartInOut);
        
        uniBar03.valuesOLD.uniIn = uniIn;
    }
    
}

function updateTweensUni03() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Uni Bar Fill
    uniBar03.rectFillCommand.h = uniBar03.tweens.barFill.h * (uniBar03.rectCommand.h);
	uniBar03.rectFillCommand.y = uniBar03.rectCommand.h - uniBar03.rectFillCommand.h + uniBar03.rectCommand.y;
	
	//Labels
	for (i = 0; i < uniBar03.largeDashTotal; i++) {
		uniBar03.label[i].text = uniBar03.constants.maxUni - ((uniBar03.constants.maxUni - uniBar03.constants.minUni) / (uniBar03.largeDashTotal - 1)) * i;
	}
	
	//Text Display
	uniBar03.textDisplay.text = uniBar03.values.uniIn.toString() + units[uniBar03.config.unitsIn.toString()][currentUnits[uniBar03.config.unitsIn.toString()]][1].toString();
}

function updateTopUni03() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    uniBar03.setupVars.dashLength = uniBar03.canvas.height * 0.075;
    uniBar03.setupVars.dashGap = uniBar03.canvas.height * 0.025;
    uniBar03.setupVars.barWidth = uniBar03.canvas.height * 0.075;
    uniBar03.setupVars.barFillWidth = uniBar03.setupVars.barWidth;
    uniBar03.setupVars.barHeight = uniBar03.canvas.height * 0.8;
    uniBar03.setupVars.barFillHeight = uniBar03.setupVars.barHeight;
    uniBar03.setupVars.strokeSize = uniBar03.setupVars.barWidth / 40;
    uniBar03.setupVars.textSize = uniBar03.canvas.height / 17;
    uniBar03.setupVars.textDisplaySize = uniBar03.canvas.height / 19;
    uniBar03.setupVars.textTitleSize = uniBar03.canvas.height / 15;
    uniBar03.setupVars.posBar = {
        x: ((uniBar03.canvas.height / 2) - (uniBar03.setupVars.barWidth / 2)),
        y: ((uniBar03.canvas.height / 2) - (uniBar03.setupVars.barHeight / 2))
    };
    uniBar03.setupVars.posDash = {
        x: (uniBar03.canvas.height / 2) - (uniBar03.setupVars.barWidth / 2) - uniBar03.setupVars.dashLength - uniBar03.setupVars.dashGap,
        y: (uniBar03.canvas.height - uniBar03.setupVars.barHeight) / 2
    };
    uniBar03.setupVars.posText = {
        x: uniBar03.setupVars.posBar.x,
        y: uniBar03.setupVars.barHeight * (201 / 170)
    };
    uniBar03.setupVars.posTextTitle = {
        x: uniBar03.setupVars.posBar.x,
        y: uniBar03.setupVars.barHeight * (1 / 17)
    };
    uniBar03.setupVars.posFillBar = {
        x: ((uniBar03.canvas.height / 2) - (uniBar03.setupVars.barFillWidth / 2)),
        y: ((uniBar03.canvas.height / 2) - (uniBar03.setupVars.barFillHeight / 2))
    };

	//Update the visual elements
    
	//Top
	uniBar03.topStrokeCommand.width = uniBar03.setupVars.strokeSize;
	uniBar03.rectCommand.x = uniBar03.setupVars.posBar.x;
	uniBar03.rectCommand.y = uniBar03.setupVars.posBar.y;
	uniBar03.rectCommand.w = uniBar03.setupVars.barWidth;
	uniBar03.rectCommand.h = uniBar03.setupVars.barHeight;
    
	//Dashes
    var gap = (uniBar03.setupVars.barHeight - uniBar03.setupVars.posDash.y) / ((uniBar03.largeDashTotal) * 10 - 15);
    //This just works... 
	for (i = 0; i < (uniBar03.largeDashTotal * 10 - 9); i++) {
		//Large
        var dashY = sharpenValue(gap * i + uniBar03.setupVars.posDash.y);
		if (i % 10 === 0) {
			uniBar03.dashStrokeCommand[i].width = uniBar03.setupVars.strokeSize;
			uniBar03.dashStartCommand[i].x = uniBar03.setupVars.posDash.x;
			uniBar03.dashStartCommand[i].y = dashY;
			uniBar03.dashEndCommand[i].x = uniBar03.setupVars.posDash.x + uniBar03.setupVars.dashLength;
			uniBar03.dashEndCommand[i].y = dashY;
            
			//Text Label Positioning - located here as they line up with the large dashes
			uniBar03.label[i / 10].y = dashY;
			uniBar03.label[i / 10].x = (uniBar03.setupVars.posDash.x - uniBar03.setupVars.dashLength) * (6 / 5);
			uniBar03.label[i / 10].font = uniBar03.setupVars.textSize + "px arial";
		} else if (i % 5 === 0) {
			//Med
			uniBar03.dashStrokeCommand[i].width = uniBar03.setupVars.strokeSize;
			uniBar03.dashStartCommand[i].x = uniBar03.setupVars.posDash.x + uniBar03.setupVars.dashLength - (uniBar03.setupVars.dashLength / 2);
			uniBar03.dashStartCommand[i].y = dashY;
			uniBar03.dashEndCommand[i].x = (uniBar03.setupVars.posDash.x + uniBar03.setupVars.dashLength);
			uniBar03.dashEndCommand[i].y = dashY;
		} else {
			//Small
			uniBar03.dashStrokeCommand[i].width = uniBar03.setupVars.strokeSize;
			uniBar03.dashStartCommand[i].x = uniBar03.setupVars.posDash.x + uniBar03.setupVars.dashLength - (uniBar03.setupVars.dashLength / 3);
			uniBar03.dashStartCommand[i].y = dashY;
			uniBar03.dashEndCommand[i].x = (uniBar03.setupVars.posDash.x + uniBar03.setupVars.dashLength);
			uniBar03.dashEndCommand[i].y = dashY;
		}
	}
	
	//Bar Fill
	uniBar03.rectFillCommand.x = uniBar03.setupVars.posFillBar.x;
	uniBar03.rectFillCommand.w = uniBar03.setupVars.barFillWidth;
	
	//Text Display
	uniBar03.textDisplay.x = uniBar03.setupVars.posText.x;
	uniBar03.textDisplay.y = uniBar03.setupVars.posText.y;
	uniBar03.textDisplay.font = "bold " + uniBar03.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	uniBar03.textTitle.x = uniBar03.setupVars.posTextTitle.x;
	uniBar03.textTitle.y = uniBar03.setupVars.posTextTitle.y;
	uniBar03.textTitle.font = "bold " + uniBar03.setupVars.textTitleSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensUni03();
}

function resizeCanvasUni03() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 2.5,
        parentDiv = uniBar03.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    uniBar03.canvas.width = parentDiv.clientWidth / 3.01;
    uniBar03.canvas.height = parentDiv.clientWidth * ratio / 3.0;

    uniBar03.stage.x = -(uniBar03.canvas.width / 2);
    
	//Update shapes according to new dimentions
	updateTopUni03();
}

function setUpUni03() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	uniBar03.rectTop = new createjs.Shape();
	uniBar03.rectTop.snapToPixel = true;
	uniBar03.rectTop.graphics.beginStroke("black");
	uniBar03.rectTop.graphics.beginFill("#F6F6F6");
	uniBar03.topStrokeCommand = uniBar03.rectTop.graphics.setStrokeStyle(0).command;
	uniBar03.rectCommand = uniBar03.rectTop.graphics.drawRect(0, 0, 0, 0).command;
	uniBar03.stage.addChild(uniBar03.rectTop);
	
	//Set up Dashes
	for (i = 0; i < uniBar03.largeDashTotal * 10; i++) {
		uniBar03.dash[i] = new createjs.Shape();
		uniBar03.dash[i].snapToPixel = true;
		uniBar03.dash[i].graphics.beginStroke("black", 1);
		uniBar03.dashStrokeCommand[i] = uniBar03.dash[i].graphics.setStrokeStyle(0).command;
		uniBar03.dashStartCommand[i] = uniBar03.dash[i].graphics.moveTo(0, 0).command;
		uniBar03.dashEndCommand[i] = uniBar03.dash[i].graphics.lineTo(0, 0).command;
		uniBar03.stage.addChild(uniBar03.dash[i]);
	}
    
    //Set up fill rectange
    uniBar03.rectFillTop = new createjs.Shape();
	uniBar03.rectFillTop.snapToPixel = true;
	uniBar03.rectFillTop.graphics.beginFill("rgba(" + colour[uniBar03.config.unitsIn.toString()].toString() + ", 0.6)");
    uniBar03.rectFillTop.graphics.setStrokeStyle(0);
	uniBar03.rectFillCommand = uniBar03.rectFillTop.graphics.drawRect(0, 0, 0, 0).command;
	uniBar03.stage.addChild(uniBar03.rectFillTop);
	
	//Set up text labels
	for (i = 0; i < uniBar03.largeDashTotal; i++) {
		uniBar03.label[i] = new createjs.Text("0px Arial", "black");
		uniBar03.label[i].textBaseline = "middle";
		uniBar03.label[i].textAlign = "right";
		uniBar03.stage.addChild(uniBar03.label[i]);
	}
    
	//Set up text display
	uniBar03.textDisplay = new createjs.Text("0px Arial", "black");
	uniBar03.textDisplay.textBaseline = "middle";
	uniBar03.textDisplay.textAlign = "center";
	uniBar03.stage.addChild(uniBar03.textDisplay);
    
    //Set up text title (top text)
	uniBar03.textTitle = new createjs.Text("0px Arial", "black");
	uniBar03.textTitle.textBaseline = "middle";
	uniBar03.textTitle.textAlign = "center";
	uniBar03.stage.addChild(uniBar03.textTitle);
	uniBar03.textTitle.text = uniBar03.config.title;
}

function initializeUniBarUni03() {
	//The first function that is called
	//Define canvas and stage varaibles
	uniBar03.stage = new createjs.Stage(uniBar03.canvas);
    
    window.addEventListener("frameUpdate", function () {
        uniBar03.stage.update();
        updateTweensUni03();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawUniratureBarUni03(arrayClientraw[9]);
    });
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUni03();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUni03();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasUni03();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasUni03();
    
    checkOffLoaded();
}

//UV BAR
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var uvBar01 = {
    size: 0.4,
    widthScaler: 0.5,
	stage: null,
	canvas: null,
	rectTop: null,
    rectFillTop: null,
	rectCommand: null,
	rectFillCommand: null,
	topStrokeCommand: null,
	botStrokeCommand: null,
	textDisplay: null,
	textTitle: null,
	textMaxLabel: null,
	setupVars: {
        barWidth: null,
        barFillWidth: null,
        barHeight: null,
        barFillHeight: null,
        strokeSize: null,
		textDisplaySize: null,
		textTitleSize: null,
		textMaxLabelSize: null,
        posBar: {},
        posFillBar: {}
	},
    tweens: {
        barFill: {
            h: 0
        }
    },
	values: {
		uniIn: 0,
		uniOut: 0
	},
    config: {
        unitsIn: "uv",
        title: "UV",
        canvasID: "UVBar01",
        textMaxLabel: "16"
    }
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function formatInputUV01() {
	//Formats the universal to be displayed correctly
    
    //Adjust to units
    uvBar01.values.uniIn = formatDataToUnit(uvBar01.values.uniIn, uvBar01.config.unitsIn);
    
    //Map the inputs to the current scale (as a proportion)
	uvBar01.values.uniOut = uvBar01.values.uniIn.map(0, 16, 0, 1);
}

function drawUVBarUV01(uniIn) {
    //Is called when new data is sent.
    
    //Sets inputs to new data
	uvBar01.values.uniIn = Number(uniIn);

    //Starts the tweens (animations) of the inputs
	formatInputUV01();
	createjs.Tween.get(uvBar01.tweens.barFill)
		.to({h: uvBar01.values.uniOut}, 2000, createjs.Ease.quartInOut);
}

function updateTweensUV01() {
    //Updates any tweened or changing objects. This is called every frame
	
    //Uni Bar Fill
    uvBar01.rectFillCommand.h = uvBar01.tweens.barFill.h * (uvBar01.rectCommand.h);
	uvBar01.rectFillCommand.y = uvBar01.rectCommand.h - uvBar01.rectFillCommand.h + uvBar01.rectCommand.y;
	
	//Text Display
	uvBar01.textDisplay.text = uvBar01.values.uniIn.toString() + units[uvBar01.config.unitsIn.toString()][currentUnits[uvBar01.config.unitsIn.toString()]][1].toString();
}

function updateTopUV01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    
	//Set variables - all relative to canvas size so that dynamic resizing is possible.
    uvBar01.setupVars.barWidth = uvBar01.canvas.height * 0.075;
    uvBar01.setupVars.barFillWidth = uvBar01.setupVars.barWidth;
    uvBar01.setupVars.barHeight = uvBar01.canvas.height * 0.75;
    uvBar01.setupVars.barFillHeight = uvBar01.setupVars.barHeight;
    uvBar01.setupVars.strokeSize = uvBar01.setupVars.barWidth / 40;
    uvBar01.setupVars.textDisplaySize = uvBar01.canvas.height / 19;
    uvBar01.setupVars.textTitleSize = uvBar01.canvas.height / 15;
    uvBar01.setupVars.textMaxLabelSize = uvBar01.canvas.height / 19;
    uvBar01.setupVars.posBar = {
        x: ((uvBar01.canvas.height / 2) - (uvBar01.setupVars.barWidth / 2)),
        y: ((uvBar01.canvas.height / 2) - (uvBar01.canvas.height * 0.8 / 2))
    };
    uvBar01.setupVars.posText = {
        x: uvBar01.setupVars.posBar.x + uvBar01.setupVars.barWidth / 2,
        y: uvBar01.setupVars.barHeight * (201 / 170)
    };
    uvBar01.setupVars.posTextTitle = {
        x: uvBar01.setupVars.posBar.x + uvBar01.setupVars.barWidth / 2,
        y: uvBar01.setupVars.barHeight * (1 / 17)
    };
    uvBar01.setupVars.posTextMaxLabel = {
        x: uvBar01.setupVars.posBar.x - uvBar01.setupVars.barWidth * (1 / 4),
        y: (uvBar01.canvas.height - uvBar01.setupVars.barHeight) / 2
    };
    uvBar01.setupVars.posFillBar = {
        x: ((uvBar01.canvas.height / 2) - (uvBar01.setupVars.barFillWidth / 2)),
        y: ((uvBar01.canvas.height / 2) - (uvBar01.setupVars.barFillHeight / 2))
    };
    
	//Update the visual elements
    
	//Top
	uvBar01.topStrokeCommand.width = uvBar01.setupVars.strokeSize;
	uvBar01.rectCommand.x = uvBar01.setupVars.posBar.x;
	uvBar01.rectCommand.y = uvBar01.setupVars.posBar.y;
	uvBar01.rectCommand.w = uvBar01.setupVars.barWidth;
	uvBar01.rectCommand.h = uvBar01.setupVars.barHeight;
	
	//Bar Fill
	uvBar01.rectFillCommand.x = uvBar01.setupVars.posFillBar.x;
	uvBar01.rectFillCommand.w = uvBar01.setupVars.barFillWidth;
	
	//Text Display
	uvBar01.textDisplay.x = uvBar01.setupVars.posText.x;
	uvBar01.textDisplay.y = uvBar01.setupVars.posText.y;
	uvBar01.textDisplay.font = "bold " + uvBar01.setupVars.textDisplaySize + "px arial";
    
    //Text Title
	uvBar01.textTitle.x = uvBar01.setupVars.posTextTitle.x;
	uvBar01.textTitle.y = uvBar01.setupVars.posTextTitle.y;
	uvBar01.textTitle.font = "bold " + uvBar01.setupVars.textTitleSize + "px arial";
    
    //Text Max Label
	uvBar01.textMaxLabel.x = uvBar01.setupVars.posTextMaxLabel.x;
	uvBar01.textMaxLabel.y = uvBar01.setupVars.posTextMaxLabel.y;
	uvBar01.textMaxLabel.font = "bold " + uvBar01.setupVars.textMaxLabelSize + "px arial";
    
    //Gives the call to update the animated sections of the widgets
    updateTweensUV01();
}

function resizeCanvasUV01() {
	//Dynamic Canvas Resizing for desktop
	var ratio = 3,
        parentDiv = uvBar01.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    uvBar01.canvas.width = parentDiv.clientHeight / ratio;
    uvBar01.canvas.height = parentDiv.clientHeight;
    
    uvBar01.stage.x = -(uvBar01.canvas.width / 1.2);

	//Update shapes according to new dimentions
	updateTopUV01();
}


function setUpUV01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later
	//Set up top
	uvBar01.rectTop = new createjs.Shape();
	uvBar01.rectTop.snapToPixel = true;
	uvBar01.rectTop.graphics.beginStroke("black");
	uvBar01.rectTop.graphics.beginFill("#F6F6F6");
	uvBar01.topStrokeCommand = uvBar01.rectTop.graphics.setStrokeStyle(0).command;
	uvBar01.rectCommand = uvBar01.rectTop.graphics.drawRect(0, 0, 0, 0).command;
	uvBar01.stage.addChild(uvBar01.rectTop);
    
    //Set up fill rectange
    uvBar01.rectFillTop = new createjs.Shape();
	uvBar01.rectFillTop.snapToPixel = true;
	uvBar01.rectFillTop.graphics.beginFill("rgb(" + colour[uvBar01.config.unitsIn.toString()].toString()+ ")");
    uvBar01.rectFillTop.graphics.setStrokeStyle(0);
	uvBar01.rectFillCommand = uvBar01.rectFillTop.graphics.drawRect(0, 0, 0, 0).command;
	uvBar01.stage.addChild(uvBar01.rectFillTop);
    
	//Set up text display
	uvBar01.textDisplay = new createjs.Text("0px Arial", "black");
	uvBar01.textDisplay.textBaseline = "middle";
	uvBar01.textDisplay.textAlign = "center";
	uvBar01.stage.addChild(uvBar01.textDisplay);
    
    //Set up text title (top text)
	uvBar01.textTitle = new createjs.Text("0px Arial", "black");
	uvBar01.textTitle.textBaseline = "middle";
	uvBar01.textTitle.textAlign = "center";
	uvBar01.stage.addChild(uvBar01.textTitle);
	uvBar01.textTitle.text = uvBar01.config.title;
    
    //Set up max label
	uvBar01.textMaxLabel = new createjs.Text("0px Arial", "black");
	uvBar01.textMaxLabel.textBaseline = "middle";
	uvBar01.textMaxLabel.textAlign = "right";
	uvBar01.stage.addChild(uvBar01.textMaxLabel);
	uvBar01.textMaxLabel.text = uvBar01.config.textMaxLabel;
}

function initializeUVBarUV01() {
	//The first function that is called
	//Define canvas and stage varaibles
	uvBar01.stage = new createjs.Stage(uvBar01.canvas);
    
    window.addEventListener("frameUpdate", function () {
        uvBar01.stage.update();
        updateTweensUV01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawUVBarUV01(arrayClientraw[79]);
    });
    
    
    //Creates information tooltip
    new Opentip(uvBar01.canvas, "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUV01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUV01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasUV01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasUV01();
    
    checkOffLoaded();
}

//WIND DIRECTION
//Global Variables. These are set up in a hierarchical structure so that they can be easily accessed
var windGauge = {
	stage: null,
	canvas: null,
    outerCircle: null,
    innerCircle: null,
    innerDot: null,
    outerCircleStrokeCommand: null,
    outerCircleCommand: null,
    innerCircleCommand: null,
    innerDotCommand: null,
    pointer: null,
    pointerAvg: null,
    dash: [],
    dashStrokeCommand: [],
    dashStartCommand: [],
    dashEndCommand: [],
    label: [],
    largeDashTotal: 8,
    textDisplay: null,
    avgDisplay: null,
    pointerCommand: {
        tip: null,
        lBase: null,
        rBase: null
    },
    pointerAvgCommand: {
        tip: null,
        lBase: null,
        rBase: null
    },
	setupVars: {
        outerCircleRad: null,
        innerCricleRad: null,
        posOuterCircle: null,
        posInnerCircle: null,
        posPointer: null,
        strokeSize: null,
        dashEndRad: null,
        posBotLine: null,
        labelCentreRad: null,
        textSize: null,
        textDisplaySize: null,
        posTextDisplay: null,
        avgDisplaySize: null,
        posAvgDisplay: null
	},
    tweens: {
        r: 0,
        aR: 0
    },
	values: {
		windIn: 0,
		windOut: 0,
        windOld: 0,
        avgIn: 0,
		avgOut: 0,
        avgOld: 0,
        unitsIn: "wind"
	},
    valuesOLD: {
		windIn: 0,
        avgIn: 0
	}
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function drawWindGaugeWind01(windIn, avgIn, unitChange) {
    //Is called when new data is sent.
    
    unitChange = unitChange || false;
    
    //Check if widget needs to be updated
    if (windGauge.valuesOLD.windIn != windIn || windGauge.valuesOLD.avgIn != avgIn || unitChange === true) {
        windIn = parseFloat(windIn, 0);
        avgIn = parseFloat(avgIn, 0);
        windGauge.textDisplay.text = windIn.toString() + "\xB0";
        windGauge.avgDisplay.text = avgIn.toString() + "\xB0";

        var angleDiff = windIn - (windGauge.values.windOld % 360),
            avgAngleDiff = avgIn - (windGauge.values.avgOld % 360);

        //For wind pointer
        if (Math.abs(angleDiff) < 180) {
            windGauge.values.windOut = windGauge.values.windOld + angleDiff;
        } else if (windGauge.values.windOld > windIn) {
            windGauge.values.windOut = windGauge.values.windOld + angleDiff + 360;
        } else if (windGauge.values.windOld < windIn) {
            windGauge.values.windOut = windGauge.values.windOld + angleDiff - 360;
        }

        //For average pointer
        if (Math.abs(avgAngleDiff) < 180) {
            windGauge.values.avgOut = windGauge.values.avgOld + avgAngleDiff;
        } else if (windGauge.values.avgOld > avgIn) {
            windGauge.values.avgOut = windGauge.values.avgOld + avgAngleDiff + 360;
        } else if (windGauge.values.avgOld < avgIn) {
            windGauge.values.avgOut = windGauge.values.avgOld + avgAngleDiff - 360;
        }

        createjs.Tween.get(windGauge.tweens)
            .to({r: windGauge.values.windOut}, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(windGauge.tweens)
            .to({aR: windGauge.values.avgOut}, 2000, createjs.Ease.quartInOut);

        windGauge.values.windOld = windGauge.values.windOut;
        windGauge.values.avgOld = windGauge.values.avgOut;
        
        //values used for checking if changes in value
        windGauge.valuesOLD.windIn = windIn;
        windGauge.valuesOLD.avgIn = avgIn;
    }
}

function updateTweensWind01() {
    //Updates any tweened or changing objects. This is called every frame
    windGauge.pointer.rotation = windGauge.tweens.r;
    windGauge.pointerAvg.rotation = windGauge.tweens.aR;
}

function updateTopWind01() {
	//Updates the non-animated sections of the Widget. Gets called everytime the canvas is resized Uses the commands initialized in the setUp function to make changes to values.
    windGauge.setupVars.outerCircleRad = windGauge.canvas.width * 0.30;
    windGauge.setupVars.innerCricleRad = windGauge.canvas.width * 0.05;
    windGauge.setupVars.strokeSize = windGauge.canvas.width / 80;
    windGauge.setupVars.dashEndRad = windGauge.setupVars.outerCircleRad * (48 / 40);
    windGauge.setupVars.labelCentreRad = windGauge.setupVars.outerCircleRad * (68 / 50);
    windGauge.setupVars.textSize = windGauge.canvas.width / 15;
    windGauge.setupVars.textDisplaySize = windGauge.canvas.width / 10;
    windGauge.setupVars.avgDisplaySize = windGauge.canvas.width / 12;
    windGauge.setupVars.posOuterCircle = {
        x: windGauge.canvas.width / 2,
        y: windGauge.canvas.height / 2
    };
    windGauge.setupVars.posInnerCircle = {
        x: windGauge.canvas.width / 2,
        y: windGauge.canvas.height / 2
    };
    windGauge.setupVars.posPointer = {
        xT: windGauge.canvas.width / 2,
        yT: windGauge.canvas.height * (1 / 5),
        xL: windGauge.canvas.width * (97 / 200),
        yL: windGauge.canvas.height * (3 / 5),
        xR: windGauge.canvas.width * (103 / 200),
        yR: windGauge.canvas.height * (3 / 5)
    };
    windGauge.setupVars.posPointerAvg = {
        xT: windGauge.canvas.width / 2,
        yT: windGauge.setupVars.outerCircleRad * (33 / 50),
        xL: windGauge.canvas.width * (90 / 200),
        yL: windGauge.setupVars.outerCircleRad * (4 / 5),
        xR: windGauge.canvas.width * (110 / 200),
        yR: windGauge.setupVars.outerCircleRad * (4 / 5)
    };
    windGauge.setupVars.posTextDisplay = {
        x: windGauge.setupVars.posOuterCircle.x,
        y: windGauge.setupVars.outerCircleRad * (74 / 30)
    };
    windGauge.setupVars.posAvgDisplay = {
        x: windGauge.setupVars.posOuterCircle.x,
        y: windGauge.setupVars.outerCircleRad * (65 / 30)
    };
	//Update the visual elements
    
	//Outer Circle
	windGauge.outerCircleStrokeCommand.width = windGauge.setupVars.strokeSize;
	windGauge.outerCircleCommand.x = windGauge.setupVars.posOuterCircle.x;
	windGauge.outerCircleCommand.y = windGauge.setupVars.posOuterCircle.y;
	windGauge.outerCircleCommand.radius = windGauge.setupVars.outerCircleRad;
    
	//Inner Circle fill
	windGauge.innerCircleCommand.x = windGauge.setupVars.posInnerCircle.x;
	windGauge.innerCircleCommand.y = windGauge.setupVars.posInnerCircle.y;
	windGauge.innerCircleCommand.radius = windGauge.setupVars.innerCricleRad;
    
    //Inner Circle fill
	windGauge.innerDotCommand.x = windGauge.setupVars.posInnerCircle.x;
	windGauge.innerDotCommand.y = windGauge.setupVars.posInnerCircle.y;
	windGauge.innerDotCommand.radius = windGauge.setupVars.innerCricleRad / 4;
    
    //Text Disaply
	windGauge.textDisplay.x = windGauge.setupVars.posTextDisplay.x;
	windGauge.textDisplay.y = windGauge.setupVars.posTextDisplay.y;
	windGauge.textDisplay.font = "bold " + windGauge.setupVars.textDisplaySize + "px arial";
    
    //Text Disaply
	windGauge.avgDisplay.x = windGauge.setupVars.posAvgDisplay.x;
	windGauge.avgDisplay.y = windGauge.setupVars.posAvgDisplay.y;
	windGauge.avgDisplay.font = "bold " + windGauge.setupVars.avgDisplaySize + "px arial";
    
    //Average Pointer
    windGauge.pointerAvgCommand.tip.x = windGauge.setupVars.posPointerAvg.xT;
    windGauge.pointerAvgCommand.tip.y = windGauge.setupVars.posPointerAvg.yT;
    windGauge.pointerAvgCommand.lBase.x = windGauge.setupVars.posPointerAvg.xL;
    windGauge.pointerAvgCommand.lBase.y = windGauge.setupVars.posPointerAvg.yL;
    windGauge.pointerAvgCommand.rBase.x = windGauge.setupVars.posPointerAvg.xR;
    windGauge.pointerAvgCommand.rBase.y = windGauge.setupVars.posPointerAvg.yR;
    windGauge.pointerAvg.regX = windGauge.canvas.width / 2;
    windGauge.pointerAvg.regY = windGauge.canvas.height / 2;
    windGauge.pointerAvg.x = windGauge.canvas.width / 2;
    windGauge.pointerAvg.y = windGauge.canvas.height / 2;
    
    //Pointer
    windGauge.pointerCommand.tip.x = windGauge.setupVars.posPointer.xT;
    windGauge.pointerCommand.tip.y = windGauge.setupVars.posPointer.yT;
    windGauge.pointerCommand.lBase.x = windGauge.setupVars.posPointer.xL;
    windGauge.pointerCommand.lBase.y = windGauge.setupVars.posPointer.yL;
    windGauge.pointerCommand.rBase.x = windGauge.setupVars.posPointer.xR;
    windGauge.pointerCommand.rBase.y = windGauge.setupVars.posPointer.yR;
    windGauge.pointer.regX = windGauge.canvas.width / 2;
    windGauge.pointer.regY = windGauge.canvas.height / 2;
    windGauge.pointer.x = windGauge.canvas.width / 2;
    windGauge.pointer.y = windGauge.canvas.height / 2;
    
    //Dashes
    var segment = (Math.PI) / (windGauge.largeDashTotal);
    
    for (i = 0; i < (windGauge.largeDashTotal * 2); i++) {
        var angle = Math.PI - (segment * i) + Math.PI;
        windGauge.dash[i].regX = -windGauge.canvas.width / 2;
        windGauge.dash[i].regY = -windGauge.canvas.height / 2;
		//Large
		if (i % 2 === 0) {
			windGauge.dashStrokeCommand[i].width = windGauge.setupVars.strokeSize;
			windGauge.dashStartCommand[i].x = Math.sin(angle) * windGauge.setupVars.outerCircleRad;
			windGauge.dashStartCommand[i].y = Math.cos(angle) * windGauge.setupVars.outerCircleRad;
			windGauge.dashEndCommand[i].x = Math.sin(angle) * windGauge.setupVars.dashEndRad;
			windGauge.dashEndCommand[i].y = Math.cos(angle) * windGauge.setupVars.dashEndRad;
            
			//Text Label Positioning - located here as they line up with the large dashes
            windGauge.label[i / 2].regX = -windGauge.canvas.width / 2;
            windGauge.label[i / 2].regY = -windGauge.canvas.height / 2;
            windGauge.label[i / 2].x = Math.sin(angle) * windGauge.setupVars.labelCentreRad;
			windGauge.label[i / 2].y = Math.cos(angle) * windGauge.setupVars.labelCentreRad;
			windGauge.label[i / 2].font = windGauge.setupVars.textSize + "px arial";
		} else {
			//Med
			windGauge.dashStrokeCommand[i].width = windGauge.setupVars.strokeSize;
			windGauge.dashStartCommand[i].x = Math.sin(angle) * windGauge.setupVars.outerCircleRad;
			windGauge.dashStartCommand[i].y = Math.cos(angle) * windGauge.setupVars.outerCircleRad;
			windGauge.dashEndCommand[i].x = Math.sin(angle) * (windGauge.setupVars.dashEndRad + windGauge.setupVars.outerCircleRad) / 2;
			windGauge.dashEndCommand[i].y = Math.cos(angle) * (windGauge.setupVars.dashEndRad + windGauge.setupVars.outerCircleRad) / 2;
		}
	}
	
}

function resizeCanvasWind01() {
	//Dynamic Canvas Resizing for desktop
	var parentDiv = windGauge.canvas.parentElement;
    
	//Adjusts canvas to match resized window. Always adjust to the smallest dimention
    windGauge.canvas.width = parentDiv.clientHeight;
    windGauge.canvas.height = parentDiv.clientHeight;
	
	//Update shapes according to new dimentions
	updateTopWind01();
}

function setUpWind01() {
	//Sets up the shapes. Initializses all the varaibles and shapes, and stores the values which need to be adjusted in commands which can be accessed later

	//Set up outer Circle
	windGauge.outerCircle = new createjs.Shape();
	windGauge.outerCircle.snapToPixel = true;
	windGauge.outerCircle.graphics.beginStroke("black");
	windGauge.outerCircle.graphics.beginFill("#F6F6F6");
	windGauge.outerCircleStrokeCommand = windGauge.outerCircle.graphics.setStrokeStyle(0).command;
	windGauge.outerCircleCommand = windGauge.outerCircle.graphics.drawCircle(0, 0, 0).command;
	windGauge.stage.addChild(windGauge.outerCircle);
    
    //Set up average pointer
    windGauge.pointerAvg = new createjs.Shape();
	windGauge.pointerAvg.snapToPixel = true;
    windGauge.pointerAvg.graphics.beginFill("rgb(" + colour.wind + ")");
    windGauge.pointerAvg.graphics.setStrokeStyle(10);
	windGauge.pointerAvgCommand.tip = windGauge.pointerAvg.graphics.moveTo(10, 0).command;
    windGauge.pointerAvgCommand.lBase = windGauge.pointerAvg.graphics.lineTo(0, 10).command;
    windGauge.pointerAvgCommand.rBase = windGauge.pointerAvg.graphics.lineTo(10, 10).command;
    windGauge.pointerAvg.graphics.closePath();
	windGauge.stage.addChild(windGauge.pointerAvg);
    
    //Set up pointer
    windGauge.pointer = new createjs.Shape();
	windGauge.pointer.snapToPixel = true;
    windGauge.pointer.graphics.beginFill("black");
    windGauge.pointer.graphics.setStrokeStyle(10);
	windGauge.pointerCommand.tip = windGauge.pointer.graphics.moveTo(10, 0).command;
    windGauge.pointerCommand.lBase = windGauge.pointer.graphics.lineTo(0, 10).command;
    windGauge.pointerCommand.rBase = windGauge.pointer.graphics.lineTo(10, 10).command;
    windGauge.pointer.graphics.closePath();
	windGauge.stage.addChild(windGauge.pointer);
    
    //Set up inner circle
    windGauge.innerCircle = new createjs.Shape();
	windGauge.innerCircle.snapToPixel = true;
	windGauge.innerCircle.graphics.beginFill("black");
    windGauge.innerCircle.graphics.setStrokeStyle(0);
	windGauge.innerCircleCommand = windGauge.innerCircle.graphics.drawCircle(0, 0, 0).command;
	windGauge.stage.addChild(windGauge.innerCircle);
    
    //Set up inner dot
    windGauge.innerDot = new createjs.Shape();
	windGauge.innerDot.snapToPixel = true;
	windGauge.innerDot.graphics.beginFill("rgb(" + colour.wind + ")");
    windGauge.innerDot.graphics.setStrokeStyle(0);
	windGauge.innerDotCommand = windGauge.innerDot.graphics.drawCircle(0, 0, 0).command;
	windGauge.stage.addChild(windGauge.innerDot);
    
    //Set up text display (current value)
	windGauge.textDisplay = new createjs.Text("0\xB0", "0px Arial", "black");
	windGauge.textDisplay.textBaseline = "middle";
	windGauge.textDisplay.textAlign = "center";
	windGauge.stage.addChild(windGauge.textDisplay);
    
    //Set up avg display (average value)
	windGauge.avgDisplay = new createjs.Text("0\xB0", "0px Arial", "rgb(" + colour.wind + ")");
	windGauge.avgDisplay.textBaseline = "middle";
	windGauge.avgDisplay.textAlign = "center";
	windGauge.stage.addChild(windGauge.avgDisplay);
    
    //Set up text labels
	for (i = 0; i < windGauge.largeDashTotal; i++) {
        var labelText = "";
        if (i == 0) {
            labelText = "S";
        } else if (i == 1) {
            labelText = "SW";
        } else if (i == 2) {
            labelText = "W";
        } else if (i == 3) {
            labelText = "NW";
        } else if (i == 4) {
            labelText = "N";
        } else if (i == 5) {
            labelText = "NE";
        } else if (i == 6) {
            labelText = "E";
        } else if (i == 7) {
            labelText = "SE";
        }
		windGauge.label[i] = new createjs.Text(labelText.toString(), "black");
		windGauge.label[i].textBaseline = "middle";
		windGauge.label[i].textAlign = "center";
		windGauge.stage.addChild(windGauge.label[i]);
	}
    
    //Set up dashes
    for (i = 0; i < windGauge.largeDashTotal * 2; i++) {
		windGauge.dash[i] = new createjs.Shape();
		windGauge.dash[i].snapToPixel = true;
		windGauge.dash[i].graphics.beginStroke("black", 1);
		windGauge.dashStrokeCommand[i] = windGauge.dash[i].graphics.setStrokeStyle(110).command;
		windGauge.dashStartCommand[i] = windGauge.dash[i].graphics.moveTo(0, 0).command;
		windGauge.dashEndCommand[i] = windGauge.dash[i].graphics.lineTo(0, 0).command;
		windGauge.stage.addChild(windGauge.dash[i]);
	}
}

function initializeWind01() {
	//The first function that is called
    
	//Define canvas and stage varaibles
	windGauge.stage = new createjs.Stage(windGauge.canvas);
    
    window.addEventListener("frameUpdate", function () {
        windGauge.stage.update();
        updateTweensWind01();
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawWindGaugeWind01(arrayClientraw[3], arrayClientraw[117]);
    });
    
    //Creates information tooltip
    new Opentip(windGauge.canvas, "The wind direction. Green arrow indicates average wind direction.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpWind01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWind01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasWind01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasWind01();
    
    checkOffLoaded();
}

//WIND SPEED
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
		maxSpeed: 10,
		maxSpeedDEFAULT: 10
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
    windSpeed.values.speedIn = formatDataToUnit(windSpeed.values.speedIn, windSpeed.values.unitsIn);
    windSpeed.values.gustIn = formatDataToUnit(windSpeed.values.gustIn, windSpeed.values.unitsIn);
    windSpeed.values.windHighSpeedIn = formatDataToUnit(windSpeed.values.windHighSpeedIn, windSpeed.values.unitsIn);
    windSpeed.values.gustHighSpeedIn = formatDataToUnit(windSpeed.values.gustHighSpeedIn, windSpeed.values.unitsIn);
    
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
			windSpeed.label[i / 2].x = (windSpeed.setupVars.posDash.x - windSpeed.setupVars.dashLength) * (125 / 100);
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
	windSpeed.stage = new createjs.Stage(windSpeed.canvas);
    
    window.addEventListener("frameUpdate", function () {
        windSpeed.stage.update();
        updateTweensWS01(); 
    });
    window.addEventListener("clientRawDataUpdate", function () {
        drawSpeedBarWS01(arrayClientraw[1], arrayClientraw[2], arrayClientraw[113], arrayClientraw[71]);
    });
    
    //Creates information tooltip
    new Opentip(windSpeed.canvas, "Green bar indicates average wind speed.\nPurple bar indicates gust speed.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpWS01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not algustHigh this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWS01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasWS01();
        });
    }
	
    //Set the canvas size intially.
	resizeCanvasWS01();
    
    checkOffLoaded();
}

//END OF WIDGETS
//DATA COLLECT
var arrayClientraw = [],
	arrayClientrawExtra = [],
	arrayClientrawHour = [],
	arrayClientrawDaily = [],
    arrayClientrawOld = [],
	arrayClientrawExtraOld = [],
	arrayClientrawHourOld = [],
	arrayClientrawDailyOld = [],
    graphDict = {},
    recordsDict = [{}, {}, {}],
    doneCR,
    doneCRE,
    doneCRH,
    doneCRD,
    attemptedCR,
    attemptedCRE,
    attemptedCRH,
    attemptedCRD,
    noDataChanged = false,
	baseURL = window.location.href,
	to = baseURL.lastIndexOf("/"),
    loaded = null,
    firstTime = true,
    loadEvents = {
        clientRaw: new CustomEvent("clientRawDataUpdate"),
        clientRawExtra: new CustomEvent("clientRawExtraDataUpdate"),
        clientRawHour: new CustomEvent("clientRawHourDataUpdate"),
        clientRawDaily: new CustomEvent("clientRawDailyDataUpdate")
    };

//Helper Functions
function formatTimestampsToMoments(dataArrayIn, dayIn, formatIn) {
    //Formats timestamp Array to Moments
    var returnArray = [];
    for (i = 0; i < dataArrayIn.length; i++) {
        returnArray.push(moment(dayIn + ":" + dataArrayIn[i], formatIn.toString()));
        //fix day changes
        if (i > 0 && returnArray[i] < returnArray[i - 1]) {
            for (q = 1; q <= i; q++) {
                returnArray[i - q].subtract(1, "days");
            }
        }
    }
    return returnArray;
}

function shiftArrayFtL(arrayIn) {
    //moves the first value in the array to the last place
    var arrayOut = arrayIn.slice(),
        movedVal = arrayOut.shift();
    arrayOut.push(movedVal);
    return arrayOut;
}

//Proccesses Base URL

//Check to see if a custom URL was set in the config file, if it isn't, gernerate automatically using current loaction.
if (typeof customBaseURL === "undefined" || customBaseURL === false) {
    to = to === -1 ? baseURL.length : to + 1;
    baseURL = baseURL.substring(0, to);
}   else {
    baseURL = customBaseURL
}

//Array comparison, credit to Tomas Zato @ https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript.
// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


//INFORMATION GATHERING SECTION

function processRecord(startingIndex) {
    var value = arrayClientrawExtra[startingIndex],
        input = "";
    
    input += arrayClientrawExtra[startingIndex + 1].toString() + ":";
    input += arrayClientrawExtra[startingIndex + 2].toString() + " ";
    input += arrayClientrawExtra[startingIndex + 3].toString();
    input += arrayClientrawExtra[startingIndex + 4].toString();
    input += arrayClientrawExtra[startingIndex + 5].toString();
    
    return [value, moment(input, "HH:mm DDMMYYYY")];
}

function processRecordsData(dictIn, startingIndex, startingIndex2) {
    dictIn["Highest temperature"] = processRecord(startingIndex).concat(["temp"]);
    dictIn["Lowest temperature"] = processRecord(startingIndex + 6).concat(["temp"]);
    dictIn["Highest gust"] = processRecord(startingIndex + 12).concat(["wind", ", " + arrayClientrawExtra[startingIndex + 78].toString() + "\xB0"]);
    dictIn["Highest rain rate"] = processRecord(startingIndex + 18).concat(["rainfall", "/min"]);
    dictIn["Lowest barometer"] = processRecord(startingIndex + 24).concat(["pressure"]);
    dictIn["Highest barometer"] = processRecord(startingIndex + 30).concat(["pressure"]);
    dictIn["Highest daily rainfall"] = processRecord(startingIndex + 36).concat(["rainfall"]);
    dictIn["Highest hourly rainfall"] = processRecord(startingIndex + 42).concat(["rainfall"]);
    dictIn["Highest average wind speed"] = processRecord(startingIndex + 48).concat(["wind", ", " + arrayClientrawExtra[startingIndex + 84].toString() + "\xB0"]);
    dictIn["Lowest wind chill"] = processRecord(startingIndex + 72).concat(["temp"]);
    dictIn["Warmest day"] = processRecord(startingIndex + 90).concat(["temp"]);
    dictIn["Coldest night"] = processRecord(startingIndex + 96).concat(["temp"]);
    dictIn["Coldest day"] = processRecord(startingIndex + 102).concat(["temp"]);
    dictIn["Warmest night"] = processRecord(startingIndex + 108).concat(["temp"]);
    dictIn["Highest heat index"] = processRecord(startingIndex + 114).concat(["temp"]);
    dictIn["Highest solar"] = processRecord(startingIndex2).concat(["solar"]);
    dictIn["Highest uv index"] = processRecord(startingIndex2 + 6).concat(["uv"]);
    dictIn["Highest dew point"] = processRecord(startingIndex2 + 69).concat(["temp"]);
    dictIn["Lowest dew point"] = processRecord(startingIndex2 + 75).concat(["temp"]);
}

function processGraphData() {
    //Process data for graphs into dictionary
    graphDict["timestampHour"] = [];
    graphDict["timestampDay"] = [];
    graphDict["baroHours24"] = [];
    graphDict["rainDays31"] = [];
    graphDict["baroDays31"] = [];
    graphDict["windSpeedDays31"] = [];
    graphDict["windDirDays31"] = [];
    graphDict["humidityDays31"] = [];
    graphDict["tempHighDays31"] = [];
    graphDict["tempLowDays31"] = [];
    graphDict["tempMinutes60"] = [];
    graphDict["solarMinutes60"] = [];
    graphDict["rainMinutes60"] = [];
    graphDict["baroMinutes60"] = [];
    graphDict["windSpeedMinutes60"] = [];
    graphDict["windGustMinutes60"] = [];
    graphDict["windDirMinutes60"] = [];
    graphDict["humidityMinutes60"] = [];
    graphDict["timestampMinute"] = [];
    graphDict["windSpeedHours24"] = [];
    graphDict["tempHours24"] = [];
    graphDict["rainHours24"] = [];
    graphDict["solarHours24"] = [];
    graphDict["uvHours24"] = [];
    graphDict["windDirHours24"] = [];
    graphDict["humidityHours24"] = [];
    graphDict["tempQuarterDays28"] = [];
    graphDict["baroQuarterDays28"] = [];
    graphDict["humidityQuarterDays28"] = [];
    graphDict["windDirQuarterDays28"] = [];
    graphDict["windSpeedQuarterDays28"] = [];
    graphDict["solarQuarterDays28"] = [];
    graphDict["uvQuarterDays28"] = [];
    graphDict["timestampQuarterDay"] = [];
    graphDict["rainDays7"] = [];
    graphDict["timestampWeekDay"] = [];
    graphDict["timestampMonth"] = [];
    graphDict["rainMonths12"] = [];
    
    
    //Different rainfall arrays (Bar Graphs)
    //Rainfall per week day - divide by ten for "historical Reasons"
    for (i = 0; i < 7; i++) {
        graphDict["rainDays7"].push(arrayClientrawExtra[484 + i] / 10);
        graphDict["timestampWeekDay"].push(moment(arrayClientrawExtra[700], "DD").isoWeekday(i - 6));
    }
    
    //sort weekly rain dict into correct order; (p + 1) is day index
    var pMax = moment(arrayClientrawExtra[700], "DD").isoWeekday() - 1;
    for (p = 0; p < pMax; p++) {
        graphDict["timestampWeekDay"][p].add(7, "days");
    }
    for (q = 0; q < pMax; q++) {
        graphDict["timestampWeekDay"] = shiftArrayFtL(graphDict["timestampWeekDay"]);
        graphDict["rainDays7"] = shiftArrayFtL(graphDict["rainDays7"]);
    }   
    
    //Rainfall total per month
    for (i = 0; i < 12; i++) {
        graphDict["rainMonths12"].push(arrayClientrawDaily[187 + i]);
        graphDict["timestampMonth"].push(moment(arrayClientraw[36], "MM").month(i - 12));
    }
    
    //sort monthly rain dict into correct order;
    pMax = moment(arrayClientraw[36], "MM").month(); //'moment' months go from 0 - 11
    for (p = 0; p < pMax; p++) {
        graphDict["timestampMonth"][p].add(12, "M");
    }
    for (q = 0; q < pMax; q++) {
        graphDict["timestampMonth"] = shiftArrayFtL(graphDict["timestampMonth"]);
        graphDict["rainMonths12"] = shiftArrayFtL(graphDict["rainMonths12"]);
    }
    
    //24 Hour arrays
    for (i = 0; i < 20; i++) {
        graphDict["windSpeedHours24"].push(arrayClientrawExtra[1 + i]);
        graphDict["tempHours24"].push(arrayClientrawExtra[21 + i]);
        graphDict["rainHours24"].push(arrayClientrawExtra[41 + i]);
        graphDict["solarHours24"].push(arrayClientrawExtra[491 + i]);
        graphDict["uvHours24"].push(arrayClientrawExtra[511 + i]);
        graphDict["windDirHours24"].push(arrayClientrawExtra[536 + i]);
        graphDict["humidityHours24"].push(arrayClientrawExtra[611 + i]);
        graphDict["baroHours24"].push(arrayClientrawExtra[439 + i]);
        graphDict["timestampHour"].push(arrayClientrawExtra[459 + i]);
    }
    //Split into two sections for some reason?
    for (i = 0; i < 4; i++) {
        graphDict["windSpeedHours24"].push(arrayClientrawExtra[562 + i]);
        graphDict["tempHours24"].push(arrayClientrawExtra[566 + i]);
        graphDict["rainHours24"].push(arrayClientrawExtra[570 + i]);
        graphDict["solarHours24"].push(arrayClientrawExtra[582 + i]);
        graphDict["uvHours24"].push(arrayClientrawExtra[586 + i]);
        graphDict["windDirHours24"].push(arrayClientrawExtra[590 + i]);
        graphDict["humidityHours24"].push(arrayClientrawExtra[630 + i]);
        graphDict["baroHours24"].push(arrayClientrawExtra[574 + i]);
        graphDict["timestampHour"].push(arrayClientrawExtra[578 + i]);
    }
    graphDict["timestampHour"] = formatTimestampsToMoments(graphDict["timestampHour"], arrayClientrawExtra[700], "DD:HH:mm");
    
    //31 day arrays
    for (i = 0; i < 31; i++) {
        graphDict["tempHighDays31"].push(arrayClientrawDaily[1 + i]);
        graphDict["tempLowDays31"].push(arrayClientrawDaily[32 + i]);
        graphDict["rainDays31"].push(arrayClientrawDaily[63 + i]);
        graphDict["baroDays31"].push(arrayClientrawDaily[94 + i]);
        graphDict["windSpeedDays31"].push(arrayClientrawDaily[125 + i]);
        graphDict["windDirDays31"].push(arrayClientrawDaily[156 + i]);
        graphDict["humidityDays31"].push(arrayClientrawDaily[199 + i]);
        graphDict["timestampDay"].push(moment(arrayClientrawDaily[232] + ":" + arrayClientrawDaily[230] + ":" + arrayClientrawDaily[231], "DD:HH:mm").subtract(31 - i, "days"));
    }
    
    //60 minute arrays
    for (i = 0; i < 60; i++) {
        graphDict["tempMinutes60"].push(arrayClientrawHour[181 + i]);
        graphDict["solarMinutes60"].push(arrayClientrawHour[421 + i]);
        graphDict["rainMinutes60"].push(arrayClientrawHour[361 + i]);
        graphDict["baroMinutes60"].push(arrayClientrawHour[301 + i]);
        graphDict["windSpeedMinutes60"].push(arrayClientrawHour[1 + i]);
        graphDict["windGustMinutes60"].push(arrayClientrawHour[61 + i]);
        graphDict["windDirMinutes60"].push(arrayClientrawHour[121 + i]);
        graphDict["humidityMinutes60"].push(arrayClientrawHour[241 + i]);
        graphDict["timestampMinute"].push(moment(arrayClientraw[35] + ":" + arrayClientraw[29] + ":01", "DD:HH:mm").subtract(60 - i, "minutes"));
    }
    
    //28 quarter date arrays
    for (i = 0; i < 28; i++) {
        graphDict["tempQuarterDays28"].push(arrayClientrawDaily[233 + i]);
        graphDict["baroQuarterDays28"].push(arrayClientrawDaily[261 + i]);
        graphDict["humidityQuarterDays28"].push(arrayClientrawDaily[289 + i]);
        graphDict["windDirQuarterDays28"].push(arrayClientrawDaily[317 + i]);
        graphDict["windSpeedQuarterDays28"].push(arrayClientrawDaily[345 + i]);
        graphDict["solarQuarterDays28"].push(arrayClientrawDaily[373 + i]);
        graphDict["uvQuarterDays28"].push(arrayClientrawDaily[401 + i]);
        graphDict["timestampQuarterDay"].push(moment(arrayClientrawDaily[232] + ":00:00", "DD:HH:mm").subtract(168 - (i * 6), "hours"));
    }
}

function tryUpdateWidgets() {
    
    if (loaded == true) {
        //check if all are done
        if ((doneCR === true && doneCRE === true && doneCRH === true && doneCRD === true) || (attemptedCR === true && attemptedCRE === true && attemptedCRH === true && attemptedCRD === true && firstTime === false)) {
            doneCR = doneCRE = doneCRH = doneCRD = attemptedCR = attemptedCRE = attemptedCRH = attemptedCRD = false;
            
            if (arrayClientraw.equals(arrayClientrawOld) === true && arrayClientrawExtra.equals(arrayClientrawExtraOld) === true && arrayClientrawDaily.equals(arrayClientrawDailyOld) === true && arrayClientrawHour.equals(arrayClientrawHourOld) === true) {
                noDataChanged = true;
                
                drawStatusS01(arrayClientraw[49], arrayClientraw[32]); //Status widget must always be updated
            } else {
                noDataChanged = false;
                
                //Set first, so that MeteoHub compadibility changes from - to 0 aren't recorded
                arrayClientrawOld = arrayClientraw;
                arrayClientrawExtraOld = arrayClientrawExtra;
                arrayClientrawDailyOld = arrayClientrawDaily;
                arrayClientrawHourOld = arrayClientrawHour;
                
                //Meteohub compadibility changes
                for(i = 0; i < arrayClientrawExtra.length; i++) {
                    if (arrayClientrawExtra[i].toString() === "-") {arrayClientrawExtra[i] = "0"}
                }
                
                drawStatusS01(arrayClientraw[49], arrayClientraw[32]); //Status widget must always be updated
                
                if (arrayClientraw.equals(arrayClientrawOld) === false) {
                    window.dispatchEvent(loadEvents.clientRaw);
                }
                if (arrayClientrawExtra.equals(arrayClientrawExtraOld) === false) {
                    window.dispatchEvent(loadEvents.clientRawExtra);
                }
                if (arrayClientrawDaily.equals(arrayClientrawDailyOld) === false) {
//                    window.dispatchEvent(loadEvents.clientRawDaily);
                }
                if (arrayClientrawHour.equals(arrayClientrawHourOld) === false) {
//                    window.dispatchEvent(loadEvents.clientRawHour);
                }

                processGraphData();
                configureGraphRainBar01("rainfallBar", "dailyMonth");
                configureGraphTempLine01("temp", "hourlyDay");
                configureGraphWindLine01("windSpeed", "hourlyDay");
                configureGraphBaroLine01("barometer", "hourlyDay");
                configureGraph(modalGraph.currentGraph[0], modalGraph.currentGraph[1]);
            }
            
            //If it is the first time here, clear loading screen
            if (firstTime === true) {
                firstTime = false;
                loadingFinished();
            }
            
        }
    }
}

function loadArray(url) {
	//Gets data from Clientraw files
	var xhttpVar;
	
	if (window.XMLHttpRequest) {
		// code for modern browsers
		xhttpVar = new XMLHttpRequest();
    } else {
		// code for IE6, IE5
		xhttpVar = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xhttpVar.open("GET", url, true);
    xhttpVar.setRequestHeader("Cache-Control", "no-cache");
    xhttpVar.send();
	
	return xhttpVar;
}

function updateClientraw() {
	//updates the Clientraw Array with data from server
    var xhttpCR;
    xhttpCR = loadArray(baseURL + clientRawName);
    
    xhttpCR.onreadystatechange = function () {
        if (xhttpCR.readyState === 4) {
            if (xhttpCR.status === 200) {
                dataCollectErrorCR = false;
                arrayClientraw = xhttpCR.responseText.toString().split(" ");
                doneCR = true;
            } else {
                dataCollectErrorCR = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCR = true;

}

function updateClientrawExtra() {
	//updates the Clientraw Extra Array with data from server
	
	var xhttpCRE;
	xhttpCRE = loadArray(baseURL + clientRawExtraName);
	
    xhttpCRE.onreadystatechange = function () {
        if (xhttpCRE.readyState === 4) {
            if (xhttpCRE.status === 200) {
                dataCollectErrorCRE = false;
                arrayClientrawExtra = xhttpCRE.responseText.toString().split(" ");
                doneCRE = true;
            } else {
                dataCollectErrorCRE = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCRE = true;
}

function updateClientrawHour() {
	//updates the Clientraw Hour Array with data from server
	
	var xhttpCRH;
	xhttpCRH = loadArray(baseURL + clientRawHourName);
    
    xhttpCRH.onreadystatechange = function () {
        if (xhttpCRH.readyState === 4) {
            if (xhttpCRH.status === 200) {
                dataCollectErrorCRH = false;
                arrayClientrawHour = xhttpCRH.responseText.toString().split(" ");
                doneCRH = true;
            } else {
                dataCollectErrorCRH = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCRH = true;
}

function updateClientrawDaily() {
	//updates the Clientraw Daily Array with data from server
	
	var xhttpCRD;
	xhttpCRD = loadArray(baseURL + clientRawDailyName);
    
    xhttpCRD.onreadystatechange = function () {
        if (xhttpCRD.readyState === 4) {
            if (xhttpCRD.status === 200) {
                dataCollectErrorCRD = false;
                arrayClientrawDaily = xhttpCRD.responseText.toString().split(" ");
                doneCRD = true;
            } else {
                dataCollectErrorCRD = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCRD = true;
}

//Set intervals for updates of each clientraw array
var intervalJobCR = null;
var intervalJobCRE = null;
var intervalJobCRH = null;
var intervalJobCRD = null;

updateClientraw();
updateClientrawExtra();
updateClientrawHour();
updateClientrawDaily();
intervalJobCR = setInterval(updateClientraw, 5000);
intervalJobCRE = setInterval(updateClientrawExtra, 5000);
intervalJobCRH = setInterval(updateClientrawHour, 5000);
intervalJobCRD = setInterval(updateClientrawDaily, 5000);

//TICK UPDATER
//Ticker frame updates
//Set the framerate (default 60) and set which function is called each frame (tickHandler)

var ticker01 = {
    event: null
};

function initializeTicker() {
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tickHandler);
    ticker01.event = new CustomEvent("frameUpdate");
}

function tickHandler(e) {
    //Updates every tick. Fires update event.
    window.dispatchEvent(ticker01.event);
    
}

//FORCAST HANDLER
var forecast = {
    modal: null,
    span: null,
    displayDiv: null,
    modalForecastDiv: null,
    showMoreLink: null,
    storedTextInput: "Waiting for data..."
};

function formatAndDisplayForecastFor01(textInput) {
    //Format Display Strings
    if (textInput === null) {
        textInput = forecast.storedTextInput;
    }
    forecast.storedTextInput = textInput;
    var origionalText = textInput.replace(/_/g, " "),
        editedText = origionalText,
        textArray = origionalText.split(" ");
    
    forecast.modalForecastDiv.innerHTML = origionalText;
    forecast.displayDiv.innerHTML = origionalText;
    
    if (checkOverflow(forecast.displayDiv)) {
        while (checkOverflow(forecast.displayDiv) && textArray.length > 0) {
            //Formats text to fit inside the div, and adds the show more link
            var charRemove = textArray.pop();
            charRemove = charRemove.length;
            editedText = editedText.slice(0, -(charRemove + 1));
            forecast.displayDiv.innerHTML = editedText + '... <a id="showMoreLink", href="#">Show More</a>';
            
            //Sets the link to open the modal
            forecast.showMoreLink = document.getElementById("showMoreLink");
            forecast.showMoreLink.onclick = function () {
                forecast.modal.style.display = "block";
            };
        }
    }
}

function resizeDivFor01() {
    //Dynamic Div Resizing for desktop
	var size = 1,
        modalDivSize = 0.4,
        ratio = 6.19,
        width = 0,
        height = 0,
        stlyeString = null,
        parentDiv = forecast.displayDiv.parentElement;
	
	//Adjusts div to match resized window. Always adjust to the smallest dimention
    width = parentDiv.clientHeight * size * ratio;
    height = parentDiv.clientHeight * size * 0.59; //0.59 to match status
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    
    forecast.displayDiv.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    forecast.displayDiv.style.width = width.toString();
    forecast.displayDiv.style.height = height.toString();
    
	//Adjusts modal div to math resized window. always adjust to the smallest dimention
    if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
		width = document.documentElement.clientHeight * modalDivSize * 2;
		height = document.documentElement.clientHeight * modalDivSize;
	} else {
		width = document.documentElement.clientWidth * modalDivSize * 2;
		height = document.documentElement.clientWidth * modalDivSize;
	}
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    forecast.modalForecastDiv.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    forecast.modalForecastDiv.style.width = width.toString();
    forecast.modalForecastDiv.style.height = height.toString();
    
    //Check if text is now overflowing, and resize if is
    formatAndDisplayForecastFor01(null);
}

function forecastInitFor01() {
    forecast.displayDiv = document.getElementById("forecastText");
    forecast.modalForecastDiv = document.getElementById("modalForecastDiv");
    
    window.addEventListener("clientRawExtraDataUpdate", function () {
        formatAndDisplayForecastFor01(arrayClientrawExtra[531]);
    });
    
    // Get the modal
    forecast.modal = document.getElementById('forecastModal');
    forecast.modal.style.display = "none";

    // Get the <span> element that closes the modal
    forecast.span = document.getElementById("forecastClose");

    // When the user clicks on <span> (x), close the modal
    forecast.span.onclick = function () {
        forecast.modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == forecast.modal) {
            forecast.modal.style.display = "none";
        }
    };
    
    //If on desktop, dynamically resize the div, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeDivFor01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeDivFor01();
        });
    }
	
    //Set the div size intially.
    resizeDivFor01();
    
    checkOffLoaded();
}

//RECORD HANDLER
var records = {
    modal: null,
    span: null,
    modalRecordsDiv: null,
    button: null,
    table: null,
    recordsDictOld: null,
    currentOption: 0
};

function updateValuesRe01() {
    var  recordKeys = Object.keys(recordsDict[records.currentOption]);
    records.table.innerHTML = '';
    for (i = 0; i < recordKeys.length; i++) {
        var row = records.table.insertRow(),
            cell0 = row.insertCell(0),
            cell1 = row.insertCell(1),
            cell2 = row.insertCell(2);

        cell0.innerHTML = recordKeys[i];
        cell2.innerHTML = recordsDict[records.currentOption][recordKeys[i]][1].format("HH:mm, MMM D YYYY");

        if (recordsDict[records.currentOption][recordKeys[i]].length == 3) {
            cell1.innerHTML = formatDataToUnit(recordsDict[records.currentOption][recordKeys[i]][0], recordsDict[records.currentOption][recordKeys[i]][2]) + units[recordsDict[records.currentOption][recordKeys[i]][2].toString()][currentUnits[recordsDict[records.currentOption][recordKeys[i]][2].toString()]][1].toString();
        } else if (recordsDict[records.currentOption][recordKeys[i]].length == 4) {
            cell1.innerHTML = formatDataToUnit(recordsDict[records.currentOption][recordKeys[i]][0], recordsDict[records.currentOption][recordKeys[i]][2]) + units[recordsDict[records.currentOption][recordKeys[i]][2].toString()][currentUnits[recordsDict[records.currentOption][recordKeys[i]][2].toString()]][1].toString() + recordsDict[records.currentOption][recordKeys[i]][3];
        }
        
        var dateDiff = moment(arrayClientraw[29] + arrayClientraw[30] + arrayClientraw[31] + arrayClientraw[74], "HHmmssdd/mm/yyyy").diff(recordsDict[records.currentOption][recordKeys[i]][1], 'days');
        if (dateDiff < 2) {
            row.style.backgroundColor = "rgb(245, 141, 122)";
        } else if (dateDiff <= 7) {
            row.style.backgroundColor = "rgb(236, 242, 98)";
        } else {
            row.style.backgroundColor = "rgb(157, 235, 99)";
        }
    }
}

function changeCurrentOptionRe01(optionNum) {
    records.currentOption = optionNum;
    updateValuesRe01();
}

function resizeDivRe01() {
    //Dynamic Div Resizing for desktop
	var size = 1,
        modalDivSize = 0.6,
        width = 0,
        height = 0,
        stlyeString = null,
        increaseCount = 0;
    
	//Adjusts modal div to math resized window. always adjust to the smallest dimention
    if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
		width = document.documentElement.clientHeight * modalDivSize * 1.5;
		height = document.documentElement.clientHeight * modalDivSize;
	} else {
		width = document.documentElement.clientWidth * modalDivSize * 1.5;
		height = document.documentElement.clientWidth * modalDivSize;
	}
    
    records.table.style.fontSize = sharpenValue(Math.pow(height, 2) / 10000) + "px";
        while (records.modalRecordsDiv.clientHeight < records.table.clientHeight) {
            records.table.style.fontSize = sharpenValue(Math.pow(height, 2) / (10000 + 1000 * increaseCount)) + "px";
            increaseCount += 1;
        }
        
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    records.modalRecordsDiv.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    records.modalRecordsDiv.style.width = width.toString();
    records.modalRecordsDiv.style.height = height.toString();
    
    if (recordsDict !== records.recordsDictOld) {
        updateValuesRe01();
    }
    records.recordsDictOld = recordsDict;
}

function recordsInitRe01() {
    records.modalRecordsDiv = document.getElementById("modalRecordsDiv");
    records.button = document.getElementById("RecordsButton");
    records.table = document.getElementById("recordsTable");
    
    window.addEventListener("clientRawExtraDataUpdate", function () {
        processRecordsData(recordsDict[2], 313, 684);
        processRecordsData(recordsDict[1], 187, 672);
        processRecordsData(recordsDict[0], 61, 660);
        updateValuesRe01();
    });
    
    // Get the modal
    records.modal = document.getElementById('recordsModal');
    records.modal.style.display = "none";

    // Get the <span> element that closes the modal
    records.span = document.getElementById("recordsClose");

    // When the user clicks on <span> (x), close the modal
    records.span.onclick = function () {
        records.modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == records.modal) {
            records.modal.style.display = "none";
        }
    };
    
    records.button.addEventListener('click', function() {
        records.modal.style.display = "block";
        resizeDivRe01();
    }, false);
    
    //If on desktop, dynamically resize the div, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeDivRe01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeDivRe01();
        });
    }
	
    //Set the div size intially.
    resizeDivRe01();
    
    checkOffLoaded();
}

//GRAPH HANDLER
//Globals
var modalGraph = {
	canvas: null,
	canvasDiv: null,
	chart: null,
    header: null,
    footer: null,
    headerText: null,
    currentGraph: null
};

function drawGraphLine() {
	//Draws the graph
    var options = {
            chartArea: {
                backgroundColor: 'rgba(255, 255, 255, 1)'
            },
			scales: {
                display: true,
				yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: null,
                        fontSize: 20
                    }
				}],
                xAxes: [{
                    type: 'time',
                    ticks: {
                        minor: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        },
                        major: {
                            autoSkip: true,
                            autoSkipPadding: 0
                        }
                    },
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {
                            day: "MMM D",
                            hour: "HH:mm",
                            millisecond: "h:mm:ss.SSS a",
                            minute: "HH:mm",
                            month: "MMM YYYY",
                            quarter: "[Q]Q - YYYY",
                            second: "h:mm:ss a",
                            week: "ll",
                            year: "YYYY"
                        }
                    }
                }]
			},
            legend: {
                display: false
            }
        
		};
	modalGraph.chart = new Chart(modalGraph.canvas.getContext("2d", {alpha: false}), {
		type: "line",
		data: {
			datasets: []
		},
		options: options
	});
}

function drawGraphBar() {
	//Draws the graph
    var options = {
            chartArea: {
                backgroundColor: 'rgba(255, 255, 255, 1)'
            },
			scales: {
                display: true,
				yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: null,
                        fontSize: 20
                    }
				}],
                xAxes: [{
                    type: 'category'
                }]
			}
		};
	modalGraph.chart = new Chart(modalGraph.canvas.getContext("2d", {alpha: false}), {
		type: "bar",
		data: {
            labels: [],
            datasets: []
        },
		options: options
	});
}

function cleanCanvas() {
    modalGraph.chart.destroy();
    modalGraph.chart = null;
}

function configureGraphLine(baseIn, graphIn) {
    //Display line graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        style = baseIn.style.toString(),
        multipleSets = false;
    
    //if 2 dataSets
    if (graphIn.data.length > 1) {
        var graphData2 = [],
            style2 = graphIn.additionalStyles.toString(),
            multipleSets = true;
    }
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = {
            x: graphDict[graphIn.timestamp][i],
            y: formatDataToUnit(graphDict[graphIn.data[0]][i], baseIn.unit)
        };
        //if 2 dataSets
        if (multipleSets == true) {
            graphData2[i] = {
                x: graphDict[graphIn.timestamp][i],
                y: formatDataToUnit(graphDict[graphIn.data[1]][i], baseIn.unit)
            };
        }
    }
    
    cleanCanvas();
    
    //configure as line chart
    drawGraphLine();
    modalGraph.chart.data.datasets[0] = graphStyles[style];
    modalGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    modalGraph.chart.data.datasets[0].data = graphData;
    modalGraph.chart.options.scales.xAxes[0].time.unit = graphIn.timeDisplay.toString();
    modalGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    
    //If weekly graph, change to weekday display
    if (modalGraph.currentGraph[1].toString() === "quarterDailyWeek") {
        modalGraph.chart.options.scales.xAxes[0].time.displayFormats.day = "ddd";
    } else {
        modalGraph.chart.options.scales.xAxes[0].time.displayFormats.day = "MMM D"; 
    }
    
    //if 2 dataSets
    if (multipleSets == true) {
        modalGraph.chart.data.datasets[1] = graphStyles[style2];
        modalGraph.chart.data.datasets[0].label = graphIn.legendLabels[0] + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
        modalGraph.chart.data.datasets[1].label = graphIn.legendLabels[1] + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
        modalGraph.chart.data.datasets[1].data = graphData2;
    }
    
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions);
    for (i = 0; i < tickKeys.length; i++) {
        modalGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    //configure legend
    var legendKeys = Object.keys(graphIn.legendOptions);
    for (i = 0; i < tickKeys.length; i++) {
        modalGraph.chart.options.legend[legendKeys[i]] = graphIn.legendOptions[legendKeys[i]];
    }
    
    
    modalGraph.chart.update();
    
    //update modal header and footer
    modalGraph.headerText.innerHTML = graphIn.title;
    modalGraph.header.style.backgroundColor = graphStyles[style].borderColor;
    modalGraph.footer.style.backgroundColor = graphStyles[style].borderColor;
    
    resizeCanvasModG01();
}

function configureGraphBar(baseIn, graphIn) {
    //Display bar graph
    baseIn = globalGraphs[baseIn];
    graphIn = baseIn.graphs[graphIn];

    var graphData = [],
        graphLabels = [],
        style = baseIn.style.toString();   
    
    for (i = 0; i < graphDict[graphIn.timestamp].length; i++) {
        graphData[i] = formatDataToUnit(graphDict[graphIn.data][i], baseIn.unit);
        graphLabels[i] = graphDict[graphIn.timestamp][i].format(graphIn.timeDisplay.toString());
    }
    
    cleanCanvas();
    
    //configure as bar chart
    drawGraphBar();
    
    modalGraph.chart.data.datasets[0] = graphStyles[style];
    modalGraph.chart.data.datasets[0].label = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    modalGraph.chart.data.datasets[0].data = graphData;
    modalGraph.chart.data.labels = graphLabels;
    modalGraph.chart.options.scales.yAxes[0].scaleLabel.labelString = baseIn.label.toString() + " (" + units[baseIn.unit.toString()][currentUnits[baseIn.unit.toString()]][1].toString() + ")";
    //configure ticks
    var tickKeys = Object.keys(baseIn.tickOptions)
    for (i = 0; i < tickKeys.length; i++) {
        modalGraph.chart.options.scales.yAxes[0].ticks[tickKeys[i]] = baseIn.tickOptions[tickKeys[i]];
    }
    
    
    modalGraph.chart.update();
    
    //update modal header and footer
    modalGraph.headerText.innerHTML = graphIn.title;
    modalGraph.header.style.backgroundColor = graphStyles[style].borderColor;
    modalGraph.footer.style.backgroundColor = graphStyles[style].borderColor;
    
    resizeCanvasModG01();
}

function configureGraph(val1, val2) {
    //calls the appropriate configure graph function
    var graphType = globalGraphs[val1]["graphType"];
    modalGraph.currentGraph = [val1, val2];
    if (graphType == "line") {
        configureGraphLine(val1, val2);
    } else if (graphType == "bar") {
        configureGraphBar(val1, val2);
    } else {
        console.log("Unrecognised Graph Type");
    }
}

function resizeCanvasModG01() {
	//Dynamic Canvas Resizing for desktop
	var size = 0.4;
	//Always adjust to the smallest dimention
	if (document.documentElement.clientHeight <= document.documentElement.clientWidth) {
		modalGraph.canvasDiv.style.width = (document.documentElement.clientHeight * size * 2).toString() + "px";
		modalGraph.canvasDiv.style.height = (document.documentElement.clientHeight * size).toString() + "px";
	} else {
		modalGraph.canvasDiv.style.width = (document.documentElement.clientWidth * size * 2).toString() + "px";
		modalGraph.canvasDiv.style.height = (document.documentElement.clientWidth * size).toString() + "px";
	}
		
	modalGraph.chart.resize();
}

function initializeModalGraph01() {
	//Initial Funtion Called
	//Define variables
	modalGraph.canvas = document.getElementById('ModalCanvas');
	modalGraph.canvasDiv = document.getElementById('ModalCanvasDiv');
    modalGraph.header = document.getElementById("graphHeader");
    modalGraph.footer = document.getElementById("graphFooter");
    modalGraph.headerText = document.getElementById("graphHeaderText");
    modalGraph.currentGraph = ["barometer", "hourlyDay"];
    
	drawGraphLine();
    
	//If on desktop, dynamically resize the canvas
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasModG01();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeCanvasModG01();
        });
    }
	
	resizeCanvasModG01(); //Set canvas size initally
    
    checkOffLoaded();
}

//BUTTON HANDLER
//Handles pressing of buttons (apart from GraphsButton)

var buttons = {
    altitude: null,
    pressure: null,
    wind: null,
    rainfall: null,
    temp: null,
    records: null
};

function updateUnits(unitType) {
    //Update each reuiqred widget
    if (unitType == "altitude") {
        //cloud base
    } else if (unitType == "pressure") {
        drawBarometerB01(arrayClientraw[6], arrayClientraw[50], true);
        configureGraphBaroLine01("barometer", "hourlyDay");
    } else if (unitType == "wind") {
        drawSpeedBarWS01(arrayClientraw[1], arrayClientraw[2], arrayClientraw[113], arrayClientraw[71], true);
        configureGraphWindLine01("windSpeed", "hourlyDay");
    } else if (unitType == "rainfall") {
        drawUniratureBarUni01(arrayClientraw[7], true);
        drawUniratureBarUni02(arrayClientraw[8], true);
        drawUniratureBarUni03(arrayClientraw[9], true);
        configureGraphRainBar01("rainfallBar", "dailyMonth");
    } else if (unitType == "temp") {
        drawTemperatureBarTemp01(arrayClientraw[4], arrayClientraw[46], arrayClientraw[47], true);
        drawWindchillBarWC01(arrayClientraw[44], arrayClientraw[77], arrayClientraw[78], true);
        drawApparentA01(arrayClientraw[130], true);
        configureGraphTempLine01("temp", "hourlyDay");
    }    
    
    updateValuesRe01();    
    //configureGraph(modalGraph.currentGraph[0], modalGraph.currentGraph[1]);
}

function changeUnit(unit) {
    var uKeys = Object.keys(units[unit]),
        i = 0;
    while (currentUnits[unit] !== uKeys[i]) {
        i += 1;
    }
    if (i == uKeys.length - 1) {
        currentUnits[unit] = [uKeys[0]].toString();
    } else {
        currentUnits[unit] = [uKeys[i + 1]].toString();
    }
    
    //update widgets
    updateUnits(unit);
    
}

function initializeButtons() {
    buttons.altitude = document.getElementById("AltitudeButton");
    buttons.pressure = document.getElementById("PressureButton");
    buttons.wind = document.getElementById("WindButton");
    buttons.rainfall = document.getElementById("RainfallButton");
    buttons.temp = document.getElementById("TempButton");
    buttons.records = document.getElementById("RecordsButton");
    
    buttons.altitude.addEventListener('click', function() {changeUnit("altitude"); }, false);
    buttons.pressure.addEventListener('click', function() {changeUnit("pressure"); }, false);
    buttons.wind.addEventListener('click', function() {changeUnit("wind"); }, false);
    buttons.rainfall.addEventListener('click', function() {changeUnit("rainfall"); }, false);
    buttons.temp.addEventListener('click', function() {changeUnit("temp"); }, false);
}

//MODAL HANDLER
var modal = {
    modal: null,
    canvas: null,
    canvasDiv: null,
    button: null,
    span: null,
    selectMenu: null,
    graphInputs: {},
    graphs: {
        rain: null,
        baro: null,
        temp: null,
        wind: null
    }
};


function initModalHandler() {
    //Does things which need to be done once page is fully loaded
    // Get the canvas, and others
    modal.canvas = modalGraph.canvas;
    modal.canvasDiv = modalGraph.canvasDiv;
    modal.selectMenu = document.getElementById("selectMenu");

    // Get the modal
    modal.modal = document.getElementById('myModal');
    modal.modal.style.display = "none";

    // Get the <span> element that closes the modal
    modal.span = document.getElementById("graphClose");
    //Select menu
    var select, i, option;

    select = document.getElementById("selectMenu");

    // Populate 'select' menu
    var gGkeys = Object.keys(globalGraphs),
        options = {};
    
    for (a = 0; a < gGkeys.length; a++) {
        var currentGraphKeys = Object.keys(globalGraphs[gGkeys[a]].graphs);

        for (b = 0; b < currentGraphKeys.length; b++) {
            var optionLabel = gGkeys[a].toString() + currentGraphKeys[b].toString();

            options[optionLabel] = document.createElement("option");
            options[optionLabel].value = optionLabel;
            modal.graphInputs[optionLabel] = [gGkeys[a], currentGraphKeys[b]];
            options[optionLabel].text = globalGraphs[gGkeys[a]].graphs[currentGraphKeys[b]].title;

            modal.selectMenu.add(options[optionLabel]);
        }
    }
    
    // When the user clicks on <span> (x), close the modal
    modal.span.onclick = function () {
        modal.modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal.modal) {
            modal.modal.style.display = "none";
        }
    };

    // When the user clicks a graph, or graph button, open the modal
    modal.graphs.rain = document.getElementById("rainGraphCanvas01");
    modal.graphs.rain.addEventListener('click', function() {
        modal.selectMenu.value = "rainfallBardailyMonth";
        modal.modal.style.display = "block";
        configureGraph("rainfallBar", "dailyMonth");
        modalGraph.chart.resize();
    }, false);
    
    modal.graphs.temp = document.getElementById("tempGraphCanvas01");
    modal.graphs.temp.addEventListener('click', function() {
        modal.selectMenu.value = "temphourlyDay";
        modal.modal.style.display = "block";
        configureGraph("temp", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    modal.graphs.baro = document.getElementById("baroGraphCanvas01");
    modal.graphs.baro.addEventListener('click', function() {
        modal.selectMenu.value = "barometerhourlyDay";
        modal.modal.style.display = "block";
        configureGraph("barometer", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    modal.graphs.wind = document.getElementById("windGraphCanvas01");
    modal.graphs.wind.addEventListener('click', function() {
        modal.selectMenu.value = "windSpeedhourlyDay";
        modal.modal.style.display = "block";
        configureGraph("windSpeed", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    modal.button = document.getElementById("GraphsButton");
    modal.button.addEventListener('click', function() {
        modal.selectMenu.value = "barometerhourlyDay";
        modal.modal.style.display = "block";
        configureGraph("barometer", "hourlyDay");
        modalGraph.chart.resize();
    }, false);
    
    checkOffLoaded();
}

// Change graph when user uses 'select' menu
function graphChange(obj) {
    configureGraph(modal.graphInputs[obj.value][0], modal.graphInputs[obj.value][1]);
}

//INITIALISATION OF ALL
function initAll() {
    //Calls initialisation functions of everything needed
    apparent01.canvas = document.getElementById(apparent01.config.canvasID.toString());
    solarBar01.canvas = document.getElementById(solarBar01.config.canvasID.toString());
    uvBar01.canvas = document.getElementById(uvBar01.config.canvasID.toString());
    tempBar.canvas = document.getElementById('TempBar01');
    barometer01.canvas = document.getElementById(barometer01.config.canvasID.toString());
    windchill01.canvas = document.getElementById('Windchill01');
    baroGraph.canvas = document.getElementById('baroGraphCanvas01').getContext("2d", {alpha: false});
    rainGraph.canvas = document.getElementById('rainGraphCanvas01').getContext("2d", {alpha: false});
    tempGraph.canvas = document.getElementById('tempGraphCanvas01').getContext("2d", {alpha: false});
    windGraph.canvas = document.getElementById('windGraphCanvas01').getContext("2d", {alpha: false});
    humidityGauge.canvas = document.getElementById('HumidityGauge01');
    moonSun01.canvas = document.getElementById(moonSun01.config.canvasID.toString());
    status01.canvas = document.getElementById(status01.config.canvasID.toString());
    titleRainfall01.canvas = document.getElementById(titleRainfall01.config.canvasID.toString());
    uniBar01.canvas = document.getElementById(uniBar01.config.canvasID.toString());
    uniBar02.canvas = document.getElementById(uniBar02.config.canvasID.toString());
    uniBar03.canvas = document.getElementById(uniBar03.config.canvasID.toString());
    windGauge.canvas = document.getElementById('WindGauge01');
    windSpeed.canvas = document.getElementById('WindSpeed01');
    initialiseLayout();
    if (widgetList["apparent"].enabled === true) {initializeApparentA01();} else {apparent01.canvas.style.display = "none";}
    if (widgetList["temperature"].enabled === true) {initializeTemp01();} else {tempBar.canvas.style.display = "none";}
    if (widgetList["barometer"].enabled === true) {initializeBarometerB01();} else {barometer01.canvas.style.display = "none";}
    if (widgetList["windChill"].enabled === true) {initializeWC01();} else {windchill01.canvas.style.display = "none";}
    if (widgetList["forecastHandler"].enabled === true) {forecastInitFor01();}
    if (widgetList["graphHandler"].enabled === true) {initializeModalGraph01();}
    if (widgetList["graphHandlerBarometer"].enabled === true) {initializeBaroGraph01();} else {baroGraph.canvas.style.display = "none";}
    if (widgetList["graphHandlerRainfall"].enabled === true) {initializeRainGraph01();} else {rainGraph.canvas.style.display = "none";}
    if (widgetList["graphHandlerTemperature"].enabled === true) {initializeTempGraph01();} else {tempGraph.canvas.style.display = "none";}
    if (widgetList["graphHandlerWindSpeed"].enabled === true) {initializeWindGraph01();} else {windGraph.canvas.style.display = "none";}
    if (widgetList["humidity"].enabled === true) {initializeHum01();} else {humidityGauge.canvas.style.display = "none";}
    if (widgetList["modalHandler"].enabled === true) {initModalHandler();}
    if (widgetList["moonSun"].enabled === true) {initializeMoonSunMS01();} else {moonSun01.canvas.style.display = "none";}
    if (widgetList["recordHandler"].enabled === true) {recordsInitRe01();}
    if (widgetList["solar"].enabled === true) {initializeSolarBarSol01();} else {solarBar01.canvas.style.display = "none";}
    if (widgetList["status"].enabled === true) {initializeStatusS01();} else {status01.canvas.style.display = "none";}
    if (widgetList["rainfallTitle"].enabled === true) {initializeTitleRainfallTR01();} else {titleRainfall01.canvas.style.display = "none";}
    if (widgetList["rainfallDay"].enabled === true) {initializeUniBarUni01();} else {uniBar01.canvas.style.display = "none";}
    if (widgetList["rainfallMonth"].enabled === true) {initializeUniBarUni02();} else {uniBar02.canvas.style.display = "none";}
    if (widgetList["rainfallYear"].enabled === true) {initializeUniBarUni03();} else {uniBar03.canvas.style.display = "none";}
    if (widgetList["UV"].enabled === true) {initializeUVBarUV01();} else {uvBar01.canvas.style.display = "none";}
    if (widgetList["windDirection"].enabled === true) {initializeWind01();} else {windGauge.canvas.style.display = "none";}
    if (widgetList["windSpeed"].enabled === true) {initializeWS01();} else {windSpeed.canvas.style.display = "none";}
    initializeTicker();
    initializeButtons();
}