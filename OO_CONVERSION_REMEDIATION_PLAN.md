# FreshWDL OO Conversion — Post-Cleanup Review & Remediation Plan

## Context

The repo has been converted to OO per `OO_CONVERSION_PLAN.md` and then passed through
`OO_CONVERSION_CLEANUP_PLAN.md`. Architecture is sound and IE-safe, and several cleanup
items genuinely landed (`TemperatureBarWidget` merge, removal of `App.onDataRefresh`,
`WidgetBase.destroy()` + `WidgetRegistry.destroyAll()`, `valuesOld` normalisation).

However, on review, four cleanup-plan steps are marked ✅ but only partially delivered.
The headline benefits of the conversion — eliminating duplicated layout math and keeping
the bootstrap free of widget-specific knowledge — are not fully realised. This plan
captures the gap between the stated cleanup goals and the current state, and proposes
the remaining work needed to close it.

## Findings (current state vs. cleanup plan)

### 1. Category layer is still effectively empty (Cleanup Step 3)
`WidgetBar.js` (14 lines), `WidgetGauge.js` (18 lines), and `WidgetText.js` (13 lines)
are marker classes. The shape-factory helpers that *did* land (`createDashes`,
`createLabels`, `createCircle`, `createRoundedBar`, `createRect`, `createText`,
`createTrendArrow`) sit on `CanvasWidget` rather than the category bases, so the
categorisation currently buys nothing concrete.

Duplicated dash/label/tick loops the cleanup plan explicitly called out still exist:
- `js_bundles/widgets/SolarBarWidget.js:223-244`
- `js_bundles/widgets/UniBarWidget.js` (dash/label loop)
- `js_bundles/widgets/TemperatureBarWidget.js:307-331`
- `js_bundles/widgets/WindSpeedWidget.js` (dash/label loop)
- `js_bundles/widgets/HumidityGaugeWidget.js:195-218` (radial dash/label loop)

`WidgetGauge.rotatePointer` exists but isn't used — `HumidityGaugeWidget.js:120` sets
`this.pointer.rotation` directly.

### 2. Template-method `initialize()` is bypassed (Cleanup Step 2)
`TemperatureBarWidget.js:82-106` still overrides `initialize()` and re-implements the
full `resolveCanvas → createStage → attachFrameUpdate → tooltip → events →
setUp → attachResizeHandlers → resize → markLoaded` sequence that
`CanvasWidget.prototype.initialize` (`CanvasWidget.js:67-82`) already provides.

The override also mutates `this.config.events` in place at lines 93-97, which is a
latent foot-gun if a manifest entry's `config` object is ever reused.

The two reasons for the override (reading `widgetList[modeKey].mode` for `defaultMode`,
and stashing the tooltip onto `widgetList[modeKey].tooltip`) both belong in `setUp()`.

### 3. `ButtonsHandler.updateUnits` re-introduces the coupling Step 5 removed
`App.onDataRefresh` was deleted, but `ButtonsHandler.js:19-68` is now the new god
method: hard-codes every widget id, every `arrayClientraw[N]` index, and a windchill
mode branch. Widgets already expose `redrawForUnitChange()` (e.g.
`SolarBarWidget.js:289`, `HumidityGaugeWidget.js:252`) and these are ignored.

### 4. Listener-cleanup audit incomplete (Cleanup Step 6/7)
- `js_bundles/handlers/ForecastHandler.js:41` still uses `window.onclick = function...`
  (the same anti-pattern Step 7 fixed in `RecordsHandler`). It also stomps whatever
  `ModalHandler.js:55` / `RecordsHandler.js:124` register, depending on load order.
- `ButtonsHandler.js:96-100` registers five click listeners not tracked in
  `_listeners`.
- `ModalHandler.js:51,55` registers click listeners not tracked in `_listeners`.
- `App.initializeTicker` (`App.js:28-35`) adds a `createjs.Ticker` listener that
  `destroyAll()` cannot clean up — no `removeEventListener`, no stored handle.

### 5. Smaller nits
- `MainChartWidget.configureGraph` (`MainChartWidget.js:135-138`) destroys and rebuilds
  the Chart every poll. Legacy behaviour, but cleanup plan claimed reduced churn.
