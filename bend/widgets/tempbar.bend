# Temperature bars: a thermometer with a scale of dashes and numbers, a
# yellow fill tweened to the reading, and (optionally) red/blue high/low
# markers with their labels. One module, four widgets of the original:
#   V01  TEMPERATURE BAR 01, canvas TempBar01, widgetList.temperature
#        (clientraw 4/46/47, plus the trend arrow from clientraw 143)
#   V02  TEMPERATURE BAR 02, canvas TempBar02, widgetList.temperature02
#   V03  TEMPERATURE BAR 03, canvas TempBar03, widgetList.temperature03
#        (02 and 03 read an extra sensor through getExtraInput)
#   VWC  WINDCHILL / HEAT INDEX BAR, canvas Windchill01, widgetList.windChill
# 02, 03 and the windchill bar are the same code as 01 without the trend
# arrow; the windchill bar always shows its high/low markers, titles itself
# by widgetList.windChill.mode, and auto-switches that mode.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/tween.bend as T

type Var is Data:
  V01{}
  V02{}
  V03{}
  VWC{}

# A draw call's arguments, as clientraw strings ("-1" for getExtraInput's
# number -1, "undefined" past the end of a file). tr: the trend (V01 only).
type Inp is Data:
  Inp{t: String, hi: String, lo: String, tr: String}

# valuesOld. fresh: nothing drawn yet (TempIn is still undefined, the
# others the number 0).
type Old is Data:
  Old{fresh: Bool, t: String, hi: String, lo: String, tr: String}

# values (after formatDataToUnit), values.trend and constants.min/maxTemp.
type Vals is Data:
  Vals{t: F32, hi: F32, lo: F32, trend: F32, mn: F32, mx: F32}

# tweens.barFill.h, highTemp.h, lowTemp.h
type Tw is Data:
  Tw{fill: T.Tween, hi: T.Tween, lo: T.Tween}

# The trend arrow's stroke colours (middle line, pointer), as updateTop
# last left them.
type Arr is Data:
  Arr{mid: String, ptr: String}

# Windchill bar: mode = widgetList.windChill.mode (the original mutates the
# global; here it lives in the state), dmode = windchill01.defaultMode,
# tmode = the mode the title and tooltip were last set from.
type Md is Data:
  Md{mode: String, dmode: String, tmode: String}

type HL is Data:
  HL{hy: F32, ly: F32}

type St is Data:
  St{v: Var, w: F32, h: F32, old: Old, vals: Vals, tw: Tw, arr: Arr, md: Md}

def c_temp() -> String:
  S.rgb("209, 32, 32")

def c_low() -> String:
  S.rgb("0, 50, 200")

def c_fill() -> String:
  "rgb(255, 221, 37)"

def is01(+v: Var) -> Bool:
  match v:
    case V01{}:
      True{}
    case V02{}:
      False{}
    case V03{}:
      False{}
    case VWC{}:
      False{}

def is_wc(+v: Var) -> Bool:
  match v:
    case V01{}:
      False{}
    case V02{}:
      False{}
    case V03{}:
      False{}
    case VWC{}:
      True{}

# The trend arrow part of updateTop: trend 0 turns the pointer yellow, a
# rising trend paints both lines red, a falling one blue; NaN leaves them.
def arrow(+a: Arr, +trend: F32) -> Arr:
  match a:
    case Arr{+mid, +ptr}:
      +p1 = Bool.pick(String, F32.is_eq(trend, 0.0), c_fill(), ptr)
      Bool.pick(Arr, (trend > 0.0 : F32), Arr{c_temp(), c_temp()},
        Bool.pick(Arr, (trend < 0.0 : F32), Arr{c_low(), c_low()}, Arr{mid, p1}))

def init(+v: Var, +e: E.Env) -> St:
  +m = E.opt(e, "windChill.mode", "windchill")
  St{v, 300.0, 150.0, Old{True{}, "undefined", "0", "0", "0"},
    Vals{0.0, 0.0, 0.0, 0.0, F32.neg(10.0), 30.0},
    Tw{T.still(0.0), T.still(1.04), T.still(1.04)},
    arrow(Arr{c_temp(), c_temp()}, 0.0), Md{m, m, m}}

