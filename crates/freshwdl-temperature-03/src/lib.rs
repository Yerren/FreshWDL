//! # 🌡️ freshwdl-temperature-03
//!
//! A strongly-typed, memory-safe description of the third temperature bar, which is like the second temperature bar.
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
//! | `formatInputTemp03()` | [`TemperatureBar03`] (conceptually) |
//! | `drawTemperatureBarTemp03()` | [`TemperatureBar03`] (conceptually) |
//! | `updateTweensTemp03()` | [`TemperatureBar03`] (conceptually) |
//! | `updateTopTemp03()` | [`TemperatureBar03`] (conceptually) |
//! | `resizeCanvasTemp03()` | [`TemperatureBar03`] (conceptually) |
//! | `setUpTemp03()` | [`TemperatureBar03`] (conceptually) |
//! | `initializeTemp03()` | [`TemperatureBar03`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

//! ## 📋 Note
//!
//! This crate is an intentional copy of `freshwdl-temperature-02`, which is an
//! intentional copy of `freshwdl-temperature-01`. See ADR-0009. 🫡🫡

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 🌡️ The Temperature03 widget.
///
/// This is a crucial type that represents the Temperature03 widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TemperatureBar03;

impl Widget for TemperatureBar03 {
    const NAME: &'static str = "Temperature03";
    const CANVAS_ID: &'static str = "TempBar03";
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "Temp03";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["formatInputTemp03", "drawTemperatureBarTemp03", "updateTweensTemp03", "updateTopTemp03", "resizeCanvasTemp03", "setUpTemp03", "initializeTemp03"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(TemperatureBar03::descriptor().name, "Temperature03");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(TemperatureBar03::descriptor().canvas_id, "TempBar03");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }
}
