# FreshWDL in Bend: the whole app as pure functions of its state.
#
# The page's host script (host/runtime.js) calls these defs with what
# happened - the page loaded, a file arrived, a frame is due, a button was
# pressed - and carries out the commands each one answers with. Every
# decision the original WidgetsHandlers.js, Globals.js and Loading.js made is
# made here.
import Base
import ./lib/num.bend as Num
import ./lib/raw.bend as Raw
import ./lib/units.bend as U
import ./lib/dict.bend as D
import ./lib/env.bend as E
import ./lib/scene.bend as S
import ./lib/cmd.bend as C
import ./lib/markup.bend as M
import ./wiring.bend as W
import ./widgets/status.bend as Status
import ./widgets/graphs.bend as G
import ./lib/chart.bend as Ch
import ./widgets/forecast.bend as F
import ./widgets/records.bend as R

# The four clientraw files, by index: 0 clientraw, 1 clientrawextra,
# 2 clientrawhour, 3 clientrawdaily.
#
# Net: names, the file names from config.js; base, the URL they sit under;
# done/tried/failed, the doneCR.., attemptedCR.. and dataCollectErrorCR..
# flags per file; old, the fields last handed to the widgets; first, that
# no update has gone out yet (firstTime).
type Net is Data:
  Net{names: +List<String>, base: String, done: +List<Bool>, tried: +List<Bool>,
    failed: +List<Bool>, old: +List<List<&2, String>>, first: Bool}

# The loading screen: the message's text, the dot counter, the fade's
# opacity, and whether it has gone.
type Loading is Data:
  Loading{message: String, count: U32, op: F32, gone: Bool}

type Fwdl is Data:
  Fwdl{env: E.Env, net: Net, loading: Loading, w: W.Widgets}

type Out is Data:
  Out{app: Fwdl, cmds: +List<C.Cmd>}

# List.append for commands.
def cat(+xs: List<&2, C.Cmd>, +ys: List<&2, C.Cmd>) -> List<&2, C.Cmd>:
  List.append(&2, C.Cmd, xs, ys)

# Lists of flags
# --------------

def flags(+b: Bool) -> List<&2, Bool>:
  [b, b, b, b]

def flag(+xs: List<&2, Bool>, +i: Nat) -> Bool:
  Maybe.default(&2, Bool, List.get(&2, Bool, xs, i), False{})

def set_flag(+xs: List<&2, Bool>, +i: Nat, +b: Bool) -> List<&2, Bool>:
  List.set(&2, Bool, xs, i, b)

