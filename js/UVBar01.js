/*jslint plusplus: true, sloppy: true, indent: 4 */

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
    uvBar01.values.uniIn = formatDataToUnit(uvBar01.values.uniIn, uvBar01.config.unitsIn, roundTo);
    
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
        y: ((uvBar01.canvas.height / 2) - (solarBar01.canvas.height * 0.8 / 2))
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
	uvBar01.canvas = document.getElementById(uvBar01.config.canvasID.toString());
	uvBar01.stage = new createjs.Stage(uvBar01.canvas);
    
    //Creates information tooltip
    new Opentip(uvBar01.canvas, "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpUV01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasUV01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasUV01();
    
    checkOffLoaded();
}