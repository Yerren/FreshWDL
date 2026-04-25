/*jslint plusplus: true, sloppy: true, indent: 4 */
// UVBarWidget: fixed-scale bar 0–16 for UV index.
// canvasID: "UVBar01", data: arrayClientraw[79].

(function (global) {
    function UVBarWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "UVBar01";
        config.events = config.events || ["clientRawDataUpdate"];
        WidgetBar.call(this, config);
        this.rectTop = null;
        this.rectFillTop = null;
        this.rectCommand = null;
        this.rectFillCommand = null;
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
        this.tweens  = { barFill: { h: 0 } };
        this.values  = { uniIn: 0, uniOut: 0 };
        this.unitsIn = "uv";
    }
    WidgetBase.inherit(UVBarWidget, WidgetBar);

    UVBarWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.uv);
    };

    UVBarWidget.prototype.draw = function (uniIn) {
        this.values.uniIn = Number(uniIn);
        this.values.uniIn = formatDataToUnit(this.values.uniIn, this.unitsIn);
        this.values.uniOut = this.values.uniIn.map(0, 16, 0, 1);
        createjs.Tween.get(this.tweens.barFill, { override: true })
            .to({ h: this.values.uniOut }, 2000, createjs.Ease.quartInOut);
    };

    UVBarWidget.prototype.updateTweens = function () {
        var unitStr = units[this.unitsIn][currentUnits[this.unitsIn]][1].toString();
        this.updateVerticalFillFromBottom(this.tweens.barFill.h);
        this.textDisplay.text = this.values.uniIn.toString() + unitStr;
    };

    UVBarWidget.prototype.updateTop = function () {
        var sv = this.setupVars, c = this.canvas;

        sv.barWidth        = c.height * 0.075;
        sv.barFillWidth    = sv.barWidth;
        sv.barHeight       = c.height * 0.75;
        sv.barFillHeight   = sv.barHeight;
        sv.strokeSize      = sv.barWidth / 40;
        sv.textDisplaySize = c.height / 19;
        sv.textTitleSize   = c.height / 17;
        sv.textMaxLabelSize = c.height / 19;

        sv.posBar = {
            x: (c.height / 2) - (sv.barWidth / 2),
            y: (c.height / 2) - (c.height * 0.8 / 2)
        };
        sv.posText = {
            x: sv.posBar.x + sv.barWidth / 2,
            y: sv.barHeight * (201 / 170)
        };
        sv.posTextTitle = {
            x: sv.posBar.x + sv.barWidth / 2,
            y: sv.barHeight * (1 / 17)
        };
        sv.posTextMaxLabel = {
            x: sv.posBar.x - sv.barWidth * (1 / 4),
            y: (c.height - sv.barHeight) / 2
        };
        sv.posFillBar = {
            x: (c.height / 2) - (sv.barFillWidth / 2),
            y: (c.height / 2) - (sv.barFillHeight / 2)
        };

        this.topStrokeCommand.width = sv.strokeSize;
        this.rectCommand.x = sv.posBar.x;
        this.rectCommand.y = sv.posBar.y;
        this.rectCommand.w = sv.barWidth;
        this.rectCommand.h = sv.barHeight;

        this.rectFillCommand.x = sv.posFillBar.x;
        this.rectFillCommand.w = sv.barFillWidth;

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
            fill: "rgb(" + colour[this.unitsIn].toString() + ")",
            stroke: false
        });
        this.rectFillTop = fill.shape;
        this.rectFillCommand = fill.rectCommand;

        this.textDisplay  = this.createText("");
        this.textTitle    = this.createText(useDict("uvTitle"));
        this.textMaxLabel = this.createText("16", { align: "right" });
    };

    global.UVBarWidget = UVBarWidget;
})(typeof window !== "undefined" ? window : this);
