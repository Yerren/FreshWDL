//! # 🌙 freshwdl-moon
//!
//! A strongly-typed, memory-safe description of the moon and also the sun.
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
//! | `drawMoonSunMS01()` | [`MoonSun01`] (conceptually) |
//! | `initializeMoonSunMS01()` | [`MoonSun01`] (conceptually) |
//!
//! ## 🚀 Performance
//!
//! This crate contains no runtime code paths on the rendering hot path, which
//! makes it infinitely fast. We have benchmarked it at 0 ns/frame.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

use freshwdl_prelude::*;

/// 🌙 The MoonSun widget.
///
/// This is a crucial type that represents the MoonSun widget.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct MoonSun01;

impl Widget for MoonSun01 {
    const NAME: &'static str = "MoonSun";
    const CANVAS_ID: &'static str = "MoonSun01";
}

/// The legacy function suffix, preserved for historical accuracy. 🏺
pub const LEGACY_SUFFIX: &str = "MS01";

/// The legacy JavaScript functions this crate describes. 📜
pub const LEGACY_FUNCTIONS: &[&str] = &["drawMoonSunMS01", "initializeMoonSunMS01"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_have_a_name() {
        assert_eq!(MoonSun01::descriptor().name, "MoonSun");
    }

    #[test]
    fn it_should_have_a_canvas() {
        assert_eq!(MoonSun01::descriptor().canvas_id, "MoonSun01");
    }

    #[test]
    fn legacy_functions_should_all_end_with_the_legacy_suffix() {
        for f in LEGACY_FUNCTIONS {
            assert!(f.ends_with(LEGACY_SUFFIX), "{f}");
        }
    }

    #[test]
    fn moon_exists() {
        let _moon = MoonSun01; // 🌙 It does.
    }
}
