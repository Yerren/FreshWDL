/*jslint plusplus: true, sloppy: true, indent: 4 */
// CanvasWidget: extends WidgetBase. Owns a canvas element, a CreateJS stage,
// a frameUpdate tick listener for animation, desktop/mobile resize wiring,
// and an Opentip tooltip. Provides shared createjs shape/text factory helpers
// for bar/gauge/text subclasses to eliminate the copy-paste setUp() code.

(function (global) {
    function CanvasWidget(config) {
        WidgetBase.call(this, config);
        this.canvas = null;
        this.stage = null;
        this.setupVars = {};
        this.tooltipText = config.tooltipText || null;
        if (config.aspectRatio) { this.aspectRatio = config.aspectRatio; }
    }
    WidgetBase.inherit(CanvasWidget, WidgetBase);

    // Intrinsic height/width ratio. Subclasses override on the prototype.
    // With width-driven sizing, canvas.height = canvas.width * aspectRatio,
    // so every drawing measurement is deterministic from width alone.
    CanvasWidget.prototype.aspectRatio = 1.0;

    // Default resize: contain-fit. Canvas grows to fill the slot but is
    // capped by whichever of slot.clientWidth / slot.clientHeight hits the
    // wall first, preserving aspectRatio (= height / width). If the slot
    // has no usable height (clientHeight === 0), fall back to width-driven.
    // Subclasses override applyStageTransform() to recompute stage.x/y
    // offsets once the canvas has been resized.
    CanvasWidget.prototype.resize = function () {
        if (!this.canvas) { return; }
        var parent = this.canvas.parentElement;
        if (!parent) { return; }
        if (this.config.sizer) {
            this.config.sizer(this.canvas, parent);
        } else {
            var W = parent.clientWidth,
                H = parent.clientHeight,
                w, h;
            if (W <= 0) { return; }
            if (H <= 0 || W * this.aspectRatio <= H) {
                w = W;
                h = W * this.aspectRatio;
            } else {
                h = H;
                w = H / this.aspectRatio;
            }
            this.canvas.width = w;
            this.canvas.height = h;
        }
        this.applyStageTransform();
        if (typeof this.updateTop === "function") { this.updateTop(); }
    };

    // No-op by default. Widgets with stage offsets override this.
    CanvasWidget.prototype.applyStageTransform = function () {};

    CanvasWidget.prototype.resolveCanvas = function () {
        if (this.config.canvas) {
            this.canvas = this.config.canvas;
        } else if (this.elementId) {
            this.canvas = document.getElementById(this.elementId);
        } else if (this.config.canvasID) {
            this.canvas = document.getElementById(this.config.canvasID);
        }
        return this.canvas;
    };

    CanvasWidget.prototype.createStage = function () {
        this.stage = new createjs.Stage(this.canvas);
    };

    CanvasWidget.prototype.attachFrameUpdate = function () {
        var self = this;
        var handler = function () {
            self.updateTweens();
            self.stage.update();
        };
        window.addEventListener("frameUpdate", handler);
        this._listeners.push({ event: "frameUpdate", handler: handler });
    };

    CanvasWidget.prototype.updateTweens = function () {};

    CanvasWidget.prototype.attachResizeHandlers = function () {
        var self = this,
            handler = function () { self.resize(); };
        if (typeof onMobile !== "undefined" && onMobile === false) {
            window.addEventListener("resize", handler, false);
            this._listeners.push({ event: "resize", handler: handler });
        } else {
            // Deprecated MediaQueryList.addListener used intentionally: the
            // IE9+ compatibility floor rules out addEventListener("change") on
            // matchMedia. destroy() pairs this with removeListener via target.
            var mql = window.matchMedia("(orientation: portrait)");
            mql.addListener(handler);
            this._listeners.push({ event: "orientation", handler: handler, target: mql });
        }
    };

    CanvasWidget.prototype.attachTooltip = function () {
        if (this.tooltipText && typeof Opentip !== "undefined") {
            this.tooltip = new Opentip(this.canvas, this.tooltipText, {
                background: "#D3D3D3",
                shadowColor: "#D3D3D3",
                borderColor: "#D3D3D3"
            });
        }
    };

    CanvasWidget.prototype.initialize = function () {
        if (this.resolveCanvas() === null) { return; }
        this.createStage();
        this.attachFrameUpdate();
        this.attachTooltip();

        var events = this.config.events || [];
        for (var i = 0; i < events.length; i++) {
            this.listenForData(events[i]);
        }
        var unitEvents = this.config.unitEvents || [];
        for (var j = 0; j < unitEvents.length; j++) {
            this.listenForUnitChange(unitEvents[j]);
        }

        this.setUp();
        this.attachResizeHandlers();
        this.resize();
        this.markLoaded();
    };

    CanvasWidget.prototype.hideIfDisabled = function () {
        if (!this.enabled) {
            var el = this.config.canvas || (this.elementId && document.getElementById(this.elementId)) ||
                     (this.config.canvasID && document.getElementById(this.config.canvasID));
            if (el) { el.style.display = "none"; }
        }
    };

    // ---------- Shared shape/text factory helpers ----------

    // Allocate `count` moveTo/lineTo dash Shapes. Stores on this.dash/
    // dashStrokeCommand/dashStartCommand/dashEndCommand. Layout (x/y/width)
    // is applied by the subclass' updateTop().
    CanvasWidget.prototype.createDashes = function (count) {
        this.dash = this.dash || [];
        this.dashStrokeCommand = this.dashStrokeCommand || [];
        this.dashStartCommand  = this.dashStartCommand  || [];
        this.dashEndCommand    = this.dashEndCommand    || [];
        for (var i = 0; i < count; i++) {
            var shape = new createjs.Shape();
            shape.snapToPixel = true;
            shape.graphics.beginStroke("black", 1);
            this.dashStrokeCommand[i] = shape.graphics.setStrokeStyle(0).command;
            this.dashStartCommand[i]  = shape.graphics.moveTo(0, 0).command;
            this.dashEndCommand[i]    = shape.graphics.lineTo(0, 0).command;
            this.dash[i] = shape;
            this.stage.addChild(shape);
        }
    };

    // Allocate `count` label Text objects. Defaults: right-aligned (good for
    // vertical bar scales). Pass align:"center" for radial gauge labels.
    CanvasWidget.prototype.createLabels = function (count, opts) {
        opts = opts || {};
        var align = opts.align || "right",
            baseline = opts.baseline || "middle",
            color = opts.color || "black";
        this.label = this.label || [];
        for (var i = 0; i < count; i++) {
            var t = new createjs.Text("0px Arial", color);
            t.textBaseline = baseline;
            t.textAlign    = align;
            this.label[i] = t;
            this.stage.addChild(t);
        }
    };

    // Outlined rounded-rect shape. Returns { shape, strokeCommand, rectCommand }.
    CanvasWidget.prototype.createRoundedBar = function (opts) {
        opts = opts || {};
        var shape = new createjs.Shape();
        shape.snapToPixel = true;
        if (opts.stroke !== false) { shape.graphics.beginStroke(opts.stroke || "black"); }
        if (opts.fill) { shape.graphics.beginFill(opts.fill); }
        var strokeCmd = shape.graphics.setStrokeStyle(0).command,
            rectCmd   = shape.graphics.drawRoundRect(0, 0, 0, 0, 0).command;
        this.stage.addChild(shape);
        return { shape: shape, strokeCommand: strokeCmd, rectCommand: rectCmd };
    };

    // Outlined rect shape. Returns { shape, strokeCommand, rectCommand }.
    CanvasWidget.prototype.createRect = function (opts) {
        opts = opts || {};
        var shape = new createjs.Shape();
        shape.snapToPixel = true;
        if (opts.stroke !== false) { shape.graphics.beginStroke(opts.stroke || "black"); }
        if (opts.fill) { shape.graphics.beginFill(opts.fill); }
        var strokeCmd = shape.graphics.setStrokeStyle(0).command,
            rectCmd   = shape.graphics.drawRect(0, 0, 0, 0).command;
        this.stage.addChild(shape);
        return { shape: shape, strokeCommand: strokeCmd, rectCommand: rectCmd };
    };

    // Circle shape. Returns { shape, strokeCommand (or null), circleCommand }.
    CanvasWidget.prototype.createCircle = function (opts) {
        opts = opts || {};
        var shape = new createjs.Shape(),
            strokeColorCmd = null,
            fillColorCmd = null;
        shape.snapToPixel = true;
        if (opts.stroke) { strokeColorCmd = shape.graphics.beginStroke(opts.stroke).command; }
        if (opts.fill)   { fillColorCmd = shape.graphics.beginFill(opts.fill).command; }
        var strokeCmd = shape.graphics.setStrokeStyle(0).command,
            circleCmd = shape.graphics.drawCircle(0, 0, 0).command;
        this.stage.addChild(shape);
        return {
            shape: shape,
            strokeCommand: strokeCmd,
            circleCommand: circleCmd,
            strokeColorCommand: strokeColorCmd,
            fillColorCommand: fillColorCmd
        };
    };

    // Text object with common options (font set later in updateTop()).
    CanvasWidget.prototype.createText = function (textStr, opts) {
        opts = opts || {};
        var align = opts.align || "center",
            baseline = opts.baseline || "middle",
            color = opts.color || "black",
            t = new createjs.Text(textStr || "", "0px Arial", color);
        t.textBaseline = baseline;
        t.textAlign    = align;
        this.stage.addChild(t);
        return t;
    };

    // Single straight-line shape (moveTo + lineTo). Returns the shape plus
    // handles to the stroke/start/end commands so subclasses can mutate
    // position/width later. Replaces the hand-rolled beginStroke/moveTo/
    // lineTo blocks in HumidityGaugeWidget.botLine and
    // TemperatureBarWidget's high/low markers.
    CanvasWidget.prototype.createLine = function (opts) {
        opts = opts || {};
        var shape = new createjs.Shape();
        shape.snapToPixel = true;
        shape.graphics.beginStroke(opts.stroke || "black");
        var strokeCmd = shape.graphics.setStrokeStyle(opts.width || 0).command,
            startCmd = shape.graphics.moveTo(0, 0).command,
            endCmd   = shape.graphics.lineTo(0, 0).command;
        if (opts.addToStage !== false) { this.stage.addChild(shape); }
        return { shape: shape, strokeCommand: strokeCmd, startCommand: startCmd, endCommand: endCmd };
    };

    // Build the two-shape trend-arrow (vertical bar + chevron) used by
    // TempBarWidget and HumidityGaugeWidget. Returns an object with all the
    // commands the caller updates in updateTop().
    CanvasWidget.prototype.createTrendArrow = function (opts) {
        opts = opts || {};
        var color = opts.color || "black",
            middle = new createjs.Shape(),
            pointer = new createjs.Shape(),
            out = {};
        middle.snapToPixel = true;
        middle.graphics.beginStroke(color);
        out.middleLine = middle;
        out.middleLineStrokeCommand = middle.graphics.setStrokeStyle(10).command;
        out.middleLineStrokeCommand.caps = "round";
        out.middleLineStartCommand = middle.graphics.moveTo(0, 0).command;
        out.middleLineEndCommand   = middle.graphics.lineTo(100, 100).command;
        this.stage.addChild(middle);

        pointer.snapToPixel = true;
        pointer.graphics.beginStroke(color);
        out.pointerLine = pointer;
        out.pointerLineStrokeCommand = pointer.graphics.setStrokeStyle(10).command;
        out.pointerLineStrokeCommand.caps = "round";
        out.pointerLineStartCommand = pointer.graphics.moveTo(0, 0).command;
        out.pointerLineMidCommand   = pointer.graphics.lineTo(50, 50).command;
        out.pointerLineEndCommand   = pointer.graphics.lineTo(100, 100).command;
        this.stage.addChild(pointer);
        return out;
    };

    global.CanvasWidget = CanvasWidget;
})(typeof window !== "undefined" ? window : this);
