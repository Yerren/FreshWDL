# FreshWDL OO Conversion — Finishing the Job

## Context
The repo has been restructured per `OO_CONVERSION_PLAN.md`: `WidgetsHandlers.js` is replaced by ES5 constructor-function classes (`WidgetBase`, `CanvasWidget`, `DomHandler`, `WidgetBar`/`WidgetGauge`/`WidgetChart`/`WidgetText`, per-widget subclasses), plus a `WidgetFactory`/`WidgetRegistry`/`DataManager`/`App` bootstrap layer, served through a standalone `index-oo.html`.

A review of the converted code found that while the architecture is sound and IE-safe, three of the plan's stated benefits were only partially delivered:
1. **Latent bugs** from the mechanical translation (property-name casing desync in two widgets).
2. **The category layer is empty** — `WidgetBar`, `WidgetGauge`, `WidgetText` carry no real behaviour; most duplicated layout math lives in the leaf widgets.
3. **`App.onDataRefresh` leaks widget-specific knowledge** (chart IDs, `arrayClientraw` indices, modal refresh call) back into the bootstrap, undoing the decoupling the registry was meant to provide.
4. **`_listeners` cleanup is half-built** — the array is populated but never consumed; direct `addEventListener` calls in widget `initialize()` overrides bypass it entirely.

The goal of this work is to finish the conversion so it actually meets the plan's headline benefit: eliminating duplication and making individual widgets small, focused, and genuinely extensible.

---

## Approach (confirmed with developer)

1. **Populate the category layer with real helpers** — keep `WidgetBar`/`WidgetGauge`/`WidgetText` as distinct bases; move shared logic into them.
2. **Merge `TempBarWidget` + `WindchillWidget`** into one config-driven `TemperatureBarWidget` (tempBar01/02/03 and windchill all become instances).
3. **Fully decouple `App.onDataRefresh`** — widgets subscribe to their own data events; `App` stops knowing about specific IDs.
4. **Finish the `_listeners` cleanup path** — add `WidgetBase.destroy()`, route every listener through helpers.

---

## Progress

- ✅ **Step 1** — latent casing bugs fixed. (Also extended to `SolarBarWidget`, `HumidityGaugeWidget`, `UniBarWidget`, which had the same `valuesOLD` all-caps convention — normalised to `valuesOld` across the whole widgets directory.)
- ✅ **Step 2** — template-method `WidgetBase.initialize()` / `DomHandler.initialize()`; leaf widgets no longer override `initialize`.
- ✅ **Step 3** — category layer populated (shape/text/dash/label/trendArrow factory helpers on `CanvasWidget`; `updateTweens()` hook; parent-class fixes for `StatusWidget`, `MoonSunWidget`, `TitleRainfallWidget`, `WindGaugeWidget`).
- ✅ **Step 4** — `TemperatureBarWidget` replaces `TempBarWidget` + `WindchillWidget`; manifest and script includes updated; originals deleted.
- ✅ **Step 5** — `App.onDataRefresh` deleted; `DataManager` dispatches `clientRawHour/Daily` events and a `graphDataUpdated` event; `MainChartWidget` and `ModalGraphHandler` subscribe directly.
- ✅ **Step 6** — `WidgetBase.destroy()` + `WidgetRegistry.destroyAll()` added; `attachResizeHandlers` tracks the `matchMedia` listener; listener audit clean.
- ✅ **Step 7** — `WidgetChart.canvas`/`chartContext` rename; `ModalGraphHandler` DOM IDs parameterised via `config.elementIds`; `RecordsHandler` `recordsDictOld` dead guard removed and outside-click routed through `addEventListener` + `_listeners`.

---

## Implementation steps

### Step 1 — Fix the latent casing bugs (small, standalone) — DONE

These were trivial and unblock confident editing of the affected files.

