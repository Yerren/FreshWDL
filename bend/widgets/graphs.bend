# Graphs: the four small Chart.js graphs (baroGraphCanvas01,
# rainGraphCanvas01, tempGraphCanvas01, windGraphCanvas01), the graph modal
# (ModalCanvas in myModal, its header, footer and selectMenu), and the data
# they draw: processGraphData's graphDict, globalGraphs and graphStyles.
#
# Every function answers with the commands the original's DOM and Chart.js
# calls amount to; a Chart value is the chart's whole configuration (see
# lib/chart.bend), so each configure is one CChart (destroy the canvas's
# chart, new Chart) followed by CChartSize (the canvas's div gets its size,
# then chart.resize()).
import Base
import ../lib/num.bend as Num
import ../lib/units.bend as U
import ../lib/dict.bend as D
import ../lib/env.bend as E
import ../lib/cmd.bend as C
import ../lib/chart.bend as Ch
import ../lib/dates.bend as Dt

# A globalGraphs key, in the object's order.
type GBase is Data:
  GBaro{}
  GHum{}
  GSolar{}
  GTemp{}
  GUv{}
  GWindDir{}
  GWindSpeed{}
  GRainLine{}
  GRainBar{}

# A key of globalGraphs[..].graphs.
type Span is Data:
  SpDailyMonth{}
  SpHourlyDay{}
  SpQuarterWeek{}
  SpMinuteHour{}
  SpMonthlyYear{}

# A small graph.
type Gs is Data:
  GsBaro{}
  GsRain{}
  GsTemp{}
  GsWind{}

# A graphDict value: a clientraw string, or the number rainDays7 holds
# (arrayClientrawExtra[484 + i] / 10).
type Val is Data:
  VRaw{s: String}
  VNum{x: F32}

# Where a graphDict series comes from: `n` fields of file `file` (0
# clientraw, 1 extra, 2 hour, 3 daily) from index a, then `m` from index b.
type Src is Data:
  SrcR{file: Nat, a: Nat, n: Nat, b: Nat, m: Nat}
  SrcRain7{}
  SrcRain12{}

# A small graph: on, initialize*Graph01 ran (graphHandler<X>.enabled);
# shown, it has been configured (until then it shows draw*'s empty chart);
# w, its div's parent's clientWidth when last resized.
type Small is Data:
  Small{on: Bool, shown: Bool, w: F32}

# snap: the Env processGraphData last ran on (graphDict is computed from its
# fields and clock); ready: processGraphData has run (graphDict has keys).
# modal: initializeModalGraph01 ran (graphHandler.enabled); handler:
# initModalHandler ran (modalHandler.enabled). has_cur, cur_b, cur_s:
# modalGraph.currentGraph (null when has_cur is False). vw, vh:
# document.documentElement's client size when the modal last resized.
type St is Data:
  St{snap: E.Env, ready: Bool, modal: Bool, handler: Bool, has_cur: Bool,
    cur_b: GBase, cur_s: Span, baro: Small, rain: Small, temp: Small, wind: Small,
    vw: F32, vh: F32}

# ok: False where the original threw a TypeError and stopped the function
# that called it (see the report); cmds are what ran before it.
type Out is Data:
  Out{st: St, cmds: +List<C.Cmd>, ok: Bool}

# What an element id is to the graphs.
type Hit is Data:
  HSmall{g: Gs}
  HModal{}
  HButton{}
  HClose{}
  HNone{}

# A select menu value looked up in modal.graphInputs.
type Pick is Data:
  Pick{found: Bool, b: GBase, s: Span}

def cat(+xs: List<&2, C.Cmd>, +ys: List<&2, C.Cmd>) -> List<&2, C.Cmd>:
  List.append(&2, C.Cmd, xs, ys)

# globalGraphs
# ------------

def bases() -> List<&2, GBase>:
  [GBaro{}, GHum{}, GSolar{}, GTemp{}, GUv{}, GWindDir{}, GWindSpeed{}, GRainLine{}, GRainBar{}]

def base_key(+b: GBase) -> String:
  match b:
    case GBaro{}:
      "barometer"
    case GHum{}:
      "humidity"
    case GSolar{}:
      "solar"
    case GTemp{}:
      "temp"
    case GUv{}:
      "uv"
    case GWindDir{}:
      "windDir"
    case GWindSpeed{}:
      "windSpeed"
    case GRainLine{}:
      "rainfallLine"
    case GRainBar{}:
      "rainfallBar"

# The graphList entry whose `enabled === false` deletes the base in initAll
# (rainfall deletes both rainfall graphs).
def list_key(+b: GBase) -> String:
  match b:
    case GRainLine{}:
      "rainfall"
    case GRainBar{}:
      "rainfall"
    case _:
      base_key(b)

def base_on(+e: E.Env, +b: GBase) -> Bool:
  Bool.not(String.eq(E.opt(e, "graph." ++ list_key(b) ++ ".enabled", "true"), "false"))

def enabled.go(+e: E.Env, +bs: List<&2, GBase>) -> List<&2, GBase>:
  match bs:
    case Nil{}:
      []
    case Con{+b, rest}:
      +r = enabled.go(e, rest)
      Bool.pick(List<&2, GBase>, base_on(e, b), b <> r, r)

# Object.keys(globalGraphs) after initAll's deletes.
def enabled(+e: E.Env) -> List<&2, GBase>:
  enabled.go(e, bases())

def spans(+b: GBase) -> List<&2, Span>:
  match b:
    case GSolar{}:
      [SpHourlyDay{}, SpQuarterWeek{}, SpMinuteHour{}]
    case GUv{}:
      [SpHourlyDay{}, SpQuarterWeek{}]
    case GRainLine{}:
      [SpHourlyDay{}, SpMinuteHour{}]
    case GRainBar{}:
      [SpDailyMonth{}, SpMonthlyYear{}, SpQuarterWeek{}]
    case _:
      [SpDailyMonth{}, SpHourlyDay{}, SpQuarterWeek{}, SpMinuteHour{}]

def first_span(+b: GBase) -> Span:
  Maybe.default(&2, Span, List.head(&2, Span, spans(b)), SpHourlyDay{})

def span_key(+s: Span) -> String:
  match s:
    case SpDailyMonth{}:
      "dailyMonth"
    case SpHourlyDay{}:
      "hourlyDay"
    case SpQuarterWeek{}:
      "quarterDailyWeek"
    case SpMinuteHour{}:
      "minutlyHour"
    case SpMonthlyYear{}:
      "monthlyYear"

def is_bar(+b: GBase) -> Bool:
  match b:
    case GRainBar{}:
      True{}
    case _:
      False{}

def unit(+b: GBase) -> U.Measure:
  match b:
    case GBaro{}:
      U.Pressure{}
    case GHum{}:
      U.Humidity{}
    case GSolar{}:
      U.Solar{}
    case GTemp{}:
      U.Temp{}
    case GUv{}:
      U.UV{}
    case GWindDir{}:
      U.WindDirection{}
    case GWindSpeed{}:
      U.Wind{}
    case GRainLine{}:
      U.Rainfall{}
    case GRainBar{}:
      U.Rainfall{}

