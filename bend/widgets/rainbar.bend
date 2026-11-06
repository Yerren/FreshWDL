# Rainfall bars uniBar01/02/03 (canvases RainBar1/2/3, widgetList
# "rainfallDay"/"rainfallMonth"/"rainfallYear"): a scaled bar filled to the
# day's, month's or year's rain, clientraw[7], [8] and [9]. The three are
# copies of one another; the only differences are the input field, the
# title and the canvas id (every size, range and constant is the same).
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/tween.bend as T

type Bar is Data:
  RDay{}
  RMonth{}
  RYear{}

# w, h: canvas size; sx: stage.x. old/fresh: valuesOLD.uniIn (the raw string
# last drawn; fresh while it is still the starting number 0). v:
# values.uniIn after formatDataToUnit (the number 0 to start). max:
# constants.maxUni; pos: scalePos (-1 to start). fill: tweens.barFill.h.
type St is Data:
  St{bar: Bar, w: F32, h: F32, sx: F32, old: String, fresh: Bool, v: F32,
    max: F32, pos: F32, fill: T.Tween}

def init(+b: Bar) -> St:
  St{b, 300.0, 150.0, 0.0, "0", True{}, 0.0, 5.0, F32.neg(1.0), T.still(0.0)}

def canvas_id(+b: Bar) -> String:
  match b:
    case RDay{}:
      "RainBar1"
    case RMonth{}:
      "RainBar2"
    case RYear{}:
      "RainBar3"

def key(+b: Bar) -> String:
  match b:
    case RDay{}:
      "rainfallDay"
    case RMonth{}:
      "rainfallMonth"
    case RYear{}:
      "rainfallYear"

# config.title
def title(+b: Bar) -> D.Phrase:
  match b:
    case RDay{}:
      D.WRainfallDailyTitle{}
    case RMonth{}:
      D.WRainfallMonthlyTitle{}
    case RYear{}:
      D.WRainfallAnnualTitle{}

# The clientraw field each draws on clientRawDataUpdate (and that
# updateUnits for rainfall redraws it from, with unitChange true).
def field(+b: Bar) -> Nat:
  match b:
    case RDay{}:
      7n
    case RMonth{}:
      8n
    case RYear{}:
      9n

# The original makes no Opentip for these canvases.
def tip(+e: E.Env) -> String:
  ""

# scaleSequence[pos]; scaleSequence[-1] is undefined, and x / undefined is NaN.
def seq(+pos: F32) -> F32:
  Bool.pick(F32, F32.is_eq(pos, 0.0), 2.0,
    Bool.pick(F32, F32.is_eq(pos, 1.0), 2.0,
      Bool.pick(F32, F32.is_eq(pos, 2.0), 2.5, Num.nan())))

# A range as the two while loops leave it.
type Rng is Data:
  Rng{max: F32, pos: F32}

# while (uniIn > maxUni * 0.75) { scalePos = (scalePos + 1) % 3; maxUni *= seq }
def grow.go(+fuel: Nat, +up: Bool, +v: F32, +max: F32, +pos: F32) -> Rng:
  match fuel:
    case 0n:
      Rng{max, pos}
    case 1n+f:
      match up:
        case False{}:
          Rng{max, pos}
        case True{}:
          +p = F32.mod((pos + 1.0 : F32), 3.0)
          +m = (max * seq(p) : F32)
          grow.go(f, (v > (m * 0.75 : F32) : F32), v, m, p)

def grow(+v: F32, +max: F32, +pos: F32) -> Rng:
  grow.go(100n, (v > (max * 0.75 : F32) : F32), v, max, pos)

# while (uniIn <= (maxUni / seq) * 0.75 && maxUni > 5) { maxUni /= seq;
# scalePos = ((scalePos - 1) % 3 + 3) % 3 }
def shrink.test(+v: F32, +max: F32, +pos: F32) -> Bool:
  (v <= ((max / seq(pos) : F32) * 0.75 : F32) : F32) && (max > 5.0 : F32)

