# Rainfall title (canvas TitleRainfall01, widgetList "rainfallTitle"): one
# bold centred word over the rain bars. No data, no tooltip.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/dict.bend as D
import ../lib/env.bend as E

# w, h: the canvas size.
type St is Data:
  St{w: F32, h: F32}

def init(+e: E.Env) -> St:
  St{300.0, 150.0}

# The original makes no Opentip for this canvas.
def tip(+e: E.Env) -> String:
  ""

# It listens to no data event.
def data(+st: St, +e: E.Env, +force: Bool, +now: U32) -> St:
  st

# resizeCanvasTR01: off the parent's height.
def resize(+st: St, +b: E.Box) -> St:
  match b:
    case E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 99.0, 100.0), Num.cdim(ph, 12.0, 100.0)}

def width(+st: St) -> F32:
  match st:
    case St{+w, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h}:
      h

# updateTopTR01. new createjs.Text(useDict("rainfallTitle"), "0px Arial",
# "black"): the colour really is black here.
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h}:
      +size = S.ex_mul(S.ex(w), S.ex(0.1))
      +x = Num.sharpen((w * (1.0 / 2.0) : F32))
      +y = Num.sharpen((h * (1.0 / 2.0) : F32))
      S.Scene{0.0, 0.0, [
        S.label_w(x, y, E.word(e, D.WRainfallTitle{}), S.boldx(size, "arial"),
          "black", "center", "middle", S.max_centred(w, 0.0, x))]}