# globalGraphs[b].label
def label_word(+b: GBase) -> D.Phrase:
  match b:
    case GBaro{}:
      D.WGraphBaroLabel{}
    case GHum{}:
      D.WGraphHumidityLabel{}
    case GSolar{}:
      D.WGraphSolarLabel{}
    case GTemp{}:
      D.WTemperatureTitle{}
    case GUv{}:
      D.WGraphLabelUV{}
    case GWindDir{}:
      D.WGraphLabelWindDirection{}
    case GWindSpeed{}:
      D.WWindSpeedTitle{}
    case GRainLine{}:
      D.WRainfallTitle{}
    case GRainBar{}:
      D.WRainfallTitle{}

# The word each graph's title starts with.
def title_word(+b: GBase) -> D.Phrase:
  match b:
    case GBaro{}:
      D.WBarometerTitle{}
    case GHum{}:
      D.WHumidityTitle{}
    case GSolar{}:
      D.WSolarTitle{}
    case GTemp{}:
      D.WTemperatureTitle{}
    case GUv{}:
      D.WUvTitle{}
    case GWindDir{}:
      D.WGraphLabelWindDirection{}
    case GWindSpeed{}:
      D.WWindSpeedTitle{}
    case GRainLine{}:
      D.WRainfallTitle{}
    case GRainBar{}:
      D.WRainfallTitle{}

# globalGraphs[b].graphs[s].title
def title.tail(+e: E.Env, +s: Span) -> String:
  match s:
    case SpDailyMonth{}:
      "31" ++ " " ++ E.word(e, D.WGraphDays{})
    case SpHourlyDay{}:
      "24" ++ " " ++ E.word(e, D.WGraphHours{})
    case SpQuarterWeek{}:
      "7" ++ " " ++ E.word(e, D.WGraphDays{})
    case SpMinuteHour{}:
      E.word(e, D.WGraphHour{})
    case SpMonthlyYear{}:
      "12" ++ " " ++ E.word(e, D.WGraphMonths{})

def title(+e: E.Env, +b: GBase, +s: Span) -> String:
  E.word(e, title_word(b)) ++ " " ++ E.word(e, D.WGraphLast{}) ++ " " ++ title.tail(e, s)

# tickOptions, in key order.
def ticks(+b: GBase) -> List<&2, Ch.Tick>:
  match b:
    case GBaro{}:
      [Ch.TBeginAtZero{False{}}]
    case GHum{}:
      [Ch.TBeginAtZero{True{}}, Ch.TMin{0.0}, Ch.TMax{100.0}]
    case GSolar{}:
      [Ch.TBeginAtZero{True{}}]
    case GTemp{}:
      [Ch.TBeginAtZero{False{}}]
    case GUv{}:
      [Ch.TBeginAtZero{True{}}]
    case GWindDir{}:
      [Ch.TBeginAtZero{True{}}, Ch.TMin{0.0}, Ch.TMax{360.0}, Ch.TStep{90.0}]
    case GWindSpeed{}:
      [Ch.TBeginAtZero{True{}}]
    case GRainLine{}:
      [Ch.TBeginAtZero{False{}}]
    case GRainBar{}:
      [Ch.TBeginAtZero{True{}}]

# timeDisplay: the time axis unit of a line graph, the label format of a bar.
def time_display(+b: GBase, +s: Span) -> String:
  match b s:
    case GRainBar{} SpDailyMonth{}:
      "MMM D"
    case GRainBar{} SpMonthlyYear{}:
      "MMM YYYY"
    case GRainBar{} SpQuarterWeek{}:
      "ddd"
    case _ SpHourlyDay{}:
      "hour"
    case _ SpMinuteHour{}:
      "minute"
    case _ _:
      "day"

# graphIn.data[1]: the second series (temp dailyMonth, windSpeed minutlyHour).
def two(+b: GBase, +s: Span) -> Bool:
  match b s:
    case GTemp{} SpDailyMonth{}:
      True{}
    case GWindSpeed{} SpMinuteHour{}:
      True{}
    case _ _:
      False{}

# graphStyles
# -----------

def rgba(+c: String, +a: String) -> String:
  "rgba(" ++ c ++ ", " ++ a ++ ")"

def line_style(+c: String, +fill: Bool) -> Ch.Style:
  Ch.SLine{fill, rgba(c, "0.4"), rgba(c, "0.8"), rgba(c, "0.6"), rgba(c, "0.6"),
    rgba(c, "0.6"), rgba(c, "0.6")}

# graphStyles[globalGraphs[b].style]; colour.* from Globals.js.
def style(+b: GBase) -> Ch.Style:
  match b:
    case GBaro{}:
      line_style("40, 104, 206", False{})
    case GHum{}:
      line_style("16, 217, 244", False{})
    case GSolar{}:
      line_style("245, 193, 18", True{})
    case GTemp{}:
      line_style("209, 32, 32", False{})
    case GUv{}:
      line_style("234, 242, 45", True{})
    case GWindDir{}:
      line_style("23, 145, 27", False{})
    case GWindSpeed{}:
      line_style("23, 145, 27", False{})
    case GRainLine{}:
      line_style("0, 71, 183", False{})
    case GRainBar{}:
      Ch.SBar{rgba("0, 71, 183", "0.4"), rgba("0, 71, 183", "0.8"), 2.0}

# graphStyles[additionalStyles]: tempLow, windGust.
def style2(+b: GBase) -> Ch.Style:
  match b:
    case GTemp{}:
      line_style("0, 50, 200", False{})
    case _:
      line_style("188, 0, 255", False{})

def border(+st: Ch.Style) -> String:
  match st:
    case Ch.SLine{_, _, +b, _, _, _, _}:
      b
    case Ch.SBar{_, +b, _}:
      b

# graphDict
# ---------

def raw(+e: E.Env, +file: Nat, +i: Nat) -> String:
  match file:
    case 0n:
      E.cr(e, i)
    case 1n:
      E.cre(e, i)
    case 2n:
      E.crh(e, i)
    case _:
      E.crd(e, i)

def range_raw(+n: Nat, +e: E.Env, +file: Nat, +a: Nat) -> List<&2, String>:
  match n:
    case 0n:
      []
    case 1n+p:
      raw(e, file, a) <> range_raw(p, e, file, Nat.add(a, 1n))

def vals(+xs: List<&2, String>) -> List<&2, Val>:
  match xs:
    case Nil{}:
      []
    case Con{+x, rest}:
      VRaw{x} <> vals(rest)

def rot_val(+xs: List<&2, Val>, +k: Nat) -> List<&2, Val>:
  List.append(&2, Val, List.drop(&2, Val, xs, k), List.take(&2, Val, xs, k))

def rot_mo(+xs: List<&2, Dt.Mo>, +k: Nat) -> List<&2, Dt.Mo>:
  List.append(&2, Dt.Mo, List.drop(&2, Dt.Mo, xs, k), List.take(&2, Dt.Mo, xs, k))

# moment(arrayClientrawExtra[700], "DD") and moment(arrayClientraw[36], "MM")
def week_base(+e: E.Env) -> Dt.Mo:
  Dt.parse(E.clock(e), E.cre(e, 700n), Dt.fmt_dd())

def month_base(+e: E.Env) -> Dt.Mo:
  Dt.parse(E.clock(e), E.cr(e, 36n), Dt.fmt_mm())

# pMax: how far the weekly and monthly rain arrays rotate. A NaN (invalid
# moment) runs the loops no times.
def week_shift(+e: E.Env) -> Nat:
  Num.nat_of((Dt.iso_weekday(week_base(e)) - 1.0 : F32))

