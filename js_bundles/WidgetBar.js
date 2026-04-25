/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetBar: CanvasWidget subclass for bar-style widgets. Owns the shared
// drawLinearDashTrack helper that collapses the major/mid/minor dash-loop
// duplicated across SolarBarWidget, TemperatureBarWidget, UniBarWidget and
// WindSpeedWidget into one place, so a bug fix in one lands everywhere.

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

    global.WidgetBar = WidgetBar;
})(typeof window !== "undefined" ? window : this);
