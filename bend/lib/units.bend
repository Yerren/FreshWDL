# Units: the `units` table, `currentUnits` and formatDataToUnit from Globals.js.
import Base
import ./num.bend as Num

type Measure is Data:
  Pressure{}
  Altitude{}
  Wind{}
  WindDirection{}
  Rainfall{}
  Humidity{}
  Solar{}
  UV{}
  Temp{}

# currentUnits: the key of each kind's current unit
type Units is Data:
  Units{pressure: String, altitude: String, wind: String, rainfall: String,
    wind_direction: String, humidity: String, solar: String, uv: String,
    temp: String}

# One unit: [multiplier, display, decimals to round to]
type Scale is Data:
  Scale{key: String, mult: F32, display: String, dec: Nat}

def defaults() -> Units:
  Units{"hPa", "m", "kmh", "mm", "deg", "percent", "Wm", "noUnit", "celsius"}

# Keys in the order the original object literal lists them; changeUnit walks
# this order.
def table(+k: Measure) -> List<&2, Scale>:
  match k:
    case Pressure{}:
      [Scale{"hPa", 1.0, "hPa", 1n}, Scale{"mmHG", 0.750061561303, "mmHG", 1n},
        Scale{"kPa", 0.1, "kPa", 2n}, Scale{"inHg", 0.0295299830714, "inHg", 2n},
        Scale{"mb", 1.0, "mb", 1n}]
    case Altitude{}:
      [Scale{"m", 0.3048, "m", 0n}, Scale{"yds", 0.333333, "yds", 0n},
        Scale{"ft", 1.0, "ft", 0n}]
    case Wind{}:
      [Scale{"kmh", 1.852, "km/h", 1n}, Scale{"mph", 1.15078, "mph", 1n},
        Scale{"kts", 1.0, "kts", 1n}, Scale{"ms", 0.514444, "m/s", 1n},
        Scale{"B", 1.0, "BFT", 1n}]
    case WindDirection{}:
      [Scale{"deg", 1.0, "°", 0n}]
    case Rainfall{}:
      [Scale{"mm", 1.0, "mm", 1n}, Scale{"inch", 0.0393701, "in", 2n}]
    case Humidity{}:
      [Scale{"percent", 1.0, "%", 0n}]
    case Solar{}:
      [Scale{"Wm", 1.0, "W/m²", 1n}]
    case UV{}:
      [Scale{"noUnit", 1.0, " ", 1n}]
    case Temp{}:
      [Scale{"celsius", 1.0, "°C", 1n}, Scale{"fahrenheit", 1.0, "°F", 1n}]

def current(+u: Units, +k: Measure) -> String:
  match u:
    case Units{+p, +a, +w, +r, +d, +h, +s, +v, +t}:
      match k:
        case Pressure{}:
          p
        case Altitude{}:
          a
        case Wind{}:
          w
        case WindDirection{}:
          d
        case Rainfall{}:
          r
        case Humidity{}:
          h
        case Solar{}:
          s
        case UV{}:
          v
        case Temp{}:
          t

def key_of(+u: Scale) -> String:
  match u:
    case Scale{+k, _, _, _}:
      k

def find(+key: String, +us: List<&2, Scale>) -> Scale:
  match us:
    case Nil{}:
      Scale{key, 1.0, "", 0n}
    case Con{+u, rest}:
      Bool.pick(Scale, String.eq(key_of(u), key), u, find(key, rest))

def unit(+u: Units, +k: Measure) -> Scale:
  find(current(u, k), table(k))

def display_of(+s: Scale) -> String:
  match s:
    case Scale{_, _, display, _}:
      display

# units[kind][currentUnits[kind]][1]: the label shown after a value
def label(+u: Units, +k: Measure) -> String:
  display_of(unit(u, k))

def is_temp(+k: Measure) -> Bool:
  match k:
    case Temp{}:
      True{}
    case _:
      False{}

