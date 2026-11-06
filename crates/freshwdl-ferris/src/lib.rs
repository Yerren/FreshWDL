//! # 🦀 freshwdl-ferris
//!
//! Ferris, the unofficial Rust mascot, rendered in ASCII and printed to the
//! browser console when FreshWDL-rs starts.
//!
//! This is the most important crate in the workspace. Without it, users would
//! have no way of knowing the page is written in Rust, because it looks
//! exactly the same as before.

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

/// 🦀 Ferris.
pub const FERRIS: &str = r#"
        _~^~^~_
    \) /  o o  \ (/
      '_   -   _'
      / '-----' \

  FreshWDL-rs 2.0.0-rs 🦀
  Memory-safe meteorology. Blazingly fast. Weather-aware.
  Now with 23 crates and the same JavaScript as before.
"#;

/// The prefix used for every console log line. 🏷️
pub const LOG_PREFIX: &str = "🦀 [FreshWDL-rs]";

/// Returns a comforting status message for the given number of tokenized fields.
pub fn status_line(fields: usize) -> &'static str {
    match fields {
        0 => "No fields. This is concerning, but memory-safe.",
        1..=99 => "A few fields. This is fine.",
        100..=999 => "Many fields, all of them borrow-checked. This is fine.",
        _ => "So many fields. Ferris is sweating. This is still fine.",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ferris_should_exist() {
        assert!(FERRIS.contains("o o"));
    }

    #[test]
    fn everything_should_be_fine() {
        for n in [0, 1, 150, 5000] {
            assert!(status_line(n).contains("fine") || status_line(n).contains("concerning"));
        }
    }
}
