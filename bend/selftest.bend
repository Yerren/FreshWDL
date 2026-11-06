# Prints a few library answers next to what the original's JavaScript gives.
import Base
import ./lib/num.bend as Num
import ./lib/raw.bend as Raw
import ./lib/units.bend as U
import ./lib/tween.bend as T
import ./lib/scene.bend as S

def main() -> IO(Unit):
  +u = U.defaults()
  +f = U.set(u, U.Temp{}, "fahrenheit")
  +inhg = U.set(u, U.Pressure{}, "inHg")
  +inch = U.set(u, U.Rainfall{}, "inch")
  +xs = Raw.split("12345 11.9 - 300  x")
  do IO<Unit>:
    IO.print(U.with_label(u, U.Temp{}, "14.30") ++ " | " ++ U.with_label(f, U.Temp{}, "14.3") ++ " | " ++ U.with_label(inhg, U.Pressure{}, "1015.6") ++ " | " ++ U.with_label(u, U.Wind{}, "11.9"))
    IO.print(U.with_label(inch, U.Rainfall{}, "0.2") ++ " | " ++ U.with_label(inch, U.Rainfall{}, "0.1") ++ " | " ++ U.with_label(inch, U.Rainfall{}, "0.0") ++ " | " ++ U.with_label(U.set(u, U.Wind{}, "B"), U.Wind{}, "11.9"))
    IO.print(U.current(U.cycle(u, U.Pressure{}), U.Pressure{}) ++ " " ++ U.current(U.cycle(U.set(u, U.Pressure{}, "mb"), U.Pressure{}), U.Pressure{}))
    IO.print(Raw.at(xs, 2n) ++ "," ++ Raw.at(xs, 4n) ++ "," ++ Raw.at(xs, 5n) ++ "," ++ Raw.at(xs, 9n) ++ " n=" ++ Nat.show(Raw.length(xs)))
    IO.print(Num.show(Num.parse("abc")) ++ " " ++ Num.show(Num.parse("")) ++ " " ++ Num.show(Num.sharpen(12.4)) ++ " " ++ Num.show(Num.cdim(600.0, 17.0, 100.0)) ++ " " ++ Num.show(Num.map(14.3, F32.neg(10.0), 30.0, 0.1, 0.98)))
    IO.print(Num.show(T.value(T.to(T.still(0.0), 1.0, 2000.0, 1000), 2000)) ++ " " ++ Num.show(T.value(T.to(T.still(0.0), 1.0, 2000.0, 1000), 3500)))
