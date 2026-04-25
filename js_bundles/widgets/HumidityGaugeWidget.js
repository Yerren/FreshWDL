/*jslint plusplus: true, sloppy: true, indent: 4 */
// HumidityGaugeWidget: circular gauge for humidity (0-100 %).

(function (global) {
    function HumidityGaugeWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "HumidityGauge01";
        config.events = config.events || ["clientRawDataUpdate"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("humidityDescription") : "");
        WidgetGauge.call(this, config);

        this.outerCircle = null;
        this.innerCircle = null;
        this.innerDot = null;
        this.outerCircleStrokeCommand = null;
        this.outerCircleCommand = null;
        this.innerCircleCommand = null;
        this.innerDotCommand = null;
        this.pointer = null;
        this.textTitle = null;
        this.textDisplay = null;
        this.botLine = null;
        this.botLineStrokeCommand = null;
        this.botLineStartCommand = null;
        this.botLineEndCommand = null;
        this.largeDashTotal = 11;
        this.pointerCommand = null;
        this.arrow = null;
        this.setupVars = {};
        this.tweens = { r: 0 };
        this.values = { humidityIn: 0, humidityOut: 0, trend: 0, unitsIn: "humidity" };
        this.valuesOld = { humidityIn: 0, trend: 0 };
    }
    WidgetBase.inherit(HumidityGaugeWidget, WidgetGauge);

    HumidityGaugeWidget.prototype.setUp = function () {
        var outer = this.createCircle({ stroke: "black", fill: "#F6F6F6" });
        this.outerCircle = outer.shape;
        this.outerCircleStrokeCommand = outer.strokeCommand;
        this.outerCircleCommand = outer.circleCommand;

        var bot = this.createLine({ stroke: "black", width: 100 });
        this.botLine = bot.shape;
        this.botLineStrokeCommand = bot.strokeCommand;
        this.botLineStartCommand = bot.startCommand;
        this.botLineEndCommand = bot.endCommand;

        var ptr = this.createTrianglePointer({ fill: "black" });
        this.pointer = ptr.shape;
        this.pointerCommand = ptr.commands;

        var inner = this.createCircle({ fill: "black" });
        this.innerCircle = inner.shape;
        this.innerCircleCommand = inner.circleCommand;

        var dot = this.createCircle({ fill: "rgb(" + colour.humidity + ")" });
        this.innerDot = dot.shape;
        this.innerDotCommand = dot.circleCommand;

        this.textDisplay = this.createText(" ");
        this.textTitle = this.createText(useDict("humidityTitle") + " (%)");

        this.createLabels(this.largeDashTotal, { align: "center" });
        for (var i = 0; i < this.largeDashTotal; i++) {
            this.label[i].text = Math.round((100 * i / (this.largeDashTotal - 1)), 0).toString();
        }

        this.createDashes(this.largeDashTotal * 2);

        this.arrow = this.createTrendArrow({ color: "rgb(" + colour.humidity + ")" });
    };

    HumidityGaugeWidget.prototype.draw = function (humidityIn, trend, unitChange) {
        unitChange = unitChange || false;
        if (String(this.valuesOld.humidityIn) !== String(humidityIn) || String(this.valuesOld.trend) !== String(trend) || unitChange === true) {
            var halfAngleDeg = (Math.PI - Math.acos(
                (this.setupVars.cutOffLength - this.setupVars.posOuterCircle.y) / this.setupVars.outerCircleRad
            )) * (180 / Math.PI);

            this.values.trend = parseInt(trend);
            this.values.humidityIn = parseFloat(humidityIn);
            this.values.humidityOut = this.values.humidityIn.map(0, 100, -halfAngleDeg, halfAngleDeg);
            createjs.Tween.get(this.tweens, { override: true })
                .to({ r: this.values.humidityOut }, 2000, createjs.Ease.quartInOut);

            if (String(this.valuesOld.trend) !== String(trend)) {
                this.updateTop();
            }
            this.valuesOld.humidityIn = humidityIn;
            this.valuesOld.trend = trend;
            this.textDisplay.text = this.values.humidityIn.toString() + "%";
        }
    };

    HumidityGaugeWidget.prototype.updateTweens = function () {
        this.rotatePointer(this.tweens.r);
    };

    HumidityGaugeWidget.prototype.updateTop = function () {
        var sv = this.setupVars;
        sv.outerCircleRad = this.canvas.width * 0.4;
        sv.innerCircleRad = this.canvas.width * 0.05;
        sv.cutOffLength = sv.outerCircleRad * 2;
        sv.strokeSize = this.canvas.width / 80;
        sv.dashEndRad = sv.outerCircleRad * (3 / 4);
        sv.labelCentreRad = sv.outerCircleRad * (5 / 8);
        sv.textSize = this.canvas.width / 15;
        sv.textTitleSize = this.canvas.width / 13;
        sv.textDisplaySize = this.canvas.width / 10;
        sv.posOuterCircle = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        sv.posInnerCircle = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        sv.posPointer = {
            xT: this.canvas.width / 2, yT: this.canvas.height * (1 / 5),
            xL: this.canvas.width * (97 / 200), yL: this.canvas.height * (3 / 5),
            xR: this.canvas.width * (103 / 200), yR: this.canvas.height * (3 / 5)
        };
        sv.posBotLine = {
            xL: sv.posOuterCircle.x - Math.sqrt(Math.pow(sv.outerCircleRad, 2) - Math.pow((sv.cutOffLength - sv.posOuterCircle.x), 2)),
            xR: sv.posOuterCircle.x + Math.sqrt(Math.pow(sv.outerCircleRad, 2) - Math.pow((sv.cutOffLength - sv.posOuterCircle.x), 2)),
            y: sv.cutOffLength - sv.strokeSize / 10
        };
        sv.posTextTitle = { x: sv.posOuterCircle.x, y: sv.cutOffLength * (110 / 103) };
        sv.posTextDisplay = { x: sv.posOuterCircle.x, y: sv.cutOffLength * (103 / 110) };
        sv.posArrow = { x: this.canvas.width / 2, y: this.canvas.height * 0.65 };

        this.outerCircleStrokeCommand.width = sv.strokeSize;
        this.outerCircleCommand.x = sv.posOuterCircle.x;
        this.outerCircleCommand.y = sv.posOuterCircle.y;
        this.outerCircleCommand.radius = sv.outerCircleRad;

        this.botLineStrokeCommand.width = sv.strokeSize;
        this.botLineStartCommand.x = sv.posBotLine.xL;
        this.botLineStartCommand.y = sv.posBotLine.y;
        this.botLineEndCommand.x = sv.posBotLine.xR;
        this.botLineEndCommand.y = sv.posBotLine.y;

        this.innerCircleCommand.x = sv.posInnerCircle.x;
        this.innerCircleCommand.y = sv.posInnerCircle.y;
        this.innerCircleCommand.radius = sv.innerCircleRad;

        this.innerDotCommand.x = sv.posInnerCircle.x;
        this.innerDotCommand.y = sv.posInnerCircle.y;
        this.innerDotCommand.radius = sv.innerCircleRad / 4;

        this.textDisplay.x = sv.posTextDisplay.x;
        this.textDisplay.y = sv.posTextDisplay.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        this.textTitle.x = sv.posTextTitle.x;
        this.textTitle.y = sv.posTextTitle.y;
        this.textTitle.font = "bold " + sv.textTitleSize + "px arial";
        setFontMaxWidth(this.textTitle, this.canvas, this.stage);

        this.pointerCommand.tip.x = sv.posPointer.xT;
        this.pointerCommand.tip.y = sv.posPointer.yT;
        this.pointerCommand.lBase.x = sv.posPointer.xL;
        this.pointerCommand.lBase.y = sv.posPointer.yL;
        this.pointerCommand.rBase.x = sv.posPointer.xR;
        this.pointerCommand.rBase.y = sv.posPointer.yR;
        this.pointer.regX = this.canvas.width / 2;
        this.pointer.regY = this.canvas.height / 2;
        this.pointer.x = this.canvas.width / 2;
        this.pointer.y = this.canvas.height / 2;

        if (!this._maskShape) {
            this._maskShape = new createjs.Shape();
            this.outerCircle.mask = this._maskShape;
        }
        this._maskShape.graphics.clear().dr(0, 0, this.canvas.width, sv.cutOffLength);

        var halfAngle = Math.PI - Math.acos((sv.cutOffLength - sv.posOuterCircle.y) / sv.outerCircleRad);
        this.drawRadialDashesAndLabels({
            cx: this.canvas.width / 2,
            cy: this.canvas.height / 2,
            outerR: sv.outerCircleRad,
            innerR: sv.dashEndRad,
            minorInnerR: (sv.dashEndRad + sv.outerCircleRad) / 2,
            count: this.largeDashTotal,
            minorsBetween: 1,
            halfAngle: halfAngle,
            strokeSize: sv.strokeSize,
            labelRadius: sv.labelCentreRad,
            labelFontSize: sv.textSize
        });

        if (this.values.trend !== 0) {
            this.arrow.middleLine.visible = true;
            this.arrow.middleLineStrokeCommand.width = sv.strokeSize;
            this.arrow.middleLineStartCommand.x = sv.posArrow.x;
            this.arrow.middleLineStartCommand.y = sv.posArrow.y * 0.95;
            this.arrow.middleLineEndCommand.x = sv.posArrow.x;
            this.arrow.middleLineEndCommand.y = sv.posArrow.y * 1.05;
        } else {
            this.arrow.middleLine.visible = false;
        }

        this.arrow.pointerLineStrokeCommand.width = sv.strokeSize;
        this.arrow.pointerLineStartCommand.x = sv.posArrow.x * 0.95;
        this.arrow.pointerLineStartCommand.y = sv.posArrow.y;
        this.arrow.pointerLineMidCommand.x = sv.posArrow.x;
        this.arrow.pointerLineMidCommand.y = sv.posArrow.y * (1 - 0.05 * this.values.trend);
        this.arrow.pointerLineEndCommand.x = sv.posArrow.x * 1.05;
        this.arrow.pointerLineEndCommand.y = sv.posArrow.y;
    };

    HumidityGaugeWidget.prototype.aspectRatio = 1.0;

    HumidityGaugeWidget.prototype.applyStageTransform = function () {
        this.stage.y = this.canvas.height * -0.09;
    };

    HumidityGaugeWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.humidity, v.trend);
    };

    HumidityGaugeWidget.prototype.redrawForUnitChange = function () {
        var v = this.readBindings();
        this.draw(v.humidity, v.trend, true);
    };

    global.HumidityGaugeWidget = HumidityGaugeWidget;
})(typeof window !== "undefined" ? window : this);