# widgetList.windChill.mode, for anything else that reads it.
def mode(+st: St) -> String:
  match st:
    case St{_, _, _, _, _, _, _, +md}:
      match md:
        case Md{+m, _, _}:
          m

def tip.go(+wc: Bool, +e: E.Env, +tmode: String) -> String:
  match wc:
    case False{}:
      E.word(e, D.WTemperatureDescription{})
    case True{}:
      Bool.pick(String, String.eq(tmode, "windchill"),
        E.word(e, D.WWindchillDescription{}), E.word(e, D.WHeatIndexDescription{}))

# The Opentip text. The windchill bar's follows its mode (setContent on
# every draw), so this takes the state.
def tip(+st: St, +e: E.Env) -> String:
  match st:
    case St{+v, _, _, _, _, _, _, +md}:
      match md:
        case Md{_, _, +tm}:
          tip.go(is_wc(v), e, tm)

# arrayClientraw[x] / arrayClientrawExtra[x] for a computed index: a
# negative or fractional index reads as undefined.
def ok_index(+x: F32) -> Bool:
  (x >= 0.0 : F32) && F32.is_eq(F32.floor(x), x)

def cr_at(+e: E.Env, +x: F32) -> String:
  Bool.pick(String, ok_index(x), E.cr(e, Num.nat_of(x)), "undefined")

def cre_at(+e: E.Env, +x: F32) -> String:
  Bool.pick(String, ok_index(x), E.cre(e, Num.nat_of(x)), "undefined")

def extra.go(+indoor: Bool, +e: E.Env, +n: F32) -> Inp:
  match indoor:
    case True{}:
      Inp{E.cr(e, 12n), E.cr(e, 128n), E.cr(e, 129n), "0"}
    case False{}:
      +hi = cre_at(e, (2.0 * n + 592.0 : F32))
      +lo = cre_at(e, (2.0 * n + 593.0 : F32))
      Bool.pick(Inp, (n <= 6.0 : F32) && (n > 0.0 : F32),
        Inp{cr_at(e, (n + 19.0 : F32)), hi, lo, "0"},
        Bool.pick(Inp, (n <= 8.0 : F32),
          Inp{cr_at(e, (n + 113.0 : F32)), hi, lo, "0"},
          Inp{"-1", "-1", "-1", "0"}))

# getExtraInput(inputVal). inputVal is taken as a number (Globals.js and
# config.js give numbers); "indoor" picks the indoor sensor.
def extra(+e: E.Env, +inp: String) -> Inp:
  extra.go(String.eq(inp, "indoor"), e, Num.parse(inp))

def ne(+a: String, +b: String) -> Bool:
  Bool.not(String.eq(a, b))

# windChillSwitchWC01(realTemp, realMin, realMax, chillMin, chillMax,
# heatMin, heatMax) with clientraw 4, 47, 46, 78, 77, 111, 110. realTemp is
# a string against a number (numeric); the rest compare as strings.
def switch(+e: E.Env, +dmode: String) -> String:
  +rt = Num.parse(E.cr(e, 4n))
  +rmin = E.cr(e, 47n)
  +rmax = E.cr(e, 46n)
  +dc = ne(rmin, E.cr(e, 78n)) || ne(rmax, E.cr(e, 77n))
  +dh = ne(rmin, E.cr(e, 111n)) || ne(rmax, E.cr(e, 110n))
  Bool.pick(String, (rt <= 10.0 : F32), "windchill",
    Bool.pick(String, (rt >= 18.0 : F32), "heatIndex",
      Bool.pick(String, dc && dh, dmode,
        Bool.pick(String, dc, "windchill",
          Bool.pick(String, dh, "heatIndex", dmode)))))

def switched.go(+go: Bool, +e: E.Env, +md: Md) -> Md:
  match go:
    case False{}:
      md
    case True{}:
      match md:
        case Md{_, +dm, +tm}:
          Md{switch(e, dm), dm, tm}

