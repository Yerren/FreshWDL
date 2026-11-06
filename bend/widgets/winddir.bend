# Wind direction gauge (canvas WindGauge01): a compass dial with a black
# pointer for the current direction (clientraw[3]) and a green one for the
# average (clientraw[117]), both turning the short way round.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/tween.bend as T
import ../lib/dict.bend as D
import ../lib/env.bend as E

# w, h: the canvas size. old_w, old_a: valuesOLD.windIn/avgIn, the parsed
# numbers last drawn (the raw strings are compared to them as numbers).
# wold, aold: values.windOld/avgOld, the unwrapped angles the pointers were
# last sent to. r, ar: the pointer rotations. wtext, atext: the displays.
type St is Data:
  St{w: F32, h: F32, old_w: F32, old_a: F32, wold: F32, aold: F32,
    r: T.Tween, ar: T.Tween, wtext: String, atext: String}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, 0.0, 0.0, 0.0, 0.0, T.still(0.0), T.still(0.0), "0°", "0°"}

def tip(+e: E.Env) -> String:
  E.word(e, D.WWindDirectionDescription{})

# parseFloat(s): like Number(s) for clientraw's numbers, but "" is NaN.
def pfloat(+s: String) -> F32:
  Bool.pick(F32, String.is_empty(String.trim(s)), Num.nan(), Num.parse(s))

# The original's wrap-around step: from the unwrapped angle `old` to the
# reading `x`, by angleDiff = x - old % 360 (JS remainder, sign of old).
# Kept as written: the +-360 branches test old against x, not the sign of
# the difference, and when none applies (old == x, or NaN) the angle stays.
def unwrap(+old: F32, +x: F32) -> F32:
  +d = (x - F32.mod(old, 360.0) : F32)
  Bool.pick(F32, (F32.abs(d) < 180.0 : F32), (old + d : F32),
    Bool.pick(F32, (old > x : F32), (old + d + 360.0 : F32),
      Bool.pick(F32, (old < x : F32), (old + d - 360.0 : F32), old)))

def redraw(+st: St, +wv: F32, +av: F32, +now: U32) -> St:
  match st:
    case St{+w, +h, _, _, +wold, +aold, +r, +ar, _, _}:
      +wout = unwrap(wold, wv)
      +aout = unwrap(aold, av)
      St{w, h, wv, av, wout, aout, T.to(r, wout, 2000.0, now), T.to(ar, aout, 2000.0, now),
        Num.show(wv) ++ "°", Num.show(av) ++ "°"}

# drawWindGaugeWind01(windIn, avgIn, unitChange). valuesOLD holds numbers,
# so `old != raw` is a numeric test (NaN always differs).
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +old_w, +old_a, +wold, +aold, +r, +ar, +wtext, +atext}:
      +wr = E.cr(e, 3n)
      +ar_raw = E.cr(e, 117n)
      +go = F32.is_ne(old_w, Num.parse(wr)) || F32.is_ne(old_a, Num.parse(ar_raw)) || force
      +same = {St{w, h, old_w, old_a, wold, aold, r, ar, wtext, atext} : St}
      Bool.pick(St, go, redraw(same, pfloat(wr), pfloat(ar_raw), now), same)

# resizeCanvasWind01: a square the parent's clientHeight on a side.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +old_w, +old_a, +wold, +aold, +r, +ar, +wtext, +atext} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 1.0, 1.0), Num.cdim(ph, 1.0, 1.0), old_w, old_a, wold, aold, r, ar, wtext, atext}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _, _, _, _, _, _}:
      h

# The dashes, i = 0..15, at angle 2pi - i * pi/8, drawn about the centre
# (regX/regY = -w/2, -h/2). Even ones are long, odd ones medium.
def dashes(+n: Nat, +i: Nat, +w: F32, +h: F32, +rad: F32, +end_rad: F32, +stroke: F32) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+k:
      +fi = Num.of_nat(i)
      +seg = (F32.pi() / 8.0 : F32)
      +angle = (F32.pi() - seg * fi + F32.pi() : F32)
      +even = F32.is_eq(F32.mod(fi, 2.0), 0.0)
      +far = Bool.pick(F32, even, (F32.sin(angle) * end_rad : F32),
        (F32.sin(angle) * (end_rad + rad) / 2.0 : F32))
      +far_y = Bool.pick(F32, even, (F32.cos(angle) * end_rad : F32),
        (F32.cos(angle) * (end_rad + rad) / 2.0 : F32))
      +xf = {S.Xf{0.0, 0.0, 0.0, F32.neg((w / 2.0 : F32)), F32.neg((h / 2.0 : F32)), True{}} : S.Xf}
      S.shape_at(xf, [S.GStroke{"black"}, S.GStyle{stroke, ""},
        S.GMove{(F32.sin(angle) * rad : F32), (F32.cos(angle) * rad : F32)},
        S.GLine{far, far_y}]) <> dashes(k, 1n+i, w, h, rad, end_rad, stroke)