def all(+xs: List<&2, Bool>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{x, rest}:
      x && all(rest)

def any(+xs: List<&2, Bool>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{x, rest}:
      x || any(rest)

def nth(+xs: List<&2, String>, +i: Nat) -> String:
  Maybe.default(&2, String, List.get(&2, String, xs, i), "")

def fields(+xs: List<&2, List<&2, String>>, +i: Nat) -> List<&2, String>:
  Maybe.default(&2, List<&2, String>, List.get(&2, List<&2, String>, xs, i), [])

# Config
# ------

# widgetList, graphList and generalList as Globals.js declares them, as
# "widget.key" -> String(value). config.js's gaugeSettings, graphSettings
# and generalSettings override these; see merge.
def defaults() -> List<&2, E.KV> :
  [E.KV{"apparent.enabled", "true"},
   E.KV{"temperature.enabled", "true"}, E.KV{"temperature.title", "default"},
   E.KV{"temperature.highLowEnabled", "true"},
   E.KV{"temperature02.enabled", "false"}, E.KV{"temperature02.title", "default"},
   E.KV{"temperature02.highLowEnabled", "true"}, E.KV{"temperature02.input", "1"},
   E.KV{"temperature03.enabled", "false"}, E.KV{"temperature03.title", "default"},
   E.KV{"temperature03.highLowEnabled", "true"}, E.KV{"temperature03.input", "2"},
   E.KV{"barometer.enabled", "true"},
   E.KV{"windChill.enabled", "true"}, E.KV{"windChill.mode", "windchill"},
   E.KV{"windChill.autoSwitch", "true"},
   E.KV{"forecastHandler.enabled", "true"},
   E.KV{"graphHandler.enabled", "true"},
   E.KV{"graphHandlerBarometer.enabled", "true"},
   E.KV{"graphHandlerRainfall.enabled", "true"},
   E.KV{"graphHandlerTemperature.enabled", "true"},
   E.KV{"graphHandlerWindSpeed.enabled", "true"},
   E.KV{"humidity.enabled", "true"},
   E.KV{"modalHandler.enabled", "true"},
   E.KV{"moonSun.enabled", "true"},
   E.KV{"recordHandler.enabled", "true"},
   E.KV{"solar.enabled", "true"}, E.KV{"solar.mode", "percentage"},
   E.KV{"status.enabled", "true"},
   E.KV{"rainfallTitle.enabled", "true"},
   E.KV{"rainfallDay.enabled", "true"},
   E.KV{"rainfallMonth.enabled", "true"},
   E.KV{"rainfallYear.enabled", "true"},
   E.KV{"UV.enabled", "true"},
   E.KV{"windDirection.enabled", "true"},
   E.KV{"windSpeed.enabled", "true"}, E.KV{"windSpeed.gustMode", "current"},
   E.KV{"buttons.enabled", "true"},
   E.KV{"graph.barometer.enabled", "true"}, E.KV{"graph.humidity.enabled", "true"},
   E.KV{"graph.solar.enabled", "true"}, E.KV{"graph.temp.enabled", "true"},
   E.KV{"graph.uv.enabled", "true"}, E.KV{"graph.windDir.enabled", "true"},
   E.KV{"graph.windSpeed.enabled", "true"}, E.KV{"graph.rainfall.enabled", "true"},
   E.KV{"general.tooltipsEnabled", "true"}]

def has_key(+key: String, +kvs: List<&2, E.KV>) -> Bool:
  match kvs:
    case Nil{}:
      False{}
    case Con{+kv, rest}:
      String.eq(E.kv_key(kv), key) || has_key(key, rest)

def widget_of(+key: String) -> String:
  Maybe.default(&2, String, List.head(&2, String, String.split(key, '.')), "")

# Globals.js copies a gaugeSettings key onto widgetList only when the widget
# is in widgetList (any key under it); graphSettings and generalSettings
# likewise for graphList and generalList. The host hands config.js's
# settings over as E.KV{"gauge.windChill.mode", "windchill"} and so on.
def accept(+kv: E.KV, +known: List<&2, E.KV>) -> Bool:
  +key = E.kv_key(kv)
  +w = widget_of(String.drop(key, 6n))
  +g = widget_of(String.drop(key, 6n))
  +n = widget_of(String.drop(key, 8n))
  (String.starts_with(key, "gauge.") && has_key(w ++ ".enabled", known))
    || (String.starts_with(key, "graph.") && has_key("graph." ++ g ++ ".enabled", known))
    || (String.starts_with(key, "general.") && has_key("general." ++ n, known))

def rename(+kv: E.KV) -> E.KV:
  +key = E.kv_key(kv)
  E.KV{Bool.pick(String, String.starts_with(key, "gauge."), String.drop(key, 6n), key),
    E.kv_val(kv)}

# The settings that apply, newest first so they shadow the defaults.
def merge(+sets: List<&2, E.KV>, +known: List<&2, E.KV>,
  +acc: List<&2, E.KV>) -> List<&2, E.KV>:
  match sets:
    case Nil{}:
      acc
    case Con{+kv, rest}:
      merge(rest, known, Bool.pick(List<&2, E.KV>, accept(kv, known),
        rename(kv) <> acc, acc))

def setting(+key: String, +dflt: String, +kvs: List<&2, E.KV>) -> String:
  E.find(key, dflt, kvs)

# Booting
# -------

def base.strip(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      Bool.pick(String, Char.is_eq(c, '/'), SCon{c, t}, base.strip(t))

def base.cut(+slash: Bool, +href: String) -> String:
  match slash:
    case True{}:
      String.reverse(base.strip(String.reverse(href)))
    case False{}:
      href

# The page's address up to its last "/", or config.js's customBaseURL.
def base_url(+href: String, +custom: String) -> String:
  Bool.pick(String, String.eq(custom, "false") || String.eq(custom, ""),
    base.cut(String.contains(href, "/"), href), custom)

def fetch_all(+n: Net) -> List<&2, C.Cmd>:
  match n:
    case Net{+names, +base, _, _, _, _, _}:
      [C.CFetch{"0", base ++ nth(names, 0n)}, C.CFetch{"1", base ++ nth(names, 1n)},
       C.CFetch{"2", base ++ nth(names, 2n)}, C.CFetch{"3", base ++ nth(names, 3n)}]

# initializeButtons: the labels, or hiding the button row when disabled.
def buttons(+e: E.Env) -> List<&2, C.Cmd>:
  Bool.pick(List<&2, C.Cmd>, E.on(e, "buttons.enabled"),
    [C.CHtml{"AltitudeButton", E.word(e, D.WButtonLabelAltitude{})},
      C.CHtml{"PressureButton", E.word(e, D.WGraphBaroLabel{})},
      C.CHtml{"WindButton", E.word(e, D.WWindSpeedWind{})},
      C.CHtml{"RainfallButton", E.word(e, D.WRainfallTitle{})},
      C.CHtml{"TempButton", E.word(e, D.WTemperatureTitle{})},
      C.CHtml{"RecordsButton", E.word(e, D.WButtonLabelRecords{})}],
    [C.CStyle{"bottom", "display", "none"}])

def init_cmds(+w: W.Widgets, +e: E.Env) -> List<&2, C.Cmd>:
  cat([C.CHtml{"Version", "FreshWDL - Version: 1.1.8.15 Alpha."}],
    cat(W.start(w, e), buttons(e)))

# currentUnits from config.js, over the defaults.
def start_units(+kvs: List<&2, E.KV>) -> U.Units:
  +d = U.defaults()
  U.Units{setting("pressure", U.current(d, U.Pressure{}), kvs),
    setting("altitude", U.current(d, U.Altitude{}), kvs),
    setting("wind", U.current(d, U.Wind{}), kvs),
    setting("rainfall", U.current(d, U.Rainfall{}), kvs),
    setting("windDirection", U.current(d, U.WindDirection{}), kvs),
    setting("humidity", U.current(d, U.Humidity{}), kvs),
    setting("solar", U.current(d, U.Solar{}), kvs),
    setting("uv", U.current(d, U.UV{}), kvs),
    setting("temp", U.current(d, U.Temp{}), kvs)}

def f_st(+o: F.FOut) -> F.St:
  match o:
    case F.FOut{+st, _}:
      st

def f_cmds(+o: F.FOut) -> List<&2, C.Cmd>:
  match o:
    case F.FOut{_, +cmds}:
      cmds

def r_st(+o: R.ROut) -> R.St:
  match o:
    case R.ROut{+st, _}:
      st

def r_cmds(+o: R.ROut) -> List<&2, C.Cmd>:
  match o:
    case R.ROut{_, +cmds}:
      cmds

def g_st(+o: G.Out) -> G.St:
  match o:
    case G.Out{+st, _, _}:
      st

def g_cmds(+o: G.Out) -> List<&2, C.Cmd>:
  match o:
    case G.Out{_, +cmds, _}:
      cmds

# boot: Globals.js, Loading.js and initAll. settings: config.js's gaugeSettings,
# graphSettings and generalSettings as "gauge.solar.enabled=true" lines;
# names: its four file names, a line each; href: the page's address;
# custom: String(customBaseURL); code: lang; units: currentUnits as lines;
# now: the host's clock in milliseconds.
def boot(+settings: String, +names: String, +href: String, +custom: String,
  +code: String, +units: String, +now: U32) -> Out:
  +known = defaults()
  +cfg = merge(E.kv_lines(settings), known, known)
  +env = {E.Env{[], [], [], [], start_units(E.kv_lines(units)), D.lang(code), cfg, E.no_clock()} : E.Env}
  +net = {Net{String.split(names, Char.from_u32(10)), base_url(href, custom), flags(False{}), flags(True{}), flags(False{}),
    [[], [], [], []], True{}} : Net}
  +w0 = W.init(env, now)
  +small = G.start_small(W.graphs_of(w0), env)
  +modal = G.start_modal(g_st(small), env)
  +w = W.with_graphs(w0, g_st(modal))
  +app = {Fwdl{env, net, Loading{"Collecting Data.", 1, 1.0, False{}}, w} : Fwdl}
  Out{app, cat(fetch_all(net), cat([C.CEvery{"poll", 5000}, C.CEvery{"dots", 500}],
    cat(init_cmds(w, env), cat(F.start(env), cat(g_cmds(small), cat(R.start(env),
      cat(G.start_lists(env), g_cmds(modal))))))))}

# Chart.defaults.global and the chart-area background plugin, for the host to
# set before any chart is made.
def chart_defaults() -> Ch.Defaults:
  G.chart_defaults()

# Whether the graph code ran to the end, where the original would not have
# thrown.
def g_ok(+o: G.Out) -> Bool:
  match o:
    case G.Out{_, _, +ok}:
      ok

# The canvases that resize, in the order their resize listeners run.
def canvases(+app: Fwdl) -> List<&2, String>:
  match app:
    case Fwdl{+env, _, _, +w}:
      +g = W.graphs_of(w)
      W.canvases(env, List.append(&2, String, ["forecastText"], G.small_canvases(g)),
        ["modalRecordsDiv"], G.modal_canvases(g))

# Layout
# ------

# resizeContainer: 16:9, 1.7 times the smaller fitting dimension.
def viewport(+app: Fwdl, +vw: F32, +vh: F32) -> Out:
  +ratio = {0.5625 : F32}
  +wide = ((vh / ratio : F32) <= vw : F32)
  +w = Bool.pick(F32, wide, (vh * 1.7 : F32), (vw * ratio * 1.7 : F32))
  +h = Bool.pick(F32, wide, (vh * 1.7 * ratio : F32), (vw * ratio * 1.7 * ratio : F32))
  Out{app, [C.CAttr{"FWDLcontainer", "style", "width:" ++ Num.show(w) ++ "px;height:" ++ Num.show(h) ++ "px"}]}

# Frames
# ------

# A canvas's resize: the widget sizes itself off its surroundings.
def measure(+app: Fwdl, +id: String, +b: E.Box) -> Out:
  match app:
    case Fwdl{+env, net, loading, w}:
      +w1 = W.resize(w, id, b)
      +g = G.resize(W.graphs_of(w1), env, id, b)
      +w2 = W.with_graphs(w1, g_st(g))
      +fc = Bool.pick(List<&2, C.Cmd>, String.eq(id, "forecastText"), F.resize(W.forecast_of(w2), env, b), [])
      +ro = Bool.pick(R.ROut, String.eq(id, "modalRecordsDiv"), R.resize(W.records_of(w2), env, E.box_vw(b), E.box_vh(b)),
        R.ROut{W.records_of(w2), []})
      +w3 = W.with_records(w2, r_st(ro))
      Out{Fwdl{env, net, loading, w3}, cat(W.size(w3, id), cat(g_cmds(g), cat(fc, r_cmds(ro))))}

# The Ticker's frameUpdate: every stage draws.
def frame(+app: Fwdl, +now: U32) -> Out:
  match app:
    case Fwdl{+env, _, _, +w}:
      Out{app, W.frame(w, env, now)}

# Data
# ----

def with_fields(+e: E.Env, +i: Nat, +xs: List<&2, String>) -> E.Env:
  match e:
    case E.Env{cr, cre, crh, crd, u, l, cfg, c}:
      match i:
        case 0n:
          E.Env{xs, cre, crh, crd, u, l, cfg, c}
        case 1n:
          E.Env{cr, xs, crh, crd, u, l, cfg, c}
        case 2n:
          E.Env{cr, cre, xs, crd, u, l, cfg, c}
        case _:
          E.Env{cr, cre, crh, xs, u, l, cfg, c}

def env_fields(+e: E.Env, +i: Nat) -> List<&2, String>:
  match e:
    case E.Env{+cr, +cre, +crh, +crd, _, _, _, _}:
      fields([cr, cre, crh, crd], i)

def with_clock(+e: E.Env, +c: E.Clock) -> E.Env:
  match e:
    case E.Env{cr, cre, crh, crd, u, l, cfg, _}:
      E.Env{cr, cre, crh, crd, u, l, cfg, c}

def file_index(+file: String) -> Nat:
  Bool.pick(Nat, String.eq(file, "0"), 0n, Bool.pick(Nat, String.eq(file, "1"), 1n,
    Bool.pick(Nat, String.eq(file, "2"), 2n, 3n)))

def start_fade(+lo: Loading) -> Loading:
  lo

# clientRawDataUpdate and clientRawExtraDataUpdate: the widgets listening.
# Timers
# ------

# The rest of the pass: the widgets whose files changed redraw, the old
# fields are kept for next time, and the first pass ends the loading screen.
def update.events(+app: Fwdl, +changed: List<&2, Bool>, +now: U32) -> Out:
  match app:
    case Fwdl{+env, +net, +loading, +w}:
      match net:
        case Net{+names, +base, +done, +tried, +failed, _, +first}:
          +old2 = {[env_fields(env, 0n), env_fields(env, 1n), env_fields(env, 2n), env_fields(env, 3n)] : List<&2, List<&2, String>>}
          +w1 = W.data(w, env, flag(changed, 0n), flag(changed, 1n), now)
          +g = Bool.pick(G.Out, any(changed), G.data(W.graphs_of(w1), env),
            G.Out{W.graphs_of(w1), [], True{}})
          +cre = flag(changed, 1n)
          +fo = Bool.pick(F.FOut, cre, F.data(W.forecast_of(w1), env), F.FOut{W.forecast_of(w1), []})
          +ro = Bool.pick(R.ROut, cre, R.data(W.records_of(w1), env), R.ROut{W.records_of(w1), []})
          +w2 = W.with_graphs(W.with_records(W.with_forecast(w1, f_st(fo)), r_st(ro)), g_st(g))
          +fin = first && g_ok(g)
          +lo = Bool.pick(Loading, fin, start_fade(loading), loading)
          Out{Fwdl{env, Net{names, base, done, tried, failed, old2, Bool.pick(Bool, g_ok(g), False{}, first)}, lo, w2},
            cat(W.retip(w2, env), cat(f_cmds(fo), cat(r_cmds(ro), cat(g_cmds(g),
              Bool.pick(List<&2, C.Cmd>, fin, [C.CEvery{"fade", 50}], [])))))}

def update.ok(+abort: Bool, +app: Fwdl, +changed: List<&2, Bool>, +now: U32) -> Out:
  match abort:
    case True{}:
      Out{app, []}
    case False{}:
      update.events(app, changed, now)

# tryUpdateWidgets once it is ready: the flags reset, then the status widget
# draws whether or not anything changed. drawStatusS01 throws when clientraw
# lacks its fields, or when the status widget is disabled (its texts were
# never made), and the throw ends the pass there.
def update.run(+app: Fwdl, +now: U32) -> Out:
  match app:
    case Fwdl{+env, +net, +loading, +w}:
      match net:
        case Net{+names, +base, +done, +tried, +failed, +old, +first}:
          +changed = {[Bool.not(Raw.same(env_fields(env, 0n), fields(old, 0n))),
            Bool.not(Raw.same(env_fields(env, 1n), fields(old, 1n))),
            Bool.not(Raw.same(env_fields(env, 2n), fields(old, 2n))),
            Bool.not(Raw.same(env_fields(env, 3n), fields(old, 3n)))] : List<&2, Bool>}
          +no_change = Bool.not(any(changed))
          +on = E.on(env, "status.enabled")
          +w1 = Bool.pick(W.Widgets, on, W.status(w, env, failed, no_change, now), w)
          update.ok(Bool.not(on) || Status.aborts(env, failed, no_change),
            Fwdl{env, Net{names, base, flags(False{}), flags(False{}), failed, old, first}, loading, w1},
            changed, now)

def update.go(+ready: Bool, +app: Fwdl, +now: U32) -> Out:
  match ready:
    case False{}:
      Out{app, []}
    case True{}:
      update.run(app, now)

# tryUpdateWidgets: once every file is in (or, after the first time, every
# fetch has at least answered), the widgets whose files changed redraw.
def try_update(+app: Fwdl, +now: U32) -> Out:
  match app:
    case Fwdl{+env, +net, +loading, +w}:
      match net:
        case Net{+names, +base, +done, +tried, +failed, +old, +first}:
          +ready = all(done) || (all(tried) && Bool.not(first))
          update.go(ready, app, now)

# updateClientraw's onreadystatechange: on a 200 the file's fields replace
# the old ones; either way tryUpdateWidgets runs.
def fetched(+app: Fwdl, +file: String, +ok: Bool, +text: String, +now: U32, +c: E.Clock) -> Out:
  match app:
    case Fwdl{env, net, loading, w}:
      match net:
        case Net{names, base, done, tried, failed, old, first}:
          +i = file_index(file)
          +env2 = with_clock(Bool.pick(E.Env, ok, with_fields(env, i, Raw.split(text)), env), c)
          try_update(Fwdl{env2, Net{names, base, Bool.pick(List<&2, Bool>, ok, set_flag(done, i, True{}), done),
            tried, set_flag(failed, i, Bool.not(ok)), old, first}, loading, w}, now)

def failed_of(+n: Net) -> List<&2, Bool>:
  match n:
    case Net{_, _, _, _, +failed, _, _}:
      failed

def message_of(+lo: Loading) -> String:
  match lo:
    case Loading{+m, _, _, _}:
      m

# The interval's four update*() calls: each marks its file attempted.
def timer.poll(+app: Fwdl) -> Out:
  match app:
    case Fwdl{env, +net, loading, w}:
      match net:
        case Net{names, base, done, tried, failed, old, first}:
          Out{Fwdl{env, Net{names, base, done, flags(True{}), failed, old, first}, loading, w},
            fetch_all(net)}

def before_dot(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, t}:
      Bool.pick(String, Char.is_eq(c, '.'), "", SCon{c, before_dot(t)})

# innerHTML.substring(0, innerHTML.indexOf(".")): all of it before the first
# dot, or nothing when there is none (substring(0, -1)).
def stem(+s: String) -> String:
  Bool.pick(String, String.contains(s, "."), before_dot(s), "")

# addDots: the message before its first ".", then one to three dots.
def add_dots(+lo: Loading, +failed: Bool) -> Loading:
  match lo:
    case Loading{+message, +count, op, gone}:
      +st = Bool.pick(String, failed, "Data Currently Unavailable", stem(message))
      +c = Bool.pick(U32, ((count + 1 : U32) > 3 : U32), 1, (count + 1 : U32))
      +s = st ++ "..."
      Loading{String.take(s, Nat.sub(Nat.add(String.length(s), U32.to_nat(c)), 3n)), c, op, gone}

def timer.dots(+app: Fwdl) -> Out:
  match app:
    case Fwdl{env, +net, loading, w}:
      +lo = add_dots(loading, any(failed_of(net)))
      Out{Fwdl{env, net, lo, w}, [C.CHtml{"loadingMessage", message_of(lo)}]}

# fade: every 50ms, op loses a tenth of itself; at 0.1 or below the screen
# goes and the dots stop.
def fade_step(+lo: Loading) -> Loading:
  match lo:
    case Loading{message, count, +op, gone}:
      Loading{message, count, (op - op * 0.1 : F32), gone || (op <= 0.1 : F32)}

def fade_cmds(+lo: Loading) -> List<&2, C.Cmd>:
  match lo:
    case Loading{_, _, +op, _}:
      +shown = {[C.CStyle{"loadingScreen", "opacity", Num.show(op)},
        C.CStyle{"loadingScreen", "filter", "alpha(opacity=" ++ Num.show((op * 100.0 : F32)) ++ ")"}] : List<&2, C.Cmd>}
      Bool.pick(List<&2, C.Cmd>, (op <= 0.1 : F32),
        cat([C.CStop{"fade"}, C.CStyle{"loadingScreen", "display", "none"}, C.CStop{"dots"}], shown),
        shown)

# fade's interval: shows the opacity it has, then loses a tenth of it; once
# it is 0.1 or less the screen goes and both intervals stop.
def timer.fade(+app: Fwdl) -> Out:
  match app:
    case Fwdl{env, net, +loading, w}:
      Out{Fwdl{env, net, fade_step(loading), w}, fade_cmds(loading)}

def timer.screen(+dots: Bool, +app: Fwdl) -> Out:
  match dots:
    case True{}:
      timer.dots(app)
    case False{}:
      timer.fade(app)

def timer.go(+poll: Bool, +dots: Bool, +app: Fwdl) -> Out:
  match poll:
    case True{}:
      timer.poll(app)
    case False{}:
      timer.screen(dots, app)

def timer(+app: Fwdl, +key: String, +now: U32, +c: E.Clock) -> Out:
  match app:
    case Fwdl{env, net, loading, w}:
      timer.go(String.eq(key, "poll"), String.eq(key, "dots"),
        Fwdl{with_clock(env, c), net, loading, w})

# Loading screen
# --------------

# The page
# --------

# What UpperContent.js and InnerContent.js (or InnerContent-02.js, for the
# page whose host script says data-layout="02") wrote, for the host to
# insert at the top of the body.
def markup(+layout: String) -> String:
  M.upper() ++ Bool.pick(String, String.eq(layout, "02"), M.inner_02(), M.inner())

# Clicks and select menus
# -----------------------

# The unit buttons, by element id: the kind each one cycles.
def button_kind(+id: String) -> String:
  Bool.pick(String, String.eq(id, "PressureButton"), "Pressure",
    Bool.pick(String, String.eq(id, "WindButton"), "Wind",
      Bool.pick(String, String.eq(id, "RainfallButton"), "Rainfall",
        Bool.pick(String, String.eq(id, "TempButton"), "Temp",
          Bool.pick(String, String.eq(id, "AltitudeButton"), "Altitude", "")))))

def measure_of(+k: String) -> U.Measure:
  Bool.pick(U.Measure, String.eq(k, "Pressure"), U.Pressure{},
    Bool.pick(U.Measure, String.eq(k, "Wind"), U.Wind{},
      Bool.pick(U.Measure, String.eq(k, "Rainfall"), U.Rainfall{},
        Bool.pick(U.Measure, String.eq(k, "Temp"), U.Temp{}, U.Altitude{}))))

def with_units(+e: E.Env, +u: U.Units) -> E.Env:
  match e:
    case E.Env{cr, cre, crh, crd, _, l, cfg, c}:
      E.Env{cr, cre, crh, crd, u, l, cfg, c}

# changeUnit(kind): the next unit of that kind, then updateUnits(kind): the
# widgets showing it redraw with unitChange true.
def change_unit(+app: Fwdl, +k: String, +now: U32) -> Out:
  match app:
    case Fwdl{+env, +net, +loading, +w}:
      +env2 = with_units(env, U.cycle(E.units(env), measure_of(k)))
      +w1 = W.units(w, env2, k, now)
      +g = G.units(W.graphs_of(w1), env2, measure_of(k))
      +w2 = W.with_graphs(w1, g_st(g))
      +rec = Bool.pick(List<&2, C.Cmd>, g_ok(g), R.units(W.records_of(w2), env2), [])
      Out{Fwdl{env2, net, loading, w2}, cat(W.retip(w2, env2), cat(g_cmds(g), rec))}

def click.unit(+hit: Bool, +app: Fwdl, +k: String, +now: U32) -> Out:
  match hit:
    case True{}:
      change_unit(app, k, now)
    case False{}:
      Out{app, []}

# The graph canvases, the Graphs button and the graph modal's close button
# and background, after whatever the click did first.
def click.graphs(+o: Out, +id: String) -> Out:
  match o:
    case Out{+app, +cmds}:
      match app:
        case Fwdl{+env, +net, +loading, +w}:
          +g = G.click(W.graphs_of(w), env, id)
          Out{Fwdl{env, net, loading, W.with_graphs(w, g_st(g))}, cat(cmds, g_cmds(g))}

# The forecast's show-more link and close button, the Records button and
# the records close button.
def click.modals(+o: Out, +id: String, +vw: F32, +vh: F32) -> Out:
  match o:
    case Out{+app, +cmds}:
      match app:
        case Fwdl{+env, +net, +loading, +w}:
          +ro = R.click(W.records_of(w), env, id, vw, vh)
          Out{Fwdl{env, net, loading, W.with_records(w, r_st(ro))},
            cat(cmds, cat(F.click(env, id), r_cmds(ro)))}

# A click anywhere on the page; id is the clicked element's, "" if none.
# The unit buttons listen only when the buttons are enabled.
# vw, vh: document.documentElement's client size, for the records modal.
def click(+app: Fwdl, +id: String, +now: U32, +vw: F32, +vh: F32) -> Out:
  match app:
    case Fwdl{+env, _, _, _}:
      +k = button_kind(id)
      click.modals(click.graphs(click.unit(E.on(env, "buttons.enabled") && Bool.not(String.is_empty(k)), app, k, now), id), id, vw, vh)

# A select menu changed.
def select(+app: Fwdl, +id: String, +value: String) -> Out:
  match app:
    case Fwdl{+env, +net, +loading, +w}:
      +g = G.select(W.graphs_of(w), env, id, value)
      +ro = R.select(W.records_of(w), env, id, value)
      Out{Fwdl{env, net, loading, W.with_records(W.with_graphs(w, g_st(g)), r_st(ro))},
        cat(g_cmds(g), r_cmds(ro))}
