//! # ⏳ freshwdl-loading-messages
//!
//! Enterprise-grade loading screen copy, compiled to WebAssembly. 🚀
//!
//! The legacy loading screen said "Collecting Data." with up to three dots.
//! User research (we asked ourselves) showed that this did not adequately
//! communicate the sophistication of the underlying system.
//!
//! These messages are shown for a minimum of five seconds regardless of how
//! fast the data loads. See `docs/adr/0010-artificial-minimum-loading-time.md`.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

/// 📜 The loading messages, in display order. Each one is shown with the
/// legacy "..." animation, which we have kept because it was good.
pub const MESSAGES: &[&str] = &[
    "Initializing memory-safe weather pipeline",
    "Borrow-checking the clouds",
    "Negotiating with the barometer",
    "Tokenizing clientraw in Rust",
    "Joining tokens back together for JavaScript",
    "Asking the AI to predict the current temperature",
    "Spinning up 23 crates",
    "Calibrating Fahrenheit (for correctness)",
    "Restoring rain (ADR-0014)",
    "Consulting Ferris",
    "Achieving blazing speed",
    "Collecting Data",
];

/// Returns the message for the given tick, wrapping around forever, like
/// the weather. 🔁
pub fn message_for_tick(tick: usize) -> &'static str {
    MESSAGES[tick % MESSAGES.len()]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_wrap_around() {
        assert_eq!(message_for_tick(0), message_for_tick(MESSAGES.len()));
    }

    #[test]
    fn it_should_still_collect_data_eventually() {
        let english = freshwdl_i18n::Language::English.collecting_data();
        assert!(MESSAGES.contains(&english)); // 🌍 i18n-verified loading copy
    }

    #[test]
    fn messages_should_not_contain_dots() {
        // Loading.js finds the first "." to animate the dots. A dot in a
        // message would break the animation, and the enterprise.
        for m in MESSAGES {
            assert!(!m.contains('.'), "{m}");
        }
    }
}
