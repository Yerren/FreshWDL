import { getCatalogEntry, isPlacedInGrid } from "../catalog";
import { isRequiredHandlerType } from "../model/defaults";
import type { LayoutDoc, WidgetInstance } from "../model/types";
import { validateSpec } from "../model/validation";

type Props = {
  doc: LayoutDoc;
  selected: WidgetInstance | null;
  updateWidget: (id: string, updater: (w: WidgetInstance) => WidgetInstance) => void;
  removeWidget: (id: string) => void;
};

export function Inspector({ doc, selected, updateWidget, removeWidget }: Props) {
  if (!selected) {
    return (
      <div className="inspector">
        <h3>Inspector</h3>
        <div className="empty-hint" style={{ padding: 0 }}>
          Select a widget on the canvas to edit its properties.
        </div>
        <h3 style={{ marginTop: 18 }}>Page buttons (#bottom)</h3>
        <ButtonsEditor doc={doc} updateWidget={updateWidget} />
      </div>
    );
  }
  const entry = getCatalogEntry(selected.type);
  if (!entry) return <div className="inspector">Unknown type: {selected.type}</div>;

  const upd = (patch: Partial<WidgetInstance>) =>
    updateWidget(selected.instanceId, (w) => ({ ...w, ...patch }));

  return (
    <div className="inspector">
      <h3>{entry.type}</h3>

      <div className="field-row">
        <label>Instance id</label>
        <input value={selected.instanceId}
          onChange={(e) => upd({ instanceId: e.target.value })} />
      </div>
      <div className="field-row">
        <label>Enabled key</label>
        <input value={selected.enabledKey}
          onChange={(e) => upd({ enabledKey: e.target.value })} />
      </div>
      {entry.needsCanvas && (
        <div className="field-row">
          <label>Canvas id</label>
          <input value={selected.canvasID}
            onChange={(e) => upd({ canvasID: e.target.value })} />
        </div>
      )}

      {isPlacedInGrid(entry) && (
        <>
          <h3 style={{ marginTop: 14 }}>Grid area
            {entry.aspectRatio != null && (
              <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 6, textTransform: "none" }}>
                aspect locked ({entry.aspectRatio.toFixed(3)})
              </span>
            )}
          </h3>
          <div className="field-row">
            <label>Col start</label>
            <input type="number" value={selected.area.colStart}
              onChange={(e) => upd({ area: lockedArea({ ...selected.area, colStart: int(e.target.value) }, entry.aspectRatio) })} />
            <label>end</label>
            <input type="number" value={selected.area.colEnd}
              onChange={(e) => upd({ area: lockedArea({ ...selected.area, colEnd: int(e.target.value) }, entry.aspectRatio, "col") })} />
          </div>
          <div className="field-row">
            <label>Row start</label>
            <input type="number" value={selected.area.rowStart}
              onChange={(e) => upd({ area: lockedArea({ ...selected.area, rowStart: int(e.target.value) }, entry.aspectRatio) })} />
            <label>end</label>
            <input type="number"
              value={selected.area.rowEnd}
              disabled={entry.aspectRatio != null}
              title={entry.aspectRatio != null ? "Locked to colSpan × aspectRatio" : ""}
              onChange={(e) => upd({ area: lockedArea({ ...selected.area, rowEnd: int(e.target.value) }, entry.aspectRatio, "row") })} />
          </div>
        </>
      )}

      {entry.options.length > 0 && (
        <>
          <h3 style={{ marginTop: 14 }}>Options</h3>
          {entry.options.map((opt) => {
            const v = selected.options[opt.key];
            const setOpt = (val: unknown) => upd({ options: { ...selected.options, [opt.key]: val } });
            if (opt.type === "boolean") {
              return (
                <div key={opt.key} className="field-row">
                  <label>{opt.label}</label>
                  <input type="checkbox" checked={!!v} onChange={(e) => setOpt(e.target.checked)} />
                </div>
              );
            }
            if (opt.type === "select") {
              return (
                <div key={opt.key} className="field-row">
                  <label>{opt.label}</label>
                  <select value={String(v ?? opt.default)} onChange={(e) => setOpt(e.target.value)}>
                    {opt.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            }
            if (opt.type === "textarea") {
              return (
                <div key={opt.key} title={opt.hint} style={{ margin: "6px 0" }}>
                  <label style={{ display: "block", marginBottom: 3 }}>{opt.label}</label>
                  <textarea
                    rows={opt.rows ?? 6}
                    style={{ width: "100%", fontFamily: "ui-monospace,monospace", fontSize: 11,
                             background: "var(--panel)", color: "var(--text)",
                             border: "1px solid var(--border)", borderRadius: 3, padding: 4 }}
                    value={String(v ?? "")}
                    onChange={(e) => setOpt(e.target.value)} />
                  {opt.hint && <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{opt.hint}</div>}
                </div>
              );
            }
            return (
              <div key={opt.key} className="field-row" title={opt.hint}>
                <label>{opt.label}</label>
                <input
                  type={opt.type === "number" ? "number" : "text"}
                  value={String(v ?? "")}
                  onChange={(e) => setOpt(opt.type === "number" ? Number(e.target.value) : e.target.value)} />
              </div>
            );
          })}
        </>
      )}

      {entry.dynamicBindings ? (
        <DynamicBindingsEditor selected={selected} upd={upd} />
      ) : entry.bindings.length > 0 && (
        <>
          <h3 style={{ marginTop: 14 }}>Bindings</h3>
          <table className="bindings-table">
            <thead><tr><th>Field</th><th>Spec</th></tr></thead>
            <tbody>
              {entry.bindings.map((f) => {
                const spec = selected.bindings[f.key] ?? "";
                const err = spec ? validateSpec(spec) : (f.required ? "required" : null);
                return (
                  <tr key={f.key} className={err ? "err" : ""}>
                    <td>{f.label}{f.required && <span style={{ color: "var(--error)" }}> *</span>}</td>
                    <td>
                      <input value={spec}
                        placeholder={f.defaultSpec}
                        onChange={(e) => upd({ bindings: { ...selected.bindings, [f.key]: e.target.value } })} />
                      {err && <div style={{ color: "var(--error)", fontSize: 11 }}>{err}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <SpecHelp />
        </>
      )}

      {!isRequiredHandlerType(selected.type) && (
        <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
          <button onClick={() => removeWidget(selected.instanceId)}>Delete widget</button>
        </div>
      )}
    </div>
  );
}

function int(s: string) { return Math.max(1, parseInt(s, 10) || 1); }

// Re-snap a grid area to a locked aspect ratio. `driven` says which axis the
// user just edited — the other follows. For position changes (start), we
// preserve the existing spans and only shift; for end changes, we recompute
// the opposite span from aspectRatio.
function lockedArea(area: import("../model/types").GridArea, aspect?: number, driven?: "col" | "row") {
  if (aspect == null) return area;
  const colSpan = Math.max(1, area.colEnd - area.colStart);
  const rowSpan = Math.max(1, area.rowEnd - area.rowStart);
  if (driven === "col") {
    const newRowSpan = Math.max(1, Math.round(colSpan * aspect));
    return { ...area, rowEnd: area.rowStart + newRowSpan };
  }
  if (driven === "row") {
    const newColSpan = Math.max(1, Math.round(rowSpan / aspect));
    return { ...area, colEnd: area.colStart + newColSpan };
  }
  // No driven axis — start moved, keep both spans, but enforce shape if drifted.
  const newRowSpan = Math.max(1, Math.round(colSpan * aspect));
  if (newRowSpan !== rowSpan) {
    return { ...area, rowEnd: area.rowStart + newRowSpan };
  }
  return area;
}

function SpecHelp() {
  return (
    <details style={{ marginTop: 6, color: "var(--text-dim)", fontSize: 11 }}>
      <summary>Spec syntax</summary>
      <code>clientraw[N]</code>, <code>clientrawExtra[N]</code>, <code>clientrawHour[N]</code>, <code>clientrawDaily[N]</code>,
      {" "}<code>extraInput(N)[K]</code>, <code>widgetListInput:KEY[K]</code>, <code>const:VALUE</code>, <code>dict:KEY</code>, <code>fn:NAME</code>
    </details>
  );
}

type DynProps = {
  selected: WidgetInstance;
  upd: (patch: Partial<WidgetInstance>) => void;
};
function DynamicBindingsEditor({ selected, upd }: DynProps) {
  const entries = Object.entries(selected.bindings);
  const setKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey) return;
    const next: Record<string, string> = {};
    for (const [k, v] of entries) next[k === oldKey ? newKey : k] = v;
    upd({ bindings: next });
  };
  const setSpec = (k: string, v: string) =>
    upd({ bindings: { ...selected.bindings, [k]: v } });
  const remove = (k: string) => {
    const next = { ...selected.bindings };
    delete next[k];
    upd({ bindings: next });
  };
  const add = () => {
    let k = "field";
    let n = 1;
    while (selected.bindings[k]) { k = "field" + (++n); }
    upd({ bindings: { ...selected.bindings, [k]: "const:value" } });
  };
  return (
    <>
      <h3 style={{ marginTop: 14 }}>Bindings (template fields)</h3>
      <table className="bindings-table">
        <thead><tr><th style={{ width: "30%" }}>Key</th><th>Spec</th><th style={{ width: 30 }}></th></tr></thead>
        <tbody>
          {entries.length === 0 && (
            <tr><td colSpan={3} style={{ color: "var(--text-dim)", fontStyle: "italic", padding: "6px 0" }}>
              No bindings yet — add one or reference values directly via <code>{"{{_|dict:KEY}}"}</code> in the template.
            </td></tr>
          )}
          {entries.map(([k, spec]) => {
            const err = validateSpec(spec);
            const keyOk = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k);
            return (
              <tr key={k} className={err || !keyOk ? "err" : ""}>
                <td><input defaultValue={k} onBlur={(e) => setKey(k, e.target.value)} /></td>
                <td>
                  <input value={spec} onChange={(e) => setSpec(k, e.target.value)} />
                  {err && <div style={{ color: "var(--error)", fontSize: 11 }}>{err}</div>}
                  {!keyOk && <div style={{ color: "var(--error)", fontSize: 11 }}>invalid key</div>}
                </td>
                <td><button onClick={() => remove(k)} title="Remove">×</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={add} style={{ marginTop: 4 }}>+ Add binding</button>
      <SpecHelp />
    </>
  );
}

function ButtonsEditor({ doc, updateWidget }: Pick<Props, "doc" | "updateWidget">) {
  // Note: button visibility lives on doc.buttons, not on a widget. We need a
  // setDoc-like callback. Since Inspector receives updateWidget only, we'll
  // wire button changes through a window event handled in App. Simpler: read
  // doc.buttons here and emit a custom event the parent listens to.
  // For now, expose a small read-only summary; toggling lives in the toolbar
  // in a future iteration.
  return (
    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
      {doc.buttons.map((b) => (
        <div key={b.id}>{b.id}: {b.visible ? "visible" : "hidden"}</div>
      ))}
    </div>
  );
}
