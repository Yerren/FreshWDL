# OO Conversion Plan for FreshWDL

## Overview

This document outlines the plan for converting FreshWDL from a procedural, copy-paste architecture (currently a single ~7,941-line `WidgetsHandlers.js`) to an object-oriented system using ES5 constructor functions (for IE compatibility).

The system is split into **two hierarchies**:
- **Canvas widgets** — CreateJS/Chart.js rendered visualisations (gauges, bars, charts, text displays).
- **DOM handlers** — div-based UI (forecast, records, modal, buttons, ticker).

A shared `WidgetBase` owns only the cross-cutting concerns (id, enabled flag, config, data-update listener). Rendering/stage concerns live on `CanvasWidget`; DOM-manipulation concerns live on `DomHandler`.

In addition to widgets themselves, the conversion brings the bootstrap and data layer into classes:
- **`DataManager`** — owns `updateClientraw()`, `tryUpdateWidgets()`, and `loadEvents` dispatch.
- **`App`** (bootstrap) — owns `initialiseLayout()`, `onMobile`, `checkOffLoaded()` load-tracking, and orchestrates `DataManager` + `WidgetRegistry`.

---

## Phase 1: Base Classes

### Goal
Create a foundational `WidgetBase` + two root classes (`CanvasWidget`, `DomHandler`) that absorb all the repeated boilerplate from `WidgetsHandlers.js`.

### Base-class responsibilities

**`WidgetBase`** (shared, minimal)
- Holds `id`, target element id, `enabled`, user-supplied `config` blob, `values`/`valuesOld`/`tweens` scratch state.
- Registers the `clientRawDataUpdate` listener in one place.
- Provides abstract hooks (`setUp`, `draw`, `onDataUpdate`, `resize`) that subclasses override.

**`CanvasWidget`** (extends `WidgetBase`)
- Resolves the canvas element, creates the CreateJS `Stage`, registers the `frameUpdate` listener that calls `stage.update()`.
- Installs desktop (`window.resize`) or mobile (`matchMedia` orientation) resize handlers based on `onMobile`.
- Creates Opentip tooltip against the canvas.
- Provides helpers that multiple current widgets duplicate (e.g. `sharpenValue`, `formatDataToUnit` wrappers, dash/label layout helpers).

**`DomHandler`** (extends `WidgetBase`)
- Resolves a DOM element by id (no canvas, no stage, no ticker).
- Provides show/hide/enable/disable against that element.
- Used by forecast, records, modal, buttons, and the ticker.

### File structure
```
js_bundles/
  ├── WidgetBase.js          (new - shared minimal base)
  ├── CanvasWidget.js        (new - canvas/stage/ticker root)
  ├── DomHandler.js          (new - dom-element root)
  ├── WidgetGauge.js         (new - CanvasWidget subclass for circular gauges)
  ├── WidgetBar.js           (new - CanvasWidget subclass for bar displays)
  ├── WidgetChart.js         (new - CanvasWidget subclass using Chart.js; bypasses stage/ticker)
  ├── WidgetText.js          (new - CanvasWidget subclass for text/simple displays)
  ├── widgets/               (new directory)
  │   ├── TemperatureBarWidget.js
  │   ├── HumidityGaugeWidget.js
  │   ├── BarometerWidget.js
  │   ├── WindChillWidget.js
  │   ├── RainfallBarWidget.js
  │   └── ... (one file per unique widget subclass)
  ├── handlers/              (new directory)
  │   ├── ForecastHandler.js
  │   ├── RecordsHandler.js
  │   ├── ModalHandler.js
  │   ├── GraphHandler.js
  │   ├── ButtonsHandler.js
  │   └── TickerHandler.js
  ├── WidgetFactory.js       (new - creates widgets/handlers from config)
  ├── WidgetRegistry.js      (new - manages all instances)
  ├── DataManager.js         (new - clientraw polling + change detection + event dispatch)
  ├── App.js                 (new - bootstrap: layout detection, load tracking, orchestration)
  ├── Globals.js             (existing - holds widgetList, graphList, language dictionaries)
  └── WidgetsHandlers.js     (REPLACED - all code migrated to new structure)
```

