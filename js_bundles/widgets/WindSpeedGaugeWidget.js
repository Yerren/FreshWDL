/*jslint plusplus: true, sloppy: true, indent: 4 */
// WindSpeedGaugeWidget: speedometer-style arc gauge for wind speed and gust.
// Up to two main needle arrows (green = speed, purple = gust) and two small
// outer-edge triangle max markers (green = speedMax, purple = gustMax).
// Tick scale auto-adjusts like UniBarWidget.
//
// Config options:
//   withBeaufort  – show Beaufort scale text below gauge (default true)
//   title         – override display title
//
// Bindings: speed (required), gust, speedMax, gustMax

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
        this.pointerSpeedMax = null;
        this.pointerGustMax = null;
        this.pointerCommand = null;
        this.pointerGustCommand = null;
        this.pointerSpeedMaxCommand = null;
        this.pointerGustMaxCommand = null;
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
        this.tweens = {
            r:        { r:        0 },
            gust:     { gust:     0 },
            speedMax: { speedMax: 0 },
            gustMax:  { gustMax:  0 }
        };
        this.values = {
            speedIn: 0, speedOut: 0, speedOriginal: 0,
            gustIn:  0, gustOut:  0,
            speedMaxIn: 0, speedMaxOut: 0,
            gustMaxIn:  0, gustMaxOut:  0,
            unitsIn: "wind"
        };
        this.valuesOld = { speedIn: 0, gustIn: 0, speedMaxIn: 0, gustMaxIn: 0 };
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

        // Gust needle behind speed needle.
        var gustPtr = this.createTrianglePointer({ fill: "rgb(" + colour.windGust + ")" });
        this.pointerGust = gustPtr.shape;
        this.pointerGustCommand = gustPtr.commands;
        this.pointerGust.visible = false;

        var ptr = this.createTrianglePointer({ fill: "rgb(" + colour.wind + ")" });
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

        // Max markers added after dashes so they render in front of the tick marks.
        var speedMaxPtr = this.createTrianglePointer({ fill: "rgb(" + colour.wind + ")" });
        this.pointerSpeedMax = speedMaxPtr.shape;
        this.pointerSpeedMaxCommand = speedMaxPtr.commands;
        this.pointerSpeedMax.visible = false;

        var gustMaxPtr = this.createTrianglePointer({ fill: "rgb(" + colour.windGust + ")" });
        this.pointerGustMax = gustMaxPtr.shape;
        this.pointerGustMaxCommand = gustMaxPtr.commands;
        this.pointerGustMax.visible = false;

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
        v.speedIn    = formatDataToUnit(v.speedIn,    v.unitsIn);
        v.gustIn     = formatDataToUnit(v.gustIn,     v.unitsIn);
        v.speedMaxIn = formatDataToUnit(v.speedMaxIn, v.unitsIn);
        v.gustMaxIn  = formatDataToUnit(v.gustMaxIn,  v.unitsIn);
        this._autoRescaleMax(Math.max(v.speedIn, v.gustIn, v.speedMaxIn, v.gustMaxIn));
        v.speedOut    = mapRange(v.speedIn,    c.minSpeed, c.maxSpeed, -halfAngleDeg, halfAngleDeg);
        v.gustOut     = mapRange(v.gustIn,     c.minSpeed, c.maxSpeed, -halfAngleDeg, halfAngleDeg);
        v.speedMaxOut = mapRange(v.speedMaxIn, c.minSpeed, c.maxSpeed, -halfAngleDeg, halfAngleDeg);
        v.gustMaxOut  = mapRange(v.gustMaxIn,  c.minSpeed, c.maxSpeed, -halfAngleDeg, halfAngleDeg);
    };

    WindSpeedGaugeWidget.prototype.draw = function (speedIn, gustIn, speedMaxIn, gustMaxIn, unitChange) {
        unitChange = unitChange || false;
        var v = this.values;
        if (String(this.valuesOld.speedIn)    !== String(speedIn)    ||
                String(this.valuesOld.gustIn)     !== String(gustIn)     ||
                String(this.valuesOld.speedMaxIn) !== String(speedMaxIn) ||
                String(this.valuesOld.gustMaxIn)  !== String(gustMaxIn)  ||
                unitChange === true) {

            v.speedOriginal = parseFloat(speedIn);
            v.speedIn       = parseFloat(speedIn)    || 0;
            v.gustIn        = parseFloat(gustIn)     || 0;
            v.speedMaxIn    = parseFloat(speedMaxIn) || 0;
            v.gustMaxIn     = parseFloat(gustMaxIn)  || 0;

            this.pointerGust.visible     = gustIn     != null && gustIn     !== "";
            this.pointerSpeedMax.visible = speedMaxIn != null && speedMaxIn !== "";
            this.pointerGustMax.visible  = gustMaxIn  != null && gustMaxIn  !== "";

            this.formatInput();

            createjs.Tween.get(this.tweens.r,        { override: true }).to({ r:        v.speedOut    }, 2000, createjs.Ease.quartInOut);
            createjs.Tween.get(this.tweens.gust,     { override: true }).to({ gust:     v.gustOut     }, 2000, createjs.Ease.quartInOut);
            createjs.Tween.get(this.tweens.speedMax, { override: true }).to({ speedMax: v.speedMaxOut }, 2000, createjs.Ease.quartInOut);
            createjs.Tween.get(this.tweens.gustMax,  { override: true }).to({ gustMax:  v.gustMaxOut  }, 2000, createjs.Ease.quartInOut);

            var unitStr = (typeof units !== "undefined" && typeof currentUnits !== "undefined")
                ? units[v.unitsIn][currentUnits[v.unitsIn]][1].toString()
                : "";
            this.textDisplay.text = v.speedIn.toString() + unitStr;

            if (this.textBeaufort && typeof calculateBeaufort === "function") {
                var b = calculateBeaufort(v.speedOriginal);
                var grad = this._beaufortGradient(b);
                var bTitle = typeof useDict === "function" ? useDict("beaufortScaleTitle") : "Beaufort";
                this.textBeaufort.text  = bTitle + ": " + b.toString();
                this.textBeaufort.color = "rgb(" + grad[0] + "," + grad[1] + "," + grad[2] + ")";
            }

            this.valuesOld.speedIn    = speedIn;
            this.valuesOld.gustIn     = gustIn;
            this.valuesOld.speedMaxIn = speedMaxIn;
            this.valuesOld.gustMaxIn  = gustMaxIn;
        }
    };

    WindSpeedGaugeWidget.prototype.updateTweens = function () {
        this.pointer.rotation         = this.tweens.r.r;
        this.pointerGust.rotation     = this.tweens.gust.gust;
        this.pointerSpeedMax.rotation = this.tweens.speedMax.speedMax;
        this.pointerGustMax.rotation  = this.tweens.gustMax.gustMax;
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

        // Speed and gust needles share the same narrow-needle geometry.
        sv.posPointer = {
            xT: c.width / 2,           yT: c.height * (1 / 5),
            xL: c.width * (97 / 200),  yL: c.height * (3 / 5),
            xR: c.width * (103 / 200), yR: c.height * (3 / 5)
        };

        // Max markers: small triangle at the outer edge, noticeably narrower
        // than the needle base so they read as reference marks not live arrows.
        sv.posPointerMax = {
            xT: c.width / 2,
            yT: c.height / 2 - sv.outerCircleRad,
            xL: c.width / 2 - sv.outerCircleRad / 10,
            yL: c.height / 2 - sv.outerCircleRad * (11 / 12),
            xR: c.width / 2 + sv.outerCircleRad / 10,
            yR: c.height / 2 - sv.outerCircleRad * (11 / 12)
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

        // Speed needle (green).
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

        // Gust needle (purple) – same shape as speed needle.
        this.pointerGustCommand.tip.x   = sv.posPointer.xT;
        this.pointerGustCommand.tip.y   = sv.posPointer.yT;
        this.pointerGustCommand.lBase.x = sv.posPointer.xL;
        this.pointerGustCommand.lBase.y = sv.posPointer.yL;
        this.pointerGustCommand.rBase.x = sv.posPointer.xR;
        this.pointerGustCommand.rBase.y = sv.posPointer.yR;
        this.pointerGust.regX = c.width / 2;
        this.pointerGust.regY = c.height / 2;
        this.pointerGust.x    = c.width / 2;
        this.pointerGust.y    = c.height / 2;

        // Speed max marker (green small triangle).
        this.pointerSpeedMaxCommand.tip.x   = sv.posPointerMax.xT;
        this.pointerSpeedMaxCommand.tip.y   = sv.posPointerMax.yT;
        this.pointerSpeedMaxCommand.lBase.x = sv.posPointerMax.xL;
        this.pointerSpeedMaxCommand.lBase.y = sv.posPointerMax.yL;
        this.pointerSpeedMaxCommand.rBase.x = sv.posPointerMax.xR;
        this.pointerSpeedMaxCommand.rBase.y = sv.posPointerMax.yR;
        this.pointerSpeedMax.regX = c.width / 2;
        this.pointerSpeedMax.regY = c.height / 2;
        this.pointerSpeedMax.x    = c.width / 2;
        this.pointerSpeedMax.y    = c.height / 2;

        // Gust max marker (purple small triangle).
        this.pointerGustMaxCommand.tip.x   = sv.posPointerMax.xT;
        this.pointerGustMaxCommand.tip.y   = sv.posPointerMax.yT;
        this.pointerGustMaxCommand.lBase.x = sv.posPointerMax.xL;
        this.pointerGustMaxCommand.lBase.y = sv.posPointerMax.yL;
        this.pointerGustMaxCommand.rBase.x = sv.posPointerMax.xR;
        this.pointerGustMaxCommand.rBase.y = sv.posPointerMax.yR;
        this.pointerGustMax.regX = c.width / 2;
        this.pointerGustMax.regY = c.height / 2;
        this.pointerGustMax.x    = c.width / 2;
        this.pointerGustMax.y    = c.height / 2;

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
        this.draw(v.speed, v.gust, v.speedMax, v.gustMax);
    };

    WindSpeedGaugeWidget.prototype.redrawForUnitChange = function () {
        var v = this.readBindings();
        this.draw(v.speed, v.gust, v.speedMax, v.gustMax, true);
    };

    global.WindSpeedGaugeWidget = WindSpeedGaugeWidget;
})(typeof window !== "undefined" ? window : this);
