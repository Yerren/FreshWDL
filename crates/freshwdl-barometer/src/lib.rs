//! # 📈 freshwdl-barometer
//!
//! A strongly-typed, memory-safe description of the barometer, with whom we have negotiated.
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
//! | `drawBarometerB01()` | [`Barometer01`] (conceptually) |
//! | `updateTopB01()` | [`Barometer01`] (conceptually) |
//! | `resizeCanvasB01()` | [`Barometer01`] (conceptually) |
//! | `setUpB01()` | [`Barometer01`] (conceptually) |
//! | `initializeBarometerB01()` | [`Barometer01`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 📈 The Barometer widget.
///
/// This is a crucial type that represents the Barometer widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Barometer01;

impl Widget for Barometer01 {
    const NAME: &'static str = "Barometer";
    const CANVAS_ID: &'static str = "Barometer01";
}

/// 📈 Atmospheric pressure.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Pressure;

impl WeatherPhenomenon for Pressure {
    const PHENOMENON: &'static str = "Pressure";
    const CAN_OCCUR_INDOORS: bool = true; // 🏠 Especially during code review.
}

impl Gauge for Barometer01 {
    type Phenomenon = Pressure;
    const HAS_NEEDLE: bool = true;
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "B01";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["drawBarometerB01", "updateTopB01", "resizeCanvasB01", "setUpB01", "initializeBarometerB01"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(Barometer01::descriptor().name, "Barometer");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(Barometer01::descriptor().canvas_id, "Barometer01");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }

    #[test]
    fn barometer_feels_respected() {
        assert!(Barometer01.feels_respected()); // 💛 We negotiated.
    }
}
