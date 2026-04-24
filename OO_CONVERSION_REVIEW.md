# OO Conversion — Post-Remediation Review

## Context
The repo has been restructured per `OO_CONVERSION_PLAN.md`, cleaned up per `OO_CONVERSION_CLEANUP_PLAN.md`, and further remediated per `OO_CONVERSION_REMEDIATION_PLAN.md`. This is a read-only review against the original goals: **eliminating duplication, decoupling bootstrap from widget-specific knowledge, IE-safe ES5 OO hierarchy, and genuinely extensible category classes.**

Overall: architecture is sound, IE constraints respected, the bootstrap path is clean, the `TemperatureBarWidget` merge is a real win, `DataManager`/`App.destroy`/`_listeners` tracking all landed. The codebase has shrunk from a single ~7,941-line file to ~4,900 lines spread across focused files. What follows is the gap between stated goals and current state.

---

## What's working well

- **Two-root hierarchy** (`CanvasWidget` + `DomHandler` under minimal `WidgetBase`) is clean and used consistently. `inherit()` used correctly across all 13 widgets + 5 handlers (verified — no mis-parented classes remain).
- **`App` is thin** (`App.js` 63 lines): layout → factory → ticker → `DataManager.start()`. `onDataRefresh` is genuinely gone.
- **Widget/event decoupling**: `MainChartWidget`, `StatusWidget`, `ModalGraphHandler` subscribe to their own `clientRaw*DataUpdate` events via `listenForData`.
- **`TemperatureBarWidget` consolidation** replaces both `TempBarWidget` and `WindchillWidget` via config flags — meaningful de-duplication.
- **`unitChange_<unitType>` event + `listenForUnitChange`** is a clean replacement for the old `ButtonsHandler.updateUnits` god-method. `ButtonsHandler.updateUnits` collapsed to 4 lines.
- **Listener tracking** (`_listeners` + `WidgetBase.destroy()` + `WidgetRegistry.destroyAll()` + `App.stop()`/`destroy()`) is complete and symmetric: DOM-target, `matchMedia`-target, and `window` listeners all handled.
- **`WidgetFactory.buildOne`** shallow-clones `entry.config` before mutation (nit from remediation plan Step E).
- **`WidgetRegistry`** now exposes both `getAll()` and `all` as alias — consistent with verification scripts.

---

## Outstanding issues (ordered by impact)

### 1. Category layer still essentially empty (remediation Step A — only partial)

- `WidgetBar.js` (14 lines) and `WidgetText.js` (13 lines) are **pure marker classes** — they own no methods. Only `WidgetGauge` has real behaviour (`rotatePointer`, `drawRadialDashesAndLabels`).
- Shape factories (`createDashes`, `createLabels`, `createRoundedBar`, `createRect`, `createCircle`, `createText`, `createTrendArrow`) live on `CanvasWidget` despite being used almost exclusively by bar/gauge/text leaves. The plan's stated goal ("bug fixes in a base class fix all widgets") isn't realised where it matters most.
- **Duplicated dash/label loops still live in leaves**: `SolarBarWidget.js:222-244`, `TemperatureBarWidget.js:299-323`, `UniBarWidget`, `WindSpeedWidget`. These share the same `i % 10 === 0 → major` / `i % 5 === 0 → mid` / `else → minor` structure. An extracted helper on `WidgetBar` (`drawLinearDashTrack({ orientation, majorCount, subdivisions, ... })`) would collapse all four.
- `WidgetText.js` never became the template class the plan described — `ApparentWidget`, `StatusWidget`, `MoonSunWidget`, `TitleRainfallWidget` still build their own `createjs.Text` / `createjs.Shape` trees manually.

**Recommendation:** finish Step A. Move bar-specific factories into `WidgetBar`, gauge-specific into `WidgetGauge`, promote `WidgetText` to a `{texts:[…], shapes:[…]}` template. Keep only the truly generic bits on `CanvasWidget`.

