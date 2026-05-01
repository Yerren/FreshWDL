# FreshWDL Fix Plan

Five priority fixes from the code review. Each section is self-contained — an implementer should be able to work from it alone.

---

## Fix 1 — Remove Duplicate Handler Registrations in `Layout.js`

**Problem:** `Layout.js` (lines 73–267) registers `ModalHandler` twice (`id: "modalHandler"` at line 81 and `id: "modal"` at line 163) and `ButtonsHandler` twice (`id: "buttons"` at line 76 and `id: "buttons2"` at line 169). `WidgetRegistry` lets the second registration silently win. The first instance's event listeners stay attached — this leaks two listeners that fire on every 5-second data update and can never be cleaned up.

**Root cause:** The manifest was edited by hand after a copy-paste and the duplicate was never caught because the app does not validate for uniqueness at startup.

**Steps:**

1. Open `Layout.js`. In the `manifest` array, delete the **second** `ModalHandler` entry — the one with `id: "modal"` (currently around line 163–167):
   ```js
   // DELETE this block:
   {
       id: "modal",
       Ctor: ModalHandler,
       enabledKey: "modalHandler",
       config: {}
   },
   ```
   Keep the first entry (`id: "modalHandler"`).

2. Delete the **second** `ButtonsHandler` entry — the one with `id: "buttons2"` (currently around line 169–172):
   ```js
   // DELETE this block:
   {
       id: "buttons2",
       Ctor: ButtonsHandler,
       config: {}
   },
   ```
   Keep the first entry (`id: "buttons"`).

3. Add a uniqueness assertion at the top of `App.prototype.start` (in `App.js`) so this cannot silently recur. After `manifest` is available, before `factory.buildAll()`:
   ```js
   // Guard: catch duplicate IDs in the manifest at startup
   (function checkManifestIds(manifest) {
       var seen = {};
       manifest.forEach(function (entry) {
           if (seen[entry.id]) {
               throw new Error("Duplicate manifest id: " + entry.id);
           }
           seen[entry.id] = true;
       });
   }(this.manifest));
   ```

4. Verify the layout editor's export template (in `layoutEditor/`) does not re-insert the duplicates on next export. Search the template for `"modal"` and `"buttons2"` to confirm they appear only once.

**Verification:** Open the app, open DevTools, set a breakpoint inside `ModalHandler` constructor. It should fire once. Check `WidgetRegistry._registry` in the console — keys `modalHandler` and `buttons` should each appear once.

---

## Fix 2 — Abort In-Flight XHRs on `DataManager.stop()`

**Problem:** `DataManager.stop()` (`DataManager.js` lines 185–191) calls `clearInterval` but does not abort in-flight `XMLHttpRequest` objects. If a request is in-flight when `stop()` is called (e.g. during layout-editor preview teardown), the `onreadystatechange` callback still fires, calls `tryUpdateWidgets`, and writes into globals that `DataManager.resetState` has already cleared. This corrupts the next preview render.

A secondary problem: four independent `setInterval` loops can overlap if the server takes longer than 5 s to respond.

**Steps:**

1. In `DataManager.js`, add an `_activeRequests` array to the constructor:
   ```js
   this._activeRequests = [];
   ```

2. In `DataManager.prototype.loadArray`, track the request before returning it:
   ```js
   DataManager.prototype.loadArray = function (url) {
       var xhttpVar;
       if (window.XMLHttpRequest) {
           xhttpVar = new XMLHttpRequest();
       } else {
           xhttpVar = new ActiveXObject("Microsoft.XMLHTTP");
       }
       xhttpVar.open("GET", url, true);
       xhttpVar.setRequestHeader("Cache-Control", "no-cache");
       this._activeRequests.push(xhttpVar);
       xhttpVar.send();
       return xhttpVar;
   };
   ```

3. In `DataManager.prototype.updatePoll`, remove the completed request from `_activeRequests` when the callback fires (regardless of success or failure):
   ```js
   xhttp.onreadystatechange = function () {
       if (xhttp.readyState !== 4) { return; }
       // Remove from active list
       var idx = self._activeRequests.indexOf(xhttp);
       if (idx !== -1) { self._activeRequests.splice(idx, 1); }

       if (xhttp.status === 200) {
           // ... existing success logic unchanged ...
       } else {
           global[flags.error] = true;
       }
       self.tryUpdateWidgets();
   };
   ```

