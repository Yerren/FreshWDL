/*jslint plusplus: true, sloppy: true, indent: 4 */

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
		maxUni: 500,
		maxUniDEFAULT: 500
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
        title: "Monthly",
        canvasID: "RainBar2",
        tickScaler: 50
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
    uniBar02.values.uniIn = formatDataToUnit(uniBar02.values.uniIn, uniBar02.config.unitsIn, roundTo);
    
	//Adjust Range if needed: if the input is less than the current minimum of the range, decrease the minimum. If the input is bigger than the current maximum of the range, increase the maximum. 
	while (uniBar02.values.uniIn < uniBar02.constants.minUni) {uniBar02.constants.minUni -= uniBar02.config.tickScaler * (gapNum); }
	while (uniBar02.values.uniIn > uniBar02.constants.maxUni) {uniBar02.constants.maxUni += uniBar02.config.tickScaler * (gapNum); }

    //Adjust Range if needed: if the input is bigger than the current minimum of the range, increase the minimum. If the input is less than the current maximum of the range, decrease the maximum. 
	while ((uniBar02.values.uniIn >= uniBar02.constants.minUni + uniBar02.config.tickScaler * (gapNum) && uniBar02.constants.minUni < uniBar02.constants.minUniDEFAULT)) {uniBar02.constants.minUni += uniBar02.config.tickScaler * (gapNum); }
	while ((uniBar02.values.uniIn <= uniBar02.constants.maxUni - uniBar02.config.tickScaler * (gapNum) && uniBar02.constants.maxUni > uniBar02.constants.maxUniDEFAULT)) {uniBar02.constants.maxUni -= uniBar02.config.tickScaler * (gapNum); }
	
    //Map the inputs to the current scale (as a percentage)
	uniBar02.values.uniOut = uniBar02.values.uniIn.map(uniBar02.constants.minUni, uniBar02.constants.maxUni, 0, 1);
}

function drawWithInputValueUni02() {
    //Function that is called when button pressed
	uniBar02.values.uniIn = parseFloat(document.getElementById('txtUni').value, 0);

	if (uniBar02.values.uniIn !== null) {
		formatInputUni02();
        createjs.Tween.get(uniBar02.tweens.barFill)
            .to({h: uniBar02.values.uniOut}, 2000, createjs.Ease.quartInOut);
	}

}

function drawUniratureBarUni02(uniIn) {
    //Is called when new data is sent.
    
    //Sets inputs to new data
	uniBar02.values.uniIn = uniIn;

    //Starts the tweens (animations) of the inputs
	formatInputUni02();
	createjs.Tween.get(uniBar02.tweens.barFill)
		.to({h: uniBar02.values.uniOut}, 2000, createjs.Ease.quartInOut);
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
	uniBar02.canvas = document.getElementById(uniBar02.config.canvasID.toString());
	uniBar02.stage = new createjs.Stage(uniBar02.canvas);
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUni02();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUni02();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasUni02();
    
    checkOffLoaded();
}