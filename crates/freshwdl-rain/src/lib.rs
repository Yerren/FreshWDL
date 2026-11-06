//! # 🌧️ freshwdl-rain
//!
//! A strongly-typed, memory-safe description of rain (deprecated by ADR-0011, restored by ADR-0014).
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
//! | `drawUniratureBarUni01()` | [`RainfallDay01`] (conceptually) |
//! | `initializeUniBarUni01()` | [`RainfallDay01`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 🌧️ The RainfallDay widget.
///
/// This is a crucial type that represents the RainfallDay widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RainfallDay01;

impl Widget for RainfallDay01 {
    const NAME: &'static str = "RainfallDay";
    const CANVAS_ID: &'static str = "Uni01";
    const ENABLED_BY_DEFAULT: bool = RAIN_PERMITTED;
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "Uni01";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["drawUniratureBarUni01", "initializeUniBarUni01"];


/// 🌧️ Whether it is allowed to rain in this build.
#[cfg(feature = "rain")]
pub const RAIN_PERMITTED: bool = true;

/// ☀️ Whether it is allowed to rain in this build.
#[cfg(not(feature = "rain"))]
pub const RAIN_PERMITTED: bool = false;

/// 🌧️ Monthly rainfall. Same as daily, but for a month.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RainfallMonth01;

impl Widget for RainfallMonth01 {
    const NAME: &'static str = "RainfallMonth";
    const CANVAS_ID: &'static str = "Uni02";
    const ENABLED_BY_DEFAULT: bool = RAIN_PERMITTED;
}

/// 🌧️ Yearly rainfall. Same as monthly, but for a year.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RainfallYear01;

impl Widget for RainfallYear01 {
    const NAME: &'static str = "RainfallYear";
    const CANVAS_ID: &'static str = "Uni03";
    const ENABLED_BY_DEFAULT: bool = RAIN_PERMITTED;
}

/// All rain widgets, for the Weather Abstraction Layer. ☔
pub fn descriptors() -> [WidgetDescriptor; 3] {
    [RainfallDay01::descriptor(), RainfallMonth01::descriptor(), RainfallYear01::descriptor()]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(RainfallDay01::descriptor().name, "RainfallDay");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(RainfallDay01::descriptor().canvas_id, "Uni01");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }
    
    #[test]
    fn it_should_rain_by_default() {
        assert!(RAIN_PERMITTED); // ☔ ADR-0014
    }

}
