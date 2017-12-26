/*jslint plusplus: true, sloppy: true, indent: 4 */

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
    solarBar01.values.percentIn = formatDataToUnit(solarBar01.values.percentIn, solarBar01.config.unitsIn, roundTo);
    
    //Map the inputs to the current scale (as a proportion)
	solarBar01.values.percentOut = solarBar01.values.percentIn.map(0, 100, 0, 1);
}

function drawSolarBarSol01(percentIn, uniIn, sunHoursIn) {
    //Is called when new data is sent.
    
    //Sets inputs to new data
	solarBar01.values.uniIn = Number(uniIn);
	solarBar01.values.percentIn = Number(percentIn);
	solarBar01.values.sunHoursIn = Number(sunHoursIn);

    //Starts the tweens (animations) of the inputs
	formatInputSol01();
	createjs.Tween.get(solarBar01.tweens.barFill)
		.to({h: solarBar01.values.percentOut}, 2000, createjs.Ease.quartInOut);
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
	solarBar01.canvas = document.getElementById(solarBar01.config.canvasID.toString());
	solarBar01.stage = new createjs.Stage(solarBar01.canvas);
    
    //Creates information tooltip
    new Opentip(solarBar01.canvas, "The intensity of the sun's radiation.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpSol01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasSol01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasSol01();
    
    checkOffLoaded();
}