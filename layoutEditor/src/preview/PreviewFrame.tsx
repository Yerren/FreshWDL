import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LayoutDoc, WidgetInstance } from "../model/types";
import { emitLayoutJs, emitManifestEntrySource, emitSlotHtml } from "../codegen/emitLayoutJs";
import { getCatalogEntry, getPlacedWidgets, isPlacedInGrid } from "../catalog";

type Props = {
  doc: LayoutDoc;
  overlayMode?: boolean;
  style?: CSSProperties;
};

type SoftPlan = {
  removeIds: string[];
  addEntries: Array<{ instanceId: string; slotHtml: string; entrySource: string; placed: boolean }>;
};

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

function widgetUnchanged(p: WidgetInstance, n: WidgetInstance): boolean {
  if (p.type !== n.type) return false;
  if (p.enabledKey !== n.enabledKey) return false;
  if (p.canvasID !== n.canvasID) return false;
  if (p.titleDictKey !== n.titleDictKey) return false;
  if (p.bindings !== n.bindings && !shallowStringMapEqual(p.bindings, n.bindings)) return false;
  if (p.options !== n.options && !deepEqual(p.options, n.options)) return false;
  return true;
}

function planSoftUpdate(prev: LayoutDoc, next: LayoutDoc): SoftPlan | null {
  if (prev.preview.source !== next.preview.source) return null;
  if (prev.preview.liveUrlPrefix !== next.preview.liveUrlPrefix) return null;

  if (prev.buttons.length !== next.buttons.length) return null;
  for (let i = 0; i < prev.buttons.length; i++) {
    if (prev.buttons[i].id !== next.buttons[i].id) return null;
  }

  const prevById = new Map(prev.widgets.map((w) => [w.instanceId, w]));
  const nextById = new Map(next.widgets.map((w) => [w.instanceId, w]));

  for (const w of next.widgets) {
    const p = prevById.get(w.instanceId);
    if (p && !widgetUnchanged(p, w)) return null;
  }

  const removeIds: string[] = [];
  for (const w of prev.widgets) {
    if (!nextById.has(w.instanceId)) removeIds.push(w.instanceId);
  }

  const addEntries: SoftPlan["addEntries"] = [];
  for (const w of next.widgets) {
    if (prevById.has(w.instanceId)) continue;
    const entry = getCatalogEntry(w.type);
    if (!entry || !entry.ctor) return null;
    addEntries.push({
      instanceId: w.instanceId,
      slotHtml: emitSlotHtml(w),
      entrySource: emitManifestEntrySource(w),
      placed: isPlacedInGrid(entry),
    });
  }

  return { removeIds, addEntries };
}

function buildSoftUpdate(doc: LayoutDoc) {
  return {
    grid: { cols: doc.grid.cols, rows: doc.grid.rows },
    slots: getPlacedWidgets(doc.widgets).map((w) => ({
      instanceId: w.instanceId,
      colStart: w.area.colStart,
      colEnd: w.area.colEnd,
      rowStart: w.area.rowStart,
      rowEnd: w.area.rowEnd,
    })),
    buttons: doc.buttons.map((b) => ({ id: b.id, visible: b.visible })),
  };
}

export function PreviewFrame({ doc, overlayMode, style }: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  // Bumped on iframe resize so widgets re-init at the new canvas size — the
  // legacy runtime sizes its canvases once at construction and has no resize
  // hook, so we rebuild on resize to avoid widgets stuck at 0×0.
  const [sizeNonce, setSizeNonce] = useState(0);

  const dataUrlPrefix = doc.preview.source === "live" ? doc.preview.liveUrlPrefix : "/runtime/";

  const lastAppliedRef = useRef<{
    doc: LayoutDoc;
    dataUrlPrefix: string;
    overlayMode: boolean;
    sizeNonce: number;
  } | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data && e.data.type === "previewReady" && e.source === ref.current?.contentWindow) {
        setReady(true);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSizeNonce((n) => n + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const frame = ref.current;
    if (!frame || !frame.contentWindow) return;
    if (frame.clientWidth < 4 || frame.clientHeight < 4) return;

    // Debounce so dragging or rapid resizes don't tear down + rebuild widgets
    // on every event. Plan + emit are deferred into the timeout so per-tick
    // renders don't pay the JSON.stringify / codegen cost when only the final
    // state matters.
    const t = setTimeout(() => {
      const last = lastAppliedRef.current;
      const onlyDocChanged = last
        && last.dataUrlPrefix === dataUrlPrefix
        && last.overlayMode === !!overlayMode
        && last.sizeNonce === sizeNonce;
      const plan = onlyDocChanged && last ? planSoftUpdate(last.doc, doc) : null;

      if (plan) {
        frame.contentWindow!.postMessage({
          type: "softUpdate",
          ...buildSoftUpdate(doc),
          removeIds: plan.removeIds,
          addEntries: plan.addEntries,
        }, "*");
      } else {
        frame.contentWindow!.postMessage({
          type: "render",
          layoutJsSource: emitLayoutJs(doc),
          dataUrlPrefix,
          overlayMode: !!overlayMode,
        }, "*");
      }
      lastAppliedRef.current = { doc, dataUrlPrefix, overlayMode: !!overlayMode, sizeNonce };
    }, 150);
    return () => clearTimeout(t);
  }, [doc, dataUrlPrefix, ready, overlayMode, sizeNonce]);

  if (overlayMode) {
    return (
      <iframe
        ref={ref}
        src="/previewHost.html"
        style={{ border: 0, background: "transparent", ...style }}
      />
    );
  }
  return (
    <div className="canvas">
      <iframe
        ref={ref}
        src="/previewHost.html"
        style={{ width: "100%", height: "100%", border: 0, background: "#fff" }}
      />
    </div>
  );
}
