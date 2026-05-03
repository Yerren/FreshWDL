/*jslint plusplus: true, sloppy: true, indent: 4 */
// WindSpeedGaugeWidget: speedometer-style arc gauge for wind speed and gust.
// Main speed pointer (narrow black needle) + small gust triangle at the outer
// edge (same proportions as the avg-direction pointer in WindGaugeWidget) +
// optional Beaufort scale label. Tick scale auto-adjusts like UniBarWidget.
//
// Config options:
//   withBeaufort  – show Beaufort scale text below gauge (default true)
//   title         – override display title
//
// Bindings: speed, gust

(function (global) {
    function WindSpeedGaugeWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "WindSpeedGauge01";
        config.events = config.events || ["clientRawDataUpdate"];
        config.unitEvents = config.unitEvents || ["wind"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("windSpeedDescription") : "");
        WidgetGauge.call(this, config);

        this.outerCircle = null;
        this.innerCircle = null;
        this.innerDot = null;
        this.outerCircleStrokeCommand = null;
        this.outerCircleCommand = null;
        this.innerCircleCommand = null;
        this.innerDotCommand = null;
        this.pointer = null;
        this.pointerGust = null;
        this.pointerCommand = null;
        this.pointerGustCommand = null;
        this.botLine = null;
        this.botLineStrokeCommand = null;
        this.botLineStartCommand = null;
        this.botLineEndCommand = null;
        this.textTitle = null;
        this.textDisplay = null;
        this.textBeaufort = null;

        this.largeDashTotal = 6;
        this.scaleSequence = [2.0, 2.5, 2.0];
        this.scalePos = -1;

        this.constants = {
            minSpeed: 0, maxSpeed: 10, maxSpeedDEFAULT: 10, actualMaxPercent: 0.75
        };

        this.setupVars = {};
        this.tweens = { r: { r: 0 }, gust: { gust: 0 } };
        this.values = {
            speedIn: 0, speedOut: 0, speedOriginal: 0,
            gustIn: 0,  gustOut: 0,
            unitsIn: "wind"
        };
        this.valuesOld = { speedIn: 0, gustIn: 0 };
    }
    WidgetBase.inherit(WindSpeedGaugeWidget, WidgetGauge);

    WindSpeedGaugeWidget.prototype.setUp = function () {
        var outer = this.createCircle({ stroke: "black", fill: "#F6F6F6" });
        this.outerCircle = outer.shape;
        this.outerCircleStrokeCommand = outer.strokeCommand;
        this.outerCircleCommand = outer.circleCommand;

        var bot = this.createLine({ stroke: "black" });
        this.botLine = bot.shape;
        this.botLineStrokeCommand = bot.strokeCommand;
        this.botLineStartCommand = bot.startCommand;
        this.botLineEndCommand = bot.endCommand;

        // Gust triangle drawn first so it sits behind the speed pointer.
        var gustPtr = this.createTrianglePointer({ fill: "rgb(" + colour.windGust + ")" });
        this.pointerGust = gustPtr.shape;
        this.pointerGustCommand = gustPtr.commands;

        var ptr = this.createTrianglePointer({ fill: "black" });
        this.pointer = ptr.shape;
        this.pointerCommand = ptr.commands;

        var inner = this.createCircle({ fill: "black" });
        this.innerCircle = inner.shape;
        this.innerCircleCommand = inner.circleCommand;

        var dot = this.createCircle({ fill: "rgb(" + colour.wind + ")" });
        this.innerDot = dot.shape;
        this.innerDotCommand = dot.circleCommand;

        this.textDisplay = this.createText(" ");
        this.textTitle = this.createText(
            this.config.title || (typeof useDict === "function" ? useDict("windSpeedTitle") : "Wind Speed")
        );

        this.createLabels(this.largeDashTotal, { align: "center" });
        this.createDashes(this.largeDashTotal * 2);

        if (this.config.withBeaufort !== false) {
            this.textBeaufort = this.createText(" ");
        }
    };

    WindSpeedGaugeWidget.prototype._autoRescaleMax = function (maxVal) {
        var c = this.constants, seq = this.scaleSequence;
        while (maxVal > c.maxSpeed * c.actualMaxPercent) {
            this.scalePos = (this.scalePos + 1) % seq.length;
            c.maxSpeed *= seq[this.scalePos];
        }
        while (maxVal <= (c.maxSpeed / seq[this.scalePos]) * c.actualMaxPercent && c.maxSpeed > c.maxSpeedDEFAULT) {
            c.maxSpeed /= seq[this.scalePos];
            this.scalePos = this.scalePos - 1;
            this.scalePos = (this.scalePos % seq.length + seq.length) % seq.length;
        }
    };

    WindSpeedGaugeWidget.prototype._beaufortGradient = function (b) {
        var center = 128, width = 127, f = 0.42, i = 10 + b;
        return [
            Math.floor(Math.sin(f * i + 0) * width + center),
            Math.floor(Math.sin(f * i + 2) * width + center),
            Math.floor(Math.sin(f * i + 4) * width + center)
        ];
    };

    WindSpeedGaugeWidget.prototype.formatInput = function () {
        var v = this.values, c = this.constants, sv = this.setupVars,
            halfAngleDeg = sv.halfAngleDeg || 120;
        v.speedIn = formatDataToUnit(v.speedIn, v.unitsIn);
        v.gustIn  = formatDataToUnit(v.gustIn,  v.unitsIn);
        this._autoRescaleMax(Math.max(v.speedIn, v.gustIn));
        v.speedOut = mapRange(v.speedIn, c.minSpeed, c.maxSpeed, -halfAngleDeg, halfAngleDeg);
        v.gustOut  = mapRange(v.gustIn,  c.minSpeed, c.maxSpeed, -halfAngleDeg, halfAngleDeg);
    };

    WindSpeedGaugeWidget.prototype.draw = function (speedIn, gustIn, unitChange) {
        unitChange = unitChange || false;
        if (String(this.valuesOld.speedIn) !== String(speedIn) ||
                String(this.valuesOld.gustIn)  !== String(gustIn)  ||
                unitChange === true) {

            this.values.speedOriginal = parseFloat(speedIn);
            this.values.speedIn = parseFloat(speedIn);
            this.values.gustIn  = parseFloat(gustIn);
            this.formatInput();

            createjs.Tween.get(this.tweens.r,    { override: true }).to({ r:    this.values.speedOut }, 2000, createjs.Ease.quartInOut);
            createjs.Tween.get(this.tweens.gust, { override: true }).to({ gust: this.values.gustOut  }, 2000, createjs.Ease.quartInOut);

            var unitStr = (typeof units !== "undefined" && typeof currentUnits !== "undefined")
                ? units[this.values.unitsIn][currentUnits[this.values.unitsIn]][1].toString()
                : "";
            this.textDisplay.text = this.values.speedIn.toString() + unitStr;

            if (this.textBeaufort && typeof calculateBeaufort === "function") {
                var b = calculateBeaufort(this.values.speedOriginal);
                var grad = this._beaufortGradient(b);
                var bTitle = typeof useDict === "function" ? useDict("beaufortScaleTitle") : "Beaufort";
                this.textBeaufort.text  = bTitle + ": " + b.toString();
                this.textBeaufort.color = "rgb(" + grad[0] + "," + grad[1] + "," + grad[2] + ")";
            }

            this.valuesOld.speedIn = speedIn;
            this.valuesOld.gustIn  = gustIn;
        }
    };

    WindSpeedGaugeWidget.prototype.updateTweens = function () {
        this.pointer.rotation     = this.tweens.r.r;
        this.pointerGust.rotation = this.tweens.gust.gust;
        for (var i = 0; i < this.largeDashTotal; i++) {
            this.label[i].text = Math.round(
                this.constants.maxSpeed * i / (this.largeDashTotal - 1)
            ).toString();
        }
    };

    WindSpeedGaugeWidget.prototype.updateTop = function () {
        var sv = this.setupVars, c = this.canvas, ldt = this.largeDashTotal;

        sv.outerCircleRad  = c.width * 0.4;
        sv.innerCircleRad  = c.width * 0.05;
        sv.cutOffLength    = sv.outerCircleRad * 2;
        sv.strokeSize      = c.width / 80;
        sv.dashEndRad      = sv.outerCircleRad * (3 / 4);
        sv.labelCentreRad  = sv.outerCircleRad * (5 / 8);
        sv.textSize        = c.width / 15;
        sv.textTitleSize   = c.width / 13;
        sv.textDisplaySize = c.width / 10;
        sv.beaufortSize    = c.width / 9;

        sv.posOuterCircle  = { x: c.width / 2, y: c.height / 2 };
        sv.posInnerCircle  = { x: c.width / 2, y: c.height / 2 };

        // Speed pointer: narrow needle, same proportions as humidity gauge.
        sv.posPointer = {
            xT: c.width / 2,           yT: c.height * (1 / 5),
            xL: c.width * (97 / 200),  yL: c.height * (3 / 5),
            xR: c.width * (103 / 200), yR: c.height * (3 / 5)
        };
        // Gust triangle: same proportions as avg pointer in WindGaugeWidget.
        // Tip is at the outer-circle edge; base sits 1/7 of the radius inward;
        // width is 1/3 of the radius (matching WindGaugeWidget's 90/110 split
        // scaled to this gauge's larger circle).
        sv.posPointerGust = {
            xT: c.width / 2,
            yT: c.height / 2 - sv.outerCircleRad,
            xL: c.width / 2 - sv.outerCircleRad / 6,
            yL: c.height / 2 - sv.outerCircleRad * (6 / 7),
            xR: c.width / 2 + sv.outerCircleRad / 6,
            yR: c.height / 2 - sv.outerCircleRad * (6 / 7)
        };

        sv.posBotLine = {
            xL: sv.posOuterCircle.x - Math.sqrt(
                Math.pow(sv.outerCircleRad, 2) - Math.pow(sv.cutOffLength - sv.posOuterCircle.y, 2)
            ),
            xR: sv.posOuterCircle.x + Math.sqrt(
                Math.pow(sv.outerCircleRad, 2) - Math.pow(sv.cutOffLength - sv.posOuterCircle.y, 2)
            ),
            y: sv.cutOffLength - sv.strokeSize / 10
        };

        sv.posTextDisplay = { x: sv.posOuterCircle.x, y: sv.cutOffLength * (103 / 110) };
        sv.posTextTitle   = { x: sv.posOuterCircle.x, y: sv.cutOffLength * (110 / 103) };
        sv.posBeaufort    = { x: sv.posOuterCircle.x, y: c.height * 0.95 };

        // Cache arc half-angle for use in formatInput().
        sv.halfAngleDeg = (Math.PI - Math.acos(
            (sv.cutOffLength - sv.posOuterCircle.y) / sv.outerCircleRad
        )) * (180 / Math.PI);

        this.outerCircleStrokeCommand.width = sv.strokeSize;
        this.outerCircleCommand.x      = sv.posOuterCircle.x;
        this.outerCircleCommand.y      = sv.posOuterCircle.y;
        this.outerCircleCommand.radius = sv.outerCircleRad;

        this.botLineStrokeCommand.width = sv.strokeSize;
        this.botLineStartCommand.x = sv.posBotLine.xL;
        this.botLineStartCommand.y = sv.posBotLine.y;
        this.botLineEndCommand.x   = sv.posBotLine.xR;
        this.botLineEndCommand.y   = sv.posBotLine.y;

        this.innerCircleCommand.x      = sv.posInnerCircle.x;
        this.innerCircleCommand.y      = sv.posInnerCircle.y;
        this.innerCircleCommand.radius = sv.innerCircleRad;

        this.innerDotCommand.x      = sv.posInnerCircle.x;
        this.innerDotCommand.y      = sv.posInnerCircle.y;
        this.innerDotCommand.radius = sv.innerCircleRad / 4;

        this.textDisplay.x    = sv.posTextDisplay.x;
        this.textDisplay.y    = sv.posTextDisplay.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        this.textTitle.x    = sv.posTextTitle.x;
        this.textTitle.y    = sv.posTextTitle.y;
        this.textTitle.font = "bold " + sv.textTitleSize + "px arial";
        setFontMaxWidth(this.textTitle, c, this.stage);

        if (this.textBeaufort) {
            this.textBeaufort.x    = sv.posBeaufort.x;
            this.textBeaufort.y    = sv.posBeaufort.y;
            this.textBeaufort.font = "bold " + sv.beaufortSize + "px arial";
        }

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

        this.pointerGustCommand.tip.x   = sv.posPointerGust.xT;
        this.pointerGustCommand.tip.y   = sv.posPointerGust.yT;
        this.pointerGustCommand.lBase.x = sv.posPointerGust.xL;
        this.pointerGustCommand.lBase.y = sv.posPointerGust.yL;
        this.pointerGustCommand.rBase.x = sv.posPointerGust.xR;
        this.pointerGustCommand.rBase.y = sv.posPointerGust.yR;
        this.pointerGust.regX = c.width / 2;
        this.pointerGust.regY = c.height / 2;
        this.pointerGust.x    = c.width / 2;
        this.pointerGust.y    = c.height / 2;

        if (!this._maskShape) {
            this._maskShape = new createjs.Shape();
            this.outerCircle.mask = this._maskShape;
        }
        this._maskShape.graphics.clear().dr(0, 0, c.width, sv.cutOffLength);

        var halfAngle = Math.PI - Math.acos(
            (sv.cutOffLength - sv.posOuterCircle.y) / sv.outerCircleRad
        );
        this.drawRadialDashesAndLabels({
            cx: c.width / 2,
            cy: c.height / 2,
            outerR: sv.outerCircleRad,
            innerR: sv.dashEndRad,
            minorInnerR: (sv.dashEndRad + sv.outerCircleRad) / 2,
            count: ldt,
            minorsBetween: 1,
            halfAngle: halfAngle,
            strokeSize: sv.strokeSize,
            labelRadius: sv.labelCentreRad,
            labelFontSize: sv.textSize
        });
    };

    WindSpeedGaugeWidget.prototype.aspectRatio = 1.1;

    WindSpeedGaugeWidget.prototype.applyStageTransform = function () {
        this.stage.y = this.canvas.height * -0.09;
    };

    WindSpeedGaugeWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.speed, v.gust);
    };

    WindSpeedGaugeWidget.prototype.redrawForUnitChange = function () {
        var v = this.readBindings();
        this.draw(v.speed, v.gust, true);
    };

    global.WindSpeedGaugeWidget = WindSpeedGaugeWidget;
})(typeof window !== "undefined" ? window : this);
