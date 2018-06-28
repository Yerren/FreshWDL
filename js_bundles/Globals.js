/*jslint plusplus: true, sloppy: true, indent: 4 */

//Check to see if a langauge was set in the config file, if it isn't, set to default (English).
if (typeof lang === "undefined") {
    lang = "en";
}

//Set Moment.js Langauge
moment.locale(lang);

//Dictionary
var dict = {
    apparentTitle: {
        en: "Apparent"
    },
    apparentDescription: {
        en: "Perceived temperature based on temperature, humidity, sun, and wind."
    },
    temperatureTitle: {
        en: "Temperature"
    },
    temperatureDescription: {
        en: "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature."
    },
    barometerSteady: {
        en: "Steady"
    },
    barometerRate: {
        en: "Rate"
    },
    barometerTitle: {
        en: "Barometer"
    },
    barometerDescription: {
        en: "The weight of the air, adjusted for the station's altitude."
    },
    windchillTitle: {
        en: "Windchill"
    },
    windchillDescription: {
        en: "How cold it actually feels. Calculated by combining heat and wind speed."
    },
    humidityTitle: {
        en: "Humidity"
    },
    humidityDescription: {
        en: "The amount of water vapour in the air as a percentage of the amount the air is capable of holding."
    },
    moonSunRise: {
        en: "Rise"
    },
    moonSunSet: {
        en: "Set"
    },
    moonSunPhase: {
        en: "Phase"
    },
    moonSunAge: {
        en: "Age"
    },
    moonSunTitleSun: {
        en: "Sun"
    },
    moonSunTitleMoon: {
        en: "Moon"
    },
    solarTitle: {
        en: "Solar"
    },
    solarSunHours: {
        en: "Sun Hours"
    },
    solarDescription: {
        en: "The intensity of the sun's radiation."
    },
    statusNoDataSince: {
        en: "No data since"
    },
    statusDataAt: {
        en: "Latest data received at"
    },
    statusDescription: {
        en: "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server."
    },
    rainfallTitle: {
        en: "Rainfall"
    },
    rainfallDailyTitle: {
        en: "Daily"
    },
    rainfallMonthlyTitle: {
        en: "Monthly"
    },
    rainfallAnnualTitle: {
        en: "Annual"
    },
    uvTitle: {
        en: "UV"
    },
    uvDescription: {
        en:  "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high."
    },
    windDirectionLabelN: {
        en: "N"
    },
    windDirectionLabelNE: {
        en: "NE"
    },
    windDirectionLabelE: {
        en: "E"
    },
    windDirectionLabelSE: {
        en: "SE"
    },
    windDirectionLabelS: {
        en: "S"
    },
    windDirectionLabelSW: {
        en: "SW"
    },
    windDirectionLabelW: {
        en: "W"
    },
    windDirectionLabelNW: {
        en: "NW"
    },
    windDirectionDescription: {
        en: "The wind direction. Green arrow indicates average wind direction."
    },
    windSpeedMax: {
        en: "max"
    },
    windSpeedTitle: {
        en: "Wind Speed"
    },
    windSpeedWind: {
        en: "Wind"
    },
    windSpeedGust: {
        en: "Gust"
    },
    windSpeedAverage: {
        en: "Average"
    },
    windSpeedDescription: {
        en: "Green bar indicates average wind speed.\nPurple bar indicates gust speed."
    },
    recordsHighTemp: {
        en: "Highest temperature"
    },
    recordsLowTemp: {
        en: "Lowest temperature"
    },
    recordsHighGust: {
        en: "Highest gust"
    },
    recordsHighRainRate: {
        en: "Highest rain rate"
    },
    recordsLowBaro: {
        en: "Lowest barometer"
    },
    recordsHighBaro: {
        en: "Highest barometer"
    },
    recordsHighRainRateDaily: {
        en: "Highest daily rainfall"
    },
    recordsHighRainRateHourly: {
        en: "Highest hourly rainfall"
    },
    recordsHighAverageWind: {
        en: "Highest average wind speed"
    },
    recordsLowWindChill: {
        en: "Lowest wind chill"
    },
    recordsWarmestDay: {
        en: "Warmest day"
    },
    recordsColdestNight: {
        en: "Coldest night"
    },
    recordsColdestDay: {
        en: "Coldest day"
    },
    recordsWarmestNight: {
        en: "Warmest night"
    },
    recordsHighHeatIndex: {
        en: "Highest heat index"
    },
    recordsHighSolar: {
        en: "Highest solar"
    },
    recordsHighUV: {
        en: "Highest uv index"
    },
    recordsHighDewPoint: {
        en: "Highest dew point"
    },
    recordsLowDewPoint: {
        en: "Lowest dew point"
    },
    forcastShowMore: {
        en: "Show More"
    },
    graphMax: {
        en: "Max"
    },
    graphMin: {
        en: "Min"
    },
    graphLast: {        //NOTE: these are used as in: Last XX days, or Last XX Hours, etc.
        en: "Last"
    },
    graphDays: {
        en: "Days"
    },
    graphHours: {
        en: "Hours"
    },
    graphHour: {
        en: "Hour"
    },
    graphMonths: {
        en: "Months"
    },
    graphYears: {
        en: "Years"
    },
    graphBaroLabel: {
        en: "Pressure"
    },
    graphHumidityLabel: {
        en: "Percent"
    },
    graphSolarLabel: {
        en: "Irradiance"
    },
    graphLabelUV: {
        en: "Index"
    },
    graphLabelWindDirection: {
        en: "Wind Direction"
    },
    buttonLabelGraphs: {
        en: "Graphs"
    },
    buttonLabelRecords: {
        en: "Records"
    },
    buttonLabelAltitude: {
        en: "Altitude"
    },
    recordsForMonth: {
        en: "Records for this month"
    },
    recordsForYear: {
        en: "Records for this year"
    },
    recordsAllTime: {
        en: "All time records"
    },
    forecastTitle: {
        en: "Forecast"
    }
};

