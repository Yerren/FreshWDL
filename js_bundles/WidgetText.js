/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetText: generic template-driven text widget. Accepts an HTML-like
// template string of <shape>/<text> elements with {{field|filter|...}}
// placeholders, and a `bindings` map saying where each field comes from.
//
// Minimum config:
//   canvasID : canvas element id
//   bindings : { fieldName: "clientraw[N]" | fn | ... }   (see DataBindings.js)
//   template : string (parsed once at setUp())
//
// Optional config:
//   unitEvents : array of unit keys that should trigger redraw on toggle
//   extras     : { key: string | function }  static values exposed as {{key}}
//                (e.g. extras: { title: useDict("apparentTitle") })
//
// Template grammar (canvas-based, not real HTML; parsed with a small regex
// tokenizer so IE9+ is fine):
//
//   <shape type="roundedRect" x="5%" y="60%" w="90%" h="35%"
//          radius="10%" strokeSize="2.5%" fill="#F6F6F6" stroke="black"/>
//   <text x="50%" y="25%" align="center" baseline="middle"
//         font="bold 20% arial" fill="black" maxWidth="stage">{{title}}</text>
//
// Metric values support additive expressions, with each term being a number
// (pixels) or percent. Percent suffix picks axis: "%w" / "%h"; bare "%"
// defaults to the axis the attribute naturally lives on (x/w -> width,
// y/h/radius -> height, strokeSize -> width).
//   x="5%"                  -> canvas.width * 0.05
//   y="100%h - 40%h - 5%w"  -> canvas.height - canvas.height*0.4 - canvas.width*0.05
//
// Fonts accept "NN% arial", "NN%h arial", or "NN%w arial"; bare "%"
// defaults to height.
//
// Text attributes:
//   maxWidth:
//     "N%"       -> setMaxWidthGivenWidth(text, canvas.width * N/100)
//     "stage"    -> setFontMaxWidth (centered, stage-aware)
//     "stageLeft"-> setFontMaxWidthLeft
//     (absent)   -> no constraint
//   sharpen:     "false" to disable pixel-snapping of x/y (default on).
//
// Placeholder filter chain: {{field|filter:arg|filter:arg|...}}
//   round:N      -> value.toFixed(N)
//   unit:KEY     -> formatDataToUnit(value, KEY) + unit suffix
//   default:TEXT -> fallback for undefined/null/NaN/"---"
//   dict:KEY     -> useDict(value) (value is a key)
//
// `extras` resolution order for a field name: bindings > extras > config.

