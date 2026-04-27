// Widget catalog — the editor's knowledge of every widget type that the
// FreshWDL runtime can construct. Each entry lets the editor:
//   1) populate the palette,
//   2) generate a sensible default WidgetInstance when one is dropped,
//   3) drive the inspector (which binding fields are shown, which option
//      toggles, etc.),
//   4) emit a correct manifest entry in Layout.js.
//
// Sources: Layout.js (existing), js_bundles/widgets/*.js (option flags read
// inside widget code). When a new widget type is added to the runtime, add
// a corresponding entry here.

export type BindingFieldDef = {
  key: string;                 // field name in the bindings object
  label: string;               // human label for inspector
  defaultSpec: string;         // default DataBindings spec
  required: boolean;
  hint?: string;               // shown under the input
};

export type OptionFieldDef =
  | { key: string; label: string; type: "boolean";  default: boolean; hint?: string }
  | { key: string; label: string; type: "string";   default: string;  hint?: string }
  | { key: string; label: string; type: "number";   default: number;  hint?: string }
  | { key: string; label: string; type: "select";   default: string;  options: string[]; hint?: string }
  | { key: string; label: string; type: "textarea"; default: string;  rows?: number; hint?: string };

export type CatalogEntry = {
  type: string;                // matches Ctor name in runtime, e.g. "TemperatureBarWidget"
  category: "Widget" | "Handler";
  ctor: string;                // identifier emitted as `Ctor:` in manifest
  needsCanvas: boolean;        // true → DOM slot + canvas id; false → no canvas
  // True when the entry should occupy a grid slot in the editor + emitted DOM.
  // Implied true when needsCanvas is true; explicitly set on handlers that
  // own a non-canvas DOM element (e.g. ForecastHandler → #forecastText).
  placedInGrid?: boolean;
  defaultEnabledKey: string;
  defaultCanvasIdPrefix: string;
  defaultArea: { colSpan: number; rowSpan: number };
  bindings: BindingFieldDef[];
  options: OptionFieldDef[];
  // When true, the inspector lets the user add/remove arbitrary bindings
  // (free-form key + spec) instead of a fixed list. Used for generic
  // widgets like WidgetText.
  dynamicBindings?: boolean;
  // Locked aspect ratio (height / width). When set, the editor refuses to
  // resize this widget to a different shape — only proportional scaling.
  // Matches the widget class' prototype.aspectRatio. Omit for free-form
  // (text widget) or non-canvas (handler) entries.
  aspectRatio?: number;
  notes?: string;
};

const cr   = (i: number) => `clientraw[${i}]`;
const crE  = (i: number) => `clientrawExtra[${i}]`;

// Default templates for the generic WidgetText. These mirror the bodies of
// the dedicated widgets (TitleRainfall, MoonSun, plain title) so a user
// dropping "Text" onto the canvas gets something useful immediately.
const TEMPLATE_PRESETS: Record<string, string> = {
  blank:
    `<text x="50%" y="50%" font="bold 20%h arial" maxWidth="stage">{{label}}</text>`,
  title:
    `<text x="50%" y="50%" font="bold 60%h arial" maxWidth="stage">{{_|dict:rainfallTitle}}</text>`,
  pressureWithTrend: [
    `<shape type="roundedRect" x="5%" y="100%h - 67%h - 5%w" w="90%" h="67%"`,
    `       radius="10%" strokeSize="2.5%" fill="#F6F6F6"/>`,
    `<text x="50%" y="11%" font="bold 19%w arial" maxWidth="stage">{{_|dict:barometerTitle}}</text>`,
    `<text x="50%" y="40%" font="bold 12.5%w arial">{{pressure|unit:pressure}}</text>`,
    `<text x="50%" y="60%" font="bold 14%w arial" maxWidth="stage">{{_|dict:barometerRate}}:</text>`,
    `<text x="50%" y="75%" font="bold 12.5%w arial" maxWidth="90%">{{trend}}</text>`,
  ].join("\n"),
};

