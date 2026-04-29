import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getCatalogEntry, getPlacedWidgets } from "../catalog";
import { ASPECT_W, ASPECT_H, clamp } from "../model/defaults";
import type { GridArea, LayoutDoc, WidgetInstance } from "../model/types";
import { PreviewFrame } from "../preview/PreviewFrame";
import { PALETTE_DRAG_MIME, getPaletteDragType } from "./paletteDrag";

const RESIZE_EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
type ResizeEdge = typeof RESIZE_EDGES[number];

type Props = {
  doc: LayoutDoc;
  setDoc: (updater: (d: LayoutDoc) => LayoutDoc) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onDropPaletteType: (type: string, position: { col: number; row: number }) => void;
};

type DragState =
  | null
  | { kind: "move"; ids: string[]; sx: number; sy: number;
      startAreas: Record<string, GridArea>; cellW: number; cellH: number }
  | { kind: "resize"; id: string; edge: ResizeEdge; sx: number; sy: number;
      startArea: GridArea; cellW: number; cellH: number };

export function GridCanvas({ doc, setDoc, selectedIds, setSelectedIds, onDropPaletteType }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [wrapper, setWrapper] = useState({ w: 1, h: 1 });
  const [drag, setDrag] = useState<DragState>(null);
  const lastDeltaRef = useRef<{ dx: number; dy: number } | null>(null);
  const [dropGhost, setDropGhost] = useState<
    | null
    | { type: string; col: number; row: number; colSpan: number; rowSpan: number }
  >(null);

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
  // Snap to integer pixels so the host's 1px border doesn't get eaten by
  // subpixel rounding at certain window sizes.
  hostW = Math.floor(hostW);
  hostH = Math.floor(hostH);
  const cellW = hostW / doc.grid.cols;
  const cellH = hostH / doc.grid.rows;
  const offsetX = Math.floor((wrapper.w - hostW) / 2);
  const offsetY = Math.floor((wrapper.h - hostH) / 2);

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
      setDoc((d) => {
        if (drag.kind === "move") {
          // Clamp the group delta so no widget escapes the grid; all selected
          // widgets must shift by the same delta to preserve relative layout.
          let clampedDx = dx;
          let clampedDy = dy;
          for (const id of drag.ids) {
            const start = drag.startAreas[id];
            if (!start) continue;
            const colSpan = start.colEnd - start.colStart;
            const rowSpan = start.rowEnd - start.rowStart;
            const cs = clamp(start.colStart + clampedDx, 1, d.grid.cols - colSpan + 1);
            const rs = clamp(start.rowStart + clampedDy, 1, d.grid.rows - rowSpan + 1);
            clampedDx = cs - start.colStart;
            clampedDy = rs - start.rowStart;
          }
          const idSet = new Set(drag.ids);
          return {
            ...d,
            widgets: d.widgets.map((w) => {
              if (!idSet.has(w.instanceId)) return w;
              const start = drag.startAreas[w.instanceId];
              if (!start) return w;
              return {
                ...w,
                area: {
                  colStart: start.colStart + clampedDx,
                  colEnd: start.colEnd + clampedDx,
                  rowStart: start.rowStart + clampedDy,
                  rowEnd: start.rowEnd + clampedDy,
                },
              };
            }),
          };
        }
        return {
          ...d,
          widgets: d.widgets.map((w) => {
            if (w.instanceId !== drag.id) return w;
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
        };
      });
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
    let groupIds: string[];
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const next = new Set(selectedIds);
      if (next.has(w.instanceId)) next.delete(w.instanceId);
      else next.add(w.instanceId);
      setSelectedIds(next);
      groupIds = Array.from(next);
    } else if (selectedIds.has(w.instanceId)) {
      groupIds = Array.from(selectedIds);
    } else {
      setSelectedIds(new Set([w.instanceId]));
      groupIds = [w.instanceId];
    }
    const placedById = new Map(placed.map((p) => [p.instanceId, p]));
    groupIds = groupIds.filter((id) => placedById.has(id));
    if (groupIds.length === 0) groupIds = [w.instanceId];
    const startAreas: Record<string, GridArea> = {};
    for (const id of groupIds) {
      const widget = placedById.get(id) ?? doc.widgets.find((x) => x.instanceId === id);
      if (widget) startAreas[id] = { ...widget.area };
    }
    setDrag({ kind: "move", ids: groupIds, sx: e.clientX, sy: e.clientY, startAreas, cellW, cellH });
  };

  const startResize = (e: React.PointerEvent, w: WidgetInstance, edge: ResizeEdge) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(new Set([w.instanceId]));
    setDrag({ kind: "resize", id: w.instanceId, edge,
      sx: e.clientX, sy: e.clientY, startArea: { ...w.area }, cellW, cellH });
  };

  const clientToCell = (clientX: number, clientY: number) => {
    const host = hostRef.current;
    if (!host) return null;
    const r = host.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const col = Math.floor(x / cellW) + 1;
    const row = Math.floor(y / cellH) + 1;
    return {
      col: clamp(col, 1, doc.grid.cols),
      row: clamp(row, 1, doc.grid.rows),
    };
  };

  const onCanvasDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes(PALETTE_DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const cell = clientToCell(e.clientX, e.clientY);
    if (!cell) return;
    // dataTransfer.getData is empty during dragover in some browsers, so fall
    // back to the module-shared current drag type set by Palette.
    const ghostType = e.dataTransfer.getData(PALETTE_DRAG_MIME)
      || getPaletteDragType()
      || dropGhost?.type
      || "";
    const entry = ghostType ? getCatalogEntry(ghostType) : null;
    const colSpan = entry ? Math.max(1, entry.defaultArea.colSpan) : 4;
    const rowSpan = entry ? Math.max(1, entry.defaultArea.rowSpan) : 2;
    const col = clamp(cell.col, 1, doc.grid.cols - colSpan + 1);
    const row = clamp(cell.row, 1, doc.grid.rows - rowSpan + 1);
    setDropGhost({ type: ghostType, col, row, colSpan, rowSpan });
  };

  const onCanvasDragLeave = (e: React.DragEvent) => {
    // Only clear when leaving the canvas wrapper, not when crossing children.
    if (e.currentTarget === e.target) setDropGhost(null);
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    const type = e.dataTransfer.getData(PALETTE_DRAG_MIME) || getPaletteDragType() || "";
    if (!type) return;
    e.preventDefault();
    setDropGhost(null);
    const cell = clientToCell(e.clientX, e.clientY);
    if (!cell) return;
    // App.dropFromPalette handles span clamping; for non-placed handlers it
    // ignores position. Just hand it the raw cell.
    onDropPaletteType(type, cell);
  };

  return (
    <div
      className="canvas"
      ref={wrapperRef}
      onPointerDown={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest(".widget-rect") || t.closest(".resize-handle")) return;
        setSelectedIds((prev) => prev.size === 0 ? prev : new Set());
      }}
      onDragOver={onCanvasDragOver}
      onDragLeave={onCanvasDragLeave}
      onDrop={onCanvasDrop}
    >
      <div className="grid-host" ref={hostRef} style={{
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
        <GridLines cols={doc.grid.cols} rows={doc.grid.rows} hostW={hostW} hostH={hostH} />
        {placed.map((w) => {
          const a = w.area;
          const left = (a.colStart - 1) * cellW;
          const top = (a.rowStart - 1) * cellH;
          const width  = (a.colEnd - a.colStart) * cellW;
          const height = (a.rowEnd - a.rowStart) * cellH;
          const isSelected = selectedIds.has(w.instanceId);
          return (
            <div
              key={w.instanceId}
              className={"widget-rect" + (isSelected ? " selected" : "")}
              style={{ left, top, width, height }}
              onPointerDown={(e) => startMove(e, w)}
              title={getCatalogEntry(w.type)?.displayName ?? w.type}
            >
              <span className="label">{w.instanceId}<br/><small style={{ opacity: 0.7 }}>{getCatalogEntry(w.type)?.displayName ?? w.type}</small></span>
              {isSelected && selectedIds.size === 1 && RESIZE_EDGES.map((edge) => (
                <div key={edge} className={`resize-handle rh-${edge}`}
                  onPointerDown={(e) => startResize(e, w, edge)} />
              ))}
            </div>
          );
        })}
        {dropGhost && (
          <div
            className="drop-ghost"
            style={{
              left:   (dropGhost.col - 1) * cellW,
              top:    (dropGhost.row - 1) * cellH,
              width:  dropGhost.colSpan * cellW,
              height: dropGhost.rowSpan * cellH,
            }}
          >
            <span className="label">
              {getCatalogEntry(dropGhost.type)?.displayName ?? dropGhost.type}
            </span>
          </div>
        )}
        {placed.length === 0 && !dropGhost && (
          <div className="empty-hint">Drag a widget from the palette on the left, or click to add at top-left.</div>
        )}
      </div>
    </div>
  );
}

function GridLines({ cols, rows, hostW, hostH }: { cols: number; rows: number; hostW: number; hostH: number }) {
  // Render each interior gridline as a 1px-wide/tall div snapped to an integer
  // pixel offset. A CSS background-gradient approach uses percentage stops that
  // round inconsistently at non-integer cell sizes, causing some lines to
  // visually disappear or render thicker than others.
  const verticals = [];
  for (let i = 1; i < cols; i++) {
    verticals.push(
      <div key={`v${i}`} style={{
        position: "absolute",
        left: Math.round((i * hostW) / cols),
        top: 0,
        width: 1,
        height: "100%",
        background: "var(--grid-line)",
      }} />
    );
  }
  const horizontals = [];
  for (let i = 1; i < rows; i++) {
    horizontals.push(
      <div key={`h${i}`} style={{
        position: "absolute",
        top: Math.round((i * hostH) / rows),
        left: 0,
        width: "100%",
        height: 1,
        background: "var(--grid-line)",
      }} />
    );
  }
  return <div className="grid-overlay">{verticals}{horizontals}</div>;
}