def shrink.go(+fuel: Nat, +down: Bool, +v: F32, +max: F32, +pos: F32) -> Rng:
  match fuel:
    case 0n:
      Rng{max, pos}
    case 1n+f:
      match down:
        case False{}:
          Rng{max, pos}
        case True{}:
          +m = (max / seq(pos) : F32)
          +p = F32.mod((F32.mod((pos - 1.0 : F32), 3.0) + 3.0 : F32), 3.0)
          shrink.go(f, shrink.test(v, m, p), v, m, p)

def shrink(+r: Rng, +v: F32) -> Rng:
  match r:
    case Rng{+max, +pos}:
      shrink.go(100n, shrink.test(v, max, pos), v, max, pos)

def rng_max(+r: Rng) -> F32:
  match r:
    case Rng{+max, _}:
      max

def rng_pos(+r: Rng) -> F32:
  match r:
    case Rng{_, +pos}:
      pos

# drawUniratureBarUni0N(uniIn, unitChange) and formatInputUni0N: redraw
# when the raw reading changed (loose !=, numeric against the starting 0)
# or the unit did; scale the range, then tween the fill to uniIn's share
# of it over 2 s.
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+bar, +w, +h, +sx, +old, +fresh, +v, +max, +pos, +fill}:
      +raw = E.cr(e, field(bar))
      +nv = U.value(E.units(e), U.Rainfall{}, Num.parse(raw))
      +r = shrink(grow(nv, max, pos), nv)
      +out = Num.map(nv, 0.0, rng_max(r), 0.0, 1.0)
      Bool.pick(St, force || E.changed(fresh, raw, old),
        St{bar, w, h, sx, raw, False{}, nv, rng_max(r), rng_pos(r),
          T.to(fill, out, 2000.0, now)},
        St{bar, w, h, sx, old, fresh, v, max, pos, fill})

# resizeCanvasUni0N: width clientWidth / 3.01, height clientWidth * 2.5 / 3,
# stage.x = -(canvas.width / 2).
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{+bar, _, _, _, +old, +fresh, +v, +max, +pos, +fill} E.Box{+pw, _, _, _, _, _}:
      +w = Num.cdim(pw, 100.0, 301.0)
      St{bar, w, Num.cdim(pw, 2.5, 3.0), F32.neg((w / 2.0 : F32)), old, fresh, v,
        max, pos, fill}

def width(+st: St) -> F32:
  match st:
    case St{_, +w, _, _, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, _, +h, _, _, _, _, _, _, _}:
      h

# Dash shape i (0 to 50): large every 10th, medium every 5th, small else.
def dash(+i: Nat, +x: F32, +len: F32, +stroke: F32, +gap: F32, +y0: F32) -> S.Node:
  +y = Num.sharpen((gap * Num.of_nat(i) + y0 : F32))
  +end = (x + len : F32)
  +x_med = (x + len - (len / 2.0 : F32) : F32)
  +x_small = (x + len - (len / 3.0 : F32) : F32)
  +big = Nat.is_eq(Nat.mod(i, 10n), 0n)
  +med = Nat.is_eq(Nat.mod(i, 5n), 0n)
  +start = Bool.pick(F32, big, x, Bool.pick(F32, med, x_med, x_small))
  S.shape([S.GStroke{"black"}, S.GStyle{stroke, ""}, S.GMove{start, y}, S.GLine{end, y}])

# Dashes 51 to 59 are made and added to the stage but never placed: zeros.
def dash_unset() -> S.Node:
  S.shape([S.GStroke{"black"}, S.GStyle{0.0, ""}, S.GMove{0.0, 0.0}, S.GLine{0.0, 0.0}])

