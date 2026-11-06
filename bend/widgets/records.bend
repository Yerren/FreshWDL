# Records (modal recordsModal, table recordsTable, select selectMenuRecords,
# button RecordsButton): the month, year and all-time records from
# clientrawextra, a row each, coloured by age. WidgetsHandlers.js's
# processRecord, processRecordsData, updateValuesRe01, changeCurrentOptionRe01,
# resizeDivRe01 and recordsInitRe01.
import Base
import ../lib/num.bend as Num
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/cmd.bend as C

# Dates, as moment() reads them
# -----------------------------

# A moment as the date arithmetic needs it: ok, isValid(); days, the local
# calendar day as a day number; tod, the second of that day. moment's diff
# in days compares local wall-clock times, so no time zone comes into it.
type Mom is Data:
  Mom{ok: Bool, days: U32, tod: U32}

# One token's match: ok, it matched; v, its digits' value; len, how many
# digits; rest, the string after the match (all of it when nothing matched).
type Scan is Data:
  Scan{ok: Bool, v: U32, len: Nat, rest: String}

def scan_ok(+sc: Scan) -> Bool:
  match sc:
    case Scan{+ok, _, _, _}:
      ok

def scan_v(+sc: Scan) -> U32:
  match sc:
    case Scan{_, +v, _, _}:
      v

def scan_len(+sc: Scan) -> Nat:
  match sc:
    case Scan{_, _, +n, _}:
      n

def scan_rest(+sc: Scan) -> String:
  match sc:
    case Scan{_, _, _, +r}:
      r

