import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCatalogEntry, isPlacedInGrid } from "../catalog";
import { ASPECT_W, ASPECT_H } from "../model/defaults";
import type { GridArea, LayoutDoc, WidgetInstance } from "../model/types";
import { PreviewFrame } from "../preview/PreviewFrame";

type Props = {
  doc: LayoutDoc;
  setDoc: (updater: (d: LayoutDoc) => LayoutDoc) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
};

type DragState =
  | null
  | { kind: "move"; id: string; sx: number; sy: number; startArea: GridArea; cellW: number; cellH: number }
  | { kind: "resize"; id: string; edge: "se" | "e" | "s"; sx: number; sy: number;
      startArea: GridArea; cellW: number; cellH: number };

export function GridCanvas({ doc, setDoc, selectedId, setSelectedId }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapper, setWrapper] = useState({ w: 1, h: 1 });
  const [drag, setDrag] = useState<DragState>(null);

  // Track the outer .canvas size so we can size the grid host to a square.
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWrapper({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setWrapper({ w: el.clientWidth, h: el.clientHeight });
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

  const placed = doc.widgets.filter((w) => isPlacedInGrid(getCatalogEntry(w.type)));

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      setDoc((d) => ({
        ...d,
        widgets: d.widgets.map((w) => {
          if (w.instanceId !== drag.id) return w;
          const dx = Math.round((e.clientX - drag.sx) / drag.cellW);
          const dy = Math.round((e.clientY - drag.sy) / drag.cellH);
          if (drag.kind === "move") {
            const colSpan = drag.startArea.colEnd - drag.startArea.colStart;
            const rowSpan = drag.startArea.rowEnd - drag.startArea.rowStart;
            const cs = clamp(drag.startArea.colStart + dx, 1, d.grid.cols - colSpan + 1);
            const rs = clamp(drag.startArea.rowStart + dy, 1, d.grid.rows - rowSpan + 1);
            return { ...w, area: { colStart: cs, colEnd: cs + colSpan, rowStart: rs, rowEnd: rs + rowSpan } };
          }
          // resize
          const startColSpan = drag.startArea.colEnd - drag.startArea.colStart;
          const startRowSpan = drag.startArea.rowEnd - drag.startArea.rowStart;
          let newColSpan = startColSpan;
          let newRowSpan = startRowSpan;
          if (drag.edge === "e" || drag.edge === "se") newColSpan = Math.max(1, startColSpan + dx);
          if (drag.edge === "s" || drag.edge === "se") newRowSpan = Math.max(1, startRowSpan + dy);
          // Clamp to grid bounds.
          newColSpan = Math.min(newColSpan, d.grid.cols - drag.startArea.colStart + 1);
          newRowSpan = Math.min(newRowSpan, d.grid.rows - drag.startArea.rowStart + 1);
          return {
            ...w,
            area: {
              colStart: drag.startArea.colStart,
              colEnd:   drag.startArea.colStart + newColSpan,
              rowStart: drag.startArea.rowStart,
              rowEnd:   drag.startArea.rowStart + newRowSpan,
            },
          };
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
  const startResize = (e: React.PointerEvent, w: WidgetInstance, edge: "se" | "e" | "s") => {
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
              title={w.type}
            >
              <span className="label">{w.instanceId}<br/><small style={{ opacity: 0.7 }}>{w.type.replace(/Widget$/, "")}</small></span>
              <div className="resize-handle rh-e" onPointerDown={(e) => startResize(e, w, "e")} />
              <div className="resize-handle rh-s" onPointerDown={(e) => startResize(e, w, "s")} />
              <div className="resize-handle rh-se" onPointerDown={(e) => startResize(e, w, "se")} />
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

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
