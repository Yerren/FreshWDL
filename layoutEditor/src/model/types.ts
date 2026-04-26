// LayoutDoc is the source-of-truth for the editor. It serializes to JSON
// (download/upload + localStorage autosave) and is converted to a Layout.js
// source string by codegen/emitLayoutJs.ts.

export type LayoutDoc = {
  version: 1;
  grid: { cols: number; rows: number };
  widgets: WidgetInstance[];
  buttons: ButtonConfig[];           // for #bottom button bar
  preview: PreviewConfig;
};

export type WidgetInstance = {
  instanceId: string;          // unique per layout, becomes manifest `id` and DOM data-widget value
  type: string;                // catalog key, e.g. "TemperatureBarWidget"
  enabledKey: string;          // widgetList key (controls enable/disable at runtime)
  canvasID: string;            // unique canvas DOM id
  area: GridArea;
  bindings: Record<string, string>;   // raw spec strings (validated against DataBindings grammar)
  options: Record<string, unknown>;   // catalog-defined extras (withArrow, modeKey, …)
  // Optional title/tooltip overrides emitted as useDict("…") string literals
  titleDictKey?: string;
};

export type GridArea = {
  colStart: number; colEnd: number;   // 1-based, inclusive..exclusive (CSS Grid convention)
  rowStart: number; rowEnd: number;
};

export type ButtonConfig = {
  id: string;
  visible: boolean;
};

export type PreviewConfig = {
  source: "sample" | "live";
  liveUrlPrefix: string;       // e.g. "/" or "https://yourstation.example.com/"
};

export const DEFAULT_BUTTONS: ButtonConfig[] = [
  { id: "AltitudeButton", visible: false },
  { id: "PressureButton", visible: true },
  { id: "WindButton",     visible: true },
  { id: "RainfallButton", visible: true },
  { id: "TempButton",     visible: true },
  { id: "RecordsButton",  visible: true },
  { id: "GraphsButton",   visible: true },
];
