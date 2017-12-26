/*jslint plusplus: true, sloppy: true, indent: 4 */

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
		maxUni: 1,
		maxUniDEFAULT: 1
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
        unitsIn: "rainfall",
        title: "Daily",
        canvasID: "RainBar1",
        tickScaler: 10
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
    uniBar01.values.uniIn = formatDataToUnit(uniBar01.values.uniIn, uniBar01.config.unitsIn, roundTo);
    
	//Adjust Range if needed: if the input is less than the current minimum of the range, decrease the minimum. If the input is bigger than the current maximum of the range, increase the maximum. 
	while (uniBar01.values.uniIn < uniBar01.constants.minUni) {uniBar01.constants.minUni -= uniBar01.config.tickScaler * (gapNum); }
	while (uniBar01.values.uniIn > uniBar01.constants.maxUni) {uniBar01.constants.maxUni += uniBar01.config.tickScaler * (gapNum); }

    //Adjust Range if needed: if the input is bigger than the current minimum of the range, increase the minimum. If the input is less than the current maximum of the range, decrease the maximum. 
	while ((uniBar01.values.uniIn >= uniBar01.constants.minUni + uniBar01.config.tickScaler * (gapNum) && uniBar01.constants.minUni < uniBar01.constants.minUniDEFAULT)) {uniBar01.constants.minUni += uniBar01.config.tickScaler * (gapNum); }
	while ((uniBar01.values.uniIn <= uniBar01.constants.maxUni - uniBar01.config.tickScaler * (gapNum) && uniBar01.constants.maxUni > uniBar01.constants.maxUniDEFAULT)) {uniBar01.constants.maxUni -= uniBar01.config.tickScaler * (gapNum); }
	
    //Map the inputs to the current scale (as a percentage)
	uniBar01.values.uniOut = uniBar01.values.uniIn.map(uniBar01.constants.minUni, uniBar01.constants.maxUni, 0, 1);
}

function drawWithInputValueUni01() {
    //Function that is called when button pressed
	uniBar01.values.uniIn = parseFloat(document.getElementById('txtUni').value, 0);

	if (uniBar01.values.uniIn !== null) {
		formatInputUni01();
        createjs.Tween.get(uniBar01.tweens.barFill)
            .to({h: uniBar01.values.uniOut}, 2000, createjs.Ease.quartInOut);
	}

}

function drawUniratureBarUni01(uniIn) {
    //Is called when new data is sent.
    
    //Sets inputs to new data
	uniBar01.values.uniIn = uniIn;

    //Starts the tweens (animations) of the inputs
	formatInputUni01();
	createjs.Tween.get(uniBar01.tweens.barFill)
		.to({h: uniBar01.values.uniOut}, 2000, createjs.Ease.quartInOut);
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
	uniBar01.canvas = document.getElementById(uniBar01.config.canvasID.toString());
	uniBar01.stage = new createjs.Stage(uniBar01.canvas);
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUni01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUni01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasUni01();
    
    checkOffLoaded();
}