- `js_bundles/widgets/TempBarWidget.js` lines 143, 162: renamed `v.TempIn` → `v.tempIn` (match the lowercase init at line 85).
- `js_bundles/widgets/WindchillWidget.js` lines 142, 161: same rename.
- `js_bundles/widgets/WindGaugeWidget.js`, `SolarBarWidget.js`, `HumidityGaugeWidget.js`, `UniBarWidget.js`: renamed `valuesOLD` → `valuesOld` throughout.

### Step 2 — Template-method `WidgetBase.initialize()`

Currently every canvas widget subclass overrides `initialize()` with near-identical boilerplate:
```
resolveCanvas() → createStage() → attachFrameUpdate() → attachTooltip()
addEventListener("clientRaw*DataUpdate", function() { self.draw(...); })
setUp() → attachResizeHandlers() → resize() → markLoaded()
```

`WidgetBase.listenForData(eventName)` (`js_bundles/WidgetBase.js:45-50`) already tracks handlers correctly — it's unused.

Change:
- Rewrite `WidgetBase.prototype.initialize` (`js_bundles/WidgetBase.js:60-63`) as a template method that calls a fixed sequence of hooks: `resolveElement()` → `preSetup()` → `setUp()` → `wireDataEvents()` → `attachResizeHandlers()` → `resize()` → `markLoaded()`.
- `CanvasWidget.prototype.initialize` (the path `resolveCanvas`/`createStage`/`attachFrameUpdate`/`attachTooltip`) becomes the `preSetup()` override on `CanvasWidget`.
- `wireDataEvents()` reads `this.config.dataEvents` — an array of `{ event, handler }` pairs — and routes each through `listenForData`. Leaf widgets stop writing `window.addEventListener` directly.
- Each leaf widget's `initialize()` override is removed; the manifest in `index-oo.html` gains a `dataEvents` entry on config where needed (or the widget sets it in its constructor). `config.dataFn` already exists on temp-bars — widen it to a list.

Files touched: `WidgetBase.js`, `CanvasWidget.js`, `DomHandler.js`, every widget in `js_bundles/widgets/`, every handler in `js_bundles/handlers/`, `index-oo.html` (manifest).

### Step 3 — Populate the category layer

**`WidgetBar.js`** — add:
- `drawDashTrack({ orientation, dashCount, largeEvery, bounds })` — replaces the near-identical dash loops in `SolarBarWidget.js:256-277`, `UniBarWidget.js:147-172`, `TempBarWidget.js:260-284`, `WindSpeedWidget.js:220-239`.
- `drawLabelTrack({ ... })` — matching helper for the label strip.
- `renderRoundedBar({ fillCommand, strokeCommand, bounds })` — consolidates the repeated `createjs.Graphics` rounded-rect setup.

Keep the existing `attachFrameUpdate` override that calls `updateTweens()` + `stage.update()`.

**`WidgetGauge.js`** — add:
- `rotatePointer(pointerObject, angleDeg)` — shared by `HumidityGaugeWidget` and `WindGaugeWidget`.
- `drawRadialDashes({ cx, cy, innerR, outerR, count, largeEvery })`.
- `drawRadialLabels({ cx, cy, radius, count, labels })`.

Keep the existing `updateTweens` frame-update override.

**`WidgetText.js`** — replace the empty marker class with a real template:
- Constructor accepts `{ texts: [{ id, role }], shapes: [{ id, role }] }` on config.
- `setUp()` creates a `createjs.Text` for each text spec and a `createjs.Shape` for each shape spec, storing them on `this.textElements[id]` / `this.shapeElements[id]`.
- `layout(specs)` — helper for subclasses to compute positions and font sizes from `canvas.width`/`height`.
- `ApparentWidget`, `MoonSunWidget`, `TitleRainfallWidget`, `StatusWidget` are re-homed to use this. `StatusWidget` keeps a tween for the pulsing circle — for that, `WidgetText` needs to optionally install the `attachFrameUpdate` → `updateTweens` wiring (or `StatusWidget` can override `attachFrameUpdate` itself the way `WidgetBar` does).

