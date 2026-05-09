/*jslint plusplus: true, sloppy: true, indent: 4 */
// WindSpeedWidget: dual bar (wind speed + gust) with high markers and Beaufort scale display.
// canvasID: "WindSpeed01", data: arrayClientraw[1,2,113,71].

(function (global) {
    function WindSpeedWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "WindSpeed01";
        config.events = config.events || ["clientRawDataUpdate"];
        config.unitEvents = config.unitEvents || ["wind"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("windSpeedDescription") : "");
        WidgetBar.call(this, config);
        this.rectLeft = null;
        this.rectFillLeft = null;
        this.rectLeftCommand = null;
        this.rectFillLeftCommand = null;
        this.rectRight = null;
        this.rectFillRight = null;
        this.rectRightCommand = null;
        this.rectFillRightCommand = null;
        this.leftStrokeCommand = null;
        this.rightStrokeCommand = null;
        this.windHighMarker = null;
        this.windHighMarkerStrokeCommand = null;
        this.windHighMarkerStartCommand = null;
        this.windHighMarkerEndCommand = null;
        this.gustHighMarker = null;
        this.gustHighMarkerStrokeCommand = null;
        this.gustHighMarkerStartCommand = null;
        this.gustHighMarkerEndCommand = null;
        this.textDisplayWind = null;
        this.textTitle = null;
        this.textTitleWind = null;
        this.textTitleGust = null;
        this.textDisplayGust = null;
        this.textDisplayBeaufort = null;
        this.windHighDisplay = null;
        this.gustHighDisplay = null;
        this.largeDashTotal = 6;
        this.dashStrokeCommand = [];
        this.dashStartCommand = [];
        this.dashEndCommand = [];
        this.dash = [];
        this.label = [];
        this.setupVars = {
            dashGap: null, barWidth: null, barFillWidth: null,
            barHeight: null, barFillHeight: null, strokeSize: null,
            textSize: null, posBarLeft: {}, posBarRight: {},
            posDash: {}, posTextBeaufort: {}
        };
        this.constants = {
            minSpeed: 0, minSpeedDEFAULT: 0,
            maxSpeed: 10, maxSpeedDEFAULT: 10
        };
        this.tweens = {
            barFillLeft:   { h: 0 },
            barFillRight:  { h: 0 },
            windHighSpeed: { h: 1.04 },
            gustHighSpeed: { h: 1.04 }
        };
        this.values = {
            speedIn: 0, speedOut: 0, speedOrigional: 0,
            gustIn: 0, gustOut: 0,
            windHighSpeedIn: 0, windHighSpeedOut: 0,
            gustHighSpeedIn: 0, gustHighSpeedOut: 0,
            unitsIn: "wind"
        };
        this.valuesOld = { speedIn: 0, speedOut: 0, gustIn: 0, gustOut: 0 };
    }
    WidgetBase.inherit(WindSpeedWidget, WidgetBar);

    WindSpeedWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.speed, v.gust, v.windHigh, v.gustHigh);
    };

    WindSpeedWidget.prototype.redrawForUnitChange = function () {
        var v = this.readBindings();
        this.draw(v.speed, v.gust, v.windHigh, v.gustHigh, true);
    };

    WindSpeedWidget.prototype.formatInput = function () {
        var v = this.values, c = this.constants, ldt = this.largeDashTotal;

        v.speedIn         = formatDataToUnit(v.speedIn,         v.unitsIn);
        v.gustIn          = formatDataToUnit(v.gustIn,          v.unitsIn);
        v.windHighSpeedIn = formatDataToUnit(v.windHighSpeedIn, v.unitsIn);
        v.gustHighSpeedIn = formatDataToUnit(v.gustHighSpeedIn, v.unitsIn);

        while (v.speedIn > c.maxSpeed || v.gustIn > c.maxSpeed ||
               v.windHighSpeedIn > c.maxSpeed || v.gustHighSpeedIn > c.maxSpeed) {
            c.maxSpeed += ldt - 1;
        }
        while (v.speedIn <= c.maxSpeed - (ldt - 1) && v.gustIn <= c.maxSpeed - (ldt - 1) &&
               v.windHighSpeedIn <= c.maxSpeed - (ldt - 1) && v.gustHighSpeedIn <= c.maxSpeed - (ldt - 1) &&
               c.maxSpeed > c.maxSpeedDEFAULT) {
            c.maxSpeed -= ldt - 1;
        }

        v.speedOut         = mapRange(v.speedIn,         c.minSpeed, c.maxSpeed, 0, 1);
        v.gustOut          = mapRange(v.gustIn,          c.minSpeed, c.maxSpeed, 0, 1);
        v.windHighSpeedOut = mapRange(v.windHighSpeedIn, c.minSpeed, c.maxSpeed, 1, 0);
        v.gustHighSpeedOut = mapRange(v.gustHighSpeedIn, c.minSpeed, c.maxSpeed, 1, 0);
    };

    WindSpeedWidget.prototype.draw = function (speedIn, gustIn, windHighSpeedIn, gustHighSpeedIn, unitChange) {
        if (!this.hasChanged({
                speedIn: speedIn, gustIn: gustIn,
                windHighSpeedIn: windHighSpeedIn, gustHighSpeedIn: gustHighSpeedIn
            }, unitChange)) {
            return;
        }

        this.values.speedIn         = speedIn;
        this.values.speedOrigional  = speedIn;
        this.values.gustIn          = gustIn;
        this.values.windHighSpeedIn = windHighSpeedIn;
        this.values.gustHighSpeedIn = gustHighSpeedIn;

        this.formatInput();
        createjs.Tween.get(this.tweens.barFillLeft,   { override: true }).to({ h: this.values.speedOut },         2000, createjs.Ease.quartInOut);
        createjs.Tween.get(this.tweens.barFillRight,  { override: true }).to({ h: this.values.gustOut },          2000, createjs.Ease.quartInOut);
        createjs.Tween.get(this.tweens.windHighSpeed, { override: true }).to({ h: this.values.windHighSpeedOut }, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(this.tweens.gustHighSpeed, { override: true }).to({ h: this.values.gustHighSpeedOut }, 2000, createjs.Ease.quartInOut);

        this.refreshLabels();
    };

    WindSpeedWidget.prototype.makeColorGradient = function (f1, f2, f3, p1, p2, p3, i) {
        var center = 128, width = 127;
        return [
            Math.sin(f1 * i + p1) * width + center,
            Math.sin(f2 * i + p2) * width + center,
            Math.sin(f3 * i + p3) * width + center
        ];
    };

    WindSpeedWidget.prototype.refreshLabels = function () {
        var v = this.values, c = this.constants, ldt = this.largeDashTotal,
            unitStr = units[v.unitsIn][currentUnits[v.unitsIn]][1].toString();

        this.windHighDisplay.text = useDict("windSpeedMax") + ":\n" + v.windHighSpeedIn.toString();
        this.gustHighDisplay.text = useDict("windSpeedMax") + ":\n" + v.gustHighSpeedIn.toString();
        this.updateScaleLabels(ldt, c.minSpeed, c.maxSpeed);
        this.textDisplayWind.text = v.speedIn.toString() + "\n" + unitStr;
        this.textDisplayGust.text = v.gustIn.toString()  + "\n" + unitStr;

        var beaufortSpeed = calculateBeaufort(v.speedOrigional);
        this.textDisplayBeaufort.text = useDict("beaufortScaleTitle") + ": " + beaufortSpeed.toString();
        var grad = this.makeColorGradient(0.42, 0.42, 0.42, 0, 2, 4, 10 + beaufortSpeed);
        this.textDisplayBeaufort.color = "rgb(" + grad[0] + "," + grad[1] + "," + grad[2] + ")";
    };

    WindSpeedWidget.prototype.updateTweens = function () {
        this.updateVerticalFillFromBottom(this.tweens.barFillLeft.h,  this.rectLeftCommand,  this.rectFillLeftCommand);
        this.updateVerticalFillFromBottom(this.tweens.barFillRight.h, this.rectRightCommand, this.rectFillRightCommand);

        this.windHighMarkerEndCommand.y = this.windHighMarkerStartCommand.y = this.tweens.windHighSpeed.h * this.rectLeftCommand.h  + this.rectLeftCommand.y;
        this.gustHighMarkerEndCommand.y = this.gustHighMarkerStartCommand.y = this.tweens.gustHighSpeed.h * this.rectRightCommand.h + this.rectRightCommand.y;
    };

    WindSpeedWidget.prototype.updateTop = function () {
        var sv = this.setupVars, c = this.canvas, ldt = this.largeDashTotal;

        sv.dashLength      = c.height * 0.075;
        sv.dashGap         = c.height * 0.025;
        sv.barWidth        = c.height * 0.15;
        sv.barFillWidth    = sv.barWidth * 0.6;
        sv.barHeight       = c.height * 0.64;
        sv.barFillHeight   = sv.barHeight;
        sv.strokeSize      = sv.barWidth / 40;
        sv.textSize        = c.height / 17;
        sv.textDisplaySize = c.height / 20;
        sv.beaufortSize    = c.height / 18;

        sv.posBarLeft  = { x: (c.height / 2) - (sv.barWidth / 2),  y: (c.height / 2) - (sv.barHeight / 2) };
        sv.posBarRight = { x: (c.height / 2) + (sv.barWidth / 2),  y: (c.height / 2) - (sv.barHeight / 2) };

        sv.posTextLabelLeft  = { x: sv.posBarLeft.x  + sv.barWidth / 2, y: sv.barHeight + (c.height - sv.barHeight) / 2 - c.height * 0.06 };
        sv.posTextLabelRight = { x: sv.posBarRight.x + sv.barWidth / 2, y: sv.posTextLabelLeft.y };
        sv.posTextTitle      = { x: sv.posBarRight.x, y: (c.height - sv.barHeight) * (4 / 9) };
        sv.posDash = {
            x: (c.height / 2) - (sv.barWidth / 2) - sv.dashLength - sv.dashGap,
            y: (c.height - sv.barHeight) / 2
        };
        sv.posLabelWind  = { x: sharpenValue(sv.posBarLeft.x  + sv.barWidth / 2), y: sharpenValue(sv.barHeight + (c.height - sv.barHeight) / 2) };
        sv.posLabelGust  = { x: sharpenValue(sv.posBarRight.x + sv.barWidth / 2), y: sv.posLabelWind.y };
        sv.posTextTitleWind = { x: sv.posBarLeft.x  + sv.barWidth / 2, y: (c.height - sv.barHeight) * (5 / 9) };
        sv.posTextTitleGust = { x: sv.posBarRight.x + sv.barWidth / 2, y: sv.posTextTitleWind.y };
        sv.posTextBeaufort  = { x: sv.posBarRight.x, y: c.height * (37 / 40) };

        this.leftStrokeCommand.width  = sv.strokeSize;
        this.rectLeftCommand.x  = sv.posBarLeft.x;
        this.rectLeftCommand.y  = sv.posBarLeft.y;
        this.rectLeftCommand.w  = sv.barWidth;
        this.rectLeftCommand.h  = sv.barHeight;

        this.rightStrokeCommand.width = sv.strokeSize;
        this.rectRightCommand.x = sv.posBarRight.x;
        this.rectRightCommand.y = sv.posBarRight.y;
        this.rectRightCommand.w = sv.barWidth;
        this.rectRightCommand.h = sv.barHeight;

        var gap = sv.barHeight / ((ldt - 1) * 2);
        this.drawLinearDashTrack({
            totalDashes: ldt * 2 - 1,
            orientation: "vertical",
            posDash: sv.posDash,
            dashLength: sv.dashLength,
            strokeSize: sv.strokeSize,
            majorEvery: 2,
            midEvery: 1,
            minorsEnabled: false,
            computeCoord: function (i) { return sharpenValue(gap * i + sv.posDash.y); },
            labelX: (sv.posDash.x - sv.dashLength) * (125 / 100),
            textSize: sv.textSize
        });

        this.rectFillLeftCommand.x  = sv.posBarLeft.x;
        this.rectFillLeftCommand.w  = sv.barWidth;
        this.rectFillRightCommand.x = sv.posBarRight.x;
        this.rectFillRightCommand.w = sv.barWidth;

        this.windHighMarkerStrokeCommand.width = sv.strokeSize * 4;
        this.windHighMarkerStartCommand.x = sv.posBarLeft.x;
        this.windHighMarkerEndCommand.x   = sv.posBarLeft.x + sv.barWidth;

        this.gustHighMarkerStrokeCommand.width = sv.strokeSize * 4;
        this.gustHighMarkerStartCommand.x = sv.posBarRight.x;
        this.gustHighMarkerEndCommand.x   = sv.posBarRight.x + sv.barWidth;

        this.windHighDisplay.x    = sv.posLabelWind.x;
        this.windHighDisplay.y    = sv.posLabelWind.y;
        this.windHighDisplay.font = sv.textDisplaySize + "px arial";
        setMaxWidthGivenWidth(this.windHighDisplay, sv.barWidth);

        this.gustHighDisplay.x    = sv.posLabelGust.x;
        this.gustHighDisplay.y    = sv.posLabelGust.y;
        this.gustHighDisplay.font = sv.textDisplaySize + "px arial";
        setMaxWidthGivenWidth(this.gustHighDisplay, sv.barWidth);

        this.textTitle.x    = sv.posTextTitle.x;
        this.textTitle.y    = sv.posTextTitle.y;
        this.textTitle.font = "bold " + (sv.textDisplaySize * 1.5) + "px arial";
        setFontMaxWidth(this.textTitle, this.canvas, this.stage);

        this.textTitleWind.x    = sv.posTextTitleWind.x;
        this.textTitleWind.y    = sv.posTextTitleWind.y;
        this.textTitleWind.font = sv.textDisplaySize + "px arial";
        setMaxWidthGivenWidth(this.textTitleWind, sv.barWidth);

        this.textTitleGust.x    = sv.posTextTitleGust.x;
        this.textTitleGust.y    = sv.posTextTitleGust.y;
        this.textTitleGust.font = sv.textDisplaySize + "px arial";
        setMaxWidthGivenWidth(this.textTitleGust, sv.barWidth);

        this.textDisplayWind.x    = sv.posTextLabelLeft.x;
        this.textDisplayWind.y    = sv.posTextLabelLeft.y;
        this.textDisplayWind.font = "bold " + sv.textDisplaySize + "px arial";

        this.textDisplayGust.x    = sv.posTextLabelRight.x;
        this.textDisplayGust.y    = sv.posTextLabelRight.y;
        this.textDisplayGust.font = "bold " + sv.textDisplaySize + "px arial";

        this.textDisplayBeaufort.x    = sv.posTextBeaufort.x;
        this.textDisplayBeaufort.y    = sv.posTextBeaufort.y;
        this.textDisplayBeaufort.font = "bold " + sv.beaufortSize + "px arial";
        setFontMaxWidth(this.textDisplayBeaufort, this.canvas, this.stage);

        this.refreshLabels();
        this.updateTweens();
    };

    WindSpeedWidget.prototype.recolour = function () {
        var windCol     = "rgb(" + this.getColour("wind") + ")",
            windGustCol = "rgb(" + this.getColour("windGust") + ")";
        if (this.rectFillLeftFillColorCommand)     { this.rectFillLeftFillColorCommand.style     = windCol;     }
        if (this.windHighMarkerStrokeColorCommand) { this.windHighMarkerStrokeColorCommand.style = windCol;     }
        if (this.rectFillRightFillColorCommand)    { this.rectFillRightFillColorCommand.style    = windGustCol; }
        if (this.gustHighMarkerStrokeColorCommand) { this.gustHighMarkerStrokeColorCommand.style = windGustCol; }
        this._dirty = true;
    };

    WindSpeedWidget.prototype.aspectRatio = 1.5;

    WindSpeedWidget.prototype.applyStageTransform = function () {
        this.stage.x = -(this.canvas.width / 3.3);
    };

    WindSpeedWidget.prototype.setUp = function () {
        var ldt = this.largeDashTotal;

        var left = this.createRect({ fill: "#F6F6F6" });
        this.rectLeft = left.shape;
        this.leftStrokeCommand = left.strokeCommand;
        this.rectLeftCommand = left.rectCommand;

        var right = this.createRect({ fill: "#F6F6F6" });
        this.rectRight = right.shape;
        this.rightStrokeCommand = right.strokeCommand;
        this.rectRightCommand = right.rectCommand;

        this.createDashes(ldt * 2);

        var fillLeft = this.createRect({
            fill: "rgb(" + this.getColour("wind") + ")", stroke: false
        });
        this.rectFillLeft = fillLeft.shape;
        this.rectFillLeftCommand = fillLeft.rectCommand;
        this.rectFillLeftFillColorCommand = fillLeft.fillColorCommand;

        var fillRight = this.createRect({
            fill: "rgb(" + this.getColour("windGust") + ")", stroke: false
        });
        this.rectFillRight = fillRight.shape;
        this.rectFillRightCommand = fillRight.rectCommand;
        this.rectFillRightFillColorCommand = fillRight.fillColorCommand;

        var windHi = this.createLine({ stroke: "rgb(" + this.getColour("wind") + ")" });
        this.windHighMarker = windHi.shape;
        this.windHighMarkerStrokeCommand = windHi.strokeCommand;
        this.windHighMarkerStrokeColorCommand = windHi.strokeColorCommand;
        this.windHighMarkerStartCommand  = windHi.startCommand;
        this.windHighMarkerEndCommand    = windHi.endCommand;

        var gustHi = this.createLine({ stroke: "rgb(" + this.getColour("windGust") + ")" });
        this.gustHighMarker = gustHi.shape;
        this.gustHighMarkerStrokeCommand = gustHi.strokeCommand;
        this.gustHighMarkerStrokeColorCommand = gustHi.strokeColorCommand;
        this.gustHighMarkerStartCommand  = gustHi.startCommand;
        this.gustHighMarkerEndCommand    = gustHi.endCommand;

        this.createLabels(ldt);

        this.textTitle       = this.createText(this.config.title || useDict("windSpeedTitle"),  { baseline: "bottom" });
        this.textTitleWind   = this.createText(useDict("windSpeedWind"),   { baseline: "top" });
        this.textTitleGust   = this.createText(useDict("windSpeedGust"),   { baseline: "top" });
        this.textDisplayWind = this.createText("", { baseline: "bottom" });
        this.textDisplayGust = this.createText("", { baseline: "bottom" });
        this.textDisplayBeaufort = this.createText("", { baseline: "top" });
        this.windHighDisplay = this.createText("0", { baseline: "top" });
        this.gustHighDisplay = this.createText("0", { baseline: "top" });
    };

    global.WindSpeedWidget = WindSpeedWidget;
})(typeof window !== "undefined" ? window : this);
