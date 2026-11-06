# Numbers: JavaScript-compatible parsing, rounding and printing for F32.
#
# FreshWDL reads every value out of clientraw files as text and leans on
# JavaScript's Number(), Math.round() and Number.prototype.toString(). These
# defs give the same answers for the values a weather station produces.
#
# Bend matches only on parameters, so a branch on a computed condition is a
# call to a helper that matches its Bool parameter, or a Bool.pick when both
# sides are cheap values.
import Base

def nan() -> F32:
  (0.0 / 0.0 : F32)

def parse.go(+empty: Bool, +t: String) -> F32:
  match empty:
    case True{}:
      0.0
    case False{}:
      Maybe.default(&2, F32, F32.read(t), nan())

# Number(s): trims, reads "" as 0 and anything unreadable as NaN.
def parse(+s: String) -> F32:
  +t = String.trim(s)
  parse.go(String.is_empty(t), t)

def is_nan(+x: F32) -> Bool:
  F32.is_ne(x, x)

def pick(+c: Bool, +a: F32, +b: F32) -> F32:
  Bool.pick(F32, c, a, b)

def pick_s(+c: Bool, +a: String, +b: String) -> String:
  Bool.pick(String, c, a, b)

def pow10(+n: Nat) -> F32:
  match n:
    case 0n:
      1.0
    case 1n+p:
      (10.0 * pow10(p) : F32)

# betterRound(value, decimals): Math.round(value * 10^d) / 10^d. Math.round
# rounds halves up, as F32.round does.
def round_to(+x: F32, +d: Nat) -> F32:
  (F32.round((x * pow10(d) : F32)) / pow10(d) : F32)

# sharpenValue: the half-pixel coordinate that draws a crisp line.
def sharpen(+x: F32) -> F32:
  (F32.round(x) + 0.5 : F32)

# Number.prototype.map from WidgetsHandlers.js.
def map(+x: F32, +in_min: F32, +in_max: F32, +out_min: F32, +out_max: F32) -> F32:
  ((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min : F32)

def min(+a: F32, +b: F32) -> F32:
  pick((a < b : F32), a, b)

def max(+a: F32, +b: F32) -> F32:
  pick((a > b : F32), a, b)

def show.fin(+nan: Bool, +s: String) -> String:
  match nan:
    case True{}:
      "NaN"
    case False{}:
      pick_s(String.eq(s, "inf"), "Infinity",
        pick_s(String.eq(s, "-inf"), "-Infinity",
          pick_s(String.eq(s, "-0"), "0", s)))

# String(x) for a number: F32.show prints the shortest digits that read back
# as the same F32, which is what toString prints for the values we round.
def show(+x: F32) -> String:
  show.fin(is_nan(x), F32.show(x))

# Number(s).toString(): what the original shows after Number(raw).
def norm(+s: String) -> String:
  show(parse(s))

# parseInt(s) for the small integers clientraw holds (trend flags, hours).
def int(+s: String) -> F32:
  F32.trunc(parse(s))

def nat_of.go(+neg: Bool, +x: F32) -> Nat:
  match neg:
    case True{}:
      0n
    case False{}:
      F32.to_nat(x)

def nat_of(+x: F32) -> Nat:
  nat_of.go((x < 0.0 : F32) || is_nan(x), x)

def of_nat(+n: Nat) -> F32:
  F32.from_nat(n)

# canvas.width = px * num / den. A canvas dimension truncates to an integer,
# so the product is taken exactly on integers (F32 holds them exactly below
# 2^24) rather than through a rounded F32 ratio, which could land a hair
# under a whole number that the original's double product reaches.
def cdim(+px: F32, +num: F32, +den: F32) -> F32:
  F32.floor((F32.floor(px) * num / den : F32))
