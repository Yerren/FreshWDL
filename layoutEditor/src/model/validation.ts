// Mirror of js_bundles/DataBindings.js compileSpec() — validates that a
// binding spec is parseable. We mirror the grammar in TS rather than load
// the runtime file so the editor is self-contained outside the iframe.
//
// Spec grammar (from DataBindings.js):
//   clientraw[N]          | clientrawExtra[N] | clientrawHour[N] | clientrawDaily[N]
//   extraInput(N)         | extraInput(N)[K]
//   widgetListInput:KEY   | widgetListInput:KEY[K]
//   const:VALUE
//   fn:NAME

import type { LayoutDoc, WidgetInstance } from "./types";
import { getCatalogEntry, getPlacedWidgets } from "../catalog";

export const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const INSTANCE_ID_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

export type ValidationIssue = {
  level: "error" | "warn";
  message: string;
  instanceId?: string;
  field?: string;
};

const SPEC_PATTERNS: RegExp[] = [
  /^clientraw\[(-?\d+)\]$/,
  /^clientrawExtra\[(-?\d+)\]$/,
  /^clientrawHour\[(-?\d+)\]$/,
  /^clientrawDaily\[(-?\d+)\]$/,
  /^extraInput\(([^)]+)\)(?:\[(-?\d+)\])?$/,
  /^widgetListInput:([A-Za-z0-9_]+)(?:\[(-?\d+)\])?$/,
  /^const:(.*)$/s,
  /^dict:([A-Za-z0-9_]+)$/,
  /^fn:([A-Za-z_$][A-Za-z0-9_$]*)$/,
];

export function validateSpec(spec: string): string | null {
  if (typeof spec !== "string") return "spec must be a string";
  if (spec.length === 0) return "spec is empty";
  for (const re of SPEC_PATTERNS) {
    if (re.test(spec)) return null;
  }
  return `unrecognised spec '${spec}'`;
}

export function validateLayout(doc: LayoutDoc): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenCanvasIds = new Set<string>();

  for (const w of doc.widgets) {
    // Duplicate ids
    if (seenIds.has(w.instanceId)) {
      issues.push({ level: "error", instanceId: w.instanceId,
        message: `duplicate instance id '${w.instanceId}'` });
    } else {
      seenIds.add(w.instanceId);
    }
    if (!INSTANCE_ID_RE.test(w.instanceId)) {
      issues.push({ level: "error", instanceId: w.instanceId,
        message: `instance id '${w.instanceId}' must start with a letter and contain only letters/digits/underscore` });
    }

    const entry = getCatalogEntry(w.type);
    if (!entry) {
      issues.push({ level: "error", instanceId: w.instanceId,
        message: `unknown widget type '${w.type}'` });
      continue;
    }

    if (entry.needsCanvas) {
      if (!w.canvasID) {
        issues.push({ level: "error", instanceId: w.instanceId,
          message: `canvasID is required for ${w.type}` });
      } else if (seenCanvasIds.has(w.canvasID)) {
        issues.push({ level: "error", instanceId: w.instanceId,
          message: `duplicate canvasID '${w.canvasID}'` });
      } else {
        seenCanvasIds.add(w.canvasID);
      }
    }

    if (entry.dynamicBindings) {
      // Free-form bindings: validate every declared spec and key shape.
      for (const k of Object.keys(w.bindings)) {
        if (!IDENT_RE.test(k)) {
          issues.push({ level: "error", instanceId: w.instanceId, field: k,
            message: `binding key '${k}' must be a valid identifier` });
        }
        const err = validateSpec(w.bindings[k]);
        if (err) {
          issues.push({ level: "error", instanceId: w.instanceId, field: k,
            message: `binding '${k}': ${err}` });
        }
      }
    } else {
      for (const fld of entry.bindings) {
        const spec = w.bindings[fld.key];
        if (!spec) {
          if (fld.required) {
            issues.push({ level: "error", instanceId: w.instanceId, field: fld.key,
              message: `missing required binding '${fld.key}'` });
          }
          continue;
        }
        const err = validateSpec(spec);
        if (err) {
          issues.push({ level: "error", instanceId: w.instanceId, field: fld.key,
            message: `binding '${fld.key}': ${err}` });
        }
      }
    }

    // Grid area sanity (only for widgets that have a canvas / DOM slot)
    if (entry.needsCanvas) {
      const a = w.area;
      if (a.colEnd <= a.colStart || a.rowEnd <= a.rowStart) {
        issues.push({ level: "error", instanceId: w.instanceId,
          message: `area is empty (col ${a.colStart}–${a.colEnd}, row ${a.rowStart}–${a.rowEnd})` });
      }
      if (a.colStart < 1 || a.rowStart < 1 ||
          a.colEnd > doc.grid.cols + 1 || a.rowEnd > doc.grid.rows + 1) {
        issues.push({ level: "error", instanceId: w.instanceId,
          message: `area is outside the ${doc.grid.cols}×${doc.grid.rows} grid` });
      }
    }
  }

  // Overlap warnings (CSS Grid permits overlap, but it usually isn't intended).
  const placed = getPlacedWidgets(doc.widgets);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      if (areasOverlap(placed[i].area, placed[j].area)) {
        issues.push({ level: "warn",
          message: `widgets '${placed[i].instanceId}' and '${placed[j].instanceId}' overlap` });
      }
    }
  }

  return issues;
}

function areasOverlap(a: WidgetInstance["area"], b: WidgetInstance["area"]): boolean {
  return a.colStart < b.colEnd && b.colStart < a.colEnd
      && a.rowStart < b.rowEnd && b.rowStart < a.rowEnd;
}
