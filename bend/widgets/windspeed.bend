# Wind speed bars (canvas WindSpeed01, widgetList.windSpeed, option gustMode):
# two vertical bars, wind (clientraw[1]) and gust, each with a high marker
# (clientraw[113], clientraw[71]), a shared dashed scale 0..maxSpeed that
# grows in steps of 5, and the Beaufort number in a rainbow colour below.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/tween.bend as T

# fresh: no draw yet (valuesOld.windHighSpeedIn / gustHighSpeedIn start
# undefined, so the first call always draws). o_*: valuesOld, the raw
# strings last drawn. spd, gust, wh, gh: values.speedIn, gustIn,
# windHighSpeedIn, gustHighSpeedIn after formatDataToUnit. orig:
# Number(values.speedOrigional), the raw knots the Beaufort number is taken
# from. max: constants.maxSpeed. t_l, t_r, t_wh, t_gh: the four tweens.
type St is Data:
  St{w: F32, h: F32, fresh: Bool, o_spd: String, o_gust: String, o_wh: String,
    o_gh: String, spd: F32, gust: F32, wh: F32, gh: F32, orig: F32, max: F32,
    t_l: T.Tween, t_r: T.Tween, t_wh: T.Tween, t_gh: T.Tween}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, True{}, "0", "0", "0", "0", 0.0, 0.0, 0.0, 0.0, 0.0, 10.0,
    T.still(0.0), T.still(0.0), T.still(1.04), T.still(1.04)}

def tip(+e: E.Env) -> String:
  E.word(e, D.WWindSpeedDescription{})

def up.test(+s: F32, +g: F32, +wh: F32, +gh: F32, +max: F32) -> Bool:
  (s > max : F32) || (g > max : F32) || (wh > max : F32) || (gh > max : F32)

# while (any input > maxSpeed) maxSpeed += largeDashTotal - 1
def up(+fuel: Nat, +go: Bool, +s: F32, +g: F32, +wh: F32, +gh: F32, +max: F32) -> F32:
  match fuel go:
    case 0n _:
      max
    case 1n+f True{}:
      +m = (max + (6.0 - 1.0) : F32)
      up(f, up.test(s, g, wh, gh, m), s, g, wh, gh, m)
    case 1n+f False{}:
      max

def down.test(+s: F32, +g: F32, +wh: F32, +gh: F32, +max: F32) -> Bool:
  +lim = (max - (6.0 - 1.0) : F32)
  (s <= lim : F32) && (g <= lim : F32) && (wh <= lim : F32) && (gh <= lim : F32)
    && (max > 10.0 : F32)

# while (every input <= maxSpeed - 5 && maxSpeed > maxSpeedDEFAULT) maxSpeed -= 5
def down(+fuel: Nat, +go: Bool, +s: F32, +g: F32, +wh: F32, +gh: F32, +max: F32) -> F32:
  match fuel go:
    case 0n _:
      max
    case 1n+f True{}:
      +m = (max - (6.0 - 1.0) : F32)
      down(f, down.test(s, g, wh, gh, m), s, g, wh, gh, m)
    case 1n+f False{}:
      max

def range(+s: F32, +g: F32, +wh: F32, +gh: F32, +max: F32) -> F32:
  +m = up(2000n, up.test(s, g, wh, gh, max), s, g, wh, gh, max)
  down(2000n, down.test(s, g, wh, gh, m), s, g, wh, gh, m)

# drawSpeedBarWS01's body: formatInputWS01 (on the raw strings: the original
# does not Number() them first) and the four tweens.
def apply(+w: F32, +h: F32, +e: E.Env, +s_s: String, +g_s: String, +wh_s: String,
    +gh_s: String, +max: F32, +t_l: T.Tween, +t_r: T.Tween, +t_wh: T.Tween, +t_gh: T.Tween,
    +now: U32) -> St:
  +u = E.units(e)
  +s = U.value(u, U.Wind{}, Num.parse(s_s))
  +g = U.value(u, U.Wind{}, Num.parse(g_s))
  +wh = U.value(u, U.Wind{}, Num.parse(wh_s))
  +gh = U.value(u, U.Wind{}, Num.parse(gh_s))
  +m = range(s, g, wh, gh, max)
  St{w, h, False{}, s_s, g_s, wh_s, gh_s, s, g, wh, gh, Num.parse(s_s), m,
    T.to(t_l, Num.map(s, 0.0, m, 0.0, 1.0), 2000.0, now),
    T.to(t_r, Num.map(g, 0.0, m, 0.0, 1.0), 2000.0, now),
    T.to(t_wh, Num.map(wh, 0.0, m, 1.0, 0.0), 2000.0, now),
    T.to(t_gh, Num.map(gh, 0.0, m, 1.0, 0.0), 2000.0, now)}

