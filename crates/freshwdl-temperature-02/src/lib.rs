//! # 🌡️ freshwdl-temperature-02
//!
//! A strongly-typed, memory-safe description of the second temperature bar, which is like the first temperature bar.
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
//! | `formatInputTemp02()` | [`TemperatureBar02`] (conceptually) |
//! | `drawTemperatureBarTemp02()` | [`TemperatureBar02`] (conceptually) |
//! | `updateTweensTemp02()` | [`TemperatureBar02`] (conceptually) |
//! | `updateTopTemp02()` | [`TemperatureBar02`] (conceptually) |
//! | `resizeCanvasTemp02()` | [`TemperatureBar02`] (conceptually) |
//! | `setUpTemp02()` | [`TemperatureBar02`] (conceptually) |
//! | `initializeTemp02()` | [`TemperatureBar02`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

//! ## 📋 Note
//!
//! This crate is an intentional copy of `freshwdl-temperature-01`. The legacy
//! architecture duplicated the temperature widget three times, and we felt it
//! would be disrespectful to deduplicate it. See ADR-0009. 🫡

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 🌡️ The Temperature02 widget.
///
/// This is a crucial type that represents the Temperature02 widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TemperatureBar02;

impl Widget for TemperatureBar02 {
    const NAME: &'static str = "Temperature02";
    const CANVAS_ID: &'static str = "TempBar02";
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "Temp02";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["formatInputTemp02", "drawTemperatureBarTemp02", "updateTweensTemp02", "updateTopTemp02", "resizeCanvasTemp02", "setUpTemp02", "initializeTemp02"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(TemperatureBar02::descriptor().name, "Temperature02");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(TemperatureBar02::descriptor().canvas_id, "TempBar02");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }
}
