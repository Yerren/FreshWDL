/*jslint plusplus: true, sloppy: true, indent: 4 */

//Ajust these values to your liking.
var clientRawName = "clientraw.txt", //The names of your clientraw files
    clientRawExtraName = "clientrawextra.txt",
    clientRawHourName = "clientrawhour.txt",
    clientRawDailyName = "clientrawdaily.txt",
    customBaseURL = false, // Set the path to where your clientraw files are uploaded e.g., "http://www.goldenbaynzweather.info/wdl/" (note: final backslash and quotation marks must be included).
    currentUnits = { //Default units (what the page will display when first loaded)
        pressure: "hPa",        //Options: "hPa" "mmHG" "kPa" "inHg" "mb"
        altitude: "m",          //Options: "m" "yds" "ft"
        wind: "kmh",            //Options: "kmh" "mph" "kts" "ms" "mm" "inch"
        rainfall: "mm",         //Options: "mm" "inch"
        windDirection: "deg",   //Options: "deg" (only one)
        humidity: "percent",    //Options: "percent" (only one)
        solar: "Wm",            //Options: "Wm" (only one)
        uv: "noUnit",           //Options: no units for UV
        temp: "celsius"         //Options: "celsius" "fahrenheit"
    };
    