- `MainChartWidget.drawChart:63` leaves placeholder `'Custom Chart Title'`, visible if
  `configureGraph` never runs.
- `WidgetRegistry` exposes `all()`, but the cleanup plan's verification section
  references `getAll()`.
- `WidgetFactory.buildOne:57-58` shares `entry.config` by reference and mutates it
  (`config.id = config.id || entry.id`).
- `HumidityGaugeWidget` constructor preallocates arrays at lines 26-43 that
  `createDashes` / `createTrendArrow` immediately overwrite.

## What's working well (no action needed)

- Two-root hierarchy (`CanvasWidget` + `DomHandler`) matches the plan.
- `DataManager` cleanly owns polling + event dispatch.
- `MainChartWidget` / `ModalGraphHandler` / `StatusWidget` subscribe to their own
  data events — `App.onDataRefresh` really is gone.
- `TemperatureBarWidget` consolidation successfully replaces `TempBarWidget` +
  `WindchillWidget`.
- Manifest-driven factory + `WidgetRegistry` keep wiring centralised.

## Progress (2026-04-22)

- **Step E — ✅ Done.** `WidgetRegistry.getAll()` is the canonical name (`all` is an alias); `WidgetFactory.buildOne` now shallow-clones `entry.config` before mutating; `HumidityGaugeWidget`'s dead preallocated arrays / arrow object literal removed; `MainChartWidget.drawChart` placeholder title replaced with `""`.
- **Step D — ✅ Done.** `WidgetBase.destroy` now also calls `target.removeEventListener` for DOM-element targets. `ForecastHandler`, `ModalHandler`, and `ButtonsHandler` all push every click/window listener into `this._listeners` via a `target`-scoped entry. `App.initializeTicker` stores the tick handler; new `App.stop()` removes it and stops `DataManager`; new `App.destroy()` also calls `registry.destroyAll()`.
- **Step C — ✅ Done.** `ButtonsHandler.updateUnits` collapsed to a single `window.dispatchEvent(new CustomEvent("unitChange_" + unitType))` plus the records refresh. `WidgetBase.listenForUnitChange(unitType)` wires a `unitChange_<unitType>` listener that routes to `redrawForUnitChange()`. `CanvasWidget.initialize` and `DomHandler.initialize` iterate `config.unitEvents`. Widgets declare their unit types and, where missing, gained a `redrawForUnitChange` (Barometer, WindSpeed, UniBar, TemperatureBar, MainChart). `MainChartWidget` auto-derives `unitEvents` from `globalGraphs[defaultBase].unit`.
- **Step B — ✅ Done.** `TemperatureBarWidget.initialize()` override deleted. `config.events` now set in the constructor (no runtime mutation), `defaultMode` read moved into `setUp`, and the custom Opentip construction is an override of `attachTooltip`.
- **Step A — Partially done.** `WidgetGauge` gained `drawRadialDashesAndLabels`, which now replaces the radial dash/label loop in `HumidityGaugeWidget.updateTop`. `rotatePointer` is now load-bearing (used by `HumidityGaugeWidget.updateTweens`). Not done: moving the CanvasWidget shape factories down into `WidgetBar` (they're used equally by bar/gauge/text/chart subclasses, so the categorisation buys little); extracting bar dash loops (mixed tick-density indexing makes a clean shared helper non-trivial); promoting `WidgetText` to a full template class.

## Recommended remediation (priority order)

### Step A — Move shape/layout helpers from `CanvasWidget` into the category bases
- Relocate `createDashes`, `createLabels`, `createRoundedBar`, `createRect` and
  rounded-rect tween logic into `WidgetBar.js`.
- Relocate `rotatePointer`, and add `drawRadialDashes({cx,cy,innerR,outerR,count,
  largeEvery})` + `drawRadialLabels({cx,cy,radius,count,labels})` into
  `WidgetGauge.js`, extracting the loop from `HumidityGaugeWidget.js:195-218`.
- Promote `WidgetText.js` from marker to a real template: `{ texts:[{id,role}],
  shapes:[{id,role}] }` config, `setUp()` creating `this.textElements[id]` /
  `this.shapeElements[id]`, and a `layout(specs)` helper.
- Refactor callers to use the helpers:
  - `SolarBarWidget.js:223-244`, `UniBarWidget`, `TemperatureBarWidget.js:307-331`,
    `WindSpeedWidget` → `WidgetBar` helpers.
  - `HumidityGaugeWidget.js:195-218` → `WidgetGauge` helpers; also replace
    direct `this.pointer.rotation = …` at line 120 with `rotatePointer(...)`.
  - `ApparentWidget`, `MoonSunWidget`, `TitleRainfallWidget`, `StatusWidget` →
    `WidgetText` template.

### Step B — Delete `TemperatureBarWidget.initialize()`
- Move `defaultMode = widgetList[modeKey].mode` read into `setUp()`.
- Move the custom tooltip construction (and `widgetList[modeKey].tooltip = tt`
  back-reference) into an override of `attachTooltip` so the inherited
  `CanvasWidget.prototype.initialize` works unchanged.
- Declare `events` via `config.events` in the constructor (never mutate
  `this.config.events` at runtime).

### Step C — Replace `ButtonsHandler.updateUnits` with a `unitChange` event
- Add `loadEvents.unitChange = new CustomEvent("unitChange", { detail: ... })` in
  `DataManager`, or dispatch a fresh event per call with `unitType` on `.detail`.
- `ButtonsHandler.changeUnit` increments `currentUnits[unit]` and dispatches
  `unitChange` with that unit type.
- Each widget opts in: constructor pushes `"unitChange"` onto its own events list;
  `onDataUpdate(eventName)` dispatches to a new `onUnitChange(unitType)` when
  `eventName === "unitChange"`. Default `onUnitChange` calls existing
  `redrawForUnitChange()` when defined.
- `ButtonsHandler.js:19-68` collapses to `window.dispatchEvent(...)` + the
  records refresh.

### Step D — Finish listener tracking
- `ForecastHandler.js:41`: replace `window.onclick = …` with
  `window.addEventListener("click", handler)` + push to `this._listeners`.
- `ButtonsHandler.js:96-100`: store each button's handler and push
  `{ event: "click", handler, target: button }`. Extend `WidgetBase.destroy` to
  honour `target.removeEventListener` when `target` is a DOM element.
- `ModalHandler.js:51,55`: same treatment.
- `App.js`: in `initializeTicker`, store the tick-handler function and provide a
  `stop()` method that calls `createjs.Ticker.removeEventListener("tick", handler)`
  and `this.dataManager.stop()`. Have `App` expose `destroy()` that also invokes
  `this.registry.destroyAll()`.

### Step E — Nits (bundle with Step D)
- Rename `WidgetRegistry.all()` → `getAll()` (keep `all` as alias if anything
  internal depends on it) so the cleanup-plan verification script works.
- `WidgetFactory.buildOne`: shallow-clone `entry.config` before mutating.
- Remove dead preallocated arrays from `HumidityGaugeWidget.js:26-43`.
- Replace `MainChartWidget.drawChart` placeholder title with `""`.

## Critical files to modify

**Base / category:**
- `js_bundles/CanvasWidget.js` — trim helpers that move down.
- `js_bundles/WidgetBar.js` — receives `createDashes`, `createLabels`,
  `createRoundedBar`, `createRect`, rounded-rect tween math.
- `js_bundles/WidgetGauge.js` — receives `drawRadialDashes`,
  `drawRadialLabels`, make `rotatePointer` load-bearing.
- `js_bundles/WidgetText.js` — replace marker with template class.
- `js_bundles/WidgetBase.js` — extend `destroy()` to support DOM-element
  `target` entries.
- `js_bundles/WidgetRegistry.js` — add `getAll` alias.
- `js_bundles/WidgetFactory.js` — shallow-clone config.
- `js_bundles/App.js` — trackable ticker, `destroy()`.
- `js_bundles/DataManager.js` — add `loadEvents.unitChange` (or free-form
  dispatch).

**Leaf widgets:**
- `js_bundles/widgets/TemperatureBarWidget.js` — drop `initialize()` override,
  move state into `setUp()` / `attachTooltip` override.
- `js_bundles/widgets/SolarBarWidget.js`,
  `js_bundles/widgets/UniBarWidget.js`,
  `js_bundles/widgets/WindSpeedWidget.js` — use `WidgetBar` helpers.
- `js_bundles/widgets/HumidityGaugeWidget.js`,
  `js_bundles/widgets/WindGaugeWidget.js` — use `WidgetGauge` helpers; drop
  dead preallocations.
- `js_bundles/widgets/ApparentWidget.js`,
  `js_bundles/widgets/MoonSunWidget.js`,
  `js_bundles/widgets/TitleRainfallWidget.js`,
  `js_bundles/widgets/StatusWidget.js` — move onto `WidgetText` template.
- `js_bundles/widgets/MainChartWidget.js` — placeholder-title fix.

**Handlers:**
- `js_bundles/handlers/ForecastHandler.js` — addEventListener + `_listeners`.
- `js_bundles/handlers/ModalHandler.js` — tracked listeners.
- `js_bundles/handlers/ButtonsHandler.js` — collapse `updateUnits` to
  `dispatchEvent("unitChange", ...)`; tracked button listeners.

**Entry point:**
- `index-oo.html` — no structural changes expected unless `WidgetText`
  template needs new config keys per widget.

## Existing utilities to reuse

- `WidgetBase.listenForData(eventName)` (`WidgetBase.js:45-50`) — already
  tracked; reuse for the new `unitChange` event — `onDataUpdate(eventName)`
  can branch on `"unitChange"` and delegate to `onUnitChange()`.
- `WidgetBase.extend`, `WidgetBase.inherit` — continue using for IE-safe
  prototype wiring and config merging.
- `WidgetBase.destroy()` (`WidgetBase.js:68-79`) — already branches on
  `entry.target.removeListener`; widen to `removeEventListener` for DOM
  targets.
- Shape factories (`createCircle`, `createRoundedBar`, `createRect`,
  `createText`, `createDashes`, `createLabels`, `createTrendArrow`) — keep
  the contracts; just move ownership to the correct base class.

## Verification

Manual only — no test harness.

1. Load `index-oo.html`; confirm loading screen clears and every widget
   renders: apparent, tempBar01/02/03, windchill, barometer, humidity, wind
   direction, wind speed, solar, UV, rainfall day/month/year, four main
   charts, status, moon/sun, forecast text, records button.
2. Click each of the five unit buttons; confirm every widget and chart
   re-renders in the new unit (including the records table).
3. Open the graph modal by clicking any main-page chart; confirm it
   populates and resizes.
4. Open the records modal; switch between month / year / all-time.
5. Leave running ~30 s; confirm status-circle pulse is smooth and chart
   data updates on the next poll.
6. Resize the browser window and toggle portrait/landscape (devtools);
   confirm reflow with no errors.
7. In devtools console:
   - `app.registry.getAll()` returns the expected widget set.
   - Legacy-global exposure check:
     `Object.keys(window).filter(k => /^(tempBar|apparent|humidity|windGauge|status|moonSun|rainfallDay|rainfallMonth|rainfallYear|barometer|windSpeed|solar|UV|baroGraph|rainGraph|tempGraph|windGraph)/.test(k))`
     — unchanged from before.
   - Before: `getEventListeners(window).click?.length`. After
     `app.registry.destroyAll(); app.stop?.()`: expect `0` (or equal to any
     pre-existing, non-app listeners).
8. Visual side-by-side against `FreshWDL.html` (legacy) in another tab —
   no regressions in colour, position, animation, or unit formatting.
9. Toggle `widgetList.temperature02.enabled = false` in `config.js`;
   confirm factory hides the disabled canvas.

## Out of scope

- Magic-number cleanup in layout math (inherited from legacy).
- Minification / `WidgetsHandlersOO.min.js`.
- Deleting legacy `WidgetsHandlers.js` / `.min.js` (still used by
  `FreshWDL.html`).
- Introducing an automated test harness.
