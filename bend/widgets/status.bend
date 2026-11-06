# Status (canvas Status01, widgetList "status"): a blinking circle coloured by
# how the last fetch went, the station's status text (clientraw[49]) and
# "station | Data at: time | date" (clientraw[32], [74]).
#
# Unlike the other widgets it is drawn on every completed pass of
# tryUpdateWidgets, before the data events, whether or not data changed;
# checkDataStatus reads the four dataCollectError flags and noDataChanged,
# so data takes them as arguments.
#
# The circle: createjs.Tween.get(circRad, {loop: -1}).to({percent: 100},
# 2500, quartInOut), started in setUpS01. TweenJS loops by taking the
# position modulo the duration, so percent = 100 * quartInOut(phase / 2500)
# with phase = (now - t0) mod 2500, t0 the time setUp ran (init's now).
#
# Its colour: drawStatusS01 only sets blinkColour; updateTweensS01 copies it
# into the stroke command on a frame where percent < 0.01, which is the
# start of each loop, while the circle has radius 0 and shows nothing.
# So the colour shown lags the data until the next loop starts. Modelled
# here as: the stroke shows `shown` until `pending` (the blinkColour, set at
# time `since`) is copied in at apply(since), the first instant from since on
# with percent < 0.01, i.e. since itself if its phase already has
# percent < 0.01, else the start of the next loop. On new data the stroke's
# colour at that moment becomes `shown`. This treats frames as continuous:
# it differs from the original only if data lands inside the window
# (about the first 149 ms of a loop) and no frame falls in the rest of it.
import Base
import ../lib/num.bend as Num
import ../lib/scene.bend as S
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/tween.bend as T

# w, h: canvas size. t0: when the loop started. shown: the stroke command's
# colour; pending: blinkColour, set at `since`. ts, td: the texts of
# textDisplayS and textDisplayD.
type St is Data:
  St{w: F32, h: F32, t0: U32, shown: String, pending: String, since: U32,
    ts: String, td: String}

def blank() -> String:
  "rgba(100, 100, 100, 0.9)"

# setUpS01: the stroke starts as blankBlinkColour, but blinkColour starts
# null, and the very first frame (percent 0) copies that null in: a stroke
# of null draws nothing (EaselJS's Stroke.exec skips a falsy style), so the
# circle is invisible until the first status arrives. "" stands for null:
# beginStroke("") draws nothing either. Both texts start "", and
# dataStatus starts null, which "" also stands for (Text skips null and "").
def init(+e: E.Env, +now: U32) -> St:
  St{300.0, 150.0, now, blank(), "", now, "", ""}

def tip(+e: E.Env) -> String:
  E.word(e, D.WStatusDescription{})

def phase(+t0: U32, +now: U32) -> U32:
  Bool.pick(U32, (now < t0 : U32), 0, ((now - t0 : U32) % 2500 : U32))

# status01.tweens.circRad.percent at `now`
def percent(+t0: U32, +now: U32) -> F32:
  (100.0 * T.quart_in_out((U32.to_f32(phase(t0, now)) / 2500.0 : F32)) : F32)

def hidden_at(+t0: U32, +now: U32) -> Bool:
  (percent(t0, now) < 0.01 : F32)

# When a blinkColour set at `since` reaches the stroke.
def apply(+t0: U32, +since: U32) -> U32:
  Bool.pick(U32, hidden_at(t0, since), since,
    (since + (2500 - phase(t0, since) : U32) : U32))

def colour(+t0: U32, +shown: String, +pending: String, +since: U32, +now: U32) -> String:
  Bool.pick(String, (now >= apply(t0, since) : U32), pending, shown)

# checkDataStatus. failed: dataCollectErrorCR, CRE, CRH, CRD.
type Status is Data:
  SFull{}
  SPartialOld{}
  SPartialNew{}
  SNoNew{}
  SNormal{}

def all4(+xs: List<&2, Bool>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+x, rest}:
      x && all4(rest)

def any4(+xs: List<&2, Bool>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+x, rest}:
      x || any4(rest)

def check(+failed: List<&2, Bool>, +no_change: Bool) -> Status:
  Bool.pick(Status, all4(failed), SFull{},
    Bool.pick(Status, any4(failed) && no_change, SPartialOld{},
      Bool.pick(Status, any4(failed), SPartialNew{},
        Bool.pick(Status, no_change, SNoNew{}, SNormal{}))))

# s.replace(/_/g, " ")
def unscore(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, t}:
      SCon{Bool.pick(Char, Char.is_eq(c, '_'), ' ', c), unscore(t)}

# On the reversed text: the part before its first "-", and the part after
# it ("" when there is none).
def rev_tail(+r: String) -> String:
  match r:
    case SNil{}:
      ""
    case SCon{+c, t}:
      Bool.pick(String, Char.is_eq(c, '-'), "", SCon{c, rev_tail(t)})

def rev_head(+r: String) -> String:
  match r:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      Bool.pick(String, Char.is_eq(c, '-'), t, rev_head(t))

# s.substring(0, s.lastIndexOf("-")): with no "-" that is substring(0, -1),
# which is "".
def station(+s: String) -> String:
  String.reverse(rev_head(String.reverse(s)))

# s.substring(s.lastIndexOf("-") + 1): the whole text when there is no "-".
def time(+s: String) -> String:
  String.reverse(rev_tail(String.reverse(s)))

def is_undef(+s: String) -> Bool:
  String.eq(s, "undefined")

