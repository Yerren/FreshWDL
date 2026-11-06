//! 🌦️ Traits for describing the weather itself.

/// 🌍 Something that happens in the sky (or, in the case of humidity, near it).
///
/// Implementing this trait grants a type the full rights and responsibilities
/// of a weather phenomenon, as set out in ADR-0004. 🎖️
pub trait WeatherPhenomenon {
    /// A human-readable name for the phenomenon. 🏷️
    const PHENOMENON: &'static str;

    /// Whether this phenomenon can occur indoors.
    ///
    /// Defaults to `false`. See `it_should_not_rain_indoors`. 🏠☔🚫
    const CAN_OCCUR_INDOORS: bool = false;
}

/// 📏 A unit of measure.
pub trait Unit {
    /// The display suffix, e.g. `"hPa"`.
    const SUFFIX: &'static str;
}

/// 🎛️ A gauge: a [`crate::Widget`] that displays exactly one
/// [`WeatherPhenomenon`].
///
/// (In practice gauges are drawn by `DO_NOT_USE.js`. This trait is aspirational.)
pub trait Gauge: crate::Widget {
    /// The phenomenon this gauge displays.
    type Phenomenon: WeatherPhenomenon;

    /// Whether the gauge has a needle. 🪡
    const HAS_NEEDLE: bool = false;

    /// Whether the gauge feels respected. Always `true` in FreshWDL-rs. 💛
    fn feels_respected(&self) -> bool {
        true
    }
}
