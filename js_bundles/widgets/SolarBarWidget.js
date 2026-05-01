/*jslint plusplus: true, sloppy: true, indent: 4 */
// SolarBarWidget: bar widget for solar radiation. Dual-mode: "Watt" (W/m^2
// with dashes and numeric labels) or percentage (default).

(function (global) {
    function SolarBarWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "SolarBar01";
        config.events = config.events || ["clientRawDataUpdate", "clientRawExtraDataUpdate"];
        config.tooltipText = config.tooltipText ||
            (typeof useDict === "function" ? useDict("solarDescription") : "");
        WidgetBar.call(this, config);

        this.size = 0.4;
        this.widthScaler = 0.5;
        this.mode = (config.mode !== undefined) ? config.mode : "percentage";

        this.rectTop = null;
        this.rectFillTop = null;
        this.rectCommand = null;
        this.rectFillCommand = null;
        this.topStrokeCommand = null;
        this.textDisplay = null;
        this.textPercentage = null;
        this.textSunHours = null;
        this.textTitle = null;
        this.textMaxLabel = null;
        this.largeDashTotal = 6;
        this.scaleSequence = [2.0, 2.0, 2.5];
        this.scalePos = -1;
        this.dashStrokeCommand = [];
        this.dashStartCommand = [];
        this.dashEndCommand = [];
        this.dash = [];
        this.label = [];

        this.setupVars = {
            dashes: [], barWidth: null, barFillWidth: null, barHeight: null,
            barFillHeight: null, strokeSize: null, textDisplaySize: null,
            textTitleSize: null, textMaxLabelSize: null, textSize: null,
            posBar: {}, posFillBar: {}
        };
        this.constants = {
            minUni: 0, minUniDEFAULT: 0,
            maxUni: 250, maxUniDEFAULT: 250,
            actualMaxPercent: 0.90
        };
        this.tweens = { barFill: { h: 0 } };
        this.values = { uniIn: 0, sunHoursIn: 0, percentIn: 0, percentOut: 0, uniOut: 0 };
        this.valuesOld = { uniIn: 0, sunHoursIn: 0, percentIn: 0 };

        this.unitsIn = config.unitsIn || "solar";
        this.title = config.title || (typeof useDict === "function" ? useDict("solarTitle") : "");
        this.textMaxLabelText = config.textMaxLabel || "100%";
    }
    WidgetBase.inherit(SolarBarWidget, WidgetBar);

    SolarBarWidget.prototype.setUp = function () {
        var top = this.createRect({ fill: "#F6F6F6" });
        this.rectTop = top.shape;
        this.topStrokeCommand = top.strokeCommand;
        this.rectCommand = top.rectCommand;

        if (this.mode === "Watt") {
            this.createDashes(this.largeDashTotal * 10);
            this.createLabels(this.largeDashTotal * 10);
        }

        var fill = this.createRect({
            fill: "rgb(" + colour[this.unitsIn.toString()].toString() + ")",
            stroke: false
        });
        this.rectFillTop = fill.shape;
        this.rectFillCommand = fill.rectCommand;

        this.textDisplay = this.createText("");

        if (this.mode !== "Watt") {
            this.textPercentage = this.createText("");
        }

        this.textSunHours = this.createText("");
        this.textTitle = this.createText(this.title);

        if (this.mode !== "Watt") {
            this.textMaxLabel = this.createText(this.textMaxLabelText, { align: "right" });
        }
    };

    SolarBarWidget.prototype.formatInput = function () {
        var v = this.values, c = this.constants;
        if (this.mode === "Watt") {
            v.uniIn = formatDataToUnit(v.uniIn, this.unitsIn);
            this.autoRescaleMax(v.uniIn);
            v.uniOut = mapRange(v.uniIn, c.minUni, c.maxUni, 0, 1);
        } else {
            v.percentIn = formatDataToUnit(v.percentIn, this.unitsIn);
            v.percentOut = mapRange(v.percentIn, 0, 100, 0, 1);
        }
    };

    SolarBarWidget.prototype.draw = function (percentIn, uniIn, sunHoursIn, unitChange) {
        if (!this.hasChanged({ uniIn: uniIn, percentIn: percentIn, sunHoursIn: sunHoursIn }, unitChange)) {
            return;
        }
        this.values.uniIn = Number(uniIn);
        this.values.percentIn = Number(percentIn);
        this.values.sunHoursIn = Number(sunHoursIn);

        this.formatInput();

        var target = (this.mode === "Watt") ? this.values.uniOut : this.values.percentOut;
        createjs.Tween.get(this.tweens.barFill, { override: true })
            .to({ h: target }, 2000, createjs.Ease.quartInOut);

        this.refreshLabels();
    };

    SolarBarWidget.prototype.refreshLabels = function () {
        var c = this.constants, unitKey = this.unitsIn.toString();
        this.textDisplay.text = this.values.uniIn.toString() +
            units[unitKey][currentUnits[unitKey]][1].toString();
        this.textSunHours.text = useDict("solarSunHours") + ": " + this.values.sunHoursIn.toString();
        if (this.mode === "Watt") {
            this.updateScaleLabels(this.largeDashTotal, c.minUni, c.maxUni);
        } else {
            this.textPercentage.text = this.values.percentIn.toString() + "%";
        }
    };

    SolarBarWidget.prototype.updateTweens = function () {
        this.updateVerticalFillFromBottom(this.tweens.barFill.h);
    };

    SolarBarWidget.prototype.updateTop = function () {
        var c = this.canvas,
            sv = this.computeBarLayout({
                barHeightRatio: 0.75,
                verticalRef: 0.8,
                dashLengthRatio: 0.04
            });

        sv.textDisplaySize  = c.height / 21;
        sv.textTitleSize    = c.height / 17;
        sv.textMaxLabelSize = c.height / 19;
        sv.textSize         = c.height / 20;

        sv.posDash = {
            x: sv.posBar.x - sv.dashLength - sv.dashGap,
            y: (c.height - sv.barHeight) * 0.41
        };
        sv.posTextTitle = {
            x: sv.posBar.x + sv.barWidth / 2,
            y: c.height * 0.8 * (1 / 17)
        };
        sv.posTextMaxLabel = {
            x: sv.posBar.x - sv.barWidth * (1 / 4),
            y: (c.height - sv.barHeight) / 2
        };
        if (this.mode === "Watt") {
            sv.posText = {
                x: sv.posBar.x + sv.barWidth / 2,
                y: sv.barHeight * (201 / 170)
            };
            sv.posTextSunHours = {
                x: sv.posBar.x + sv.barWidth / 3,
                y: sv.barHeight * (201 / 162)
            };
        } else {
            sv.posTextPercentage = {
                x: sv.posBar.x + sv.barWidth / 2,
                y: sv.barHeight * (201 / 170)
            };
            sv.posTextSunHours = {
                x: sv.posBar.x + sv.barWidth / 3,
                y: sv.barHeight * (201 / 155)
            };
            sv.posText = {
                x: sv.posBar.x + sv.barWidth / 2,
                y: sv.barHeight * (201 / 162)
            };
        }

        this.applyRectGeometry();

        if (this.mode === "Watt") {
            var gap = (sv.barHeight - sv.posDash.y) / ((this.largeDashTotal) * 9 - 10.5);
            this.drawLinearDashTrack({
                totalDashes: this.largeDashTotal * 10 - 9,
                orientation: "vertical",
                posDash: sv.posDash,
                dashLength: sv.dashLength,
                strokeSize: sv.strokeSize,
                majorEvery: 10,
                midEvery: 5,
                minorsEnabled: false,
                computeCoord: function (i) { return sharpenValue(gap * i + sv.posDash.y); },
                labelX: (sv.posDash.x - sv.dashLength) * (12 / 11),
                textSize: sv.textSize
            });
        }

        this.textDisplay.x = sv.posText.x;
        this.textDisplay.y = sv.posText.y;
        this.textDisplay.font = "bold " + sv.textDisplaySize + "px arial";

        if (this.mode !== "Watt") {
            this.textPercentage.x = sv.posTextPercentage.x;
            this.textPercentage.y = sv.posTextPercentage.y;
            this.textPercentage.font = "bold " + sv.textDisplaySize + "px arial";
            this.textMaxLabel.x = sv.posTextMaxLabel.x;
            this.textMaxLabel.y = sv.posTextMaxLabel.y;
            this.textMaxLabel.font = "bold " + sv.textMaxLabelSize + "px arial";
        }

        this.textSunHours.x = sv.posTextSunHours.x;
        this.textSunHours.y = sv.posTextSunHours.y;
        this.textSunHours.font = sv.textDisplaySize * 0.9 + "px arial";
        setFontMaxWidth(this.textSunHours, this.canvas, this.stage);

        this.textTitle.x = sv.posTextTitle.x;
        this.textTitle.y = sv.posTextTitle.y;
        this.textTitle.font = "bold " + sv.textTitleSize + "px arial";
        setFontMaxWidth(this.textTitle, this.canvas, this.stage, true);

        this.refreshLabels();
        this.updateTweens();
    };

    // Width-driven sizing: canvas.height / canvas.width = 3.0.
    SolarBarWidget.prototype.aspectRatio = 3.0;

    SolarBarWidget.prototype.applyStageTransform = function () {
        this.stage.x = -(this.canvas.width / 1.2);
    };

    SolarBarWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.percent, v.watts, v.sunHours);
    };

    SolarBarWidget.prototype.redrawForUnitChange = function () {
        var v = this.readBindings();
        this.draw(v.percent, v.watts, v.sunHours, true);
    };

    global.SolarBarWidget = SolarBarWidget;
})(typeof window !== "undefined" ? window : this);