### 2. Bespoke `createjs.Shape` construction bypasses the factories

Even where the factories exist, several widgets build shapes manually:
- `TemperatureBarWidget.js:438-450` — `highMarker` / `lowMarker` built raw instead of via a line/stroke factory.
- `HumidityGaugeWidget.js:46-62` — `botLine` and `pointer` built raw. These are the most complex pieces; a shared `createLine({from, to, stroke})` would eliminate two `moveTo/lineTo/setStrokeStyle` blocks.
- `StatusWidget.js:146-151` — the pulsing circle is built raw instead of via `createCircle`.
- `HumidityGaugeWidget.js:75-79` — `label` array rebuilt via `createText` in a loop, but the existing `createLabels(count, opts)` helper (`CanvasWidget.js:120`) does exactly this and is only called via `createDashes`/`createLabels` elsewhere.

These are small, but every one is a missed opportunity for the factories to "pay for themselves".

### 3. `ForecastHandler` still contains the `onclick =` anti-pattern (remediation Step D regression)

`ForecastHandler.js:74` — `this.showMoreLink.onclick = function () { ... }` inside `formatAndDisplay()`. Every call (each `clientRawExtraDataUpdate` tick) that overflows the div will re-create the link element and re-assign `onclick`, leaking intent and bypassing `_listeners`. The handler is reset each poll so it won't grow unbounded, but it defeats the whole listener-tracking discipline the remediation added.

**Recommendation:** `addEventListener("click", handler)` + push to `_listeners` with `target: this.showMoreLink`. Or lift the handler out of `formatAndDisplay` entirely — the modal is the same every time.

### 4. `MainChartWidget.configureGraph` destroys + rebuilds Chart.js every poll

`MainChartWidget.js:145-148`: `this.chart.destroy(); this.chart = null; this.drawChart();` runs on every `graphDataUpdated` event. This is inherited legacy behaviour, but now that the code is OO, it's a natural candidate for an in-place update (`chart.data.datasets[0].data = …; chart.update()`). Real-world impact: minor memory churn, animation restart on every poll.

### 5. `DataManager` has four near-identical `updateClientraw*` methods

`DataManager.js:77-151` — 75 lines of boilerplate that varies only by URL, target global, done-flag, attempted-flag, and error-flag. Collapsible to one helper:
```
DataManager.prototype.updatePoll = function (url, arrayKey, flags) { … }
```
This is the cleanest single de-duplication win still available anywhere in the codebase.

### 6. Residual bootstrap coupling in `ButtonsHandler.updateUnits`

`ButtonsHandler.js:22-24` still does:
```js
var records = reg.get("recordHandler");
if (records) { records.updateValues(); }
```
This is a small residue of the "bootstrap knows about specific widget IDs" pattern the remediation plan removed from `App`. `RecordsHandler` could subscribe to any of the five `unitChange_*` events itself (or a single `unitChange` meta-event) and refresh on its own — matching how `MainChartWidget` handles it. That makes `updateUnits` a pure dispatch.

### 7. Inconsistent use of `DomHandler.resolveElement` / `elementId`

- `ForecastHandler.setUp()` line 24 calls `document.getElementById("forecastText")` manually instead of trusting the `DomHandler.initialize` → `resolveElement` pipeline (which just did it and stored it in `this.element`).
- `ButtonsHandler` never sets a root `elementId` and does five manual `document.getElementById`s in `setUp()`. Works, but the `DomHandler` base isn't doing anything useful here.
- `ModalHandler` is similar: manual `getElementById` in `setUp` for `myModal`, `graphClose`, `selectMenu`.

