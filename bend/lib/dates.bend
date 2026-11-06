# Dates: the moment.js 2.17 date maths processGraphData does, as calendar
# arithmetic on the local wall clock.
#
# A Mo is a moment: a day number (days since 1970-01-01, local) and the
# minute of that day, and whether moment would call it valid. Seconds are
# always 0 in the graphs' moments. Adding hours or minutes is done on the
# wall clock; moment adds them as elapsed time, so across a daylight-saving
# change the two differ by the shift.
#
# All arithmetic is on whole numbers well below 2^24, which F32 holds
# exactly; F32.floor of a quotient is exact for them.
import Base
import ./num.bend as Num
import ./env.bend as E
import ./chart.bend as Ch

type Mo is Data:
  Mo{ok: Bool, day: F32, min: F32}

type Ymd is Data:
  Ymd{y: F32, m: F32, d: F32}

# A format token: DD, MM, HH, mm, or a literal ":".
type Tok is Data:
  KDate{}
  KMonth{}
  KHour{}
  KMinute{}
  KColon{}

# What a parse found: has-date/date, has-month/month (0 based),
# has-hour/hour, has-minute/minute.
type Got is Data:
  Got{hd: Bool, d: F32, hm: Bool, m: F32, hh: Bool, h: F32, hn: Bool, n: F32}

# A search through the text: found, the number read, the text after it.
type Scan is Data:
  Scan{found: Bool, v: F32, rest: String}

def fdiv(+a: F32, +b: F32) -> F32:
  F32.floor((a / b : F32))

def fmod(+a: F32, +b: F32) -> F32:
  (a - b * fdiv(a, b) : F32)

def leap(+y: F32) -> Bool:
  (F32.is_eq(fmod(y, 4.0), 0.0) && F32.is_ne(fmod(y, 100.0), 0.0)) || F32.is_eq(fmod(y, 400.0), 0.0)

# Days in month m (1 to 12) of year y; moment's daysInMonth.
def dim(+y: F32, +m: F32) -> F32:
  Bool.pick(F32, F32.is_eq(m, 2.0), Bool.pick(F32, leap(y), 29.0, 28.0),
    (31.0 - fmod(fmod((m - 1.0 : F32), 7.0), 2.0) : F32))

# The day number of y-m-d (m 1 to 12).
def days(+y: F32, +m: F32, +d: F32) -> F32:
  +yy = Bool.pick(F32, (m <= 2.0 : F32), (y - 1.0 : F32), y)
  +era = fdiv(yy, 400.0)
  +yoe = (yy - era * 400.0 : F32)
  +mp = Bool.pick(F32, (m > 2.0 : F32), (m - 3.0 : F32), (m + 9.0 : F32))
  +doy = (fdiv((153.0 * mp + 2.0 : F32), 5.0) + d - 1.0 : F32)
  +doe = (yoe * 365.0 + fdiv(yoe, 4.0) - fdiv(yoe, 100.0) + doy : F32)
  (era * 146097.0 + doe - 719468.0 : F32)

# The date of a day number.
def civil(+z0: F32) -> Ymd:
  +z = (z0 + 719468.0 : F32)
  +era = fdiv(z, 146097.0)
  +doe = (z - era * 146097.0 : F32)
  +yoe = fdiv((doe - fdiv(doe, 1460.0) + fdiv(doe, 36524.0) - fdiv(doe, 146096.0) : F32), 365.0)
  +doy = (doe - (365.0 * yoe + fdiv(yoe, 4.0) - fdiv(yoe, 100.0)) : F32)
  +mp = fdiv((5.0 * doy + 2.0 : F32), 153.0)
  +d = (doy - fdiv((153.0 * mp + 2.0 : F32), 5.0) + 1.0 : F32)
  +m = Bool.pick(F32, (mp < 10.0 : F32), (mp + 3.0 : F32), (mp - 9.0 : F32))
  +y = (yoe + era * 400.0 : F32)
  Ymd{Bool.pick(F32, (m <= 2.0 : F32), (y + 1.0 : F32), y), m, d}

def ymd_y(+c: Ymd) -> F32:
  match c:
    case Ymd{+y, _, _}:
      y

def ymd_m(+c: Ymd) -> F32:
  match c:
    case Ymd{_, +m, _}:
      m

def ymd_d(+c: Ymd) -> F32:
  match c:
    case Ymd{_, _, +d}:
      d

def ok(+mo: Mo) -> Bool:
  match mo:
    case Mo{+ok, _, _}:
      ok

# moment.add(n, "days") / subtract: the date moves, the wall clock stays.
def add_days(+mo: Mo, +n: F32) -> Mo:
  match mo:
    case Mo{+ok, +day, +min}:
      Mo{ok, (day + n : F32), min}

