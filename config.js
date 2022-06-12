/*jslint plusplus: true, sloppy: true, indent: 4 */

//Ajust these values to your liking.
var clientRawName = "clientraw.txt", //The names of your clientraw files
    clientRawExtraName = "clientrawextra.txt",
    clientRawHourName = "clientrawhour.txt",
    clientRawDailyName = "clientrawdaily.txt",
    customBaseURL = false, // OPTIONAL: Set the path to where your clientraw files are uploaded e.g., "http://www.goldenbaynzweather.info/wdl/" (note: final backslash and quotation marks must be included). Otherwise leave as: false
    lang = "en", //Set Language. To see what lanuages are currently supported, see the readme file at: https://github.com/Yerren/FreshWDL/blob/master/README.md
    currentUnits = { //Default units (what the page will display when first loaded)
        pressure: "hPa",        //Options: "hPa" "mmHG" "kPa" "inHg" "mb"
        altitude: "m",          //Options: "m" "yds" "ft"
        wind: "kmh",            //Options: "kmh" "mph" "kts" "ms" "mm" "inch" "B" (Beaufort)
        rainfall: "mm",         //Options: "mm" "inch"
        windDirection: "deg",   //Options: "deg" (only one)
        humidity: "percent",    //Options: "percent" (only one)
        solar: "Wm",            //Options: "Wm" (only one)
        uv: "noUnit",           //Options: no units for UV
        temp: "celsius"         //Options: "celsius" "fahrenheit"
    },
    gaugeSettings = { //Gauges: apparent temperature barometer windChill graphHandlerBarometer graphHandlerRainfall graphHandlerTemperature graphHandlerWindSpeed humidity moonSun solar status rainfallTitle rainfallDay rainfallMonth rainfallYear UV windDirection windSpeed
        solar: {
            enabled: true
        },
        UV: {
            enabled: true
        },
        windChill: {
            mode: "windchill", //The default mode, either "heatIndex" or "windchill" (note: lowercase c)
            autoSwitch: true //If true, will switch between heat index/wind chill depending on what is appropriate.
        },
        windSpeed: {
            enabled: true, 
            gustMode: "current" //Set to "current" for the gust to display the current windspeed, or to "max" for it to display the maximum windspeed in the last 60 seconds.
        }
    },
    graphSettings = {
        barometer: {enabled: true},
        humidity: {enabled: true},
        solar: {enabled: true},
        temp: {enabled: true},
        uv: {enabled: true},
        windDir: {enabled: true},
        windSpeed: {enabled: true},
        rainfall: {enabled: true}
    };