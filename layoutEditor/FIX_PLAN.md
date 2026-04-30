# FreshWDL Layout Editor — Fix Plan

Each task is self-contained: file paths, the problem, the fix, and a verification step. Pick any one and start without re-reading the whole document.

Paths are relative to repo root unless prefixed with `layoutEditor/`.

---

## P0 — Real bugs / data loss / security

### Task 1 — Close the path-traversal hole in the dev runtime middleware

**File:** `layoutEditor/vite.config.ts` (function `serveRuntime`)

**Problem.** The check `if (url.includes(".."))` runs on the encoded URL, then `decodeURIComponent` happens after. A request like `/runtime/%2e%2e/%2e%2e/etc/passwd` slips past the filter, decodes to `/../../etc/passwd`, and `join(REPO_ROOT, ...)` produces a path outside the repo.

**Fix.**

1. Decode first.
2. Resolve the joined path with `path.resolve`.
3. Reject if the resolved path is not under `REPO_ROOT + path.sep`.

```ts
import { resolve as pathResolve, sep } from "path";
// ...
const decoded = decodeURIComponent(url);
const filePath = pathResolve(join(REPO_ROOT, decoded));
if (filePath !== REPO_ROOT && !filePath.startsWith(REPO_ROOT + sep)) return next();
```

**Verify.** With dev server running:

- `curl -i 'http://localhost:5173/runtime/%2e%2e/%2e%2e/package.json'` → 404 (passes through, not the file).
- `curl -i 'http://localhost:5173/runtime/js_bundles/App.js'` → 200, served as before.

---

### Task 2 — Defensive `loadFromStorage` in `App.tsx`

**File:** `layoutEditor/src/App.tsx` (function `loadFromStorage`)

**Problem.** The validator accepts any object with `version === 1` and an array `widgets`. It then dereferences `parsed.grid.rows`, `parsed.buttons`, `parsed.preview` without checking. A malformed v1 doc throws inside the `useState` initializer and the editor white-screens.

**Fix.** Inside the existing `try/catch`, validate every field that's read, and fall back to `emptyLayout()` defaults for any missing piece rather than crashing. Specifically:

- Require `parsed.grid && typeof parsed.grid.rows === "number"`. If missing, use `DEFAULT_GRID`.
- If `parsed.buttons` is not an array, replace with `[...DEFAULT_BUTTONS]`.
- If `parsed.preview` is missing or malformed (not `{source, liveUrlPrefix}`), replace with `{ source: "sample", liveUrlPrefix: "/" }`.
- Keep the existing `colsForRows(rows)` reshape, but only after the grid check.
- Any thrown error → return `null` (caller falls back to `emptyLayout()`).

**Verify.** In devtools console:

```js
localStorage.setItem("freshwdl.layoutEditor.doc.v1", JSON.stringify({version:1, widgets:[]}));
location.reload();
```

Editor loads cleanly with default grid/buttons/preview, no console error.

---

### Task 3 — Properly escape user content in `escapeForDocWrite`

**File:** `layoutEditor/src/codegen/emitLayoutJs.ts` (function `escapeForDocWrite`)

**Problem.** Currently only escapes `'`. A WidgetText template containing `</script>` will close the surrounding `<script>` tag in the emitted file. Literal backslashes and CRs are also un-escaped.

**Fix.** Replace the body with:

```ts
function escapeForDocWrite(html: string): string {
  return html
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/<\//g, "<\\/")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}
```

**Important:** order matters — backslash first.

`foldForDocWrite` becomes redundant after this (newlines are already escaped). Decide:

- (a) Drop `foldForDocWrite` and emit a single long line. Simpler, less readable in the exported file.
- (b) Keep it for human readability of the export. Both work; recommend (a).

If you keep (b), `escapeForDocWrite` should still escape `\n` because `foldForDocWrite` only handles the `\n` in the JS string literal sense (line continuations), not characters inside template strings that get round-tripped.

**Verify.** Add a Text widget with template:

```
</script><img onerror="alert(1)">
\n test \r literal
```

Export. Open the generated `Layout.js` in a browser via the runtime — it should render the template as literal text in the canvas, no script execution, no JS parse error. Also re-open the export in the editor preview iframe; same result.

---

### Task 4 — Collision-safe rename in `DynamicBindingsEditor`

**File:** `layoutEditor/src/ui/Inspector.tsx` (component `DynamicBindingsEditor`, around lines 267–319)

**Problem.** The key input is uncontrolled (`<input defaultValue={k} onBlur=...>`). On blur, `setKey(k, e.target.value)` rebuilds the bindings object. If the new key already exists, the existing entry is silently overwritten (data loss). The validator catches the resulting state but the original spec is gone.

**Fix.**

