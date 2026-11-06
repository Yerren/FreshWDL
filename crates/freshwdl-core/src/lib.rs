//! # 🦀 freshwdl-core
//!
//! The beating heart of FreshWDL-rs. 💓
//!
//! This crate defines the foundational abstractions upon which the entire
//! FreshWDL-rs ecosystem is built. Every widget, every unit, every raindrop
//! flows through the types defined here.
//!
//! ## ✨ Key Features
//!
//! - 🚀 **Blazingly fast** trait definitions (traits have zero runtime cost,
//!   which means they are infinitely fast)
//! - 🛡️ **Memory-safe** weather
//! - 🧠 **Strongly typed** clientraw indices, so you can never again
//!   accidentally read the humidity when you meant the humidity
//! - 🌦️ **Weather-aware** error handling
//!
//! ## 📖 Example
//!
//! ```
//! use freshwdl_core::{Widget, WidgetDescriptor};
//!
//! struct MyGauge;
//!
//! impl Widget for MyGauge {
//!     const NAME: &'static str = "MyGauge";
//!     const CANVAS_ID: &'static str = "MyGauge01";
//! }
//!
//! assert_eq!(MyGauge::descriptor().name, "MyGauge");
//! ```

#![no_std]
#![forbid(unsafe_code)] // 🛡️ Not in MY core crate.
#![warn(missing_docs)]

pub mod clientraw_index;
pub mod error;
pub mod phenomenon;

pub use error::WeatherError;
pub use phenomenon::{Gauge, Unit, WeatherPhenomenon};

/// 🧩 The `Widget` trait.
///
/// In the legacy architecture, a "widget" was a global object literal (for
/// example `apparent01`) plus seven free functions with a numeric suffix.
/// This was, frankly, revolutionary for its time.
///
/// In FreshWDL-rs, a widget is a type that implements `Widget`. This is a
/// paradigm shift. 🔄
///
/// Note: widgets are still rendered by the legacy JavaScript (see
/// `docs/adr/0006-keep-do-not-use-js-loaded.md`). This trait describes them
/// in a strongly-typed manner so that they *could*, in theory, be rendered by
/// Rust, in a future that is on the roadmap.
pub trait Widget {
    /// The human-readable name of the widget.
    const NAME: &'static str;

    /// The id of the HTML canvas this widget is drawn onto by JavaScript.
    const CANVAS_ID: &'static str;

    /// Whether the widget is enabled. Defaults to `true`, because we believe
    /// in every widget. 💪
    const ENABLED_BY_DEFAULT: bool = true;

    /// Returns a [`WidgetDescriptor`] for this widget.
    ///
    /// This is a crucial function that returns a descriptor.
    fn descriptor() -> WidgetDescriptor {
        WidgetDescriptor {
            name: Self::NAME,
            canvas_id: Self::CANVAS_ID,
            enabled_by_default: Self::ENABLED_BY_DEFAULT,
        }
    }
}

/// 📇 A runtime description of a [`Widget`].
///
/// Exists so that widgets can be put into a list. Lists are an important part
/// of modern software architecture.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WidgetDescriptor {
    /// See [`Widget::NAME`].
    pub name: &'static str,
    /// See [`Widget::CANVAS_ID`].
    pub canvas_id: &'static str,
    /// See [`Widget::ENABLED_BY_DEFAULT`].
    pub enabled_by_default: bool,
}

/// 🌡️ The current state of the weather, as a type.
///
/// This enum is not used anywhere yet, but it establishes a shared vocabulary
/// for the team. (The team is one person.)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Vibe {
    /// ☀️ Nice.
    Sunny,
    /// ⛅ Fine.
    PartlyCloudy,
    /// 🌧️ See ADR-0011 and ADR-0014.
    Rain,
    /// 🌫️ Adversarial. See SECURITY.md.
    Fog,
    /// 🦀 The weather is Rust now.
    Crustacean,
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestWidget;
    impl Widget for TestWidget {
        const NAME: &'static str = "Test";
        const CANVAS_ID: &'static str = "Test01";
    }

    #[test]
    fn descriptor_should_describe() {
        let d = TestWidget::descriptor();
        assert_eq!(d.name, "Test");
        assert_eq!(d.canvas_id, "Test01");
        assert!(d.enabled_by_default);
    }

    #[test]
    fn vibes_should_be_comparable() {
        assert_ne!(Vibe::Sunny, Vibe::Rain);
        assert_eq!(Vibe::Crustacean, Vibe::Crustacean);
    }
}
