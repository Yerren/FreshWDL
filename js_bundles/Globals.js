/*jslint plusplus: true, sloppy: true, indent: 4 */

//Sets GLOBAL variables
//Customizables
var roundTo = 1, //number of decimal places to round to
    globalFontFamily = "Arial", //The font used throughout the page
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
        label: "Pressure",
        unit: "pressure",
        style: "barometer",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            dailyMonth: {
                title: "Barometer Last 31 Days",
                timestamp: "timestampDay",
                data: ["baroDays31"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            hourlyDay: {
                title: "Barometer Last 24 Hours",
                timestamp: "timestampHour",
                data: ["baroHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "Barometer Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["baroQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Barometer Last Hour",
                timestamp: "timestampMinute",
                data: ["baroMinutes60"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            }
        }
    },
    humidity: {
        label: "Percent",
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
                title: "Humidity Last 31 Days",
                timestamp: "timestampDay",
                data: ["humidityDays31"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            hourlyDay: {
                title: "Humidity Last 24 Hours",
                timestamp: "timestampHour",
                data: ["humidityHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "Humidity Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["humidityQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Humidity Last Hour",
                timestamp: "timestampMinute",
                data: ["humidityMinutes60"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            }
        }
    },
    solar: {
        label: "Irradiance",
        unit: "solar",
        style: "solar",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            hourlyDay: {
                title: "Solar Last 24 Hours",
                timestamp: "timestampHour",
                data: ["solarHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "Solar Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["solarQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Solar Last Hour",
                timestamp: "timestampMinute",
                data: ["solarMinutes60"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            }
        }
    },
    temp: {
        label: "Temperature",
        unit: "temp",
        style: "tempHigh",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            dailyMonth: {
                title: "Temperature Last 31 Days",
                timestamp: "timestampDay",
                data: ["tempHighDays31", "tempLowDays31"],
                timeDisplay: "DDD/MM/YYYY",
                additionalStyles: ["tempLow"],
                legendLabels: ["Max", "Min"],
                legendOptions: {
                    display: true
                }
            },
            hourlyDay: {
                title: "Temperature Last 24 Hours",
                timestamp: "timestampHour",
                data: ["tempHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "Temperature Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["tempQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Temperature Last Hour",
                timestamp: "timestampMinute",
                data: ["tempMinutes60"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            }
        }
    },
    uv: {
        label: "Index",
        unit: "uv",
        style: "uv",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            hourlyDay: {
                title: "UV Last 24 Hours",
                timestamp: "timestampHour",
                data: ["uvHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "UV Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["uvQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            }
        }
    },
    windDir: {
        label: "Direction",
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
                title: "Wind Direction Last 31 Days",
                timestamp: "timestampDay",
                data: ["windDirDays31"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
                
            },
            hourlyDay: {
                title: "Wind Direction Last 24 Hours",
                timestamp: "timestampHour",
                data: ["windDirHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "Wind Direction Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["windDirQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Wind Direction Last Hour",
                timestamp: "timestampMinute",
                data: ["windDirMinutes60"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            }
        }
    },
    windSpeed: {
        label: "Speed",
        unit: "wind",
        style: "wind",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            dailyMonth: {
                title: "Wind Speed Last 31 Days",
                timestamp: "timestampDay",
                data: ["windSpeedDays31"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            hourlyDay: {
                title: "Wind Speed Last 24 Hours",
                timestamp: "timestampHour",
                data: ["windSpeedHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: "Wind Speed Last 7 Days",
                timestamp: "timestampQuarterDay",
                data: ["windSpeedQuarterDays28"],
                timeDisplay: "DDD/MM/YYYY",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Wind Speed Last Hour",
                timestamp: "timestampMinute",
                data: ["windSpeedMinutes60", "windGustMinutes60"],
                timeDisplay: "HH:mm",
                additionalStyles: ["windGust"],
                legendLabels: ["Avg", "Gust"],
                legendOptions: {
                    display: true
                }
            }
        }
    },
    rainfallLine: {
        label: "Rainfall",
        unit: "rainfall",
        style: "rainfallLine",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            hourlyDay: {
                title: "Rainfall Last 24 Hours",
                timestamp: "timestampHour",
                data: ["rainHours24"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            },
            minutlyHour: {
                title: "Rainfall Last Hour",
                timestamp: "timestampMinute",
                data: ["rainMinutes60"],
                timeDisplay: "HH:mm",
                legendOptions: {}
            }
        }
    },
    rainfallBar: {
        label: "Rainfall",
        unit: "rainfall",
        style: "rainfallBar",
        graphType: "bar",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            dailyMonth: {
                title: "Rainfall Last 31 Days",
                timestamp: "timestampDay",
                data: "rainDays31",
                timeDisplay: "DD/MM",
                legendOptions: {}
            },
            monthlyYear: {
                title: "Rainfall Last 12 Months",
                timestamp: "timestampMonth",
                data: "rainMonths12",
                timeDisplay: "MMM",
                legendOptions: {}
            },
            dailyWeek: {
                title: "Rainfall Last 7 Days",
                timestamp: "timestampWeekDay",
                data: "rainDays7",
                timeDisplay: "dddd",
                legendOptions: {}
            }
        }
    }
};

//Functions globally used
//Responsivly resize container to window
function resizeContainer() {
    var container = document.getElementById('FWDLcontainer'),
        ratio = 0.5625,
        size = 1.7,
        width = 0,
        height = 0,
        styleString = null;

	//Adjusts div to match resized window. Always adjust to the smallest dimention
	if ((window.innerHeight / ratio) <= window.innerWidth) {
		width = window.innerHeight * size;
		height = window.innerHeight * size * ratio;
	} else {
		width = window.innerWidth * ratio * size;
		height = window.innerWidth * ratio * size * ratio;
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
	}
	
    //Set the canvas size intially.
	resizeContainer();
    
    //Set version number:
    document.getElementById("Version").innerHTML = "Version 1.1.0 Alpha. yerren@renerica.com";
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

//Set units
var units = {
        pressure: {
            hPa: [1, "hPa"],
            mmHG: [0.750061561303, "mmHG"],
            kPa: [0.1, "kPa"],
            inHg: [0.0295299830714, "inHg"],
            mb: [1, "mb"]
        },
        altitude: {
            m: [0.3048, "m"],
            yds: [0.333333, "yds"],
            ft: [1, "ft"]
        },
        wind: {
            kmh: [1.852, "km/h"],
            mph: [1.15078, "mph"],
            kts: [1, "kts"],
            ms: [0.514444, "m/s"]
        },
        windDirection: {
            deg: [1, "\u00B0"]
        },
        rainfall: {
            mm: [1, "mm"],
            inch: [0.0393701, "in"]
        },
        humidity: {
            percent: [1, "%"]
        },
        solar: {
            Wm: [1, "W/m\xB2"]
        },
        uv: {
            noUnit: [1, " "]
        },
        temp: {
            celsius: [1, String.fromCharCode(176) + "C"], 
            fahrenheit: [1, String.fromCharCode(176) + "F"]
        }
    };

//Globally used helper funtions
function betterRound(value, decimals) {
    //Better number rounding, credit to: http://www.jacklmoore.com/notes/rounding-in-javascript/
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function formatDataToUnit(dataIn, unitsIn, roundTo, alwaysValue) {
    //Format to the correct unit
    
    alwaysValue = alwaysValue || false;
    
    if (unitsIn.toString() == "temp") {
        if (currentUnits[unitsIn.toString()] == "fahrenheit") {
            var fahTemp = dataIn * (9/5) + 32;
            return betterRound(fahTemp, roundTo);
        } else {
            return dataIn;
        }
    } else if (alwaysValue === false || parseFloat(dataIn) == 0) {
        return betterRound((dataIn * units[unitsIn.toString()][currentUnits[unitsIn.toString()]][0].toString()), roundTo);
    } else if (alwaysValue === true) {
        var decPlaces = roundTo,
            result = 0,
            max = 5;
        while (result == 0 && decPlaces <= max) {
            result = betterRound((dataIn * units[unitsIn.toString()][currentUnits[unitsIn.toString()]][0].toString()), decPlaces);
            if (isNaN(result) === true) {result = 0};
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
    numWidgets = 23;
function checkOffLoaded() {
    //checks off when every widget finishes loading, and then sends the call to update. Only used as page loads.
    numLoaded += 1;
    if (numLoaded >= numWidgets) {
        loaded = true;
        tryUpdateWidgets();
    }
}