1. Make the input controlled with a local edit buffer per row so an in-progress edit doesn't fight re-renders. Sketch:
   ```tsx
   function BindingKeyInput({ k, allKeys, onCommit }: ...) {
     const [draft, setDraft] = useState(k);
     useEffect(() => setDraft(k), [k]);
     const collision = draft !== k && allKeys.includes(draft);
     return (
       <>
         <input value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  if (collision || !IDENT_RE.test(draft)) { setDraft(k); return; }
                  if (draft !== k) onCommit(draft);
                }} />
         {collision && <div className="err-msg">key already exists</div>}
       </>
     );
   }
   ```
2. Pass `Object.keys(selected.bindings)` in.
3. In `setKey`, also assert `!(newKey in bindings)` as a belt-and-braces guard.

**Verify.**

- Create a Text widget. Add bindings `temp` and `humidity`.
- Try renaming `temp` → `humidity`. Input should snap back to `temp` on blur, error message shown, both bindings still present.
- Try renaming `temp` → `xx-bad`. Input snaps back (invalid identifier).
- Rename `temp` → `temperature`. Commits, only one binding under the new name.

---

## P1 — Correctness / silent failures

### Task 5 — Move ref assignment out of render in `App.tsx`

**File:** `layoutEditor/src/App.tsx` (lines 97–123)

**Problem.** `handlersRef.current = { ... }` runs during render. Mutating refs during render is a render-phase side effect; StrictMode and future React modes are increasingly hostile to this.

**Fix.** Wrap the assignment in a `useEffect` with no deps (runs after every render):

```ts
useEffect(() => {
  handlersRef.current = { removeWidgets, copySelected, pasteClipboard, doc, selectedIds };
});
```

The keydown handler (separate `useEffect` with `[]` deps) continues to read `handlersRef.current` lazily — no behavior change.

**Verify.** No behavior change expected. Run the editor under React StrictMode (it already is in `main.tsx` if present); confirm no warnings about ref mutation. Manually exercise Delete / Ctrl-C / Ctrl-V / Ctrl-A / Esc — all still work.

---

### Task 6 — Sync `AspectRatioInput` to incoming ratio changes

**File:** `layoutEditor/src/ui/Inspector.tsx` (component `AspectRatioInput`, lines 217–251)

**Problem.** Local W/H state seeds from `ratio` only when `instanceId` changes. If `ratio` mutates from outside (undo, JSON import, soft state change), the inputs lie. Also, `if (wn >= 1 && hn >= 1)` silently rejects valid sub-1 inputs (e.g. typing `0.5`).

**Fix.**

- Add `ratio` to the `useEffect` deps and rebuild `w`/`h` when it changes from outside. Track the last ratio committed by this component to avoid clobbering a user's in-progress edit; e.g.
  ```ts
  const lastCommittedRef = useRef(ratio);
  useEffect(() => {
    if (ratio !== lastCommittedRef.current) {
      setW("1");
      setH(String(ratio || 1));
      lastCommittedRef.current = ratio;
    }
  }, [ratio, instanceId]);
  ```
  And update `lastCommittedRef.current = hn / wn` inside `commit` after `onChange`.
- Replace `wn >= 1 && hn >= 1` with `wn > 0 && hn > 0`.
- When commit is skipped, render a small `<div className="err-msg">enter positive numbers</div>` under the row.

**Verify.**

- Edit a widget's aspect, save JSON, reload it via Open JSON. The input reflects the saved ratio.
- Type `0.5` in either box → commits, ratio updates.
- Type `0` or empty → no crash, error message visible, ratio not committed.

---

### Task 7 — Move `withAutoSwitch` boilerplate into the catalog

**File:** `layoutEditor/src/codegen/emitLayoutJs.ts` (`emitConfig`, lines 192–230) and `layoutEditor/src/catalog.ts` (`CatalogEntry`, `TemperatureBarWidget` entry).

**Problem.** Codegen branches on `entry.type === "TemperatureBarWidget" && w.options.withAutoSwitch === true` and inlines six hardcoded clientraw indices. Any second auto-switch widget would have to duplicate all of this.

**Fix.**

1. Extend `CatalogEntry` with an optional hook:
   ```ts
   emitExtraConfig?(w: WidgetInstance): { parts: string[]; suppressBindings: boolean };
   ```
2. Move the windChill block (titleSource, tooltipSource, dataFn, autoSwitchBindings) into `TemperatureBarWidget`'s entry, gated on `w.options.withAutoSwitch === true`. Have it return `suppressBindings: true` when active so codegen skips the normal bindings emit.
3. In `emitConfig`, replace the `isAutoSwitch` branch with:
   ```ts
   const extra = entry.emitExtraConfig?.(w);
   const suppressBindings = !!extra?.suppressBindings;
   if (extra) parts.push(...extra.parts);
   ```
   and use `suppressBindings` instead of `isAutoSwitch` to gate the bindings block.

