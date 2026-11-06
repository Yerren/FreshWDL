# Env: what every widget may read. The original keeps these as globals
# (arrayClientraw, currentUnits, lang, widgetList, ...); here the app passes
# them in.
import Base
import ./units.bend as U
import ./dict.bend as D
import ./raw.bend as Raw
import ./num.bend as Num

# The local wall clock, as the host's Date reports it. month is 1 to 12.
type Clock is Data:
  Clock{year: U32, month: U32, day: U32, hour: U32, minute: U32, second: U32,
    ms: U32}

# A config setting: "widget.key" and String(value).
type KV is Data:
  KV{k: String, v: String}

# A widget's surroundings when it resizes: its canvas's parent and
# grandparent client sizes, and document.documentElement's client size.
type Box is Data:
  Box{pw: F32, ph: F32, gw: F32, gh: F32, vw: F32, vh: F32}

# cr, cre, crh, crd: the clientraw, clientrawextra, clientrawhour and
# clientrawdaily fields. cfg: widgetList, graphList and generalList after
# config.js's settings, as "widget.key" -> String(value) pairs.
type Env is Data:
  Env{cr: +List<String>, cre: +List<String>, crh: +List<String>, crd: +List<String>,
    units: U.Units, lang: D.Lang, cfg: +List<KV>, clock: Clock}

def kv_key(+kv: KV) -> String:
  match kv:
    case KV{+k, _}:
      k

def kv_val(+kv: KV) -> String:
  match kv:
    case KV{_, +v}:
      v

def kv.after(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, +t}:
      Bool.pick(String, Char.is_eq(c, '='), t, kv.after(t))

def kv.before(+s: String) -> String:
  match s:
    case SNil{}:
      ""
    case SCon{+c, t}:
      Bool.pick(String, Char.is_eq(c, '='), "", SCon{c, kv.before(t)})

# "key=value" per line, as the host hands config.js over.
def kv_parse(+line: String) -> KV:
  KV{kv.before(line), kv.after(line)}

def kv_list(+lines: List<&2, String>) -> List<&2, KV>:
  match lines:
    case Nil{}:
      []
    case Con{+l, rest}:
      +r = kv_list(rest)
      Bool.pick(List<&2, KV>, String.is_empty(l), r, kv_parse(l) <> r)

def kv_lines(+text: String) -> List<&2, KV>:
  kv_list(String.split(text, Char.from_u32(10)))

def no_clock() -> Clock:
  Clock{1970, 1, 1, 0, 0, 0, 0}

def cr(+e: Env, +i: Nat) -> String:
  match e:
    case Env{+cr, _, _, _, _, _, _, _}:
      Raw.at(cr, i)

def cre(+e: Env, +i: Nat) -> String:
  match e:
    case Env{_, +cre, _, _, _, _, _, _}:
      Raw.at(cre, i)

def crh(+e: Env, +i: Nat) -> String:
  match e:
    case Env{_, _, +crh, _, _, _, _, _}:
      Raw.at(crh, i)

def crd(+e: Env, +i: Nat) -> String:
  match e:
    case Env{_, _, _, +crd, _, _, _, _}:
      Raw.at(crd, i)

def units(+e: Env) -> U.Units:
  match e:
    case Env{_, _, _, _, +u, _, _, _}:
      u

def lang(+e: Env) -> D.Lang:
  match e:
    case Env{_, _, _, _, _, +l, _, _}:
      l

def clock(+e: Env) -> Clock:
  match e:
    case Env{_, _, _, _, _, _, _, +c}:
      c

# useDict(word)
def word(+e: Env, +w: D.Phrase) -> String:
  D.get(w, lang(e))

# formatDataToUnit(raw) + units[kind][current][1]
def reading(+e: Env, +k: U.Measure, +raw: String) -> String:
  U.with_label(units(e), k, raw)

def label(+e: Env, +k: U.Measure) -> String:
  U.label(units(e), k)

def find(+key: String, +dflt: String, +kvs: List<&2, KV>) -> String:
  match kvs:
    case Nil{}:
      dflt
    case Con{+kv, rest}:
      Bool.pick(String, String.eq(kv_key(kv), key),
        kv_val(kv), find(key, dflt, rest))

# widgetList.<widget>.<key> etc, as text: opt(e, "windChill.mode", "windchill")
def opt(+e: Env, +key: String, +dflt: String) -> String:
  match e:
    case Env{_, _, _, _, _, _, +cfg, _}:
      find(key, dflt, cfg)

def on(+e: Env, +key: String) -> Bool:
  String.eq(opt(e, key, "false"), "true")

# JavaScript's `value != old` for a widget's remembered reading: while old is
# still the number a widget starts with (fresh), the strings compare as
# numbers; once old is a string from clientraw, they compare as strings.
def changed(+fresh: Bool, +value: String, +old: String) -> Bool:
  Bool.pick(Bool, fresh, F32.is_ne(Num.parse(value), Num.parse(old)),
    Bool.not(String.eq(value, old)))

def box_vw(+b: Box) -> F32:
  match b:
    case Box{_, _, _, _, +vw, _}:
      vw

def box_vh(+b: Box) -> F32:
  match b:
    case Box{_, _, _, _, _, +vh}:
      vh
