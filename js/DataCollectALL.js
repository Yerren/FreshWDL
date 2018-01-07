/*jslint plusplus: true, sloppy: true, indent: 4 */

var arrayClientraw = [],
	arrayClientrawExtra = [],
	arrayClientrawHour = [],
	arrayClientrawDaily = [],
    arrayClientrawOld = [],
	arrayClientrawExtraOld = [],
	arrayClientrawHourOld = [],
	arrayClientrawDailyOld = [],
    graphDict = {},
    recordsDict = [{}, {}, {}],
    doneCR,
    doneCRE,
    doneCRH,
    doneCRD,
    attemptedCR,
    attemptedCRE,
    attemptedCRH,
    attemptedCRD,
    noDataChanged = false,
	baseURL = window.location.href,
	to = baseURL.lastIndexOf("/"),
    loaded = null,
    firstTime = true;

//Helper Functions
function formatTimestampsToMoments(dataArrayIn, dayIn, formatIn) {
    //Formats timestamp Array to Moments
    var returnArray = [];
    for (i = 0; i < dataArrayIn.length; i++) {
        returnArray.push(moment(dayIn + ":" + dataArrayIn[i], formatIn.toString()));
        //fix day changes
        if (i > 0 && returnArray[i] < returnArray[i - 1]) {
            for (q = 1; q <= i; q++) {
                returnArray[i - q].subtract(1, "days");
            }
        }
    }
    return returnArray;
}

function shiftArrayFtL(arrayIn) {
    //moves the first value in the array to the last place
    var arrayOut = arrayIn.slice(),
        movedVal = arrayOut.shift();
    arrayOut.push(movedVal);
    return arrayOut;
}

//Proccesses Base URL
to = to === -1 ? baseURL.length : to + 1;
baseURL = baseURL.substring(0, to);

//Array comparison, credit to Tomas Zato @ https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript.
// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


//INFORMATION GATHERING SECTION

function processRecord(startingIndex) {
    var value = arrayClientrawExtra[startingIndex],
        input = "";
    
    input += arrayClientrawExtra[startingIndex + 1].toString() + ":";
    input += arrayClientrawExtra[startingIndex + 2].toString() + " ";
    input += arrayClientrawExtra[startingIndex + 3].toString();
    input += arrayClientrawExtra[startingIndex + 4].toString();
    input += arrayClientrawExtra[startingIndex + 5].toString();
    
    return [value, moment(input, "HH:mm DDMMYYYY")];
}

function processRecordsData(dictIn, startingIndex, startingIndex2) {
    dictIn["Highest temperature"] = processRecord(startingIndex).concat(["temp"]);
    dictIn["Lowest temperature"] = processRecord(startingIndex + 6).concat(["temp"]);
    dictIn["Highest gust"] = processRecord(startingIndex + 12).concat(["wind", ", " + arrayClientrawExtra[startingIndex + 78].toString() + "\xB0"]);
    dictIn["Highest rain rate"] = processRecord(startingIndex + 18).concat(["rainfall", "/min"]);
    dictIn["Lowest barometer"] = processRecord(startingIndex + 24).concat(["pressure"]);
    dictIn["Highest barometer"] = processRecord(startingIndex + 30).concat(["pressure"]);
    dictIn["Highest daily rainfall"] = processRecord(startingIndex + 36).concat(["rainfall"]);
    dictIn["Highest hourly rainfall"] = processRecord(startingIndex + 42).concat(["rainfall"]);
    dictIn["Highest average wind speed"] = processRecord(startingIndex + 48).concat(["wind", ", " + arrayClientrawExtra[startingIndex + 84].toString() + "\xB0"]);
    dictIn["Lowest wind chill"] = processRecord(startingIndex + 72).concat(["temp"]);
    dictIn["Warmest day"] = processRecord(startingIndex + 90).concat(["temp"]);
    dictIn["Coldest night"] = processRecord(startingIndex + 96).concat(["temp"]);
    dictIn["Coldest day"] = processRecord(startingIndex + 102).concat(["temp"]);
    dictIn["Warmest night"] = processRecord(startingIndex + 108).concat(["temp"]);
    dictIn["Highest heat index"] = processRecord(startingIndex + 114).concat(["temp"]);
    dictIn["Highest solar"] = processRecord(startingIndex2).concat(["solar"]);
    dictIn["Highest uv index"] = processRecord(startingIndex2 + 6).concat(["uv"]);
    dictIn["Highest dew point"] = processRecord(startingIndex2 + 69).concat(["temp"]);
    dictIn["Lowest dew point"] = processRecord(startingIndex2 + 75).concat(["temp"]);
}