# drawSpeedBarWS01(arrayClientraw[1],
#   (widgetList.windSpeed.gustMode.mode === "current") ? arrayClientraw[2] : arrayClientraw[140],
#   arrayClientraw[113], arrayClientraw[71], unitChange)
# on clientRawDataUpdate, and from updateUnits("wind") with unitChange true.
# gustMode is a string, so .mode is undefined and the gust is always
# clientraw[140], whatever gustMode says (both call sites have the quirk).
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +fresh, +o_spd, +o_gust, +o_wh, +o_gh, +spd, +gust, +wh, +gh, +orig, +max,
        +t_l, +t_r, +t_wh, +t_gh}:
      +s_s = E.cr(e, 1n)
      +g_s = E.cr(e, 140n)
      +wh_s = E.cr(e, 113n)
      +gh_s = E.cr(e, 71n)
      +ch = force || fresh || Bool.not(String.eq(s_s, o_spd)) || Bool.not(String.eq(g_s, o_gust))
        || Bool.not(String.eq(wh_s, o_wh)) || Bool.not(String.eq(gh_s, o_gh))
      Bool.pick(St, ch, apply(w, h, e, s_s, g_s, wh_s, gh_s, max, t_l, t_r, t_wh, t_gh, now),
        St{w, h, fresh, o_spd, o_gust, o_wh, o_gh, spd, gust, wh, gh, orig, max,
          t_l, t_r, t_wh, t_gh})

# resizeCanvasWS01: width = clientHeight / 1.5, height = clientHeight.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +fresh, +o_spd, +o_gust, +o_wh, +o_gh, +spd, +gust, +wh, +gh, +orig, +max,
        +t_l, +t_r, +t_wh, +t_gh} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 2.0, 3.0), Num.cdim(ph, 1.0, 1.0), fresh, o_spd, o_gust, o_wh, o_gh,
        spd, gust, wh, gh, orig, max, t_l, t_r, t_wh, t_gh}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _}:
      h

# calculateBeaufort(speedOrigional): Math.min(Math.round(...), 12), NaN
# staying NaN.
def beaufort(+v: F32) -> F32:
  +r = F32.round(F32.pow((v * 0.514444 / 0.836 : F32), (2.0 / 3.0 : F32)))
  Bool.pick(F32, Num.is_nan(r), Num.nan(), F32.min(r, 12.0))

# "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")" for
# makeColorGradient(.42, .42, .42, 0, 2, 4, 10 + beaufortSpeed): the doubles
# JavaScript prints, for each Beaufort number it can be.
def colour(+b: F32) -> String:
  Num.pick_s(F32.is_eq(b, 0.0), "rgb(17.309876903474304,117.44764584217796,247.47278069833118)",
  Num.pick_s(F32.is_eq(b, 1.0), "rgb(1.5416330210948388,169.97127016007448,219.52594437294414)",
  Num.pick_s(F32.is_eq(b, 2.0), "rgb(7.754650499738659,215.19935934587008,175.66987441881878)",
  Num.pick_s(F32.is_eq(b, 3.0), "rgb(34.86896947355163,245.2702710819909,123.52772586285558)",
  Num.pick_s(F32.is_eq(b, 4.0), "rgb(78.17152155308537,254.95701575891434,72.16295747583894)",
  Num.pick_s(F32.is_eq(b, 5.0), "rgb(130.1353653615124,242.57582288704924,30.50390216002502)",
  Num.pick_s(F32.is_eq(b, 6.0), "rgb(181.7280354371606,210.27881765177892,5.791825201585567)",
  Num.pick_s(F32.is_eq(b, 7.0), "rgb(223.98158452324583,163.6799339525753,2.3222321916037174)",
  Num.pick_s(F32.is_eq(b, 8.0), "rgb(249.55141116649295,110.8790885145618,20.69821514044456)",
  Num.pick_s(F32.is_eq(b, 9.0), "rgb(253.99291390771165,61.05423619658508,57.725621746334994)",
  Num.pick_s(F32.is_eq(b, 10.0), "rgb(236.53406132721165,22.866038426121975,106.9682697180647)",
  Num.pick_s(F32.is_eq(b, 11.0), "rgb(200.20958818239785,2.9524486747604897,159.86669762153184)",
  Num.pick_s(F32.is_eq(b, 12.0), "rgb(151.33349138049604,4.774889317454154,207.22598860692983)",
    "rgb(NaN,NaN,NaN)")))))))))))))