**Verify (byte-identical output check).** Before refactor, export a layout containing a windChill TemperatureBar with `withAutoSwitch: true`, save the file as `before.js`. After refactor, export the same layout, diff against `before.js`. Should be identical. Add a small README note for the next person.

---

### Task 8 — Make `withBackground` visible

**File:** `layoutEditor/src/codegen/emitLayoutJs.ts` (lines 158–165) and `layoutEditor/src/ui/Inspector.tsx` (textarea handling).

**Problem.** Toggling `withBackground` silently prepends a `<shape>` to the template at emit time. The textarea no longer shows what gets exported. Confusing during debugging and review.

**Fix (recommended).** Convert the boolean flag into a one-shot button "Insert rounded background" in the inspector:

1. Remove the `withBackground` option from the `WidgetText` catalog entry's `options`.
2. Drop the special case in `emitConfig` (lines 158–165).
3. In `Inspector.tsx`, when rendering `WidgetText`, add a small button next to the template textarea labeled "Prepend rounded background". On click, prepend the shape literal to `options.template` via `setOpt`.
4. The shape string lives in one place — extract a constant `WIDGET_TEXT_BACKGROUND_SHAPE` in `catalog.ts`.

**Alternative (lower risk).** Keep the flag but render a read-only preview of the prepended shape above the textarea so what-you-see matches what-gets-exported.

**Verify.**

- New WidgetText, default template, click "Prepend rounded background" — the shape string appears at the top of the textarea.
- Export — emitted template matches the textarea verbatim.
- Existing layouts with `withBackground: true` still render correctly: handle migration in `loadFromStorage` / `importJson` by translating the flag into a template prepend at load time.

---

### Task 9 — Single source for preview-host global reset list

**Files:** `layoutEditor/public/previewHost.html` (lines ~118–130) and `js_bundles/DataManager.js`.

**Problem.** The preview host manually clears `arrayClientraw`, `arrayClientrawOld`, `firstTime`, `loaded`, `doneCR*`, `attemptedCR*` etc. before each render. Anytime `DataManager` (or any other runtime file) adds a new global state, this list silently rots and the preview shows stale data.

**Fix.**

1. Add `DataManager.resetState()` (a static method or top-level export from the IIFE) that owns the list of globals to clear. It should null/reset each `arrayClientraw*`, `arrayClientraw*Old`, `firstTime`, `loaded`, `doneCR*`, `attemptedCR*`.
2. From `previewHost.html`, replace the manual block with a single call:
   ```js
   if (typeof DataManager !== "undefined" && DataManager.resetState) {
       DataManager.resetState(window);
   }
   ```
3. Leave a one-line comment in `previewHost.html` pointing to `DataManager.resetState` so the next person knows where to add new state.

**Verify.**

- Preview a layout with sample data. Edit a widget (forces a hard rebuild via `applyLayout`). Confirm the new widgets receive their first data (gauges populate, status bar shows time).
- Switch preview source from sample → live → sample. No stale values from the prior source.

---

### Task 10 — Structural compare in `widgetUnchanged`

**File:** `layoutEditor/src/preview/PreviewFrame.tsx` (function `widgetUnchanged`, lines 17–25).

**Problem.** Uses `JSON.stringify` for `bindings` and `options` equality. Property-order-dependent. A change anywhere that builds `{...next, foo: x}` instead of `{...next}` reorders keys and silently disables soft-update forever.

**Fix.** Tiny structural compare:

```ts
function shallowStringMapEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    const ao = a as Record<string, unknown>, bo = b as Record<string, unknown>;
    const ka = Object.keys(ao), kb = Object.keys(bo);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!deepEqual(ao[k], bo[k])) return false;
    return true;
  }
  return false;
}
```

Use `shallowStringMapEqual` for `bindings`, `deepEqual` for `options` (handles `dictOrText` shape).

**Verify.** Wire a console.log in `planSoftUpdate` reporting hard-rebuild reason. Drag a widget around; only `area` changes — confirm soft-update path stays active. Edit a binding; confirm hard-rebuild only when bindings actually change.

---

## P2 — Smells / maintenance

### Task 11 — Honest `setDoc` typing across Toolbar/App

**Files:** `layoutEditor/src/ui/Toolbar.tsx` (Props), `layoutEditor/src/App.tsx` (`importJson`).

**Problem.** `Toolbar.Props.setDoc` is typed as `(updater: (d: LayoutDoc) => LayoutDoc) => void`, but `App.importJson` calls `setDoc(parsed)` with a value, not an updater. Works because the underlying React setter accepts both, but the type lies.

**Fix.** Pick one contract — `Dispatch<SetStateAction<LayoutDoc>>` — and apply it everywhere a setter is passed.

```ts
import type { Dispatch, SetStateAction } from "react";
// in props:
setDoc: Dispatch<SetStateAction<LayoutDoc>>;
```

