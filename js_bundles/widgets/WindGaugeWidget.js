/*jslint plusplus: true, sloppy: true, indent: 4 */
// WindGaugeWidget: circular gauge with two rotating pointers (current + avg wind direction).
// canvasID: "WindGauge01", data: arrayClientraw[3] (dir), arrayClientraw[117] (avg dir).

(function (global) {
    function WindGaugeWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "WindGauge01";
        config.elementId = config.elementId || config.canvasID;
        config.events = config.events || ["clientRawDataUpdate"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("windDirectionDescription") : "");
        WidgetGauge.call(this, config);
        this.outerCircle = null;
        this.innerCircle = null;
        this.innerDot = null;
        this.outerCircleStrokeCommand = null;
        this.outerCircleCommand = null;
        this.innerCircleCommand = null;
        this.innerDotCommand = null;
        this.pointer = null;
        this.pointerAvg = null;
        this.dash = [];
        this.dashStrokeCommand = [];
        this.dashStartCommand = [];
        this.dashEndCommand = [];
        this.label = [];
        this.largeDashTotal = 8;
        this.textDisplay = null;
        this.avgDisplay = null;
        this.pointerCommand = { tip: null, lBase: null, rBase: null };
        this.pointerAvgCommand = { tip: null, lBase: null, rBase: null };
        this.setupVars = {
            outerCircleRad: null, innerCricleRad: null,
            posOuterCircle: null, posInnerCircle: null,
            posPointer: null, strokeSize: null, dashEndRad: null,
            posBotLine: null, labelCentreRad: null,
            textSize: null, textDisplaySize: null,
            posTextDisplay: null, avgDisplaySize: null, posAvgDisplay: null
        };
        this.tweens = { r: { r: 0 }, aR: { aR: 0 } };
        this.values = {
            windIn: 0, windOut: 0, windOld: 0,
            avgIn: 0,  avgOut: 0,  avgOld: 0,
            unitsIn: "wind"
        };
        this.valuesOld = { windIn: 0, avgIn: 0 };
    }
    WidgetBase.inherit(WindGaugeWidget, WidgetGauge);

    WindGaugeWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.direction, v.avg);
    };

    WindGaugeWidget.prototype.draw = function (windIn, avgIn, unitChange) {
        unitChange = unitChange || false;
        if (this.valuesOld.windIn == windIn && this.valuesOld.avgIn == avgIn && unitChange !== true) { return; }

        windIn = parseFloat(windIn, 0);
        avgIn  = parseFloat(avgIn, 0);
        this.textDisplay.text = windIn.toString() + "\xB0";
        this.avgDisplay.text  = avgIn.toString() + "\xB0";

        var angleDiff    = windIn - (this.values.windOld % 360),
            avgAngleDiff = avgIn  - (this.values.avgOld  % 360);

        if (Math.abs(angleDiff) < 180) {
            this.values.windOut = this.values.windOld + angleDiff;
        } else if (this.values.windOld > windIn) {
            this.values.windOut = this.values.windOld + angleDiff + 360;
        } else if (this.values.windOld < windIn) {
            this.values.windOut = this.values.windOld + angleDiff - 360;
        }

        if (Math.abs(avgAngleDiff) < 180) {
            this.values.avgOut = this.values.avgOld + avgAngleDiff;
        } else if (this.values.avgOld > avgIn) {
            this.values.avgOut = this.values.avgOld + avgAngleDiff + 360;
        } else if (this.values.avgOld < avgIn) {
            this.values.avgOut = this.values.avgOld + avgAngleDiff - 360;
        }

        createjs.Tween.get(this.tweens.r,  { override: true }).to({ r:  this.values.windOut }, 2000, createjs.Ease.quartInOut);
        createjs.Tween.get(this.tweens.aR, { override: true }).to({ aR: this.values.avgOut  }, 2000, createjs.Ease.quartInOut);

        this.values.windOld = this.values.windOut;
        this.values.avgOld  = this.values.avgOut;
        this.valuesOld.windIn = windIn;
        this.valuesOld.avgIn  = avgIn;
    };

    WindGaugeWidget.prototype.updateTweens = function () {
        this.pointer.rotation    = this.tweens.r.r;
        this.pointerAvg.rotation = this.tweens.aR.aR;
    };

    WindGaugeWidget.prototype.updateTop = function () {
        var sv = this.setupVars, c = this.canvas, ldt = this.largeDashTotal;

        sv.outerCircleRad  = c.width * 0.30;
        sv.innerCricleRad  = c.width * 0.05;
        sv.strokeSize      = c.width / 80;
        sv.dashEndRad      = sv.outerCircleRad * (48 / 40);
        sv.labelCentreRad  = sv.outerCircleRad * (68 / 50);
        sv.textSize        = c.width / 15;
        sv.textDisplaySize = c.width / 10;
        sv.avgDisplaySize  = c.width / 12;

        sv.posOuterCircle  = { x: c.width / 2, y: c.height / 2 };
        sv.posInnerCircle  = { x: c.width / 2, y: c.height / 2 };
        sv.posPointer = {
            xT: c.width / 2,         yT: c.height * (1 / 5),
            xL: c.width * (97 / 200), yL: c.height * (3 / 5),
            xR: c.width * (103 / 200), yR: c.height * (3 / 5)
        };
        sv.posPointerAvg = {
            xT: c.width / 2,         yT: sv.outerCircleRad * (33 / 50),
            xL: c.width * (90 / 200), yL: sv.outerCircleRad * (4 / 5),
            xR: c.width * (110 / 200), yR: sv.outerCircleRad * (4 / 5)
        };
        sv.posTextDisplay = { x: sv.posOuterCircle.x, y: sv.outerCircleRad * (74 / 30) };
        sv.posAvgDisplay  = { x: sv.posOuterCircle.x, y: sv.outerCircleRad * (65 / 30) };

        this.outerCircleStrokeCommand.width = sv.strokeSize;
        this.outerCircleCommand.x      = sv.posOuterCircle.x;
        this.outerCircleCommand.y      = sv.posOuterCircle.y;
        this.outerCircleCommand.radius = sv.outerCircleRad;

        this.innerCircleCommand.x      = sv.posInnerCircle.x;
        this.innerCircleCommand.y      = sv.posInnerCircle.y;
        this.innerCircleCommand.radius = sv.innerCricleRad;

        this.innerDotCommand.x      = sv.posInnerCircle.x;
        this.innerDotCommand.y      = sv.posInnerCircle.y;
        this.innerDotCommand.radius = sv.innerCricleRad / 4;

        this.textDisplay.x    = sv.posTextDisplay.x;
        this.textDisplay.y    = sv.posTextDisplay.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        this.avgDisplay.x    = sv.posAvgDisplay.x;
        this.avgDisplay.y    = sv.posAvgDisplay.y;
        this.avgDisplay.font = "bold " + sv.avgDisplaySize + "px arial";

        this.pointerAvgCommand.tip.x    = sv.posPointerAvg.xT;
        this.pointerAvgCommand.tip.y    = sv.posPointerAvg.yT;
        this.pointerAvgCommand.lBase.x  = sv.posPointerAvg.xL;
        this.pointerAvgCommand.lBase.y  = sv.posPointerAvg.yL;
        this.pointerAvgCommand.rBase.x  = sv.posPointerAvg.xR;
        this.pointerAvgCommand.rBase.y  = sv.posPointerAvg.yR;
        this.pointerAvg.regX = c.width / 2;
        this.pointerAvg.regY = c.height / 2;
        this.pointerAvg.x    = c.width / 2;
        this.pointerAvg.y    = c.height / 2;

        this.pointerCommand.tip.x   = sv.posPointer.xT;
        this.pointerCommand.tip.y   = sv.posPointer.yT;
        this.pointerCommand.lBase.x = sv.posPointer.xL;
        this.pointerCommand.lBase.y = sv.posPointer.yL;
        this.pointerCommand.rBase.x = sv.posPointer.xR;
        this.pointerCommand.rBase.y = sv.posPointer.yR;
        this.pointer.regX = c.width / 2;
        this.pointer.regY = c.height / 2;
        this.pointer.x    = c.width / 2;
        this.pointer.y    = c.height / 2;

        this.drawRadialRing({
            cx: c.width / 2,
            cy: c.height / 2,
            outerR: sv.outerCircleRad,
            innerR: sv.dashEndRad,
            minorInnerR: (sv.dashEndRad + sv.outerCircleRad) / 2,
            count: ldt,
            minorsBetween: 1,
            strokeSize: sv.strokeSize,
            labelRadius: sv.labelCentreRad,
            labelFontSize: sv.textSize
        });
    };

    WindGaugeWidget.prototype.aspectRatio = 1.0;

    WindGaugeWidget.prototype.setUp = function () {
        var s = this.stage, ldt = this.largeDashTotal, i;
        var labelKeys = [
            "windDirectionLabelS",  "windDirectionLabelSW",
            "windDirectionLabelW",  "windDirectionLabelNW",
            "windDirectionLabelN",  "windDirectionLabelNE",
            "windDirectionLabelE",  "windDirectionLabelSE"
        ];

        var outer = this.createCircle({ stroke: "black", fill: "#F6F6F6" });
        this.outerCircle = outer.shape;
        this.outerCircleStrokeCommand = outer.strokeCommand;
        this.outerCircleCommand       = outer.circleCommand;

        var avgPtr = this.createTrianglePointer({ fill: "rgb(" + colour.wind + ")" });
        this.pointerAvg = avgPtr.shape;
        this.pointerAvgCommand = avgPtr.commands;

        var mainPtr = this.createTrianglePointer({ fill: "black" });
        this.pointer = mainPtr.shape;
        this.pointerCommand = mainPtr.commands;

        var inner = this.createCircle({ fill: "black" });
        this.innerCircle = inner.shape;
        this.innerCircleCommand = inner.circleCommand;

        var dot = this.createCircle({ fill: "rgb(" + colour.wind + ")" });
        this.innerDot = dot.shape;
        this.innerDotCommand = dot.circleCommand;

        this.textDisplay = this.createText("0\xB0");
        this.avgDisplay  = this.createText("0\xB0", { color: "rgb(" + colour.wind + ")" });

        this.createLabels(ldt, { align: "center" });
        for (i = 0; i < ldt; i++) {
            this.label[i].text = useDict(labelKeys[i]).toString();
        }

        this.createDashes(ldt * 2);
    };

    global.WindGaugeWidget = WindGaugeWidget;
})(typeof window !== "undefined" ? window : this);
