// The host: the part of FreshWDL that has to be JavaScript.
//
// The app itself is Bend (bend/app.bend, compiled to build/freshwdl.mjs). It
// decides everything and touches nothing. This file is its hands and eyes:
// it tells the app what happened (the page loaded, a file arrived, a frame
// is due, something was clicked, the window resized) and carries out the
// commands the app answers with, against the DOM, the canvases (through
// EaselJS), Chart.js, Opentip and the network. It makes no decisions of its
// own beyond translating between the two.

import App from "../build/freshwdl.mjs";
import * as Charts from "./charts.js";
import { fillDates } from "./records.js";

let app = null;
const stages = {};
const tips = {};
const timers = {};

// Bend lists arrive as {$: "Con", head, tail} chains.
function* list(xs) {
  while (xs && xs.$ === "Con") {
    yield xs.head;
    xs = xs.tail;
  }
}

const el = (id) => document.getElementById(id);
const now = () => Math.floor(performance.now()) >>> 0;

function clock() {
  const d = new Date();
  return {$: "Clock", year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
    hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds(),
    ms: d.getMilliseconds()};
}

// Hand an event to the app, keep its new state, do what it says.
function run(out) {
  app = out.app;
  for (const cmd of list(out.cmds)) exec(cmd);
}

// Scenes onto EaselJS
// -------------------

// Bend computes in F32. The original computed in doubles, and a value like
// 63.65 arrives as 63.64999771118164: close, but enough to change how a
// text squeezed to a maxWidth rasterises. Each number goes back to the
// shortest decimal that reads as the same F32, which is the value the
// original's double arithmetic meant.
const widened = new Map();
function w(x) {
  if (!Number.isFinite(x) || Number.isInteger(x)) return x;
  let d = widened.get(x);
  if (d === undefined) {
    for (let p = 1; p <= 9; p++) {
      d = Number(x.toPrecision(p));
      if (Math.fround(d) === x) break;
    }
    if (widened.size > 100000) widened.clear();
    widened.set(x, d);
  }
  return d;
}

function graphics(gfx) {
  const g = new createjs.Graphics();
  for (const c of list(gfx)) {
    switch (c.$) {
      case "GStroke": g.beginStroke(c.color); break;
      case "GFill": g.beginFill(c.color); break;
      case "GStyle": g.setStrokeStyle(w(c.width), c.caps === "" ? undefined : c.caps); break;
      case "GMove": g.moveTo(w(c.x), w(c.y)); break;
      case "GLine": g.lineTo(w(c.x), w(c.y)); break;
      case "GCircle": g.drawCircle(w(c.x), w(c.y), w(c.r)); break;
      case "GRect": g.drawRect(w(c.x), w(c.y), w(c.w), w(c.h)); break;
      case "GRoundRect": g.drawRoundRect(w(c.x), w(c.y), w(c.w), w(c.h), w(c.r)); break;
      case "GArc": g.arc(w(c.x), w(c.y), w(c.r), w(c.a0), w(c.a1), c.ccw); break;
      case "GClosePath": g.closePath(); break;
    }
  }
  return g;
}

function place(obj, xf) {
  obj.x = w(xf.x);
  obj.y = w(xf.y);
  obj.rotation = w(xf.rot);
  obj.regX = w(xf.regx);
  obj.regY = w(xf.regy);
  obj.visible = xf.visible;
  return obj;
}

// An exact size from the app (see Ex in bend/lib/scene.bend): numbers,
// + - * / and parentheses, evaluated in doubles as the original's
// JavaScript evaluated them.
function evaluate(src) {
  let i = 0;
  const atom = () => {
    if (src[i] === "(") { i++; const v = sum(); i++; return v; }
    const m = /^-?[0-9.]+(e[-+]?[0-9]+)?/.exec(src.slice(i));
    i += m[0].length;
    return Number(m[0]);
  };
  const product = () => {
    let v = atom();
    while (src[i] === "*" || src[i] === "/") v = src[i++] === "*" ? v * atom() : v / atom();
    return v;
  };
  const sum = () => {
    let v = product();
    while (src[i] === "+" || (src[i] === "-" && i > 0)) v = src[i++] === "+" ? v + product() : v - product();
    return v;
  };
  return sum();
}

const fonts = new Map();
function font(f) {
  if (!f.includes("{")) return f;
  let out = fonts.get(f);
  if (out === undefined) {
    out = f.replace(/{([^}]*)}/g, (_, e) => String(evaluate(e)));
    if (fonts.size > 10000) fonts.clear();
    fonts.set(f, out);
  }
  return out;
}

function node(n) {
  if (n.$ === "NShape") {
    const s = place(new createjs.Shape(graphics(n.gfx)), n.xf);
    s.snapToPixel = true;
    if (n.mask.$ === "Con") s.mask = new createjs.Shape(graphics(n.mask));
    return s;
  }
  const t = place(new createjs.Text(n.text, font(n.font), n.color === "" ? undefined : n.color), n.xf);
  t.textAlign = n.align;
  t.textBaseline = n.base;
  t.maxWidth = n.maxw === 0 ? null : w(n.maxw);
  return t;
}

function draw(id, scene) {
  const canvas = el(id);
  if (!canvas) return;
  const stage = stages[id] ??= new createjs.Stage(canvas);
  stage.removeAllChildren();
  stage.x = w(scene.x);
  stage.y = w(scene.y);
  for (const n of list(scene.nodes)) stage.addChild(node(n));
  stage.update();
}

// Commands
// --------

