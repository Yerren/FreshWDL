/*jslint plusplus: true, sloppy: true, indent: 4 */

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
		maxUni: 1000,
		maxUniDEFAULT: 1000
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
        tickScaler: 100
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
    uniBar03.values.uniIn = formatDataToUnit(uniBar03.values.uniIn, uniBar03.config.unitsIn, roundTo);
    
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
	uniBar03.canvas = document.getElementById(uniBar03.config.canvasID.toString());
	uniBar03.stage = new createjs.Stage(uniBar03.canvas);
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUni03();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUni03();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasUni03();
    
    checkOffLoaded();
}