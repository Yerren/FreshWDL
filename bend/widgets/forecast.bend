# Forecast (div forecastText, modal forecastModal): clientrawextra[531] as
# text, cut down word by word with a "show more" link until it fits, and in
# full in the modal. WidgetsHandlers.js's forecastInitFor01,
# formatAndDisplayForecastFor01 and resizeDivFor01.
import Base
import ../lib/num.bend as Num
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/cmd.bend as C

# stored: forecast.storedTextInput, the text last shown (underscores still
# in, "---" already ""). broken: storedTextInput is undefined (the field was
# missing), so every format throws before it shows anything.
type St is Data:
  St{stored: String, broken: Bool}

# A data event's new state and what it does.
type FOut is Data:
  FOut{st: St, cmds: +List<C.Cmd>}

def init(+e: E.Env) -> St:
  St{"Waiting for data...", False{}}

def enabled(+e: E.Env) -> Bool:
  E.on(e, "forecastHandler.enabled")

# textInput.replace(/_/g, " ")
def spaces(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      SCon{Bool.pick(Char, Char.is_eq(c, '_'), ' ', c), spaces(t)}

# editedText.slice(0, -n): "" once n reaches the length.
def cut(+s: String, +n: Nat) -> String:
  String.take(s, Nat.sub(String.length(s), n))

# The innerHTML each turn of the while loop sets: textArray.pop() takes the
# last word, editedText loses that word's length plus one, and the link goes
# after it. ws: the words, last first.
def cands(+ws: List<&2, String>, +edited: String, +more: String) -> List<&2, String>:
  match ws:
    case Nil{}:
      []
    case Con{+w, +rest}:
      +e2 = cut(edited, Nat.add(String.length(w), 1n))
      (e2 ++ more) <> cands(rest, e2, more)

# formatAndDisplayForecastFor01 on a text that is a string: the modal gets
# it all; the div tries it all, then each shortened version in turn, until it
# no longer overflows (or the words run out, leaving the last).
def show(+e: E.Env, +text: String) -> List<&2, C.Cmd>:
  +orig = spaces(text)
  +more = "... <a id=\"showMoreLink\", href=\"#\"> " ++ E.word(e, D.WForcastShowMore{}) ++ " </a>"
  +ws = List.reverse(&2, String, String.split(orig, ' '))
  [C.CHtml{"modalForecastDiv", orig},
   C.CFit{"forecastText", "innerHTML", orig <> cands(ws, orig, more), C.FitsInside{}}]

# forecastInitFor01's commands: the header and the hidden modal. The
# original then calls resizeDivFor01 itself: the lead's first layout does.
def start(+e: E.Env) -> List<&2, C.Cmd>:
  Bool.pick(List<&2, C.Cmd>, enabled(e),
    [C.CHtml{"forecastHeaderText", E.word(e, D.WForecastTitle{})},
     C.CStyle{"forecastModal", "display", "none"}], [])

def has.go(+missing: Bool, +st: St, +e: E.Env, +t: String) -> FOut:
  match missing:
    case True{}:
      FOut{St{t, True{}}, []}
    case False{}:
      +t2 = Bool.pick(String, String.eq(t, "---"), "", t)
      FOut{St{t2, False{}}, show(e, t2)}

def cre_length(+e: E.Env) -> Nat:
  match e:
    case E.Env{_, +cre, _, _, _, _, _, _}:
      List.length(&2, String, cre)

# clientRawExtraDataUpdate: formatAndDisplayForecastFor01(arrayClientrawExtra[531]).
# A file too short to have field 531 hands undefined over, which throws at
# .replace, leaving the divs as they were and the stored text undefined.
def data.go(+on: Bool, +st: St, +e: E.Env) -> FOut:
  match on:
    case False{}:
      FOut{st, []}
    case True{}:
      has.go(Nat.is_le(cre_length(e), 531n), st, e, E.cre(e, 531n))

def data(+st: St, +e: E.Env) -> FOut:
  data.go(enabled(e), st, e)

# setAttribute("style", "width:..;height:..") then style.width, style.height.
def size(+id: String, +w: F32, +h: F32) -> List<&2, C.Cmd>:
  +ws = Num.show(w) ++ "px"
  +hs = Num.show(h) ++ "px"
  [C.CAttr{id, "style", "width:" ++ ws ++ ";height:" ++ hs},
   C.CStyle{id, "width", ws}, C.CStyle{id, "height", hs}]

def redo(+st: St, +e: E.Env) -> List<&2, C.Cmd>:
  match st:
    case St{+stored, +broken}:
      Bool.pick(List<&2, C.Cmd>, broken, [], show(e, stored))

# resizeDivFor01. b: forecastText's box (pw, ph: its parent's client size;
# vw, vh: document.documentElement's). The div is 6.19 by 0.59 times the
# parent's height; the setAttribute drops the markup's overflow:hidden. The
# modal's div is 0.8 by 0.4 times the smaller viewport side. Then the stored
# text is shown again to fit the new size.
def resize.go(+on: Bool, +st: St, +e: E.Env, +b: E.Box) -> List<&2, C.Cmd>:
  match on:
    case False{}:
      []
    case True{}:
      match b:
        case E.Box{_, +ph, _, _, +vw, +vh}:
          +side = Bool.pick(F32, (vh <= vw : F32), vh, vw)
          List.append(&2, C.Cmd, size("forecastText", (ph * 1.0 * 6.19 : F32), (ph * 1.0 * 0.59 : F32)),
            List.append(&2, C.Cmd, size("modalForecastDiv", (side * 0.4 * 2.0 : F32), (side * 0.4 : F32)),
              redo(st, e)))

def resize(+st: St, +e: E.Env, +b: E.Box) -> List<&2, C.Cmd>:
  resize.go(enabled(e), st, e, b)

# Clicks: the show-more link opens the modal, its x closes it. Clicking the
# modal's background does nothing: initModalHandler's window.onclick (the
# graph modal's) replaced forecastInitFor01's.
def click(+e: E.Env, +id: String) -> List<&2, C.Cmd>:
  Bool.pick(List<&2, C.Cmd>, enabled(e) && String.eq(id, "showMoreLink"),
    [C.CStyle{"forecastModal", "display", "block"}],
    Bool.pick(List<&2, C.Cmd>, enabled(e) && String.eq(id, "forecastClose"),
      [C.CStyle{"forecastModal", "display", "none"}], []))
