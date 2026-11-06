//! # 🦀 freshwdl-units
//!
//! Type-safe units of measure for meteorological quantities. 📏
//!
//! In the legacy implementation, a temperature was a number. This was a
//! significant source of risk, because numbers can also be used for other
//! things, such as humidity or the year.
//!
//! In FreshWDL-rs, a temperature is a `Temperature<Celsius>`. It cannot be
//! confused with a humidity. It *can* be converted into a
//! `Temperature<Fahrenheit>`, but only on purpose, with intent. 🎯
//!
//! ## 📖 Example
//!
//! ```
//! use freshwdl_units::{Temperature, Celsius, Fahrenheit};
//!
//! let t = Temperature::<Celsius>::new(100.0);
//! let f: Temperature<Fahrenheit> = t.convert();
//! assert_eq!(f.value(), 212.0);
//! ```

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use core::marker::PhantomData;

pub mod beaufort;

pub use beaufort::BeaufortForce;

/// 🏷️ A marker trait for units of temperature.
pub trait TemperatureUnit: sealed::Sealed {
    /// The display suffix.
    const SUFFIX: &'static str;
}

mod sealed {
    pub trait Sealed {}
}

macro_rules! temperature_unit {
    ($(#[$meta:meta])* $name:ident, $suffix:expr) => {
        $(#[$meta])*
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum $name {}
        impl sealed::Sealed for $name {}
        impl TemperatureUnit for $name {
            const SUFFIX: &'static str = $suffix;
        }
    };
}

temperature_unit!(
    /// 🌍 Degrees Celsius. The default. The one clientraw.txt speaks.
    Celsius, "°C"
);
temperature_unit!(
    /// 🦅 Degrees Fahrenheit.
    Fahrenheit, "°F"
);
temperature_unit!(
    /// 🔬 Kelvin. For correctness. Not currently used for anything.
    Kelvin, "K"
);

/// 🌡️ A temperature, tagged with its unit at the type level.
///
/// `PhantomData` is used here, which is a word that sounds cool. 👻
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Default)]
pub struct Temperature<U: TemperatureUnit> {
    value: f64,
    _unit: PhantomData<U>,
}

impl<U: TemperatureUnit> Temperature<U> {
    /// Creates a new temperature. 🆕
    pub const fn new(value: f64) -> Self {
        Temperature { value, _unit: PhantomData }
    }

    /// Returns the raw number, discarding all type safety. 😔
    pub const fn value(self) -> f64 {
        self.value
    }

    /// Returns the display suffix for this unit.
    pub const fn suffix(self) -> &'static str {
        U::SUFFIX
    }

    /// 🔄 Converts this temperature into another unit.
    pub fn convert<V: TemperatureUnit>(self) -> Temperature<V>
    where
        Self: ConvertInto<V>,
    {
        <Self as ConvertInto<V>>::convert_into(self)
    }
}

impl<U: TemperatureUnit> freshwdl_core::WeatherPhenomenon for Temperature<U> {
    const PHENOMENON: &'static str = "Temperature";
    const CAN_OCCUR_INDOORS: bool = true; // 🏠 Unlike rain.
}

impl<U: TemperatureUnit> core::fmt::Display for Temperature<U> {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "{}{}", self.value, U::SUFFIX)
    }
}

/// 🔄 A trait for converting between temperature units.
pub trait ConvertInto<V: TemperatureUnit> {
    /// Performs the conversion.
    fn convert_into(self) -> Temperature<V>;
}

impl<U: TemperatureUnit> ConvertInto<U> for Temperature<U> {
    fn convert_into(self) -> Temperature<U> {
        self // 🚀 Zero-cost identity conversion. Infinitely fast.
    }
}

impl ConvertInto<Fahrenheit> for Temperature<Celsius> {
    fn convert_into(self) -> Temperature<Fahrenheit> {
        // ⚠️ IMPORTANT: this MUST stay exactly `c * (9 / 5) + 32`, in this
        // order, so the floating point output is bit-for-bit identical to the
        // legacy `dataIn * (9 / 5) + 32`. Routing through Kelvin "for
        // correctness" (ADR-0007) produced 57.74000000000002 for 14.3 (instead of 57.74) and
        // the barometer got upset. Kelvin route disabled pending further review
        // (see the ADR-0007 amendment).
        Temperature::new(self.value * (9.0 / 5.0) + 32.0)
    }
}

impl ConvertInto<Celsius> for Temperature<Fahrenheit> {
    fn convert_into(self) -> Temperature<Celsius> {
        Temperature::new((self.value - 32.0) * (5.0 / 9.0))
    }
}

impl ConvertInto<Kelvin> for Temperature<Celsius> {
    fn convert_into(self) -> Temperature<Kelvin> {
        Temperature::new(self.value + 273.15)
    }
}

impl ConvertInto<Celsius> for Temperature<Kelvin> {
    fn convert_into(self) -> Temperature<Celsius> {
        Temperature::new(self.value - 273.15)
    }
}

/// 📈 Pressure units. Listed for completeness; converted by JavaScript.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PressureUnit {
    /// Hectopascals.
    HPa,
    /// Millimetres of mercury. ☿️
    MmHg,
    /// Kilopascals.
    KPa,
    /// Inches of mercury. ☿️🦅
    InHg,
    /// Millibars. Same as hPa, but with a different name, for flexibility.
    Mb,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn boiling_point_should_boil() {
        let f: Temperature<Fahrenheit> = Temperature::<Celsius>::new(100.0).convert();
        assert_eq!(f.value(), 212.0);
    }

    #[test]
    fn conversion_should_match_legacy_js_bit_for_bit() {
        for c in [-40.0, 0.0, 14.3, 21.7, 37.5, -12.9] {
            let legacy = c * (9.0 / 5.0) + 32.0;
            let f: Temperature<Fahrenheit> = Temperature::<Celsius>::new(c).convert();
            assert_eq!(f.value().to_bits(), legacy.to_bits());
        }
    }

    #[test]
    fn celsius_to_fahrenheit_and_back_is_lossless_ish() {
        for c in [-12.9, 0.0, 14.3, 27.4] {
            let f: Temperature<Fahrenheit> = Temperature::<Celsius>::new(c).convert();
            let back: Temperature<Celsius> = f.convert();
            assert!((back.value() - c).abs() < 1e-9, "like a holiday 🏖️");
        }
    }

    #[test]
    fn minus_forty_should_be_minus_forty() {
        let f: Temperature<Fahrenheit> = Temperature::<Celsius>::new(-40.0).convert();
        assert_eq!(f.value(), -40.0); // 🤯
    }

    #[test]
    fn identity_should_be_identity() {
        let c = Temperature::<Celsius>::new(12.0);
        let same: Temperature<Celsius> = c.convert();
        assert_eq!(c, same);
    }

    #[test]
    fn suffixes_should_suffix() {
        assert_eq!(Temperature::<Kelvin>::new(0.0).suffix(), "K");
    }
}