# add(n, "minutes"), on the wall clock.
def add_minutes(+mo: Mo, +n: F32) -> Mo:
  match mo:
    case Mo{+ok, +day, +min}:
      +t = (min + n : F32)
      +dd = fdiv(t, 1440.0)
      Mo{ok, (day + dd : F32), (t - dd * 1440.0 : F32)}

# 0 Sunday to 6 Saturday: moment's day().
def weekday(+mo: Mo) -> F32:
  match mo:
    case Mo{_, +day, _}:
      fmod((day + 4.0 : F32), 7.0)

# isoWeekday(): 1 Monday to 7 Sunday; NaN for an invalid moment.
def iso_weekday(+mo: Mo) -> F32:
  +w = weekday(mo)
  Bool.pick(F32, ok(mo), Bool.pick(F32, F32.is_eq(w, 0.0), 7.0, w), Num.nan())

# isoWeekday(input): this.day(this.day() % 7 ? input : input - 7), and
# day(x) adds x - day() days. Either way that is input - isoWeekday() days.
# An invalid moment stays as it is.
def set_iso_weekday(+mo: Mo, +input: F32) -> Mo:
  Bool.pick(Mo, ok(mo), add_days(mo, (input - iso_weekday(mo) : F32)), mo)

# month(): 0 to 11; NaN for an invalid moment.
def month(+mo: Mo) -> F32:
  match mo:
    case Mo{+ok, +day, _}:
      Bool.pick(F32, ok, (ymd_m(civil(day)) - 1.0 : F32), Num.nan())

def set_month.go(+ok: Bool, +c: Ymd, +min: F32, +value: F32) -> Mo:
  match c:
    case Ymd{+y, _, +d}:
      +total = (y * 12.0 + value : F32)
      +ny = fdiv(total, 12.0)
      +nm = (total - ny * 12.0 + 1.0 : F32)
      Mo{ok, days(ny, nm, F32.min(d, dim(ny, nm))), min}

# month(value): Date.setMonth(value, min(date, daysInMonth)); value may lie
# outside 0..11 and moves the year. A no-op on an invalid moment.
def set_month(+mo: Mo, +value: F32) -> Mo:
  match mo:
    case Mo{+ok, +day, +min}:
      Bool.pick(Mo, ok, set_month.go(ok, civil(day), min, value), mo)

# add(n, "M")
def add_months(+mo: Mo, +n: F32) -> Mo:
  set_month(mo, (month(mo) + n : F32))

# a < b, as moments compare: by time; never for an invalid one (NaN).
def lt(+a: Mo, +b: Mo) -> Bool:
  match a b:
    case Mo{+ao, +ad, +am} Mo{+bo, +bd, +bm}:
      ao && bo && ((ad < bd : F32) || (F32.is_eq(ad, bd) && (am < bm : F32)))

def stamp.go(+ok: Bool, +c: Ymd, +min: F32) -> Ch.Stamp:
  match c:
    case Ymd{+y, +m, +d}:
      +h = fdiv(min, 60.0)
      Ch.Stamp{ok, F32.to_u32(y), F32.to_u32(m), F32.to_u32(d), F32.to_u32(h),
        F32.to_u32((min - h * 60.0 : F32)), 0}

def stamp(+mo: Mo) -> Ch.Stamp:
  match mo:
    case Mo{+ok, +day, +min}:
      stamp.go(ok, civil(day), min)

def stamps(+xs: List<&2, Mo>) -> List<&2, Ch.Stamp>:
  match xs:
    case Nil{}:
      []
    case Con{+x, rest}:
      stamp(x) <> stamps(rest)

# Parsing
# -------

def digit(+c: Char) -> F32:
  (U32.to_f32(Char.to_u32(c)) - 48.0 : F32)

# After a first digit d1: a second one joins it (\d\d?).
def scan.two(+d1: F32, +s: String) -> Scan:
  match s:
    case SNil{}:
      Scan{True{}, d1, ""}
    case SCon{+c, +t}:
      Bool.pick(Scan, Char.is_digit(c), Scan{True{}, (d1 * 10.0 + digit(c) : F32), t},
        Scan{True{}, d1, SCon{c, t}})

# The first /\d\d?/ anywhere in s (moment's regexes are not anchored).
def scan.num(+s: String) -> Scan:
  match s:
    case SNil{}:
      Scan{False{}, 0.0, ""}
    case SCon{+c, +t}:
      Bool.pick(Scan, Char.is_digit(c), scan.two(digit(c), t), scan.num(t))

