/*jslint plusplus: true, sloppy: true, indent: 4 */
// StatusWidget: pulsing circle + status text widget. Subscribes to the same
// clientRaw data-update events as the rest of the widgets via listenForData;
// onDataUpdate redraws unconditionally so the "no new data" indicator runs
// every tick even when the payload is unchanged. canvasID: "Status01".

(function (global) {
    function StatusWidget(config) {
        config = config || {};
        config.canvasID = config.canvasID || "Status01";
        config.elementId = config.elementId || config.canvasID;
        config.events = config.events || [
            "clientRawDataUpdate", "clientRawExtraDataUpdate",
            "clientRawHourDataUpdate", "clientRawDailyDataUpdate"
        ];
        WidgetText.call(this, config);
        this.blankBlinkColour = null;
        this.circle = null;
        this.circColourCommand = null;
        this.circCommand = null;
        this.circStrokeCommand = null;
        this.textDisplayS = null;
        this.textDisplayD = null;
        this.blinkColour = null;
        this.setupVars = { circRad: null, strokeSize: null, textDisplaySize: null, edgeGap: null };
        this.tweens = { circRad: { percent: 0 } };
        this.values = { status: null, dataStatus: null, stationName: null, time: null, stationDate: null };
    }
    WidgetBase.inherit(StatusWidget, WidgetText);

    StatusWidget.prototype.onDataUpdate = function () {
        var v = this.readBindings();
        this.draw(v.status, v.stationTime, v.stationDate);
    };

    StatusWidget.prototype.checkDataStatus = function () {
        if (dataCollectErrorCR === true && dataCollectErrorCRE === true &&
                dataCollectErrorCRD === true && dataCollectErrorCRH === true) {
            return "Full Error";
        } else if ((dataCollectErrorCR === true || dataCollectErrorCRE === true ||
                dataCollectErrorCRD === true || dataCollectErrorCRH === true) &&
                noDataChanged === true) {
            return "Partial Error, No New Data";
        } else if (dataCollectErrorCR === true || dataCollectErrorCRE === true ||
                dataCollectErrorCRD === true || dataCollectErrorCRH === true) {
            return "Partial Error, New Data";
        } else if (noDataChanged === true) {
            return "No New Data";
        } else {
            return "Normal";
        }
    };

    StatusWidget.prototype.draw = function (statusIn, stationTimeIn, stationDateIn) {
        var dataStatusIn  = this.checkDataStatus(),
            stationNameIn = stationTimeIn.substring(0, stationTimeIn.lastIndexOf("-")),
            timeIn        = stationTimeIn.substring(stationTimeIn.lastIndexOf("-") + 1);

        this.values.status      = statusIn.replace(/_/g, " ");
        this.values.stationName = stationNameIn.replace(/_/g, " ");
        this.values.time        = timeIn;
        this.values.stationDate = stationDateIn;

        var name = this.values.stationName.toString(),
            time = this.values.time.toString(),
            date = this.values.stationDate.toString();

        if (dataStatusIn === "Full Error") {
            this.values.dataStatus = name + " | " + useDict("statusNoDataSince") + ": " + time + " | " + date;
            this.blinkColour = "rgba(209, 32, 32, 0.9)";
        } else if (dataStatusIn === "Partial Error, New Data") {
            this.values.dataStatus = name + " | " + useDict("statusDataAt") + ": " + time + " | " + date;
            this.blinkColour = "rgba(234, 242, 45, 0.9)";
        } else if (dataStatusIn === "Partial Error, No New Data") {
            this.blinkColour = "rgba(234, 242, 45, 0.9)";
        } else if (dataStatusIn === "No New Data") {
            this.blinkColour = this.blankBlinkColour;
        } else if (dataStatusIn === "Normal") {
            this.values.dataStatus = name + " | " + useDict("statusDataAt") + ": " + time + " | " + date;
            this.blinkColour = "rgba(23, 145, 27, 0.9)";
        } else {
            console.log("Invalid dataStatus");
        }

        this.textDisplayS.text = this.values.status;
        this.textDisplayD.text = this.values.dataStatus;

        this.updateTop();
    };

    StatusWidget.prototype.updateTweens = function () {
        if (this.tweens.circRad.percent < 0.01) {
            this.circStrokeCommand.width = 0;
            this.circCommand.radius      = 0;
            this.circColourCommand.style = this.blinkColour;
        } else {
            this.circStrokeCommand.width = this.setupVars.strokeSize * Math.pow((this.tweens.circRad.percent / 100), 2);
            this.circCommand.radius      = this.setupVars.circRad * (this.tweens.circRad.percent / 100);
        }
    };

    StatusWidget.prototype.updateTop = function () {
        var sv = this.setupVars, c = this.canvas;

        sv.circRad        = c.height * 0.2;
        sv.strokeSize     = c.height * 0.2;
        sv.textDisplaySize = c.height * 0.4;
        sv.edgeGap        = (c.height - sv.circRad) / 4;

        sv.posCirc  = { x: sv.circRad + sv.edgeGap, y: c.height / 2 };
        sv.posTextD = {
            x: sharpenValue((sv.circRad + sv.edgeGap) * 2),
            y: sharpenValue(c.height * (47 / 100))
        };
        sv.posTextS = {
            x: sharpenValue((sv.circRad + sv.edgeGap) * 2),
            y: sharpenValue(c.height * (53 / 100))
        };

        this.circStrokeCommand.width = sv.strokeSize;
        this.circCommand.x = sv.posCirc.x;
        this.circCommand.y = sv.posCirc.y;

        this.textDisplayS.x    = sv.posTextS.x;
        this.textDisplayS.y    = sv.posTextS.y;
        this.textDisplayS.font = sv.textDisplaySize + "px arial";
        setFontMaxWidthLeft(this.textDisplayS, this.canvas, this.stage);

        this.textDisplayD.x    = sv.posTextD.x;
        this.textDisplayD.y    = sv.posTextD.y;
        this.textDisplayD.font = sv.textDisplaySize + "px arial";
        setFontMaxWidthLeft(this.textDisplayD, this.canvas, this.stage);
    };

    // Original width = 6.19*parent.cH, height = 0.4*parent.cH → h/w = 0.4/6.19.
    StatusWidget.prototype.aspectRatio = 0.4 / 6.19;

    StatusWidget.prototype.setUp = function () {
        this.blankBlinkColour = "rgba(100, 100, 100, 0.9)";
        this.blinkColour      = this.blankBlinkColour;

        var circ = this.createCircle({ stroke: this.blankBlinkColour });
        this.circle            = circ.shape;
        this.circColourCommand = circ.strokeColorCommand;
        this.circStrokeCommand = circ.strokeCommand;
        this.circCommand       = circ.circleCommand;

        this.textDisplayS = this.createText("", { align: "left", baseline: "top" });
        this.textDisplayD = this.createText("", { align: "left", baseline: "bottom" });

        createjs.Tween.get(this.tweens.circRad, { loop: -1 })
            .to({ percent: 100 }, 2500, createjs.Ease.quartInOut);
    };

    global.StatusWidget = StatusWidget;
})(typeof window !== "undefined" ? window : this);