def modf(+i: F32, +n: F32) -> F32:
  (i - n * F32.floor((i / n : F32)) : F32)

# dash[i] of 12: updateTopWS01 sets i < 11, large on even i, medium on odd;
# dash[11] keeps setStrokeStyle(0), moveTo(0, 0), lineTo(0, 0).
def dash(+i: F32, +pdx: F32, +pdy: F32, +dl: F32, +sw: F32, +gap: F32) -> S.Node:
  +live = (i < 11.0 : F32)
  +large = F32.is_eq(modf(i, 2.0), 0.0)
  +dy = Num.sharpen((gap * i + pdy : F32))
  +x0 = Bool.pick(F32, large, pdx, (pdx + dl - (dl / 2.0) : F32))
  S.shape([S.GStroke{"black"}, S.GStyle{Bool.pick(F32, live, sw, 0.0), ""},
    S.GMove{Bool.pick(F32, live, x0, 0.0), Bool.pick(F32, live, dy, 0.0)},
    S.GLine{Bool.pick(F32, live, (pdx + dl : F32), 0.0), Bool.pick(F32, live, dy, 0.0)}])

def dashes(+k: Nat, +acc: List<&2, S.Node>, +pdx: F32, +pdy: F32, +dl: F32, +sw: F32,
    +gap: F32) -> List<&2, S.Node>:
  match k:
    case 0n:
      acc
    case 1n+j:
      dashes(j, dash(Num.of_nat(j), pdx, pdy, dl, sw, gap) <> acc, pdx, pdy, dl, sw, gap)

# label[i] of 6, beside the large dash 2i; text maxSpeed - (maxSpeed / 5) * i
def label(+i: F32, +lx: F32, +pdy: F32, +gap: F32, +text_px: S.Ex, +max: F32) -> S.Node:
  +dy = Num.sharpen((gap * (i * 2.0) + pdy : F32))
  S.label(lx, dy, Num.show((max - ((max - 0.0) / (6.0 - 1.0)) * i : F32)),
    S.plainx(text_px, "arial"), "black", "right", "middle")

def labels(+k: Nat, +acc: List<&2, S.Node>, +lx: F32, +pdy: F32, +gap: F32, +text_px: S.Ex,
    +max: F32) -> List<&2, S.Node>:
  match k:
    case 0n:
      acc
    case 1n+j:
      labels(j, label(Num.of_nat(j), lx, pdy, gap, text_px, max) <> acc, lx, pdy, gap, text_px, max)

