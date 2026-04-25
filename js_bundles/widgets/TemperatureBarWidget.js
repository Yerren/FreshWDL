/*jslint plusplus: true, sloppy: true, indent: 4 */
// TemperatureBarWidget: drives tempBar01/02/03 and the windchill/heat-index
// bar via config flags.
//
// Config keys:
//   canvasID       (string)  canvas element id
//   widgetListKey  (string)  key in widgetList (for title/highLowEnabled lookup)
//   withArrow      (bool)    render trend-indicator arrow (true: tempBar01)
//   withAutoSwitch (bool)    switch mode between windchill/heatIndex based on
//                            real temperature (true: windchill)
//   modeKey        (string)  widgetList key holding the current .mode value
//                            (e.g. "windChill"); null for temp bars
//   titleSource    (object)  { mode: "static"|"dict", key, modeMap? }
//   tooltipSource  (object)  { mode: "static"|"dict", key, modeMap? }
//   dataFn         (function) returns [temp, high, low, trend?]
//   titleSuffix    (string)  appended to default temperature title

(function (global) {
    function TemperatureBarWidget(config) {
        config = config || {};
        var events = config.events ? config.events.slice() : ["clientRawDataUpdate"];
        if (!config.withArrow && events.indexOf("clientRawExtraDataUpdate") === -1) {
            events.push("clientRawExtraDataUpdate");
        }
        config.events = events;
        config.unitEvents = config.unitEvents || ["temp"];
        WidgetBar.call(this, config);
        this.largeDashTotal = 5;

        this.roundRectTop = null;
        this.roundRectFillTop = null;
        this.roundBot = null;
        this.roundBotFill = null;
        this.rectCommand = null;
        this.rectFillCommand = null;
        this.circCommand = null;
        this.circFillCommand = null;
        this.topStrokeCommand = null;
        this.botStrokeCommand = null;
        this.highMarker = null;
        this.highMarkerStrokeCommand = null;
        this.highMarkerStartCommand = null;
        this.highMarkerEndCommand = null;
        this.lowMarker = null;
        this.lowMarkerStrokeCommand = null;
        this.lowMarkerStartCommand = null;
        this.lowMarkerEndCommand = null;
        this.textDisplay = null;
        this.textTitle = null;
        this.highDisplay = null;
        this.lowDisplay = null;
        this.arrow = null;
        this.defaultMode = null;

        this.setupVars = {
            dashGap: null, barWidth: null, barFillWidth: null,
            barHeight: null, barFillHeight: null, circRad: null,
            fillCircRad: null, cornerRad: null, cornerFillRad: null,
            strokeSize: null, textSize: null, posBar: {},
            posCirc: {}, posFillCirc: {}, posFillBar: {}, posHLLabel: {},
            cutOffLength: null, minHLspace: null, posArrow: null,
            arrowLengthFactor: null
        };

        this.constants = {
            minTemp: -10, minTempDEFAULT: -10,
            maxTemp: 30,  maxTempDEFAULT: 30
        };

        this.tweens = {
            barFill:  { h: 0 },
            highTemp: { h: 1.04 },
            lowTemp:  { h: 1.04 }
        };

        this.values = {
            tempIn: 0, tempOut: 0,
            highTempIn: 0, highTempOut: 0,
            lowTempIn: 0, lowTempOut: 0,
            trend: 0, unitsIn: "temp"
        };

        this.valuesOld = { tempIn: 0, highTempIn: 0, lowTempIn: 0, trend: 0 };
    }
    WidgetBase.inherit(TemperatureBarWidget, WidgetBar);

    TemperatureBarWidget.prototype.attachTooltip = function () {
        if (typeof Opentip === "undefined") { return; }
        var text = this.resolveTooltip();
        this.tooltip = new Opentip(this.canvas, text, {
            background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"
        });
        if (this.config.modeKey) {
            widgetList[this.config.modeKey].tooltip = this.tooltip;
        }
    };

    TemperatureBarWidget.prototype.resolveTitle = function () {
        var src = this.config.titleSource;
        if (!src) {
            var wl = widgetList[this.config.widgetListKey],
                suffix = this.config.titleSuffix || "";
            return (wl && wl.title !== "default") ? wl.title : (useDict("temperatureTitle") + suffix);
        }
        if (src.mode === "dict") {
            if (src.modeMap && this.config.modeKey) {
                var m = widgetList[this.config.modeKey].mode;
                return useDict(src.modeMap[m]);
            }
            return useDict(src.key);
        }
        return src.key;
    };

    TemperatureBarWidget.prototype.resolveTooltip = function () {
        var src = this.config.tooltipSource;
        if (!src) { return ""; }
        if (src.mode === "dict") {
            if (src.modeMap && this.config.modeKey) {
                var m = widgetList[this.config.modeKey].mode;
                return useDict(src.modeMap[m]);
            }
            return useDict(src.key);
        }
        return src.key;
    };

    TemperatureBarWidget.prototype._readData = function () {
        if (this._bindingResolvers) {
            var v = this.readBindings();
            return [v.temp, v.high, v.low, v.trend];
        }
        return this.config.dataFn();
    };

    TemperatureBarWidget.prototype._runAutoSwitch = function () {
        var a = this.config.autoSwitchBindings;
        if (a && typeof DataBindings !== "undefined") {
            var compiled = this._autoSwitchCompiled ||
                (this._autoSwitchCompiled = DataBindings.compile(a));
            var v = DataBindings.read(compiled);
            this.autoSwitch(v.realTemp, v.realMin, v.realMax, v.chillMin, v.chillMax, v.heatMin, v.heatMax);
        } else {
            this.autoSwitch(
                arrayClientraw[4],  arrayClientraw[47], arrayClientraw[46],
                arrayClientraw[78], arrayClientraw[77],
                arrayClientraw[111], arrayClientraw[110]
            );
        }
    };

    TemperatureBarWidget.prototype.redrawForUnitChange = function () {
        if (this.config.withAutoSwitch) { this._runAutoSwitch(); }
        var d = this._readData();
        this.draw(d[0], d[1], d[2], d[3], true);
    };

    TemperatureBarWidget.prototype.onDataUpdate = function () {
        if (this.config.withAutoSwitch) { this._runAutoSwitch(); }
        var d = this._readData();
        this.draw(d[0], d[1], d[2], d[3]);
    };

    TemperatureBarWidget.prototype.autoSwitch = function (realTemp, realMin, realMax, chillMin, chillMax, heatMin, heatMax) {
        var key = this.config.modeKey;
        if (realTemp <= 10) { widgetList[key].mode = "windchill"; }
        else if (realTemp >= 18) { widgetList[key].mode = "heatIndex"; }
        else if ((realMin !== chillMin || realMax !== chillMax) && (realMin !== heatMin || realMax !== heatMax)) { widgetList[key].mode = this.defaultMode; }
        else if (realMin !== chillMin || realMax !== chillMax) { widgetList[key].mode = "windchill"; }
        else if (realMin !== heatMin  || realMax !== heatMax)  { widgetList[key].mode = "heatIndex"; }
        else { widgetList[key].mode = this.defaultMode; }
    };

    TemperatureBarWidget.prototype.formatInput = function () {
        var v = this.values, c = this.constants, ldt = this.largeDashTotal;

        v.tempIn    = formatDataToUnit(v.tempIn,    v.unitsIn);
        v.highTempIn = formatDataToUnit(v.highTempIn, v.unitsIn);
        v.lowTempIn  = formatDataToUnit(v.lowTempIn,  v.unitsIn);

        while (v.tempIn < c.minTemp || v.highTempIn < c.minTemp || v.lowTempIn < c.minTemp) { c.minTemp -= ldt - 1; }
        while (v.tempIn > c.maxTemp || v.highTempIn > c.maxTemp || v.lowTempIn > c.maxTemp) { c.maxTemp += ldt - 1; }

        while ((v.tempIn    >= c.minTemp + (ldt - 1) && c.minTemp < c.minTempDEFAULT) &&
               (v.highTempIn >= c.minTemp + (ldt - 1) && c.minTemp < c.minTempDEFAULT) &&
               (v.lowTempIn  >= c.minTemp + (ldt - 1) && c.minTemp < c.minTempDEFAULT)) { c.minTemp += ldt - 1; }
        while ((v.tempIn    <= c.maxTemp - (ldt - 1) && c.maxTemp > c.maxTempDEFAULT) &&
               (v.highTempIn <= c.maxTemp - (ldt - 1) && c.maxTemp > c.maxTempDEFAULT) &&
               (v.lowTempIn  <= c.maxTemp - (ldt - 1) && c.maxTemp > c.maxTempDEFAULT)) { c.maxTemp -= ldt - 1; }

        v.tempOut     = v.tempIn.map(c.minTemp, c.maxTemp, 0.1, 0.98);
        v.highTempOut = v.highTempIn.map(c.minTemp, c.maxTemp, 1.04, 0.17);
        v.lowTempOut  = v.lowTempIn.map(c.minTemp, c.maxTemp, 1.04, 0.17);
    };

    TemperatureBarWidget.prototype.draw = function (tempIn, highTempIn, lowTempIn, trend, unitChange) {
        var withArrow = !!this.config.withArrow,
            prevTrend = this.valuesOld.trend;
        trend = (trend === undefined) ? 0 : trend;

        if (!this.hasChanged({
                tempIn: tempIn, highTempIn: highTempIn,
                lowTempIn: lowTempIn, trend: trend
            }, unitChange)) {
            return;
        }

        this.values.tempIn     = Number(tempIn);
        this.values.highTempIn = Number(highTempIn);
        this.values.lowTempIn  = Number(lowTempIn);
        this.values.trend      = parseInt(trend, 10);

        this.formatInput();
        createjs.Tween.get(this.tweens.barFill,  { override: true }).to({ h: this.values.tempOut },     2000, createjs.Ease.quartInOut);
        createjs.Tween.get(this.tweens.highTemp, { override: true }).to({ h: this.values.highTempOut }, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(this.tweens.lowTemp,  { override: true }).to({ h: this.values.lowTempOut },  2000, createjs.Ease.quartInOut);

        if (this.config.titleSource && this.config.titleSource.modeMap) {
            this.textTitle.text = this.resolveTitle();
            if (this.config.modeKey && widgetList[this.config.modeKey].tooltip) {
                widgetList[this.config.modeKey].tooltip.setContent(this.resolveTooltip());
            }
        }

        if (withArrow && prevTrend !== trend) {
            this.updateTop();
        }

        this.refreshLabels();
    };

    TemperatureBarWidget.prototype.refreshLabels = function () {
        var v = this.values, c = this.constants, ldt = this.largeDashTotal,
            unitsKey = v.unitsIn.toString(),
            unitStr = units[unitsKey][currentUnits[unitsKey]][1].toString();
        this.highDisplay.text = v.highTempIn.toString() + unitStr;
        this.lowDisplay.text  = v.lowTempIn.toString() + unitStr;
        this.updateScaleLabels(ldt, c.minTemp, c.maxTemp);
        this.textDisplay.text = v.tempIn.toString() + unitStr;
    };

    TemperatureBarWidget.prototype.updateTweens = function () {
        var rc = this.rectCommand, rfc = this.rectFillCommand;

        rfc.h = this.tweens.barFill.h * (rc.h - rc.y);
        rfc.y = rc.h - rfc.h;

        this.highMarkerEndCommand.y = this.highMarkerStartCommand.y = this.tweens.highTemp.h * (rc.h - rc.y);
        this.lowMarkerEndCommand.y  = this.lowMarkerStartCommand.y  = this.tweens.lowTemp.h  * (rc.h - rc.y);

        var highLabelY = this.highMarkerEndCommand.y,
            lowLabelY  = this.lowMarkerEndCommand.y,
            minSpace   = this.setupVars.minHLspace * this.canvas.height,
            gap        = lowLabelY - highLabelY;
        if (gap < minSpace) {
            var pad = (minSpace - gap) / 2;
            highLabelY -= pad;
            lowLabelY  += pad;
        }
        this.highDisplay.y = highLabelY;
        this.lowDisplay.y  = lowLabelY;
    };

    TemperatureBarWidget.prototype.updateTop = function () {
        var c = this.canvas, ldt = this.largeDashTotal,
            sv = this.computeBarLayout({ fillWidthScale: 0.6, dashLengthRatio: 0.075 });

        sv.circRad         = c.height * 0.1;
        sv.fillCircRad     = sv.circRad * 0.85;
        sv.cornerRad       = sv.barWidth / 2;
        sv.cornerFillRad   = sv.barFillWidth / 2;
        sv.textSize        = c.height / 17;
        sv.textDisplaySize = c.height / 19;
        sv.textHLSize      = c.height / 21;
        sv.minHLspace      = 0.04;
        sv.arrowStroke        = sv.barWidth / 15;
        sv.arrowLengthFactor  = 0.04;

        sv.posCirc      = { x: c.height / 2, y: c.height * (3 / 4) + sv.circRad - sv.circRad / 10 };
        sv.posFillCirc  = { x: c.height / 2, y: c.height * (3 / 4) + sv.circRad - sv.circRad / 10 };
        sv.posTextTitle = { x: c.height / 2, y: (c.height - sv.barHeight) / 2 - sv.cornerRad };
        sv.posDash = {
            x: sv.posBar.x - sv.dashLength - sv.dashGap,
            y: (c.height - sv.barHeight) / 2 + sv.cornerRad / 2
        };
        sv.posHLLabel = { x: (c.height / 2) + (sv.barWidth / 2) + sv.dashGap };
        sv.posArrow = { x: c.width * 0.7, y: sv.posFillCirc.y };
        sv.cutOffLength = c.height * (299 / 400);

        this.topStrokeCommand.width = sv.strokeSize;
        this.rectCommand.x = sv.posBar.x;
        this.rectCommand.y = sv.posBar.y;
        this.rectCommand.w = sv.barWidth;
        this.rectCommand.h = sv.barHeight;
        this.rectCommand.radiusTR = this.rectCommand.radiusTL = this.rectCommand.radiusBR = this.rectCommand.radiusBL = sv.cornerRad;

        this.botStrokeCommand.width = sv.strokeSize;
        this.circCommand.x      = sv.posCirc.x;
        this.circCommand.y      = sv.posCirc.y;
        this.circCommand.radius = sv.circRad;

        this.drawLinearDashTrack({
            totalDashes: ldt * 10 - 9,
            orientation: "vertical",
            posDash: sv.posDash,
            dashLength: sv.dashLength,
            strokeSize: sv.strokeSize,
            majorEvery: 10,
            midEvery: 5,
            minorsEnabled: true,
            computeCoord: function (i) {
                return sharpenValue(sv.posDash.y + (((sv.cutOffLength * (24 / 25) - sv.posDash.y) / (ldt - 1)) - (((sv.cutOffLength * (24 / 25) - sv.posDash.y) % ((ldt - 1))) / ldt - 1)) * (i / 10));
            },
            labelX: (sv.posDash.x - sv.dashLength) * (6 / 5),
            textSize: sv.textSize
        });

        this.circFillCommand.x      = sv.posFillCirc.x;
        this.circFillCommand.y      = sv.posFillCirc.y;
        this.circFillCommand.radius = sv.fillCircRad;

        this.rectFillCommand.x = sv.posFillBar.x;
        this.rectFillCommand.w = sv.barFillWidth;
        this.rectFillCommand.radiusTR = this.rectFillCommand.radiusTL = this.rectFillCommand.radiusBR = this.rectFillCommand.radiusBL = sv.cornerFillRad;

        this.textDisplay.x    = sv.posFillCirc.x;
        this.textDisplay.y    = sv.posFillCirc.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        this.textTitle.x    = sv.posTextTitle.x;
        this.textTitle.y    = sv.posTextTitle.y;
        this.textTitle.font = "bold " + sv.textDisplaySize + "px arial";
        setFontMaxWidth(this.textTitle, this.canvas, this.stage);

        this.highMarkerStrokeCommand.width = sv.strokeSize * 4;
        this.highMarkerStartCommand.x = (c.height + sv.barWidth) / 2;
        this.highMarkerEndCommand.x   = (c.height - sv.barWidth) / 2;

        this.lowMarkerStrokeCommand.width = sv.strokeSize * 4;
        this.lowMarkerStartCommand.x = (c.height + sv.barWidth) / 2;
        this.lowMarkerEndCommand.x   = (c.height - sv.barWidth) / 2;

        this.highDisplay.x    = sv.posHLLabel.x;
        this.highDisplay.font = "bold " + sv.textHLSize + "px arial";
        this.lowDisplay.x     = sv.posHLLabel.x;
        this.lowDisplay.font  = "bold " + sv.textHLSize + "px arial";

        this.refreshLabels();
        this.updateTweens();

        if (!this._maskTop) {
            this._maskTop     = new createjs.Shape();
            this._maskTopFill = new createjs.Shape();
            this._maskBot     = new createjs.Shape();
            this.roundRectTop.mask     = this._maskTop;
            this.roundRectFillTop.mask = this._maskTopFill;
            this.roundBot.mask         = this._maskBot;
        }
        this._maskTop.graphics.clear().dr(0, 0, c.height, sv.cutOffLength);
        this._maskTopFill.graphics.clear().dr(0, 0, c.height, sv.cutOffLength * 1.1);
        this._maskBot.graphics.clear().dr(0, sv.cutOffLength, c.height, c.height);

        if (this.config.withArrow && this.arrow) {
            var arrowTop = 1 - sv.arrowLengthFactor,
                arrowBot = 1 + sv.arrowLengthFactor,
                trend    = this.values.trend;

            if (trend !== 0) {
                this.arrow.middleLine.visible = true;
                this.arrow.middleLineStrokeCommand.width = sv.arrowStroke;
                this.arrow.middleLineStartCommand.x = sv.posArrow.x;
                this.arrow.middleLineStartCommand.y = sv.posArrow.y * arrowTop;
                this.arrow.middleLineEndCommand.x   = sv.posArrow.x;
                this.arrow.middleLineEndCommand.y   = sv.posArrow.y * arrowBot;
            } else {
                this.arrow.middleLine.visible = false;
                this.arrow.pointerLine.graphics._stroke.style = "rgb(255, 221, 37)";
            }

            if (trend > 0) {
                this.arrow.pointerLine.graphics._stroke.style = "rgb(" + colour.temp + ")";
                this.arrow.middleLine.graphics._stroke.style  = "rgb(" + colour.temp + ")";
            } else if (trend < 0) {
                this.arrow.pointerLine.graphics._stroke.style = "rgb(" + colour.tempLow + ")";
                this.arrow.middleLine.graphics._stroke.style  = "rgb(" + colour.tempLow + ")";
            }

            this.arrow.pointerLineStrokeCommand.width = sv.arrowStroke;
            this.arrow.pointerLineStartCommand.x = sv.posArrow.x * arrowTop;
            this.arrow.pointerLineStartCommand.y = sv.posArrow.y;
            this.arrow.pointerLineMidCommand.x   = sv.posArrow.x;
            this.arrow.pointerLineMidCommand.y   = sv.posArrow.y * (1 - sv.arrowLengthFactor * trend);
            this.arrow.pointerLineEndCommand.x   = sv.posArrow.x * arrowBot;
            this.arrow.pointerLineEndCommand.y   = sv.posArrow.y;
        }
    };

    TemperatureBarWidget.prototype.aspectRatio = 2.0;

    TemperatureBarWidget.prototype.applyStageTransform = function () {
        this.stage.x = -(this.canvas.height / 4.5);
    };

    TemperatureBarWidget.prototype.setUp = function () {
        if (this.config.modeKey) {
            this.defaultMode = widgetList[this.config.modeKey].mode;
        }

        var ldt = this.largeDashTotal,
            wlKey = this.config.widgetListKey,
            wl = widgetList[wlKey];

        var top = this.createRoundedBar({ fill: "#F6F6F6" });
        this.roundRectTop = top.shape;
        this.topStrokeCommand = top.strokeCommand;
        this.rectCommand = top.rectCommand;

        var bot = this.createCircle({ stroke: "black", fill: "#F6F6F6" });
        this.roundBot = bot.shape;
        this.botStrokeCommand = bot.strokeCommand;
        this.circCommand = bot.circleCommand;

        this.createDashes(ldt * 10);

        var botFill = this.createCircle({ fill: "rgb(255, 221, 37)" });
        this.roundBotFill = botFill.shape;
        this.circFillCommand = botFill.circleCommand;

        var topFill = this.createRoundedBar({ fill: "rgb(255, 221, 37)", stroke: false });
        this.roundRectFillTop = topFill.shape;
        this.rectFillCommand = topFill.rectCommand;

        this.createLabels(ldt);

        this.textDisplay = this.createText("");
        this.textTitle   = this.createText(this.resolveTitle());

        var hi = this.createLine({ stroke: "rgb(" + colour.temp + ")", addToStage: false });
        this.highMarker = hi.shape;
        this.highMarkerStrokeCommand = hi.strokeCommand;
        this.highMarkerStartCommand  = hi.startCommand;
        this.highMarkerEndCommand    = hi.endCommand;

        var lo = this.createLine({ stroke: "rgb(" + colour.tempLow + ")", addToStage: false });
        this.lowMarker = lo.shape;
        this.lowMarkerStrokeCommand = lo.strokeCommand;
        this.lowMarkerStartCommand  = lo.startCommand;
        this.lowMarkerEndCommand    = lo.endCommand;

        this.highDisplay = this.createText("", { align: "left", color: "rgb(" + colour.temp + ")" });
        this.stage.removeChild(this.highDisplay);
        this.lowDisplay = this.createText("", { align: "left", color: "rgb(" + colour.tempLow + ")" });
        this.stage.removeChild(this.lowDisplay);

        if (wl && wl.highLowEnabled) {
            this.stage.addChild(this.highMarker);
            this.stage.addChild(this.lowMarker);
            this.stage.addChild(this.highDisplay);
            this.stage.addChild(this.lowDisplay);
        }

        if (this.config.withArrow) {
            this.arrow = this.createTrendArrow({ color: "rgb(" + colour.temp + ")" });
        }
    };

    global.TemperatureBarWidget = TemperatureBarWidget;
})(typeof window !== "undefined" ? window : this);