> `widgetList` and `graphList` live in `Globals.js` (not `config.js`). The adapter reads them from there.

---

## Phase 2: Widget Hierarchy Design

### Inheritance chain (two roots)

```
WidgetBase
  ├── CanvasWidget
  │     ├── WidgetGauge (circular/radial)
  │     │     ├── HumidityGauge
  │     │     └── WindDirectionGauge
  │     │
  │     ├── WidgetBar (vertical/horizontal bar rendering)
  │     │     ├── TemperatureBar            (tempBar01/02/03)
  │     │     ├── RainfallBar               (rainfall bars)
  │     │     ├── WindChill                 (windchill01)
  │     │     └── WidgetBar direct instances
  │     │             ├── solarBar01 (solar)
  │     │             ├── uvBar01 (UV)
  │     │             └── uniBar01/02/03  (generic uni bars — no subclass)
  │     │
  │     ├── WidgetChart  *(Chart.js; does NOT use CreateJS stage or the frameUpdate ticker)*
  │     │     └── instances: baroGraph, rainGraph, tempGraph, windGraph
  │     │
  │     └── WidgetText (configurable text/graphic displays)
  │           └── instances: apparent01, status01, moonSun01, titleRainfall01
  │
  └── DomHandler
        ├── ForecastHandler
        ├── RecordsHandler
        ├── ModalHandler
        ├── GraphHandler       (modal chart UI)
        ├── ButtonsHandler
        └── TickerHandler      (news/status ticker)
```

### Key simplifications
- **`WidgetBar`** renders solar, UV, and the three `uniBar` displays directly via config — no subclass.
- **`WidgetChart`** is a single class that handles all four main-page charts (`baroGraph`, `rainGraph`, `tempGraph`, `windGraph`) via config. Note: it draws through Chart.js, so it bypasses `CanvasWidget`'s stage and ticker wiring — it only reuses the canvas resolution, resize handling, and data-update listener.
- **`WidgetText`** is a single class covering apparent, status, moonSun, and titleRainfall via a flexible text/shape config.
- **`DomHandler`** subclasses never touch CreateJS, Opentip-on-canvas, or `frameUpdate`. They each get a DOM element and own its visibility, events, and inner content.

---

## Phase 3: Configuration Strategy

### Legacy-only input

`config.js` stays in its current shape. The existing globals remain the only inputs:
- `currentUnits` — user's default unit choices.
- `gaugeSettings` — per-widget `enabled` flags + widget-specific settings (e.g. `windChill.mode`).
- `graphSettings` — per-graph `enabled` flags.
- `widgetList` and `graphList` (from `Globals.js`) — derived from the above during init.

### Config adapter
- `WidgetFactory.createFromLegacyConfig(widgetList, graphList, gaugeSettings, graphSettings, currentUnits)` is the **sole entry point** into the OO system.
- It transforms those globals into per-widget config objects and instantiates the correct subclass for each.
- No new widget-config format is introduced; backwards compatibility is total.

---

## Phase 4: Implementation Steps

### Step 1 — `WidgetBase` + `CanvasWidget` + `DomHandler`
- `WidgetBase` constructor: store `id`, target element id, `enabled`, `config`, initialise `values/valuesOld/tweens`. Bind data-update handler and register the `clientRawDataUpdate` listener.
- `CanvasWidget` (subclass): resolve canvas, build CreateJS stage, register `frameUpdate` → `stage.update()`, attach desktop/mobile resize handlers based on `onMobile`, create canvas-anchored Opentip tooltip, call `checkOffLoaded()` when ready.
- `DomHandler` (subclass): resolve a DOM element by id; expose `show()`/`hide()`/`enable()`/`disable()`; no stage, no ticker, no canvas-only helpers.
- All three expose abstract hooks (`setUp`, `draw`, `onDataUpdate`, `resize`) for their subclasses to override.

