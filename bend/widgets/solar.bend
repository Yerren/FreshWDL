# Solar bar (canvas SolarBar01, widgetList.solar, option mode): a vertical bar.
# mode "Watt": filled to clientraw[127] in W/m² on a scale with dashes and
# labels that grows (x2, x2, x2.5, ...) to fit; any other mode (the default
# is "percentage"): filled to clientraw[34] as a percentage, with "100%" at
# its top. Sun hours (clientrawextra[696]) underneath in both.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/tween.bend as T

# The Watt scale: constants.maxUni and scalePos. scalePos starts at -1 in
# the original; here it starts at 2, which steps up to 0 the same way, and
# the step down never runs from it (maxUni is still the default 250 then).
type Rng is Data:
  Rng{max: F32, pos: Nat}

# watt: widgetList.solar.mode === "Watt", read once at setUp (it decides
# which shapes exist). fresh: valuesOLD still hold the starting number 0.
# o_pct, o_uni, o_sun: valuesOLD (the raw strings last drawn). uni, pct, sun:
# values.uniIn, percentIn, sunHoursIn as shown. fill: tweens.barFill.h.
type St is Data:
  St{w: F32, h: F32, watt: Bool, fresh: Bool, o_pct: String, o_uni: String,
    o_sun: String, uni: F32, pct: F32, sun: F32, rng: Rng, fill: T.Tween}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, String.eq(E.opt(e, "solar.mode", "percentage"), "Watt"), True{},
    "0", "0", "0", 0.0, 0.0, 0.0, Rng{250.0, 2n}, T.still(0.0)}

def tip(+e: E.Env) -> String:
  E.word(e, D.WSolarDescription{})

# scaleSequence [2.0, 2.0, 2.5]
def seq(+p: Nat) -> F32:
  match p:
    case 0n:
      2.0
    case 1n+q:
      match q:
        case 0n:
          2.0
        case 1n+_:
          2.5

# (p + 1) % 3
def next(+p: Nat) -> Nat:
  match p:
    case 0n:
      1n
    case 1n+q:
      match q:
        case 0n:
          2n
        case 1n+_:
          0n

# ((p - 1) % 3 + 3) % 3
def prev(+p: Nat) -> Nat:
  match p:
    case 0n:
      2n
    case 1n+q:
      match q:
        case 0n:
          0n
        case 1n+_:
          1n

def up.test(+uni: F32, +max: F32) -> Bool:
  (uni > max * 0.9 : F32)

# while (uniIn > maxUni * actualMaxPercent) { scalePos = (scalePos + 1) % 3;
# maxUni *= scaleSequence[scalePos]; }   go: the loop test, already taken.
def up(+fuel: Nat, +go: Bool, +uni: F32, +max: F32, +pos: Nat) -> Rng:
  match fuel go:
    case 0n _:
      Rng{max, pos}
    case 1n+f True{}:
      +m = (max * seq(next(pos)) : F32)
      up(f, up.test(uni, m), uni, m, next(pos))
    case 1n+f False{}:
      Rng{max, pos}

def down.test(+uni: F32, +max: F32, +pos: Nat) -> Bool:
  (uni <= (max / seq(pos)) * 0.9 : F32) && (max > 250.0 : F32)

# while (uniIn <= (maxUni / scaleSequence[scalePos]) * actualMaxPercent &&
# maxUni > maxUniDEFAULT) { maxUni /= scaleSequence[scalePos]; scalePos-- (wrapped) }
def down(+fuel: Nat, +go: Bool, +uni: F32, +max: F32, +pos: Nat) -> Rng:
  match fuel go:
    case 0n _:
      Rng{max, pos}
    case 1n+f True{}:
      +m = (max / seq(pos) : F32)
      down(f, down.test(uni, m, prev(pos)), uni, m, prev(pos))
    case 1n+f False{}:
      Rng{max, pos}

def range.down(+uni: F32, +a: Rng) -> Rng:
  match a:
    case Rng{+m, +p}:
      down(100n, down.test(uni, m, p), uni, m, p)

def range(+uni: F32, +r: Rng) -> Rng:
  match r:
    case Rng{+max, +pos}:
      range.down(uni, up(100n, up.test(uni, max), uni, max, pos))

def rng_max(+r: Rng) -> F32:
  match r:
    case Rng{+m, _}:
      m

# The body of drawSolarBarSol01's if: Number() the inputs, formatInputSol01,
# then the tween. Watt formats uniIn and rescales; otherwise percentIn is
# formatted and uniIn stays Number(uniIn).
def apply(+watt: Bool, +w: F32, +h: F32, +e: E.Env, +pct_s: String, +uni_s: String,
    +sun_s: String, +rng: Rng, +fill: T.Tween, +now: U32) -> St:
  match watt:
    case True{}:
      +uni = U.value(E.units(e), U.Solar{}, Num.parse(uni_s))
      +r = range(uni, rng)
      +out = Num.map(uni, 0.0, rng_max(r), 0.0, 1.0)
      St{w, h, True{}, False{}, pct_s, uni_s, sun_s, uni, Num.parse(pct_s),
        Num.parse(sun_s), r, T.to(fill, out, 2000.0, now)}
    case False{}:
      +pct = U.value(E.units(e), U.Solar{}, Num.parse(pct_s))
      +out = Num.map(pct, 0.0, 100.0, 0.0, 1.0)
      St{w, h, False{}, False{}, pct_s, uni_s, sun_s, Num.parse(uni_s), pct,
        Num.parse(sun_s), rng, T.to(fill, out, 2000.0, now)}