def month_shift(+e: E.Env) -> Nat:
  Num.nat_of(Dt.month(month_base(e)))

def rain7.go(+n: Nat, +e: E.Env, +i: Nat) -> List<&2, Val>:
  match n:
    case 0n:
      []
    case 1n+p:
      VNum{(Num.parse(E.cre(e, Nat.add(484n, i))) / 10.0 : F32)} <> rain7.go(p, e, Nat.add(i, 1n))

def series.of(+e: E.Env, +src: Src) -> List<&2, Val>:
  match src:
    case SrcR{+file, +a, +n, +b, +m}:
      vals(List.append(&2, String, range_raw(n, e, file, a), range_raw(m, e, file, b)))
    case SrcRain7{}:
      rot_val(rain7.go(7n, e, 0n), week_shift(e))
    case SrcRain12{}:
      rot_val(vals(range_raw(12n, e, 3n, 187n)), month_shift(e))

def hours(+a: Nat, +b: Nat) -> Src:
  SrcR{1n, a, 20n, b, 4n}

def daily(+a: Nat) -> Src:
  SrcR{3n, a, 31n, 0n, 0n}

def minutes(+a: Nat) -> Src:
  SrcR{2n, a, 60n, 0n, 0n}

def quarters(+a: Nat) -> Src:
  SrcR{3n, a, 28n, 0n, 0n}

# graphIn.data[0]: which graphDict array.
def src(+b: GBase, +s: Span) -> Src:
  match b s:
    case GBaro{} SpDailyMonth{}:
      daily(94n)
    case GBaro{} SpHourlyDay{}:
      hours(439n, 574n)
    case GBaro{} SpQuarterWeek{}:
      quarters(261n)
    case GBaro{} _:
      minutes(301n)
    case GHum{} SpDailyMonth{}:
      daily(199n)
    case GHum{} SpHourlyDay{}:
      hours(611n, 630n)
    case GHum{} SpQuarterWeek{}:
      quarters(289n)
    case GHum{} _:
      minutes(241n)
    case GSolar{} SpHourlyDay{}:
      hours(491n, 582n)
    case GSolar{} SpQuarterWeek{}:
      quarters(373n)
    case GSolar{} _:
      minutes(421n)
    case GTemp{} SpDailyMonth{}:
      daily(1n)
    case GTemp{} SpHourlyDay{}:
      hours(21n, 566n)
    case GTemp{} SpQuarterWeek{}:
      quarters(233n)
    case GTemp{} _:
      minutes(181n)
    case GUv{} SpHourlyDay{}:
      hours(511n, 586n)
    case GUv{} _:
      quarters(401n)
    case GWindDir{} SpDailyMonth{}:
      daily(156n)
    case GWindDir{} SpHourlyDay{}:
      hours(536n, 590n)
    case GWindDir{} SpQuarterWeek{}:
      quarters(317n)
    case GWindDir{} _:
      minutes(121n)
    case GWindSpeed{} SpDailyMonth{}:
      daily(125n)
    case GWindSpeed{} SpHourlyDay{}:
      hours(1n, 562n)
    case GWindSpeed{} SpQuarterWeek{}:
      quarters(345n)
    case GWindSpeed{} _:
      minutes(1n)
    case GRainLine{} SpHourlyDay{}:
      hours(41n, 570n)
    case GRainLine{} _:
      minutes(361n)
    case GRainBar{} SpDailyMonth{}:
      daily(63n)
    case GRainBar{} SpMonthlyYear{}:
      SrcRain12{}
    case GRainBar{} _:
      SrcRain7{}

# graphIn.data[1]: tempLowDays31, windGustMinutes60.
def src2(+b: GBase) -> Src:
  match b:
    case GTemp{}:
      daily(32n)
    case _:
      minutes(61n)

# Timestamps
# ----------

# parseInt(s) for the digits clientraw holds: leading space, a sign, digits;
# NaN when there are none.
def js_int.digits(+s: String, +acc: F32, +any: Bool) -> F32:
  match s:
    case SNil{}:
      Bool.pick(F32, any, acc, Num.nan())
    case SCon{+c, +t}:
      Bool.pick(F32, Char.is_digit(c), js_int.digits(t, (acc * 10.0 + Dt.digit(c) : F32), True{}),
        Bool.pick(F32, any, acc, Num.nan()))

def js_int.sign(+s: String) -> F32:
  match s:
    case SNil{}:
      Num.nan()
    case SCon{+c, +t}:
      Bool.pick(F32, Char.is_eq(c, '-'), F32.neg(js_int.digits(t, 0.0, False{})),
        Bool.pick(F32, Char.is_eq(c, '+'), js_int.digits(t, 0.0, False{}),
          js_int.digits(SCon{c, t}, 0.0, False{})))

def js_int(+s: String) -> F32:
  js_int.sign(String.trim_start(s))

def nth(+xs: List<&2, String>, +i: Nat) -> String:
  Maybe.default(&2, String, List.get(&2, String, xs, i), "undefined")

def hour_of(+s: String) -> F32:
  js_int(nth(String.split(s, ':'), 0n))

# maxHour: the largest parseInt(entry.split(":")[0]), from -1.
def max_hour(+xs: List<&2, String>, +mx: F32) -> F32:
  match xs:
    case Nil{}:
      mx
    case Con{+x, rest}:
      +hr = hour_of(x)
      max_hour(rest, Bool.pick(F32, (hr > mx : F32), hr, mx))

# a % b as JavaScript's %, the sign of a.
def js_mod(+a: F32, +b: F32) -> F32:
  (a - b * F32.trunc((a / b : F32)) : F32)

# The 12 to 24 hour conversion: ((hour + 12 * addTwelve) % 24) + ":" +
# split[1], addTwelve flipping after each hour 12.
def to24(+xs: List<&2, String>, +add: Bool) -> List<&2, String>:
  match xs:
    case Nil{}:
      []
    case Con{+x, rest}:
      +parts = String.split(x, ':')
      +jh = js_int(nth(parts, 0n))
      +h = js_mod((jh + Bool.pick(F32, add, 12.0, 0.0) : F32), 24.0)
      (Num.show(h) ++ ":" ++ nth(parts, 1n))
        <> to24(rest, Bool.pick(Bool, F32.is_eq(jh, 12.0), Bool.not(add), add))

def last(+xs: List<&2, String>) -> String:
  Maybe.default(&2, String, List.last(&2, String, xs), "")

def hour_moments(+xs: List<&2, String>, +c: E.Clock, +day: String) -> List<&2, Dt.Mo>:
  match xs:
    case Nil{}:
      []
    case Con{+x, rest}:
      Dt.parse(c, day ++ ":" ++ x, Dt.fmt_dd_hh_mm()) <> hour_moments(rest, c, day)

def back_day(+xs: List<&2, Dt.Mo>) -> List<&2, Dt.Mo>:
  match xs:
    case Nil{}:
      []
    case Con{+x, rest}:
      Dt.add_days(x, F32.neg(1.0)) <> back_day(rest)

def before(+x: Dt.Mo, +acc: List<&2, Dt.Mo>) -> Bool:
  match acc:
    case Nil{}:
      False{}
    case Con{+p, _}:
      Dt.lt(x, p)