# The clientRawDataUpdate handler switches the mode first when
# widgetList.windChill.autoSwitch; updateUnits (force) does not.
def switched(+v: Var, +e: E.Env, +force: Bool, +md: Md) -> Md:
  switched.go(is_wc(v) && Bool.not(force) && E.on(e, "windChill.autoSwitch"), e, md)

def wc_inp(+e: E.Env, +chill: Bool) -> Inp:
  match chill:
    case True{}:
      Inp{E.cr(e, 44n), E.cr(e, 77n), E.cr(e, 78n), "0"}
    case False{}:
      Inp{E.cr(e, 112n), E.cr(e, 110n), E.cr(e, 111n), "0"}

# The draw call's arguments.
def inputs(+v: Var, +e: E.Env, +md: Md) -> Inp:
  match v:
    case V01{}:
      Inp{E.cr(e, 4n), E.cr(e, 46n), E.cr(e, 47n), E.cr(e, 143n)}
    case V02{}:
      extra(e, E.opt(e, "temperature02.input", "1"))
    case V03{}:
      extra(e, E.opt(e, "temperature03.input", "2"))
    case VWC{}:
      match md:
        case Md{+m, _, _}:
          wc_inp(e, String.eq(m, "windchill"))

# valuesOld.TempIn != tempIn: undefined at first, so only an undefined
# input compares equal; then two strings.
def changed_t(+fresh: Bool, +t: String, +old: String) -> Bool:
  Bool.pick(Bool, fresh, ne(t, "undefined"), ne(t, old))

# The draw's guard. V01 (drawTemperatureBarTemp01) compares
# valuesOld.trend against lowTempIn, and its `trend === true` never holds
# (updateUnits passes true as a fifth argument it ignores), so force does
# nothing there. The others redraw on unitChange === true.
def should(+v: Var, +old: Old, +inp: Inp, +force: Bool) -> Bool:
  match old inp:
    case Old{+fresh, +ot, +oh, +ol, +otr} Inp{+t, +hi, +lo, _}:
      changed_t(fresh, t, ot) || E.changed(fresh, hi, oh) || E.changed(fresh, lo, ol)
        || Bool.pick(Bool, is01(v), E.changed(fresh, lo, otr), force)

# The four range-adjusting while loops of formatInput, largeDashTotal - 1
# = 4 at a time. fuel bounds them; a NaN reading stops them at once, as in
# JavaScript.
def below(+t: F32, +hi: F32, +lo: F32, +mn: F32) -> Bool:
  (t < mn : F32) || (hi < mn : F32) || (lo < mn : F32)

def above(+t: F32, +hi: F32, +lo: F32, +mx: F32) -> Bool:
  (t > mx : F32) || (hi > mx : F32) || (lo > mx : F32)

def raise_ok(+t: F32, +hi: F32, +lo: F32, +mn: F32) -> Bool:
  +m4 = (mn + 4.0 : F32)
  +under = (mn < F32.neg(10.0) : F32)
  ((t >= m4 : F32) && under) && ((hi >= m4 : F32) && under) && ((lo >= m4 : F32) && under)

def lower_ok(+t: F32, +hi: F32, +lo: F32, +mx: F32) -> Bool:
  +m4 = (mx - 4.0 : F32)
  +over = (mx > 30.0 : F32)
  ((t <= m4 : F32) && over) && ((hi <= m4 : F32) && over) && ((lo <= m4 : F32) && over)

def min_down(+fuel: Nat, +go: Bool, +t: F32, +hi: F32, +lo: F32, +mn: F32) -> F32:
  match fuel:
    case 0n:
      mn
    case 1n+f:
      match go:
        case False{}:
          mn
        case True{}:
          +m = (mn - 4.0 : F32)
          min_down(f, below(t, hi, lo, m), t, hi, lo, m)

def max_up(+fuel: Nat, +go: Bool, +t: F32, +hi: F32, +lo: F32, +mx: F32) -> F32:
  match fuel:
    case 0n:
      mx
    case 1n+f:
      match go:
        case False{}:
          mx
        case True{}:
          +m = (mx + 4.0 : F32)
          max_up(f, above(t, hi, lo, m), t, hi, lo, m)