//Fetch string from dictionary
function useDict(wordIn) {
    //If the word doesn't exist (incorrect wordIn), return an error
    if(typeof dict[wordIn] === "undefined") {
        console.error("WORD NOT FOUND IN DICTIONARY");
        return " ";
    }
    
    //If the word doesn't exist in dictionary file for a given langauge, return it in the default langauge (English)
    if(typeof dict[wordIn][lang] === "undefined") {
        console.log("WORD NOT FOUND IN LANGUAGE. DEFAULTING TO ENGLISH");
        return dict[wordIn]["en"];
    }
    return dict[wordIn][lang];
}

//Sets GLOBAL variables
//Customizables
var globalFontFamily = "Arial", //The font used throughout the page
    colour = {
        barometer: "40, 104, 206",
        rainfall: "0, 71, 183",
        wind: "23, 145, 27",
        windGust: "188, 0, 255",
        humidity: "16, 217, 244",
        solar: "245, 193, 18",
        temp: "209, 32, 32",
        tempLow: "0, 50, 200",
        uv: "234, 242, 45"
    },
    graphStyles = { //The Styles for each graph
        barometer: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.barometer + ", 0.4)",
            borderColor: "rgba(" + colour.barometer + ", 0.8)",
            pointBorderColor: "rgba(" + colour.barometer + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.barometer + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.barometer + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.barometer + ", 0.6)"
        },
        rainfallLine: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.rainfall + ", 0.4)",
            borderColor: "rgba(" + colour.rainfall + ", 0.8)",
            pointBorderColor: "rgba(" + colour.rainfall + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.rainfall + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.rainfall + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.rainfall + ", 0.6)"
        },
        rainfallBar: {
            label: null,
            data: null,
            backgroundColor: "rgba(" + colour.rainfall + ", 0.4)",
            borderColor: "rgba(" + colour.rainfall + ", 0.8)",
            borderWidth: 2
        },
        wind: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.wind + ", 0.4)",
            borderColor: "rgba(" + colour.wind + ", 0.8)",
            pointBorderColor: "rgba(" + colour.wind + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.wind + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.wind + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.wind + ", 0.6)"
        },
        windGust: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.windGust + ", 0.4)",
            borderColor: "rgba(" + colour.windGust + ", 0.8)",
            pointBorderColor: "rgba(" + colour.windGust + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.windGust + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.windGust + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.windGust + ", 0.6)"
        },
        humidity: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.humidity + ", 0.4)",
            borderColor: "rgba(" + colour.humidity + ", 0.8)",
            pointBorderColor: "rgba(" + colour.humidity + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.humidity + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.humidity + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.humidity + ", 0.6)"
        },
        solar: {
            label: null,
            data: {x: 0, y: null},
            fill: true,
            backgroundColor: "rgba(" + colour.solar + ", 0.4)",
            borderColor: "rgba(" + colour.solar + ", 0.8)",
            pointBorderColor: "rgba(" + colour.solar + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.solar + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.solar + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.solar + ", 0.6)"
        },
        tempHigh: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.temp + ", 0.4)",
            borderColor: "rgba(" + colour.temp + ", 0.8)",
            pointBorderColor: "rgba(" + colour.temp + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.temp + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.temp + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.temp + ", 0.6)"
        },
        tempLow: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.tempLow + ", 0.4)",
            borderColor: "rgba(" + colour.tempLow + ", 0.8)",
            pointBorderColor: "rgba(" + colour.tempLow + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.tempLow + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.tempLow + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.tempLow + ", 0.6)"
        },
        uv: {
            label: null,
            data: {x: 0, y: null},
            fill: true,
            backgroundColor: "rgba(" + colour.uv + ", 0.4)",
            borderColor: "rgba(" + colour.uv + ", 0.8)",
            pointBorderColor: "rgba(" + colour.uv + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.uv + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.uv + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.uv + ", 0.6)"
        }
    },
    graphDict = {};

