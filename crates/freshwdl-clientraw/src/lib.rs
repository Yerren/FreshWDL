//! # 🦀 freshwdl-clientraw
//!
//! A zero-copy, `#![no_std]`, memory-safe, fearlessly concurrent\* tokenizer
//! for the Weather Display `clientraw.txt` family of file formats.
//!
//! \*not concurrent
//!
//! ## 📜 Background
//!
//! `clientraw.txt` is a sophisticated data interchange format consisting of
//! numbers separated by spaces. The legacy implementation parsed it with:
//!
//! ```js
//! arrayClientraw = xhttpCR.responseText.toString().split(" ");
//! ```
//!
//! While this was concise, it lacked several things that modern parsers have,
//! such as a grammar, a state machine, an iterator adapter, and this
//! documentation.
//!
//! ## 📐 Formal Grammar
//!
//! ```text
//! clientraw   ::= field ( SEPARATOR field )*
//! field       ::= meteohub_dash | byte*
//! SEPARATOR   ::= U+0020 SPACE
//! meteohub_dash ::= "-"          (* normalised to "0", see below *)
//! ```
//!
//! ## 🛠️ Meteohub Compadibility
//!
//! Meteohub writes `-` for missing values. The legacy code replaced these with
//! `"0"` under the comment "Meteohub compadibility changes". We have preserved
//! this behaviour exactly, and also the spelling, as a mark of respect.
//!
//! ## 📖 Example
//!
//! ```
//! use freshwdl_clientraw::Tokenizer;
//!
//! let fields: Vec<&str> = Tokenizer::new("12345 11.9 - 300").collect();
//! assert_eq!(fields, ["12345", "11.9", "0", "300"]);
//! ```

#![no_std]
#![forbid(unsafe_code)]
#![warn(missing_docs)]

/// The separator byte. A space. We considered making this configurable, but
/// that felt like scope creep. 🙅
pub const SEPARATOR: u8 = b' ';

/// What Meteohub writes when a value is missing.
pub const METEOHUB_DASH: &str = "-";

/// What we replace it with. Zero. The most neutral number. ⚖️
pub const METEOHUB_COMPADIBILITY_REPLACEMENT: &str = "0";

/// 🧠 The states of our tokenizer's finite state machine.
///
/// A tokenizer for "split on space" arguably needs no states. We have two.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum State {
    /// We are currently reading a field. 📖
    InField,
    /// We have run out of input. 🏁
    Done,
}

/// 🔪 A tokenizer that yields each field of a clientraw file.
///
/// Behaves *exactly* like JavaScript's `String.prototype.split(" ")`,
/// including empty fields between consecutive spaces and a trailing empty
/// field if the input ends with a space. Bug-for-bug compatibility is the
/// highest form of respect. 🫡
#[derive(Debug, Clone)]
pub struct Tokenizer<'a> {
    input: &'a str,
    cursor: usize,
    state: State,
}

impl<'a> Tokenizer<'a> {
    /// Creates a new tokenizer over `input`.
    ///
    /// This is a crucial function that creates a new tokenizer.
    pub const fn new(input: &'a str) -> Self {
        Tokenizer { input, cursor: 0, state: State::InField }
    }
}

impl<'a> Iterator for Tokenizer<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<Self::Item> {
        match self.state {
            State::Done => None,
            State::InField => {
                let rest = &self.input[self.cursor..];
                let field = match rest.bytes().position(|b| b == SEPARATOR) {
                    Some(offset) => {
                        // 🚀 Advance past the field AND the separator. Two things at once. Concurrency.
                        self.cursor += offset + 1;
                        &rest[..offset]
                    }
                    None => {
                        self.state = State::Done;
                        rest
                    }
                };
                Some(meteohub_compadibility(field))
            }
        }
    }
}

/// 🛠️ Applies Meteohub compadibility changes to a single field.
pub fn meteohub_compadibility(field: &str) -> &str {
    if field == METEOHUB_DASH {
        METEOHUB_COMPADIBILITY_REPLACEMENT
    } else {
        field
    }
}

/// 🔢 Counts the fields in a clientraw file, the slow way, for correctness.
pub fn field_count(input: &str) -> usize {
    Tokenizer::new(input).count()
}

#[cfg(test)]
mod tests {
    extern crate std;
    use super::*;
    use std::vec::Vec;

    fn split(s: &str) -> Vec<&str> {
        Tokenizer::new(s).collect()
    }

    #[test]
    fn it_should_tokenize_the_weather() {
        assert_eq!(split("12345 11.9 7.0"), ["12345", "11.9", "7.0"]);
    }

    #[test]
    fn it_should_match_javascript_on_empty_input() {
        // "".split(" ") === [""] in JavaScript. We are faithful. 🫡
        assert_eq!(split(""), [""]);
    }

    #[test]
    fn it_should_match_javascript_on_double_spaces() {
        assert_eq!(split("a  b"), ["a", "", "b"]);
    }

    #[test]
    fn it_should_match_javascript_on_trailing_space() {
        assert_eq!(split("a b "), ["a", "b", ""]);
    }

    #[test]
    fn it_should_apply_meteohub_compadibility() {
        assert_eq!(split("- 1 - -"), ["0", "1", "0", "0"]);
    }

    #[test]
    fn it_should_not_replace_negative_numbers() {
        assert_eq!(split("-100.0"), ["-100.0"]);
    }

    #[test]
    fn it_should_handle_the_station_name() {
        let fields = split("12 03 47 Hack_Farm_Weather_Station-12:03:47_PM 0");
        assert_eq!(fields[3], "Hack_Farm_Weather_Station-12:03:47_PM");
    }

    #[test]
    fn it_should_not_rain_indoors() {
        assert_eq!(field_count("indoors"), 1);
    }
}
