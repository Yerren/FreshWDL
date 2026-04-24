/*jslint plusplus: true, sloppy: true, indent: 4 */
// DataHelpers: prototype extensions and data-processing helpers extracted from
// the legacy WidgetsHandlers.js. Required by widgets and DataManager.
// Load after Globals.js and before any widget scripts.

// Map a number from one range to another (used throughout widgets).
Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

// Array equality, credit Tomas Zato @ stackoverflow.com/questions/7837456
if (Array.prototype.equals) {
    console.warn("Overriding existing Array.prototype.equals.");
}
Array.prototype.equals = function (array) {
    if (!array) { return false; }
    if (this.length !== array.length) { return false; }
    for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i])) { return false; }
        } else if (this[i] !== array[i]) {
            return false;
        }
    }
    return true;
};
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

// Returns [current, high, low] for a given extra temperature sensor input key.
function getExtraInput(inputVal) {
    var retVal = [-1, -1, -1];
    if (inputVal === "indoor") {
        retVal[0] = arrayClientraw[12];
        retVal[1] = arrayClientraw[128];
        retVal[2] = arrayClientraw[129];
    } else if (inputVal <= 6 && inputVal > 0) {
        retVal[0] = arrayClientraw[inputVal + 19];
        retVal[1] = arrayClientrawExtra[2 * inputVal + 592];
        retVal[2] = arrayClientrawExtra[2 * inputVal + 593];
    } else if (inputVal <= 8) {
        retVal[0] = arrayClientraw[inputVal + 113];
        retVal[1] = arrayClientrawExtra[2 * inputVal + 592];
        retVal[2] = arrayClientrawExtra[2 * inputVal + 593];
    } else {
        console.log("Error in extra temperature sensor input location.");
    }
    return retVal;
}

// Converts a string array of HH:mm timestamps into Moment objects anchored to
// the given day string. Handles 12-hour stations and day-boundary rollovers.
function formatTimestampsToMoments(dataArrayIn, dayIn, formatIn, stationNameTime) {
    var maxHour = -1, hr = -1, i, q;
    for (i = 0; i < dataArrayIn.length; i++) {
        hr = parseInt(dataArrayIn[i].split(":")[0], 10);
        if (hr > maxHour) { maxHour = hr; }
    }

    var pm = stationNameTime.split(":")[stationNameTime.split(":").length - 1].indexOf("PM");

    if (maxHour === 12) {
        var addTwelve = pm !== -1, splitData, justHour;
        for (i = 0; i < dataArrayIn.length; i++) {
            splitData = dataArrayIn[i].split(":");
            justHour = parseInt(splitData[0], 10);
            dataArrayIn[i] = ((justHour + (12 * addTwelve)) % 24).toString() + ":" + splitData[1];
            if (justHour === 12) { addTwelve = !addTwelve; }
        }
    }

    if (dayIn === "0") { dayIn = moment().format("DD"); }

    var returnArray = [];
    for (i = 0; i < dataArrayIn.length; i++) {
        returnArray.push(moment(dayIn + ":" + dataArrayIn[i], formatIn.toString()));
        if (i > 0 && returnArray[i] < returnArray[i - 1]) {
            for (q = 1; q <= i; q++) {
                returnArray[i - q].subtract(1, "days");
            }
        }
    }
    return returnArray;
}

// Moves the first element of an array to the last position.
function shiftArrayFtL(arrayIn) {
    var arrayOut = arrayIn.slice(),
        movedVal = arrayOut.shift();
    arrayOut.push(movedVal);
    return arrayOut;
}

// Reads one record entry (value + datetime) from arrayClientrawExtra.
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