# drawSolarBarSol01(arrayClientraw[34], arrayClientraw[127],
# arrayClientrawExtra[696], unitChange), on clientRawDataUpdate and on
# clientRawExtraDataUpdate. Redraws when any of the three changed (loose !=
# against valuesOLD) or force.
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +watt, +fresh, +o_pct, +o_uni, +o_sun, +uni, +pct, +sun, +rng, +fill}:
      +pct_s = E.cr(e, 34n)
      +uni_s = E.cr(e, 127n)
      +sun_s = E.cre(e, 696n)
      +ch = force || E.changed(fresh, uni_s, o_uni) || E.changed(fresh, pct_s, o_pct)
        || E.changed(fresh, sun_s, o_sun)
      Bool.pick(St, ch, apply(watt, w, h, e, pct_s, uni_s, sun_s, rng, fill, now),
        St{w, h, watt, fresh, o_pct, o_uni, o_sun, uni, pct, sun, rng, fill})

# resizeCanvasSol01: width = clientHeight / 3, height = clientHeight.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +watt, +fresh, +o_pct, +o_uni, +o_sun, +uni, +pct, +sun, +rng, +fill} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 1.0, 3.0), Num.cdim(ph, 1.0, 1.0), watt, fresh, o_pct, o_uni, o_sun,
        uni, pct, sun, rng, fill}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _, _, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _, _, _, _, _, _, _, _}:
      h

# i - 10 * floor(i / 10) for the small whole numbers we index with
def modf(+i: F32, +n: F32) -> F32:
  (i - n * F32.floor((i / n : F32)) : F32)

# dash[i]: beginStroke, setStrokeStyle, moveTo, lineTo. updateTopSol01 only
# touches i < 51 with i % 10 == 0 (large) or i % 5 == 0 (medium); the rest
# keep setStrokeStyle(0), moveTo(0, 0), lineTo(0, 0).
def dash(+i: F32, +pdx: F32, +pdy: F32, +dl: F32, +sw: F32, +gap: F32) -> S.Node:
  +live = (i < 51.0 : F32)
  +large = live && F32.is_eq(modf(i, 10.0), 0.0)
  +med = live && Bool.not(large) && F32.is_eq(modf(i, 5.0), 0.0)
  +any = large || med
  +dy = Num.sharpen((gap * i + pdy : F32))
  +x0 = Bool.pick(F32, large, pdx, Bool.pick(F32, med, (pdx + dl - (dl / 2.0) : F32), 0.0))
  +x1 = Bool.pick(F32, any, (pdx + dl : F32), 0.0)
  +y = Bool.pick(F32, any, dy, 0.0)
  S.shape([S.GStroke{"black"}, S.GStyle{Bool.pick(F32, any, sw, 0.0), ""},
    S.GMove{x0, y}, S.GLine{x1, y}])

# label[i]: new createjs.Text("0px Arial", "black") (text "0px Arial", font
# "black", colour undefined); updateTopSol01 places labels 0 to 5 by the large
# dashes and updateTweensSol01 sets their text to the scale's numbers.
def label(+i: F32, +pdx: F32, +pdy: F32, +dl: F32, +gap: F32, +text_px: S.Ex, +max: F32) -> S.Node:
  +live = (i < 6.0 : F32)
  +dy = Num.sharpen((gap * (i * 10.0) + pdy : F32))
  +lx = ((pdx - dl) * (12.0 / 11.0) : F32)
  +n = (max - ((max - 0.0) / (6.0 - 1.0)) * i : F32)
  S.label(Bool.pick(F32, live, lx, 0.0), Bool.pick(F32, live, dy, 0.0),
    Bool.pick(String, live, Num.show(n), "0px Arial"),
    Bool.pick(String, live, S.plainx(text_px, "arial"), "black"), "", "right", "middle")

# The 60 dashes and labels, added in pairs; k counts down so the list is
# built back to front.
def scale(+k: Nat, +acc: List<&2, S.Node>, +pdx: F32, +pdy: F32, +dl: F32, +sw: F32,
    +gap: F32, +text_px: S.Ex, +max: F32) -> List<&2, S.Node>:
  match k:
    case 0n:
      acc
    case 1n+j:
      +i = Num.of_nat(j)
      scale(j, dash(i, pdx, pdy, dl, sw, gap) <> (label(i, pdx, pdy, dl, gap, text_px, max) <> acc),
        pdx, pdy, dl, sw, gap, text_px, max)

