// Reference layout. Widgets are mounted into `[data-widget="id"]`
// placeholders by js_bundles/LayoutMount.js — the canvas (and wrapper, for
// chart widgets) is injected at boot. `id` values must match the manifest
// entries in index-oo.html. Users wanting a custom layout can ignore this
// file and author their own HTML/CSS using the same data-widget attribute.
document.write('\
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
