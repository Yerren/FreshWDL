# UV bar (canvas UVBar01, widgetList.UV): a vertical bar filled to
# clientraw[79] on a 0 to 16 scale, the reading under it, "16" at its top.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/tween.bend as T

# w, h: the canvas size. uni: uvBar01.values.uniIn, the reading shown
# (formatDataToUnit's number). fill: tweens.barFill.h, 0 to 1.
type St is Data:
  St{w: F32, h: F32, uni: F32, fill: T.Tween}

def init(+e: E.Env) -> St:
  St{300.0, 150.0, 0.0, T.still(0.0)}

def tip(+e: E.Env) -> String:
  E.word(e, D.WUvDescription{})

# drawUVBarUV01(arrayClientraw[79]): no change test, so every
# clientRawDataUpdate restarts the tween (from where it is). Not called by
# updateUnits; force is ignored.
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  match st:
    case St{+w, +h, _, +fill}:
      +x = U.value(E.units(e), U.UV{}, Num.parse(E.cr(e, 79n)))
      St{w, h, x, T.to(fill, Num.map(x, 0.0, 16.0, 0.0, 1.0), 2000.0, now)}

# resizeCanvasUV01: width = clientHeight / 3, height = clientHeight.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +uni, +fill} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 1.0, 3.0), Num.cdim(ph, 1.0, 1.0), uni, fill}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _}:
      h

# updateTopUV01 + updateTweensUV01, children in setUpUV01's order. The texts
# are made with new createjs.Text("0px Arial", "black"): colour undefined.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, +uni, +fill}:
      +stage_x = F32.neg((w / 1.2 : F32))
      +bar_w = (h * 0.075 : F32)
      +bar_h = (h * 0.75 : F32)
      +stroke = (bar_w / 40.0 : F32)
      +display_px = S.ex_div(S.ex(h), S.ex(19.0))
      +title_px = S.ex_div(S.ex(h), S.ex(17.0))
      +max_px = S.ex_div(S.ex(h), S.ex(19.0))
      +bar_x = ((h / 2.0) - (bar_w / 2.0) : F32)
      +bar_y = ((h / 2.0) - (h * 0.8 / 2.0) : F32)
      +text_x = (bar_x + bar_w / 2.0 : F32)
      +text_y = (bar_h * (201.0 / 170.0) : F32)
      +title_x = (bar_x + bar_w / 2.0 : F32)
      +title_y = (bar_h * (1.0 / 17.0) : F32)
      +max_x = (bar_x - bar_w * (1.0 / 4.0) : F32)
      +max_y = ((h - bar_h) / 2.0 : F32)
      +fill_x = ((h / 2.0) - (bar_w / 2.0) : F32)
      +fill_h = (T.value(fill, now) * bar_h : F32)
      +fill_y = (bar_h - fill_h + bar_y : F32)
      S.Scene{stage_x, 0.0, [
        S.shape([S.GStroke{"black"}, S.GFill{"#F6F6F6"}, S.GStyle{stroke, ""},
          S.GRect{bar_x, bar_y, bar_w, bar_h}]),
        S.shape([S.GFill{S.rgb("234, 242, 45")}, S.GStyle{0.0, ""},
          S.GRect{fill_x, fill_y, bar_w, fill_h}]),
        S.label(text_x, text_y, Num.show(uni) ++ E.label(e, U.UV{}),
          S.boldx(display_px, "arial"), "", "center", "middle"),
        S.label_w(title_x, title_y, E.word(e, D.WUvTitle{}), S.boldx(title_px, "arial"),
          "", "center", "middle", S.max_centred(w, stage_x, title_x)),
        S.label(max_x, max_y, "16", S.boldx(max_px, "arial"), "", "right", "middle")]}