//All graphs (to be included in drop down modal menu) and their properties
var globalGraphs = {
    barometer: {
        label: useDict("graphBaroLabel"),
        unit: "pressure",
        style: "barometer",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            dailyMonth: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["baroDays31"],
                timeDisplay: "day",
                legendOptions: {}
            },
            hourlyDay: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["baroHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["baroQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["baroMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    humidity: {
        label: useDict("graphHumidityLabel"),
        unit: "humidity",
        style: "humidity",
        graphType: "line",
        tickOptions: {
            beginAtZero: true,
            min: 0,
            max: 100
        },
        graphs: {
            dailyMonth: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["humidityDays31"],
                timeDisplay: "day",
                legendOptions: {}
            },
            hourlyDay: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["humidityHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["humidityQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["humidityMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    solar: {
        label: useDict("graphSolarLabel"),
        unit: "solar",
        style: "solar",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            hourlyDay: {
                title: useDict("solarTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["solarHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("solarTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["solarQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("solarTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["solarMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    temp: {
        label: useDict("temperatureTitle"),
        unit: "temp",
        style: "tempHigh",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            dailyMonth: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["tempHighDays31", "tempLowDays31"],
                timeDisplay: "day",
                additionalStyles: ["tempLow"],
                legendLabels: [useDict("graphMax"), useDict("graphMin")],
                legendOptions: {
                    display: true
                }
            },
            hourlyDay: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["tempHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["tempQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["tempMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    uv: {
        label: useDict("graphLabelUV"),
        unit: "uv",
        style: "uv",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            hourlyDay: {
                title: useDict("uvTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["uvHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("uvTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["uvQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            }
        }
    },
    windDir: {
        label: useDict("graphLabelWindDirection"),
        unit: "windDirection",
        style: "wind",
        graphType: "line",
        tickOptions: {
            beginAtZero: true,
            min: 0,
            max: 360,
            stepSize: 90
        },
        graphs: {
            dailyMonth: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["windDirDays31"],
                timeDisplay: "day",
                legendOptions: {}
                
            },
            hourlyDay: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["windDirHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["windDirQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["windDirMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    windSpeed: {
        label: useDict("windSpeedTitle"),
        unit: "wind",
        style: "wind",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            dailyMonth: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["windSpeedDays31"],
                timeDisplay: "day",
                legendOptions: {}
            },
            hourlyDay: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["windSpeedHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["windSpeedQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["windSpeedMinutes60", "windGustMinutes60"],
                timeDisplay: "minute",
                additionalStyles: ["windGust"],
                legendLabels: [useDict("windSpeedAverage"), useDict("windSpeedGust")],
                legendOptions: {
                    display: true
                }
            }
        }
    },
    rainfallLine: {
        label: useDict("rainfallTitle"),
        unit: "rainfall",
        style: "rainfallLine",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            hourlyDay: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["rainHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["rainMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    rainfallBar: {
        label: useDict("rainfallTitle"),
        unit: "rainfall",
        style: "rainfallBar",
        graphType: "bar",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            dailyMonth: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: "rainDays31",
                timeDisplay: "MMM D",
                legendOptions: {}
            },
            monthlyYear: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "12" +  " " + useDict("graphMonths"),
                timestamp: "timestampMonth",
                data: "rainMonths12",
                timeDisplay: "MMM YYYY",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampWeekDay",
                data: "rainDays7",
                timeDisplay: "ddd",
                legendOptions: {}
            }
        }
    }
};

//Widget Config / Settings
var widgetList = {
    apparent: {enabled: true},
    temperature: {enabled: true},
    barometer: {enabled: true},
    windChill: {enabled: true},
    forecastHandler: {enabled: true},
    graphHandler: {enabled: true},
    graphHandlerBarometer: {enabled: true},
    graphHandlerRainfall: {enabled: true},
    graphHandlerTemperature: {enabled: true},
    graphHandlerWindSpeed: {enabled: true},
    humidity: {enabled: true},
    modalHandler: {enabled: true},
    moonSun: {enabled: true},
    recordHandler: {enabled: true},
    solar: {enabled: true},
    status: {enabled: true},
    rainfallTitle: {enabled: true},
    rainfallDay: {enabled: true},
    rainfallMonth: {enabled: true},
    rainfallYear: {enabled: true},
    UV: {enabled: true},
    windDirection: {enabled: true},
    windSpeed: {enabled: true}
};
//Alter widgetList settings to match any changes made in the config file
if (typeof gaugeSettings !== "undefined") {//Check to see if gauge setting list exists.
    gaugeSettingsWidgets = Object.keys(gaugeSettings);
    for (i = 0; i < gaugeSettingsWidgets.length; i++) {
        if (typeof widgetList[gaugeSettingsWidgets[i]] !== "undefined") {
            var gaugeWidgetKeys = Object.keys(gaugeSettings[gaugeSettingsWidgets[i]]);
            for (p = 0; p < gaugeWidgetKeys.length; p++) {
                widgetList[gaugeSettingsWidgets[i].toString()][gaugeWidgetKeys[p]] = gaugeSettings[gaugeSettingsWidgets[i].toString()][gaugeWidgetKeys[p]];
            }
        }
    }
}

//Functions globally used
//IE compadibility fix
(function () {
    if ( typeof window.CustomEvent === "function" ) return false; //If not IE

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();


//Responsivly resize container to window
function resizeContainer() {
    var container = document.getElementById('FWDLcontainer'),
        ratio = 0.5625, //9:16 ratio
        size = 1.7,
        width = 0,
        height = 0,
        styleString = null;

	//Adjusts div to match resized window. Always adjust to the smallest dimention
	if ((document.documentElement.clientHeight / ratio) <= document.documentElement.clientWidth) {
		width = document.documentElement.clientHeight * size;
		height = document.documentElement.clientHeight * size * ratio;
	} else {
		width = document.documentElement.clientWidth * ratio * size;
		height = document.documentElement.clientWidth * ratio * size * ratio;
	}
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    
    container.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    container.style.width = width.toString();
    container.style.height = height.toString();
}

//Check if browsing on mobile
var onMobile = false;
(function (a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) onMobile = true })(navigator.userAgent || navigator.vendor || window.opera);

//Initialise the layout container settings
function initialiseLayout() {
    //If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeContainer();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeContainer();
        });
    }
	
    //Set the canvas size intially.
	resizeContainer();
    
    //Set version number:
    document.getElementById("Version").innerHTML = "FreshWDL - Version: 1.1.6 Alpha. yerren@renerica.com";
}

//Set global Graph options
Chart.defaults.global.elements.line.tension = .1;
Chart.defaults.global.elements.line.borderWidth = 4;
Chart.defaults.global.elements.line.borderCapStyle = "round";
Chart.defaults.global.elements.point.radius = 2;
Chart.defaults.global.elements.point.hitRadius = 10;
Chart.defaults.global.elements.point.pointBorder = 10;
Chart.defaults.global.elements.point.hoverRadius = 5;
Chart.defaults.global.animation.duration = 0;
Chart.defaults.global.responsive = false;
Chart.defaults.global.maintainAspectRatio = false;
Chart.defaults.global.legend.display = false;
Chart.defaults.global.defaultFontFamily = globalFontFamily;

//Set units. In the format of: "multiplier, "Display", number of decimal places to round to]
var units = {
        pressure: {
            hPa: [1, "hPa", 1],
            mmHG: [0.750061561303, "mmHG", 1],
            kPa: [0.1, "kPa", 2],
            inHg: [0.0295299830714, "inHg", 2],
            mb: [1, "mb", 1]
        },
        altitude: {
            m: [0.3048, "m", 0],
            yds: [0.333333, "yds", 0],
            ft: [1, "ft", 0]
        },
        wind: {
            kmh: [1.852, "km/h", 1],
            mph: [1.15078, "mph", 1],
            kts: [1, "kts", 1],
            ms: [0.514444, "m/s", 1]
        },
        windDirection: {
            deg: [1, "\xB0", 0]
        },
        rainfall: {
            mm: [1, "mm", 1],
            inch: [0.0393701, "in", 2]
        },
        humidity: {
            percent: [1, "%", 0]
        },
        solar: {
            Wm: [1, "W/m\xB2", 1]
        },
        uv: {
            noUnit: [1, " ", 1]
        },
        temp: {
            celsius: [1, String.fromCharCode(176) + "C", 1],
            fahrenheit: [1, String.fromCharCode(176) + "F", 1]
        }
    };

//Globally used helper funtions
function betterRound(value, decimals) {
    //Better number rounding, credit to: http://www.jacklmoore.com/notes/rounding-in-javascript/
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function formatDataToUnit(dataIn, unitsIn) {
    //Format to the correct unit
    var roundTo = units[unitsIn.toString()][currentUnits[unitsIn.toString()]][2];
    
    if (unitsIn.toString() == "temp") {
        if (currentUnits[unitsIn.toString()] == "fahrenheit") {
            var fahTemp = dataIn * (9 / 5) + 32;
            return betterRound(fahTemp, roundTo);
        } else {
            return dataIn;
        }
    } else if (parseFloat(dataIn) == 0) {
        return betterRound((dataIn * units[unitsIn.toString()][currentUnits[unitsIn.toString()]][0].toString()), roundTo);
    } else {
        var decPlaces = roundTo,
            result = 0,
            max = 5;
        while (result == 0 && decPlaces <= max) {
            result = betterRound((dataIn * units[unitsIn.toString()][currentUnits[unitsIn.toString()]][0].toString()), decPlaces);
            if (isNaN(result) === true) {result = 0; }
            decPlaces += 1;
        }
        return result;
    }
}

function sharpenValue(valueIn) {
    //Return the coordinate value that will result in sharp lines being drawn
    return betterRound(valueIn, 0) + 0.5;
}

Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            var helpers = Chart.helpers;
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(0, 0, 1000, 1000);
            ctx.restore();
        }
    }
});

function checkOverflow(el) {
    //Checks if an element has overflowing text, creit to: Shog9, http://stackoverflow.com/questions/143815/determine-if-an-html-elements-content-overflows
    var curOverflow = el.style.overflow;

    if ( !curOverflow || curOverflow === "visible" ) {
        el.style.overflow = "hidden";
    }

    var isOverflowing = el.clientWidth < el.scrollWidth
        || el.clientHeight < el.scrollHeight;

    el.style.overflow = curOverflow;

    return isOverflowing;
}

var numLoaded = 0,
    numWidgets = 0,
    widgetListKeys = Object.keys(widgetList);

for (i = 0; i < widgetListKeys.length; i++) {
    if (widgetList[widgetListKeys[i]].enabled === true) {numWidgets++; }
}

function checkOffLoaded() {
    //checks off when every widget finishes loading, and then sends the call to update. Only used as page loads.
    numLoaded += 1;
    if (numLoaded >= numWidgets) {
        loaded = true;
        tryUpdateWidgets();
    }
}