# The first ":" anywhere in s.
def scan.colon(+s: String) -> Scan:
  match s:
    case SNil{}:
      Scan{False{}, 0.0, ""}
    case SCon{+c, +t}:
      Bool.pick(Scan, Char.is_eq(c, ':'), Scan{True{}, 0.0, t}, scan.colon(t))

def scan.of(+k: Tok, +s: String) -> Scan:
  match k:
    case KColon{}:
      scan.colon(s)
    case _:
      scan.num(s)

def scan_found(+sc: Scan) -> Bool:
  match sc:
    case Scan{+f, _, _}:
      f

def scan_v(+sc: Scan) -> F32:
  match sc:
    case Scan{_, +v, _}:
      v

def scan_rest(+sc: Scan) -> String:
  match sc:
    case Scan{_, _, +r}:
      r

# A token's value into what was found; an unmatched token sets nothing.
def put(+g: Got, +k: Tok, +f: Bool, +v: F32) -> Got:
  match g:
    case Got{+hd, +d, +hm, +m, +hh, +h, +hn, +n}:
      match k:
        case KDate{}:
          Got{hd || f, Bool.pick(F32, f, v, d), hm, m, hh, h, hn, n}
        case KMonth{}:
          Got{hd, d, hm || f, Bool.pick(F32, f, (v - 1.0 : F32), m), hh, h, hn, n}
        case KHour{}:
          Got{hd, d, hm, m, hh || f, Bool.pick(F32, f, v, h), hn, n}
        case KMinute{}:
          Got{hd, d, hm, m, hh, h, hn || f, Bool.pick(F32, f, v, n)}
        case KColon{}:
          Got{hd, d, hm, m, hh, h, hn, n}

# configFromStringAndFormat: each token takes the first match of its regex
# in what is left of the text, and the text continues after it.
def run(+toks: List<&2, Tok>, +s: String, +g: Got) -> Got:
  match toks:
    case Nil{}:
      g
    case Con{+k, rest}:
      +sc = scan.of(k, s)
      +f = scan_found(sc)
      run(rest, Bool.pick(String, f, scan_rest(sc), s), put(g, k, f, scan_v(sc)))

# configFromArray and checkOverflow: missing year, month and date come from
# today up to the first one given (a given month alone means the 1st);
# hour and minute default to 0; out of range parts (a 31st in a 30 day
# month, hour 25) or nothing parsed at all make the moment invalid; 24:00 is
# the next day's 00:00.
def build(+c: E.Clock, +g: Got) -> Mo:
  match c g:
    case E.Clock{+cy, +cm, +cd, _, _, _, _} Got{+hd, +d, +hm, +m, +hh, +h, +hn, +n}:
      +y = U32.to_f32(cy)
      +mon = Bool.pick(F32, hm, m, (U32.to_f32(cm) - 1.0 : F32))
      +date = Bool.pick(F32, hd, d, Bool.pick(F32, hm, 1.0, U32.to_f32(cd)))
      +hour = Bool.pick(F32, hh, h, 0.0)
      +minute = Bool.pick(F32, hn, n, 0.0)
      +big = F32.is_eq(hour, 24.0)
      +valid = (hd || hm || hh || hn) && (mon >= 0.0 : F32) && (mon <= 11.0 : F32)
        && (date >= 1.0 : F32) && (date <= dim(y, (mon + 1.0 : F32)) : F32)
        && (hour <= 24.0 : F32) && (Bool.not(big) || F32.is_eq(minute, 0.0))
        && (minute <= 59.0 : F32)
      Mo{valid, (days(y, (mon + 1.0 : F32), date) + Bool.pick(F32, big, 1.0, 0.0) : F32),
        (Bool.pick(F32, big, 0.0, hour) * 60.0 + minute : F32)}

def no_got() -> Got:
  Got{False{}, 0.0, False{}, 0.0, False{}, 0.0, False{}, 0.0}

# moment(text, format) in non-strict mode, at the local date c.
def parse(+c: E.Clock, +text: String, +toks: List<&2, Tok>) -> Mo:
  build(c, run(toks, text, no_got()))

def fmt_dd_hh_mm() -> List<&2, Tok>:
  [KDate{}, KColon{}, KHour{}, KColon{}, KMinute{}]

def fmt_dd() -> List<&2, Tok>:
  [KDate{}]

def fmt_mm() -> List<&2, Tok>:
  [KMonth{}]

# moment().format("DD")
def today_dd(+c: E.Clock) -> String:
  match c:
    case E.Clock{_, _, +d, _, _, _, _}:
      Bool.pick(String, (d < 10 : U32), "0" ++ U32.show(d), U32.show(d))
