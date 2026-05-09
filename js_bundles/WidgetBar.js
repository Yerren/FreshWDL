/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetBar: CanvasWidget subclass for bar-style widgets. Owns the shared
// drawLinearDashTrack helper used by all bar widgets.

(function (global) {
    function WidgetBar(config) {
        CanvasWidget.call(this, config);
    }
    WidgetBase.inherit(WidgetBar, CanvasWidget);

    // Walk the pre-allocated dash commands (this.dash / dashStrokeCommand /
    // dashStartCommand / dashEndCommand, created by CanvasWidget.createDashes)
    // and position each one as major / mid / minor according to its index.
    //
    // opts:
    //   totalDashes       – number of dash shapes to lay out (inclusive of majors)
    //   orientation       – "vertical" (dashes stack along Y) or "horizontal"
    //   posDash           – {x, y} origin (top-left of the dash track)
    //   dashLength        – extent perpendicular to the track axis
    //   strokeSize        – dash stroke width
    //   majorEvery        – dashes at i % majorEvery === 0 are majors (get labels)
    //   midEvery          – dashes at i % midEvery === 0 (and not major) are mids
    //   minorsEnabled     – if false, indices that are neither major nor mid are skipped
    //   computeCoord(i)   – returns the along-axis coordinate for dash index i
    //   labelX / labelY   – along-axis-perpendicular coordinate for labels (constant)
    //                       (provide labelX for vertical tracks, labelY for horizontal)
    //   textSize          – label font size in px
    WidgetBar.prototype.drawLinearDashTrack = function (opts) {
        var orientation = opts.orientation || "vertical",
            posDash = opts.posDash,
            dashLength = opts.dashLength,
            strokeSize = opts.strokeSize,
            majorEvery = opts.majorEvery || 10,
            midEvery = opts.midEvery || 5,
            minorsEnabled = opts.minorsEnabled === true,
            computeCoord = opts.computeCoord,
            textSize = opts.textSize,
            hasLabels = (this.label && typeof opts.labelX !== "undefined") ||
                        (this.label && typeof opts.labelY !== "undefined");

        for (var i = 0; i < opts.totalDashes; i++) {
            var isMajor = (i % majorEvery === 0),
                isMid = (!isMajor && i % midEvery === 0),
                isMinor = !isMajor && !isMid;

            if (isMinor && !minorsEnabled) { continue; }

            // Major dashes reach the full dashLength. Mid = half. Minor = third.
            var innerOffset = isMajor ? 0 : (isMid ? dashLength / 2 : 2 * dashLength / 3),
                coord = computeCoord(i);

            this.dashStrokeCommand[i].width = strokeSize;
            if (orientation === "vertical") {
                this.dashStartCommand[i].x = posDash.x + innerOffset;
                this.dashStartCommand[i].y = coord;
                this.dashEndCommand[i].x   = posDash.x + dashLength;
                this.dashEndCommand[i].y   = coord;
            } else {
                this.dashStartCommand[i].x = coord;
                this.dashStartCommand[i].y = posDash.y + innerOffset;
                this.dashEndCommand[i].x   = coord;
                this.dashEndCommand[i].y   = posDash.y + dashLength;
            }

            if (isMajor && hasLabels) {
                var idx = i / majorEvery,
                    lbl = this.label[idx];
                if (orientation === "vertical") {
                    lbl.x = opts.labelX;
                    lbl.y = coord;
                } else {
                    lbl.x = coord;
                    lbl.y = opts.labelY;
                }
                lbl.font = textSize + "px arial";
            }
        }
    };

    // Common vertical-fill tween applier: grows a fill rect upward from the
    // bottom of the background rect as `fraction` (0..1) rises. Defaults to
    // this.rectCommand / this.rectFillCommand; WindSpeed passes explicit
    // refs to drive its left/right dual bars. TempBar uses a bespoke variant
    // (rc.y=0 baseline) so it opts out.
    WidgetBar.prototype.updateVerticalFillFromBottom = function (fraction, rc, rfc) {
        rc  = rc  || this.rectCommand;
        rfc = rfc || this.rectFillCommand;
        rfc.h = fraction * rc.h;
        rfc.y = rc.h - rfc.h + rc.y;
    };

    // Linearly distribute max→min label text across `count` scale labels
    // (top-to-bottom). Shared by UniBar, SolarBar (Watt mode) and TempBar.
    WidgetBar.prototype.updateScaleLabels = function (count, minVal, maxVal) {
        for (var i = 0; i < count; i++) {
            this.label[i].text = maxVal - ((maxVal - minVal) / (count - 1)) * i;
        }
    };

    // Auto-rescale this.constants.maxUni so `value` fits in the top
    // `actualMaxPercent` of the range, stepping through scaleSequence.
    // Shrinks back down toward maxUniDEFAULT when value falls far enough.
    // Mutates this.constants.maxUni and this.scalePos in place.
    WidgetBar.prototype.autoRescaleMax = function (value) {
        var c = this.constants, seq = this.scaleSequence;
        while (value > c.maxUni * c.actualMaxPercent) {
            this.scalePos = (this.scalePos + 1) % seq.length;
            c.maxUni *= seq[this.scalePos];
        }
        while (value <= (c.maxUni / seq[this.scalePos]) * c.actualMaxPercent && c.maxUni > c.maxUniDEFAULT) {
            c.maxUni /= seq[this.scalePos];
            this.scalePos = this.scalePos - 1;
            this.scalePos = (this.scalePos % seq.length + seq.length) % seq.length;
        }
    };

    // Common bar-layout math. Writes barWidth/barFillWidth/barHeight/
    // barFillHeight/strokeSize (and optional dashLength/dashGap) plus
    // posBar/posFillBar onto this.setupVars.
    //
    // opts:
    //   barWidthRatio    – barWidth = canvas.height * ratio (default 0.075)
    //   barHeightRatio   – barHeight = canvas.height * ratio (default 0.8)
    //   fillWidthScale   – barFillWidth = barWidth * scale (default 1)
    //   verticalRef      – reference ratio used for posBar.y centering
    //                      (default = barHeightRatio; pass an explicit value
    //                      when the bar is shifted relative to its height,
    //                      as in UVBar/SolarBar where the bar is 0.75 tall
    //                      but centered against a 0.8 reference)
    //   dashLengthRatio  – if set, sv.dashLength = canvas.height * ratio
    //   dashGapRatio     – sv.dashGap = canvas.height * ratio (default 0.025)
    WidgetBar.prototype.computeBarLayout = function (opts) {
        opts = opts || {};
        var sv = this.setupVars, c = this.canvas,
            barWidthRatio  = opts.barWidthRatio  !== undefined ? opts.barWidthRatio  : 0.075,
            barHeightRatio = opts.barHeightRatio !== undefined ? opts.barHeightRatio : 0.8,
            fillWidthScale = opts.fillWidthScale !== undefined ? opts.fillWidthScale : 1,
            verticalRef    = opts.verticalRef    !== undefined ? opts.verticalRef    : barHeightRatio,
            dashGapRatio   = opts.dashGapRatio   !== undefined ? opts.dashGapRatio   : 0.025;

        sv.barWidth      = c.height * barWidthRatio;
        sv.barFillWidth  = sv.barWidth * fillWidthScale;
        sv.barHeight     = c.height * barHeightRatio;
        sv.barFillHeight = sv.barHeight;
        sv.strokeSize    = sv.barWidth / 40;
        if (opts.dashLengthRatio !== undefined) {
            sv.dashLength = c.height * opts.dashLengthRatio;
            sv.dashGap    = c.height * dashGapRatio;
        }
        sv.posBar = {
            x: (c.height / 2) - (sv.barWidth / 2),
            y: (c.height / 2) - (c.height * verticalRef / 2)
        };
        sv.posFillBar = {
            x: (c.height / 2) - (sv.barFillWidth / 2),
            y: (c.height / 2) - (sv.barFillHeight / 2)
        };
        return sv;
    };

    // Write the standard topStrokeCommand + rectCommand + rectFillCommand
    // values from the layout in setupVars. TempBar uses rounded corners and
    // mutates rectCommand.radiusTR/TL/BR/BL itself, so it skips this helper.
    WidgetBar.prototype.applyRectGeometry = function () {
        var sv = this.setupVars;
        this.topStrokeCommand.width = sv.strokeSize;
        this.rectCommand.x = sv.posBar.x;
        this.rectCommand.y = sv.posBar.y;
        this.rectCommand.w = sv.barWidth;
        this.rectCommand.h = sv.barHeight;
        this.rectFillCommand.x = sv.posFillBar.x;
        this.rectFillCommand.w = sv.barFillWidth;
    };

    WidgetBar.prototype.recolour = function () {
        if (this.rectFillFillColorCommand) {
            this.rectFillFillColorCommand.style = "rgb(" + this.getColour(this.unitsIn) + ")";
        }
        this._dirty = true;
    };

    global.WidgetBar = WidgetBar;
})(typeof window !== "undefined" ? window : this);
