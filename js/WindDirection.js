/*jslint plusplus: true, sloppy: true, indent: 4 */

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
	windGauge.canvas = document.getElementById('WindGauge01');
	windGauge.stage = new createjs.Stage(windGauge.canvas);
    
    //Creates information tooltip
    new Opentip(windGauge.canvas, "The wind direction. Green arrow indicates average wind direction.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpWind01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasWind01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasWind01();
    
    checkOffLoaded();
}