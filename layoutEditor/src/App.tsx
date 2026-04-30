import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { LayoutDoc, WidgetInstance } from "./model/types";
import {
  emptyLayout,
  ensureRequiredHandlers,
  isRequiredHandlerType,
  newInstance,
  freshInstanceId,
  freshCanvasId,
  colsForRows,
  clamp,
  DEFAULT_GRID,
} from "./model/defaults";
import { DEFAULT_BUTTONS } from "./model/types";
import { getCatalogEntry, isPlacedInGrid } from "./catalog";
import { validateLayout } from "./model/validation";
import { emitLayoutJs } from "./codegen/emitLayoutJs";
import { Toolbar } from "./ui/Toolbar";
import { Palette } from "./ui/Palette";
import { GridCanvas } from "./ui/GridCanvas";
import { Inspector } from "./ui/Inspector";
import { LogPanel } from "./ui/LogPanel";
import { PreviewFrame } from "./preview/PreviewFrame";

const STORAGE_KEY = "freshwdl.layoutEditor.doc.v1";

export function App() {
  const [doc, setDoc] = useState<LayoutDoc>(() => loadFromStorage() ?? emptyLayout());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [clipboard, setClipboard] = useState<WidgetInstance[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [doc]);

  const issues = useMemo(() => validateLayout(doc), [doc]);

  const updateWidget = (id: string, patch: Partial<WidgetInstance>) => {
    setDoc((d) => ({ ...d, widgets: d.widgets.map((w) => w.instanceId === id ? { ...w, ...patch } : w) }));
  };
  const addWidget = (type: string, position: { col: number; row: number }) => {
    setDoc((d) => {
      const inst = newInstance(type, d, position);
      return { ...d, widgets: [...d.widgets, inst] };
    });
  };
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
  const removeWidget = (id: string) => removeWidgets([id]);

  const copySelected = () => {
    const selectedWidgets = doc.widgets.filter((w) => selectedIds.has(w.instanceId) && !isRequiredHandlerType(w.type));
    if (selectedWidgets.length === 0) return;
    setClipboard(selectedWidgets.map((w) => structuredClone(w)));
  };
  const pasteClipboard = () => {
    if (clipboard.length === 0) return;
    const newIds: string[] = [];
    setDoc((d) => {
      const widgets = [...d.widgets];
      for (const src of clipboard) {
        const entry = getCatalogEntry(src.type);
        if (!entry) continue;
        const colSpan = src.area.colEnd - src.area.colStart;
        const rowSpan = src.area.rowEnd - src.area.rowStart;
        const cs = clamp(src.area.colStart + 1, 1, d.grid.cols - colSpan + 1);
        const rs = clamp(src.area.rowStart + 1, 1, d.grid.rows - rowSpan + 1);
        const inst: WidgetInstance = {
          ...structuredClone(src),
          instanceId: freshInstanceId(src.type, widgets),
          area: { colStart: cs, colEnd: cs + colSpan, rowStart: rs, rowEnd: rs + rowSpan },
          canvasID: entry.needsCanvas ? freshCanvasId(entry.defaultCanvasIdPrefix, widgets) : src.canvasID,
        };
        widgets.push(inst);
        newIds.push(inst.instanceId);
      }
      return { ...d, widgets };
    });
    if (newIds.length > 0) setSelectedIds(new Set(newIds));
  };

  // Stable keydown handler: read latest state via refs so the listener doesn't
  // re-attach on every doc edit.
  const handlersRef = useRef({ removeWidgets, copySelected, pasteClipboard, doc, selectedIds });
  useEffect(() => {
    handlersRef.current = { removeWidgets, copySelected, pasteClipboard, doc, selectedIds };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
      const h = handlersRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if ((e.key === "Delete" || e.key === "Backspace") && h.selectedIds.size > 0) {
        e.preventDefault(); h.removeWidgets(h.selectedIds);
      } else if (mod && k === "c") {
        e.preventDefault(); h.copySelected();
      } else if (mod && k === "v") {
        e.preventDefault(); h.pasteClipboard();
      } else if (mod && k === "a") {
        e.preventDefault();
        const allPlaced = h.doc.widgets.filter((w) => isPlacedInGrid(getCatalogEntry(w.type)));
        setSelectedIds(new Set(allPlaced.map((w) => w.instanceId)));
      } else if (e.key === "Escape") {
        setSelectedIds((prev) => prev.size === 0 ? prev : new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selected = useMemo(
    () => (selectedIds.size === 1
      ? (doc.widgets.find((w) => selectedIds.has(w.instanceId)) ?? null)
      : null),
    [doc.widgets, selectedIds],
  );

  const dropFromPalette = (type: string, position: { col: number; row: number }) => {
    const entry = getCatalogEntry(type);
    if (!entry) return;
    let newId = "";
    setDoc((d) => {
      const colSpan = Math.max(1, entry.defaultArea.colSpan);
      const rowSpan = Math.max(1, entry.defaultArea.rowSpan);
      const cs = clamp(position.col, 1, d.grid.cols - colSpan + 1);
      const rs = clamp(position.row, 1, d.grid.rows - rowSpan + 1);
      const inst = newInstance(type, d, { col: cs, row: rs });
      newId = inst.instanceId;
      return { ...d, widgets: [...d.widgets, inst] };
    });
    if (newId) setSelectedIds(new Set([newId]));
  };

  return (
    <div className="app">
      <Toolbar
        doc={doc}
        setDoc={setDoc}
        previewOpen={previewOpen}
        togglePreview={() => setPreviewOpen((v) => !v)}
        onExport={() => downloadFile("Layout.js", emitLayoutJs(doc))}
        onSaveJson={() => downloadFile("layout.json", JSON.stringify(doc, null, 2))}
        onLoadJson={() => importJson(setDoc)}
        onNew={() => { if (confirm("Discard current layout?")) setDoc(emptyLayout()); }}
        hasErrors={issues.some((i) => i.level === "error")}
      />
      <Palette onPickType={(type) => addWidget(type, { col: 1, row: 1 })} />
      {previewOpen
        ? <PreviewFrame doc={doc} />
        : <GridCanvas
            doc={doc}
            setDoc={setDoc}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onDropPaletteType={dropFromPalette}
          />}
      <Inspector
        doc={doc}
        selected={selected}
        selectionCount={selectedIds.size}
        updateWidget={updateWidget}
        removeWidget={removeWidget}
      />
      <LogPanel issues={issues} />
    </div>
  );
}

function loadFromStorage(): LayoutDoc | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LayoutDoc;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.widgets)) {
      const rows = (parsed.grid && typeof parsed.grid.rows === "number") ? parsed.grid.rows : DEFAULT_GRID.rows;
      parsed.grid = { cols: colsForRows(rows), rows };
      if (!Array.isArray(parsed.buttons)) parsed.buttons = [...DEFAULT_BUTTONS];
      if (!parsed.preview || typeof parsed.preview.source !== "string" || typeof parsed.preview.liveUrlPrefix !== "string") {
        parsed.preview = { source: "sample", liveUrlPrefix: "/" };
      }
      parsed.widgets = ensureRequiredHandlers(parsed.widgets);
      return parsed;
    }
  } catch {}
  return null;
}

function downloadFile(name: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importJson(setDoc: Dispatch<SetStateAction<LayoutDoc>>) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = () => {
    const f = input.files?.[0];
    if (!f) return;
    f.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt) as LayoutDoc;
        if (parsed.version !== 1) throw new Error("Unsupported layout version");
        parsed.widgets = ensureRequiredHandlers(parsed.widgets);
        setDoc(parsed);
      } catch (e) {
        alert("Failed to load JSON: " + (e as Error).message);
      }
    });
  };
  input.click();
}