# fix day changes: a moment earlier than the one before it moves all the
# earlier ones back a day. acc holds the moments so far, newest first.
def day_fix(+xs: List<&2, Dt.Mo>, +acc: List<&2, Dt.Mo>) -> List<&2, Dt.Mo>:
  match xs:
    case Nil{}:
      List.reverse(&2, Dt.Mo, acc)
    case Con{+x, rest}:
      day_fix(rest, x <> Bool.pick(List<&2, Dt.Mo>, before(x, acc), back_day(acc), acc))

# timestampHour: formatTimestampsToMoments(hour stamps, extra[700],
# "DD:HH:mm", clientraw[32]).
def stamp_hour(+e: E.Env) -> List<&2, Dt.Mo>:
  +xs = List.append(&2, String, range_raw(20n, e, 1n, 459n), range_raw(4n, e, 1n, 578n))
  +pm = String.contains(last(String.split(E.cr(e, 32n), ':')), "PM")
  +conv = Bool.pick(List<&2, String>, F32.is_eq(max_hour(xs, F32.neg(1.0)), 12.0), to24(xs, pm), xs)
  +d = E.cre(e, 700n)
  +day = Bool.pick(String, String.eq(d, "0"), Dt.today_dd(E.clock(e)), d)
  day_fix(hour_moments(conv, E.clock(e), day), [])

def days31(+n: Nat, +base: Dt.Mo, +i: F32) -> List<&2, Dt.Mo>:
  match n:
    case 0n:
      []
    case 1n+p:
      Dt.add_days(base, (i - 31.0 : F32)) <> days31(p, base, (i + 1.0 : F32))

# timestampDay: moment(daily[232]:[230]:[231], "DD:HH:mm").subtract(31 - i, "days")
def stamp_day(+e: E.Env) -> List<&2, Dt.Mo>:
  +base = Dt.parse(E.clock(e), E.crd(e, 232n) ++ ":" ++ E.crd(e, 230n) ++ ":" ++ E.crd(e, 231n),
    Dt.fmt_dd_hh_mm())
  days31(31n, base, 0.0)

def mins60(+n: Nat, +base: Dt.Mo, +i: F32) -> List<&2, Dt.Mo>:
  match n:
    case 0n:
      []
    case 1n+p:
      Dt.add_minutes(base, (i - 60.0 : F32)) <> mins60(p, base, (i + 1.0 : F32))

# timestampMinute: moment(clientraw[35]:[29]:01, "DD:HH:mm").subtract(60 - i, "minutes")
def stamp_minute(+e: E.Env) -> List<&2, Dt.Mo>:
  +base = Dt.parse(E.clock(e), E.cr(e, 35n) ++ ":" ++ E.cr(e, 29n) ++ ":01", Dt.fmt_dd_hh_mm())
  mins60(60n, base, 0.0)

def quarters28(+n: Nat, +base: Dt.Mo, +i: F32) -> List<&2, Dt.Mo>:
  match n:
    case 0n:
      []
    case 1n+p:
      Dt.add_minutes(base, ((i * 6.0 - 168.0) * 60.0 : F32)) <> quarters28(p, base, (i + 1.0 : F32))

# timestampQuarterDay: moment(daily[232] + ":00:00", "DD:HH:mm").subtract(168 - i * 6, "hours")
def stamp_quarter(+e: E.Env) -> List<&2, Dt.Mo>:
  +base = Dt.parse(E.clock(e), E.crd(e, 232n) ++ ":00:00", Dt.fmt_dd_hh_mm())
  quarters28(28n, base, 0.0)

def week7(+n: Nat, +base: Dt.Mo, +i: F32, +k: F32) -> List<&2, Dt.Mo>:
  match n:
    case 0n:
      []
    case 1n+p:
      +x = Dt.set_iso_weekday(base, (i - 6.0 : F32))
      Bool.pick(Dt.Mo, (i < k : F32), Dt.add_days(x, 7.0), x) <> week7(p, base, (i + 1.0 : F32), k)

# timestampWeekDay: moment(extra[700], "DD").isoWeekday(i - 6); the first
# pMax a week later; then rotated pMax places, as rainDays7 is.
def stamp_week(+e: E.Env) -> List<&2, Dt.Mo>:
  +k = week_shift(e)
  rot_mo(week7(7n, week_base(e), 0.0, Num.of_nat(k)), k)

def month12(+n: Nat, +base: Dt.Mo, +i: F32, +k: F32) -> List<&2, Dt.Mo>:
  match n:
    case 0n:
      []
    case 1n+p:
      +x = Dt.set_month(base, (i - 12.0 : F32))
      Bool.pick(Dt.Mo, (i < k : F32), Dt.add_months(x, 12.0), x) <> month12(p, base, (i + 1.0 : F32), k)

# timestampMonth: moment(clientraw[36], "MM").month(i - 12); the first pMax
# a year later; then rotated pMax places, as rainMonths12 is.
def stamp_month(+e: E.Env) -> List<&2, Dt.Mo>:
  +k = month_shift(e)
  rot_mo(month12(12n, month_base(e), 0.0, Num.of_nat(k)), k)

# graphIn.timestamp
def stamps(+e: E.Env, +b: GBase, +s: Span) -> List<&2, Ch.Stamp>:
  match b s:
    case GRainBar{} SpMonthlyYear{}:
      Dt.stamps(stamp_month(e))
    case GRainBar{} SpQuarterWeek{}:
      Dt.stamps(stamp_week(e))
    case _ SpDailyMonth{}:
      Dt.stamps(stamp_day(e))
    case _ SpHourlyDay{}:
      Dt.stamps(stamp_hour(e))
    case _ SpQuarterWeek{}:
      Dt.stamps(stamp_quarter(e))
    case _ _:
      Dt.stamps(stamp_minute(e))

# Charts
# ------

# formatDataToUnit(value, unit), as text.
def fmt_val(+e: E.Env, +k: U.Measure, +v: Val) -> String:
  match v:
    case VRaw{+s}:
      U.show_raw(E.units(e), k, s)
    case VNum{+x}:
      U.show(E.units(e), k, x)

def points(+ts: List<&2, Ch.Stamp>, +vs: List<&2, Val>, +e: E.Env, +k: U.Measure) -> List<&2, Ch.Point>:
  match ts vs:
    case Con{+t, tr} Con{+v, vr}:
      Ch.Point{t, fmt_val(e, k, v)} <> points(tr, vr, e, k)
    case _ _:
      []

def values(+vs: List<&2, Val>, +e: E.Env, +k: U.Measure) -> List<&2, String>:
  match vs:
    case Nil{}:
      []
    case Con{+v, rest}:
      fmt_val(e, k, v) <> values(rest, e, k)

def labels(+ts: List<&2, Ch.Stamp>, +f: String) -> List<&2, Ch.Label>:
  match ts:
    case Nil{}:
      []
    case Con{+t, rest}:
      Ch.Label{t, f} <> labels(rest, f)

# " (" + units[unit][currentUnits[unit]][1] + ")"
def unit_tag(+e: E.Env, +b: GBase) -> String:
  " (" ++ E.label(e, unit(b)) ++ ")"

def axis_label(+e: E.Env, +b: GBase) -> String:
  E.word(e, label_word(b)) ++ unit_tag(e, b)

def legend_word(+b: GBase, +second: Bool) -> D.Phrase:
  match b:
    case GTemp{}:
      Bool.pick(D.Phrase, second, D.WGraphMin{}, D.WGraphMax{})
    case _:
      Bool.pick(D.Phrase, second, D.WWindSpeedGust{}, D.WWindSpeedAverage{})

