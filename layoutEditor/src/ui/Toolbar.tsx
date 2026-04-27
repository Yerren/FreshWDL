import type { LayoutDoc } from "../model/types";
import { clamp, colsForRows } from "../model/defaults";

type Props = {
  doc: LayoutDoc;
  setDoc: (updater: (d: LayoutDoc) => LayoutDoc) => void;
  previewOpen: boolean;
  togglePreview: () => void;
  onExport: () => void;
  onSaveJson: () => void;
  onLoadJson: () => void;
  onNew: () => void;
  hasErrors: boolean;
};

export function Toolbar({
  doc, setDoc, previewOpen, togglePreview,
  onExport, onSaveJson, onLoadJson, onNew, hasErrors,
}: Props) {
  return (
    <div className="toolbar">
      <strong style={{ marginRight: 6 }}>FreshWDL Layout Editor</strong>
      <div className="sep" />
      <div className="group">
        <button onClick={onNew}>New</button>
        <button onClick={onLoadJson}>Open JSON…</button>
        <button onClick={onSaveJson}>Save JSON</button>
      </div>
      <div className="sep" />
      <button
        className="primary"
        onClick={onExport}
        disabled={hasErrors}
        title={hasErrors ? "Resolve errors in the log before exporting" : "Download Layout.js"}>
        Export Layout.js
      </button>
      <div className="sep" />
      <div className="group" title="Number of rows. Container is 16:9 so cols = round(rows × 16/9).">
        <label>Grid size</label>
        <input type="number" min={2} max={48} value={doc.grid.rows}
          onChange={(e) => {
            const rows = clamp(+e.target.value, 2, 48);
            setDoc((d) => ({ ...d, grid: { cols: colsForRows(rows), rows } }));
          }} />
        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{doc.grid.cols}×{doc.grid.rows}</span>
      </div>
      <div className="sep" />
      <button onClick={togglePreview}>{previewOpen ? "← Edit" : "Preview →"}</button>
      <div style={{ flex: 1 }} />
      <div className="group">
        <label>Data</label>
        <select
          value={doc.preview.source}
          onChange={(e) => setDoc((d) => ({ ...d, preview: { ...d.preview, source: e.target.value as "sample" | "live" } }))}>
          <option value="sample">Sample</option>
          <option value="live">Live</option>
        </select>
        {doc.preview.source === "live" && (
          <input
            style={{ width: 220 }}
            value={doc.preview.liveUrlPrefix}
            placeholder="https://yourstation.example/"
            onChange={(e) => setDoc((d) => ({ ...d, preview: { ...d.preview, liveUrlPrefix: e.target.value } }))} />
        )}
      </div>
    </div>
  );
}
