import { CATALOG } from "../catalog";

type Props = { onPickType: (type: string) => void };

export function Palette({ onPickType }: Props) {
  // Handlers (ButtonsHandler, ModalHandler, etc.) are always part of the
  // layout and not user-addable, so the palette shows widgets only.
  const widgets = CATALOG.filter((c) => c.category === "Widget");
  return (
    <div className="palette">
      <h3>Widgets</h3>
      {widgets.map((c) => (
        <div key={c.type} className="palette-item" onClick={() => onPickType(c.type)} title="Click to add at top-left">
          <div>{c.type.replace(/Widget$/, "")}</div>
          <div className="pi-type">{c.bindings.length} binding{c.bindings.length === 1 ? "" : "s"}</div>
        </div>
      ))}
    </div>
  );
}