def min_up(+fuel: Nat, +go: Bool, +t: F32, +hi: F32, +lo: F32, +mn: F32) -> F32:
  match fuel:
    case 0n:
      mn
    case 1n+f:
      match go:
        case False{}:
          mn
        case True{}:
          +m = (mn + 4.0 : F32)
          min_up(f, raise_ok(t, hi, lo, m), t, hi, lo, m)

def max_down(+fuel: Nat, +go: Bool, +t: F32, +hi: F32, +lo: F32, +mx: F32) -> F32:
  match fuel:
    case 0n:
      mx
    case 1n+f:
      match go:
        case False{}:
          mx
        case True{}:
          +m = (mx - 4.0 : F32)
          max_down(f, lower_ok(t, hi, lo, m), t, hi, lo, m)

def fuel() -> Nat:
  5000n

# formatInputTemp01 (and its copies): the new values and range.
def fmt(+mn: F32, +mx: F32, +t: F32, +hi: F32, +lo: F32, +trend: F32) -> Vals:
  +m1 = min_down(fuel(), below(t, hi, lo, mn), t, hi, lo, mn)
  +x1 = max_up(fuel(), above(t, hi, lo, mx), t, hi, lo, mx)
  +m2 = min_up(fuel(), raise_ok(t, hi, lo, m1), t, hi, lo, m1)
  +x2 = max_down(fuel(), lower_ok(t, hi, lo, x1), t, hi, lo, x1)
  Vals{t, hi, lo, trend, m2, x2}

# The three tweens, retargeted to the mapped values.
def retween(+tw: Tw, +vals: Vals, +now: U32) -> Tw:
  match tw vals:
    case Tw{+f, +h, +l} Vals{+t, +hi, +lo, _, +mn, +mx}:
      Tw{T.to(f, Num.map(t, mn, mx, 0.1, 0.98), 2000.0, now),
        T.to(h, Num.map(hi, mn, mx, 1.04, 0.17), 2000.0, now),
        T.to(l, Num.map(lo, mn, mx, 1.04, 0.17), 2000.0, now)}

def vals_range(+vals: Vals, +u: U.Units, +t: F32, +hi: F32, +lo: F32, +trend: F32) -> Vals:
  match vals:
    case Vals{_, _, _, _, +mn, +mx}:
      fmt(mn, mx, U.value(u, U.Temp{}, t), U.value(u, U.Temp{}, hi),
        U.value(u, U.Temp{}, lo), trend)

def tmode_set(+md: Md) -> Md:
  match md:
    case Md{+m, +dm, _}:
      Md{m, dm, m}

def old_trend_changed(+old: Old, +tr: String) -> Bool:
  match old:
    case Old{+fresh, _, _, _, +otr}:
      E.changed(fresh, tr, otr)

# The body of the draw call, once its guard has passed.
def data.go(+go: Bool, +st: St, +e: E.Env, +inp: Inp, +now: U32) -> St:
  match go:
    case False{}:
      st
    case True{}:
      match st inp:
        case St{+v, +w, +h, +old, +vals, +tw, +arr, +md} Inp{+t, +hi, +lo, +tr}:
          +trend = Num.int(tr)
          +vals2 = vals_range(vals, E.units(e), Num.parse(t), Num.parse(hi), Num.parse(lo), trend)
          +arr2 = Bool.pick(Arr, is01(v) && old_trend_changed(old, tr), arrow(arr, trend), arr)
          St{v, w, h, Old{False{}, t, hi, lo, tr}, vals2, retween(tw, vals2, now), arr2,
            tmode_set(md)}

# The data event (clientRawDataUpdate; for 02/03 also
# clientRawExtraDataUpdate) or updateUnits' call with unitChange (force).
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+v, +w, +h, +old, +vals, +tw, +arr, +md}:
      +md1 = switched(v, e, force, md)
      +inp = inputs(v, e, md1)
      data.go(should(v, old, inp, force), St{v, w, h, old, vals, tw, arr, md1}, e, inp, now)