function processGraphData() {
    //Process data for graphs into dictionary
    graphDict["timestampHour"] = [];
    graphDict["timestampDay"] = [];
    graphDict["baroHours24"] = [];
    graphDict["rainDays31"] = [];
    graphDict["baroDays31"] = [];
    graphDict["windSpeedDays31"] = [];
    graphDict["windDirDays31"] = [];
    graphDict["humidityDays31"] = [];
    graphDict["tempHighDays31"] = [];
    graphDict["tempLowDays31"] = [];
    graphDict["tempMinutes60"] = [];
    graphDict["solarMinutes60"] = [];
    graphDict["rainMinutes60"] = [];
    graphDict["baroMinutes60"] = [];
    graphDict["windSpeedMinutes60"] = [];
    graphDict["windGustMinutes60"] = [];
    graphDict["windDirMinutes60"] = [];
    graphDict["humidityMinutes60"] = [];
    graphDict["timestampMinute"] = [];
    graphDict["windSpeedHours24"] = [];
    graphDict["tempHours24"] = [];
    graphDict["rainHours24"] = [];
    graphDict["solarHours24"] = [];
    graphDict["uvHours24"] = [];
    graphDict["windDirHours24"] = [];
    graphDict["humidityHours24"] = [];
    graphDict["tempQuarterDays28"] = [];
    graphDict["baroQuarterDays28"] = [];
    graphDict["humidityQuarterDays28"] = [];
    graphDict["windDirQuarterDays28"] = [];
    graphDict["windSpeedQuarterDays28"] = [];
    graphDict["solarQuarterDays28"] = [];
    graphDict["uvQuarterDays28"] = [];
    graphDict["timestampQuarterDay"] = [];
    graphDict["rainDays7"] = [];
    graphDict["timestampWeekDay"] = [];
    graphDict["timestampMonth"] = [];
    graphDict["rainMonths12"] = [];
    
    
    //Different rainfall arrays (Bar Graphs)
    //Rainfall per week day - divide by ten for "historical Reasons"
    for (i = 0; i < 7; i++) {
        graphDict["rainDays7"].push(arrayClientrawExtra[484 + i] / 10);
        graphDict["timestampWeekDay"].push(moment(arrayClientrawExtra[700], "DD").day(i - 6));
    }
    
    //sort weekly rain dict into correct order; (p + 1) is day index
    var pMax = 0
    for (p = 0; p + 1 < moment(arrayClientrawExtra[700], "DD").day(); p++) {
        graphDict["timestampWeekDay"][p].add(7, "days");
        pMax = p
    }
    for (q = 0; q <= pMax; q++) {
        graphDict["timestampWeekDay"] = shiftArrayFtL(graphDict["timestampWeekDay"]);
        graphDict["rainDays7"] = shiftArrayFtL(graphDict["rainDays7"]);
    }   
    
    //Rainfall total per month
    for (i = 0; i < 12; i++) {
        graphDict["rainMonths12"].push(arrayClientrawDaily[187 + i]);
        graphDict["timestampMonth"].push(moment(arrayClientraw[36], "MM").month(i - 12));
    }
    
    //sort monthly rain dict into correct order;
    for (p = 0; p < 3; p++) {
        graphDict["timestampMonth"][p].add(12, "M");
        pMax = p
    }
    for (q = 0; q <= pMax; q++) {
        graphDict["timestampMonth"] = shiftArrayFtL(graphDict["timestampMonth"]);
        graphDict["rainMonths12"] = shiftArrayFtL(graphDict["rainMonths12"]);
    }
    
    //24 Hour arrays
    for (i = 0; i < 20; i++) {
        graphDict["windSpeedHours24"].push(arrayClientrawExtra[1 + i]);
        graphDict["tempHours24"].push(arrayClientrawExtra[21 + i]);
        graphDict["rainHours24"].push(arrayClientrawExtra[41 + i]);
        graphDict["solarHours24"].push(arrayClientrawExtra[491 + i]);
        graphDict["uvHours24"].push(arrayClientrawExtra[511 + i]);
        graphDict["windDirHours24"].push(arrayClientrawExtra[536 + i]);
        graphDict["humidityHours24"].push(arrayClientrawExtra[611 + i]);
        graphDict["baroHours24"].push(arrayClientrawExtra[439 + i]);
        graphDict["timestampHour"].push(arrayClientrawExtra[459 + i]);
    }
    //Split into two sections for some reason?
    for (i = 0; i < 4; i++) {
        graphDict["windSpeedHours24"].push(arrayClientrawExtra[562 + i]);
        graphDict["tempHours24"].push(arrayClientrawExtra[566 + i]);
        graphDict["rainHours24"].push(arrayClientrawExtra[570 + i]);
        graphDict["solarHours24"].push(arrayClientrawExtra[582 + i]);
        graphDict["uvHours24"].push(arrayClientrawExtra[586 + i]);
        graphDict["windDirHours24"].push(arrayClientrawExtra[590 + i]);
        graphDict["humidityHours24"].push(arrayClientrawExtra[630 + i]);
        graphDict["baroHours24"].push(arrayClientrawExtra[574 + i]);
        graphDict["timestampHour"].push(arrayClientrawExtra[578 + i]);
    }
    graphDict["timestampHour"] = formatTimestampsToMoments(graphDict["timestampHour"], arrayClientrawExtra[700], "DD:HH:mm");
    
    //31 day arrays
    for (i = 0; i < 31; i++) {
        graphDict["tempHighDays31"].push(arrayClientrawDaily[1 + i]);
        graphDict["tempLowDays31"].push(arrayClientrawDaily[32 + i]);
        graphDict["rainDays31"].push(arrayClientrawDaily[63 + i]);
        graphDict["baroDays31"].push(arrayClientrawDaily[94 + i]);
        graphDict["windSpeedDays31"].push(arrayClientrawDaily[125 + i]);
        graphDict["windDirDays31"].push(arrayClientrawDaily[156 + i]);
        graphDict["humidityDays31"].push(arrayClientrawDaily[199 + i]);
        graphDict["timestampDay"].push(moment(arrayClientrawDaily[232] + ":" + arrayClientrawDaily[230] + ":" + arrayClientrawDaily[231], "DD:HH:mm").subtract(31 - i, "days"));
    }
    
    //60 minute arrays
    for (i = 0; i < 60; i++) {
        graphDict["tempMinutes60"].push(arrayClientrawHour[181 + i]);
        graphDict["solarMinutes60"].push(arrayClientrawHour[421 + i]);
        graphDict["rainMinutes60"].push(arrayClientrawHour[361 + i]);
        graphDict["baroMinutes60"].push(arrayClientrawHour[301 + i]);
        graphDict["windSpeedMinutes60"].push(arrayClientrawHour[1 + i]);
        graphDict["windGustMinutes60"].push(arrayClientrawHour[61 + i]);
        graphDict["windDirMinutes60"].push(arrayClientrawHour[121 + i]);
        graphDict["humidityMinutes60"].push(arrayClientrawHour[241 + i]);
        graphDict["timestampMinute"].push(moment(arrayClientraw[35] + ":" + arrayClientraw[29] + ":01", "DD:HH:mm").subtract(60 - i, "minutes"));
    }
    
    //28 quarter date arrays
    for (i = 0; i < 28; i++) {
        graphDict["tempQuarterDays28"].push(arrayClientrawDaily[233 + i]);
        graphDict["baroQuarterDays28"].push(arrayClientrawDaily[261 + i]);
        graphDict["humidityQuarterDays28"].push(arrayClientrawDaily[289 + i]);
        graphDict["windDirQuarterDays28"].push(arrayClientrawDaily[317 + i]);
        graphDict["windSpeedQuarterDays28"].push(arrayClientrawDaily[345 + i]);
        graphDict["solarQuarterDays28"].push(arrayClientrawDaily[373 + i]);
        graphDict["uvQuarterDays28"].push(arrayClientrawDaily[401 + i]);
        graphDict["timestampQuarterDay"].push(moment(arrayClientrawDaily[232] + ":00:00", "DD:HH:mm").subtract(168 - (i * 6), "hours"));
    }
}

