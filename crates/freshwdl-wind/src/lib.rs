//! # 🧭 freshwdl-wind
//!
//! A strongly-typed, memory-safe description of wind direction, a first-class citizen (ADR-0004).
//!
//! ## 🏛️ Legacy Mapping
//!
//! In the legacy architecture this widget was implemented as a global object
//! literal and the following free functions. They are still in
//! `js_bundles/WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js`, and they
//! still do all of the rendering. This crate describes them. 📚
//!
//! | Legacy function | FreshWDL-rs equivalent |
//! |-----------------|------------------------|
//! | `drawWindGaugeWind01()` | [`WindDirection01`] (conceptually) |
//! | `initializeWind01()` | [`WindDirection01`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 🧭 The WindDirection widget.
///
/// This is a crucial type that represents the WindDirection widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WindDirection01;

impl Widget for WindDirection01 {
    const NAME: &'static str = "WindDirection";
    const CANVAS_ID: &'static str = "WindGauge01";
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "Wind01";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["drawWindGaugeWind01", "initializeWind01"];


/// 💨 Wind speed. Not a first-class citizen. Second class. Sorry.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WindSpeed01;

impl Widget for WindSpeed01 {
    const NAME: &'static str = "WindSpeed";
    const CANVAS_ID: &'static str = "WindSpeed01";
}

/// 🧭 Wind direction, in degrees. A first-class citizen with full rights (ADR-0004). 🎖️
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Default)]
pub struct WindDirection(pub f64);

impl WeatherPhenomenon for WindDirection {
    const PHENOMENON: &'static str = "Wind Direction";
}

/// 🧭 One of the 16 compass points. Exhaustive, so no direction is ever left behind.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CompassPoint {
    /// N
    North,
    /// NNE
    NorthNorthEast,
    /// NE
    NorthEast,
    /// ENE
    EastNorthEast,
    /// E
    East,
    /// ESE
    EastSouthEast,
    /// SE
    SouthEast,
    /// SSE
    SouthSouthEast,
    /// S
    South,
    /// SSW
    SouthSouthWest,
    /// SW
    SouthWest,
    /// WSW
    WestSouthWest,
    /// W
    West,
    /// WNW
    WestNorthWest,
    /// NW
    NorthWest,
    /// NNW
    NorthNorthWest,
}

impl CompassPoint {
    /// All 16 compass points, clockwise from North. 🔃
    pub const ALL: [CompassPoint; 16] = [
        CompassPoint::North,
        CompassPoint::NorthNorthEast,
        CompassPoint::NorthEast,
        CompassPoint::EastNorthEast,
        CompassPoint::East,
        CompassPoint::EastSouthEast,
        CompassPoint::SouthEast,
        CompassPoint::SouthSouthEast,
        CompassPoint::South,
        CompassPoint::SouthSouthWest,
        CompassPoint::SouthWest,
        CompassPoint::WestSouthWest,
        CompassPoint::West,
        CompassPoint::WestNorthWest,
        CompassPoint::NorthWest,
        CompassPoint::NorthNorthWest,
    ];
}

impl WindDirection {
    /// Converts this wind direction into a compass point. 🧭
    pub fn to_compass_point(self) -> CompassPoint {
        let deg = ((self.0 % 360.0) + 360.0) % 360.0;
        CompassPoint::ALL[((deg / 22.5) + 0.5) as usize % 16]
    }
}

/// All wind widgets, for the Weather Abstraction Layer. 🌬️
pub fn descriptors() -> [WidgetDescriptor; 2] {
    [WindDirection01::descriptor(), WindSpeed01::descriptor()]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(WindDirection01::descriptor().name, "WindDirection");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(WindDirection01::descriptor().canvas_id, "WindGauge01");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }
    
    #[test]
    fn wind_direction_is_a_first_class_citizen() {
        assert_eq!(WindDirection::PHENOMENON, "Wind Direction"); // 🎖️
        assert_eq!(WindDirection(0.0).to_compass_point(), CompassPoint::North);
        assert_eq!(WindDirection(359.0).to_compass_point(), CompassPoint::North);
        assert_eq!(WindDirection(300.0).to_compass_point(), CompassPoint::WestNorthWest);
        assert_eq!(WindDirection(-90.0).to_compass_point(), CompassPoint::West);
    }

}