4. In `DataManager.prototype.stop`, abort all in-flight requests before clearing intervals:
   ```js
   DataManager.prototype.stop = function () {
       // Abort any in-flight requests first
       var i;
       for (i = 0; i < this._activeRequests.length; i++) {
           this._activeRequests[i].abort();
       }
       this._activeRequests = [];

       if (this.intervals.cr)  { clearInterval(this.intervals.cr); }
       if (this.intervals.cre) { clearInterval(this.intervals.cre); }
       if (this.intervals.crh) { clearInterval(this.intervals.crh); }
       if (this.intervals.crd) { clearInterval(this.intervals.crd); }
       this.intervals = { cr: null, cre: null, crh: null, crd: null };
   };
   ```

5. Add `_activeRequests = []` to `DataManager.resetState` so preview host teardown is clean:
   ```js
   // At the end of DataManager.resetState:
   // (Note: resetState receives the global `g`, not the instance.
   //  The instance's _activeRequests is already cleared by stop().)
   ```
   No change needed here — `stop()` now handles it. Just confirm that in `previewHost.html` (layout editor), `dataManager.stop()` is always called before `DataManager.resetState(window)`.

**Verification:** In DevTools Network tab, start the app, then immediately call `app.dataManager.stop()` in the console. All four pending XHRs should show as `(cancelled)`. Re-start with `app.dataManager.start()` and confirm polling resumes cleanly.

---

## Fix 3 — Guard `processGraphData` Against Short Arrays

**Problem:** `processGraphData` in `DataHelpers.js` (lines 130–263) reads fixed offsets from `arrayClientrawExtra`, `arrayClientrawHour`, and `arrayClientrawDaily` up to index ~700 without checking array length. A partial server response (network hiccup, WD still writing the file) produces an array shorter than expected. Reads past the end return `undefined`, and `moment(undefined, "DD")` produces an invalid `Moment` that silently corrupts chart labels.

Key minimum lengths required (from the highest index read in each array):
- `arrayClientrawExtra`: index 700 (the `timestampWeekDay` anchor) → minimum length **701**
- `arrayClientrawHour`: index 481 (solarMinutes60 loop: `421 + 59`) → minimum length **482**
- `arrayClientrawDaily`: index 429 (uvQuarterDays28 loop: `401 + 27`) → minimum length **430**

**Steps:**

1. At the top of `processGraphData`, before any loop, add length guards:
   ```js
   function processGraphData() {
       var i, p, q, pMax;

       // Bail out if any source array is too short — partial server response.
       // Minimum lengths are determined by the highest fixed index read below.
       if (arrayClientrawExtra.length  < 701 ||
           arrayClientrawHour.length   < 482 ||
           arrayClientrawDaily.length  < 430) {
           console.warn("processGraphData: source arrays too short, skipping update.",
               "CRE:", arrayClientrawExtra.length,
               "CRH:", arrayClientrawHour.length,
               "CRD:", arrayClientrawDaily.length);
           return;
       }

       // ... rest of function unchanged ...
   ```

2. The `processRecord` helper (lines 94–103) reads `arrayClientrawExtra[startingIndex]` through `[startingIndex + 5]`. Add a guard there too:
   ```js
   function processRecord(startingIndex) {
       if (arrayClientrawExtra.length < startingIndex + 6) {
           console.warn("processRecord: index out of bounds at", startingIndex);
           return ["---", moment.invalid()];
       }
       // ... existing logic unchanged ...
   }
   ```
   Callers of `processRecord` in `processRecordsData` already use the return value as `[value, moment]` — they will now receive an invalid moment instead of throwing.

3. Wrap the entire `processGraphData` body in a try/catch as a belt-and-suspenders measure for unexpected formats:
   ```js
   try {
       // ... all existing loops ...
   } catch (e) {
       console.error("processGraphData failed:", e);
   }
   ```
   Place the try/catch **inside** the length guards so it only wraps the actual processing work.

**Verification:** Open the browser console and run:
```js
var backup = arrayClientrawExtra.slice();
arrayClientrawExtra = arrayClientrawExtra.slice(0, 50);
processGraphData();  // should log a warning and return, not throw
arrayClientrawExtra = backup;
processGraphData();  // should complete normally
```