function tryUpdateWidgets() {
    
    if (loaded == true) {
        //check if all are done
        if ((doneCR === true && doneCRE === true && doneCRH === true && doneCRD === true) || (attemptedCR === true && attemptedCRE === true && attemptedCRH === true && attemptedCRD === true && firstTime === false)) {
            doneCR = doneCRE = doneCRH = doneCRD = attemptedCR = attemptedCRE = attemptedCRH = attemptedCRD = false;
            
            if (arrayClientraw.equals(arrayClientrawOld) === true && arrayClientrawExtra.equals(arrayClientrawExtraOld) === true && arrayClientrawDaily.equals(arrayClientrawDailyOld) === true && arrayClientrawHour.equals(arrayClientrawHourOld) === true) {
                noDataChanged = true;
                
                drawStatusS01(arrayClientraw[49]); //Status widget must always be updated
            } else {
                noDataChanged = false;
                
                drawStatusS01(arrayClientraw[49]); //Status widget must always be updated
                
                if (arrayClientraw.equals(arrayClientrawOld) === false) {
                    drawHumidityGaugeHum01(arrayClientraw[5]);
                    drawTemperatureBarTemp01(arrayClientraw[4], arrayClientraw[46], arrayClientraw[47]);
                    drawUniratureBarUni01(arrayClientraw[7]);
                    drawUniratureBarUni02(arrayClientraw[8]);
                    drawUniratureBarUni03(arrayClientraw[9]);
                    drawWindGaugeWind01(arrayClientraw[3], arrayClientraw[117]);
                    drawSpeedBarWS01(arrayClientraw[1], arrayClientraw[2], arrayClientraw[113], arrayClientraw[71]);
                    drawWindchillBarWC01(arrayClientraw[44], arrayClientraw[77], arrayClientraw[78]);
                    drawUVBarUV01(arrayClientraw[79]);
                    drawBarometerB01(arrayClientraw[6], arrayClientraw[50]);
                    drawApparentA01(arrayClientraw[130]);
                }
                if (arrayClientrawExtra.equals(arrayClientrawExtraOld) === false) {
                    processRecordsData(recordsDict[2], 313, 684);
                    processRecordsData(recordsDict[1], 187, 672);
                    processRecordsData(recordsDict[0], 61, 660);
                    updateValuesRe01();
                    formatAndDisplayForecastFor01(arrayClientrawExtra[531]);
                    drawMoonSunMS01(arrayClientrawExtra[556], arrayClientrawExtra[557], arrayClientrawExtra[558], arrayClientrawExtra[559], arrayClientrawExtra[560], arrayClientrawExtra[561]);
                }
                if (arrayClientrawDaily.equals(arrayClientrawDailyOld) === false) {

                }
                if (arrayClientrawHour.equals(arrayClientrawHourOld) === false) {

                }
                if (arrayClientraw.equals(arrayClientrawOld) === false || arrayClientrawExtra.equals(arrayClientrawExtraOld) === false) {
                    drawSolarBarSol01(arrayClientraw[34], arrayClientraw[127], arrayClientrawExtra[696]);
                }

                arrayClientrawOld = arrayClientraw;
                arrayClientrawExtraOld = arrayClientrawExtra;
                arrayClientrawDailyOld = arrayClientrawDaily;
                arrayClientrawHourOld = arrayClientrawHour;

                processGraphData();
                configureGraphRainBar01("rainfallBar", "dailyMonth");
                configureGraphTempLine01("temp", "hourlyDay");
                configureGraphWindLine01("windSpeed", "hourlyDay");
                configureGraphBaroLine01("barometer", "hourlyDay");
                configureGraph(modalGraph.currentGraph[0], modalGraph.currentGraph[1]);
            }
            
            //If it is the first time here, clear loading screen
            if (firstTime === true) {
                firstTime = false;
                loadingFinished();
            }
            
        }
    }
}

