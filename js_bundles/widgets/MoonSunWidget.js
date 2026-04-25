/*jslint plusplus: true, sloppy: true, indent: 4 */
// MoonSunWidget: sunrise/sunset and moonrise/moonset/phase/age. Fully
// declarative via WidgetText template. Bindings supply the six values;
// labels are looked up via the dict filter (`{{_|dict:KEY}}`).

(function (global) {
    function MoonSunWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "MoonSun01";
        config.events = config.events || ["clientRawExtraDataUpdate"];
        config.template = config.template || [
            '<shape type="roundedRect" x="5%" y="5%" w="90%" h="90%"',
            '       radius="10%" strokeSize="2.5%" fill="#F6F6F6"/>',
            '<text x="50%" y="13%" font="bold 11.1111%h arial" maxWidth="90%">{{_|dict:moonSunTitleSun}}</text>',
            '<text x="50%" y="23%" font="bold 10%h arial" maxWidth="90%">{{_|dict:moonSunRise}}: {{sunRise}}</text>',
            '<text x="50%" y="33%" font="bold 10%h arial" maxWidth="90%">{{_|dict:moonSunSet}}: {{sunSet}}</text>',
            '<text x="50%" y="47%" font="bold 11.1111%h arial" maxWidth="90%">{{_|dict:moonSunTitleMoon}}</text>',
            '<text x="50%" y="57%" font="bold 10%h arial" maxWidth="90%">{{_|dict:moonSunRise}}: {{moonRise}}</text>',
            '<text x="50%" y="67%" font="bold 10%h arial" maxWidth="90%">{{_|dict:moonSunSet}}: {{moonSet}}</text>',
            '<text x="50%" y="77%" font="bold 10%h arial" maxWidth="90%">{{_|dict:moonSunPhase}}: {{moonPhase}}%</text>',
            '<text x="50%" y="87%" font="bold 10%h arial" maxWidth="90%">{{_|dict:moonSunAge}}: {{moonAge}}</text>'
        ].join("\n");
        WidgetText.call(this, config);
    }
    WidgetBase.inherit(MoonSunWidget, WidgetText);

    MoonSunWidget.prototype.aspectRatio = 1.0;

    global.MoonSunWidget = MoonSunWidget;
})(typeof window !== "undefined" ? window : this);
