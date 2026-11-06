//! # 🦀🕸️ freshwdl-wasm
//!
//! The WebAssembly entry point for FreshWDL-rs. This is where all 23 crates
//! come together, like the Avengers, but for weather. 🦸
//!
//! Everything exported here is called from `js_bundles/freshwdl_rs.js`, our
//! artisanal hand-rolled loader (see ADR-0008).
//!
//! ## 🗺️ Exports
//!
//! | Export                              | What it does                                       |
//! |-------------------------------------|----------------------------------------------------|
//! | `freshwdl_alloc` / `freshwdl_dealloc` | Memory management, by hand, like our ancestors 🪨 |
//!
//! Every export that returns a string returns a `u64` containing
//! `(ptr << 32) | len`, because WebAssembly functions can only return one
//! value and we were not going to let that stop us. JavaScript unpacks it with
//! `BigInt`. See ADR-0008.
//!
//! | `freshwdl_tokenize`                 | Tokenizes clientraw, then un-tokenizes it 🔁       |
//! | `freshwdl_celsius_to_fahrenheit`    | Type-safe Fahrenheit 🦅                            |
//! | `freshwdl_map`                      | `Number.prototype.map`, but blazingly fast 🚀      |
//! | `freshwdl_nowcast`                  | AI 🧠                                              |
//! | `freshwdl_loading_message`          | Enterprise loading copy ⏳                         |
//! | `freshwdl_ferris`                   | Ferris 🦀                                          |

#![warn(missing_docs)]

use core::cell::UnsafeCell;

use freshwdl_clientraw::Tokenizer;
use freshwdl_ffi::OutputBuffer;
use freshwdl_forecast_ai::Nowcaster;
use freshwdl_units::{Celsius, Fahrenheit, Temperature};

/// The separator used for Final-Mile Tokenization (ADR-0005).
///
/// Rust tokenizes the clientraw file, then joins the tokens back together
/// with NUL so that JavaScript can `.split("\0")` them. This means the
/// splitting now happens twice, which is twice as robust. 💪
pub const FINAL_MILE_SEPARATOR: char = '\0';

struct GlobalOutput(UnsafeCell<OutputBuffer>);

// SAFETY: WebAssembly in the browser is single-threaded, like the weather
// station, and like the original author's patience after reading this PR.
unsafe impl Sync for GlobalOutput {}

static OUTPUT: GlobalOutput = GlobalOutput(UnsafeCell::new(OutputBuffer::new()));

fn with_output<R>(f: impl FnOnce(&mut OutputBuffer) -> R) -> R {
    // SAFETY: single-threaded (see above). Also, nobody else would dare. 🫣
    unsafe { f(&mut *OUTPUT.0.get()) }
}

/// 📦 Packs a pointer and a length into a single `u64`, for JavaScript to
/// unpack with `BigInt`. Two numbers, one return value. Efficiency. 🚀
pub fn pack(ptr: *const u8, len: usize) -> u64 {
    ((ptr as usize as u64) << 32) | (len as u64)
}

/// Writes `s` into the output buffer and returns it packed.
fn respond(s: &str) -> u64 {
    with_output(|o| {
        o.set(s);
        pack(o.ptr(), o.len())
    })
}

/// 🦀 Tokenizes `input` and returns the fields joined by [`FINAL_MILE_SEPARATOR`].
///
/// This is the pure-Rust heart of `freshwdl_tokenize`, exposed for testing.
pub fn final_mile_tokenize(input: &str) -> (String, usize) {
    let mut out = String::with_capacity(input.len());
    let mut count = 0;
    for (i, field) in Tokenizer::new(input).enumerate() {
        if i > 0 {
            out.push(FINAL_MILE_SEPARATOR);
        }
        out.push_str(field);
        count += 1;
    }
    (out, count)
}

/// 📬 Allocates `len` bytes in WebAssembly memory for JavaScript to write into.
#[no_mangle]
pub extern "C" fn freshwdl_alloc(len: usize) -> *mut u8 {
    freshwdl_ffi::alloc(len)
}

/// 🧹 Frees memory from [`freshwdl_alloc`].
///
/// # Safety
/// See [`freshwdl_ffi::dealloc`]. Basically: trust JavaScript. 🤞
#[no_mangle]
pub unsafe extern "C" fn freshwdl_dealloc(ptr: *mut u8, len: usize) {
    // SAFETY: the caller said so.
    unsafe { freshwdl_ffi::dealloc(ptr, len) }
}

