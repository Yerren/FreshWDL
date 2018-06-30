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
        en: "Apparent",
        nl: "Gevoel"
    },
    apparentDescription: {
        en: "Perceived temperature based on temperature, humidity, sun, and wind.",
        nl: "Waargenomen temperatuur gebaseerd op de temperatuur, vochtigheid, zon en wind."
    },
    temperatureTitle: {
        en: "Temperature",
        nl: "Temperatuur"
    },
    temperatureDescription: {
        en: "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature.",
        nl: "Huidige luchttemperatuur. \nBlauw: Minimum dagelijkse temperatuur. \nRood: Maximum dagelijkse temperatuur."
    },
    barometerSteady: {
        en: "Steady",
        nl: "Bestendig"
    },
    barometerRate: {
        en: "Rate",
        nl: "Snelheid"
    },
    barometerTitle: {
        en: "Barometer",
        nl: "Barometer"
    },
    barometerDescription: {
        en: "The weight of the air, adjusted for the station's altitude.",
        nl: "Het gewicht van de lucht, aangepast naar de hoogte van het weerstation."
    },
    windchillTitle: {
        en: "Windchill",
        nl: "Gevoelstemperatuur"
    },
    windchillDescription: {
        en: "How cold it actually feels. Calculated by combining heat and wind speed.",
        nl: "Hoe koud het daadwerkelijk aanvoelt. Wordt berekend door een combinatie van temperatuur en windsnelheid."
    },
    humidityTitle: {
        en: "Humidity",
        nl: "Vochtigheid"
    },
    humidityDescription: {
        en: "The amount of water vapour in the air as a percentage of the amount the air is capable of holding.",
        nl: "De hoeveelheid verdampt water in de lucht als een percentage van de hoeveelheid lucht dat in staat is om vocht vast te houden."
    },
    moonSunRise: {
        en: "Rise",
        nl: "Opkomst"
    },
    moonSunSet: {
        en: "Set",
        nl: "Ondergang"
    },
    moonSunPhase: {
        en: "Phase",
        nl: "Fase"
    },
    moonSunAge: {
        en: "Age",
        nl: "Leeftijd"
    },
    moonSunTitleSun: {
        en: "Sun",
        nl: "Zon"
    },
    moonSunTitleMoon: {
        en: "Moon",
        nl: "Maan"
    },
    solarTitle: {
        en: "Solar",
        nl: "Zonkracht"
    },
    solarSunHours: {
        en: "Sun Hours",
        nl: "Zonuren"
    },
    solarDescription: {
        en: "The intensity of the sun's radiation.",
        nl: "De intensiteit van de straling van de zon."
    },
    statusNoDataSince: {
        en: "No data since",
        nl: "Geen data sinds"
    },
    statusDataAt: {
        en: "Latest data received at",
        nl: "Laatste data ontvangen op"
    },
    statusDescription: {
        en: "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server.",
        nl: "Groen: Nieuwe data ontvangen van server. \nGrijs: Data op server is niet veranderd. \nGeel: Een foutmelding tijdens de ontvangst van de data van de server. \nRood: Geen data beschikbaar om te ontvangen van de server."
    },
    rainfallTitle: {
        en: "Rainfall",
        nl: "Regen"
    },
    rainfallDailyTitle: {
        en: "Daily",
        nl: "Dagelijks"
    },
    rainfallMonthlyTitle: {
        en: "Monthly",
        nl: "Maandelijks"
    },
    rainfallAnnualTitle: {
        en: "Annual",
        nl: "Jaarlijks"
    },
    uvTitle: {
        en: "UV",
        nl: "UV"
    },
    uvDescription: {
        en:  "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high.",
        nl: "De intensiteit van de UV straling - 0-2 is een minimaal risico op huidschade terwijl 8+ een hoog risico vormt."
    },
    windDirectionLabelN: {
        en: "N",
        nl: "N"
    },
    windDirectionLabelNE: {
        en: "NE",
        nl: "NO"
    },
    windDirectionLabelE: {
        en: "E",
        nl: "O"
    },
    windDirectionLabelSE: {
        en: "SE",
        nl: "ZO"
    },
    windDirectionLabelS: {
        en: "S",
        nl: "Z"
    },
    windDirectionLabelSW: {
        en: "SW",
        nl: "ZW"
    },
    windDirectionLabelW: {
        en: "W",
        nl: "W"
    },
    windDirectionLabelNW: {
        en: "NW",
        nl: "NW"
    },
    windDirectionDescription: {
        en: "The wind direction. Green arrow indicates average wind direction.",
        nl: "De windrichting. De groene pijl geeft de gemiddelde windrichting aan."
    },
    windSpeedMax: {
        en: "max",
        nl: "Max"
    },
    windSpeedTitle: {
        en: "Wind Speed",
        nl: "Windsnelheid"
    },
    windSpeedWind: {
        en: "Wind",
        nl: "Wind"
    },
    windSpeedGust: {
        en: "Gust",
        nl: "Vlaag"
    },
    windSpeedAverage: {
        en: "Average",
        nl: "Gemiddeld"
    },
    windSpeedDescription: {
        en: "Green bar indicates average wind speed.\nPurple bar indicates gust speed.",
        nl: "Groene balk geeft de gemiddelde windsnelheid aan. \nPaarse balk geeft de windsnelheid in vlagen aan."
    },
    recordsHighTemp: {
        en: "Highest temperature",
        nl: "Hoogste temperatuur"
    },
    recordsLowTemp: {
        en: "Lowest temperature",
        nl: "Laagste temperatuur"
    },
    recordsHighGust: {
        en: "Highest gust",
        nl: "Sterkste vlaag"
    },
    recordsHighRainRate: {
        en: "Highest rain rate",
        nl: "Hoogste hoeveelheid regen"
    },
    recordsLowBaro: {
        en: "Lowest barometer",
        nl: "Laagste stand barometer"
    },
    recordsHighBaro: {
        en: "Highest barometer",
        nl: "Hoogste stand barometer"
    },
    recordsHighRainRateDaily: {
        en: "Highest daily rainfall",
        nl: "Hoogste dagelijkse hoeveelheid regen"
    },
    recordsHighRainRateHourly: {
        en: "Highest hourly rainfall",
        nl: "Hoogste hoeveelheid regen per uur"
    },
    recordsHighAverageWind: {
        en: "Highest average wind speed",
        nl: "Hoogste gemiddelde windsnelheid"
    },
    recordsLowWindChill: {
        en: "Lowest wind chill",
        nl: "Laagste gevoelstemperatuur"
    },
    recordsWarmestDay: {
        en: "Warmest day",
        nl: "Warmste dag"
    },
    recordsColdestNight: {
        en: "Coldest night",
        nl: "Koudste nacht"
    },
    recordsColdestDay: {
        en: "Coldest day",
        nl: "Koudste dag"
    },
    recordsWarmestNight: {
        en: "Warmest night",
        nl: "Warmste nacht"
    },
    recordsHighHeatIndex: {
        en: "Highest heat index",
        nl: "Hoogste warmte index"
    },
    recordsHighSolar: {
        en: "Highest solar",
        nl: "Hoogste zonkracht"
    },
    recordsHighUV: {
        en: "Highest uv index",
        nl: "Hoogste uv index"
    },
    recordsHighDewPoint: {
        en: "Highest dew point",
        nl: "Hoogste dauwpunt"
    },
    recordsLowDewPoint: {
        en: "Lowest dew point",
        nl: "Laagste dauwpunt"
    },
    forcastShowMore: {
        en: "Show More",
        nl: "Toon meer"
    },
    graphMax: {
        en: "Max",
        nl: "Max"
    },
    graphMin: {
        en: "Min",
        nl: "Min",
    },
    graphLast: {        //NOTE: these are used as in: Last XX days, or Last XX Hours, etc.
        en: "Last",
        nl: "Laatste"
    },
    graphDays: {
        en: "Days",
        nl: "Dagen"
    },
    graphHours: {
        en: "Hours",
        nl: "Uur"
    },
    graphHour: {
        en: "Hour",
        nl: "Uur"
    },
    graphMonths: {
        en: "Months",
        nl: "Maanden"
    },
    graphBaroLabel: {
        en: "Pressure",
        nl: "Luchtdruk"
    },
    graphHumidityLabel: {
        en: "Percent",
        nl: "Procent"
    },
    graphSolarLabel: {
        en: "Irradiance",
        nl: "Instraling"
    },
    graphLabelUV: {
        en: "Index",
        nl: "Index"
    },
    graphLabelWindDirection: {
        en: "Wind Direction",
        nl: "Windrichting"
    },
    buttonLabelGraphs: {
        en: "Graphs",
        nl: "Grafieken"
    },
    buttonLabelRecords: {
        en: "Records",
        nl: "Records"
    },
    buttonLabelAltitude: {
        en: "Altitude",
        nl: "Hoogte"
    },
    recordsForMonth: {
        en: "Records for this month",
        nl: "Records voor deze maand"
    },
    recordsForYear: {
        en: "Records for this year",
        nl: "Records voor dit jaar"
    },
    recordsAllTime: {
        en: "All time records",
        nl: "Records aller tijden"
    },
    forecastTitle: {
        en: "Forecast",
        nl: "Voorspelling"
    },
    heatIndexTitle: {
        en: "Heat Index"
    },
    heatIndexDescription: {
        en: "How hot it really feels when relative humidity is factored with the actual air temperature."
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