---

## Fix 4 — Move `Number.prototype.map` Off the Prototype

**Problem:** `DataHelpers.js` line 7 patches `Number.prototype.map` without checking if it already exists. Any library or future code that defines `Number.prototype.map` for its own purpose will be silently overwritten. `Array.prototype.equals` at least warns; `Number.prototype.map` does not.

The function converts a number from one range to another:
```
(value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
```

It is called as `someNumber.map(a, b, c, d)` in: `CanvasWidget.js`, `BarometerWidget`, `WindGaugeWidget`, `HumidityGaugeWidget`, `SolarBarWidget`, `UVBarWidget`, `WidgetBar.js` — approximately 25 call sites.

**Steps:**

1. In `DataHelpers.js`, replace the `Number.prototype.map` assignment with a standalone function:
   ```js
   // REMOVE:
   Number.prototype.map = function map(in_min, in_max, out_min, out_max) {
       return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
   };

   // ADD:
   function mapRange(value, in_min, in_max, out_min, out_max) {
       return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
   }
   ```
   Make it a `var` if strict-mode / scoping is ever a concern:
   ```js
   var mapRange = function (value, in_min, in_max, out_min, out_max) { ... };
   ```

2. Update every call site. The existing pattern is:
   ```js
   someVar.map(a, b, c, d)
   ```
   Replace with:
   ```js
   mapRange(someVar, a, b, c, d)
   ```
   Files to update (search for `.map(` — filter out Array `.map` calls which take a callback):
   - `js_bundles/CanvasWidget.js`
   - `js_bundles/WidgetBar.js`
   - `js_bundles/WidgetGauge.js`
   - `js_bundles/widgets/BarometerWidget.js`
   - `js_bundles/widgets/WindGaugeWidget.js`
   - `js_bundles/widgets/HumidityGaugeWidget.js`
   - `js_bundles/widgets/SolarBarWidget.js`
   - `js_bundles/widgets/UVBarWidget.js`

   Grep command to find all numeric `.map(` calls (excludes array map which takes a function):
   ```
   grep -n "\.map([0-9]" js_bundles/*.js js_bundles/widgets/*.js
   ```

3. Since `mapRange` is a plain global function and `DataHelpers.js` loads before all widget scripts (per `index-oo.html` load order), no module changes are needed.

4. Leave `Array.prototype.equals` in place — it uses `Object.defineProperty` with `enumerable: false`, which is the correct way to extend arrays. Add the same missing guard that `Number.prototype.map` lacked:
   ```js
   if (!Number.prototype.map) {
       // Do NOT add it here — mapRange replaces this entirely.
   }
   ```
   No action needed; just don't re-add the prototype patch.

**Verification:** Search for `Number.prototype.map` — should return zero results. Search for `.map(` in widget files — all hits should either be Array map (callback argument) or should be gone. Load the app and confirm gauges/bars still animate correctly.

---

## Fix 5 — Add a Minimal Test File

**Problem:** The main application has no tests. The most failure-prone logic is `WidgetText`'s template tokenizer/filter chain and `processGraphData`'s array parsing. These have no safety net. The layout editor already has Playwright; the main app needs at minimum a plain JS unit test file that can run in Node without a build step.

**What to test (prioritised):**

### 5a — `processGraphData` array length guard (from Fix 3)
Tests that `processGraphData` returns early and does not throw when arrays are short.

### 5b — `WidgetText` template tokenizer and filter chain
`WidgetText` parses templates like `{{temp|round:1|unit:temperature|default:---}}`. The `_compileTemplate` and filter-application logic is the most complex regex-driven code in the app and has no coverage.

### 5c — `mapRange` utility (from Fix 4)
Pure function — trivial to test, establishes the pattern.

**Steps:**