# Label i sits on long dash 2i. new createjs.Text(text, "black") leaves the
# colour undefined (default black); updateTop sets the font.
def compass(+i: F32, +text: String, +w: F32, +h: F32, +rad: F32, +px: S.Ex) -> S.Node:
  +seg = (F32.pi() / 8.0 : F32)
  +angle = (F32.pi() - seg * (i * 2.0 : F32) + F32.pi() : F32)
  +xf = {S.Xf{(F32.sin(angle) * rad : F32), (F32.cos(angle) * rad : F32), 0.0,
    F32.neg((w / 2.0 : F32)), F32.neg((h / 2.0 : F32)), True{}} : S.Xf}
  S.NLabel{xf, text, S.plainx(px, "arial"), "", "center", "middle", 0.0}

# A pointer triangle, turned about the canvas centre.
def pointer(+w: F32, +h: F32, +rot: F32, +fill: String, +tx: F32, +ty: F32, +lx: F32, +ly: F32, +rx: F32, +ry: F32) -> S.Node:
  S.shape_at(S.Xf{(w / 2.0 : F32), (h / 2.0 : F32), rot, (w / 2.0 : F32), (h / 2.0 : F32), True{}},
    [S.GFill{fill}, S.GStyle{10.0, ""}, S.GMove{tx, ty}, S.GLine{lx, ly}, S.GLine{rx, ry}, S.GClosePath{}])

def front(+w: F32, +h: F32, +now: U32, +r: T.Tween, +ar: T.Tween, +wtext: String, +atext: String) -> List<&2, S.Node>:
  +rad = (w * 0.30 : F32)
  +inner = (w * 0.05 : F32)
  +stroke = (w / 80.0 : F32)
  +cx = (w / 2.0 : F32)
  +cy = (h / 2.0 : F32)
  +wind = S.rgb("23, 145, 27")
  [S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""}, S.GCircle{cx, cy, rad}]),
    pointer(w, h, T.value(ar, now), wind,
      (w / 2.0 : F32), (rad * (33.0 / 50.0) : F32),
      (w * (90.0 / 200.0) : F32), (rad * (4.0 / 5.0) : F32),
      (w * (110.0 / 200.0) : F32), (rad * (4.0 / 5.0) : F32)),
    pointer(w, h, T.value(r, now), "black",
      (w / 2.0 : F32), (h * (1.0 / 5.0) : F32),
      (w * (97.0 / 200.0) : F32), (h * (3.0 / 5.0) : F32),
      (w * (103.0 / 200.0) : F32), (h * (3.0 / 5.0) : F32)),
    S.shape([S.GFill{"black"}, S.GStyle{0.0, ""}, S.GCircle{cx, cy, inner}]),
    S.shape([S.GFill{wind}, S.GStyle{0.0, ""}, S.GCircle{cx, cy, (inner / 4.0 : F32)}]),
    S.label(cx, (rad * (74.0 / 30.0) : F32), wtext, S.boldx(S.ex_div(S.ex(w), S.ex(10.0)), "arial"),
      "black", "center", "middle"),
    S.label(cx, (rad * (65.0 / 30.0) : F32), atext, S.boldx(S.ex_div(S.ex(w), S.ex(12.0)), "arial"),
      wind, "center", "middle")]

# updateTopWind01 / updateTweensWind01 plus the stage's children, in
# setUpWind01's order.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, _, _, _, _, +r, +ar, +wtext, +atext}:
      +rad = (w * 0.30 : F32)
      +label_rad = (rad * (68.0 / 50.0) : F32)
      +px = S.ex_div(S.ex(w), S.ex(15.0))
      +labels = {[
        compass(0.0, E.word(e, D.WWindDirectionLabelS{}), w, h, label_rad, px),
        compass(1.0, E.word(e, D.WWindDirectionLabelSW{}), w, h, label_rad, px),
        compass(2.0, E.word(e, D.WWindDirectionLabelW{}), w, h, label_rad, px),
        compass(3.0, E.word(e, D.WWindDirectionLabelNW{}), w, h, label_rad, px),
        compass(4.0, E.word(e, D.WWindDirectionLabelN{}), w, h, label_rad, px),
        compass(5.0, E.word(e, D.WWindDirectionLabelNE{}), w, h, label_rad, px),
        compass(6.0, E.word(e, D.WWindDirectionLabelE{}), w, h, label_rad, px),
        compass(7.0, E.word(e, D.WWindDirectionLabelSE{}), w, h, label_rad, px)] : List<&2, S.Node>}
      +ds = dashes(16n, 0n, w, h, rad, (rad * (48.0 / 40.0) : F32), (w / 80.0 : F32))
      S.Scene{0.0, 0.0, List.append(&2, S.Node, front(w, h, now, r, ar, wtext, atext),
        List.append(&2, S.Node, labels, ds))}