function loadArray(url) {
	//Gets data from Clientraw files
	var xhttpVar;
	
	if (window.XMLHttpRequest) {
		// code for modern browsers
		xhttpVar = new XMLHttpRequest();
    } else {
		// code for IE6, IE5
		xhttpVar = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xhttpVar.open("GET", url, true);
    xhttpVar.setRequestHeader("Cache-Control", "no-cache");
    xhttpVar.send();
	
	return xhttpVar;
}

function updateClientraw() {
	//updates the Clientraw Array with data from server
    var xhttpCR;
    xhttpCR = loadArray(baseURL + clientRawName);
    
    xhttpCR.onreadystatechange = function () {
        if (xhttpCR.readyState === 4) {
            if (xhttpCR.status === 200) {
                dataCollectErrorCR = false;
                arrayClientraw = xhttpCR.responseText.toString().split(" ");
                doneCR = true;
            } else {
                dataCollectErrorCR = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCR = true;

}

function updateClientrawExtra() {
	//updates the Clientraw Extra Array with data from server
	
	var xhttpCRE;
	xhttpCRE = loadArray(baseURL + clientRawExtraName);
	
    xhttpCRE.onreadystatechange = function () {
        if (xhttpCRE.readyState === 4) {
            if (xhttpCRE.status === 200) {
                dataCollectErrorCRE = false;
                arrayClientrawExtra = xhttpCRE.responseText.toString().split(" ");
                doneCRE = true;
            } else {
                dataCollectErrorCRE = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCRE = true;
}

function updateClientrawHour() {
	//updates the Clientraw Hour Array with data from server
	
	var xhttpCRH;
	xhttpCRH = loadArray(baseURL + clientRawHourName);
    
    xhttpCRH.onreadystatechange = function () {
        if (xhttpCRH.readyState === 4) {
            if (xhttpCRH.status === 200) {
                dataCollectErrorCRH = false;
                arrayClientrawHour = xhttpCRH.responseText.toString().split(" ");
                doneCRH = true;
            } else {
                dataCollectErrorCRH = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCRH = true;
}

function updateClientrawDaily() {
	//updates the Clientraw Daily Array with data from server
	
	var xhttpCRD;
	xhttpCRD = loadArray(baseURL + clientRawDailyName);
    
    xhttpCRD.onreadystatechange = function () {
        if (xhttpCRD.readyState === 4) {
            if (xhttpCRD.status === 200) {
                dataCollectErrorCRD = false;
                arrayClientrawDaily = xhttpCRD.responseText.toString().split(" ");
                doneCRD = true;
            } else {
                dataCollectErrorCRD = true;
            }
            tryUpdateWidgets();
        }
    };
    attemptedCRD = true;
}

//Set intervals for updates of each clientraw array
var intervalJobCR = null;
var intervalJobCRE = null;
var intervalJobCRH = null;
var intervalJobCRD = null;

updateClientraw();
updateClientrawExtra();
updateClientrawHour();
updateClientrawDaily();
intervalJobCR = setInterval(updateClientraw, 5000);
intervalJobCRE = setInterval(updateClientrawExtra, 5000);
intervalJobCRH = setInterval(updateClientrawHour, 5000);
intervalJobCRD = setInterval(updateClientrawDaily, 5000);