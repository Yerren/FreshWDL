import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getCatalogEntry, getPlacedWidgets } from "../catalog";
import { ASPECT_W, ASPECT_H, clamp } from "../model/defaults";
import type { GridArea, LayoutDoc, WidgetInstance } from "../model/types";
import { PreviewFrame } from "../preview/PreviewFrame";

const RESIZE_EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
type ResizeEdge = typeof RESIZE_EDGES[number];

type Props = {
  doc: LayoutDoc;
  setDoc: (updater: (d: LayoutDoc) => LayoutDoc) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
};

type DragState =
  | null
  | { kind: "move"; id: string; sx: number; sy: number; startArea: GridArea; cellW: number; cellH: number }
  | { kind: "resize"; id: string; edge: ResizeEdge; sx: number; sy: number;
      startArea: GridArea; cellW: number; cellH: number };

export function GridCanvas({ doc, setDoc, selectedId, setSelectedId }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapper, setWrapper] = useState({ w: 1, h: 1 });
  const [drag, setDrag] = useState<DragState>(null);
  const lastDeltaRef = useRef<{ dx: number; dy: number } | null>(null);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth, h = el.clientHeight;
      setWrapper((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
  }, []);

  // 16:9 host fitted into the available space, with square cells.
  const PAD = 16;
  const availW = Math.max(1, wrapper.w - PAD * 2);
  const availH = Math.max(1, wrapper.h - PAD * 2);
  const targetRatio = ASPECT_W / ASPECT_H;
  let hostW: number, hostH: number;
  if (availW / availH >= targetRatio) {
    hostH = availH;
    hostW = hostH * targetRatio;
  } else {
    hostW = availW;
    hostH = hostW / targetRatio;
  }
  // Cells aren't necessarily square: the grid has cols ≈ rows × 16/9 but
  // rounded to an integer (e.g. 28×16 ≠ exact 16:9), so derive each axis
  // independently from the host size.
  const cellW = hostW / doc.grid.cols;
  const cellH = hostH / doc.grid.rows;
  const offsetX = (wrapper.w - hostW) / 2;
  const offsetY = (wrapper.h - hostH) / 2;

  const placed = useMemo(() => getPlacedWidgets(doc.widgets), [doc.widgets]);

  useEffect(() => {
    if (!drag) return;
    lastDeltaRef.current = null;
    const onMove = (e: PointerEvent) => {
      const dx = Math.round((e.clientX - drag.sx) / drag.cellW);
      const dy = Math.round((e.clientY - drag.sy) / drag.cellH);
      const last = lastDeltaRef.current;
      if (last && last.dx === dx && last.dy === dy) return;
      lastDeltaRef.current = { dx, dy };
      setDoc((d) => ({
        ...d,
        widgets: d.widgets.map((w) => {
          if (w.instanceId !== drag.id) return w;
          if (drag.kind === "move") {
            const colSpan = drag.startArea.colEnd - drag.startArea.colStart;
            const rowSpan = drag.startArea.rowEnd - drag.startArea.rowStart;
            const cs = clamp(drag.startArea.colStart + dx, 1, d.grid.cols - colSpan + 1);
            const rs = clamp(drag.startArea.rowStart + dy, 1, d.grid.rows - rowSpan + 1);
            return { ...w, area: { colStart: cs, colEnd: cs + colSpan, rowStart: rs, rowEnd: rs + rowSpan } };
          }
          // resize: edges named by compass direction. n/w move the start
          // corner (and may shrink the span to 1); s/e move the end corner.
          const edge = drag.edge;
          let { colStart, colEnd, rowStart, rowEnd } = drag.startArea;
          if (edge.includes("w")) {
            colStart = clamp(drag.startArea.colStart + dx, 1, drag.startArea.colEnd - 1);
          }
          if (edge.includes("e")) {
            colEnd = clamp(drag.startArea.colEnd + dx, drag.startArea.colStart + 1, d.grid.cols + 1);
          }
          if (edge.includes("n")) {
            rowStart = clamp(drag.startArea.rowStart + dy, 1, drag.startArea.rowEnd - 1);
          }
          if (edge.includes("s")) {
            rowEnd = clamp(drag.startArea.rowEnd + dy, drag.startArea.rowStart + 1, d.grid.rows + 1);
          }
          return { ...w, area: { colStart, colEnd, rowStart, rowEnd } };
        }),
      }));
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, setDoc]);

  const startMove = (e: React.PointerEvent, w: WidgetInstance) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(w.instanceId);
    setDrag({ kind: "move", id: w.instanceId, sx: e.clientX, sy: e.clientY,
      startArea: { ...w.area }, cellW, cellH });
  };
  const startResize = (e: React.PointerEvent, w: WidgetInstance, edge: ResizeEdge) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(w.instanceId);
    setDrag({ kind: "resize", id: w.instanceId, edge,
      sx: e.clientX, sy: e.clientY, startArea: { ...w.area }, cellW, cellH });
  };

  return (
    <div className="canvas" ref={wrapperRef} onPointerDown={() => setSelectedId(null)}>
      <div className="grid-host" style={{
        position: "absolute", left: offsetX, top: offsetY, width: hostW, height: hostH,
      }}>
        <PreviewFrame
          doc={doc}
          overlayMode
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none",
          }}
        />
        <GridLines cols={doc.grid.cols} rows={doc.grid.rows} />
        {placed.map((w) => {
          const a = w.area;
          const left = (a.colStart - 1) * cellW;
          const top = (a.rowStart - 1) * cellH;
          const width  = (a.colEnd - a.colStart) * cellW;
          const height = (a.rowEnd - a.rowStart) * cellH;
          return (
            <div
              key={w.instanceId}
              className={"widget-rect" + (w.instanceId === selectedId ? " selected" : "")}
              style={{ left, top, width, height }}
              onPointerDown={(e) => startMove(e, w)}
              title={getCatalogEntry(w.type)?.displayName ?? w.type}
            >
              <span className="label">{w.instanceId}<br/><small style={{ opacity: 0.7 }}>{getCatalogEntry(w.type)?.displayName ?? w.type}</small></span>
              {RESIZE_EDGES.map((edge) => (
                <div key={edge} className={`resize-handle rh-${edge}`}
                  onPointerDown={(e) => startResize(e, w, edge)} />
              ))}
            </div>
          );
        })}
        {placed.length === 0 && (
          <div className="empty-hint">Click a widget in the palette on the left to add it.</div>
        )}
      </div>
    </div>
  );
}

function GridLines({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="grid-overlay" style={{
      backgroundImage:
        `linear-gradient(to right, var(--grid-line) 1px, transparent 1px),` +
        `linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
      backgroundSize: `${100 / cols}% ${100 / rows}%`,
    }} />
  );
}

