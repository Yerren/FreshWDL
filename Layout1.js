// Combined layout + manifest. Defines:
//   1. Layout-specific CSS (region sizes, per-widget slot sizing).
//   2. The DOM (data-widget="<id>" placeholders matched by LayoutMount).
//   3. The widget manifest (constructor + enabled flag + per-widget config).
//   4. window.app, which body onload will start().
//
// To try a different layout, swap this single file in index-oo.html. The
// layout markup must use data-widget attributes whose ids match manifest
// entries below. Generic styling (modals, loading screen, fonts, buttons)
// lives in css/stylesheet01.css and is shared across any layout.
//
// Must load after all widget classes (it references their constructors).

document.write('\
    <style>\
        .widgetContainer { float: left; padding: 0; overflow: hidden; }\
        .widgetContainer > canvas { display: block; float: left; }\
\
        /* data-widget placeholders. LayoutMount injects a <canvas> (or the\
           .OuterCanvasDiv wrapper for chart widgets) into each .widgetSlot at\
           boot. Each slot has explicit width AND height so contain-fit sizing\
           in CanvasWidget.resize() can bound the canvas in both dimensions. */\
        .widgetSlot { display: flex; align-items: center; justify-content: center; overflow: hidden; }\
        .widgetSlot > canvas { display: block; }\
        .widgetSlot > .OuterCanvasDiv { display: block; width: 100%; height: 100%; }\
        .widgetSlot > .OuterCanvasDiv > canvas { display: block; width: 100%; }\
\
        /* Page-level regions */\
        #FWDLcontainer { display: block; margin: auto; }\
        #top    { width: 100%; height: 20%; }\
        #left   { width: 15%;  height: 75%; }\
        #center { width: 45%;  height: 75%; }\
        #right  { width: 40%;  height: 75%; }\
        #bottom { width: 100%; height: 5%;  }\
\
        /* Sub-regions */\
        #leftTop            { width: 100%; height: 66%; }\
        #centerTop          { width: 100%; height: 45%; }\
        #centerBottom       { width: 100%; height: 55%; }\
        #leftCenterBottom   { width: 50%;  height: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; }\
        #rightCenterBottom  { width: 50%;  height: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto 1fr; }\
        #leftCenterBottom > canvas { float: right; }\
        #rightLeft          { width: 50%;  height: 100%; }\
        #rightRight         { width: 50%;  height: 100%; }\
\
        /* Per-widget slot sizing/placement */\
        #top > .widgetSlot[data-widget="status"]  { width: 80%; height: 100%; float: left;  align-items: flex-start; justify-content: flex-start; }\
        #top > .widgetSlot[data-widget="moonSun"] { width: 20%; height: 100%; float: right; justify-content: flex-end; }\
        #leftTop > .widgetSlot                       { width: 100%; height: 100%; }\
        #left > .widgetSlot[data-widget="humidity"]  { width: 100%; height: 34%; }\
        #centerTop > .widgetSlot                     { width: 33.3333%; height: 100%; float: left; }\
\
        #leftCenterBottom > .widgetSlot[data-widget="barometer"] { grid-row: 1;     grid-column: 1; }\
        #leftCenterBottom > .widgetSlot[data-widget="apparent"]  { grid-row: 2;     grid-column: 1; }\
        #leftCenterBottom > .widgetSlot[data-widget="UV"]        { grid-row: 1 / 3; grid-column: 2; }\
        #leftCenterBottom > .widgetSlot[data-widget="solar"]     { grid-row: 1 / 3; grid-column: 3; }\
\
        #rightCenterBottom > .widgetSlot[data-widget="rainfallTitle"] { grid-row: 1; grid-column: 1 / 4; }\
        #rightCenterBottom > .widgetSlot[data-widget="rainfallDay"]   { grid-row: 2; grid-column: 1; }\
        #rightCenterBottom > .widgetSlot[data-widget="rainfallMonth"] { grid-row: 2; grid-column: 2; }\
        #rightCenterBottom > .widgetSlot[data-widget="rainfallYear"]  { grid-row: 2; grid-column: 3; }\
\
        #rightLeft  > .widgetSlot,\
        #rightRight > .widgetSlot { width: 100%; height: 50%; }\
    </style>\
\
    <div id="FWDLcontainer">\
        <div id="top" class="widgetContainer">\
            <div data-widget="moonSun" class="widgetSlot"></div>\
            <div data-widget="status" class="widgetSlot"></div>\
            <div id="forecastText" style="overflow: hidden;"></div>\
        </div>\
        <div id="left" class="widgetContainer">\
            <div id="leftTop" class="widgetContainer">\
                <div data-widget="temperature" class="widgetSlot"></div>\
            </div>\
            <div data-widget="humidity" class="widgetSlot"></div>\
        </div>\
        <div id="center" class="widgetContainer">\
            <div id="centerTop" class="widgetContainer">\
                <div data-widget="windChill" class="widgetSlot"></div>\
                <div data-widget="windDirection" class="widgetSlot"></div>\
                <div data-widget="windSpeed" class="widgetSlot"></div>\
            </div>\
            <div id="centerBottom" class="widgetContainer">\
                <div id="leftCenterBottom" class="widgetContainer">\
                    <div data-widget="solar" class="widgetSlot"></div>\
                    <div data-widget="UV" class="widgetSlot"></div>\
                    <div data-widget="barometer" class="widgetSlot"></div>\
                    <div data-widget="apparent" class="widgetSlot"></div>\
                </div>\
                <div id="rightCenterBottom" class="widgetContainer">\
                    <div data-widget="rainfallTitle" class="widgetSlot"></div>\
                    <div data-widget="rainfallDay" class="widgetSlot"></div>\
                    <div data-widget="rainfallMonth" class="widgetSlot"></div>\
                    <div data-widget="rainfallYear" class="widgetSlot"></div>\
                </div>\
            </div>\
        </div>\
        <div id="right" class="widgetContainer">\
            <div id="rightLeft" class="widgetContainer">\
                <div data-widget="rainGraph" class="widgetSlot chartSlot"></div>\
                <div data-widget="windGraph" class="widgetSlot chartSlot"></div>\
            </div>\
            <div id="rightRight" class="widgetContainer">\
                <div data-widget="tempGraph" class="widgetSlot chartSlot"></div>\
                <div data-widget="baroGraph" class="widgetSlot chartSlot"></div>\
            </div>\
        </div>\
        <div id="bottom" class="widgetContainer">\
            <button style="display: none;" id="AltitudeButton" class="buttons"></button>\
            <button id="PressureButton" class="buttons"></button>\
            <button id="WindButton" class="buttons"></button>\
            <button id="RainfallButton" class="buttons"></button>\
            <button id="TempButton" class="buttons"></button>\
            <button id="RecordsButton" class="buttons"></button>\
            <button id="GraphsButton" class="buttons"></button>\
        </div>\
    </div>\
    <div id="Version" style="float: right; font-size: 0.8em;"> <p>yerren@renerica.com</p></div>\
');