# updateTopWS01 + updateTweensWS01, children in setUpWS01's order.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, _, _, _, _, _, +spd, +gust, +wh, +gh, +orig, +max, +t_l, +t_r, +t_wh, +t_gh}:
      +stage_x = F32.neg((h / (1.5 * (33.0 / 10.0)) : F32))
      +dl = (h * 0.075 : F32)
      +dg = (h * 0.025 : F32)
      +bw = (h * 0.15 : F32)
      +bh = (h * 0.64 : F32)
      +sw = (bw / 40.0 : F32)
      +text_px = S.ex_div(S.ex(h), S.ex(17.0))
      +tds = S.ex_div(S.ex(h), S.ex(20.0))
      +bf_px = S.ex_div(S.ex(h), S.ex(18.0))
      +lx = ((h / 2.0) - (bw / 2.0) : F32)
      +rx = ((h / 2.0) + (bw / 2.0) : F32)
      +by = ((h / 2.0) - (bh / 2.0) : F32)
      +lab_y = (bh + (h - bh) / 2.0 - h * 0.06 : F32)
      +lmid = (lx + bw / 2.0 : F32)
      +rmid = (rx + bw / 2.0 : F32)
      +title_y = ((h - bh) * (4.0 / 9.0) : F32)
      +pdx = ((h / 2.0) - (bw / 2.0) - dl - dg : F32)
      +pdy = ((h - bh) / 2.0 : F32)
      +hi_wx = Num.sharpen((lx + bw / 2.0 : F32))
      +hi_y = Num.sharpen((bh + (h - bh) / 2.0 : F32))
      +hi_gx = Num.sharpen((rx + bw / 2.0 : F32))
      +sub_y = ((h - bh) * (5.0 / 9.0) : F32)
      +bf_y = (h * (37.0 / 40.0) : F32)
      +gap = (bh / ((6.0 - 1.0) * 2.0) : F32)
      +fl_h = (T.value(t_l, now) * bh : F32)
      +fr_h = (T.value(t_r, now) * bh : F32)
      +wh_y = (T.value(t_wh, now) * bh + by : F32)
      +gh_y = (T.value(t_gh, now) * bh + by : F32)
      +unit = E.label(e, U.Wind{})
      +max_w = (bw * 0.97 : F32)
      +bft = beaufort(orig)
      +top = {[
        S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{sw, ""}, S.GRect{lx, by, bw, bh}]),
        S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{sw, ""}, S.GRect{rx, by, bw, bh}])]
        : List<&2, S.Node>}
      +mid = {[
        S.shape([S.GFill{S.rgb("23, 145, 27")}, S.GStyle{0.0, ""},
          S.GRect{lx, (bh - fl_h + by : F32), bw, fl_h}]),
        S.shape([S.GFill{S.rgb("188, 0, 255")}, S.GStyle{0.0, ""},
          S.GRect{rx, (bh - fr_h + by : F32), bw, fr_h}]),
        S.shape([S.GStroke{S.rgb("23, 145, 27")}, S.GStyle{(sw * 4.0 : F32), ""},
          S.GMove{lx, wh_y}, S.GLine{(lx + bw : F32), wh_y}]),
        S.shape([S.GStroke{S.rgb("188, 0, 255")}, S.GStyle{(sw * 4.0 : F32), ""},
          S.GMove{rx, gh_y}, S.GLine{(rx + bw : F32), gh_y}])]
        : List<&2, S.Node>}
      +texts = {[
        S.label_w(rx, title_y, E.word(e, D.WWindSpeedTitle{}), S.boldx(S.ex_mul(tds, S.ex(1.5)), "arial"),
          "black", "center", "bottom", S.max_centred(w, stage_x, rx)),
        S.label_w(lmid, sub_y, E.word(e, D.WWindSpeedWind{}), S.plainx(tds, "arial"),
          "black", "center", "top", max_w),
        S.label_w(rmid, sub_y, E.word(e, D.WWindSpeedGust{}), S.plainx(tds, "arial"),
          "black", "center", "top", max_w),
        S.label(lmid, lab_y, Num.show(spd) ++ "\n" ++ unit, S.boldx(tds, "arial"),
          "black", "center", "bottom"),
        S.label(rmid, lab_y, Num.show(gust) ++ "\n" ++ unit, S.boldx(tds, "arial"),
          "black", "center", "bottom"),
        S.label_w(rx, bf_y, E.word(e, D.WBeaufortScaleTitle{}) ++ ": " ++ Num.show(bft),
          S.boldx(bf_px, "arial"), colour(bft), "center", "top", S.max_centred(w, stage_x, rx)),
        S.label_w(hi_wx, hi_y, E.word(e, D.WWindSpeedMax{}) ++ ":\n" ++ Num.show(wh),
          S.plainx(tds, "arial"), "black", "center", "top", max_w),
        S.label_w(hi_gx, hi_y, E.word(e, D.WWindSpeedMax{}) ++ ":\n" ++ Num.show(gh),
          S.plainx(tds, "arial"), "black", "center", "top", max_w)]
        : List<&2, S.Node>}
      +scale = dashes(12n, [], pdx, pdy, dl, sw, gap)
      +labs = labels(6n, texts, ((pdx - dl) * (125.0 / 100.0) : F32), pdy, gap, text_px, max)
      S.Scene{stage_x, 0.0,
        List.append(&2, S.Node, top, List.append(&2, S.Node, scale, List.append(&2, S.Node, mid, labs)))}
