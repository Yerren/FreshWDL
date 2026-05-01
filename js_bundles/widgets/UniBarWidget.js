/*jslint plusplus: true, sloppy: true, indent: 4 */
// UniBarWidget: config-driven rainfall bar. Covers uniBar01/02/03.
//
// Config:
//   canvasID   – "RainBar1" / "RainBar2" / "RainBar3"
//   title      – display title string (pass useDict result at construction time)
//   dataIndex  – arrayClientraw index (7 / 8 / 9)

(function (global) {
    function UniBarWidget(config) {
        config = config || {};
        config.events = config.events || ["clientRawDataUpdate"];
        config.unitEvents = config.unitEvents || ["rainfall"];
        WidgetBar.call(this, config);
        this.largeDashTotal = 6;
        this.scaleSequence = [2.0, 2.0, 2.5];
        this.scalePos = -1;

        this.rectTop = null;
        this.rectFillTop = null;
        this.rectCommand = null;
        this.rectFillCommand = null;
        this.topStrokeCommand = null;
        this.textDisplay = null;
        this.textTitle = null;
        this.dashStrokeCommand = [];
        this.dashStartCommand = [];
        this.dashEndCommand = [];
        this.dash = [];
        this.label = [];

        this.setupVars = {
            dashGap: null, barWidth: null, barFillWidth: null,
            barHeight: null, barFillHeight: null, strokeSize: null,
            textSize: null, textDisplaySize: null, textTitleSize: null,
            posBar: {}, posFillBar: {}
        };

        this.constants = {
            minUni: 0, minUniDEFAULT: 0,
            maxUni: 5, maxUniDEFAULT: 5,
            actualMaxPercent: 0.75
        };

        this.tweens   = { barFill: { h: 0 } };
        this.values   = { uniIn: 0, uniOut: 0 };
        this.valuesOld = { uniIn: 0 };
        this.unitsIn  = "rainfall";
    }
    WidgetBase.inherit(UniBarWidget, WidgetBar);

    UniBarWidget.prototype._readValue = function () {
        if (this._bindingResolvers) { return this.readBindings().value; }
        return arrayClientraw[this.config.dataIndex];
    };

    UniBarWidget.prototype.onDataUpdate = function () {
        this.draw(this._readValue());
    };

    UniBarWidget.prototype.redrawForUnitChange = function () {
        this.draw(this._readValue(), true);
    };

    UniBarWidget.prototype.formatInput = function () {
        var v = this.values, c = this.constants;
        v.uniIn = formatDataToUnit(v.uniIn, this.unitsIn);
        this.autoRescaleMax(v.uniIn);
        v.uniOut = mapRange(v.uniIn, c.minUni, c.maxUni, 0, 1);
    };

    UniBarWidget.prototype.draw = function (uniIn, unitChange) {
        if (!this.hasChanged({ uniIn: uniIn }, unitChange)) { return; }

        this.values.uniIn = uniIn;
        this.formatInput();
        createjs.Tween.get(this.tweens.barFill, { override: true })
            .to({ h: this.values.uniOut }, 2000, createjs.Ease.quartInOut);
    };

    UniBarWidget.prototype.updateTweens = function () {
        var v = this.values, c = this.constants,
            unitStr = units[this.unitsIn][currentUnits[this.unitsIn]][1].toString();

        this.updateVerticalFillFromBottom(this.tweens.barFill.h);
        this.updateScaleLabels(this.largeDashTotal, c.minUni, c.maxUni);
        this.textDisplay.text = v.uniIn.toString() + unitStr;
    };

    UniBarWidget.prototype.updateTop = function () {
        var c = this.canvas, ldt = this.largeDashTotal,
            sv = this.computeBarLayout({ barHeightRatio: 0.75, verticalRef: 0.8, dashLengthRatio: 0.075 });

        sv.textSize        = c.height / 17;
        sv.textDisplaySize = c.height / 19;
        sv.textTitleSize   = c.height / 17;

        sv.posDash = {
            x: sv.posBar.x - sv.dashLength - sv.dashGap,
            y: (c.height - sv.barHeight) / 2
        };
        sv.posText      = { x: sv.posBar.x, y: sv.barHeight * (201 / 170) };
        sv.posTextTitle = { x: sv.posBar.x * (9 / 10), y: sv.barHeight * (1 / 17) };

        this.applyRectGeometry();

        var gap = (sv.barHeight - sv.posDash.y) / ((ldt) * 9 - 10);
        this.drawLinearDashTrack({
            totalDashes: ldt * 10 - 9,
            orientation: "vertical",
            posDash: sv.posDash,
            dashLength: sv.dashLength,
            strokeSize: sv.strokeSize,
            majorEvery: 10,
            midEvery: 5,
            minorsEnabled: true,
            computeCoord: function (i) { return sharpenValue(gap * i + sv.posDash.y); },
            labelX: (sv.posDash.x - sv.dashLength) * (6 / 5),
            textSize: sv.textSize
        });

        this.textDisplay.x    = sv.posText.x;
        this.textDisplay.y    = sv.posText.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        this.textTitle.x    = sv.posTextTitle.x;
        this.textTitle.y    = sv.posTextTitle.y;
        this.textTitle.font = "bold " + sv.textTitleSize + "px arial";
        setFontMaxWidth(this.textTitle, this.canvas, this.stage);

        this.updateTweens();
    };

    UniBarWidget.prototype.aspectRatio = 2.5 * 3.01 / 3.0;

    UniBarWidget.prototype.applyStageTransform = function () {
        this.stage.x = -(this.canvas.width / 2);
    };

    UniBarWidget.prototype.setUp = function () {
        var ldt = this.largeDashTotal;

        var top = this.createRect({ fill: "#F6F6F6" });
        this.rectTop = top.shape;
        this.topStrokeCommand = top.strokeCommand;
        this.rectCommand = top.rectCommand;

        this.createDashes(ldt * 10);

        var fill = this.createRect({
            fill: "rgba(" + colour[this.unitsIn].toString() + ", 0.6)",
            stroke: false
        });
        this.rectFillTop = fill.shape;
        this.rectFillCommand = fill.rectCommand;

        this.createLabels(ldt);

        this.textDisplay = this.createText("");
        this.textTitle = this.createText(this.config.title);
    };

    global.UniBarWidget = UniBarWidget;
})(typeof window !== "undefined" ? window : this);