# The children after the bar's outline, by mode.
def rest(+watt: Bool, +e: E.Env, +w: F32, +h: F32, +stage_x: F32, +display: String,
    +pct: F32, +sun_t: String, +max: F32, +fill_n: S.Node, +title: S.Node) -> List<&2, S.Node>:
  match watt:
    case True{}:
      +bar_w = (h * 0.075 : F32)
      +bar_h = (h * 0.75 : F32)
      +bar_x = ((h / 2.0) - (bar_w / 2.0) : F32)
      +tds = S.ex_div(S.ex(h), S.ex(21.0))
      +mid_x = (bar_x + bar_w / 2.0 : F32)
      +sun_x = (bar_x + bar_w / 3.0 : F32)
      +dl = (h * 0.04 : F32)
      +dg = (h * 0.025 : F32)
      +pdx = ((h / 2.0) - (bar_w / 2.0) - dl - dg : F32)
      +pdy = ((h - bar_h) * 0.41 : F32)
      +gap = ((bar_h - pdy) / ((6.0 * 9.0) - 10.5) : F32)
      +text_px = S.ex_div(S.ex(h), S.ex(20.0))
      +sun_y = (bar_h * (201.0 / 162.0) : F32)
      List.append(&2, S.Node, scale(60n, [], pdx, pdy, dl, (bar_w / 40.0 : F32), gap, text_px, max), [
        fill_n,
        S.label(mid_x, (bar_h * (201.0 / 170.0) : F32), display, S.boldx(tds, "arial"), "",
          "center", "middle"),
        S.label_w(sun_x, sun_y, sun_t, S.plainx(S.ex_mul(tds, S.ex(0.9)), "arial"), "", "center",
          "middle", S.max_centred(w, stage_x, sun_x)),
        title])
    case False{}:
      +bar_w = (h * 0.075 : F32)
      +bar_h = (h * 0.75 : F32)
      +bar_x = ((h / 2.0) - (bar_w / 2.0) : F32)
      +tds = S.ex_div(S.ex(h), S.ex(21.0))
      +mid_x = (bar_x + bar_w / 2.0 : F32)
      +sun_x = (bar_x + bar_w / 3.0 : F32)
      +max_px = S.ex_div(S.ex(h), S.ex(19.0))
      +sun_y = (bar_h * (201.0 / 155.0) : F32)
      [fill_n,
        S.label(mid_x, (bar_h * (201.0 / 162.0) : F32), display, S.boldx(tds, "arial"), "",
          "center", "middle"),
        S.label(mid_x, (bar_h * (201.0 / 170.0) : F32), Num.show(pct) ++ "%",
          S.boldx(tds, "arial"), "", "center", "middle"),
        S.label_w(sun_x, sun_y, sun_t, S.plainx(S.ex_mul(tds, S.ex(0.9)), "arial"), "", "center",
          "middle", S.max_centred(w, stage_x, sun_x)),
        title,
        S.label((bar_x - bar_w * (1.0 / 4.0) : F32), ((h - bar_h) / 2.0 : F32), "100%",
          S.boldx(max_px, "arial"), "", "right", "middle")]

# updateTopSol01 + updateTweensSol01, children in setUpSol01's order.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, +watt, _, _, _, _, +uni, +pct, +sun, +rng, +fill}:
      +stage_x = F32.neg((w / 1.2 : F32))
      +bar_w = (h * 0.075 : F32)
      +bar_h = (h * 0.75 : F32)
      +stroke = (bar_w / 40.0 : F32)
      +bar_x = ((h / 2.0) - (bar_w / 2.0) : F32)
      +bar_y = ((h / 2.0) - (h * 0.8 / 2.0) : F32)
      +fill_h = (T.value(fill, now) * bar_h : F32)
      +fill_y = (bar_h - fill_h + bar_y : F32)
      +fill_n = S.shape([S.GFill{S.rgb("245, 193, 18")}, S.GStyle{0.0, ""},
        S.GRect{((h / 2.0) - (bar_w / 2.0) : F32), fill_y, bar_w, fill_h}])
      +title_px = S.ex_div(S.ex(h), S.ex(17.0))
      +mid_x = (bar_x + bar_w / 2.0 : F32)
      +title_y = (h * 0.8 * (1.0 / 17.0) : F32)
      +display = Num.show(uni) ++ E.label(e, U.Solar{})
      +sun_t = E.word(e, D.WSolarSunHours{}) ++ ": " ++ Num.show(sun)
      # setFontMaxWidth(textTitle, canvas, stage, true): the original may
      # re-centre the title when it measures wider than maxWidth (not modelled)
      +title = S.label_w(mid_x, title_y, E.word(e, D.WSolarTitle{}), S.boldx(title_px, "arial"),
        "", "center", "middle", S.max_centred(w, stage_x, mid_x))
      S.Scene{stage_x, 0.0,
        S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""},
          S.GRect{bar_x, bar_y, bar_w, bar_h}])
        <> rest(watt, e, w, h, stage_x, display, pct, sun_t, rng_max(rng), fill_n, title)}