### Step 2 — Specialised canvas classes
- **`WidgetGauge`**: holds outer/inner circle, pointer, dash marks, labels. Provides shared dash-drawing and pointer-rotation routines reused by `HumidityGauge` and `WindDirectionGauge`.
- **`WidgetBar`**: holds rounded-rect fill, stroke, title/description text. Config drives orientation, colour, title/description lookup, data source, min/max range, and width/height ratios. Used directly for solar/UV/uniBar; subclassed for temperature, rainfall, and wind-chill.
- **`WidgetChart`**: owns a Chart.js instance bound to the canvas's 2D context. Skips the CreateJS stage and the `frameUpdate` listener. Exposes a `configureGraph(dataType, timeRange)` method that replaces the current per-graph `configureGraphBaroLine01` / `configureGraphRainBar01` / etc.
- **`WidgetText`**: renders N configurable text elements and N configurable shapes on the stage. Layout template chosen per-instance; drives apparent, status, moonSun, titleRainfall without bespoke subclasses.

### Step 3 — Convert widgets to the new system

Conversion order (lowest complexity first):

1. **Simple text widgets** (proof of concept for `WidgetText`)
   - apparent01, status01, titleRainfall01, moonSun01
2. **Simple bars** (validate `WidgetBar` flexibility)
   - solarBar01, uvBar01, uniBar01/02/03
3. **Custom bars** (need subclasses)
   - TemperatureBar → tempBar01/02/03
   - RainfallBar instances
   - WindChill → windchill01
4. **Gauges**
   - HumidityGauge, WindDirectionGauge (and windSpeed if it stays a gauge)
5. **Charts** (validate `WidgetChart` handles all four)
   - baroGraph, rainGraph, tempGraph, windGraph
6. **DOM handlers**
   - ForecastHandler, RecordsHandler, ModalHandler, GraphHandler, ButtonsHandler, TickerHandler

Each subclass overrides `setUp`/`draw`/`onDataUpdate`/`resize` only where behaviour diverges from the base. Temperature bars, for example, add high/low markers and auto-range adjustment on top of `WidgetBar`.

### Step 4 — `WidgetRegistry` and `WidgetFactory`

- **`WidgetFactory`** maps type strings (`"TemperatureBar"`, `"Gauge"`, `"Chart"`, `"Text"`, `"ForecastHandler"`, …) to constructor functions and creates instances from config objects. **Must not use `Object.assign`** — it's ES2015 and breaks IE ≤11. Use a small hand-rolled `extend(target, source)` helper instead.
- **`WidgetFactory.createFromLegacyConfig(...)`** reads `widgetList`, `graphList`, `gaugeSettings`, `graphSettings`, and `currentUnits`, and produces a map of `{id → widget instance}`.
- **`WidgetRegistry`** stores widgets by id, exposes `get(id)` / `getAll()`, iterates `initializeAll()` (calling `initialize()` on enabled widgets; hiding the canvas of disabled ones), and provides `exposeGlobals()` which assigns each widget to its legacy global name (`apparent01`, `solarBar01`, `tempBar01`, …) so nothing inside the codebase that still references the old names breaks during the transition.

### Step 5 — `DataManager` and `App` bootstrap

- **`DataManager`** owns:
  - XHR polling of `clientraw.txt` / `clientrawextra` / `clientrawhour` / `clientrawdaily` at the current intervals.
  - Parsing responses into the `arrayClientraw*` globals.
  - `tryUpdateWidgets()` — detect changes and dispatch the four `loadEvents` CustomEvents (`clientRawDataUpdate`, `clientRawExtraDataUpdate`, etc.).
  - `doneCR/E/H/D` / `attemptedCR/E/H/D` tracking flags.
- **`App`** (bootstrap) owns:
  - `initialiseLayout()` — detect portrait/landscape, set `onMobile`.
  - `checkOffLoaded()` tracking (currently a free function; becomes a method that gates the loading screen fade-out).
  - Orchestration: build widgets via `WidgetFactory`, register them with `WidgetRegistry`, expose globals, start `DataManager`, and kick off the first render.

### Step 6 — New `initAll()`

`initAll()` becomes a thin entry point that constructs `App` and calls `app.start()`. All other logic is delegated to `App`, `DataManager`, `WidgetFactory`, and `WidgetRegistry`.

---

## Phase 5: Migration Strategy

### Complete-replacement approach

