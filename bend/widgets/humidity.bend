# Humidity gauge (canvas HumidityGauge01): a dial cut off at the bottom,
# 0 to 100 %, with a pointer for clientraw[5] and a trend arrow for
# clientraw[144].
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/tween.bend as T
import ../lib/dict.bend as D
import ../lib/env.bend as E

# w, h: the canvas size. fresh: old_h/old_t (valuesOLD, the raw strings last
# drawn) are still the number 0 they start as. hum: values.humidityIn.
# trend: values.trend. atrend: the trend updateTopHum01 last drew the arrow
# with (it only runs on resize and when the trend string changed). r: the
# pointer rotation.
type St is Data:
  St{w: F32, h: F32, fresh: Bool, old_h: String, old_t: String, hum: F32,
    trend: F32, atrend: F32, r: T.Tween}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, True{}, "0", "0", 0.0, 0.0, 0.0, T.still(0.0)}

def tip(+e: E.Env) -> String:
  E.word(e, D.WHumidityDescription{})

# parseFloat(s): like Number(s) for clientraw's numbers, but "" is NaN.
def pfloat(+s: String) -> F32:
  Bool.pick(F32, String.is_empty(String.trim(s)), Num.nan(), Num.parse(s))

# The dial's half angle in radians: pi - acos((cutOff - centreY) / radius).
def half_angle(+w: F32, +h: F32) -> F32:
  +rad = (w * 0.4 : F32)
  +cut = (rad * 2.0 : F32)
  (F32.pi() - F32.acos(((cut - h / 2.0) / rad : F32)) : F32)

def redraw(+st: St, +hraw: String, +traw: String, +tc: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, _, _, _, _, _, +atrend, +r}:
      +half_deg = (half_angle(w, h) * (180.0 / F32.pi()) : F32)
      +trend = F32.trunc(pfloat(traw))
      +hum = pfloat(hraw)
      +out = Num.map(hum, 0.0, 100.0, F32.neg(half_deg), half_deg)
      St{w, h, False{}, hraw, traw, hum, trend, Bool.pick(F32, tc, trend, atrend),
        T.to(r, out, 2000.0, now)}

# drawHumidityGaugeHum01(humidityIn, trend, unitChange): loose != against the
# remembered raw strings; updateTopHum01 (the arrow) only when the trend
# string changed.
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +fresh, +old_h, +old_t, +hum, +trend, +atrend, +r}:
      +hraw = E.cr(e, 5n)
      +traw = E.cr(e, 144n)
      +tc = E.changed(fresh, traw, old_t)
      +go = E.changed(fresh, hraw, old_h) || tc || force
      +same = {St{w, h, fresh, old_h, old_t, hum, trend, atrend, r} : St}
      Bool.pick(St, go, redraw(same, hraw, traw, tc, now), same)

# resizeCanvasHum01: a square the parent's clientWidth on a side; updateTop
# redraws the arrow with the current trend.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +fresh, +old_h, +old_t, +hum, +trend, _, +r} E.Box{+pw, _, _, _, _, _}:
      St{Num.cdim(pw, 1.0, 1.0), Num.cdim(pw, 1.0, 1.0), fresh, old_h, old_t, hum, trend, trend, r}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _, _, _, _, _}:
      h

# Dash i (0..20) at angle half - i * half/10 + pi about the centre; even
# ones are long. setUp makes 22 dashes but updateTop only places 21: the
# last keeps its setUp commands, see stray_dash.
def dashes(+n: Nat, +i: Nat, +w: F32, +h: F32, +half: F32, +rad: F32, +end_rad: F32, +stroke: F32) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+k:
      +fi = Num.of_nat(i)
      +seg = (half / 10.0 : F32)
      +angle = (half - seg * fi + F32.pi() : F32)
      +even = F32.is_eq(F32.mod(fi, 2.0), 0.0)
      +far = Bool.pick(F32, even, (F32.sin(angle) * end_rad : F32),
        (F32.sin(angle) * (end_rad + rad) / 2.0 : F32))
      +far_y = Bool.pick(F32, even, (F32.cos(angle) * end_rad : F32),
        (F32.cos(angle) * (end_rad + rad) / 2.0 : F32))
      +xf = {S.Xf{0.0, 0.0, 0.0, F32.neg((w / 2.0 : F32)), F32.neg((h / 2.0 : F32)), True{}} : S.Xf}
      S.shape_at(xf, [S.GStroke{"black"}, S.GStyle{stroke, ""},
        S.GMove{(F32.sin(angle) * rad : F32), (F32.cos(angle) * rad : F32)},
        S.GLine{far, far_y}]) <> dashes(k, 1n+i, w, h, half, rad, end_rad, stroke)

# The 22nd dash: never placed, so setStrokeStyle(110), moveTo(0, 0),
# lineTo(0, 0) at reg 0.
def stray_dash() -> S.Node:
  S.shape([S.GStroke{"black"}, S.GStyle{110.0, ""}, S.GMove{0.0, 0.0}, S.GLine{0.0, 0.0}])