# Shapes i .. 59, i counting up; n = 60 - i is the fuel.
def dashes(+n: Nat, +i: Nat, +x: F32, +len: F32, +stroke: F32, +gap: F32, +y0: F32) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+k:
      +d = Bool.pick(S.Node, Nat.is_lt(i, 51n), dash(i, x, len, stroke, gap, y0), dash_unset())
      d <> dashes(k, 1n+i, x, len, stroke, gap, y0)

# The labels: label[j] sits on dash 10j and reads
# maxUni - ((maxUni - minUni) / (6 - 1)) * j, as a number's toString.
# new createjs.Text("0px Arial", "black") leaves the colour undefined.
def labels(+n: Nat, +j: Nat, +x: F32, +px: S.Ex, +gap: F32, +y0: F32, +max: F32) -> List<&2, S.Node>:
  match n:
    case 0n:
      []
    case 1n+k:
      +y = Num.sharpen((gap * Num.of_nat(Nat.mul(j, 10n)) + y0 : F32))
      +t = Num.show((max - (max - 0.0 : F32) / (6.0 - 1.0 : F32) * Num.of_nat(j) : F32))
      S.label(x, y, t, S.plainx(px, "arial"), "", "right", "middle") <>
        labels(k, 1n+j, x, px, gap, y0, max)

# updateTopUni0N and updateTweensUni0N, with the stage's children in
# setUpUni0N's order: bar, 60 dashes, fill, 6 labels, display, title.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+bar, +w, +h, +sx, _, _, +v, +max, _, +fill}:
      +dash_len = (h * 0.075 : F32)
      +dash_gap = (h * 0.025 : F32)
      +bar_w = (h * 0.075 : F32)
      +bar_h = (h * 0.8 : F32)
      +stroke = (bar_w / 40.0 : F32)
      +text_px = S.ex_div(S.ex(h), S.ex(17.0))
      +display_px = S.ex_div(S.ex(h), S.ex(19.0))
      +title_px = S.ex_div(S.ex(h), S.ex(17.0))
      +bar_x = ((h / 2.0 : F32) - (bar_w / 2.0 : F32) : F32)
      +bar_y = ((h / 2.0 : F32) - (bar_h / 2.0 : F32) : F32)
      +dash_x = ((h / 2.0 : F32) - (bar_w / 2.0 : F32) - dash_len - dash_gap : F32)
      +dash_y = ((h - bar_h) / 2.0 : F32)
      +text_y = (bar_h * (201.0 / 170.0) : F32)
      +title_x = (bar_x * (9.0 / 10.0) : F32)
      +title_y = (bar_h * (1.0 / 17.0) : F32)
      +gap = ((bar_h - dash_y) / (6.0 * 9.0 - 10.0) : F32)
      +fill_h = (T.value(fill, now) * bar_h : F32)
      +fill_y = (bar_h - fill_h + bar_y : F32)
      +label_x = ((dash_x - dash_len) * (6.0 / 5.0) : F32)
      +top = S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""},
        S.GRect{bar_x, bar_y, bar_w, bar_h}])
      +fill_shape = S.shape([S.GFill{S.rgba("0, 71, 183", "0.6")}, S.GStyle{0.0, ""},
        S.GRect{bar_x, fill_y, bar_w, fill_h}])
      +display = S.label(bar_x, text_y, Num.show(v) ++ E.label(e, U.Rainfall{}),
        S.boldx(display_px, "arial"), "", "center", "middle")
      +title_n = S.label_w(title_x, title_y, E.word(e, title(bar)), S.boldx(title_px, "arial"),
        "", "center", "middle", S.max_centred(w, sx, title_x))
      +tail = List.append(&2, S.Node, fill_shape <> labels(6n, 0n, label_x, text_px, gap, dash_y, max),
        [display, title_n])
      S.Scene{sx, 0.0, top <> List.append(&2, S.Node,
        dashes(60n, 0n, dash_x, dash_len, stroke, gap, dash_y), tail)}