1. Create `WidgetBase`, `CanvasWidget`, `DomHandler`, plus the four canvas subclasses (`WidgetGauge`, `WidgetBar`, `WidgetChart`, `WidgetText`).
2. Convert simple widgets first (text widgets, simple bars).
3. Convert complex widgets (temperature bars, gauges).
4. Convert chart widgets.
5. Convert DOM handlers (modal, graph, forecast, records, buttons, ticker).
6. Implement `WidgetFactory` and `WidgetRegistry`.
7. Implement `DataManager` and `App`.
8. Replace `initAll()` completely.
9. Delete `WidgetsHandlers.js` entirely.
10. Manual testing and bug fixes (no automated tests exist).
11. Documentation for creating custom widget subclasses.

### No gradual migration
- All conversion happens on the `OO-Conversion` branch.
- `WidgetsHandlers.js` is fully replaced, not coexisting.
- Deploy only when 100 % complete and tested.
- `master` is unchanged until final merge.

### Bundling / minification
- `FreshWDL.html` currently loads `WidgetsHandlers.min.js`.
- The new HTML file (`index-oo.html`) will either: (a) load each new file individually during development, or (b) concatenate + minify them into a replacement `js_bundles/WidgetsHandlersOO.min.js` for production. Decision to be made before merge; the script-tag list in `index-oo.html` is the source of truth during development.

---

## Phase 6: Benefits After Completion

### Eliminate duplication
- `tempBar01/02/03` → three instances of `TemperatureBar`.
- Solar, UV, `uniBar01/02/03` → instances of `WidgetBar` (no custom class).
- All four graphs → instances of `WidgetChart` (no custom class).
- Apparent, status, titleRainfall, moonSun → instances of `WidgetText` (no custom class).
- Significant line-count reduction is expected (goal, not guaranteed).

### Maintainability
- Bug fixes in a base class fix all widgets.
- Add a feature once — all widgets benefit.
- Individual widgets are easier to reason about and (manually) test.

### Extensibility
- Users can create custom widgets by extending the base classes.
- Widget plugins become possible.
- Custom dashboards are easier to implement.

### Developer experience
- Clear class hierarchy.
- Self-documenting code structure.
- Easier onboarding for contributors.

---

## Notes

- **IE compatibility**: all code uses the ES5 constructor pattern — no ES6 classes, no `Object.assign`, no arrow functions, no `let`/`const`. Target browser support is dictated by the libraries in use: CreateJS (EaselJS 0.8.2, TweenJS 0.6.2), Chart.js (minified), Opentip (native), Moment.js.
- **Backwards compatibility**: `config.js` format is unchanged. The legacy adapter is the sole entry point.
- **Complete replacement**: no gradual migration; full replacement on the `OO-Conversion` branch.
- **Testing**: no automated tests exist — manual testing is required.
- **Deployment**: a new HTML file (`index-oo.html`) will be created for the OO version so it can be tested independently before merging to `master`.
- **Global exposure**: widgets are exposed as globals (`apparent01`, `tempBar01`, …) for internal backwards compatibility only — nothing external consumes these.
- **Implementation approach**: build all base classes first, then convert widgets in order of complexity. No proof-of-concept phase.

---

## Implementation Progress (as of 2026-04-20)

### ✅ Complete — all steps finished

**Base classes** (`js_bundles/`)
- `WidgetBase.js`, `CanvasWidget.js`, `DomHandler.js`
- `WidgetBar.js`, `WidgetGauge.js`, `WidgetChart.js`, `WidgetText.js`
- `WidgetRegistry.js`, `WidgetFactory.js`, `DataManager.js`, `App.js`

**Data layer** (`js_bundles/`)
- `DataHelpers.js` — `Number.prototype.map`, `Array.prototype.equals`, `getExtraInput`, `formatTimestampsToMoments`, `shiftArrayFtL`, `processRecord`, `processRecordsData`, `processGraphData`