(function (global) {
    var manifest = [
        {
            id: "apparent",
            Ctor: ApparentWidget,
            enabledKey: "apparent",
            canvasID: "Apparent01",
            config: {
                canvasID: "Apparent01",
                bindings: { temp: "clientraw[130]" }
            }
        },
        {
            id: "solar",
            Ctor: SolarBarWidget,
            enabledKey: "solar",
            canvasID: "SolarBar01",
            config: {
                canvasID: "SolarBar01",
                bindings: {
                    percent: "clientraw[34]",
                    watts:   "clientraw[127]",
                    sunHours: "clientrawExtra[696]"
                }
            }
        },
        {
            id: "humidity",
            Ctor: HumidityGaugeWidget,
            enabledKey: "humidity",
            canvasID: "HumidityGauge01",
            config: {
                canvasID: "HumidityGauge01",
                bindings: {
                    humidity: "clientraw[5]",
                    trend:    "clientraw[144]"
                }
            }
        },
        {
            id: "baroGraph",
            Ctor: MainChartWidget,
            enabledKey: "graphHandlerBarometer",
            canvasID: "baroGraphCanvas01",
            config: {
                canvasID: "baroGraphCanvas01",
                graphType: "line",
                defaultBase: "barometer",
                defaultRange: "hourlyDay"
            }
        },
        {
            id: "rainGraph",
            Ctor: MainChartWidget,
            enabledKey: "graphHandlerRainfall",
            canvasID: "rainGraphCanvas01",
            config: {
                canvasID: "rainGraphCanvas01",
                graphType: "bar",
                defaultBase: "rainfallBar",
                defaultRange: "dailyMonth"
            }
        },
        {
            id: "tempGraph",
            Ctor: MainChartWidget,
            enabledKey: "graphHandlerTemperature",
            canvasID: "tempGraphCanvas01",
            config: {
                canvasID: "tempGraphCanvas01",
                graphType: "line",
                defaultBase: "temp",
                defaultRange: "hourlyDay"
            }
        },
        {
            id: "windGraph",
            Ctor: MainChartWidget,
            enabledKey: "graphHandlerWindSpeed",
            canvasID: "windGraphCanvas01",
            config: {
                canvasID: "windGraphCanvas01",
                graphType: "line",
                defaultBase: "windSpeed",
                defaultRange: "hourlyDay"
            }
        },
        {
            id: "forecast",
            Ctor: ForecastHandler,
            enabledKey: "forecastHandler",
            config: { elementId: "forecastText" }
        },
        {
            id: "temperature",
            Ctor: TemperatureBarWidget,
            enabledKey: "temperature",
            config: {
                canvasID: "TempBar01",
                widgetListKey: "temperature",
                withArrow: true,
                titleSuffix: "",
                bindings: {
                    temp:  "clientraw[4]",
                    high:  "clientraw[46]",
                    low:   "clientraw[47]",
                    trend: "clientraw[143]"
                }
            }
        },
        {
            id: "temperature02",
            Ctor: TemperatureBarWidget,
            enabledKey: "temperature02",
            config: {
                canvasID: "TempBar02",
                widgetListKey: "temperature02",
                withArrow: false,
                titleSuffix: " 2",
                bindings: {
                    temp: "widgetListInput:temperature02[0]",
                    high: "widgetListInput:temperature02[1]",
                    low:  "widgetListInput:temperature02[2]"
                }
            }
        },
        {
            id: "temperature03",
            Ctor: TemperatureBarWidget,
            enabledKey: "temperature03",
            config: {
                canvasID: "TempBar03",
                widgetListKey: "temperature03",
                withArrow: false,
                titleSuffix: " 3",
                bindings: {
                    temp: "widgetListInput:temperature03[0]",
                    high: "widgetListInput:temperature03[1]",
                    low:  "widgetListInput:temperature03[2]"
                }
            }
        },
        {
            id: "windChill",
            Ctor: TemperatureBarWidget,
            enabledKey: "windChill",
            config: {
                canvasID: "Windchill01",
                widgetListKey: "windChill",
                withArrow: false,
                withAutoSwitch: true,
                modeKey: "windChill",
                titleSource: { mode: "dict", modeMap: { windchill: "windchillTitle", heatIndex: "heatIndexTitle" } },
                tooltipSource: { mode: "dict", modeMap: { windchill: "windchillDescription", heatIndex: "heatIndexDescription" } },
                // Conditional on widgetList.windChill.mode, so a function is the clearest form.
                dataFn: function () {
                    var isWC = (widgetList.windChill.mode === "windchill");
                    return [
                        isWC ? arrayClientraw[44]  : arrayClientraw[112],
                        isWC ? arrayClientraw[77]  : arrayClientraw[110],
                        isWC ? arrayClientraw[78]  : arrayClientraw[111]
                    ];
                },
                autoSwitchBindings: {
                    realTemp: "clientraw[4]",
                    realMax:  "clientraw[47]",
                    realMin:  "clientraw[46]",
                    chillMax: "clientraw[78]",
                    chillMin: "clientraw[77]",
                    heatMax:  "clientraw[111]",
                    heatMin:  "clientraw[110]"
                }
            }
        },
        {
            id: "barometer",
            Ctor: BarometerWidget,
            enabledKey: "barometer",
            config: {
                canvasID: "Barometer01",
                bindings: {
                    pressure: "clientraw[6]",
                    trend:    "clientraw[50]"
                }
            }
        },
        {
            id: "moonSun",
            Ctor: MoonSunWidget,
            enabledKey: "moonSun",
            config: {
                canvasID: "MoonSun01",
                bindings: {
                    sunRise:   "clientrawExtra[556]",
                    sunSet:    "clientrawExtra[557]",
                    moonRise:  "clientrawExtra[558]",
                    moonSet:   "clientrawExtra[559]",
                    moonPhase: "clientrawExtra[560]",
                    moonAge:   "clientrawExtra[561]"
                }
            }
        },
        {
            id: "status",
            Ctor: StatusWidget,
            enabledKey: "status",
            config: {
                canvasID: "Status01",
                bindings: {
                    status:      "clientraw[49]",
                    stationTime: "clientraw[32]",
                    stationDate: "clientraw[74]"
                }
            }
        },
        {
            id: "rainfallTitle",
            Ctor: TitleRainfallWidget,
            enabledKey: "rainfallTitle",
            config: { canvasID: "TitleRainfall01" }
        },
        {
            id: "rainfallDay",
            Ctor: UniBarWidget,
            enabledKey: "rainfallDay",
            config: {
                canvasID: "RainBar1",
                title: useDict("rainfallDailyTitle"),
                bindings: { value: "clientraw[7]" }
            }
        },
        {
            id: "rainfallMonth",
            Ctor: UniBarWidget,
            enabledKey: "rainfallMonth",
            config: {
                canvasID: "RainBar2",
                title: useDict("rainfallMonthlyTitle"),
                bindings: { value: "clientraw[8]" }
            }
        },
        {
            id: "rainfallYear",
            Ctor: UniBarWidget,
            enabledKey: "rainfallYear",
            config: {
                canvasID: "RainBar3",
                title: useDict("rainfallAnnualTitle"),
                bindings: { value: "clientraw[9]" }
            }
        },
        {
            id: "UV",
            Ctor: UVBarWidget,
            enabledKey: "UV",
            config: {
                canvasID: "UVBar01",
                bindings: { uv: "clientraw[79]" }
            }
        },
        {
            id: "windDirection",
            Ctor: WindGaugeWidget,
            enabledKey: "windDirection",
            config: {
                canvasID: "WindGauge01",
                bindings: {
                    direction: "clientraw[3]",
                    avg:       "clientraw[117]"
                }
            }
        },
        {
            id: "windSpeed",
            Ctor: WindSpeedWidget,
            enabledKey: "windSpeed",
            config: {
                canvasID: "WindSpeed01",
                bindings: {
                    speed:    "clientraw[1]",
                    gust:     "clientraw[2]",
                    windHigh: "clientraw[113]",
                    gustHigh: "clientraw[71]"
                }
            }
        },
        {
            id: "recordHandler",
            Ctor: RecordsHandler,
            enabledKey: "recordHandler",
            config: {}
        },
        {
            id: "modalGraph",
            Ctor: ModalGraphHandler,
            enabledKey: "graphHandler",
            config: {}
        },
        {
            id: "modalHandler",
            Ctor: ModalHandler,
            enabledKey: "modalHandler",
            config: {}
        },
        {
            id: "buttons",
            Ctor: ButtonsHandler,
            config: {}
        }
    ];

    global.app = new App({
        manifest: manifest,
        runDataManager: true,
        runTicker: true
    });
})(window);
