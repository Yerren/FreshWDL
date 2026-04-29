import { useEffect, useMemo, useRef, useState } from "react";
import type { DictOrText } from "../catalog";
import { coerceDictOrText, getCatalogEntry, isPlacedInGrid } from "../catalog";
import { isRequiredHandlerType } from "../model/defaults";
import { useDictKeys } from "../model/dictKeys";
import type { GridArea, LayoutDoc, WidgetInstance } from "../model/types";
import { IDENT_RE, validateSpec } from "../model/validation";

type Props = {
  doc: LayoutDoc;
  selected: WidgetInstance | null;
  selectionCount?: number;
  updateWidget: (id: string, patch: Partial<WidgetInstance>) => void;
  removeWidget: (id: string) => void;
};

export function Inspector({ selected, selectionCount = 0, updateWidget, removeWidget }: Props) {
  if (!selected) {
    return (
      <div className="inspector">
        <div className="inspector-empty">
          <div className="inspector-empty-icon">◇</div>
          <div className="inspector-empty-title">
            {selectionCount > 1 ? `${selectionCount} widgets selected` : "Nothing selected"}
          </div>
          <div className="inspector-empty-hint">
            {selectionCount > 1
              ? "Drag to move them as a group, or press Delete to remove."
              : "Pick a widget on the canvas to edit its settings. Shift-click to select multiple."}
          </div>
        </div>
      </div>
    );
  }
  const entry = getCatalogEntry(selected.type);
  if (!entry) return <div className="inspector">Unknown type: {selected.type}</div>;

  const upd = (patch: Partial<WidgetInstance>) =>
    updateWidget(selected.instanceId, patch);
  const setAreaField = (k: keyof GridArea, v: string) =>
    upd({ area: { ...selected.area, [k]: int(v) } });

  const hasOptions = entry.options.length > 0;
  const hasBindingsUI = entry.dynamicBindings || entry.bindings.length > 0;

  return (
    <div className="inspector">
      <div className="inspector-header">
        <div className="inspector-title">{entry.displayName}</div>
        <div className="inspector-subtitle">{selected.instanceId}</div>
      </div>

      {hasOptions && (
        <div className="card">
          {entry.options.map((opt) => {
            const v = selected.options[opt.key];
            const setOpt = (val: unknown) => upd({ options: { ...selected.options, [opt.key]: val } });
            if (opt.type === "boolean") {
              return (
                <div key={opt.key} className="field-row" title={opt.hint}>
                  <label>{opt.label}</label>
                  <input type="checkbox" checked={!!v} onChange={(e) => setOpt(e.target.checked)} />
                </div>
              );
            }
            if (opt.type === "select") {
              return (
                <div key={opt.key} className="field-row" title={opt.hint}>
                  <label>{opt.label}</label>
                  <select value={String(v ?? opt.default)} onChange={(e) => setOpt(e.target.value)}>
                    {opt.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            }
            if (opt.key === "aspectRatio" && opt.type === "number") {
              return (
                <AspectRatioInput
                  key={opt.key}
                  instanceId={selected.instanceId}
                  ratio={Number(v ?? opt.default)}
                  onChange={setOpt}
                  hint={opt.hint}
                />
              );
            }
            if (opt.type === "dictOrText") {
              const dt = coerceDictOrText(v, opt.default);
              return (
                <DictOrTextInput
                  key={opt.key}
                  label={opt.label}
                  hint={opt.hint}
                  value={dt}
                  onChange={setOpt}
                />
              );
            }
            if (opt.type === "textarea") {
              return (
                <div key={opt.key} title={opt.hint} className="textarea-field">
                  <label>{opt.label}</label>
                  <textarea
                    rows={opt.rows ?? 6}
                    value={String(v ?? "")}
                    onChange={(e) => setOpt(e.target.value)} />
                  {opt.hint && <div className="hint">{opt.hint}</div>}
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
        </div>
      )}

      <details className="advanced">
        <summary>Advanced</summary>
        <div className="card">
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
              <div className="field-row">
                <label>Col start / end</label>
                <input type="number" value={selected.area.colStart}
                  onChange={(e) => setAreaField("colStart", e.target.value)} />
                <input type="number" value={selected.area.colEnd}
                  onChange={(e) => setAreaField("colEnd", e.target.value)} />
              </div>
              <div className="field-row">
                <label>Row start / end</label>
                <input type="number" value={selected.area.rowStart}
                  onChange={(e) => setAreaField("rowStart", e.target.value)} />
                <input type="number" value={selected.area.rowEnd}
                  onChange={(e) => setAreaField("rowEnd", e.target.value)} />
              </div>
            </>
          )}
        </div>

        {hasBindingsUI && (
          <div className="card">
            <div className="card-heading">Data bindings</div>
            {entry.dynamicBindings ? (
              <DynamicBindingsEditor selected={selected} upd={upd} />
            ) : (
              <>
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
                            {err && <div className="err-msg">{err}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <SpecHelp />
              </>
            )}
          </div>
        )}
      </details>

      {!isRequiredHandlerType(selected.type) && (
        <div className="inspector-footer">
          <button className="danger" onClick={() => removeWidget(selected.instanceId)}>Delete widget</button>
        </div>
      )}
    </div>
  );
}

function int(s: string) { return Math.max(1, parseInt(s, 10) || 1); }

// Aspect ratio is stored as a single number (height / width — used directly by
// CanvasWidget.resize). The raw number is unintuitive (e.g. 16:9 = 0.5625, and
// negatives are meaningless), so we edit it as a width × height pair and only
// derive the ratio on commit. Local state lets the user clear or retype either
// box without the value snapping back mid-edit.
function AspectRatioInput(
  { instanceId, ratio, onChange, hint }: {
    instanceId: string;
    ratio: number;
    onChange: (v: number) => void;
    hint?: string;
  },
) {
  const [w, setW] = useState("1");
  const [h, setH] = useState(String(ratio || 1));
  useEffect(() => {
    setW("1");
    setH(String(ratio || 1));
  }, [instanceId]);

  const commit = (nw: string, nh: string) => {
    const wn = parseFloat(nw);
    const hn = parseFloat(nh);
    if (wn >= 1 && hn >= 1) onChange(hn / wn);
  };
  return (
    <div className="field-row" title={hint}>
      <label>Aspect (W × H)</label>
      <input
        type="number" min={1} step="any" style={{ width: 60 }}
        value={w}
        onChange={(e) => { setW(e.target.value); commit(e.target.value, h); }} />
      <span style={{ color: "var(--text-dim)" }}>×</span>
      <input
        type="number" min={1} step="any" style={{ width: 60 }}
        value={h}
        onChange={(e) => { setH(e.target.value); commit(w, e.target.value); }} />
    </div>
  );
}

function SpecHelp() {
  return (
    <details className="spec-help">
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
            const keyOk = IDENT_RE.test(k);
            return (
              <tr key={k} className={err || !keyOk ? "err" : ""}>
                <td><input defaultValue={k} onBlur={(e) => setKey(k, e.target.value)} /></td>
                <td>
                  <input value={spec} onChange={(e) => setSpec(k, e.target.value)} />
                  {err && <div className="err-msg">{err}</div>}
                  {!keyOk && <div className="err-msg">invalid key</div>}
                </td>
                <td><button onClick={() => remove(k)} title="Remove">×</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={add} style={{ marginTop: 6 }}>+ Add binding</button>
      <SpecHelp />
    </>
  );
}

function DictOrTextInput(
  { label, hint, value, onChange }: {
    label: string;
    hint?: string;
    value: DictOrText;
    onChange: (v: DictOrText) => void;
  },
) {
  const keys = useDictKeys();
  const [query, setQuery] = useState(value.mode === "dict" ? value.value : "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value.mode === "dict") setQuery(value.value);
  }, [value.mode, value.value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keys.slice(0, 50);
    return keys.filter((k) => k.toLowerCase().includes(q)).slice(0, 50);
  }, [keys, query]);

  return (
    <div title={hint} className="dict-or-text">
      <div className="field-row">
        <label>{label}</label>
        <select
          value={value.mode}
          style={{ flex: "0 0 auto", width: "auto" }}
          onChange={(e) => {
            const mode = e.target.value as DictOrText["mode"];
            onChange({ mode, value: value.value });
          }}
        >
          <option value="dict">Dictionary</option>
          <option value="text">Literal text</option>
        </select>
      </div>
      {value.mode === "dict" ? (
        <div ref={wrapRef} style={{ position: "relative" }}>
          <input
            style={{ width: "100%" }}
            placeholder={keys.length ? "Search dictionary keys…" : "Loading dictionary…"}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onBlur={() => onChange({ mode: "dict", value: query })}
          />
          {open && matches.length > 0 && (
            <div className="dict-suggest">
              {matches.map((k) => (
                <div
                  key={k}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(k);
                    onChange({ mode: "dict", value: k });
                    setOpen(false);
                  }}
                  className="dict-suggest-item"
                >
                  {k}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <input
          style={{ width: "100%" }}
          value={value.value}
          onChange={(e) => onChange({ mode: "text", value: e.target.value })}
        />
      )}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
