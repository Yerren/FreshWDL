# Moon and sun (canvas MoonSun01, widgetList "moonSun"): a rounded box with
# sun rise/set and moon rise/set/phase/age, clientrawextra[556..561].
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/dict.bend as D
import ../lib/env.bend as E

# The six fields as last drawn (the original's valuesOld).
type Six is Data:
  Six{sr: String, ss: String, mr: String, ms: String, mp: String, ma: String}

# w, h: the canvas size. old: the inputs last drawn. txt: the six texts
# shown, in the order SR, SS, MR, MS, MP, MA.
type St is Data:
  St{w: F32, h: F32, old: Six, txt: Six}

# valuesOld is keyed sunRise, sunSet, ... but drawMoonSunMS01 compares and
# stores sunRiseIn, sunSetIn, ...: those start undefined, which the string
# "undefined" stands for (a field past the end of clientrawextra reads as
# "undefined" too, and undefined != undefined is false, as String.eq says).
# The starting texts are setUpMS01's placeholders, never translated.
def init(+e: E.Env) -> St:
  St{300.0, 150.0,
    Six{"undefined", "undefined", "undefined", "undefined", "undefined", "undefined"},
    Six{"Rise: 24:59", "Set: 24:59", "Rise: 24:59", "Set: 24:59", "100%", "33"}}

# The original makes no Opentip for this canvas.
def tip(+e: E.Env) -> String:
  ""

def fresh(+e: E.Env) -> Six:
  Six{E.cre(e, 556n), E.cre(e, 557n), E.cre(e, 558n), E.cre(e, 559n),
    E.cre(e, 560n), E.cre(e, 561n)}

def differs(+a: Six, +b: Six) -> Bool:
  match a b:
    case Six{+a1, +a2, +a3, +a4, +a5, +a6} Six{+b1, +b2, +b3, +b4, +b5, +b6}:
      Bool.not(String.eq(a1, b1)) || Bool.not(String.eq(a2, b2)) ||
        Bool.not(String.eq(a3, b3)) || Bool.not(String.eq(a4, b4)) ||
        Bool.not(String.eq(a5, b5)) || Bool.not(String.eq(a6, b6))

def texts(+e: E.Env, +v: Six) -> Six:
  match v:
    case Six{+sr, +ss, +mr, +ms, +mp, +ma}:
      +rise = E.word(e, D.WMoonSunRise{})
      +set = E.word(e, D.WMoonSunSet{})
      Six{rise ++ ": " ++ sr, set ++ ": " ++ ss, rise ++ ": " ++ mr,
        set ++ ": " ++ ms, E.word(e, D.WMoonSunPhase{}) ++ ": " ++ mp ++ "%",
        E.word(e, D.WMoonSunAge{}) ++ ": " ++ ma}

# drawMoonSunMS01(cre[556], ..., cre[561]) on clientRawExtraDataUpdate.
# force: unitChange; nothing ever passes true (updateUnits does not call it).
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, +old, +txt}:
      +v = fresh(e)
      Bool.pick(St, differs(v, old) || force,
        St{w, h, v, texts(e, v)}, St{w, h, old, txt})

# resizeCanvasMS01: a square the parent's height.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +old, +txt} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 1.0, 1.0), Num.cdim(ph, 1.0, 1.0), old, txt}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _}:
      h

# A bold centred line of the box; setMaxWidthGivenWidth(t, rectWidth) gives
# maxWidth = rectWidth * 0.97.
def line(+x: F32, +y: F32, +t: String, +px: S.Ex, +maxw: F32) -> S.Node:
  S.label_w(x, y, t, S.boldx(px, "arial"), "black", "center", "middle", maxw)

# updateTopMS01 plus the stage's children, in setUpMS01's order: the box,
# the six readings, then the two titles.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, _, +txt}:
      match txt:
        case Six{+sr, +ss, +mr, +ms, +mp, +ma}:
          +rect_w = (w * 0.9 : F32)
          +rect_h = (h * 0.9 : F32)
          +corner = (h * 0.1 : F32)
          +stroke = (w / 40.0 : F32)
          +disp_px = S.ex_div(S.ex(h), S.ex(10.0))
          +title_px = S.ex_div(S.ex(h), S.ex(9.0))
          +x = Num.sharpen((w * (1.0 / 2.0) : F32))
          +maxw = (rect_w * 0.97 : F32)
          +y_sun = Num.sharpen((h * (13.0 / 100.0) : F32))
          +y_moon = Num.sharpen((h * (47.0 / 100.0) : F32))
          +y_sr = Num.sharpen((h * (23.0 / 100.0) : F32))
          +y_ss = Num.sharpen((h * (33.0 / 100.0) : F32))
          +y_mr = Num.sharpen((h * (57.0 / 100.0) : F32))
          +y_ms = Num.sharpen((h * (67.0 / 100.0) : F32))
          +y_mp = Num.sharpen((h * (77.0 / 100.0) : F32))
          +y_ma = Num.sharpen((h * (87.0 / 100.0) : F32))
          S.Scene{0.0, 0.0, [
            S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""},
              S.GRoundRect{((w - rect_w) / 2.0 : F32), ((h - rect_h) / 2.0 : F32),
                rect_w, rect_h, corner}]),
            line(x, y_sr, sr, disp_px, maxw),
            line(x, y_ss, ss, disp_px, maxw),
            line(x, y_mr, mr, disp_px, maxw),
            line(x, y_ms, ms, disp_px, maxw),
            line(x, y_mp, mp, disp_px, maxw),
            line(x, y_ma, ma, disp_px, maxw),
            line(x, y_sun, E.word(e, D.WMoonSunTitleSun{}), title_px, maxw),
            line(x, y_moon, E.word(e, D.WMoonSunTitleMoon{}), title_px, maxw)]}
