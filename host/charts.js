// Chart.js for the host: turns the graphs' Chart values (bend/lib/chart.bend)
// into Chart.js 2.7 calls. It decides nothing; every number, string and
// colour comes from the Bend side. The page keeps Chart.js and moment as the
// original did (moment.locale(lang) is set by runtime.js on load).
//
//   setup(App.chart_defaults())   once, before any chart: Chart.defaults and
//                                 the chartArea background plugin (Globals.js)
//   show(id, chart)               CChart: destroy the canvas's chart, new Chart
//   size(id, w, h)                CChartSize: the canvas's div gets w and h
//                                 (CSS strings), then chart.resize()

const charts = {};

// A reading computed in F32 arrives as, say, 1015.5999755859375; Chart.js
// would scale its axis to that. Each goes back to the shortest decimal that
// reads as the same F32: the 1015.6 the original plotted.
function widen(x) {
  if (typeof x !== "number" || !Number.isFinite(x) || Number.isInteger(x)) return x;
  for (let p = 1; p <= 9; p++) {
    const d = Number(x.toPrecision(p));
    if (Math.fround(d) === x) return d;
  }
  return x;
}

// Bend lists arrive as {$: "Con", head, tail} chains.
function list(xs) {
  const out = [];
  while (xs && xs.$ === "Con") {
    out.push(xs.head);
    xs = xs.tail;
  }
  return out;
}

// Globals.js: Chart.defaults.global.* and Chart.pluginService.register.
export function setup(d) {
  const g = Chart.defaults.global;
  g.elements.line.tension = d.tension;
  g.elements.line.borderWidth = d.line_width;
  g.elements.line.borderCapStyle = d.cap;
  g.elements.point.radius = d.radius;
  g.elements.point.hitRadius = d.hit_radius;
  g.elements.point.pointBorder = d.point_border;
  g.elements.point.hoverRadius = d.hover_radius;
  g.animation.duration = d.duration;
  g.responsive = d.responsive;
  g.maintainAspectRatio = d.keep_aspect;
  g.legend.display = d.legend;
  g.defaultFontFamily = d.font;
  Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
      if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
        const ctx = chart.chart.ctx;
        ctx.save();
        ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
        ctx.fillRect(0, 0, d.fill_w, d.fill_h);
        ctx.restore();
      }
    }
  });
}

// A Stamp: a local moment, or moment.invalid() for one the original could
// not parse.
function stamp(s) {
  return s.ok ? moment([s.y, s.mo - 1, s.d, s.h, s.mi, s.s]) : moment.invalid();
}

function style(st, ds) {
  if (st.$ === "SLine") {
    ds.fill = st.fill;
    ds.backgroundColor = st.background;
    ds.borderColor = st.border;
    ds.pointBorderColor = st.point_border;
    ds.pointBackgroundColor = st.point_background;
    ds.pointHoverBackgroundColor = st.point_hover_background;
    ds.pointHoverBorderColor = st.point_hover_border;
  } else {
    ds.backgroundColor = st.background;
    ds.borderColor = st.border;
    ds.borderWidth = st.border_width;
  }
  return ds;
}

function dataset(d) {
  const ds = style(d.style, {label: d.label});
  ds.data = d.data.$ === "SPoints"
    ? list(d.data.points).map((p) => ({x: stamp(p.x), y: widen(p.y)}))
    : list(d.data.values).map(widen);
  return ds;
}

// ticks.minor/major.fontSize, when the graph sized its text.
function sized(ticks, size) {
  if (size.$ === "SizePx") {
    ticks.minor = Object.assign(ticks.minor || {}, {fontSize: size.px});
    ticks.major = Object.assign(ticks.major || {}, {fontSize: size.px});
  }
  return ticks;
}

function xAxis(x) {
  if (x.$ === "XCategory") return {type: "category", ticks: sized({}, x.size)};
  const formats = {};
  for (const f of list(x.formats)) formats[f.unit] = f.format;
  const skip = () => ({autoSkip: x.skip, autoSkipPadding: x.skip_pad});
  return {
    type: "time",
    ticks: sized({minor: skip(), major: skip()}, x.size),
    time: {unit: x.unit, unitStepSize: x.step, displayFormats: formats}
  };
}

function yAxis(y) {
  const scaleLabel = {display: y.label_display, labelString: y.label.$ === "LText" ? y.label.text : null};
  if (y.label_size.$ === "SizePx") scaleLabel.fontSize = y.label_size.px;
  const ticks = {};
  for (const t of list(y.ticks)) {
    switch (t.$) {
      case "TBeginAtZero": ticks.beginAtZero = t.on; break;
      case "TMin": ticks.min = t.v; break;
      case "TMax": ticks.max = t.v; break;
      case "TStep": ticks.stepSize = t.v; break;
    }
  }
  return {scaleLabel, ticks: sized(ticks, y.tick_size)};
}

// Font sizes, tick bounds and steps: every number in the options, widened.
function widenAll(o) {
  for (const k of Object.keys(o)) {
    if (typeof o[k] === "number") o[k] = widen(o[k]);
    else if (o[k] && typeof o[k] === "object") widenAll(o[k]);
  }
}

// The {type, data, options} the original's draw*/configure*/resizeText*
// calls leave the chart with.
export function config(c) {
  const options = {scales: {yAxes: [yAxis(c.y)], xAxes: [xAxis(c.x)]}};
  if (c.background !== "") options.chartArea = {backgroundColor: c.background};
  if (c.title.$ === "TShow") {
    options.title = {display: true, text: c.title.text};
    if (c.title.size.$ === "SizePx") options.title.fontSize = c.title.size.px;
  }
  if (c.legend.$ === "LegendShow") options.legend = {display: c.legend.display};
  widenAll(options);
  return {
    type: c.kind,
    data: {
      labels: list(c.labels).map((l) => stamp(l.at).format(l.format)),
      datasets: list(c.datasets).map(dataset)
    },
    options
  };
}

// CChart: configure*'s chart.destroy() and new Chart(ctx, ...).
export function show(id, c) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();
  // The original made the chart first and only then set the y ticks
  // (configure*'s tickOptions loop), so Chart.js
  // never merged them into the minor and major tick options. Same here.
  const cfg = config(c);
  const all = cfg.options.scales.yAxes[0].ticks, ticks = {};
  for (const k of ["beginAtZero", "min", "max", "stepSize"]) {
    if (k in all) { ticks[k] = all[k]; delete all[k]; }
  }
  const chart = charts[id] = new Chart(canvas.getContext("2d", {alpha: false}), cfg);
  Object.assign(chart.options.scales.yAxes[0].ticks, ticks);
  chart.update();
}

// CChartSize: resizeCanvas*'s canvasDiv.style.width/height, then
// chart.resize() (which sizes the chart off that div).
export function size(id, w, h) {
  const canvas = document.getElementById(id);
  if (!canvas || !canvas.parentElement) return;
  canvas.parentElement.style.width = w;
  canvas.parentElement.style.height = h;
  if (charts[id]) charts[id].resize();
}