# data.datasets of a line graph: graphStyles[style] with label and data; a
# second series gets graphStyles[additionalStyles] and both get the
# legendLabels.
def line_sets(+e: E.Env, +snap: E.Env, +b: GBase, +s: Span) -> List<&2, Ch.Dataset>:
  +ts = stamps(snap, b, s)
  +k = unit(b)
  +d0 = {Ch.SPoints{points(ts, series.of(snap, src(b, s)), e, k)} : Ch.Series}
  +both = two(b, s)
  +l0 = Bool.pick(String, both, E.word(e, legend_word(b, False{})) ++ unit_tag(e, b), axis_label(e, b))
  +first = {Ch.Dataset{l0, style(b), d0} : Ch.Dataset}
  +second = {Ch.Dataset{E.word(e, legend_word(b, True{})) ++ unit_tag(e, b), style2(b),
    Ch.SPoints{points(ts, series.of(snap, src2(b)), e, k)}} : Ch.Dataset}
  Bool.pick(List<&2, Ch.Dataset>, both, [first, second], [first])

def bar_set(+e: E.Env, +snap: E.Env, +b: GBase, +s: Span) -> Ch.Dataset:
  Ch.Dataset{axis_label(e, b), style(b), Ch.SValues{values(series.of(snap, src(b, s)), e, unit(b))}}

def bar_labels(+snap: E.Env, +b: GBase, +s: Span) -> List<&2, Ch.Label>:
  labels(stamps(snap, b, s), time_display(b, s))

def white() -> String:
  "rgba(255, 255, 255, 1)"

# A font size of w * pct / 100 (parentDiv.clientWidth * 0.05 and * 0.04),
# taken exactly and rounded once.
def px(+w: F32, +pct: F32) -> Ch.Size:
  Ch.SizePx{(w * pct / 100.0 : F32)}

# The modal line graph's displayFormats; day is "ddd" for the weekly graphs.
def formats(+day: String) -> List<&2, Ch.Fmt>:
  [Ch.Fmt{"day", day}, Ch.Fmt{"hour", "HH:mm"}, Ch.Fmt{"millisecond", "h:mm:ss.SSS a"},
   Ch.Fmt{"minute", "HH:mm"}, Ch.Fmt{"month", "MMM YYYY"}, Ch.Fmt{"quarter", "[Q]Q - YYYY"},
   Ch.Fmt{"second", "h:mm:ss a"}, Ch.Fmt{"week", "ll"}, Ch.Fmt{"year", "YYYY"}]

def small_x(+bar: Bool, +unit_s: String, +w: F32) -> Ch.XAxis:
  Bool.pick(Ch.XAxis, bar, Ch.XCategory{px(w, 4.0)},
    Ch.XTime{unit_s, 1.0, [Ch.Fmt{"hour", "HH:mm"}], True{}, 0.0, px(w, 4.0)})

# draw<X>Graph*01 and resizeText*: the empty small graph, its fonts sized
# off the parent's width w.
def small_empty(+bar: Bool, +w: F32) -> Ch.Chart:
  Ch.Chart{Bool.pick(String, bar, "bar", "line"), [], [], white(),
    Ch.TShow{"Custom Chart Title", px(w, 5.0)}, small_x(bar, "hour", w),
    Ch.YAxis{True{}, Ch.LNull{}, px(w, 5.0), [], px(w, 5.0)}, Ch.LegendAuto{}}

# draw*'s chart as initialize* first makes it, before resize* sizes the text.
def small_unsized(+bar: Bool) -> Ch.Chart:
  Ch.Chart{Bool.pick(String, bar, "bar", "line"), [], [], white(),
    Ch.TShow{"Custom Chart Title", Ch.SizeAuto{}},
    Bool.pick(Ch.XAxis, bar, Ch.XCategory{Ch.SizeAuto{}},
      Ch.XTime{"hour", 1.0, [Ch.Fmt{"hour", "HH:mm"}], True{}, 0.0, Ch.SizeAuto{}}),
    Ch.YAxis{True{}, Ch.LNull{}, Ch.SizeAuto{}, [], Ch.SizeAuto{}}, Ch.LegendAuto{}}

# configureGraph<X>*01 then resizeText*: the configured small graph.
def chart_labels(+bar: Bool, +snap: E.Env, +b: GBase, +s: Span) -> List<&2, Ch.Label>:
  match bar:
    case True{}:
      bar_labels(snap, b, s)
    case False{}:
      []

def chart_sets(+bar: Bool, +e: E.Env, +snap: E.Env, +b: GBase, +s: Span) -> List<&2, Ch.Dataset>:
  match bar:
    case True{}:
      [bar_set(e, snap, b, s)]
    case False{}:
      line_sets(e, snap, b, s)

def small_chart(+e: E.Env, +snap: E.Env, +b: GBase, +s: Span, +w: F32) -> Ch.Chart:
  +bar = is_bar(b)
  Ch.Chart{Bool.pick(String, bar, "bar", "line"), chart_labels(bar, snap, b, s),
    chart_sets(bar, e, snap, b, s),
    white(), Ch.TShow{title(e, b, s), px(w, 5.0)}, small_x(bar, time_display(b, s), w),
    Ch.YAxis{True{}, Ch.LText{axis_label(e, b)}, px(w, 5.0), ticks(b), px(w, 5.0)},
    Ch.LegendAuto{}}

# initializeModalGraph01's drawGraphLine: the empty modal chart.
def modal_empty() -> Ch.Chart:
  Ch.Chart{"line", [], [], white(), Ch.TNone{},
    Ch.XTime{"hour", 1.0, formats("MMM D"), True{}, 0.0, Ch.SizeAuto{}},
    Ch.YAxis{True{}, Ch.LNull{}, Ch.SizePx{20.0}, [], Ch.SizeAuto{}}, Ch.LegendShow{False{}}}

def modal_y(+e: E.Env, +b: GBase) -> Ch.YAxis:
  Ch.YAxis{True{}, Ch.LText{axis_label(e, b)}, Ch.SizePx{20.0}, ticks(b), Ch.SizeAuto{}}

# State
# -----

def modal_chart.go(+bar: Bool, +e: E.Env, +snap: E.Env, +b: GBase, +s: Span) -> Ch.Chart:
  match bar:
    case True{}:
      Ch.Chart{"bar", bar_labels(snap, b, s), [bar_set(e, snap, b, s)], white(), Ch.TNone{},
        Ch.XCategory{Ch.SizeAuto{}}, modal_y(e, b), Ch.LegendAuto{}}
    case False{}:
      +week = String.eq(span_key(s), "quarterDailyWeek")
      Ch.Chart{"line", [], line_sets(e, snap, b, s), white(), Ch.TNone{},
        Ch.XTime{time_display(b, s), 1.0, formats(Bool.pick(String, week, "ddd", "MMM D")), True{}, 0.0,
          Ch.SizeAuto{}},
        modal_y(e, b), Ch.LegendShow{two(b, s)}}

# configureGraphLine / configureGraphBar. The legend loop runs
# tickKeys.length times over legendKeys: legend.display ends true exactly
# for the two series graphs (the other assignments set legend.undefined).
def modal_chart(+e: E.Env, +snap: E.Env, +b: GBase, +s: Span) -> Ch.Chart:
  modal_chart.go(is_bar(b), e, snap, b, s)