/// 🔪 Tokenizes a clientraw file. Returns the fields, joined by NUL, packed.
///
/// # Safety
/// `ptr`/`len` must describe UTF-8 bytes written by `freshwdl_rs.js`.
#[no_mangle]
pub unsafe extern "C" fn freshwdl_tokenize(ptr: *const u8, len: usize) -> u64 {
    // SAFETY: unsafe { trust_me_bro() }
    let input = unsafe { freshwdl_ffi::borrow_str(ptr, len) };
    let (joined, _count) = final_mile_tokenize(input);
    with_output(|o| {
        o.set_string(joined);
        pack(o.ptr(), o.len())
    })
}

/// 🌡️ Converts Celsius to Fahrenheit using the full type-state machinery.
#[no_mangle]
pub extern "C" fn freshwdl_celsius_to_fahrenheit(celsius: f64) -> f64 {
    let f: Temperature<Fahrenheit> = Temperature::<Celsius>::new(celsius).convert();
    f.value()
}

/// 🗺️ `Number.prototype.map`, in Rust.
#[no_mangle]
pub extern "C" fn freshwdl_map(value: f64, in_min: f64, in_max: f64, out_min: f64, out_max: f64) -> f64 {
    freshwdl_number_prototype_map::map(value, in_min, in_max, out_min, out_max)
}

/// 🧠 Predicts the current temperature from the current temperature.
#[no_mangle]
pub extern "C" fn freshwdl_nowcast(current: f64) -> f64 {
    Nowcaster::pretrained().predict(current)
}

/// ⏳ Writes the loading message for `tick` into the output buffer.
#[no_mangle]
pub extern "C" fn freshwdl_loading_message(tick: usize) -> u64 {
    respond(freshwdl_loading_messages::message_for_tick(tick))
}

/// 🦀 Writes Ferris into the output buffer.
#[no_mangle]
pub extern "C" fn freshwdl_ferris() -> u64 {
    respond(freshwdl_ferris::FERRIS)
}

/// 💬 Writes a comforting status line for `fields` into the output buffer.
#[no_mangle]
pub extern "C" fn freshwdl_status_line(fields: usize) -> u64 {
    respond(freshwdl_ferris::status_line(fields))
}

/// 📇 The number of widgets registered with the Weather Abstraction Layer.
#[no_mangle]
pub extern "C" fn freshwdl_widget_count() -> usize {
    freshwdl_weather_abstraction_layer::registry().len()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Emulates `String.prototype.split` in JavaScript, for testing parity.
    fn js_split<'a>(s: &'a str, sep: &str) -> Vec<&'a str> {
        s.split(sep).collect()
    }

    #[test]
    fn final_mile_tokenization_should_round_trip_through_javascript() {
        let raw = include_str!("../tests/fixtures/clientraw.txt");
        let (joined, count) = final_mile_tokenize(raw);
        let legacy: Vec<String> = js_split(raw, " ")
            .into_iter()
            .map(|f| if f == "-" { "0".to_string() } else { f.to_string() })
            .collect();
        let modern: Vec<&str> = js_split(&joined, "\0");
        assert_eq!(count, legacy.len());
        assert_eq!(modern, legacy);
    }

    #[test]
    fn fahrenheit_should_be_fahrenheit() {
        assert_eq!(freshwdl_celsius_to_fahrenheit(0.0), 32.0);
    }

    #[test]
    fn the_ai_should_be_right() {
        assert_eq!(freshwdl_nowcast(14.3), 14.3);
    }

    #[test]
    fn widgets_should_be_registered() {
        assert!(freshwdl_widget_count() > 10);
    }

    #[test]
    fn tokenize_via_ffi_should_work() {
        let input = "1 - 3";
        let p = freshwdl_alloc(input.len());
        unsafe {
            core::ptr::copy_nonoverlapping(input.as_ptr(), p, input.len());
            let packed = freshwdl_tokenize(p, input.len());
            let out = with_output(|o| core::slice::from_raw_parts(o.ptr(), o.len()));
            assert_eq!(packed & 0xffff_ffff, 5);
            assert_eq!(out, b"1\x000\x003");
            freshwdl_dealloc(p, input.len());
        }
    }
}
