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

    // Lay out radial dashes and labels around a center. Two wrap modes:
    //   "full" — `count` majors equally spaced around the whole circle.
    //   "arc"  — `count` majors span ±halfAngle from the bottom-vertical.
    // `minorsBetween` minor dashes sit between each major.
    //
    // opts: { wrap, cx, cy, outerR, innerR, minorInnerR, count, minorsBetween,
    //         halfAngle (arc only), strokeSize, labelRadius, labelFontSize,
    //         labels }
    WidgetGauge.prototype.drawRadialDashes = function (opts) {
        var cx = opts.cx, cy = opts.cy,
            outerR = opts.outerR, innerR = opts.innerR,
            minorInnerR = opts.minorInnerR !== undefined ? opts.minorInnerR : (innerR + outerR) / 2,
            count = opts.count,
            wrap = opts.wrap || "full",
            isFull = (wrap === "full"),
            minorsBetween = opts.minorsBetween !== undefined ? opts.minorsBetween : (isFull ? 0 : 1),
            step = minorsBetween + 1,
            total, segment, baseAngle,
            labels = opts.labels || [],
            strokeSize = opts.strokeSize,
            labelRadius = opts.labelRadius,
            labelFontSize = opts.labelFontSize,
            i, angle, endR, labelIdx;

        if (isFull) {
            total = count * step;
            segment = (2 * Math.PI) / total;
            baseAngle = 2 * Math.PI;
        } else {
            total = (count - 1) * step + 1;
            segment = 2 * opts.halfAngle / (count - 1) / step;
            baseAngle = opts.halfAngle + Math.PI;
        }

        for (i = 0; i < total; i++) {
            angle = baseAngle - segment * i;
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

    WidgetGauge.prototype.drawRadialRing = function (opts) {
        opts.wrap = "full";
        this.drawRadialDashes(opts);
    };

    WidgetGauge.prototype.drawRadialDashesAndLabels = function (opts) {
        opts.wrap = "arc";
        this.drawRadialDashes(opts);
    };

    global.WidgetGauge = WidgetGauge;
})(typeof window !== "undefined" ? window : this);