def hit(+id: String) -> Hit:
  Bool.pick(Hit, String.eq(id, "baroGraphCanvas01"), HSmall{GsBaro{}},
    Bool.pick(Hit, String.eq(id, "rainGraphCanvas01"), HSmall{GsRain{}},
      Bool.pick(Hit, String.eq(id, "tempGraphCanvas01"), HSmall{GsTemp{}},
        Bool.pick(Hit, String.eq(id, "windGraphCanvas01"), HSmall{GsWind{}},
          Bool.pick(Hit, String.eq(id, "ModalCanvas"), HModal{},
            Bool.pick(Hit, String.eq(id, "GraphsButton"), HButton{},
              Bool.pick(Hit, String.eq(id, "graphClose") || String.eq(id, "myModal"), HClose{},
                HNone{})))))))

def small_on(+s: Small) -> Bool:
  match s:
    case Small{+on, _, _}:
      on

def small_w(+s: Small) -> F32:
  match s:
    case Small{_, _, +w}:
      w

def gs_canvas(+g: Gs) -> String:
  match g:
    case GsBaro{}:
      "baroGraphCanvas01"
    case GsRain{}:
      "rainGraphCanvas01"
    case GsTemp{}:
      "tempGraphCanvas01"
    case GsWind{}:
      "windGraphCanvas01"

def gs_base(+g: Gs) -> GBase:
  match g:
    case GsBaro{}:
      GBaro{}
    case GsRain{}:
      GRainBar{}
    case GsTemp{}:
      GTemp{}
    case GsWind{}:
      GWindSpeed{}

# The graph each small one shows: rainfallBar dailyMonth, the others hourlyDay.
def gs_span(+g: Gs) -> Span:
  match g:
    case GsRain{}:
      SpDailyMonth{}
    case _:
      SpHourlyDay{}

def small_of(+st: St, +g: Gs) -> Small:
  match st:
    case St{_, _, _, _, _, _, _, +baro, +rain, +temp, +wind, _, _}:
      match g:
        case GsBaro{}:
          baro
        case GsRain{}:
          rain
        case GsTemp{}:
          temp
        case GsWind{}:
          wind

def with_small(+st: St, +g: Gs, +s: Small) -> St:
  match st:
    case St{snap, ready, modal, handler, has_cur, cb, cs, baro, rain, temp, wind, vw, vh}:
      match g:
        case GsBaro{}:
          St{snap, ready, modal, handler, has_cur, cb, cs, s, rain, temp, wind, vw, vh}
        case GsRain{}:
          St{snap, ready, modal, handler, has_cur, cb, cs, baro, s, temp, wind, vw, vh}
        case GsTemp{}:
          St{snap, ready, modal, handler, has_cur, cb, cs, baro, rain, s, wind, vw, vh}
        case GsWind{}:
          St{snap, ready, modal, handler, has_cur, cb, cs, baro, rain, temp, s, vw, vh}

def snap_of(+st: St) -> E.Env:
  match st:
    case St{+snap, _, _, _, _, _, _, _, _, _, _, _, _}:
      snap

def ready_of(+st: St) -> Bool:
  match st:
    case St{_, +ready, _, _, _, _, _, _, _, _, _, _, _}:
      ready

def modal_of(+st: St) -> Bool:
  match st:
    case St{_, _, +modal, _, _, _, _, _, _, _, _, _, _}:
      modal

def handler_of(+st: St) -> Bool:
  match st:
    case St{_, _, _, +handler, _, _, _, _, _, _, _, _, _}:
      handler

def with_cur(+st: St, +b: GBase, +s: Span) -> St:
  match st:
    case St{snap, ready, modal, handler, _, _, _, baro, rain, temp, wind, vw, vh}:
      St{snap, ready, modal, handler, True{}, b, s, baro, rain, temp, wind, vw, vh}

def with_view(+st: St, +vw: F32, +vh: F32) -> St:
  match st:
    case St{snap, ready, modal, handler, has_cur, cb, cs, baro, rain, temp, wind, _, _}:
      St{snap, ready, modal, handler, has_cur, cb, cs, baro, rain, temp, wind, vw, vh}

def with_snap(+st: St, +e: E.Env) -> St:
  match st:
    case St{_, _, modal, handler, has_cur, cb, cs, baro, rain, temp, wind, vw, vh}:
      St{e, True{}, modal, handler, has_cur, cb, cs, baro, rain, temp, wind, vw, vh}

def first_base(+e: E.Env) -> GBase:
  Maybe.default(&2, GBase, List.head(&2, GBase, enabled(e)), GBaro{})

# The state after initAll. A disabled graphHandler<X> throws in initAll
# (`baroGraph.canvas.style` is undefined: canvas holds the 2d context), so
# nothing after it initialises; see start_small.
def init(+e: E.Env) -> St:
  +b = E.on(e, "graphHandlerBarometer.enabled")
  +r = b && E.on(e, "graphHandlerRainfall.enabled")
  +t = r && E.on(e, "graphHandlerTemperature.enabled")
  +w = t && E.on(e, "graphHandlerWindSpeed.enabled")
  +any = Bool.not(List.is_empty(&2, GBase, enabled(e)))
  +modal = w && E.on(e, "graphHandler.enabled") && any
  +fb = first_base(e)
  St{e, False{}, modal, w && E.on(e, "modalHandler.enabled") && (any || Bool.not(E.on(e, "graphHandler.enabled"))),
    modal, fb, first_span(fb),
    Small{b, False{}, 0.0}, Small{r, False{}, 0.0}, Small{t, False{}, 0.0}, Small{w, False{}, 0.0},
    0.0, 0.0}

# Sizes
# -----

def small_w_css(+w: F32) -> String:
  Num.show(w) ++ "px"

def small_h_css(+w: F32) -> String:
  Num.show((w * 665.0 / 1000.0 : F32)) ++ "px"

# resizeCanvas<X>G01: the div gets the parent's width, 0.7 * 0.95 of it high.
def small_size(+g: Gs, +w: F32) -> C.Cmd:
  C.CChartSize{gs_canvas(g), small_w_css(w), small_h_css(w)}

def modal_dim(+vw: F32, +vh: F32) -> F32:
  Bool.pick(F32, (vh <= vw : F32), vh, vw)

# resizeCanvasModG01: 0.4 of the smaller of the document's client height and
# width high, twice that wide.
def modal_size(+st: St) -> C.Cmd:
  match st:
    case St{_, _, _, _, _, _, _, _, _, _, _, +vw, +vh}:
      +d = modal_dim(vw, vh)
      C.CChartSize{"ModalCanvas", Num.show((d * 8.0 / 10.0 : F32)) ++ "px", Num.show((d * 4.0 / 10.0 : F32)) ++ "px"}

# What the small graph shows, with its text sized off w.
def small_shown(+s: Small) -> Bool:
  match s:
    case Small{_, +shown, _}:
      shown

def small_view.go(+shown: Bool, +snap: E.Env, +e: E.Env, +g: Gs, +w: F32) -> Ch.Chart:
  match shown:
    case True{}:
      small_chart(e, snap, gs_base(g), gs_span(g), w)
    case False{}:
      small_empty(is_bar(gs_base(g)), w)

def small_view(+st: St, +e: E.Env, +g: Gs, +w: F32) -> Ch.Chart:
  small_view.go(small_shown(small_of(st, g)), snap_of(st), e, g, w)

# Configuring
# -----------

