//! # 🏛️ freshwdl-weather-abstraction-layer
//!
//! The Weather Abstraction Layer (WAL) abstracts the weather. ☁️➡️📦
//!
//! Before the WAL, widgets had to know about the weather directly. This
//! created tight coupling between the software and the sky. The WAL
//! introduces a clean separation of concerns: the weather is now an
//! implementation detail.
//!
//! See `ARCHITECTURE.md` for the full diagram. It is very big.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

extern crate alloc;

use alloc::vec::Vec;
use freshwdl_core::{Widget, WidgetDescriptor};

/// 📇 Returns every widget known to FreshWDL-rs.
///
/// Allocates a fresh `Vec` every time, for freshness. 🥬 (It's in the name.)
pub fn registry() -> Vec<WidgetDescriptor> {
    let mut out = Vec::new();
    out.push(freshwdl_temperature_01::TemperatureBar01::descriptor());
    out.push(freshwdl_temperature_02::TemperatureBar02::descriptor());
    out.push(freshwdl_temperature_03::TemperatureBar03::descriptor());
    out.push(freshwdl_barometer::Barometer01::descriptor());
    out.push(freshwdl_humidity::HumidityGauge01::descriptor());
    out.extend(freshwdl_wind::descriptors());
    out.extend(freshwdl_rain::descriptors());
    out.push(freshwdl_solar::SolarBar01::descriptor());
    out.push(freshwdl_uv::UvBar01::descriptor());
    out.push(freshwdl_moon::MoonSun01::descriptor());
    out
}

/// 🔎 Looks up a widget by canvas id.
pub fn find_by_canvas(canvas_id: &str) -> Option<WidgetDescriptor> {
    registry().into_iter().find(|d| d.canvas_id == canvas_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_registry_should_register() {
        assert_eq!(registry().len(), 13);
    }

    #[test]
    fn there_should_be_exactly_three_temperature_bars() {
        let n = registry().iter().filter(|d| d.canvas_id.starts_with("TempBar")).count();
        assert_eq!(n, 3); // 🫡 ADR-0009
    }

    #[test]
    fn it_should_find_the_barometer() {
        assert!(find_by_canvas("Barometer01").is_some());
    }
}