# calculateBeaufort: v in knots
def beaufort(+v: F32) -> F32:
  F32.min(F32.round(F32.pow((v * 0.514444 / 0.836 : F32), (2.0 / 3.0 : F32))), 12.0)

# Widen the rounding until a nonzero value shows, up to 5 decimals; a NaN
# reads as 0. `fuel` counts the decimals left to try.
def nonzero(+fuel: Nat, +y: F32, +dec: Nat) -> F32:
  match fuel:
    case 0n:
      0.0
    case 1n+f:
      +r0 = Num.round_to(y, dec)
      +r = Bool.pick(F32, Num.is_nan(r0), 0.0, r0)
      Bool.pick(F32, F32.is_ne(r, 0.0) || Nat.is_ge(dec, 5n), r,
        nonzero(f, y, 1n+dec))

def value.go(+un: Scale, +temp: Bool, +fah: Bool, +bft: Bool, +x: F32) -> F32:
  match un:
    case Scale{_, +mult, _, +dec}:
      match temp:
        case True{}:
          Bool.pick(F32, fah, Num.round_to((x * (9.0 / 5.0) + 32.0 : F32), dec), x)
        case False{}:
          Bool.pick(F32, bft, beaufort(x),
            Bool.pick(F32, F32.is_eq(x, 0.0), Num.round_to((x * mult : F32), dec),
              nonzero(6n, (x * mult : F32), dec)))

# formatDataToUnit's numeric answer. `x` is Number(dataIn).
def value(+u: Units, +k: Measure, +x: F32) -> F32:
  value.go(unit(u, k), is_temp(k), String.eq(current(u, k), "fahrenheit"),
    String.eq(current(u, k), "B"), x)

# formatDataToUnit(dataIn) shown as text, for a dataIn that is still the raw
# clientraw string: Celsius passes that string through untouched.
def show_raw(+u: Units, +k: Measure, +raw: String) -> String:
  Bool.pick(String, is_temp(k) && String.eq(current(u, k), "celsius"), raw,
    Num.show(value(u, k, Num.parse(raw))))

# formatDataToUnit(Number(dataIn)) shown as text.
def show(+u: Units, +k: Measure, +x: F32) -> String:
  Num.show(value(u, k, x))

# value + unit label, the way most widgets print a reading
def with_label(+u: Units, +k: Measure, +raw: String) -> String:
  show_raw(u, k, raw) ++ label(u, k)

# changeUnit: the key after `key` in the table, wrapping round to the first.
def next(+us: List<&2, Scale>, +key: String, +first: String, +hit: Bool) -> String:
  match us:
    case Nil{}:
      first
    case Con{+u, rest}:
      Bool.pick(String, hit, key_of(u),
        next(rest, key, first, String.eq(key_of(u), key)))

def first_key(+us: List<&2, Scale>) -> String:
  match us:
    case Nil{}:
      ""
    case Con{+u, _}:
      key_of(u)

def set(+u: Units, +k: Measure, +key: String) -> Units:
  match u:
    case Units{p, a, w, r, d, h, s, v, t}:
      match k:
        case Pressure{}:
          Units{key, a, w, r, d, h, s, v, t}
        case Altitude{}:
          Units{p, key, w, r, d, h, s, v, t}
        case Wind{}:
          Units{p, a, key, r, d, h, s, v, t}
        case WindDirection{}:
          Units{p, a, w, r, key, h, s, v, t}
        case Rainfall{}:
          Units{p, a, w, key, d, h, s, v, t}
        case Humidity{}:
          Units{p, a, w, r, d, key, s, v, t}
        case Solar{}:
          Units{p, a, w, r, d, h, key, v, t}
        case UV{}:
          Units{p, a, w, r, d, h, s, key, t}
        case Temp{}:
          Units{p, a, w, r, d, h, s, v, key}

def cycle(+u: Units, +k: Measure) -> Units:
  set(u, k, next(table(k), current(u, k), first_key(table(k)), False{}))
