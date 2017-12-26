/*jslint plusplus: true, sloppy: true, indent: 4 */

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
	}
};

Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
	//Maps values: inputted variable from range in_min to in_max gets mapped to output ranging from out_min to out_max
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function drawWithInputValueHum01() {
    //Function that is called when button pressed
    var halfAngleDeg = (Math.PI - Math.acos((humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.posOuterCircle.y) / humidityGauge.setupVars.outerCircleRad)) * (180 / Math.PI);
    
    humidityGauge.values.humidityIn = parseFloat(document.getElementById('txtHumidity').value, 0);
    
    if (humidityGauge.values.humidityIn !== null) {
        humidityGauge.values.humidityOut = humidityGauge.values.humidityIn.map(0, 100, -halfAngleDeg, halfAngleDeg)
        
        createjs.Tween.get(humidityGauge.tweens)
            .to({r: humidityGauge.values.humidityOut}, 2000, createjs.Ease.quartInOut);
	}
}

function drawHumidityGaugeHum01(humidityIn) {
    //Is called when new data is sent.
    var halfAngleDeg = (Math.PI - Math.acos((humidityGauge.setupVars.cutOffLength - humidityGauge.setupVars.posOuterCircle.y) / humidityGauge.setupVars.outerCircleRad)) * (180 / Math.PI);
    
    humidityGauge.values.humidityIn = parseFloat(humidityIn, 0);
    humidityGauge.values.humidityOut = humidityGauge.values.humidityIn.map(0, 100, -halfAngleDeg, halfAngleDeg)
    createjs.Tween.get(humidityGauge.tweens)
        .to({r: humidityGauge.values.humidityOut}, 2000, createjs.Ease.quartInOut);
}

function updateTweensHum01() {
    //Updates any tweened or changing objects. This is called every frame
    humidityGauge.pointer.rotation = humidityGauge.tweens.r;
    humidityGauge.textDisplay.text = humidityGauge.values.humidityIn.toString() + "%"
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
	humidityGauge.canvas = document.getElementById('HumidityGauge01');
	humidityGauge.stage = new createjs.Stage(humidityGauge.canvas);
    
    //Creates information tooltip
    new Opentip(humidityGauge.canvas, "The amount of water vapour in the air as a percentage of the amount the air is capable of holding.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpHum01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasHum01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasHum01();
    
    checkOffLoaded();
}