# Label i (0..10) on long dash 2i, text Math.round(100 * i / 10).
# new createjs.Text(text, "black") leaves the colour undefined.
def labels(+n: Nat, +i: Nat, +w: F32, +h: F32, +half: F32, +rad: F32, +px: S.Ex) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+k:
      +fi = Num.of_nat(i)
      +seg = (half / 10.0 : F32)
      +angle = (half - seg * (fi * 2.0 : F32) + F32.pi() : F32)
      +xf = {S.Xf{(F32.sin(angle) * rad : F32), (F32.cos(angle) * rad : F32), 0.0,
        F32.neg((w / 2.0 : F32)), F32.neg((h / 2.0 : F32)), True{}} : S.Xf}
      S.NLabel{xf, Num.show(F32.round((100.0 * fi / 10.0 : F32))), S.plainx(px, "arial"), "",
        "center", "middle", 0.0} <> labels(k, 1n+i, w, h, half, rad, px)

# The trend arrow: a vertical middle line (hidden when the trend is 0) and a
# chevron whose tip moves by 5 % per trend step.
def arrow(+w: F32, +h: F32, +stroke: F32, +trend: F32) -> List<&2, S.Node>:
  +ax = (w / 2.0 : F32)
  +ay = (h * 0.65 : F32)
  +col = S.rgb("16, 217, 244")
  +vis = Bool.not(F32.is_eq(trend, 0.0))
  [S.shape_at(S.Xf{0.0, 0.0, 0.0, 0.0, 0.0, vis},
      [S.GStroke{col}, S.GStyle{stroke, "round"}, S.GMove{ax, (ay * 0.95 : F32)},
        S.GLine{ax, (ay * 1.05 : F32)}]),
    S.shape([S.GStroke{col}, S.GStyle{stroke, "round"}, S.GMove{(ax * 0.95 : F32), ay},
      S.GLine{ax, (ay * (1.0 - 0.05 * trend) : F32)}, S.GLine{(ax * 1.05 : F32), ay}])]

def front(+w: F32, +h: F32, +now: U32, +hum: F32, +r: T.Tween, +title: String) -> List<&2, S.Node>:
  +rad = (w * 0.4 : F32)
  +inner = (w * 0.05 : F32)
  +cut = (rad * 2.0 : F32)
  +stroke = (w / 80.0 : F32)
  +cx = (w / 2.0 : F32)
  +cy = (h / 2.0 : F32)
  +chord = F32.sqrt((F32.pow(rad, 2.0) - F32.pow((cut - cx : F32), 2.0) : F32))
  +bot_y = (cut - stroke / 10.0 : F32)
  [S.masked([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""}, S.GCircle{cx, cy, rad}],
      [S.GRect{0.0, 0.0, w, cut}]),
    S.shape([S.GStroke{"black"}, S.GStyle{stroke, ""}, S.GMove{(cx - chord : F32), bot_y},
      S.GLine{(cx + chord : F32), bot_y}]),
    S.shape_at(S.Xf{(w / 2.0 : F32), (h / 2.0 : F32), T.value(r, now), (w / 2.0 : F32), (h / 2.0 : F32), True{}},
      [S.GFill{"black"}, S.GStyle{10.0, ""},
        S.GMove{(w / 2.0 : F32), (h * (1.0 / 5.0) : F32)},
        S.GLine{(w * (97.0 / 200.0) : F32), (h * (3.0 / 5.0) : F32)},
        S.GLine{(w * (103.0 / 200.0) : F32), (h * (3.0 / 5.0) : F32)}, S.GClosePath{}]),
    S.shape([S.GFill{"black"}, S.GStyle{0.0, ""}, S.GCircle{cx, cy, inner}]),
    S.shape([S.GFill{S.rgb("16, 217, 244")}, S.GStyle{0.0, ""}, S.GCircle{cx, cy, (inner / 4.0 : F32)}]),
    S.label(cx, (cut * (103.0 / 110.0) : F32), Num.show(hum) ++ "%", S.boldx(S.ex_div(S.ex(w), S.ex(10.0)), "arial"),
      "black", "center", "middle"),
    S.label_w(cx, (cut * (110.0 / 103.0) : F32), title, S.boldx(S.ex_div(S.ex(w), S.ex(13.0)), "arial"),
      "black", "center", "middle", S.max_centred(w, 0.0, cx))]

# updateTopHum01 / updateTweensHum01 plus the stage's children, in
# setUpHum01's order. stage.y = height * -0.09.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, _, _, _, +hum, _, +atrend, +r}:
      +rad = (w * 0.4 : F32)
      +half = half_angle(w, h)
      +stroke = (w / 80.0 : F32)
      +title = E.word(e, D.WHumidityTitle{}) ++ " (%)"
      +ls = labels(11n, 0n, w, h, half, (rad * (5.0 / 8.0) : F32), S.ex_div(S.ex(w), S.ex(15.0)))
      +ds = dashes(21n, 0n, w, h, half, rad, (rad * (3.0 / 4.0) : F32), stroke)
      +rest = List.append(&2, S.Node, ds, stray_dash() <> arrow(w, h, stroke, atrend))
      S.Scene{0.0, (h * F32.neg(0.09) : F32),
        List.append(&2, S.Node, front(w, h, now, hum, r, title), List.append(&2, S.Node, ls, rest))}