function fetchFile(file, url) {
  // loadArray: a GET the browser may not answer from its cache
  const d = new Date();
  const nocache = `${d.getFullYear()}${d.getMonth()}${d.getDate()}${d.getTime()}`;
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url + "?nocache=" + nocache, true);
  xhr.setRequestHeader("Cache-Control", "no-cache");
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      run(App.fetched(app, file, xhr.status === 200, xhr.responseText.toString(), now(), clock()));
    }
  };
  xhr.send();
}

function fits(e, test) {
  if (test.$ === "FitsInside") {
    // checkOverflow
    const cur = e.style.overflow;
    if (!cur || cur === "visible") e.style.overflow = "hidden";
    const over = e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight;
    e.style.overflow = cur;
    return !over;
  }
  return !(el(test.container).clientHeight + 2 < e.clientHeight);
}

function setProp(e, prop, value) {
  if (prop.startsWith("style.")) e.style[prop.slice(6)] = value;
  else e[prop] = value;
}

function exec(c) {
  const e = c.id === undefined ? null : el(c.id);
  switch (c.$) {
    case "CHtml": if (e) e.innerHTML = c.html; break;
    case "CAttr": if (e) e.setAttribute(c.name, c.value); break;
    case "CStyle": if (e) e.style[c.prop] = c.value; break;
    case "CSize": if (e) { e.width = c.w; e.height = c.h; } break;
    case "CDraw": draw(c.id, c.scene); break;
    case "CTip":
      if (!e) break;
      if (tips[c.id]) tips[c.id].setContent(c.text);
      else tips[c.id] = new Opentip(e, c.text, {background: "#D3D3D3", shadowColor: "#D3D3D3", borderColor: "#D3D3D3"});
      break;
    case "CFetch": fetchFile(c.file, c.url); break;
    case "CEvery":
      clearInterval(timers[c.key]);
      timers[c.key] = setInterval(() => run(App.timer(app, c.key, now(), clock())), c.ms);
      break;
    case "CStop": clearInterval(timers[c.key]); delete timers[c.key]; break;
    case "COption": if (e) { const o = document.createElement("option"); o.value = c.value; o.text = c.text; e.add(o); } break;
    case "CValue": if (e) e.value = c.value; break;
    case "CChart": Charts.show(c.id, c.chart); break;
    case "CChartSize": Charts.size(c.id, c.w, c.h); break;
    case "CFit": {
      if (!e) break;
      for (const v of list(c.values)) {
        setProp(e, c.prop, v);
        if (fits(e, c.test)) break;
      }
      break;
    }
    case "CDates": if (e) fillDates(e, c.parse, c.format); break;
    case "CLog": console.log(c.text); break;
    case "CError": console.error(c.text); break;
  }
}

// Layout
// ------

function box(canvas) {
  const p = canvas.parentElement, g = p ? p.parentElement : null;
  return {$: "Box", pw: p ? p.clientWidth : 0, ph: p ? p.clientHeight : 0,
    gw: g ? g.clientWidth : 0, gh: g ? g.clientHeight : 0,
    vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight};
}

// The window's resize listeners, in the order the original registered them:
// the container first, then each canvas, measured as its turn comes.
function layout() {
  run(App.viewport(app, document.documentElement.clientWidth, document.documentElement.clientHeight));
  for (const id of list(App.canvases(app))) {
    const canvas = el(id);
    if (canvas) run(App.measure(app, id, box(canvas)));
  }
}

// Booting
// -------

function settings(prefix, obj) {
  if (typeof obj !== "object" || obj === null) return [];
  const out = [];
  for (const [w, v] of Object.entries(obj)) {
    if (typeof v === "object" && v !== null) {
      for (const [k, x] of Object.entries(v)) out.push(`${prefix}.${w}.${k}=${String(x)}`);
    } else {
      out.push(`${prefix}.${w}=${String(v)}`);
    }
  }
  return out;
}

const cfg = (name) => (typeof window[name] === "undefined" ? undefined : window[name]);

// Writes the layout the original's UpperContent.js and InnerContent.js
// document.write()'d, before anything measures it.
const markupLayout = document.querySelector("script[data-layout]")?.dataset.layout ?? "";
document.body.insertAdjacentHTML("afterbegin", App.markup(markupLayout));

window.addEventListener("load", () => {
  const lang = cfg("lang") ?? "en";
  moment.locale(lang);
  Charts.setup(App.chart_defaults());
  const names = [cfg("clientRawName"), cfg("clientRawExtraName"), cfg("clientRawHourName"), cfg("clientRawDailyName")];
  const units = Object.entries(cfg("currentUnits") ?? {}).map(([k, v]) => `${k}=${v}`);
  const sets = [...settings("gauge", cfg("gaugeSettings")), ...settings("graph", cfg("graphSettings")),
    ...settings("general", cfg("generalSettings"))];
  run(App.boot(sets.join("\n"), names.join("\n"), window.location.href,
    String(cfg("customBaseURL") ?? false), lang, units.join("\n"), now()));

  layout();
  // Phones keep their zoom: they relayout on rotation only.
  if (onMobile(navigator.userAgent || navigator.vendor || window.opera)) {
    window.matchMedia("(orientation: portrait)").addListener(layout);
  } else {
    window.addEventListener("resize", layout, false);
  }

  document.addEventListener("click", (ev) => run(App.click(app, ev.target.id || "", now(),
    document.documentElement.clientWidth, document.documentElement.clientHeight)));
  document.addEventListener("change", (ev) => run(App.select(app, ev.target.id || "", ev.target.value)));

  // createjs.Ticker at 60 FPS: every stage redraws each frame.
  setInterval(() => run(App.frame(app, now())), 1000 / 60);
});

// Globals.js's phone test (detectmobilebrowsers.com), verbatim. Phones keep
// their zoom, so they only relayout when rotated.
function onMobile(a) {
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4));
}