# The string from its first digit on.
def skip_nd(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      Bool.pick(String, Char.is_digit(c), SCon{c, t}, skip_nd(t))

def lead_d(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      Bool.pick(String, Char.is_digit(c), SCon{c, lead_d(t)}, "")

def dval(+s: String, +acc: U32) -> U32:
  match s:
    case SNil{}:
      acc
    case SCon{+c, +t}:
      dval(t, (acc * 10 + (Char.to_u32(c) - 48 : U32) : U32))

# A numeric token in moment's forgiving (non-strict) parse: the regex
# (/\d\d?/ or /\d{1,4}/) is not anchored, so it takes the first run of digits
# anywhere in what is left, up to max of them.
def num(+s: String, +max: Nat) -> Scan:
  +t = skip_nd(s)
  +ds = String.take(lead_d(t), max)
  +n = String.length(ds)
  Scan{Nat.is_gt(n, 0n), dval(ds, 0), n, String.drop(t, n)}

def after_c(+s: String, +c: Char, +orig: String) -> String:
  match s:
    case SNil{}:
      orig
    case SCon{+h, +t}:
      Bool.pick(String, Char.is_eq(h, c), t, after_c(t, c, orig))

# A literal in the format: the first one anywhere is skipped past; none
# leaves the string as it was.
def lit(+s: String, +c: Char) -> String:
  after_c(s, c, s)

def in_range(+x: U32, +lo: U32, +hi: U32) -> Bool:
  (x >= lo : U32) && (x <= hi : U32)

# A character of moment's matchWord (the en "dd" regex): a letter, an
# apostrophe, or most non-ASCII text.
def word_char(+c: Char) -> Bool:
  +x = Char.to_u32(c)
  Char.is_alpha(c) || U32.is_eq(x, 39) || in_range(x, 160, 1791) || in_range(x, 1792, 55295)
    || in_range(x, 63744, 64975) || in_range(x, 65008, 65287) || in_range(x, 65296, 65519)

def wordy(+s: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{+c, +t}:
      word_char(c) || wordy(t)

def is_leap(+y: U32) -> Bool:
  (U32.is_eq(U32.mod(y, 4), 0) && U32.is_ne(U32.mod(y, 100), 0)) || U32.is_eq(U32.mod(y, 400), 0)

# moment's daysInMonth; m is 1 to 12.
def dim(+y: U32, +m: U32) -> U32:
  Bool.pick(U32, U32.is_eq(m, 2), Bool.pick(U32, is_leap(y), 29, 28),
    (31 - U32.mod(U32.mod((m - 1 : U32), 7), 2) : U32))

# Days from a fixed point to y-m-d (proleptic Gregorian), years shifted by
# 400 so nothing goes negative.
def civil(+y: U32, +m: U32, +d: U32) -> U32:
  +yy = ((y + 400 : U32) - Bool.pick(U32, (m <= 2 : U32), 1, 0) : U32)
  +era = U32.div(yy, 400)
  +yoe = (yy - era * 400 : U32)
  +mp = Bool.pick(U32, (m > 2 : U32), (m - 3 : U32), (m + 9 : U32))
  +doy = (U32.div((153 * mp + 2 : U32), 5) + d - 1 : U32)
  +doe = (yoe * 365 + U32.div(yoe, 4) - U32.div(yoe, 100) + doy : U32)
  (era * 146097 + doe : U32)

def clock_year(+c: E.Clock) -> U32:
  match c:
    case E.Clock{+y, _, _, _, _, _, _}:
      y

def clock_month(+c: E.Clock) -> U32:
  match c:
    case E.Clock{_, +m, _, _, _, _, _}:
      m

def clock_day(+c: E.Clock) -> U32:
  match c:
    case E.Clock{_, _, +d, _, _, _, _}:
      d

# configFromArray and checkOverflow: the fields the string did not give
# come from today's date while they lead (year, then month, then day), the
# rest are 1 (day) or 0. mo is 1-based (MM's value). any: some format token
# matched (else flags.empty); bad: "dd" matched, which no weekday parses.
# 24:00:00 rolls to the next day. Years under 100 are built in 1900+y, so
# 29 Feb of year 0 becomes 1 March.
def make(+hy: Bool, +y: U32, +hmo: Bool, +mo: U32, +hd: Bool, +d: U32,
  +hh: Bool, +h: U32, +hmi: Bool, +mi: U32, +hs: Bool, +s: U32,
  +any: Bool, +bad: Bool, +c: E.Clock) -> Mom:
  +y2 = Bool.pick(U32, hy, y, clock_year(c))
  +mo2 = Bool.pick(U32, hmo, mo, Bool.pick(U32, hy, 1, clock_month(c)))
  +d2 = Bool.pick(U32, hd, d, Bool.pick(U32, hy || hmo, 1, clock_day(c)))
  +h2 = Bool.pick(U32, hh, h, 0)
  +mi2 = Bool.pick(U32, hmi, mi, 0)
  +s2 = Bool.pick(U32, hs, s, 0)
  +h24 = U32.is_eq(h2, 24)
  +over = Bool.not(in_range(mo2, 1, 12)) || Bool.not(in_range(d2, 1, dim(y2, mo2)))
    || (h2 > 24 : U32) || (h24 && (U32.is_ne(mi2, 0) || U32.is_ne(s2, 0)))
    || (mi2 > 59 : U32) || (s2 > 59 : U32)
  +feb0 = U32.is_eq(y2, 0) && U32.is_eq(mo2, 2) && U32.is_eq(d2, 29)
  +days = (civil(y2, mo2, d2) + Bool.pick(U32, feb0, 1, 0) + Bool.pick(U32, h24, 1, 0) : U32)
  Mom{any && Bool.not(bad) && Bool.not(over), days,
    (Bool.pick(U32, h24, 0, h2) * 3600 + mi2 * 60 + s2 : U32)}

# YYYY: two digits read as 1969-2068.
def year_of(+sc: Scan) -> U32:
  +v = scan_v(sc)
  Bool.pick(U32, Nat.is_eq(scan_len(sc), 2n),
    (v + Bool.pick(U32, (v > 68 : U32), 1900, 2000) : U32), v)

# moment(input, "HH:mm DDMMYYYY"), processRecord's parse.
def parse_rec(+s: String, +c: E.Clock) -> Mom:
  +h = num(s, 2n)
  +mi = num(lit(scan_rest(h), ':'), 2n)
  +d = num(lit(scan_rest(mi), ' '), 2n)
  +mo = num(scan_rest(d), 2n)
  +y = num(scan_rest(mo), 4n)
  make(scan_ok(y), year_of(y), scan_ok(mo), scan_v(mo), scan_ok(d), scan_v(d),
    scan_ok(h), scan_v(h), scan_ok(mi), scan_v(mi), False{}, 0,
    scan_ok(h) || scan_ok(mi) || scan_ok(d) || scan_ok(mo) || scan_ok(y), False{}, c)

# moment(clientraw[29] + [30] + [31] + [74], "HHmmssdd/mm/yyyy"): HH, mm, ss
# take the time's digits; dd is the weekday name, which digits never match
# (a letter would, and then fail to parse); "/" skips to after the date's
# first slash, and the second mm reads the number there (the month, for a
# d/m/yyyy date) as the minutes. yyyy is four literal y's in moment 2.22. No
# year, month or day: the date is the browser's today.
def parse_now(+e: E.Env) -> Mom:
  +s = E.cr(e, 29n) ++ E.cr(e, 30n) ++ E.cr(e, 31n) ++ E.cr(e, 74n)
  +h = num(s, 2n)
  +m1 = num(scan_rest(h), 2n)
  +sec = num(scan_rest(m1), 2n)
  +m2 = num(lit(scan_rest(sec), '/'), 2n)
  make(False{}, 0, False{}, 0, False{}, 0, scan_ok(h), scan_v(h),
    scan_ok(m1) || scan_ok(m2), Bool.pick(U32, scan_ok(m2), scan_v(m2), scan_v(m1)),
    scan_ok(sec), scan_v(sec),
    scan_ok(h) || scan_ok(m1) || scan_ok(sec) || scan_ok(m2), wordy(scan_rest(sec)), E.clock(e))

def mom_ok(+m: Mom) -> Bool:
  match m:
    case Mom{+ok, _, _}:
      ok

def mom_days(+m: Mom) -> U32:
  match m:
    case Mom{_, +d, _}:
      d

def mom_tod(+m: Mom) -> U32:
  match m:
    case Mom{_, _, +t}:
      t

# The row's colour: now.diff(record, 'days') (truncated toward zero) under
# 2, at most 7, or else (NaN included, when either date is invalid).
def colour(+now: Mom, +rec: Mom) -> String:
  +a = mom_days(now)
  +b = mom_days(rec)
  +back = Bool.pick(U32, (mom_tod(now) < mom_tod(rec) : U32), 1, 0)
  +diff = (a - b - back : U32)
  +red = (a <= b : U32) || (diff < 2 : U32)
  +yellow = (diff <= 7 : U32)
  Bool.pick(String, mom_ok(now) && mom_ok(rec),
    Bool.pick(String, red, "rgb(245, 141, 122)",
      Bool.pick(String, yellow, "rgb(236, 242, 98)", "rgb(157, 235, 99)")),
    "rgb(157, 235, 99)")

# Records
# -------

# One assignment of processRecordsData: set, it has happened (the key is in
# the dict); need, the highest clientrawextra index it calls toString on;
# key, the dictionary word; value, the raw reading; input, the string
# processRecord hands moment; mom, that moment; kind and suffix, what
# formatDataToUnit and the label get, and what follows them.
type Rec is Data:
  Rec{set: Bool, need: Nat, key: String, value: String, input: String, mom: Mom,
    kind: U.Measure, suffix: String}

def rec_set(+r: Rec) -> Bool:
  match r:
    case Rec{+s, _, _, _, _, _, _, _}:
      s

def rec_need(+r: Rec) -> Nat:
  match r:
    case Rec{_, +n, _, _, _, _, _, _}:
      n

def rec_key(+r: Rec) -> String:
  match r:
    case Rec{_, _, +k, _, _, _, _, _}:
      k

# processRecord(i): cre[i], and moment(cre[i+1] + ":" + cre[i+2] + " " +
# cre[i+3] + cre[i+4] + cre[i+5], "HH:mm DDMMYYYY").
def rec(+e: E.Env, +set: Bool, +w: D.Phrase, +i: Nat, +kind: U.Measure,
  +suffix: String, +extra: Nat) -> Rec:
  +input = E.cre(e, Nat.add(i, 1n)) ++ ":" ++ E.cre(e, Nat.add(i, 2n)) ++ " "
    ++ E.cre(e, Nat.add(i, 3n)) ++ E.cre(e, Nat.add(i, 4n)) ++ E.cre(e, Nat.add(i, 5n))
  Rec{set, Nat.max(Nat.add(i, 5n), extra), E.word(e, w), E.cre(e, i), input,
    parse_rec(input, E.clock(e)), kind, suffix}

def plain(+e: E.Env, +set: Bool, +w: D.Phrase, +i: Nat, +kind: U.Measure) -> Rec:
  rec(e, set, w, i, kind, "", 0n)

# The wind records' suffix: ", " + cre[j] + "°".
def dir(+e: E.Env, +set: Bool, +w: D.Phrase, +i: Nat, +j: Nat) -> Rec:
  rec(e, set, w, i, U.Wind{}, ", " ++ E.cre(e, j) ++ "°", j)

# processRecordsData(dict, s, s2)'s assignments, in order.
def entries(+e: E.Env, +set: Bool, +s: Nat, +s2: Nat) -> List<&2, Rec>:
  [plain(e, set, D.WRecordsHighTemp{}, s, U.Temp{}),
   plain(e, set, D.WRecordsLowTemp{}, Nat.add(s, 6n), U.Temp{}),
   dir(e, set, D.WRecordsHighGust{}, Nat.add(s, 12n), Nat.add(s, 78n)),
   rec(e, set, D.WRecordsHighRainRate{}, Nat.add(s, 18n), U.Rainfall{}, "/min", 0n),
   plain(e, set, D.WRecordsLowBaro{}, Nat.add(s, 24n), U.Pressure{}),
   plain(e, set, D.WRecordsHighBaro{}, Nat.add(s, 30n), U.Pressure{}),
   plain(e, set, D.WRecordsHighRainRateDaily{}, Nat.add(s, 36n), U.Rainfall{}),
   plain(e, set, D.WRecordsHighRainRateHourly{}, Nat.add(s, 42n), U.Rainfall{}),
   dir(e, set, D.WRecordsHighAverageWind{}, Nat.add(s, 48n), Nat.add(s, 84n)),
   plain(e, set, D.WRecordsLowWindChill{}, Nat.add(s, 72n), U.Temp{}),
   plain(e, set, D.WRecordsWarmestDay{}, Nat.add(s, 90n), U.Temp{}),
   plain(e, set, D.WRecordsColdestNight{}, Nat.add(s, 96n), U.Temp{}),
   plain(e, set, D.WRecordsColdestDay{}, Nat.add(s, 102n), U.Temp{}),
   plain(e, set, D.WRecordsWarmestNight{}, Nat.add(s, 108n), U.Temp{}),
   plain(e, set, D.WRecordsHighHeatIndex{}, Nat.add(s, 114n), U.Temp{}),
   plain(e, set, D.WRecordsHighSolar{}, s2, U.Solar{}),
   plain(e, set, D.WRecordsHighUV{}, Nat.add(s2, 6n), U.UV{}),
   plain(e, set, D.WRecordsHighDewPoint{}, Nat.add(s2, 69n), U.Temp{}),
   plain(e, set, D.WRecordsLowDewPoint{}, Nat.add(s2, 75n), U.Temp{})]

# Every assignment's fields are in the file.
def all_ok(+xs: List<&2, Rec>, +len: Nat) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+r, +rest}:
      Nat.is_lt(rec_need(r), len) && all_ok(rest, len)

# processRecordsData on a short file: the assignments before the first
# whose fields are missing happen; that one throws.
def apply(+fresh: List<&2, Rec>, +old: List<&2, Rec>, +len: Nat, +go: Bool) -> List<&2, Rec>:
  match fresh:
    case Nil{}:
      []
    case Con{+f, +rest}:
      +ok = go && Nat.is_lt(rec_need(f), len)
      Bool.pick(Rec, ok, f, Maybe.default(&2, Rec, List.head(&2, Rec, old), f))
        <> apply(rest, List.tail(&2, Rec, old), len, ok)

# State
# -----

# cur: records.currentOption (0 month, 1 year, 2 all time); month, year,
# all: recordsDict[0], [1], [2] as their assignments; sized: resizeDivRe01
# has run once (recordsDictOld is recordsDict from then on, so later resizes
# leave the table alone).
type St is Data:
  St{cur: Nat, month: +List<Rec>, year: +List<Rec>, all: +List<Rec>, sized: Bool}

type ROut is Data:
  ROut{st: St, cmds: +List<C.Cmd>}

def init(+e: E.Env) -> St:
  St{0n, entries(e, False{}, 61n, 660n), entries(e, False{}, 187n, 672n),
    entries(e, False{}, 313n, 684n), False{}}

def enabled(+e: E.Env) -> Bool:
  E.on(e, "recordHandler.enabled")

# The table
# ---------

# Escapes an attribute value.
def attr(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      Bool.pick(String, Char.is_eq(c, '&'), "&amp;",
        Bool.pick(String, Char.is_eq(c, '"'), "&quot;", SCon{c, ""})) ++ attr(t)

# One row: key, reading with its unit label (and suffix), and the date, which
# the host formats with moment (data-date: the string to parse).
def row(+e: E.Env, +r: Rec, +now: Mom) -> String:
  match r:
    case Rec{_, _, +key, +value, +input, +mom, +kind, +suffix}:
      "<tr style=\"background-color: " ++ colour(now, mom) ++ ";\"><td>" ++ key ++ "</td><td>"
        ++ E.reading(e, kind, value) ++ suffix ++ "</td><td data-date=\"" ++ attr(input)
        ++ "\"></td></tr>"

def has(+xs: List<&2, String>, +k: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+x, +rest}:
      String.eq(x, k) || has(rest, k)

# The value a key holds: its last assignment.
def last_with(+xs: List<&2, Rec>, +k: String, +dflt: Rec) -> Rec:
  match xs:
    case Nil{}:
      dflt
    case Con{+r, +rest}:
      last_with(rest, k, Bool.pick(Rec, rec_set(r) && String.eq(rec_key(r), k), r, dflt))

# Object.keys(dict): each key once, where it was first assigned.
def rows(+xs: List<&2, Rec>, +every: List<&2, Rec>, +seen: List<&2, String>,
  +e: E.Env, +now: Mom) -> String:
  match xs:
    case Nil{}:
      ""
    case Con{+r, +rest}:
      +k = rec_key(r)
      +first = rec_set(r) && Bool.not(has(seen, k))
      Bool.pick(String, first, row(e, last_with(every, k, r), now), "")
        ++ rows(rest, every, Bool.pick(List<&2, String>, first, k <> seen, seen), e, now)

def current(+st: St) -> List<&2, Rec>:
  match st:
    case St{+cur, +month, +year, +all, _}:
      match cur:
        case 0n:
          month
        case 1n:
          year
        case _:
          all

# The date cells: the host fills each data-date cell with
# moment(value, parse).format(format) in the page's locale (host/records.js).
def dates(+id: String) -> List<&2, C.Cmd>:
  [C.CDates{id, "HH:mm DDMMYYYY", "HH:mm, MMM D YYYY"}]

# updateValuesRe01: the current dict's rows, in place of the table's.
def table(+st: St, +e: E.Env) -> List<&2, C.Cmd>:
  +xs = current(st)
  C.CHtml{"recordsTable", rows(xs, xs, [], e, parse_now(e))} <> dates("recordsTable")

# Events
# ------

# recordsInitRe01's commands: header, the select's three options, the
# hidden modal. The original then calls resizeDivRe01: the lead's first
# layout does (see resize).
def start(+e: E.Env) -> List<&2, C.Cmd>:
  Bool.pick(List<&2, C.Cmd>, enabled(e),
    [C.CHtml{"recordsHeaderText", E.word(e, D.WButtonLabelRecords{})},
     C.COption{"selectMenuRecords", "0", E.word(e, D.WRecordsForMonth{})},
     C.COption{"selectMenuRecords", "1", E.word(e, D.WRecordsForYear{})},
     C.COption{"selectMenuRecords", "2", E.word(e, D.WRecordsAllTime{})},
     C.CStyle{"recordsModal", "display", "none"}], [])

def cre_length(+e: E.Env) -> Nat:
  match e:
    case E.Env{_, +cre, _, _, _, _, _, _}:
      List.length(&2, String, cre)

def refresh(+st: St, +e: E.Env) -> ROut:
  ROut{st, table(st, e)}

def data.go(+done: Bool, +st: St, +e: E.Env, +fresh: List<&2, Rec>, +len: Nat) -> ROut:
  match done:
    case True{}:
      match st:
        case St{+cur, _, _, _, +sized}:
          refresh(St{cur, entries(e, True{}, 61n, 660n), entries(e, True{}, 187n, 672n), fresh, sized}, e)
    case False{}:
      match st:
        case St{+cur, +month, +year, +all, +sized}:
          ROut{St{cur, month, year, apply(fresh, all, len, True{}), sized}, []}

# clientRawExtraDataUpdate: processRecordsData for all time (313, 684), the
# year (187, 672) and the month (61, 660), then updateValuesRe01. A file too
# short for the all-time records throws partway through them: the rest is
# skipped and the table stays (the year's and month's indices are lower, so
# they never throw once the all-time ones are through).
def data(+st: St, +e: E.Env) -> ROut:
  +len = cre_length(e)
  +fresh = entries(e, True{}, 313n, 684n)
  Bool.pick(ROut, enabled(e), data.go(all_ok(fresh, len), st, e, fresh, len), ROut{st, []})

# The font sizes the shrink loop tries, sharpenValue(h^2 / (10000 + 1000k))
# for k = 0, 1, ... up to the first 0.5 (where the original would loop
# forever if even that does not fit). acc is reversed.
def fonts(+fuel: Nat, +h2: F32, +k: F32, +done: Bool, +acc: List<&2, String>) -> List<&2, String>:
  match fuel:
    case 0n:
      acc
    case 1n+f:
      +v = Num.sharpen((h2 / (10000.0 + 1000.0 * k) : F32))
      fonts(f, h2, (k + 1.0 : F32), done || (v <= 0.5 : F32),
        Bool.pick(List<&2, String>, done, acc, (Num.show(v) ++ "px") <> acc))

def size(+id: String, +w: F32, +h: F32) -> List<&2, C.Cmd>:
  +ws = Num.show(w) ++ "px"
  +hs = Num.show(h) ++ "px"
  [C.CAttr{id, "style", "width:" ++ ws ++ ";height:" ++ hs},
   C.CStyle{id, "width", ws}, C.CStyle{id, "height", hs}]

def sized(+st: St) -> St:
  match st:
    case St{+cur, +month, +year, +all, _}:
      St{cur, month, year, all, True{}}

def was_sized(+st: St) -> Bool:
  match st:
    case St{_, _, _, _, +s}:
      s

# resizeDivRe01 (vw, vh: document.documentElement's client size). The table's
# font starts at sharpenValue(h^2/10000) and shrinks while the table is more
# than 2px taller than modalRecordsDiv - measured before that div gets its
# new size (0.9 by 0.6 times the smaller side), as in the original. The
# first call also fills the table.
def resize.go(+on: Bool, +st: St, +e: E.Env, +vw: F32, +vh: F32) -> ROut:
  match on:
    case False{}:
      ROut{st, []}
    case True{}:
      +side = Bool.pick(F32, (vh <= vw : F32), vh, vw)
      +h = (side * 0.6 : F32)
      +h2 = (h * h : F32)
      +f0 = Num.show(Num.sharpen((h2 / 10000.0 : F32))) ++ "px"
      +sizes = {f0 <> List.reverse(&2, String, fonts(Nat.add(Num.nat_of((h2 / 500.0 : F32)), 3n), h2, 0.0, False{}, [])) : List<&2, String>}
      +st2 = sized(st)
      ROut{st2, C.CFit{"recordsTable", "style.fontSize", sizes, C.FitsUnder{"modalRecordsDiv"}}
        <> List.append(&2, C.Cmd, size("modalRecordsDiv", (side * 0.6 * 1.5 : F32), h),
          Bool.pick(List<&2, C.Cmd>, was_sized(st), [], table(st2, e)))}

def resize(+st: St, +e: E.Env, +vw: F32, +vh: F32) -> ROut:
  resize.go(enabled(e), st, e, vw, vh)

def open(+r: ROut) -> ROut:
  match r:
    case ROut{+st, +cmds}:
      ROut{st, C.CStyle{"recordsModal", "display", "block"} <> cmds}

# Clicks: the Records button shows the modal, then resizeDivRe01 (vw, vh as
# for resize); its x hides it. The modal's background does nothing (the graph
# modal's window.onclick replaced recordsInitRe01's).
def click.go(+button: Bool, +st: St, +e: E.Env, +id: String, +vw: F32, +vh: F32) -> ROut:
  match button:
    case True{}:
      open(resize(st, e, vw, vh))
    case False{}:
      ROut{st, Bool.pick(List<&2, C.Cmd>, enabled(e) && String.eq(id, "recordsClose"),
        [C.CStyle{"recordsModal", "display", "none"}], [])}

def click(+st: St, +e: E.Env, +id: String, +vw: F32, +vh: F32) -> ROut:
  click.go(enabled(e) && String.eq(id, "RecordsButton"), st, e, id, vw, vh)

def with_cur(+st: St, +cur: Nat) -> St:
  match st:
    case St{_, +month, +year, +all, +sized}:
      St{cur, month, year, all, sized}

def select.go(+known: Bool, +st: St, +e: E.Env, +value: String) -> ROut:
  match known:
    case False{}:
      ROut{st, []}
    case True{}:
      +st2 = with_cur(st, Bool.pick(Nat, String.eq(value, "0"), 0n,
        Bool.pick(Nat, String.eq(value, "1"), 1n, 2n)))
      ROut{st2, table(st2, e)}

# The select's onchange: changeCurrentOptionRe01(this.value).
def select(+st: St, +e: E.Env, +id: String, +value: String) -> ROut:
  select.go(enabled(e) && String.eq(id, "selectMenuRecords")
    && (String.eq(value, "0") || String.eq(value, "1") || String.eq(value, "2")), st, e, value)

# updateUnits ends with updateValuesRe01 whatever the unit. (With the
# records disabled that throws on the missing table: nothing.)
def units(+st: St, +e: E.Env) -> List<&2, C.Cmd>:
  Bool.pick(List<&2, C.Cmd>, enabled(e), table(st, e), [])
