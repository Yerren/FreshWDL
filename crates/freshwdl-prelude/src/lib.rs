//! # 🎁 freshwdl-prelude
//!
//! `use freshwdl_prelude::*;` and forget your worries. 🧘
//!
//! Re-exports the most commonly used items from across the FreshWDL-rs
//! ecosystem so that you never have to remember which of the 23 crates
//! something lives in. (It lives in `freshwdl-core`. It's always
//! `freshwdl-core`.)

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub use freshwdl_core::clientraw_index::{self, ClientrawIndex};
pub use freshwdl_core::{Gauge, Unit, Vibe, WeatherError, WeatherPhenomenon, Widget, WidgetDescriptor};
pub use freshwdl_units::{Celsius, Fahrenheit, Kelvin, Temperature, TemperatureUnit};