// Populates a records dictionary from arrayClientrawExtra.
function processRecordsData(dictIn, startingIndex, startingIndex2) {
    dictIn[useDict("recordsHighTemp")]          = processRecord(startingIndex).concat(["temp"]);
    dictIn[useDict("recordsLowTemp")]           = processRecord(startingIndex + 6).concat(["temp"]);
    dictIn[useDict("recordsHighGust")]          = processRecord(startingIndex + 12).concat(["wind", ", " + arrayClientrawExtra[startingIndex + 78].toString() + "\xB0"]);
    dictIn[useDict("recordsHighRainRate")]      = processRecord(startingIndex + 18).concat(["rainfall", "/min"]);
    dictIn[useDict("recordsLowBaro")]           = processRecord(startingIndex + 24).concat(["pressure"]);
    dictIn[useDict("recordsHighBaro")]          = processRecord(startingIndex + 30).concat(["pressure"]);
    dictIn[useDict("recordsHighRainRateDaily")] = processRecord(startingIndex + 36).concat(["rainfall"]);
    dictIn[useDict("recordsHighRainRateHourly")]= processRecord(startingIndex + 42).concat(["rainfall"]);
    dictIn[useDict("recordsHighAverageWind")]   = processRecord(startingIndex + 48).concat(["wind", ", " + arrayClientrawExtra[startingIndex + 84].toString() + "\xB0"]);
    dictIn[useDict("recordsLowWindChill")]      = processRecord(startingIndex + 72).concat(["temp"]);
    dictIn[useDict("recordsWarmestDay")]        = processRecord(startingIndex + 90).concat(["temp"]);
    dictIn[useDict("recordsColdestNight")]      = processRecord(startingIndex + 96).concat(["temp"]);
    dictIn[useDict("recordsColdestDay")]        = processRecord(startingIndex + 102).concat(["temp"]);
    dictIn[useDict("recordsWarmestNight")]      = processRecord(startingIndex + 108).concat(["temp"]);
    dictIn[useDict("recordsHighHeatIndex")]     = processRecord(startingIndex + 114).concat(["temp"]);
    dictIn[useDict("recordsHighSolar")]         = processRecord(startingIndex2).concat(["solar"]);
    dictIn[useDict("recordsHighUV")]            = processRecord(startingIndex2 + 6).concat(["uv"]);
    dictIn[useDict("recordsHighDewPoint")]      = processRecord(startingIndex2 + 69).concat(["temp"]);
    dictIn[useDict("recordsLowDewPoint")]       = processRecord(startingIndex2 + 75).concat(["temp"]);
}

