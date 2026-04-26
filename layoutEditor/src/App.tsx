import { useEffect, useMemo, useState } from "react";
import type { LayoutDoc, WidgetInstance } from "./model/types";
import { emptyLayout, newInstance, colsForRows } from "./model/defaults";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Autosave (debounced via microtask).
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); } catch {}
  }, [doc]);

  const issues = useMemo(() => validateLayout(doc), [doc]);

  const updateWidget = (id: string, updater: (w: WidgetInstance) => WidgetInstance) => {
    setDoc((d) => ({ ...d, widgets: d.widgets.map((w) => w.instanceId === id ? updater(w) : w) }));
  };
  const addWidget = (type: string, position: { col: number; row: number }) => {
    setDoc((d) => {
      const inst = newInstance(type, d, position);
      return { ...d, widgets: [...d.widgets, inst] };
    });
  };
  const removeWidget = (id: string) => {
    setDoc((d) => ({ ...d, widgets: d.widgets.filter((w) => w.instanceId !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = doc.widgets.find((w) => w.instanceId === selectedId) ?? null;

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
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />}
      <Inspector
        doc={doc}
        selected={selected}
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
      // Force 16:9 grid — older layouts may have square or asymmetric values.
      const rows = parsed.grid.rows;
      parsed.grid = { cols: colsForRows(rows), rows };
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

function importJson(setDoc: (d: LayoutDoc) => void) {
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
        setDoc(parsed);
      } catch (e) {
        alert("Failed to load JSON: " + (e as Error).message);
      }
    });
  };
  input.click();
}