def configure_small.go(+inited: Bool, +st: St, +e: E.Env, +g: Gs) -> Out:
  match inited:
    case False{}:
      # baroGraph.chart is null: chart.destroy() throws
      Out{st, [], False{}}
    case True{}:
      +w = small_w(small_of(st, g))
      +st2 = with_small(st, g, Small{True{}, True{}, w})
      Out{st2, [C.CChart{gs_canvas(g), small_view(st2, e, g, w)}, small_size(g, w)], True{}}

def configure_small.ready(+ready: Bool, +st: St, +e: E.Env, +g: Gs) -> Out:
  match ready:
    case False{}:
      # graphDict[graphIn.timestamp] is undefined: .length throws
      Out{st, [], False{}}
    case True{}:
      configure_small.go(small_on(small_of(st, g)), st, e, g)

def configure_small.on(+on: Bool, +st: St, +e: E.Env, +g: Gs) -> Out:
  match on:
    case False{}:
      Out{st, [C.CLog{"Graph not enabled."}], True{}}
    case True{}:
      configure_small.ready(ready_of(st), st, e, g)

# configureGraphBaroLine01("barometer", "hourlyDay") and the other three:
# "Graph not enabled." when initAll deleted the base, else the chart again
# and resizeCanvas<X>G01 (sized off the width last measured).
def configure_small(+st: St, +e: E.Env, +g: Gs) -> Out:
  configure_small.on(base_on(e, gs_base(g)), st, e, g)