**Fix inheritance assignments along the way:**
- `MoonSunWidget.js:23`: `CanvasWidget` → `WidgetText`.
- `TitleRainfallWidget.js:11`: `CanvasWidget` → `WidgetText`.
- `StatusWidget.js:21`: `WidgetBar` → `WidgetText` (preserving tween wiring — see above).
- `WindGaugeWidget.js:43`: `WidgetBar` → `WidgetGauge`.

### Step 4 — Merge `TempBarWidget` + `WindchillWidget`

Create `js_bundles/widgets/TemperatureBarWidget.js` as a single class. Delete both originals.

Config flags:
- `withArrow: bool` — draws the trend arrow (tempBar01 = true; others = false).
- `withAutoSwitch: bool` — enables the realTemp-based mode switch between windchill/heatIndex (windchill = true; temp bars = false).
- `modeKey: string | null` — the `widgetList` key that holds the `mode` setting (`"windChill"` for windchill, null for temp bars).
- `titleSource: { mode: "dict"|"static", key: string, modeMap?: { windchill: string, heatIndex: string } }` — the current per-mode title lookup.
- `tooltipSource: same shape` — same for Opentip content.
- `dataFn: function` — already present; extend to include the autoSwitch inputs when needed.

Implementation notes:
- `formatInput()` moves in essentially unchanged — both widgets have identical code today.
- `updateTweens()` is shared; the arrow bits gate on `this.config.withArrow`.
- `setUp()` uses the new `WidgetBar.drawDashTrack` / `drawLabelTrack` helpers from Step 3.
- `draw()` takes `(tempIn, highTempIn, lowTempIn, trend?, unitChange?)` and no-ops the `trend` branch when `withArrow` is false.
- `autoSwitch()` stays as a method but is only called when `withAutoSwitch` is true.

Update `index-oo.html` manifest entries:
- `temperature`, `temperature02`, `temperature03` → `Ctor: TemperatureBarWidget`, `config: { withArrow: …, … }`.
- `windChill` → `Ctor: TemperatureBarWidget`, `config: { withArrow: false, withAutoSwitch: true, modeKey: "windChill", titleSource: { mode: "dict", modeMap: { windchill: "windchillTitle", heatIndex: "heatIndexTitle" } }, … }`.

### Step 5 — Fully decouple `App.onDataRefresh`

Currently `App.js:41-66` hard-codes chart names, their `(dataType, timeRange)` configs, the status widget's `arrayClientraw` indices, and the modal refresh.

