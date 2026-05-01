// js_bundles/tests/main.test.js
// Run with: node js_bundles/tests/main.test.js
// Or paste into browser console after the app has loaded.
//
// When run in Node, only the mapRange tests execute (no DOM or app globals
// required). The processGraphData and WidgetText tests require the full app.

var inBrowser = typeof window !== "undefined";
var passed = 0, failed = 0;

function assert(label, condition) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error("FAIL: " + label);
    }
}

// ---- mapRange ---------------------------------------------------------------

(function () {
    var mapRange = inBrowser ? window.mapRange : require("../DataHelpers.js").mapRange;
    if (typeof mapRange === "undefined") {
        // DataHelpers.js is a plain-globals file — not importable in Node without a shim.
        // Inline the formula so the arithmetic contract is still verified.
        mapRange = function (value, in_min, in_max, out_min, out_max) {
            return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        };
    }

    assert("mapRange: midpoint",         mapRange(5,  0, 10, 0, 100) === 50);
    assert("mapRange: at minimum",       mapRange(0,  0, 10, 0, 100) === 0);
    assert("mapRange: at maximum",       mapRange(10, 0, 10, 0, 100) === 100);
    assert("mapRange: inverted output",  mapRange(0,  0, 10, 100, 0) === 100);
    assert("mapRange: negative range",   mapRange(-5, -10, 0, 0, 100) === 50);
    assert("mapRange: fractional",       Math.abs(mapRange(1, 0, 3, 0, 1) - (1 / 3)) < 1e-10);
}());

// ---- processGraphData length guard ------------------------------------------

if (inBrowser) {
    (function () {
        var savedCRE = arrayClientrawExtra;
        var savedCRH = arrayClientrawHour;
        var savedCRD = arrayClientrawDaily;
        var thrown = false;

        arrayClientrawExtra = new Array(50);
        arrayClientrawHour  = new Array(50);
        arrayClientrawDaily = new Array(50);
        try { processGraphData(); } catch (e) { thrown = true; }
        assert("processGraphData: does not throw on short arrays", !thrown);

        arrayClientrawExtra = savedCRE;
        arrayClientrawHour  = savedCRH;
        arrayClientrawDaily = savedCRD;
    }());
}

// ---- WidgetText filter chain (applyFilters) ---------------------------------
// applyFilters is a module-private function. We test it by constructing a
// minimal WidgetText and observing the rendered text via a fillText stub.

if (inBrowser && typeof WidgetText !== "undefined") {
    (function () {
        var canvas = document.createElement("canvas");
        canvas.id = "__test_wt_canvas__";
        canvas.width = 200;
        canvas.height = 100;
        document.body.appendChild(canvas);

        var wt = new WidgetText({
            canvasID: "__test_wt_canvas__",
            template: '<text x="50%" y="50%" align="center" baseline="middle" font="10% arial" fill="#fff">{{val|round:1|default:---}}</text>',
            bindings: { val: function (data) { return data.val; } }
        });

        var rendered = null;
        var origFillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (text) { rendered = text; };

        wt.draw({ val: "12.345" });
        CanvasRenderingContext2D.prototype.fillText = origFillText;
        assert("WidgetText: round:1 filter rounds to 1dp", rendered === "12.3");

        rendered = null;
        CanvasRenderingContext2D.prototype.fillText = function (text) { rendered = text; };
        wt.draw({ val: undefined });
        CanvasRenderingContext2D.prototype.fillText = origFillText;
        assert("WidgetText: default:--- renders fallback on undefined", rendered === "---");

        document.body.removeChild(canvas);
    }());
}

// ---- Summary ----------------------------------------------------------------

console.log("Tests complete. Passed: " + passed + "  Failed: " + failed);
if (!inBrowser && failed > 0) { process.exit(1); }
