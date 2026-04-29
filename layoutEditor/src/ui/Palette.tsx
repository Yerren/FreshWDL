import { useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, getCatalogEntry, isPlacedInGrid } from "../catalog";
import {
  emptyLayout,
  isRequiredHandlerType,
  newInstance,
} from "../model/defaults";
import type { LayoutDoc } from "../model/types";
import { PreviewFrame } from "../preview/PreviewFrame";
import { PALETTE_DRAG_MIME, setPaletteDragType } from "./paletteDrag";

type Props = { onPickType: (type: string) => void };

export function Palette({ onPickType }: Props) {
  const items = CATALOG.filter((c) => c.category === "Widget" || !isRequiredHandlerType(c.type));

  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData(PALETTE_DRAG_MIME, type);
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "copy";
    setPaletteDragType(type);
    const ghost = makeDragGhost(type);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 10, 10);
    setTimeout(() => ghost.remove(), 0);
  };
  const onDragEnd = () => setPaletteDragType(null);

  return (
    <div className="palette">
      <div className="palette-grid">
        {items.map((c) => (
          <PaletteTile
            key={c.type}
            type={c.type}
            onDragStart={(e) => onDragStart(e, c.type)}
            onDragEnd={onDragEnd}
            onClick={() => onPickType(c.type)}
          />
        ))}
      </div>
    </div>
  );
}

function makeDragGhost(type: string): HTMLDivElement {
  const entry = getCatalogEntry(type);
  const ghost = document.createElement("div");
  ghost.style.cssText = [
    "position: absolute", "top: -1000px", "left: -1000px",
    "padding: 6px 10px",
    "background: rgba(88, 101, 242, 0.92)", "color: #fff",
    "border: 1px solid #4752c4", "border-radius: 4px",
    "font: 12px system-ui, sans-serif", "white-space: nowrap",
    "box-shadow: 0 4px 12px rgba(0,0,0,0.5)",
  ].join(";");
  ghost.textContent = entry
    ? `${entry.displayName}  (${entry.defaultArea.colSpan}×${entry.defaultArea.rowSpan})`
    : type;
  return ghost;
}

function PaletteTile({
  type, onDragStart, onDragEnd, onClick,
}: {
  type: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const entry = getCatalogEntry(type);
  const ref = useRef<HTMLDivElement | null>(null);
  // Lazy-mount the iframe only after the tile becomes visible. ~20+ tiles each
  // boot the full runtime, so eager mounting hammers startup.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((x) => x.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: "100px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  const previewDoc = useMemo<LayoutDoc | null>(() => {
    if (!visible || !entry || !isPlacedInGrid(entry)) return null;
    const doc = emptyLayout();
    const inst = newInstance(type, doc, { col: 1, row: 1 });
    inst.area = {
      colStart: 1, rowStart: 1,
      colEnd: doc.grid.cols + 1, rowEnd: doc.grid.rows + 1,
    };
    doc.widgets = [...doc.widgets, inst];
    return doc;
  }, [type, visible, entry]);

  return (
    <div
      ref={ref}
      className="palette-tile"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      title={`${entry?.displayName ?? type} — drag onto the canvas, or click to add`}
    >
      <div className="palette-tile-preview">
        {previewDoc ? (
          <PreviewFrame
            doc={previewDoc}
            overlayMode
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              background: "#fff",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div className="palette-tile-placeholder">
            {entry?.category === "Handler" ? "⚙" : "□"}
          </div>
        )}
      </div>
      <div className="palette-tile-label">{entry?.displayName ?? type}</div>
    </div>
  );
}
