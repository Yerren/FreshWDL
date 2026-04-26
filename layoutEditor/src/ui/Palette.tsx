import { CATALOG } from "../catalog";

type Props = { onPickType: (type: string) => void };

export function Palette({ onPickType }: Props) {
  const widgets  = CATALOG.filter((c) => c.category === "Widget");
  const handlers = CATALOG.filter((c) => c.category === "Handler");
  return (
    <div className="palette">
      <h3>Widgets</h3>
      {widgets.map((c) => (
        <div key={c.type} className="palette-item" onClick={() => onPickType(c.type)} title="Click to add at top-left">
          <div>{c.type.replace(/Widget$/, "")}</div>
          <div className="pi-type">{c.bindings.length} binding{c.bindings.length === 1 ? "" : "s"}</div>
        </div>
      ))}
      <h3 style={{ marginTop: 14 }}>Handlers</h3>
      {handlers.map((c) => (
        <div key={c.type} className="palette-item" onClick={() => onPickType(c.type)}>
          <div>{c.type.replace(/Handler$/, "")}</div>
          <div className="pi-type">{c.notes ?? "non-canvas"}</div>
        </div>
      ))}
    </div>
  );
}