export const CATALOG: CatalogEntry[] = [
  // ---------------- Generic text widget (template-driven) ----------------
  {
    type: "WidgetText",
    category: "Widget",
    ctor: "WidgetText",
    needsCanvas: true,
    defaultEnabledKey: "textWidget",
    defaultCanvasIdPrefix: "Text",
    defaultArea: { colSpan: 4, rowSpan: 4 },
    bindings: [],
    dynamicBindings: true,
    options: [
      { key: "template",    label: "Template",     type: "textarea", rows: 8,
        default: TEMPLATE_PRESETS.blank,
        hint: "<shape>/<text> elements with {{field|filter:arg}} placeholders. See WidgetText.js." },
      { key: "aspectRatio", label: "Aspect ratio", type: "number",   default: 1.0,
        hint: "canvas height = width × aspectRatio." },
    ],
    notes: "Generic text widget. Use bindings + template to display any data or static label.",
  },

  // ---------------- Bar / Gauge widgets ----------------
  {
    type: "TemperatureBarWidget",
    category: "Widget",
    ctor: "TemperatureBarWidget",
    needsCanvas: true,
    aspectRatio: 2.0,
    defaultEnabledKey: "temperature",
    defaultCanvasIdPrefix: "TempBar",
    defaultArea: { colSpan: 3, rowSpan: 6 },
    bindings: [
      { key: "temp",  label: "Temp",  defaultSpec: cr(4),   required: true },
      { key: "high",  label: "High",  defaultSpec: cr(46),  required: false },
      { key: "low",   label: "Low",   defaultSpec: cr(47),  required: false },
      { key: "trend", label: "Trend", defaultSpec: cr(143), required: false },
    ],
    options: [
      { key: "widgetListKey",   label: "widgetList key", type: "string",  default: "temperature" },
      { key: "withArrow",       label: "With arrow",     type: "boolean", default: true },
      { key: "withAutoSwitch",  label: "Auto-switch",    type: "boolean", default: false,
        hint: "Used by windChill (chill ↔ heat-index)." },
      { key: "modeKey",         label: "Mode key",       type: "string",  default: "" },
      { key: "titleSuffix",     label: "Title suffix",   type: "string",  default: "" },
    ],
  },
  {
    type: "HumidityGaugeWidget",
    category: "Widget",
    ctor: "HumidityGaugeWidget",
    needsCanvas: true,
    aspectRatio: 1.0,
    defaultEnabledKey: "humidity",
    defaultCanvasIdPrefix: "HumidityGauge",
    defaultArea: { colSpan: 4, rowSpan: 4 },
    bindings: [
      { key: "humidity", label: "Humidity", defaultSpec: cr(5),   required: true },
      { key: "trend",    label: "Trend",    defaultSpec: cr(144), required: false },
    ],
    options: [],
  },
  {
    type: "BarometerWidget",
    category: "Widget",
    ctor: "BarometerWidget",
    needsCanvas: true,
    aspectRatio: 1.0,
    defaultEnabledKey: "barometer",
    defaultCanvasIdPrefix: "Barometer",
    defaultArea: { colSpan: 4, rowSpan: 4 },
    bindings: [
      { key: "pressure", label: "Pressure", defaultSpec: cr(6),  required: true },
      { key: "trend",    label: "Trend",    defaultSpec: cr(50), required: false },
    ],
    options: [],
    notes: "Includes hard-coded sign/Steady logic for trend. For a plain pressure readout use the generic Text widget.",
  },
  {
    type: "WindSpeedWidget",
    category: "Widget",
    ctor: "WindSpeedWidget",
    needsCanvas: true,
    aspectRatio: 1.5,
    defaultEnabledKey: "windSpeed",
    defaultCanvasIdPrefix: "WindSpeed",
    defaultArea: { colSpan: 4, rowSpan: 6 },
    bindings: [
      { key: "speed",    label: "Speed",    defaultSpec: cr(1),   required: true },
      { key: "gust",     label: "Gust",     defaultSpec: cr(2),   required: false },
      { key: "windHigh", label: "Wind high",defaultSpec: cr(113), required: false },
      { key: "gustHigh", label: "Gust high",defaultSpec: cr(71),  required: false },
    ],
    options: [],
  },
  {
    type: "WindGaugeWidget",
    category: "Widget",
    ctor: "WindGaugeWidget",
    needsCanvas: true,
    aspectRatio: 1.0,
    defaultEnabledKey: "windDirection",
    defaultCanvasIdPrefix: "WindGauge",
    defaultArea: { colSpan: 4, rowSpan: 4 },
    bindings: [
      { key: "direction", label: "Direction", defaultSpec: cr(3),   required: true },
      { key: "avg",       label: "Avg dir",   defaultSpec: cr(117), required: false },
    ],
    options: [],
  },
  {
    type: "ApparentWidget",
    category: "Widget",
    ctor: "ApparentWidget",
    needsCanvas: true,
    aspectRatio: 17 / 30,
    defaultEnabledKey: "apparent",
    defaultCanvasIdPrefix: "Apparent",
    defaultArea: { colSpan: 6, rowSpan: 3 },
    bindings: [
      { key: "temp", label: "Apparent °", defaultSpec: cr(130), required: true },
    ],
    options: [],
  },
  {
    type: "UVBarWidget",
    category: "Widget",
    ctor: "UVBarWidget",
    needsCanvas: true,
    aspectRatio: 3.0,
    defaultEnabledKey: "UV",
    defaultCanvasIdPrefix: "UVBar",
    defaultArea: { colSpan: 2, rowSpan: 6 },
    bindings: [
      { key: "uv", label: "UV index", defaultSpec: cr(79), required: true },
    ],
    options: [],
  },
  {
    type: "SolarBarWidget",
    category: "Widget",
    ctor: "SolarBarWidget",
    needsCanvas: true,
    aspectRatio: 3.0,
    defaultEnabledKey: "solar",
    defaultCanvasIdPrefix: "SolarBar",
    defaultArea: { colSpan: 2, rowSpan: 6 },
    bindings: [
      { key: "percent",  label: "% of max",  defaultSpec: cr(34),    required: true },
      { key: "watts",    label: "Watts",     defaultSpec: cr(127),   required: false },
      { key: "sunHours", label: "Sun hours", defaultSpec: crE(696),  required: false },
    ],
    options: [],
  },
  {
    type: "MoonSunWidget",
    category: "Widget",
    ctor: "MoonSunWidget",
    needsCanvas: true,
    aspectRatio: 1.0,
    defaultEnabledKey: "moonSun",
    defaultCanvasIdPrefix: "MoonSun",
    defaultArea: { colSpan: 4, rowSpan: 4 },
    bindings: [
      { key: "sunRise",   label: "Sun rise",   defaultSpec: crE(556), required: true },
      { key: "sunSet",    label: "Sun set",    defaultSpec: crE(557), required: true },
      { key: "moonRise",  label: "Moon rise",  defaultSpec: crE(558), required: false },
      { key: "moonSet",   label: "Moon set",   defaultSpec: crE(559), required: false },
      { key: "moonPhase", label: "Moon phase", defaultSpec: crE(560), required: false },
      { key: "moonAge",   label: "Moon age",   defaultSpec: crE(561), required: false },
    ],
    options: [],
    notes: "Fixed sun/moon layout. For a custom layout use the generic Text widget.",
  },
  {
    type: "StatusWidget",
    category: "Widget",
    ctor: "StatusWidget",
    needsCanvas: true,
    aspectRatio: 0.4 / 6.19,
    defaultEnabledKey: "status",
    defaultCanvasIdPrefix: "Status",
    defaultArea: { colSpan: 16, rowSpan: 1 },
    bindings: [
      { key: "status",      label: "Status",       defaultSpec: cr(49), required: true },
      { key: "stationTime", label: "Station time", defaultSpec: cr(32), required: false },
      { key: "stationDate", label: "Station date", defaultSpec: cr(74), required: false },
    ],
    options: [],
  },
  {
    type: "UniBarWidget",
    category: "Widget",
    ctor: "UniBarWidget",
    needsCanvas: true,
    aspectRatio: 2.5 * 3.01 / 3.0,
    defaultEnabledKey: "rainfallDay",
    defaultCanvasIdPrefix: "UniBar",
    defaultArea: { colSpan: 2, rowSpan: 5 },
    bindings: [
      { key: "value", label: "Value", defaultSpec: cr(7), required: true },
    ],
    options: [
      { key: "title", label: "Title (dict key)", type: "string", default: "rainfallDailyTitle",
        hint: "Emitted as useDict(\"<key>\")." },
    ],
  },
  {
    type: "TitleRainfallWidget",
    category: "Widget",
    ctor: "TitleRainfallWidget",
    needsCanvas: true,
    aspectRatio: 0.12 / 0.99,
    defaultEnabledKey: "rainfallTitle",
    defaultCanvasIdPrefix: "TitleRainfall",
    defaultArea: { colSpan: 8, rowSpan: 1 },
    bindings: [],
    options: [],
    notes: "Legacy. Prefer the generic Text widget with template '{{_|dict:rainfallTitle}}'.",
  },
  {
    type: "MainChartWidget",
    category: "Widget",
    ctor: "MainChartWidget",
    needsCanvas: true,
    aspectRatio: 0.7,
    defaultEnabledKey: "graphHandlerTemperature",
    defaultCanvasIdPrefix: "ChartCanvas",
    defaultArea: { colSpan: 8, rowSpan: 6 },
    bindings: [],
    options: [
      { key: "graphType",   label: "Graph type",  type: "select", default: "line",
        options: ["line", "bar"] },
      { key: "defaultBase", label: "Default base", type: "select", default: "temp",
        options: ["temp", "windSpeed", "windDir", "barometer", "humidity", "solar", "uv", "rainfallBar", "rainfallLine"] },
      { key: "defaultRange",label: "Default range", type: "select", default: "hourlyDay",
        options: ["minutlyHour", "hourlyDay", "quarterDailyWeek", "dailyMonth"],
        hint: "Not every base supports every range — see globalGraphs in Globals.js." },
    ],
  },

  // ---------------- DOM Handlers (no canvas) ----------------
  {
    type: "ForecastHandler",
    category: "Handler",
    ctor: "ForecastHandler",
    needsCanvas: false,
    placedInGrid: true,
    defaultEnabledKey: "forecastHandler",
    defaultCanvasIdPrefix: "",
    defaultArea: { colSpan: 12, rowSpan: 1 },
    bindings: [],
    options: [
      { key: "elementId", label: "Element id", type: "string", default: "forecastText" },
    ],
  },
  {
    type: "RecordsHandler",
    category: "Handler",
    ctor: "RecordsHandler",
    needsCanvas: false,
    defaultEnabledKey: "recordHandler",
    defaultCanvasIdPrefix: "",
    defaultArea: { colSpan: 0, rowSpan: 0 },
    bindings: [],
    options: [],
    notes: "No DOM slot; lives in modal. Not rendered on the grid.",
  },
  {
    type: "ModalGraphHandler",
    category: "Handler",
    ctor: "ModalGraphHandler",
    needsCanvas: false,
    defaultEnabledKey: "graphHandler",
    defaultCanvasIdPrefix: "",
    defaultArea: { colSpan: 0, rowSpan: 0 },
    bindings: [],
    options: [],
    notes: "No DOM slot; lives in modal.",
  },
  {
    type: "ModalHandler",
    category: "Handler",
    ctor: "ModalHandler",
    needsCanvas: false,
    defaultEnabledKey: "modalHandler",
    defaultCanvasIdPrefix: "",
    defaultArea: { colSpan: 0, rowSpan: 0 },
    bindings: [],
    options: [],
    notes: "No DOM slot. Wires up modal open/close.",
  },
  {
    type: "ButtonsHandler",
    category: "Handler",
    ctor: "ButtonsHandler",
    needsCanvas: false,
    defaultEnabledKey: "",
    defaultCanvasIdPrefix: "",
    defaultArea: { colSpan: 0, rowSpan: 0 },
    bindings: [],
    options: [],
    notes: "No enabledKey. Always emitted.",
  },
];

export function getCatalogEntry(type: string): CatalogEntry | undefined {
  return CATALOG.find((c) => c.type === type);
}

// True for any entry that occupies a slot in the grid (canvas widgets and
// non-canvas handlers like ForecastHandler that own a positioned DOM element).
export function isPlacedInGrid(entry: CatalogEntry | undefined): boolean {
  return !!entry && (entry.needsCanvas || entry.placedInGrid === true);
}
