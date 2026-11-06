# Charts: a Chart.js 2.7 chart as data. The host (host/charts.js) turns a
# Chart into `new Chart(ctx, {type, data, options})` with exactly these
# values; bend/widgets/graphs.bend decides every one of them, as
# drawBaroGraphLine01, configureGraphLine, resizeTextBaroG01 and friends did.
import Base

# A local date and time; the host makes it moment([y, mo - 1, d, h, mi, s]),
# or moment.invalid() when ok is False (a moment the original parsed from
# text that did not make a date).
type Stamp is Data:
  Stamp{ok: Bool, y: U32, mo: U32, d: U32, h: U32, mi: U32, s: U32}

# A line chart point {x: moment, y: value}. y is what formatDataToUnit
# returned, as text: the number it printed, or the clientraw string it
# passed through untouched (Celsius); Chart.js reads either with +y.
type Point is Data:
  Point{x: Stamp, y: String}

# A bar chart's category label: moment(at).format(format), formatted by the
# host so moment's locale (moment.locale(lang)) names the months and days.
type Label is Data:
  Label{at: Stamp, format: String}

# A graphStyles entry (Globals.js), the dataset's look.
type Style is Data:
  SLine{fill: Bool, background: String, border: String, point_border: String,
    point_background: String, point_hover_background: String,
    point_hover_border: String}
  SBar{background: String, border: String, border_width: F32}

type Series is Data:
  SPoints{points: +List<Point>}
  SValues{values: +List<String>}

type Dataset is Data:
  Dataset{label: String, style: Style, data: Series}

# A font size the code set (fontSize: px), or Chart.js's default.
type Size is Data:
  SizeAuto{}
  SizePx{px: F32}

# scaleLabel.labelString: null until a graph is configured (Chart.js then
# prints "null"), the label after.
type Lbl is Data:
  LNull{}
  LText{text: String}

# A key of globalGraphs[..].tickOptions copied onto yAxes[0].ticks.
type Tick is Data:
  TBeginAtZero{on: Bool}
  TMin{v: F32}
  TMax{v: F32}
  TStep{v: F32}

# One time.displayFormats entry.
type Fmt is Data:
  Fmt{unit: String, format: String}

# title: {display: true, text, fontSize}; TNone: no title key (Chart.js's
# default, not displayed).
type Title is Data:
  TNone{}
  TShow{text: String, size: Size}

# legend: no key (Chart.defaults.global.legend), or {display}.
type Legend is Data:
  LegendAuto{}
  LegendShow{display: Bool}

# xAxes[0]. XTime: type 'time', ticks.minor and ticks.major {autoSkip,
# autoSkipPadding, fontSize}, time {unit, unitStepSize, displayFormats}.
# XCategory: type 'category', ticks.minor/major.fontSize when sized.
type XAxis is Data:
  XTime{unit: String, step: F32, formats: +List<Fmt>, skip: Bool, skip_pad: F32, size: Size}
  XCategory{size: Size}

# yAxes[0]: scaleLabel {display, labelString, fontSize}, ticks (the
# tickOptions, then minor/major fontSize when sized).
type YAxis is Data:
  YAxis{label_display: Bool, label: Lbl, label_size: Size, ticks: +List<Tick>, tick_size: Size}

# kind: "line" or "bar". labels: data.labels (bar charts). background:
# options.chartArea.backgroundColor, "" for none (the background plugin then
# does nothing).
type Chart is Data:
  Chart{kind: String, labels: +List<Label>, datasets: +List<Dataset>,
    background: String, title: Title, x: XAxis, y: YAxis, legend: Legend}

# Globals.js's Chart.defaults.global settings, and the size of the rectangle
# the chartArea background plugin fills before every draw.
type Defaults is Data:
  Defaults{tension: F32, line_width: F32, cap: String, radius: F32,
    hit_radius: F32, point_border: F32, hover_radius: F32, duration: F32,
    responsive: Bool, keep_aspect: Bool, legend: Bool, font: String,
    fill_w: F32, fill_h: F32}

# Chart.defaults.global.* as Globals.js sets them (globalFontFamily is
# "Arial"), and the plugin's ctx.fillRect(0, 0, 1000, 1000).
def defaults() -> Defaults:
  Defaults{0.1, 4.0, "round", 2.0, 10.0, 10.0, 5.0, 0.0, False{}, False{}, False{},
    "Arial", 1000.0, 1000.0}
