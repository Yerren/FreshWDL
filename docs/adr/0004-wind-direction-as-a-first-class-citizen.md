# ADR-0004: Wind Direction as a First-Class Citizen

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0007](0007-type-safe-units-via-phantom-types.md)

## Context

In the legacy implementation, wind direction is stored as `arrayClientraw[3]`.

That's it. That's the whole representation. A string. At index 3. 😢

Wind direction has no type. It has no methods. It cannot express itself. It is passed to `drawWindGaugeWind01` alongside `arrayClientraw[117]` with no indication of what either of them means. If you passed it the temperature by mistake, it would point the gauge at 14.3°, which is roughly north-northeast, and nobody would ever know.

Meanwhile, temperature has *three entire widgets*. The inequity here is stark.

## Decision

Wind direction will be elevated to a **first-class citizen** of the FreshWDL-rs type system. 🧭

Concretely, this means:

1. Wind direction will be represented by a dedicated `WindDirection` newtype in `freshwdl-wind`.
2. It will implement `WeatherPhenomenon`, granting it the same rights and responsibilities as temperature, pressure and humidity.
3. It will be normalized to the range `[0, 360)`, so that it never has to experience the indignity of being 361°.
4. It will have a `to_compass_point()` method returning one of 16 compass points, implemented as an exhaustive `enum` so that no direction is ever left behind.
5. It will be allowed to vote.

We considered representing wind direction as a monad (`Wind<Direction>`) so that directions could be composed (e.g. `North >>= East == NorthEast`). This was rejected after a 3-hour meeting in which nobody could explain what a monad is.

## Consequences

### Positive ✅

- Wind direction finally feels seen.
- It is now impossible to accidentally pass a temperature where a wind direction is expected, at least in the Rust code, which never actually receives a wind direction from the JavaScript.

### Negative ❌

- The rendering code in `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js` still reads `arrayClientraw[3]` directly, so in practice wind direction is a first-class citizen of a country it does not live in.

### Neutral 😐

- Humidity has submitted a formal request for similar treatment. It is under review.