- `App.onDataRefresh` becomes a simple `this.registry.broadcast("dataRefresh")` (add a `broadcast(eventName)` method on `WidgetRegistry.js` that iterates `getAll()` and calls `widget.onDataRefresh` when present). Or simpler: since each widget already subscribes to the underlying `clientRaw*DataUpdate` events, `App.onDataRefresh` can be deleted entirely and `DataManager`'s `onUpdate` callback becomes a no-op.
- **Chart widgets** (`MainChartWidget`): already have `defaultBase` and `defaultRange` on their manifest config (see `index-oo.html:116-117,128-129,140-141,152-153`). Add a constructor-time subscription via `listenForData("clientRawHourDataUpdate")` etc., and have the handler call `this.configureGraph(this.config.defaultBase, this.config.defaultRange)`. (Each chart's relevant event depends on its data source — see `WidgetsHandlers.js` legacy code for mapping: baro/temp/wind use hourly, rain uses daily.)
- **StatusWidget**: subscribe to all four `clientRaw*DataUpdate` events; `draw()` reads `arrayClientraw[49]`, `[32]`, `[74]` itself instead of receiving them as arguments. The "must always update" comment (`App.js:55`) is only true because the pulsing animation is time-based — the tween already runs on `frameUpdate` independently of data events.
- **ModalGraphHandler**: subscribe to the same data events and call `this.refresh()` (which already exists at `handlers/ModalGraphHandler.js:198-202`).

After this, `App.js` shrinks to just layout detection, ticker init, factory build, and `DataManager.start()` — no per-widget knowledge.

### Step 6 — Finish `_listeners` cleanup

- `WidgetBase.js`: add `destroy()` that iterates `this._listeners`, calls `window.removeEventListener(l.event, l.handler)` for each, then clears the array.
- `CanvasWidget.attachFrameUpdate`, `CanvasWidget.attachResizeHandlers`, `CanvasWidget.attachTooltip` — audit each to confirm the listeners they install are pushed to `this._listeners`. (Some already are — see `WidgetGauge.js:19`. Confirm `attachResizeHandlers` + `attachTooltip`.)
- `DomHandler` equivalents — same audit.
- After Step 2, no widget should be calling `window.addEventListener` directly, so this step mostly becomes a verification pass.
- Add `WidgetRegistry.destroyAll()` as a convenience (iterates `getAll()` and calls `destroy()`).

### Step 7 — Small nits (optional, low-risk)

Lump these into the same PR since they're trivial:
- `WidgetChart.js:32-34`: rename `this.canvas` (which is actually a 2D context) to `this.chartContext`; `this.canvasElement` becomes `this.canvas` to match `CanvasWidget` convention.
- `MoonSunWidget.js`, `TitleRainfallWidget.js`: add default `config.canvasID` in constructors like `ApparentWidget.js:9-13`.
- `RecordsHandler.js:80-83`: delete the dead `recordsDictOld` guard (the reference never changes; real update path is the event listener on line 107).
- `RecordsHandler.js:122-126`: replace `window.onclick = ...` with `window.addEventListener("click", ..., false)` (current code stomps any other page-level click handler) and register the handler in `_listeners`.
- `ModalGraphHandler.js:219-223`: accept the five DOM element IDs from config instead of hard-coding them; keep current values as config defaults.

---

## Critical files to modify

**Base classes:**
- `js_bundles/WidgetBase.js` — template-method `initialize()`, `destroy()`, already has `extend`/`inherit`/`listenForData`.
- `js_bundles/CanvasWidget.js` — move canvas+stage+tooltip setup into a `preSetup()` hook.
- `js_bundles/DomHandler.js` — mirror the template-method pattern.
- `js_bundles/WidgetBar.js` — add `drawDashTrack`, `drawLabelTrack`, `renderRoundedBar`.
- `js_bundles/WidgetGauge.js` — add `rotatePointer`, `drawRadialDashes`, `drawRadialLabels`.
- `js_bundles/WidgetText.js` — replace empty marker with text/shape template class.
- `js_bundles/WidgetRegistry.js` — add `broadcast(eventName)`, `destroyAll()`.

**Widget files:**
- `js_bundles/widgets/TemperatureBarWidget.js` — new (merged from TempBarWidget + WindchillWidget).
- Delete `TempBarWidget.js`, `WindchillWidget.js`.
- `SolarBarWidget.js`, `UniBarWidget.js`, `UVBarWidget.js`, `WindSpeedWidget.js` — use `WidgetBar` helpers, drop `initialize()` override.
- `HumidityGaugeWidget.js`, `WindGaugeWidget.js` — use `WidgetGauge` helpers, fix `WindGaugeWidget` parent.
- `ApparentWidget.js`, `StatusWidget.js`, `MoonSunWidget.js`, `TitleRainfallWidget.js` — use `WidgetText` template, fix parents.
- `BarometerWidget.js`, `MainChartWidget.js` — use template-method `initialize`; chart widget subscribes to its own data events.

**Handlers:**
- `handlers/ModalGraphHandler.js`, `ModalHandler.js`, `RecordsHandler.js`, `ForecastHandler.js`, `ButtonsHandler.js` — align with template-method pattern; subscribe to data events directly where needed.

**Bootstrap:**
- `js_bundles/App.js` — delete `onDataRefresh` body; becomes a thin broadcast or no-op.
- `index-oo.html` — update manifest config objects to match new constructor signatures (especially the temperature/windchill consolidation and any `dataEvents` additions).

**Untouched:**
- `js_bundles/DataManager.js` (already clean).
- `js_bundles/WidgetFactory.js` (already clean; `isEnabled`/`buildOne` logic fine).
- `js_bundles/Globals.js` (legacy-format config — unchanged per plan).
- `js_bundles/WidgetsHandlers.js` and `.min.js` (legacy; untouched, still used by `FreshWDL.html`).

---

## Existing utilities to reuse

- `WidgetBase.listenForData(eventName)` — already does tracked `addEventListener` with `onDataUpdate(eventName)` dispatch. Step 2 routes every data listener through this.
- `WidgetBase.extend(target, source)` — hand-rolled `Object.assign` replacement. Use for config merging in the factory and anywhere else we build option objects.
- `WidgetBase.inherit(Child, Parent)` — prototype-chain helper. Use for every class.
- `WidgetBase.markLoaded()` — gates the load screen fade-out via legacy `checkOffLoaded`. Already called by widgets; keep the contract.
- `DataHelpers.js` (`Number.prototype.map`, `formatTimestampsToMoments`, `processRecord`, `processRecordsData`, `processGraphData`) — already extracted and in use; no changes needed.
- `setFontMaxWidth`, `sharpenValue`, `formatDataToUnit`, `useDict` — existing globals from legacy `Globals.js`/`WidgetsHandlers.js`; the new helpers in `WidgetBar`/`WidgetGauge` should lean on them for all text/rounding/unit math.

---

## Verification

No automated tests exist. Validation is manual:

1. Open `index-oo.html` in a browser (Chrome/Firefox). Confirm the loading screen clears and every widget renders: apparent, temperature bars 1/2/3, windchill (or heat index), barometer, humidity, wind direction, wind speed, solar, UV, rainfall day/month/year, all four main charts, status, moon/sun, forecast text, records button.
2. Trigger unit-button clicks (five buttons) — all widgets and charts must re-render with new units.
3. Open the graph modal by clicking any main-page chart — modal graph should populate and be resizable.
4. Open the records modal — table should populate, all three select options (month/year/all-time) should switch correctly.
5. Leave the page running for ~15 seconds to confirm the pulsing status circle animates smoothly and chart data updates on the next poll.
6. Resize the browser window — all widgets should reflow without error; rotate a mobile device (or use devtools responsive mode) to confirm the mobile `matchMedia` resize path.
7. In the devtools console: `app.registry.getAll()` should return the expected widget set; `Object.keys(window).filter(k => k.match(/^(tempBar|apparent|humidity|windGauge|status|moonSun|rainfallDay|rainfallMonth|rainfallYear|barometer|windSpeed|solar|UV|baroGraph|rainGraph|tempGraph|windGraph)/))` should confirm the legacy globals are still exposed (the plan requires backwards compatibility for internal references).
8. For Step 6 specifically: in the console, call `app.registry.destroyAll()` and confirm no errors; then re-run a data poll and confirm no stale handlers fire (easy check: before destroy, count `getEventListeners(window).clientRawDataUpdate`; after, it should be zero).
9. Compare side-by-side with the legacy `FreshWDL.html` open in another tab — visual output should be identical (no regressions in colours, positions, animations, unit formatting).
10. Test with `widgetList.temperature02.enabled = false` (and similar toggles) in `config.js` to confirm the factory correctly hides disabled widgets.

---

## Out of scope

- Magic-number cleanup inside layout math (`c.width * 0.9` etc.) — intentionally inherited from legacy code.
- Minification (`WidgetsHandlersOO.min.js`) — separate concern, handled at merge time.
- Removing or replacing the legacy `WidgetsHandlers.js` / `WidgetsHandlers.min.js` — left alongside for `FreshWDL.html` until final merge, per the original plan's Phase 5.
- Automated tests — no test harness exists in the repo; introducing one is a separate project.