def configure_modal.go(+inited: Bool, +st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  match inited:
    case False{}:
      # modalGraph.chart is null: cleanCanvas throws
      Out{st, [], False{}}
    case True{}:
      +bd = border(style(b))
      Out{st, [C.CChart{"ModalCanvas", modal_chart(e, snap_of(st), b, s)},
        C.CHtml{"graphHeaderText", title(e, b, s)},
        C.CStyle{"graphHeader", "backgroundColor", bd},
        C.CStyle{"graphFooter", "backgroundColor", bd},
        modal_size(st)], True{}}

def configure_modal.ready(+ready: Bool, +st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  match ready:
    case False{}:
      Out{st, [], False{}}
    case True{}:
      configure_modal.go(modal_of(st), st, e, b, s)

def configure_modal.on(+on: Bool, +st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  match on:
    case False{}:
      # globalGraphs[val1] is undefined: ["graphType"] throws
      Out{st, [], False{}}
    case True{}:
      configure_modal.ready(ready_of(st), with_cur(st, b, s), e, b, s)

# configureGraph(val1, val2): currentGraph becomes [val1, val2], then the
# modal chart is rebuilt, the header shows the title, header and footer take
# the style's border colour, and resizeCanvasModG01.
def configure_modal(+st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  configure_modal.on(base_on(e, b), st, e, b, s)

# configureGraph(modalGraph.currentGraph[0], [1]); currentGraph null throws.
def configure_current.go(+has_cur: Bool, +st: St, +e: E.Env, +cb: GBase, +cs: Span) -> Out:
  match has_cur:
    case True{}:
      configure_modal(st, e, cb, cs)
    case False{}:
      Out{st, [], False{}}

def configure_current(+st: St, +e: E.Env) -> Out:
  match st:
    case St{_, _, _, _, +has_cur, +cb, +cs, _, _, _, _, _, _}:
      configure_current.go(has_cur, st, e, cb, cs)

# The commands so far, then what came next.
def after(+cmds: List<&2, C.Cmd>, +o: Out) -> Out:
  match o:
    case Out{+st2, +cmds2, +ok2}:
      Out{st2, cat(cmds, cmds2), ok2}

def then_small(+o: Out, +e: E.Env, +g: Gs) -> Out:
  match o:
    case Out{+st, +cmds, +ok}:
      match ok:
        case False{}:
          o
        case True{}:
          after(cmds, configure_small(st, e, g))

def then_current(+o: Out, +e: E.Env) -> Out:
  match o:
    case Out{+st, +cmds, +ok}:
      match ok:
        case False{}:
          o
        case True{}:
          after(cmds, configure_current(st, e))

# API
# ---

# Chart.defaults.global and the chartArea background plugin.
def chart_defaults() -> Ch.Defaults:
  Ch.defaults()

def start_small.go(+gs: List<&2, Gs>, +st: St) -> List<&2, C.Cmd>:
  match gs:
    case Nil{}:
      []
    case Con{+g, rest}:
      +r = start_small.go(rest, st)
      Bool.pick(List<&2, C.Cmd>, small_on(small_of(st, g)),
        C.CChart{gs_canvas(g), small_unsized(is_bar(gs_base(g)))} <> r, r)

# initAll's initialize{Baro,Rain,Temp,Wind}Graph01: each draws its empty
# chart (resize sizes it). ok False: a disabled one threw, and initAll stops.
def start_small(+st: St, +e: E.Env) -> Out:
  +gs = {[GsBaro{}, GsRain{}, GsTemp{}, GsWind{}] : List<&2, Gs>}
  Out{st, start_small.go(gs, st), small_on(small_of(st, GsWind{}))}

def hide(+on: Bool, +id: String) -> List<&2, C.Cmd>:
  Bool.pick(List<&2, C.Cmd>, on, [], [C.CStyle{id, "display", "none"}])

# initAll's graphList checks: a deleted graph's small canvas is hidden.
def start_lists(+e: E.Env) -> List<&2, C.Cmd>:
  cat(hide(base_on(e, GBaro{}), "baroGraphCanvas01"),
    cat(hide(base_on(e, GTemp{}), "tempGraphCanvas01"),
      cat(hide(base_on(e, GWindSpeed{}), "windGraphCanvas01"),
        hide(base_on(e, GRainBar{}), "rainGraphCanvas01"))))

def options.spans(+ss: List<&2, Span>, +e: E.Env, +b: GBase) -> List<&2, C.Cmd>:
  match ss:
    case Nil{}:
      []
    case Con{+s, rest}:
      C.COption{"selectMenu", base_key(b) ++ span_key(s), title(e, b, s)} <> options.spans(rest, e, b)

def options.go(+bs: List<&2, GBase>, +e: E.Env) -> List<&2, C.Cmd>:
  match bs:
    case Nil{}:
      []
    case Con{+b, rest}:
      cat(options.spans(spans(b), e, b), options.go(rest, e))

# initializeModalGraph01 (the empty modal chart; resize sizes it) and
# initModalHandler (modal hidden, select menu filled from globalGraphs,
# GraphsButton's label).
def start_modal(+st: St, +e: E.Env) -> Out:
  +m = Bool.pick(List<&2, C.Cmd>, modal_of(st), [C.CChart{"ModalCanvas", modal_empty()}], [])
  +h = Bool.pick(List<&2, C.Cmd>, handler_of(st),
    cat([C.CStyle{"myModal", "display", "none"}],
      cat(options.go(enabled(e), e), [C.CHtml{"GraphsButton", E.word(e, D.WButtonLabelGraphs{})}])),
    [])
  +crash = E.on(e, "graphHandler.enabled") && small_on(small_of(st, GsWind{}))
    && List.is_empty(&2, GBase, enabled(e))
  Out{st, cat(m, h), Bool.not(crash)}

def canvases.go(+gs: List<&2, Gs>, +st: St) -> List<&2, String>:
  match gs:
    case Nil{}:
      []
    case Con{+g, rest}:
      +r = canvases.go(rest, st)
      Bool.pick(List<&2, String>, small_on(small_of(st, g)), gs_canvas(g) <> r, r)

# The canvases whose resize listeners these register, in initAll's order:
# the small ones (after the wind chill's), and the modal's (after the wind
# speed's).
def small_canvases(+st: St) -> List<&2, String>:
  +gs = {[GsBaro{}, GsRain{}, GsTemp{}, GsWind{}] : List<&2, Gs>}
  canvases.go(gs, st)

def modal_canvases(+st: St) -> List<&2, String>:
  Bool.pick(List<&2, String>, modal_of(st), ["ModalCanvas"], [])

def resize_small.go(+on: Bool, +shown: Bool, +st: St, +e: E.Env, +g: Gs, +w: F32) -> Out:
  match on:
    case True{}:
      +st2 = with_small(st, g, Small{on, shown, w})
      Out{st2, [C.CChart{gs_canvas(g), small_view(st2, e, g, w)}, small_size(g, w)], True{}}
    case False{}:
      Out{st, [], True{}}

def resize_small(+st: St, +e: E.Env, +g: Gs, +w: F32) -> Out:
  resize_small.go(small_on(small_of(st, g)), small_shown(small_of(st, g)), st, e, g, w)

def resize_modal.go(+on: Bool, +st: St, +vw: F32, +vh: F32) -> Out:
  match on:
    case True{}:
      +st2 = with_view(st, vw, vh)
      Out{st2, [modal_size(st2)], True{}}
    case False{}:
      Out{st, [], True{}}

def resize_modal(+st: St, +vw: F32, +vh: F32) -> Out:
  resize_modal.go(modal_of(st), st, vw, vh)

# A resize listener: resizeCanvas<X>G01 (needs Box.gw, the div's parent's
# clientWidth; the text is resized too, so the chart is made again) or
# resizeCanvasModG01 (needs Box.vw and vh).
def resize.go(+h: Hit, +st: St, +e: E.Env, +b: E.Box) -> Out:
  match h:
    case HSmall{+g}:
      match b:
        case E.Box{_, _, +gw, _, _, _}:
          resize_small(st, e, g, gw)
    case HModal{}:
      match b:
        case E.Box{_, _, _, _, +vw, +vh}:
          resize_modal(st, vw, vh)
    case _:
      Out{st, [], True{}}

def resize(+st: St, +e: E.Env, +id: String, +b: E.Box) -> Out:
  resize.go(hit(id), st, e, b)

# tryUpdateWidgets, once any file changed: processGraphData on the current
# fields, then configureGraphRainBar01, ...TempLine01, ...WindLine01,
# ...BaroLine01 and configureGraph(currentGraph). ok False: one threw, and
# tryUpdateWidgets stops there (firstTime stays true, loadingFinished does
# not run).
def data(+st: St, +e: E.Env) -> Out:
  +o = {Out{with_snap(st, e), [], True{}} : Out}
  then_current(then_small(then_small(then_small(then_small(o, e, GsRain{}), e, GsTemp{}), e, GsWind{}), e, GsBaro{}), e)

# updateUnits(kind): the small graph showing that kind is configured again
# (the modal is not). ok False: it threw (no data yet), and updateUnits
# stops before updateValuesRe01.
def units(+st: St, +e: E.Env, +k: U.Measure) -> Out:
  match k:
    case U.Pressure{}:
      configure_small(st, e, GsBaro{})
    case U.Wind{}:
      configure_small(st, e, GsWind{})
    case U.Rainfall{}:
      configure_small(st, e, GsRain{})
    case U.Temp{}:
      configure_small(st, e, GsTemp{})
    case _:
      Out{st, [], True{}}

def open.go(+st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  after([C.CValue{"selectMenu", base_key(b) ++ span_key(s)}, C.CStyle{"myModal", "display", "block"}],
    configure_modal(st, e, b, s))

# A graph canvas's click: the select shows its graph, the modal opens and
# configureGraph builds it (the click's extra modalGraph.chart.resize() finds
# the size unchanged and is left out).
def open.if(+handler: Bool, +st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  match handler:
    case True{}:
      open.go(st, e, b, s)
    case False{}:
      Out{st, [], True{}}

def open(+st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  open.if(handler_of(st), st, e, b, s)

# GraphsButton: the same for modalGraph.currentGraph; while currentGraph is
# null (no graphHandler) currentGraph[0] throws first.
def open_current.go(+go: Bool, +handler: Bool, +st: St, +e: E.Env, +cb: GBase, +cs: Span) -> Out:
  match go:
    case True{}:
      open.go(st, e, cb, cs)
    case False{}:
      Out{st, [], Bool.not(handler)}

def open_current(+st: St, +e: E.Env) -> Out:
  match st:
    case St{_, _, _, +handler, +has_cur, +cb, +cs, _, _, _, _, _, _}:
      open_current.go(handler && has_cur, handler, st, e, cb, cs)

def close(+st: St) -> Out:
  Out{st, Bool.pick(List<&2, C.Cmd>, handler_of(st), [C.CStyle{"myModal", "display", "none"}], []), True{}}

# A click; id is the clicked element's. The graph canvases and GraphsButton
# open the modal; graphClose's onclick and window.onclick (the graph modal's
# is the one that survives initAll) on myModal itself close it.
def click.go(+h: Hit, +st: St, +e: E.Env) -> Out:
  match h:
    case HSmall{+g}:
      open(st, e, gs_base(g), gs_span(g))
    case HButton{}:
      open_current(st, e)
    case HClose{}:
      close(st)
    case _:
      Out{st, [], True{}}

def click(+st: St, +e: E.Env, +id: String) -> Out:
  click.go(hit(id), st, e)

def pick.spans(+ss: List<&2, Span>, +b: GBase, +v: String) -> Pick:
  match ss:
    case Nil{}:
      Pick{False{}, b, SpHourlyDay{}}
    case Con{+s, rest}:
      Bool.pick(Pick, String.eq(base_key(b) ++ span_key(s), v), Pick{True{}, b, s}, pick.spans(rest, b, v))

def pick.found(+p: Pick) -> Bool:
  match p:
    case Pick{+f, _, _}:
      f

def pick.go(+bs: List<&2, GBase>, +v: String) -> Pick:
  match bs:
    case Nil{}:
      Pick{False{}, GBaro{}, SpHourlyDay{}}
    case Con{+b, rest}:
      +p = pick.spans(spans(b), b, v)
      Bool.pick(Pick, pick.found(p), p, pick.go(rest, v))

def change.if(+found: Bool, +st: St, +e: E.Env, +b: GBase, +s: Span) -> Out:
  match found:
    case True{}:
      configure_modal(st, e, b, s)
    case False{}:
      Out{st, [], False{}}

def change.go(+p: Pick, +st: St, +e: E.Env) -> Out:
  match p:
    case Pick{+found, +b, +s}:
      change.if(found, st, e, b, s)

# selectMenu's onchange, graphChange(this): configureGraph on the option's
# graph (modal.graphInputs only knows the options initModalHandler added).
def select.go(+go: Bool, +st: St, +e: E.Env, +value: String) -> Out:
  match go:
    case True{}:
      change.go(pick.go(enabled(e), value), st, e)
    case False{}:
      Out{st, [], True{}}

def select(+st: St, +e: E.Env, +id: String, +value: String) -> Out:
  select.go(String.eq(id, "selectMenu") && handler_of(st), st, e, value)
