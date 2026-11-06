# Scenes: what a widget draws on its canvas, as data.
#
# The original widgets build EaselJS shapes and texts once, then poke new
# numbers into their commands every frame. Here a widget's view returns the
# whole picture each frame, as the same EaselJS calls in the same order, and
# the host replays them onto a createjs.Stage. Same calls, same pixels.
import Base

# One EaselJS Graphics call.
type Gfx is Data:
  GStroke{color: String}                                 # beginStroke
  GFill{color: String}                                   # beginFill
  GStyle{width: F32, caps: String}                       # setStrokeStyle; "" caps = default
  GMove{x: F32, y: F32}                                  # moveTo
  GLine{x: F32, y: F32}                                  # lineTo
  GCircle{x: F32, y: F32, r: F32}                        # drawCircle
  GRect{x: F32, y: F32, w: F32, h: F32}                  # drawRect
  GRoundRect{x: F32, y: F32, w: F32, h: F32, r: F32}     # drawRoundRect
  GArc{x: F32, y: F32, r: F32, a0: F32, a1: F32, ccw: Bool} # arc
  GClosePath{}                                           # closePath

# A display object's transform: x, y, rotation (degrees), registration point.
type Xf is Data:
  Xf{x: F32, y: F32, rot: F32, regx: F32, regy: F32, visible: Bool}

type Node is Data:
  # mask: the graphics of the mask shape; [] means no mask
  NShape{xf: Xf, gfx: +List<Gfx>, mask: +List<Gfx>}
  # maxw: Text.maxWidth; 0 means none, as in EaselJS
  NLabel{xf: Xf, text: String, font: String, color: String, align: String, base: String, maxw: F32}

# A stage: its own offset and its children, back to front.
type Scene is Data:
  Scene{x: F32, y: F32, nodes: +List<Node>}

def at(+x: F32, +y: F32) -> Xf:
  Xf{x, y, 0.0, 0.0, 0.0, True{}}

def origin() -> Xf:
  at(0.0, 0.0)

def hidden() -> Xf:
  Xf{0.0, 0.0, 0.0, 0.0, 0.0, False{}}

def shape(+gfx: +List<Gfx>) -> Node:
  NShape{origin(), gfx, []}

def shape_at(+xf: Xf, +gfx: +List<Gfx>) -> Node:
  NShape{xf, gfx, []}

def masked(+gfx: +List<Gfx>, +mask: +List<Gfx>) -> Node:
  NShape{origin(), gfx, mask}

def label(+x: F32, +y: F32, +text: String, +font: String, +color: String, +align: String, +base: String) -> Node:
  NLabel{at(x, y), text, font, color, align, base, 0.0}

def label_w(+x: F32, +y: F32, +text: String, +font: String, +color: String, +align: String, +base: String, +maxw: F32) -> Node:
  NLabel{at(x, y), text, font, color, align, base, maxw}

# "bold " + size + "px arial", the font string the widgets build.
def bold(+px: F32, +family: String) -> String:
  "bold " ++ F32.show(px) ++ "px " ++ family

def plain(+px: F32, +family: String) -> String:
  F32.show(px) ++ "px " ++ family

def rgb(+c: String) -> String:
  "rgb(" ++ c ++ ")"

def rgba(+c: String, +a: String) -> String:
  "rgba(" ++ c ++ ", " ++ a ++ ")"

# setFontMaxWidth for centred text: the widest it may be without leaving the
# canvas, less 5%.
def max_centred(+canvas_w: F32, +stage_x: F32, +x: F32) -> F32:
  +m = F32.min((canvas_w - stage_x - x : F32), (x + stage_x : F32))
  (m * 2.0 * 0.95 : F32)

# setFontMaxWidthLeft for left-aligned text.
def max_left(+canvas_w: F32, +stage_x: F32, +x: F32) -> F32:
  ((canvas_w - stage_x - x) * 0.95 : F32)

# Exact numbers
# -------------
#
# Bend computes in F32, the original in doubles, and a font size is where
# that shows: "16.058823px" and "16.058823529411764px" rasterise a little
# differently. An Ex is a number together with the arithmetic that made it,
# written out; the host redoes that arithmetic in doubles where it builds the
# font, so the size is the original's to the last digit. Write an Ex the way
# the original's expression is written, operation for operation.
type Ex is Data:
  Ex{v: F32, s: String}

# A number as it stands: a canvas dimension, or a constant like 0.15.
def ex(+x: F32) -> Ex:
  Ex{x, F32.show(x)}

def ex_mul(+a: Ex, +b: Ex) -> Ex:
  match a b:
    case Ex{+x, +s} Ex{+y, +t}:
      Ex{(x * y : F32), "(" ++ s ++ "*" ++ t ++ ")"}

def ex_div(+a: Ex, +b: Ex) -> Ex:
  match a b:
    case Ex{+x, +s} Ex{+y, +t}:
      Ex{(x / y : F32), "(" ++ s ++ "/" ++ t ++ ")"}

def ex_add(+a: Ex, +b: Ex) -> Ex:
  match a b:
    case Ex{+x, +s} Ex{+y, +t}:
      Ex{(x + y : F32), "(" ++ s ++ "+" ++ t ++ ")"}

def ex_sub(+a: Ex, +b: Ex) -> Ex:
  match a b:
    case Ex{+x, +s} Ex{+y, +t}:
      Ex{(x - y : F32), "(" ++ s ++ "-" ++ t ++ ")"}

def ex_v(+a: Ex) -> F32:
  match a:
    case Ex{+x, _}:
      x

# "bold " + size + "px arial" with an exact size: the host fills in {...}.
def boldx(+px: Ex, +family: String) -> String:
  match px:
    case Ex{_, +s}:
      "bold {" ++ s ++ "}px " ++ family

def plainx(+px: Ex, +family: String) -> String:
  match px:
    case Ex{_, +s}:
      "{" ++ s ++ "}px " ++ family
