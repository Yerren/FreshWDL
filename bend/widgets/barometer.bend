# Barometer (canvas Barometer01): a rounded box under a title, holding the
# pressure (clientraw[6]) and its hourly trend (clientraw[50]) in the
# current pressure unit.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E

# w, h: the canvas size. old_p, old_t: the readings last drawn; fresh: they
# are still the number 0 they start as. ptext, ttext: textDisplayP and
# textDisplayT.
type St is Data:
  St{w: F32, h: F32, fresh: Bool, old_p: String, old_t: String, ptext: String, ttext: String}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, True{}, "0", "0", "", "RATE"}

def tip(+e: E.Env) -> String:
  E.word(e, D.WBarometerDescription{})

# The trend line: formatDataToUnit(trend) + unit + "/hr", with a "+" in
# front when positive, or the "steady" word when it is 0 (or -0).
def trend_text(+e: E.Env, +tv: F32) -> String:
  +lbl = E.label(e, U.Pressure{})
  +txt = Num.show(tv) ++ lbl ++ "/hr"
  Bool.pick(String, F32.is_ne(tv, 0.0),
    Bool.pick(String, (tv > 0.0 : F32), "+" ++ txt, txt),
    E.word(e, D.WBarometerSteady{}))

# drawBarometerB01(pressureIn, trendIn, unitChange): loose != against the
# remembered raw strings (numbers while they are still the starting 0).
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +fresh, +old_p, +old_t, +ptext, +ttext}:
      +p = E.cr(e, 6n)
      +t = E.cr(e, 50n)
      +go = force || E.changed(fresh, p, old_p) || E.changed(fresh, t, old_t)
      +pv = U.value(E.units(e), U.Pressure{}, Num.parse(p))
      +tv = U.value(E.units(e), U.Pressure{}, Num.parse(t))
      Bool.pick(St, go,
        St{w, h, False{}, p, t, Num.show(pv) ++ E.label(e, U.Pressure{}), trend_text(e, tv)},
        St{w, h, fresh, old_p, old_t, ptext, ttext})

# resizeCanvasB01: both sides are the parent's clientHeight * 0.3.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +fresh, +old_p, +old_t, +ptext, +ttext} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 30.0, 100.0), Num.cdim(ph, 30.0, 100.0), fresh, old_p, old_t, ptext, ttext}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _, _, _}:
      h

# updateTopB01 plus the stage's children, in setUpB01's order.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, _, _, _, +ptext, +ttext}:
      +rect_w = (w * 0.9 : F32)
      +rect_h = (h * 0.67 : F32)
      +corner = (h * 0.1 : F32)
      +stroke = (w / 40.0 : F32)
      +display_px = S.ex_mul(S.ex(w), S.ex(0.125))
      +rate_px = S.ex_mul(S.ex(w), S.ex(0.14))
      +title_px = S.ex_mul(S.ex(w), S.ex(0.19))
      +gap = ((w - rect_w) / 2.0 : F32)
      +cx = Num.sharpen((w * (1.0 / 2.0) : F32))
      +title_y = Num.sharpen((h * (11.0 / 100.0) : F32))
      +p_y = Num.sharpen((h * (40.0 / 100.0) : F32))
      +rate_y = Num.sharpen((h * (60.0 / 100.0) : F32))
      +t_y = Num.sharpen((h * (75.0 / 100.0) : F32))
      S.Scene{0.0, 0.0, [
        S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""},
          S.GRoundRect{gap, (h - rect_h - gap : F32), rect_w, rect_h, corner}]),
        S.label(cx, p_y, ptext, S.boldx(display_px, "arial"), "black", "center", "middle"),
        S.label_w(cx, rate_y, E.word(e, D.WBarometerRate{}) ++ ":", S.boldx(rate_px, "arial"),
          "black", "center", "middle", S.max_centred(w, 0.0, cx)),
        S.label_w(cx, t_y, ttext, S.boldx(display_px, "arial"), "black", "center", "middle",
          (rect_w * 0.97 : F32)),
        S.label_w(cx, title_y, E.word(e, D.WBarometerTitle{}), S.boldx(title_px, "arial"),
          "black", "center", "middle", S.max_centred(w, 0.0, cx))]}