**Canvas widgets** (`js_bundles/widgets/`)
- `ApparentWidget.js` — apparent temperature
- `SolarBarWidget.js` — solar radiation bar
- `HumidityGaugeWidget.js` — humidity circular gauge
- `MainChartWidget.js` — all four main-page Chart.js graphs (baro, rain, temp, wind)
- `TempBarWidget.js` — temp bar (covers tempBar01/02/03 via config)
- `WindchillWidget.js` — wind chill / heat index bar with auto-switch
- `BarometerWidget.js` — barometer
- `MoonSunWidget.js` — sun/moon rise-set text display
- `StatusWidget.js` — data status pulsing circle
- `TitleRainfallWidget.js` — rainfall section title
- `UniBarWidget.js` — rainfall day/month/year bars (covers 3 instances via config)
- `UVBarWidget.js` — UV index bar
- `WindGaugeWidget.js` — wind direction compass gauge
- `WindSpeedWidget.js` — wind speed / gust bars with Beaufort colour

**DOM handlers** (`js_bundles/handlers/`)
- `ForecastHandler.js` — forecast text modal
- `RecordsHandler.js` — records table modal
- `ModalGraphHandler.js` — modal Chart.js popup graph
- `ButtonsHandler.js` — five unit-toggle buttons
- `ModalHandler.js` — graph modal wiring + `graphChange` global

**HTML** (`index-oo.html`)
- Fully standalone: `WidgetsHandlers.js` removed, replaced by `DataHelpers.js`
- `runDataManager: true`, `runTicker: true` — all data polling and frame ticking via OO classes
- All widgets registered in manifest; shim is a thin `initAll` that prunes graph datasets and calls `app.start()`

### 🔲 Remaining — manual testing & merge

1. **Manual testing** — load `index-oo.html` in a browser, verify all widgets render and update, all unit buttons work, modal graphs open, records table populates, forecast displays
2. **Bug fixes** — fix any issues found during testing
3. **Minification** (optional) — concatenate + minify all OO files into `WidgetsHandlersOO.min.js` for the production `FreshWDL.html`
4. **Merge to master** — once testing passes, merge `OO-Conversion` branch to `master`

---

## Implementation Clarifications (Added 2026-04-19)

Based on discussion with the developer:

1. **Testing**: no automated tests exist. Manual testing will be performed to ensure widgets render and update correctly.

2. **Browser support**: target whatever the current system supports. The libraries in use are:
   - CreateJS (EaselJS 0.8.2)
   - Chart.js (minified version)
   - Opentip (native, minified)
   - TweenJS 0.6.2
   - Moment.js with locales

   These libraries dictate the minimum browser support (generally IE9+).

3. **Deployment strategy**:
   - Create a new HTML file (e.g. `index-oo.html`) for the OO version.
   - This allows parallel testing without affecting the existing production version.
   - Once validated, it can replace or merge with the master branch.

4. **Backwards compatibility**:
   - Global widget references (`apparent01`, `solarBar01`, `tempBar01`, …) are purely internal.
   - No external code depends on these globals.
   - They only need to work within the FreshWDL codebase itself.

5. **Implementation order**:
   - Create all base classes first (`WidgetBase`, `CanvasWidget`, `DomHandler`, then `WidgetGauge`, `WidgetBar`, `WidgetChart`, `WidgetText`).
   - Convert widgets in order of complexity (text → bars → gauges → charts → DOM handlers).
   - Build `WidgetFactory` and `WidgetRegistry`.
   - Build `DataManager` and `App`.
   - Create a new HTML file with the correct script-loading order.
   - Manual testing and bug fixes.

6. **Decisions confirmed with developer (review pass)**:
   - **Hierarchy**: two roots (`CanvasWidget`, `DomHandler`) under a minimal shared `WidgetBase`. DOM handlers do not inherit canvas/stage/ticker setup.
   - **Scope**: data polling loop (`DataManager`), layout detection / `onMobile` / `checkOffLoaded` (`App`), the ticker (`TickerHandler`), and the buttons (`ButtonsHandler`) are all in scope for the OO conversion — not left as free functions.
   - **Config format**: legacy-only. The factory's `createFromLegacyConfig` is the sole entry point. No new `widgetConfig = {...}` format is introduced.
   - **IE safety**: no `Object.assign`; use a hand-rolled `extend()` helper.
