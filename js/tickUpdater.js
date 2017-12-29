/*jslint plusplus: true, sloppy: true, indent: 4 */
//Ticker frame updates
//Set the framerate (default 60) and set which function is called each frame (tickHandler)

function initializeTicker() {
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tickHandler);
}

function tickHandler(e) {
    //Updates every tick. Tells the stage to update, and the tweens (animations) to move to their next frame
    
    //Animated Widgets
    tempBar.stage.update();
    updateTweensTemp01();
    
    windchill01.stage.update();
    updateTweensWC01();
    
    windSpeed.stage.update();
    updateTweensWS01();
    
    humidityGauge.stage.update();
    updateTweensHum01();
    
    windGauge.stage.update();
    updateTweensWind01();
    
    uniBar01.stage.update();
    updateTweensUni01();
    
    uniBar02.stage.update();
    updateTweensUni02();
    
    uniBar03.stage.update();
    updateTweensUni03();
    
    solarBar01.stage.update();
    updateTweensSol01();
    
    uvBar01.stage.update();
    updateTweensUV01();
    
    status01.stage.update();
    updateTweensS01();
    
    //Non Animated Widgets
    moonSun01.stage.update();
    barometer01.stage.update();
    apparent01.stage.update();
    titleRainfall01.stage.update();
}