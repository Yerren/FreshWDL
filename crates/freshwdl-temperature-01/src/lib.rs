//! # 🌡️ freshwdl-temperature-01
//!
//! A strongly-typed, memory-safe description of the main temperature bar.
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
//! | `formatInputTemp01()` | [`TemperatureBar01`] (conceptually) |
//! | `drawTemperatureBarTemp01()` | [`TemperatureBar01`] (conceptually) |
//! | `updateTweensTemp01()` | [`TemperatureBar01`] (conceptually) |
//! | `updateTopTemp01()` | [`TemperatureBar01`] (conceptually) |
//! | `resizeCanvasTemp01()` | [`TemperatureBar01`] (conceptually) |
//! | `setUpTemp01()` | [`TemperatureBar01`] (conceptually) |
//! | `initializeTemp01()` | [`TemperatureBar01`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 🌡️ The Temperature widget.
///
/// This is a crucial type that represents the Temperature widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TemperatureBar01;

impl Widget for TemperatureBar01 {
    const NAME: &'static str = "Temperature";
    const CANVAS_ID: &'static str = "TempBar01";
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "Temp01";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["formatInputTemp01", "drawTemperatureBarTemp01", "updateTweensTemp01", "updateTopTemp01", "resizeCanvasTemp01", "setUpTemp01", "initializeTemp01"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(TemperatureBar01::descriptor().name, "Temperature");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(TemperatureBar01::descriptor().canvas_id, "TempBar01");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }
}
