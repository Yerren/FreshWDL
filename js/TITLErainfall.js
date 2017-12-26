/*jslint plusplus: true, sloppy: true, indent: 4 */

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
	titleRainfall01.canvas = document.getElementById(titleRainfall01.config.canvasID.toString());
	titleRainfall01.stage = new createjs.Stage(titleRainfall01.canvas);
    
    //Creates information tooltip
    //new Opentip(titleRainfall01.canvas, "Perceived temperature based on temperature, humidity, sun, and wind.",  { background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
    
	//Set up shapes: intitializes all the variables and makes it so they can be adjusted later by storing their commands.
	setUpTR01();
	
	//If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeCanvasTR01();
		}, false);
	}
	
    //Set the canvas size intially.
	resizeCanvasTR01();
    
    checkOffLoaded();
}