// Smoke test: verifies that every placed widget type in the catalog initialises
// without error in the preview iframe. Run via `npm run smoke`.
//
// To catch catalog/runtime drift: rename a widget Ctor in js_bundles — this
// test will fail with a "has no canvas" warning for the affected widget id.

import { test, expect } from "@playwright/test";
import { CATALOG } from "../src/catalog";
import { emptyLayout, newInstance, colsForRows } from "../src/model/defaults";
import type { LayoutDoc } from "../src/model/types";

const STORAGE_KEY = "freshwdl.layoutEditor.doc.v1";

function buildSmokeLayout(): LayoutDoc {
  const rows = 32;
  const doc: LayoutDoc = {
    ...emptyLayout(),
    grid: { rows, cols: colsForRows(rows) },
  };

  let row = 1;
  for (const entry of CATALOG) {
    if (!entry.needsCanvas && !entry.placedInGrid) continue;
    const inst = newInstance(entry.type, doc, { col: 1, row });
    doc.widgets.push(inst);
    row += Math.max(1, entry.defaultArea.rowSpan);
    if (row > rows - 1) row = 1; // wrap — overlap is ok, test only checks init
  }
  return doc;
}

test("all catalog widget types initialize without error in preview", async ({ page }) => {
  const layout = buildSmokeLayout();

  const placedWidgets = layout.widgets.filter((w) => {
    const e = CATALOG.find((c) => c.type === w.type);
    return e && (e.needsCanvas || e.placedInGrid);
  });

  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(layout) },
  );

  const errors: string[] = [];
  const previewLogs: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
    const txt = msg.text();
    if (txt.startsWith("[preview]")) previewLogs.push(txt);
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Preview →" }).click();

  // Wait until the iframe has emitted a diagnostic line for every placed widget.
  await expect
    .poll(() => previewLogs.length, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(placedWidgets.length);

  // No console.error from the preview (ignore browser favicon 404s).
  expect(
    errors.filter((e) => !e.includes("favicon")),
    "unexpected console errors",
  ).toHaveLength(0);

  // "has no canvas" is expected only for non-canvas placed widgets (e.g. ForecastHandler).
  // If a canvas-needing widget reports this, it means the Ctor didn't resolve.
  const unexpectedNoCanvas = previewLogs
    .filter((l) => l.includes("has no canvas"))
    .filter((l) => {
      const m = l.match(/\[preview\] (\S+) has no canvas/);
      if (!m) return true;
      const w = layout.widgets.find((wi) => wi.instanceId === m[1]);
      if (!w) return true;
      return CATALOG.find((e) => e.type === w.type)?.needsCanvas === true;
    });
  expect(unexpectedNoCanvas, "canvas-needing widgets with no canvas").toHaveLength(0);

  // Every widget that does have a canvas must have nonzero dimensions.
  for (const line of previewLogs) {
    const m = line.match(/canvas=(\d+)x(\d+)/);
    if (!m) continue;
    expect(
      parseInt(m[1]) * parseInt(m[2]),
      `zero-size canvas: ${line}`,
    ).toBeGreaterThan(0);
  }
});