**Recommendation:** either drop `resolveElement` from `DomHandler.initialize` for these cases (single-root doesn't fit "handler owning many DOM nodes") or move the element lookups into `resolveElement` via a `config.elementIds` map.

### 8. Minor / cosmetic

- `HumidityGaugeWidget.js:31` — `this.pointerCommand = { tip: null, lBase: null, rBase: null }` still pre-allocates properties that `setUp` immediately overwrites with command objects (remediation Step E claimed this was cleaned up; this instance was missed).
- `HumidityGaugeWidget.js:89, 100` — `!=` loose comparisons. JSLint-unfriendly and semantically surprising when `trend` switches between string and number.
- `StatusWidget.js:1-4` — comment still says "called directly by App.onDataRefresh … because it must always update"; `App.onDataRefresh` no longer exists.
- `CanvasWidget.attachResizeHandlers:52` — `mql.addListener(handler)` uses the deprecated MediaQueryList API. IE-safe, but modern browsers prefer `addEventListener("change", handler)`. Keep as-is if IE9 is a hard requirement, but worth a comment.
- `HumidityGaugeWidget.js:116` — typo `innerCricleRad` (also 153, 157). Carried over from legacy.
- `TemperatureBarWidget.setUp:438-462` — the high/low marker group is added/removed from the stage based on `wl.highLowEnabled`. If `highLowEnabled` is toggled at runtime (it isn't today, but could be), nothing re-syncs the stage. Not a bug today; noting as latent.

---

## Summary

The three plans collectively delivered the important structural wins: OO hierarchy, decoupled bootstrap, listener lifecycle, factory/registry. The **remaining gap is the "populated category layer" promise** — `WidgetBar`/`WidgetText` still buy nothing, which means the goal of "bug fixes in a base class fix all widgets" only half applies (gauges yes, bars/text no).

Highest-value remaining work, in order:
1. Finish remediation Step A (shared `WidgetBar`/`WidgetText` helpers, kill duplicated dash/label loops).
2. Fix `ForecastHandler` `onclick =` anti-pattern.
3. Collapse `DataManager`'s four polling methods into one.
4. In-place Chart.js update in `MainChartWidget.configureGraph`.
5. Let `RecordsHandler` subscribe to `unitChange_*` directly; drop the `reg.get("recordHandler")` call from `ButtonsHandler`.

None of the above are regressions or bugs — the app should work as intended. They are all "finish the conversion's stated benefits" items.

---

## Resolution (follow-up pass)

Addressed on branch `OO-Conversion`:
- **#1 (partial)** — `WidgetBar.drawLinearDashTrack` added; `SolarBarWidget`, `TemperatureBarWidget`, `UniBarWidget`, `WindSpeedWidget` all now delegate the major/mid/minor dash loop. `WidgetText` template deferred: the current text leaves have layout logic too varied for a shared template without bending each one awkwardly — revisit when a new text widget is added.
- **#2** — `CanvasWidget.createLine` added; used by `HumidityGaugeWidget.botLine` and `TemperatureBarWidget` high/low markers. `createCircle` now exposes `strokeColorCommand`/`fillColorCommand`; `StatusWidget` pulse circle uses it.
- **#3** — `ForecastHandler` uses event delegation on `displayDiv` (tracked in `_listeners`); no more `onclick =`.
- **#4** — `MainChartWidget.configureGraph` mutates in place; `drawChart` remains the first-time path.
- **#5** — `DataManager.updatePoll` helper; four `updateClientraw*` methods are 3-line wrappers.
- **#6** — `RecordsHandler` subscribes to all five `unitChange_*` events via `config.unitEvents`; `ButtonsHandler.updateUnits` is now a pure dispatch.
- **#8 (most)** — Humidity `pointerCommand` no longer pre-allocated; `!=` → `!==` (via `String()` coercion); `innerCricleRad` renamed; StatusWidget stale `App.onDataRefresh` comment replaced; `mql.addListener` deprecation annotated in both `CanvasWidget` and `DomHandler`.
- **#7 (deferred)** — DOM hygiene cleanup left for a follow-up: the `resolveElement` / manual-`getElementById` split is real but the cost of unwinding handler `this.element` vs `this.displayDiv` naming outweighs the win today.