// Builds graphDict from the four clientraw arrays. Called by DataManager on each
// data update via global.processGraphData().
function processGraphData() {
    var i, p, q, pMax;

    graphDict["timestampHour"]        = [];
    graphDict["timestampDay"]         = [];
    graphDict["baroHours24"]          = [];
    graphDict["rainDays31"]           = [];
    graphDict["baroDays31"]           = [];
    graphDict["windSpeedDays31"]      = [];
    graphDict["windDirDays31"]        = [];
    graphDict["humidityDays31"]       = [];
    graphDict["tempHighDays31"]       = [];
    graphDict["tempLowDays31"]        = [];
    graphDict["tempMinutes60"]        = [];
    graphDict["solarMinutes60"]       = [];
    graphDict["rainMinutes60"]        = [];
    graphDict["baroMinutes60"]        = [];
    graphDict["windSpeedMinutes60"]   = [];
    graphDict["windGustMinutes60"]    = [];
    graphDict["windDirMinutes60"]     = [];
    graphDict["humidityMinutes60"]    = [];
    graphDict["timestampMinute"]      = [];
    graphDict["windSpeedHours24"]     = [];
    graphDict["tempHours24"]          = [];
    graphDict["rainHours24"]          = [];
    graphDict["solarHours24"]         = [];
    graphDict["uvHours24"]            = [];
    graphDict["windDirHours24"]       = [];
    graphDict["humidityHours24"]      = [];
    graphDict["tempQuarterDays28"]    = [];
    graphDict["baroQuarterDays28"]    = [];
    graphDict["humidityQuarterDays28"]= [];
    graphDict["windDirQuarterDays28"] = [];
    graphDict["windSpeedQuarterDays28"]= [];
    graphDict["solarQuarterDays28"]   = [];
    graphDict["uvQuarterDays28"]      = [];
    graphDict["timestampQuarterDay"]  = [];
    graphDict["rainDays7"]            = [];
    graphDict["timestampWeekDay"]     = [];
    graphDict["timestampMonth"]       = [];
    graphDict["rainMonths12"]         = [];

    // Weekly rainfall — divide by 10 for historical reasons
    for (i = 0; i < 7; i++) {
        graphDict["rainDays7"].push(arrayClientrawExtra[484 + i] / 10);
        graphDict["timestampWeekDay"].push(moment(arrayClientrawExtra[700], "DD").isoWeekday(i - 6));
    }
    pMax = moment(arrayClientrawExtra[700], "DD").isoWeekday() - 1;
    for (p = 0; p < pMax; p++) { graphDict["timestampWeekDay"][p].add(7, "days"); }
    for (q = 0; q < pMax; q++) {
        graphDict["timestampWeekDay"] = shiftArrayFtL(graphDict["timestampWeekDay"]);
        graphDict["rainDays7"]        = shiftArrayFtL(graphDict["rainDays7"]);
    }

    // Monthly rainfall
    for (i = 0; i < 12; i++) {
        graphDict["rainMonths12"].push(arrayClientrawDaily[187 + i]);
        graphDict["timestampMonth"].push(moment(arrayClientraw[36], "MM").month(i - 12));
    }
    pMax = moment(arrayClientraw[36], "MM").month();
    for (p = 0; p < pMax; p++) { graphDict["timestampMonth"][p].add(12, "M"); }
    for (q = 0; q < pMax; q++) {
        graphDict["timestampMonth"] = shiftArrayFtL(graphDict["timestampMonth"]);
        graphDict["rainMonths12"]   = shiftArrayFtL(graphDict["rainMonths12"]);
    }

    // 24-hour arrays (first 20 entries)
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
    // Remaining 4 entries in a separate block
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
    graphDict["timestampHour"] = formatTimestampsToMoments(
        graphDict["timestampHour"], arrayClientrawExtra[700], "DD:HH:mm", arrayClientraw[32]);

    // 31-day arrays
    for (i = 0; i < 31; i++) {
        graphDict["tempHighDays31"].push(arrayClientrawDaily[1 + i]);
        graphDict["tempLowDays31"].push(arrayClientrawDaily[32 + i]);
        graphDict["rainDays31"].push(arrayClientrawDaily[63 + i]);
        graphDict["baroDays31"].push(arrayClientrawDaily[94 + i]);
        graphDict["windSpeedDays31"].push(arrayClientrawDaily[125 + i]);
        graphDict["windDirDays31"].push(arrayClientrawDaily[156 + i]);
        graphDict["humidityDays31"].push(arrayClientrawDaily[199 + i]);
        graphDict["timestampDay"].push(moment(
            arrayClientrawDaily[232] + ":" + arrayClientrawDaily[230] + ":" + arrayClientrawDaily[231],
            "DD:HH:mm").subtract(31 - i, "days"));
    }

    // 60-minute arrays
    for (i = 0; i < 60; i++) {
        graphDict["tempMinutes60"].push(arrayClientrawHour[181 + i]);
        graphDict["solarMinutes60"].push(arrayClientrawHour[421 + i]);
        graphDict["rainMinutes60"].push(arrayClientrawHour[361 + i]);
        graphDict["baroMinutes60"].push(arrayClientrawHour[301 + i]);
        graphDict["windSpeedMinutes60"].push(arrayClientrawHour[1 + i]);
        graphDict["windGustMinutes60"].push(arrayClientrawHour[61 + i]);
        graphDict["windDirMinutes60"].push(arrayClientrawHour[121 + i]);
        graphDict["humidityMinutes60"].push(arrayClientrawHour[241 + i]);
        graphDict["timestampMinute"].push(moment(
            arrayClientraw[35] + ":" + arrayClientraw[29] + ":01", "DD:HH:mm").subtract(60 - i, "minutes"));
    }

    // 28 quarter-day arrays
    for (i = 0; i < 28; i++) {
        graphDict["tempQuarterDays28"].push(arrayClientrawDaily[233 + i]);
        graphDict["baroQuarterDays28"].push(arrayClientrawDaily[261 + i]);
        graphDict["humidityQuarterDays28"].push(arrayClientrawDaily[289 + i]);
        graphDict["windDirQuarterDays28"].push(arrayClientrawDaily[317 + i]);
        graphDict["windSpeedQuarterDays28"].push(arrayClientrawDaily[345 + i]);
        graphDict["solarQuarterDays28"].push(arrayClientrawDaily[373 + i]);
        graphDict["uvQuarterDays28"].push(arrayClientrawDaily[401 + i]);
        graphDict["timestampQuarterDay"].push(moment(
            arrayClientrawDaily[232] + ":00:00", "DD:HH:mm").subtract(168 - (i * 6), "hours"));
    }
}
