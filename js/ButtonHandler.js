/*jslint plusplus: true, sloppy: true, indent: 4 */
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

function initialzeButtons() {
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