(function (global) {

    // ---- template parsing -------------------------------------------------

    // Split "<tag attr=... />" from inner text. Returns array of element
    // descriptors. Supports self-closing <shape .../> and paired <text>...</text>.
    function tokenizeTemplate(src) {
        var elements = [];
        var re = /<(shape|text)\s+([^>]*?)\/>|<(shape|text)\s+([^>]*?)>([\s\S]*?)<\/\3>/g;
        var m;
        while ((m = re.exec(src)) !== null) {
            var tag, attrStr, inner;
            if (m[1]) { tag = m[1]; attrStr = m[2] || ""; inner = ""; }
            else      { tag = m[3]; attrStr = m[4] || ""; inner = m[5] || ""; }
            elements.push({
                tag: tag,
                attrs: parseAttrs(attrStr),
                inner: inner
            });
        }
        return elements;
    }

    function parseAttrs(str) {
        var out = {};
        var re = /([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*"([^"]*)"/g;
        var m;
        while ((m = re.exec(str)) !== null) {
            out[m[1]] = m[2];
        }
        return out;
    }

    // Metric grammar (composable additive expression):
    //   term      := number | number "%" | number "%w" | number "%h"
    //   metric    := term (("+" | "-") term)*
    //   defaultAxis: which axis a bare "%" term resolves against ("w" or "h").
    //   "%w"/"%h" override per-term.
    function parseMetric(val, defaultAxis) {
        if (val === undefined || val === null || val === "") { return null; }
        var s = String(val).trim();
        // Tokenize: split on + / - while keeping the sign for each term.
        var terms = [], re = /([+-])?\s*(-?\d+(?:\.\d+)?)(%[wh]?)?/g, m;
        while ((m = re.exec(s)) !== null) {
            var sign = (m[1] === "-") ? -1 : 1;
            var num = parseFloat(m[2]);
            var suffix = m[3];
            var termAxis, termKind;
            if (!suffix) {
                termKind = "px";
            } else {
                termKind = "pct";
                if (suffix === "%w") { termAxis = "w"; }
                else if (suffix === "%h") { termAxis = "h"; }
                else { termAxis = defaultAxis === "h" ? "h" : "w"; }
            }
            terms.push({ sign: sign, num: num, kind: termKind, axis: termAxis });
        }
        if (terms.length === 0) { return null; }
        return function (c) {
            var total = 0, i, t;
            for (i = 0; i < terms.length; i++) {
                t = terms[i];
                if (t.kind === "pct") {
                    total += t.sign * (t.axis === "h" ? c.height : c.width) * (t.num / 100);
                } else {
                    total += t.sign * t.num;
                }
            }
            return total;
        };
    }

    // Font string with optional "NN%" size component. Suffix picks axis:
    //   "20%"  or "20%h" -> canvas.height * 0.20 + "px"   (default = h)
    //   "20%w"           -> canvas.width  * 0.20 + "px"
    function parseFont(val) {
        if (!val) { return function () { return "0px Arial"; }; }
        var s = String(val);
        var re = /(-?\d+(?:\.\d+)?)%([wh])?/;
        var m = s.match(re);
        if (m) {
            var pct = parseFloat(m[1]) / 100;
            var axis = m[2] || "h";
            var before = s.substring(0, m.index),
                after = s.substring(m.index + m[0].length);
            return function (c) {
                var base = (axis === "w") ? c.width : c.height;
                return before + (base * pct) + "px" + after;
            };
        }
        return function () { return s; };
    }

    // ---- placeholder parsing ---------------------------------------------

    // Parse "{{field|round:1|unit:temp}}" segments from a string into a
    // list of either literal-strings or token objects.
    function parseTemplateString(str) {
        var parts = [];
        var re = /\{\{([^}]+)\}\}/g;
        var last = 0, m;
        while ((m = re.exec(str)) !== null) {
            if (m.index > last) { parts.push({ literal: str.substring(last, m.index) }); }
            parts.push(parseToken(m[1]));
            last = m.index + m[0].length;
        }
        if (last < str.length) { parts.push({ literal: str.substring(last) }); }
        return parts;
    }

    function parseToken(body) {
        var pieces = body.split("|");
        var field = pieces[0].trim();
        var filters = [];
        for (var i = 1; i < pieces.length; i++) {
            var p = pieces[i].trim();
            var colon = p.indexOf(":");
            if (colon === -1) {
                filters.push({ name: p, arg: null });
            } else {
                filters.push({ name: p.substring(0, colon), arg: p.substring(colon + 1) });
            }
        }
        return { field: field, filters: filters };
    }

    function isBlank(v) {
        return v === undefined || v === null || v === "" || v === "---" ||
               (typeof v === "number" && isNaN(v));
    }

    function applyFilters(value, filters) {
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];
            switch (f.name) {
            case "round":
                if (!isBlank(value)) {
                    var n = Number(value);
                    value = isNaN(n) ? value : n.toFixed(parseInt(f.arg, 10) || 0);
                }
                break;
            case "unit":
                if (typeof formatDataToUnit === "function") {
                    value = formatDataToUnit(value, f.arg);
                }
                if (typeof units !== "undefined" && units[f.arg]) {
                    value = value + units[f.arg][currentUnits[f.arg]][1];
                }
                break;
            case "default":
                if (isBlank(value)) { value = f.arg; }
                break;
            case "dict":
                if (typeof useDict === "function") {
                    value = useDict(f.arg || value);
                }
                break;
            default:
                // Unknown filter: leave value untouched.
                break;
            }
        }
        return value;
    }

    function renderParts(parts, ctx) {
        var out = "";
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p.literal !== undefined) {
                out += p.literal;
            } else {
                var v = ctx[p.field];
                if (typeof v === "function") { v = v(); }
                v = applyFilters(v, p.filters);
                if (v === undefined || v === null) { v = ""; }
                out += v;
            }
        }
        return out;
    }

    // ---- widget ----------------------------------------------------------

    function WidgetText(config) {
        config = config || {};
        config.canvasID = config.canvasID || config.elementId;
        CanvasWidget.call(this, config);

        this._templateSrc = config.template || "";
        this._templateNodes = [];   // [{type, shape|text, attrs (parsed), parts?}, ...]
    }
    WidgetBase.inherit(WidgetText, CanvasWidget);

    // Resolve `extras` entries (functions are called once at read time).
    WidgetText.prototype._readExtras = function () {
        var out = {}, e = this.config.extras || {};
        for (var k in e) {
            if (Object.prototype.hasOwnProperty.call(e, k)) {
                out[k] = (typeof e[k] === "function") ? e[k]() : e[k];
            }
        }
        return out;
    };

    WidgetText.prototype.setUp = function () {
        if (!this._templateSrc) { return; }
        var tokens = tokenizeTemplate(this._templateSrc);

        for (var i = 0; i < tokens.length; i++) {
            var tok = tokens[i];
            if (tok.tag === "shape") {
                this._templateNodes.push(this._createShapeNode(tok.attrs));
            } else if (tok.tag === "text") {
                this._templateNodes.push(this._createTextNode(tok.attrs, tok.inner));
            }
        }
    };

    WidgetText.prototype._createShapeNode = function (a) {
        var type = a.type || "rect",
            fill = a.fill || null,
            stroke = (a.stroke === "none") ? false : (a.stroke || null),
            record;
        if (type === "roundedRect") {
            record = this.createRoundedBar({ fill: fill, stroke: stroke });
        } else if (type === "circle") {
            record = this.createCircle({ fill: fill, stroke: stroke });
        } else {
            record = this.createRect({ fill: fill, stroke: stroke });
        }
        return {
            type: "shape",
            shapeType: type,
            record: record,
            metrics: {
                x: parseMetric(a.x, "w"),
                y: parseMetric(a.y, "h"),
                w: parseMetric(a.w, "w"),
                h: parseMetric(a.h, "h"),
                radius: parseMetric(a.radius, "h"),
                strokeSize: parseMetric(a.strokeSize, "w")
            }
        };
    };

    WidgetText.prototype._createTextNode = function (a, inner) {
        var text = this.createText("", {
            align: a.align || "center",
            baseline: a.baseline || "middle",
            color: a.fill || "black"
        });
        // maxWidth values:
        //   "N%"       -> setMaxWidthGivenWidth(text, canvas.width * N/100)
        //   "stage"    -> setFontMaxWidth (centered, stage-aware)
        //   "stageLeft"-> setFontMaxWidthLeft (left-aligned, stage-aware)
        //   absent     -> no constraint.
        var mw = a.maxWidth || null;
        var maxWidthMode = null, maxWidthPct = null;
        if (mw === "stage") {
            maxWidthMode = "stage";
        } else if (mw === "stageLeft") {
            maxWidthMode = "stageLeft";
        } else if (mw && mw.charAt(mw.length - 1) === "%") {
            maxWidthMode = "pct";
            maxWidthPct = parseFloat(mw) / 100;
        }
        return {
            type: "text",
            text: text,
            parts: parseTemplateString(inner || ""),
            metrics: {
                x: parseMetric(a.x, "w"),
                y: parseMetric(a.y, "h"),
                font: parseFont(a.font),
                maxWidthMode: maxWidthMode,
                maxWidthPct: maxWidthPct,
                sharpen: (a.sharpen !== "false")
            }
        };
    };

    WidgetText.prototype._laySingleShape = function (node) {
        var c = this.canvas, m = node.metrics, r = node.record;
        if (r.strokeCommand && m.strokeSize) {
            r.strokeCommand.width = m.strokeSize(c);
        } else if (r.strokeCommand) {
            r.strokeCommand.width = Math.max(1, c.width / 80);
        }
        if (node.shapeType === "circle") {
            if (m.x) { r.circleCommand.x = m.x(c); }
            if (m.y) { r.circleCommand.y = m.y(c); }
            if (m.radius) { r.circleCommand.radius = m.radius(c); }
        } else {
            if (m.x) { r.rectCommand.x = m.x(c); }
            if (m.y) { r.rectCommand.y = m.y(c); }
            if (m.w) { r.rectCommand.w = m.w(c); }
            if (m.h) { r.rectCommand.h = m.h(c); }
            if (m.radius && node.shapeType === "roundedRect") {
                var rad = m.radius(c);
                r.rectCommand.radiusTL = r.rectCommand.radiusTR =
                r.rectCommand.radiusBL = r.rectCommand.radiusBR = rad;
            }
        }
    };

    WidgetText.prototype._laySingleText = function (node) {
        var c = this.canvas, m = node.metrics, t = node.text;
        // Text positions are sharpened by default (matches legacy updateTopXxx
        // behavior); set sharpen="false" on <text> to disable.
        var sharpen = (m.sharpen !== false);
        if (m.x) { t.x = sharpen ? sharpenValue(m.x(c)) : m.x(c); }
        if (m.y) { t.y = sharpen ? sharpenValue(m.y(c)) : m.y(c); }
        t.font = m.font(c);
        if (m.maxWidthMode === "pct") {
            setMaxWidthGivenWidth(t, c.width * m.maxWidthPct);
        } else if (m.maxWidthMode === "stage") {
            setFontMaxWidth(t, c, this.stage);
        } else if (m.maxWidthMode === "stageLeft") {
            setFontMaxWidthLeft(t, c, this.stage);
        }
    };

    // Canvas sizing is handled by CanvasWidget.resize (width-driven, with
    // canvas.height = width * aspectRatio). updateTop() lays out template
    // nodes against the freshly sized canvas; parseMetric's "h" axis thus
    // resolves to a width-derived value, preserving existing template
    // semantics while making drawings depend only on width.
    WidgetText.prototype.updateTop = function () {
        for (var i = 0; i < this._templateNodes.length; i++) {
            var n = this._templateNodes[i];
            if (n.type === "shape") { this._laySingleShape(n); }
            else { this._laySingleText(n); }
        }
        this._render();
    };

    WidgetText.prototype._render = function () {
        var ctx = this.readBindings();
        var extras = this._readExtras();
        for (var k in extras) {
            if (Object.prototype.hasOwnProperty.call(extras, k) && ctx[k] === undefined) {
                ctx[k] = extras[k];
            }
        }
        for (var i = 0; i < this._templateNodes.length; i++) {
            var n = this._templateNodes[i];
            if (n.type === "text") {
                n.text.text = renderParts(n.parts, ctx);
            }
        }
    };

    WidgetText.prototype.onDataUpdate = function () { this._render(); };
    WidgetText.prototype.redrawForUnitChange = function () { this._render(); };

    global.WidgetText = WidgetText;
})(typeof window !== "undefined" ? window : this);
