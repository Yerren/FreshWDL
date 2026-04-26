import { CATALOG, getCatalogEntry } from "../catalog";
import { DEFAULT_BUTTONS, type LayoutDoc, type WidgetInstance } from "./types";

// Grid container is 16:9. Toolbar exposes a single "Grid size" = number of
// rows. Cells are square, so cols = round(rows × 16 / 9). Catalog defaultArea
// values are tuned for ~14 rows / ~25 cols.
export const ASPECT_W = 16;
export const ASPECT_H = 9;
export function colsForRows(rows: number): number {
  return Math.max(2, Math.round(rows * ASPECT_W / ASPECT_H));
}
export const DEFAULT_GRID = { cols: colsForRows(14), rows: 14 };

export function emptyLayout(): LayoutDoc {
  return {
    version: 1,
    grid: { ...DEFAULT_GRID },
    widgets: [
      // Always-present non-canvas handlers (mirror Layout.js).
      defaultsForType("ButtonsHandler", "buttons", { col: 1, row: 1 }),
      defaultsForType("ModalHandler",   "modalHandler", { col: 1, row: 1 }),
    ],
    buttons: [...DEFAULT_BUTTONS],
    preview: { source: "sample", liveUrlPrefix: "/" },
  };
}

let __idCounter = 1;
export function freshInstanceId(type: string, existing: WidgetInstance[]): string {
  const base = type.replace(/Widget$|Handler$/, "");
  const lower = base.charAt(0).toLowerCase() + base.slice(1);
  let candidate = lower;
  let n = 2;
  const taken = new Set(existing.map((w) => w.instanceId));
  while (taken.has(candidate)) {
    candidate = `${lower}${n++}`;
  }
  return candidate;
}

export function freshCanvasId(prefix: string, existing: WidgetInstance[]): string {
  if (!prefix) return "";
  const taken = new Set(existing.map((w) => w.canvasID).filter(Boolean));
  let n = 1;
  while (taken.has(`${prefix}${pad2(n)}`)) n++;
  return `${prefix}${pad2(n)}`;
}

function pad2(n: number) { return n < 10 ? "0" + n : "" + n; }

export function defaultsForType(
  type: string,
  instanceId: string,
  position: { col: number; row: number },
): WidgetInstance {
  const entry = getCatalogEntry(type);
  if (!entry) throw new Error("unknown widget type: " + type);
  const bindings: Record<string, string> = {};
  for (const f of entry.bindings) bindings[f.key] = f.defaultSpec;
  const options: Record<string, unknown> = {};
  for (const o of entry.options) options[o.key] = o.default;
  return {
    instanceId,
    type,
    enabledKey: entry.defaultEnabledKey,
    canvasID: entry.needsCanvas ? `${entry.defaultCanvasIdPrefix}${pad2(__idCounter++)}` : "",
    area: {
      colStart: position.col,
      colEnd:   position.col + Math.max(1, entry.defaultArea.colSpan),
      rowStart: position.row,
      rowEnd:   position.row + Math.max(1, entry.defaultArea.rowSpan),
    },
    bindings,
    options,
  };
}

export function newInstance(type: string, doc: LayoutDoc, position: { col: number; row: number }): WidgetInstance {
  const id = freshInstanceId(type, doc.widgets);
  const inst = defaultsForType(type, id, position);
  const entry = getCatalogEntry(type)!;
  if (entry.needsCanvas) {
    inst.canvasID = freshCanvasId(entry.defaultCanvasIdPrefix, doc.widgets);
  }
  return inst;
}