def vals_trend(+vals: Vals) -> F32:
  match vals:
    case Vals{_, _, _, +tr, _, _}:
      tr

# resizeCanvasTemp01: width = clientHeight / 2, height = clientHeight, then
# updateTop (which repaints the trend arrow from values.trend).
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{+v, _, _, +old, +vals, +tw, +arr, +md} E.Box{_, +ph, _, _, _, _}:
      +a = arrow(arr, vals_trend(vals))
      St{v, Num.cdim(ph, 1.0, 2.0), Num.cdim(ph, 1.0, 1.0), old, vals, tw, a, md}

def width(+st: St) -> F32:
  match st:
    case St{_, +w, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, _, +h, _, _, _, _, _}:
      h

# The y of the large dash i/10: sharpenValue of the original's expression.
def gap_at(+fi: F32, +py: F32, +cut: F32) -> F32:
  +a = (cut * (24.0 / 25.0) - py : F32)
  Num.sharpen((py + (a / 4.0 - (F32.mod(a, 4.0) / 5.0 - 1.0)) * (fi / 10.0) : F32))

# Dash i of the 50 set up; only the first 41 are ever placed, the rest stay
# as setUp left them (a zero line at the origin).
def dash(+i: Nat, +px: F32, +py: F32, +dl: F32, +ss: F32, +cut: F32) -> S.Node:
  +fi = Num.of_nat(i)
  +gap = gap_at(fi, py, cut)
  +x0 = Bool.pick(F32, F32.is_eq(F32.mod(fi, 10.0), 0.0), px,
    Bool.pick(F32, F32.is_eq(F32.mod(fi, 5.0), 0.0), (px + dl - dl / 2.0 : F32),
      (px + dl - dl / 3.0 : F32)))
  Bool.pick(S.Node, (fi < 41.0 : F32),
    S.shape([S.GStroke{"black"}, S.GStyle{ss, ""}, S.GMove{x0, gap}, S.GLine{(px + dl : F32), gap}]),
    S.shape([S.GStroke{"black"}, S.GStyle{0.0, ""}, S.GMove{0.0, 0.0}, S.GLine{0.0, 0.0}]))

def dashes(+n: Nat, +i: Nat, +px: F32, +py: F32, +dl: F32, +ss: F32, +cut: F32) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+r:
      dash(i, px, py, dl, ss, cut) <> dashes(r, 1n+i, px, py, dl, ss, cut)

# The five scale numbers: maxTemp - ((maxTemp - minTemp) / 4) * i, right
# aligned beside the large dashes. Their colour was never set (the
# constructor's second argument is the font), so it is the default.
def labels(+n: Nat, +k: Nat, +lx: F32, +py: F32, +cut: F32, +mn: F32, +mx: F32, +font: String) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+r:
      +fk = Num.of_nat(k)
      S.label(lx, gap_at((fk * 10.0 : F32), py, cut), Num.show((mx - ((mx - mn) / 4.0) * fk : F32)),
        font, "", "right", "middle") <> labels(r, 1n+k, lx, py, cut, mn, mx, font)

def spread_go(+ly: F32, +hy: F32, +h: F32) -> Bool:
  ((ly - hy) / h < 0.04 : F32)

def spread.loop(+fuel: Nat, +go: Bool, +hy: F32, +ly: F32, +h: F32) -> HL:
  match fuel:
    case 0n:
      HL{hy, ly}
    case 1n+f:
      match go:
        case False{}:
          HL{hy, ly}
        case True{}:
          +h2 = (hy - 1.0 : F32)
          +l2 = (ly + 1.0 : F32)
          spread.loop(f, spread_go(l2, h2, h), h2, l2, h)

# The high/low labels' de-overlap loop: step them a pixel apart at a time
# while (low - high) / canvas.height < minHLspace. The bulk of the steps is
# taken at once (all but the last couple), then the loop runs the rest.
def spread(+hy: F32, +ly: F32, +h: F32) -> HL:
  +need = F32.floor((((0.04 * h) - (ly - hy)) / 2.0 : F32))
  +n0 = Num.nat_of((need - 2.0 : F32))
  +k = Num.of_nat(n0)
  +h0 = (hy - k : F32)
  +l0 = (ly + k : F32)
  spread.loop(64n, spread_go(l0, h0, h), h0, l0, h)

