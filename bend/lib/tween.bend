# Tweens: TweenJS's Tween.get(o, {override: true}).to({k: v}, ms, ease),
# as a value. The original keeps a number and lets TweenJS move it on every
# tick; here a tween remembers where it started and when, and a view asks
# for its value at the frame's time. Retargeting starts from wherever the
# old tween had got to, which is what override does.
import Base

# t0: the start, in host milliseconds (U32, exact for 49 days)
type Tween is Data:
  Tween{from: F32, to: F32, t0: U32, dur: F32}

def still(+v: F32) -> Tween:
  Tween{v, v, 0, 0.0}

def elapsed(+t0: U32, +now: U32) -> F32:
  Bool.pick(F32, (now < t0 : U32), 0.0, U32.to_f32((now - t0 : U32)))

# createjs.Ease.quartInOut, getPowInOut(4).
def quart_in_out(+t: F32) -> F32:
  +u = (t * 2.0 : F32)
  Bool.pick(F32, (u < 1.0 : F32), (0.5 * F32.pow(u, 4.0) : F32),
    (1.0 - 0.5 * F32.abs(F32.pow((2.0 - u : F32), 4.0)) : F32))

def ratio(+t0: U32, +dur: F32, +now: U32) -> F32:
  +e = elapsed(t0, now)
  Bool.pick(F32, (e >= dur : F32), 1.0, (e / dur : F32))

def progress(+tw: Tween, +now: U32) -> F32:
  match tw:
    case Tween{_, _, +t0, +dur}:
      ratio(t0, dur, now)

def value(+tw: Tween, +now: U32) -> F32:
  match tw:
    case Tween{+from, +to, +t0, +dur}:
      +p = ratio(t0, dur, now)
      Bool.pick(F32, (p >= 1.0 : F32), to,
        (from + (to - from) * quart_in_out(p) : F32))

def to(+tw: Tween, +target: F32, +ms: F32, +now: U32) -> Tween:
  Tween{value(tw, now), target, now, ms}

def busy(+tw: Tween, +now: U32) -> Bool:
  (progress(tw, now) < 1.0 : F32)
