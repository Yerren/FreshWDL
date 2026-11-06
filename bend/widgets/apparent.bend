# Apparent temperature (canvas Apparent01): a rounded box under a title,
# holding clientraw[130] in the current temperature unit.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E

# w, h: the canvas size. old: the reading last drawn, a string once a reading
# has come; fresh: old is still the number 0 it starts as. text: the display.
type St is Data:
  St{w: F32, h: F32, old: String, fresh: Bool, text: String}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, "0", True{}, ""}

def tip(+e: E.Env) -> String:
  E.word(e, D.WApparentDescription{})

# drawApparentA01(tempIn, unitChange): redraws when the reading changed or
# the unit did. The test is JavaScript's loose !=: against the starting 0 it
# compares numbers, after that two strings.
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +old, +fresh, +text}:
      +t = E.cr(e, 130n)
      Bool.pick(St, force || E.changed(fresh, t, old),
        St{w, h, t, False{}, E.reading(e, U.Temp{}, t)}, St{w, h, old, fresh, text})

# resizeCanvasA01: sized off the parent's height.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, old, fresh, text} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 30.0, 100.0), Num.cdim(ph, 17.0, 100.0), old, fresh, text}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _}:
      h

# updateTopA01 plus the stage's children, in setUpA01's order.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, _, _, +text}:
      +rect_w = (w * 0.9 : F32)
      +rect_h = (h * 0.4 : F32)
      +corner = (h * 0.1 : F32)
      +stroke = (w / 40.0 : F32)
      +display_px = S.ex_mul(S.ex(w), S.ex(0.15))
      +title_px = S.ex_mul(S.ex(w), S.ex(0.19))
      +gap = ((w - rect_w) / 2.0 : F32)
      +title_x = Num.sharpen((w * (1.0 / 2.0) : F32))
      +title_y = Num.sharpen((h * (20.0 / 100.0) : F32))
      +text_x = Num.sharpen((w * (1.0 / 2.0) : F32))
      +text_y = Num.sharpen((h * (71.0 / 100.0) : F32))
      S.Scene{0.0, 0.0, [
        S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""},
          S.GRoundRect{gap, (h - rect_h - gap : F32), rect_w, rect_h, corner}]),
        S.label(text_x, text_y, text, S.boldx(display_px, "arial"), "black", "center", "middle"),
        S.label_w(title_x, title_y, E.word(e, D.WApparentTitle{}), S.boldx(title_px, "arial"),
          "black", "center", "middle", S.max_centred(w, 0.0, title_x))]}