1. Create `js_bundles/tests/` directory and `js_bundles/tests/main.test.js`. Use no test framework — just plain assertions with `console.assert` / `console.error` so it can run with `node` directly or be pasted into a browser console:

   ```js
   // js_bundles/tests/main.test.js
   // Run with: node js_bundles/tests/main.test.js
   // Or paste into browser console after the app has loaded.
   
   var passed = 0, failed = 0;
   function assert(label, condition) {
       if (condition) {
           passed++;
       } else {
           failed++;
           console.error("FAIL: " + label);
       }
   }
   
   // ---- mapRange ----
   assert("mapRange: midpoint",
       mapRange(5, 0, 10, 0, 100) === 50);
   assert("mapRange: at minimum",
       mapRange(0, 0, 10, 0, 100) === 0);
   assert("mapRange: at maximum",
       mapRange(10, 0, 10, 0, 100) === 100);
   assert("mapRange: inverted output",
       mapRange(0, 0, 10, 100, 0) === 100);
   
   // ---- processGraphData length guard ----
   // Requires DataHelpers.js and its globals to be loaded.
   var _savedCRE = arrayClientrawExtra;
   var _savedCRH = arrayClientrawHour;
   var _savedCRD = arrayClientrawDaily;
   
   arrayClientrawExtra = new Array(50);   // too short
   arrayClientrawHour  = new Array(50);
   arrayClientrawDaily = new Array(50);
   var _thrown = false;
   try { processGraphData(); } catch(e) { _thrown = true; }
   assert("processGraphData: does not throw on short arrays", !_thrown);
   
   arrayClientrawExtra = _savedCRE;
   arrayClientrawHour  = _savedCRH;
   arrayClientrawDaily = _savedCRD;
   
   // ---- WidgetText filter chain ----
   // Assumes WidgetText is loaded and a minimal widget instance can be created.
   // WidgetText needs a canvas element; create a detached one.
   var _canvas = document.createElement("canvas");
   _canvas.id = "__test_canvas__";
   var _wt = new WidgetText({
       canvasID: "__test_canvas__",
       template: [{ type: "text", template: "{{val|round:1|default:---}}", x: "50%w", y: "50%h", font: "10px sans-serif", fill: "#fff" }],
       bindings: { val: "clientraw[4]" }
   });
   
   // Directly test the filter pipeline by reaching into _applyFilters if exposed,
   // or test via the rendered output after a synthetic data update.
   // The simplest approach: stub arrayClientraw[4] and call draw().
   arrayClientraw[4] = "12.345";
   var _rendered = null;
   var _origFillText = CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText = function(text) { _rendered = text; };
   _wt.draw({val: "12.345"});
   CanvasRenderingContext2D.prototype.fillText = _origFillText;
   assert("WidgetText: round:1 filter rounds to 1dp", _rendered === "12.3");
   
   arrayClientraw[4] = undefined;
   _rendered = null;
   CanvasRenderingContext2D.prototype.fillText = function(text) { _rendered = text; };
   _wt.draw({val: undefined});
   CanvasRenderingContext2D.prototype.fillText = _origFillText;
   assert("WidgetText: default:--- renders fallback on undefined", _rendered === "---");
   
   // ---- Summary ----
   console.log("Tests complete. Passed: " + passed + "  Failed: " + failed);
   ```

   > **Note on the `WidgetText` tests:** `WidgetText.draw` internally calls `updateTweens`, which uses the CreateJS stage. The stub approach above is a rough starting point. If the CreateJS stage is not initialised, the assertions may not reach `fillText`. Adjust the test to call `_wt.updateTweens()` directly or use `_wt._renderTemplate()` if that method exists, depending on what `WidgetText` exposes after review.

2. Add a `"test"` entry to `README.md`'s usage section pointing to the test file and explaining how to run it (`node js_bundles/tests/main.test.js` or in-browser console).

3. As new widgets or helpers are added, extend `main.test.js`. Do not add a build step or framework until there are enough tests to justify the overhead.

---

## Summary Checklist

| # | File(s) | Change |
|---|---------|--------|
| 1 | `Layout.js` | Remove duplicate `ModalHandler` and `ButtonsHandler` manifest entries; add ID uniqueness assertion in `App.js` |
| 2 | `DataManager.js` | Track in-flight XHRs; abort them in `stop()` |
| 3 | `DataHelpers.js` | Add array-length guards and try/catch in `processGraphData`; guard `processRecord` |
| 4 | `DataHelpers.js` + 8 widget files | Replace `Number.prototype.map` with `mapRange(value, ...)` utility function; update all call sites |
| 5 | `js_bundles/tests/main.test.js` (new) | Add runnable tests for `mapRange`, `processGraphData` guard, `WidgetText` filter chain |