def hl_hy(+x: HL) -> F32:
  match x:
    case HL{+hy, _}:
      hy

def hl_ly(+x: HL) -> F32:
  match x:
    case HL{_, +ly}:
      ly

def title.go(+v: Var, +e: E.Env, +tmode: String) -> String:
  match v:
    case V01{}:
      +t = E.opt(e, "temperature.title", "default")
      Bool.pick(String, String.eq(t, "default"), E.word(e, D.WTemperatureTitle{}), t)
    case V02{}:
      +t = E.opt(e, "temperature02.title", "default")
      Bool.pick(String, String.eq(t, "default"), E.word(e, D.WTemperatureTitle{}) ++ " 2", t)
    case V03{}:
      +t = E.opt(e, "temperature03.title", "default")
      Bool.pick(String, String.eq(t, "default"), E.word(e, D.WTemperatureTitle{}) ++ " 3", t)
    case VWC{}:
      Bool.pick(String, String.eq(tmode, "windchill"),
        E.word(e, D.WWindchillTitle{}), E.word(e, D.WHeatIndexTitle{}))

def hl_on(+v: Var, +e: E.Env) -> Bool:
  match v:
    case V01{}:
      E.on(e, "temperature.highLowEnabled")
    case V02{}:
      E.on(e, "temperature02.highLowEnabled")
    case V03{}:
      E.on(e, "temperature03.highLowEnabled")
    case VWC{}:
      True{}

# The trend arrow (V01): a middle line, hidden at trend 0, and a pointer
# whose middle point goes up or down with the trend. Stroke style caps
# "round".
def arrow_nodes(+a: Arr, +trend: F32, +ax: F32, +ay: F32, +stroke: F32) -> List<&2, S.Node>:
  match a:
    case Arr{+mid, +ptr}:
      +top = (1.0 - 0.04 : F32)
      +bot = (1.0 + 0.04 : F32)
      +vis = Bool.not(F32.is_eq(trend, 0.0))
      [S.NShape{S.Xf{0.0, 0.0, 0.0, 0.0, 0.0, vis},
         [S.GStroke{mid}, S.GStyle{stroke, "round"}, S.GMove{ax, (ay * top : F32)},
          S.GLine{ax, (ay * bot : F32)}], []},
       S.shape([S.GStroke{ptr}, S.GStyle{stroke, "round"}, S.GMove{(ax * top : F32), ay},
         S.GLine{ax, (ay * (1.0 - 0.04 * trend) : F32)}, S.GLine{(ax * bot : F32), ay}])]

# The high/low markers and labels, added only when highLowEnabled.
def hl_nodes(+on: Bool, +h: F32, +bw: F32, +ss: F32, +hy: F32, +ly: F32, +lab: HL, +lx: F32, +font: String, +hi: String, +lo: String) -> List<&2, S.Node>:
  match on:
    case False{}:
      []
    case True{}:
      +xa = ((h + bw) / 2.0 : F32)
      +xb = ((h - bw) / 2.0 : F32)
      +mw = (ss * 4.0 : F32)
      [S.shape([S.GStroke{c_temp()}, S.GStyle{mw, ""}, S.GMove{xa, hy}, S.GLine{xb, hy}]),
       S.shape([S.GStroke{c_low()}, S.GStyle{mw, ""}, S.GMove{xa, ly}, S.GLine{xb, ly}]),
       S.label(lx, hl_hy(lab), hi, font, c_temp(), "left", "middle"),
       S.label(lx, hl_ly(lab), lo, font, c_low(), "left", "middle")]

