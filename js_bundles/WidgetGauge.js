/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetGauge: CanvasWidget subclass for circular gauges (humidity, wind).
// Adds rotatePointer() helper; shape factory helpers and updateTweens frame
// wiring are inherited from CanvasWidget.

(function (global) {
    function WidgetGauge(config) {
        CanvasWidget.call(this, config);
        this.pointer = null;
    }
    WidgetBase.inherit(WidgetGauge, CanvasWidget);

    WidgetGauge.prototype.rotatePointer = function (angleDeg) {
        if (this.pointer) { this.pointer.rotation = angleDeg; }
    };

    // Filled triangle pointer (tip + two base vertices) used by compass-style
    // gauges. Returns { shape, commands:{tip,lBase,rBase} }; caller mutates
    // the command x/y values in updateTop() to position the tip/base points
    // and sets shape.regX/regY + shape.rotation to spin it.
    WidgetGauge.prototype.createTrianglePointer = function (opts) {
        opts = opts || {};
        var shape = new createjs.Shape();
        shape.snapToPixel = true;
        shape.graphics.beginFill(opts.fill || "black");
        shape.graphics.setStrokeStyle(opts.strokeWidth || 10);
        var commands = {
            tip:   shape.graphics.moveTo(10, 0).command,
            lBase: shape.graphics.lineTo(0, 10).command,
            rBase: shape.graphics.lineTo(10, 10).command
        };
        shape.graphics.closePath();
        this.stage.addChild(shape);
        return { shape: shape, commands: commands };
    };

    // Lay out a radial dash-and-label sweep across `halfAngle` radians starting
    // from the bottom-vertical. `count` large dashes span [0, halfAngle*2];
    // with `minorsBetween` interpolated minor dashes between them (for half-
    // tick markers). Each dash's graphics/commands come from createDashes,
    // and each major dash's matching label is centered at `labelRadius`.
    //
    // opts: { cx, cy, outerR, innerR, minorInnerR, count, minorsBetween,
    //         strokeSize, labelRadius, labelFontSize, labels }
    // Full-circle variant of drawRadialDashesAndLabels, used by compass-style
    // gauges (WindGaugeWidget) where `count` equally-spaced majors wrap the
    // whole ring with no duplicate at start/end. `minorsBetween` minors sit
    // between each major. Total dashes allocated = count * (minorsBetween+1).
    //
    // opts: { cx, cy, outerR, innerR, minorInnerR, count, minorsBetween,
    //         strokeSize, labelRadius, labelFontSize, labels }
    WidgetGauge.prototype.drawRadialRing = function (opts) {
        var cx = opts.cx, cy = opts.cy,
            outerR = opts.outerR, innerR = opts.innerR,
            minorInnerR = opts.minorInnerR !== undefined ? opts.minorInnerR : (innerR + outerR) / 2,
            count = opts.count,
            minorsBetween = opts.minorsBetween || 0,
            step = minorsBetween + 1,
            total = count * step,
            segment = (2 * Math.PI) / total,
            labels = opts.labels || [],
            strokeSize = opts.strokeSize,
            labelRadius = opts.labelRadius,
            labelFontSize = opts.labelFontSize,
            i, angle, endR, labelIdx;

        for (i = 0; i < total; i++) {
            angle = 2 * Math.PI - segment * i;
            this.dash[i].regX = -cx;
            this.dash[i].regY = -cy;
            this.dashStrokeCommand[i].width = strokeSize;
            this.dashStartCommand[i].x = Math.sin(angle) * outerR;
            this.dashStartCommand[i].y = Math.cos(angle) * outerR;
            endR = (i % step === 0) ? innerR : minorInnerR;
            this.dashEndCommand[i].x = Math.sin(angle) * endR;
            this.dashEndCommand[i].y = Math.cos(angle) * endR;

            if (i % step === 0) {
                labelIdx = i / step;
                if (this.label && this.label[labelIdx]) {
                    this.label[labelIdx].regX = -cx;
                    this.label[labelIdx].regY = -cy;
                    this.label[labelIdx].x = Math.sin(angle) * labelRadius;
                    this.label[labelIdx].y = Math.cos(angle) * labelRadius;
                    this.label[labelIdx].font = labelFontSize + "px arial";
                    if (labels[labelIdx] !== undefined) {
                        this.label[labelIdx].text = labels[labelIdx].toString();
                    }
                }
            }
        }
    };

    WidgetGauge.prototype.drawRadialDashesAndLabels = function (opts) {
        var cx = opts.cx, cy = opts.cy,
            outerR = opts.outerR, innerR = opts.innerR,
            minorInnerR = opts.minorInnerR !== undefined ? opts.minorInnerR : (innerR + outerR) / 2,
            count = opts.count,
            minorsBetween = opts.minorsBetween || 1,
            step = minorsBetween + 1,
            halfAngle = opts.halfAngle,
            total = (count - 1) * step + 1,
            segment = 2 * halfAngle / (count - 1) / step,
            labels = opts.labels || [],
            strokeSize = opts.strokeSize,
            labelRadius = opts.labelRadius,
            labelFontSize = opts.labelFontSize,
            i, angle, endR, labelIdx;

        for (i = 0; i < total; i++) {
            angle = halfAngle - (segment * i) + Math.PI;
            this.dash[i].regX = -cx;
            this.dash[i].regY = -cy;
            this.dashStrokeCommand[i].width = strokeSize;
            this.dashStartCommand[i].x = Math.sin(angle) * outerR;
            this.dashStartCommand[i].y = Math.cos(angle) * outerR;
            endR = (i % step === 0) ? innerR : minorInnerR;
            this.dashEndCommand[i].x = Math.sin(angle) * endR;
            this.dashEndCommand[i].y = Math.cos(angle) * endR;

            if (i % step === 0) {
                labelIdx = i / step;
                if (this.label && this.label[labelIdx]) {
                    this.label[labelIdx].regX = -cx;
                    this.label[labelIdx].regY = -cy;
                    this.label[labelIdx].x = Math.sin(angle) * labelRadius;
                    this.label[labelIdx].y = Math.cos(angle) * labelRadius;
                    this.label[labelIdx].font = labelFontSize + "px arial";
                    if (labels[labelIdx] !== undefined) {
                        this.label[labelIdx].text = labels[labelIdx].toString();
                    }
                }
            }
        }
    };

    global.WidgetGauge = WidgetGauge;
})(typeof window !== "undefined" ? window : this);
