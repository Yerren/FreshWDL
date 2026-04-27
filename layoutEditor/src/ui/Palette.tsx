import { CATALOG } from "../catalog";
import { isRequiredHandlerType } from "../model/defaults";

type Props = { onPickType: (type: string) => void };

export function Palette({ onPickType }: Props) {
  // Required handlers (Buttons, Modal, ModalGraph, Records) are always part
  // of the layout and not user-addable. Other handlers (e.g. ForecastHandler)
  // are addable like widgets.
  const items = CATALOG.filter((c) => c.category === "Widget" || !isRequiredHandlerType(c.type));
  return (
    <div className="palette">
      <h3>Widgets</h3>
      {items.map((c) => (
        <div key={c.type} className="palette-item" onClick={() => onPickType(c.type)} title="Click to add at top-left">
          <div>{c.displayName}</div>
          <div className="pi-type">
            {c.category === "Handler" ? (c.notes ?? "handler") : `${c.bindings.length} binding${c.bindings.length === 1 ? "" : "s"}`}
          </div>
        </div>
      ))}
    </div>
  );
}