# updateTopTemp01 + updateTweensTemp01 at time now, the stage's children in
# setUp order.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+v, +w, +h, _, +vals, +tw, +arr, +md}:
      match vals tw md:
        case Vals{+t, +hi, +lo, +trend, +mn, +mx} Tw{+fill, +thi, +tlo} Md{_, _, +tmode}:
          +sx = F32.neg((h / 4.5 : F32))
          +dl = (h * 0.075 : F32)
          +dg = (h * 0.025 : F32)
          +bw = (h * 0.075 : F32)
          +bfw = (bw * 0.6 : F32)
          +bh = (h * 0.8 : F32)
          +cr = (h * 0.1 : F32)
          +fcr = (cr * 0.85 : F32)
          +corner = (bw / 2.0 : F32)
          +fcorner = (bfw / 2.0 : F32)
          +ss = (bw / 40.0 : F32)
          +text_px = S.ex_div(S.ex(h), S.ex(17.0))
          +disp_px = S.ex_div(S.ex(h), S.ex(19.0))
          +hl_px = S.ex_div(S.ex(h), S.ex(21.0))
          +astroke = (bw / 15.0 : F32)
          +bar_x = ((h / 2.0) - (bw / 2.0) : F32)
          +bar_y = ((h / 2.0) - (bh / 2.0) : F32)
          +cx = (h / 2.0 : F32)
          +cy = (h * (3.0 / 4.0) + cr - cr / 10.0 : F32)
          +title_x = (h / 2.0 : F32)
          +title_y = ((h - bh) / 2.0 - corner : F32)
          +dash_x = ((h / 2.0) - (bw / 2.0) - dl - dg : F32)
          +dash_y = ((h - bh) / 2.0 + corner / 2.0 : F32)
          +hl_x = ((h / 2.0) + (bw / 2.0) + dg : F32)
          +fbar_x = ((h / 2.0) - (bfw / 2.0) : F32)
          +ax = (w * 0.7 : F32)
          +cut = (h * (299.0 / 400.0) : F32)
          +span = (bh - bar_y : F32)
          +fh = (T.value(fill, now) * span : F32)
          +fy = (bh - fh : F32)
          +hy = (T.value(thi, now) * span : F32)
          +ly = (T.value(tlo, now) * span : F32)
          +lab = spread(hy, ly, h)
          +unit = E.label(e, U.Temp{})
          +title = title.go(v, e, tmode)
          +front = {[
            S.masked([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{ss, ""},
              S.GRoundRect{bar_x, bar_y, bw, bh, corner}], [S.GRect{0.0, 0.0, h, cut}]),
            S.masked([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{ss, ""},
              S.GCircle{cx, cy, cr}], [S.GRect{0.0, cut, h, h}])] : List<&2, S.Node>}
          +fills = {[
            S.shape([S.GFill{c_fill()}, S.GStyle{0.0, ""}, S.GCircle{cx, cy, fcr}]),
            S.masked([S.GFill{c_fill()}, S.GStyle{0.0, ""},
              S.GRoundRect{fbar_x, fy, bfw, fh, fcorner}], [S.GRect{0.0, 0.0, h, (cut * 1.1 : F32)}])] : List<&2, S.Node>}
          +texts = {[
            S.label(cx, cy, Num.show(t) ++ unit, S.boldx(disp_px, "arial"), "", "center", "middle"),
            S.label_w(title_x, title_y, title, S.boldx(disp_px, "arial"), "black", "center", "middle",
              S.max_centred(w, sx, title_x))] : List<&2, S.Node>}
          +hl = hl_nodes(hl_on(v, e), h, bw, ss, hy, ly, lab, hl_x, S.boldx(hl_px, "arial"),
            Num.show(hi) ++ unit, Num.show(lo) ++ unit)
          +arrows = Bool.pick(List<&2, S.Node>, is01(v), arrow_nodes(arr, trend, ax, cy, astroke), [])
          +lbls = labels(5n, 0n, ((dash_x - dl) * (6.0 / 5.0) : F32), dash_y, cut, mn, mx, S.plainx(text_px, "arial"))
          S.Scene{sx, 0.0,
            List.append(&2, S.Node, front,
              List.append(&2, S.Node, dashes(50n, 0n, dash_x, dash_y, dl, ss, cut),
                List.append(&2, S.Node, fills,
                  List.append(&2, S.Node, lbls,
                    List.append(&2, S.Node, texts,
                      List.append(&2, S.Node, hl, arrows))))))}
