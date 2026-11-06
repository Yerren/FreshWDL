# ADR-0007: Type-Safe Units via Phantom Types

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0004](0004-wind-direction-as-a-first-class-citizen.md)

## Context

The legacy implementation converts units in a single function, `formatDataToUnit(dataIn, unitsIn)`, in `Globals.js`. It looks up a conversion factor in a table and multiplies. For temperature, which is not linear, it has a special case:

```js
var fahTemp = dataIn * (9 / 5) + 32;
```

This works perfectly and has done for years. 😐

However, it relies on the programmer **remembering** that the incoming value is in Celsius. There is nothing in the type system to stop someone converting a Fahrenheit value to Fahrenheit again, producing temperatures hot enough to melt the canvas.

## Decision

We will represent temperatures using **phantom types**:

```rust
pub struct Temperature<U: TemperatureUnit> {
    value: f64,
    _unit: PhantomData<U>,
}
```

with marker types `Celsius`, `Fahrenheit` and `Kelvin`.

To guarantee correctness, **all conversions will go via Kelvin**, the SI base unit of temperature, as is right and proper:

```
Celsius → Kelvin → Fahrenheit
```

This means converting 14.3 °C to Fahrenheit now involves adding 273.15, then subtracting 273.15, then multiplying by 9/5, then adding 32. We call this the **Scientific Path**. 🔬

Pressure, wind speed and rainfall will receive the same treatment. Beaufort, being non-linear, will be represented as an exhaustive `enum` with 13 variants, from `Calm` to `Hurricane`, each with a hand-written doc comment describing how it feels.

## Consequences

### Positive ✅

- It is now a compile error to add a Celsius to a Fahrenheit. 🎉
- The phrase "phantom type" sounds spooky, which suits weather.

### Negative ❌

- Floating-point round-tripping through Kelvin introduces errors of up to 0.000000000001 °C. We have decided this is acceptable, as long as nobody tells the barometer.
- All values arrive from JavaScript as `f64` with no unit attached, so the Rust side has to *assume* they are Celsius, which is exactly what the JavaScript did. The assumption is now type-safe.

### Testing 🧪

- A property-based test, `celsius_to_fahrenheit_and_back_is_lossless_ish`, verifies that converting there and back gets you roughly where you started, like a holiday.

## Amendment 1 (2.0.0-rs) 📝

**Status:** Accepted, then quietly not implemented.

During implementation it was discovered that the Scientific Path converts 14.3 °C to `57.74000000000002` °F, whereas the legacy JavaScript produces `57.74`. The barometer noticed. 📈😠

The Kelvin route has therefore been disabled. Celsius → Fahrenheit is now computed as `c * (9 / 5) + 32`, in exactly the same order as the legacy JavaScript, so the result is bit-for-bit identical (verified across 20,000 random inputs). Kelvin remains available as a type, for correctness, and is not used for anything.

This ADR remains **Accepted**, because reverting an ADR requires another ADR, and we have already used up 0014 on rain.