Update `importJson(setDoc: Dispatch<SetStateAction<LayoutDoc>>)` likewise. No runtime change, just type alignment.

**Verify.** `tsc --noEmit` (run via `npm run build` if no separate typecheck script) — no errors. Editor still loads JSON correctly.

---

### Task 12 — Ignore Delete on required handlers

**File:** `layoutEditor/src/App.tsx` (`removeWidgets`, lines 49–61, and the keydown branch at line 107).

**Problem.** `removeWidgets` filters required handlers out at the array level (`!idSet.has(id) || isRequiredHandlerType(type)`), so they survive deletion silently — but `selectedIds` still loses them. UX papercut.

**Fix.** Filter the input ids to skip required handlers up front:

```ts
const removeWidgets = (ids: Iterable<string>) => {
  const idSet = new Set<string>();
  const byId = new Map(doc.widgets.map((w) => [w.instanceId, w]));
  for (const id of ids) {
    const w = byId.get(id);
    if (w && !isRequiredHandlerType(w.type)) idSet.add(id);
  }
  if (idSet.size === 0) return;
  setDoc((d) => ({ ...d, widgets: d.widgets.filter((w) => !idSet.has(w.instanceId)) }));
  setSelectedIds((prev) => {
    const next = new Set(prev);
    for (const id of idSet) next.delete(id);
    return next.size === prev.size ? prev : next;
  });
};
```

**Verify.** Required handlers don't appear in selection (they're not placed in the grid), so this is mostly a code-clarity fix. Run the existing manual flows (Delete a widget, Delete a multi-selection); behavior unchanged.

---

### Task 13 — Don't poison the spec / dict caches on failure

**Files:** `layoutEditor/src/model/clientrawSpecs.ts`, `layoutEditor/src/model/dictKeys.ts`.

**Problem.** On fetch failure, both modules set `cache = []`. After a transient failure, the editor permanently shows no suggestions until full reload.

**Fix.** Only assign `cache` on success. On failure, clear `pending` so the next caller retries:

```ts
// clientrawSpecs.ts
pending = Promise.all(...)
  .then((arrs) => { cache = arrs.flat(); pending = null; return cache; })
  .catch(() => { pending = null; return [] as ClientrawSpecEntry[]; });
```

Same shape for `dictKeys.ts`.

**Verify.** Stop the dev server while the editor is open, focus a binding spec input — empty suggestions. Restart the dev server, click into the input again — suggestions populate (because `useClientrawSpecs` re-calls `loadClientrawSpecs` on mount, and `pending` is null so it retries).

---

### Task 14 — Catalog/runtime drift smoke test

**New files:** `layoutEditor/tests/catalog-smoke.spec.ts` (Playwright) plus minor `package.json` scripts.

**Problem.** The catalog mirrors runtime constants (enabledKeys, default specs, dict keys, ctor names). Nothing prevents drift; failures appear as silent blanks.

**Fix.**

1. Add Playwright as a devDependency. `npm i -D @playwright/test && npx playwright install chromium`.
2. Add a script `npm run smoke` that boots `vite dev` (in CI, on a free port) and runs the test below.
3. Test:
   - Start with `emptyLayout()` plus one instance of every catalog `type` (place each in a non-overlapping cell or just stack — preview tolerates overlap).
   - POST it to `localStorage` via `page.addInitScript`.
   - Open the preview pane.
   - Wait for `previewReady` then for the per-widget canvas-size diagnostic logs already present in `previewHost.html`.
   - Assert: no `console.error`, no console message matching `has no canvas` for canvas-needing types, every manifest entry resulted in a canvas of width × height > 0.
4. Run in CI on PRs touching `js_bundles/**` or `layoutEditor/src/catalog.ts`.

**Verify.** Run locally: `npm run smoke` passes. Temporarily rename a runtime widget Ctor to break the catalog → smoke fails with the offending widget id.

---

### Task 15 — Better feedback for invalid `AspectRatioInput`

(Bundled into Task 6. Listed separately only for tracking.)

---

## Suggested order

1. **PR A (P0 batch):** Tasks 1, 2, 3, 4. Small, defensive, independently mergeable.
2. **PR B (cleanup):** Tasks 5, 6, 11.
3. **PR C (codegen refactor):** Task 7. Verify byte-identical export.
4. **PR D (preview tidy):** Tasks 9, 10.
5. **PR E (UX):** Task 8.
6. **PR F (CI):** Task 14. Lands the safety net for everything above.
7. Tasks 12, 13: opportunistic.

## Out of scope

- Replacing `document.write` in emitted `Layout.js`. Runtime depends on it; separate initiative.
- Plugin-style runtime manifest to fully eliminate catalog/runtime duplication. Bigger than a fix pass.
- Palette tile iframe pooling. Not a performance problem yet.