# Whether drawStatusS01 throws before touching anything: undefined
# .substring (clientraw[32]) or .replace (clientraw[49]), as when
# clientraw has never loaded. The throw also aborts tryUpdateWidgets.
def throws(+e: E.Env) -> Bool:
  is_undef(E.cr(e, 32n)) || is_undef(E.cr(e, 49n))

# Whether it throws later, at stationDate.toString() (clientraw[74]
# undefined), in the branches that build dataStatus: values are stored,
# but neither the colour nor the texts change. The throw also aborts
# tryUpdateWidgets.
def throws_late(+e: E.Env, +s: Status) -> Bool:
  match s:
    case SPartialOld{}:
      False{}
    case SNoNew{}:
      False{}
    case _:
      is_undef(E.cr(e, 74n))

def line(+e: E.Env, +w: D.Phrase) -> String:
  +st = E.cr(e, 32n)
  unscore(station(st)) ++ " | " ++ E.word(e, w) ++ ": " ++ time(st) ++ " | " ++ E.cr(e, 74n)

def status_text(+e: E.Env, +s: Status, +td: String) -> String:
  match s:
    case SFull{}:
      line(e, D.WStatusNoDataSince{})
    case SPartialNew{}:
      line(e, D.WStatusDataAt{})
    case SNormal{}:
      line(e, D.WStatusDataAt{})
    case _:
      td

def blink(+s: Status) -> String:
  match s:
    case SFull{}:
      "rgba(209, 32, 32, 0.9)"
    case SPartialOld{}:
      "rgba(234, 242, 45, 0.9)"
    case SPartialNew{}:
      "rgba(234, 242, 45, 0.9)"
    case SNoNew{}:
      blank()
    case SNormal{}:
      "rgba(23, 145, 27, 0.9)"

def apply_data(+st: St, +e: E.Env, +s: Status, +now: U32) -> St:
  match st:
    case St{+w, +h, +t0, +shown, +pending, +since, _, +td}:
      St{w, h, t0, colour(t0, shown, pending, since, now), blink(s), now,
        unscore(E.cr(e, 49n)), status_text(e, s, td)}

# drawStatusS01(clientraw[49], clientraw[32], clientraw[74]), on every
# completed tryUpdateWidgets pass. failed: [dataCollectErrorCR,
# dataCollectErrorCRE, dataCollectErrorCRH, dataCollectErrorCRD];
# no_change: noDataChanged as just set by that pass.
def data(+st: St, +e: E.Env, +failed: List<&2, Bool>, +no_change: Bool, +now: U32) -> St:
  +s = check(failed, no_change)
  Bool.pick(St, throws(e) || throws_late(e, s), st, apply_data(st, e, s, now))

# resizeCanvasS01: width clientHeight * 6.19, height clientHeight * 0.4.
def resize(+st: St, +b: E.Box) -> St:
  match st b:
    case St{_, _, +t0, +shown, +pending, +since, +ts, +td} E.Box{_, +ph, _, _, _, _}:
      St{Num.cdim(ph, 619.0, 100.0), Num.cdim(ph, 40.0, 100.0), t0, shown, pending,
        since, ts, td}

def width(+st: St) -> F32:
  match st:
    case St{+w, _, _, _, _, _, _, _}:
      w

def height(+st: St) -> F32:
  match st:
    case St{_, +h, _, _, _, _, _, _}:
      h

def circle(+hid: Bool, +col: String, +x: F32, +y: F32, +rad: F32, +stroke: F32, +p: F32) -> S.Node:
  match hid:
    case True{}:
      S.shape([S.GStroke{col}, S.GStyle{0.0, ""}, S.GCircle{x, y, 0.0}])
    case False{}:
      S.shape([S.GStroke{col}, S.GStyle{(stroke * F32.pow((p / 100.0 : F32), 2.0) : F32), ""},
        S.GCircle{x, y, (rad * (p / 100.0 : F32) : F32)}])

# updateTopS01 and updateTweensS01, children in setUpS01's order: circle,
# textDisplayS (top), textDisplayD (bottom).
def view(+st: St, +e: E.Env, +now: U32) -> S.Scene:
  match st:
    case St{+w, +h, +t0, +shown, +pending, +since, +ts, +td}:
      +rad = (h * 0.2 : F32)
      +stroke = (h * 0.2 : F32)
      +px = S.ex_mul(S.ex(h), S.ex(0.4))
      +edge = ((h - rad) / 4.0 : F32)
      +cx = (rad + edge : F32)
      +cy = (h / 2.0 : F32)
      +tx = Num.sharpen(((rad + edge : F32) * 2.0 : F32))
      +yd = Num.sharpen((h * (47.0 / 100.0) : F32))
      +ys = Num.sharpen((h * (53.0 / 100.0) : F32))
      +p = percent(t0, now)
      S.Scene{0.0, 0.0, [
        circle((p < 0.01 : F32), colour(t0, shown, pending, since, now), cx, cy, rad, stroke, p),
        S.label_w(tx, ys, ts, S.plainx(px, "arial"), "black", "left", "top", S.max_left(w, 0.0, tx)),
        S.label_w(tx, yd, td, S.plainx(px, "arial"), "black", "left", "bottom", S.max_left(w, 0.0, tx))]}

# Whether drawStatusS01 throws on this pass, early or late. A throw ends
# tryUpdateWidgets there: no data events, no end to the loading screen.
def aborts(+e: E.Env, +failed: List<&2, Bool>, +no_change: Bool) -> Bool:
  throws(e) || throws_late(e, check(failed, no_change))
