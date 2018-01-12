document.write('\
    <div id="FWDLcontainer">\
        <div id="top" class="widgetContainer">\
            <canvas id="MoonSun01"></canvas>\
            <canvas id="Status01"></canvas>\
            <div id="forecastText", style="overflow: hidden;"></div>\
        </div>\
        <div id="left" class="widgetContainer">\
            <canvas id="TempBar01"></canvas>\
            <canvas id="HumidityGauge01"></canvas>\
        </div>\
        <div id="center" class="widgetContainer">\
            <div id="centerTop" class="widgetContainer">\
                <canvas id="Windchill01"></canvas>\
                <canvas id="WindGauge01"></canvas>\
                <canvas id="WindSpeed01"></canvas>\
            </div>\
            <div id="centerBottom" class="widgetContainer">\
                <div id="leftCenterBottom" class="widgetContainer">\
                    <canvas id="SolarBar01"></canvas>\
                    <canvas id="UVBar01"></canvas>\
                    <canvas id="Barometer01"></canvas>\
                    <canvas id="Apparent01"></canvas>\
                </div>\
                <div id="rightCenterBottom" class="widgetContainer">\
                    <canvas id="TitleRainfall01"></canvas>\
                    <canvas id="RainBar1"></canvas>\
                    <canvas id="RainBar2"></canvas>\
                    <canvas id="RainBar3"></canvas>\
                </div>\
            </div>\
        </div>\
        <div id="right" class="widgetContainer">\
            <div id="rightLeft" class="widgetContainer">\
                <div id="rainGraphCanvas01CanvasDiv" class="OuterCanvasDiv">\
                    <canvas id="rainGraphCanvas01"></canvas>\
                </div>\
                <div id="windGraphCanvas01CanvasDiv" class="OuterCanvasDiv">\
                    <canvas id="windGraphCanvas01"></canvas>\
                </div>\
            </div>\
            <div id="rightRight" class="widgetContainer">\
                <div id="tempGraphCanvas01CanvasDiv" class="OuterCanvasDiv">\
                    <canvas id="tempGraphCanvas01"></canvas>\
                </div>\
                <div id="baroGraphCanvas01CanvasDiv" class="OuterCanvasDiv">\
                    <canvas id="baroGraphCanvas01"></canvas>\
                </div>\
            </div>\
        </div>\
        <div id="bottom" class="widgetContainer">\
            <button style="display: none;" id="AltitudeButton" class="buttons">Altitude</button>\
            <button id="PressureButton" class="buttons">Pressure</button>\
            <button id="WindButton" class="buttons">Wind</button>\
            <button id="RainfallButton" class="buttons">Rainfall</button>\
            <button id="TempButton" class="buttons">Temp</button>\
            <button id="RecordsButton" class="buttons">Records</button>\
            <button id="GraphsButton" class="buttons">Graphs</button>\
        </div>\
    </div>\
    <div id="Version" style="float: right; font-size: 0.8em;"> <p>yerren@renerica.com</p></div>\
');