/*jslint plusplus: true, sloppy: true, indent: 4 */
// UVBarWidget: fixed-scale bar 0–16 for UV index.
// canvasID: "UVBar01", data: arrayClientraw[79].

(function (global) {
    function UVBarWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "UVBar01";
        config.events = config.events || ["clientRawDataUpdate"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("uvDescription") : "");
        WidgetBar.call(this, config);
        this.rectTop = null;
        this.rectFillTop = null;
        this.rectCommand = null;
        this.rectFillCommand = null;
        this.rectFillFillColorCommand = null;
        this.topStrokeCommand = null;
        this.textDisplay = null;
        this.textTitle = null;
        this.textMaxLabel = null;
        this.setupVars = {
            barWidth: null, barFillWidth: null,
            barHeight: null, barFillHeight: null,
            strokeSize: null, textDisplaySize: null,
            textTitleSize: null, textMaxLabelSize: null,
            posBar: {}, posFillBar: {}
        };
        this.tweens    = { barFill: { h: 0 } };
        this.values    = { uniIn: 0, uniOut: 0 };
        this.valuesOld = { uniIn: null };
        this.unitsIn   = "uv";
    }
    WidgetBase.inherit(UVBarWidget, WidgetBar);

    UVBarWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.uv);
    };

    UVBarWidget.prototype.draw = function (uniIn) {
        if (!this.hasChanged({ uniIn: uniIn })) { return; }
        this.values.uniIn = formatDataToUnit(Number(uniIn), this.unitsIn);
        this.values.uniOut = mapRange(this.values.uniIn, 0, 16, 0, 1);
        createjs.Tween.get(this.tweens.barFill, { override: true })
            .to({ h: this.values.uniOut }, 2000, createjs.Ease.quartInOut);
        this.refreshLabels();
    };

    UVBarWidget.prototype.refreshLabels = function () {
        var unitStr = units[this.unitsIn][currentUnits[this.unitsIn]][1].toString();
        this.textDisplay.text = this.values.uniIn.toString() + unitStr;
    };

    UVBarWidget.prototype.updateTweens = function () {
        this.updateVerticalFillFromBottom(this.tweens.barFill.h);
    };

    UVBarWidget.prototype.updateTop = function () {
        var c = this.canvas,
            sv = this.computeBarLayout({ barHeightRatio: 0.75, verticalRef: 0.8 });

        sv.textDisplaySize  = c.height / 19;
        sv.textTitleSize    = c.height / 17;
        sv.textMaxLabelSize = c.height / 19;

        sv.posText         = { x: sv.posBar.x + sv.barWidth / 2, y: sv.barHeight * (201 / 170) };
        sv.posTextTitle    = { x: sv.posBar.x + sv.barWidth / 2, y: sv.barHeight * (1 / 17) };
        sv.posTextMaxLabel = { x: sv.posBar.x - sv.barWidth * (1 / 4), y: (c.height - sv.barHeight) / 2 };

        this.applyRectGeometry();

        this.textDisplay.x    = sv.posText.x;
        this.textDisplay.y    = sv.posText.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        this.textTitle.x    = sv.posTextTitle.x;
        this.textTitle.y    = sv.posTextTitle.y;
        this.textTitle.font = "bold " + sv.textTitleSize + "px arial";
        setFontMaxWidth(this.textTitle, this.canvas, this.stage);

        this.textMaxLabel.x    = sv.posTextMaxLabel.x;
        this.textMaxLabel.y    = sv.posTextMaxLabel.y;
        this.textMaxLabel.font = "bold " + sv.textMaxLabelSize + "px arial";

        this.refreshLabels();
        this.updateTweens();
    };

    UVBarWidget.prototype.aspectRatio = 3.0;

    UVBarWidget.prototype.applyStageTransform = function () {
        this.stage.x = -(this.canvas.width / 1.2);
    };

    UVBarWidget.prototype.setUp = function () {
        var top = this.createRect({ fill: "#F6F6F6" });
        this.rectTop = top.shape;
        this.topStrokeCommand = top.strokeCommand;
        this.rectCommand = top.rectCommand;

        var fill = this.createRect({
            fill: "rgb(" + this.getColour(this.unitsIn) + ")",
            stroke: false
        });
        this.rectFillTop = fill.shape;
        this.rectFillCommand = fill.rectCommand;
        this.rectFillFillColorCommand = fill.fillColorCommand;

        this.textDisplay  = this.createText("");
        this.textTitle    = this.createText(this.config.title || useDict("uvTitle"));
        this.textMaxLabel = this.createText("16", { align: "right" });
    };

    global.UVBarWidget = UVBarWidget;
})(typeof window !== "undefined" ? window : this);
