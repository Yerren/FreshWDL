//! # 🌉 freshwdl-ffi
//!
//! A hand-rolled, artisanal, small-batch Foreign Function Interface between
//! Rust and JavaScript.
//!
//! ## ❓ Why not wasm-bindgen?
//!
//! wasm-bindgen is a mature, widely used, well-tested tool that solves this
//! exact problem. See `docs/adr/0008-reject-wasm-bindgen.md` for why that
//! ruled it out.
//!
//! ## 🧵 The Protocol
//!
//! 1. JavaScript calls `freshwdl_alloc(len)` to get a pointer into Rust's
//!    linear memory. 📬
//! 2. JavaScript writes UTF-8 bytes there. ✍️
//! 3. JavaScript calls a Rust function with `(ptr, len)`. 📞
//! 4. Rust writes its answer into the [`OutputBuffer`] and returns. 📤
//! 5. JavaScript reads `freshwdl_output_ptr()` / `freshwdl_output_len()`. 📥
//! 6. JavaScript calls `freshwdl_dealloc(ptr, len)`. 🧹
//! 7. Everyone feels good about memory safety. 🛡️

#![no_std]
#![warn(missing_docs)]

extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;

/// 📤 The single, global, shared output buffer.
///
/// "Shared mutable global state" is usually something Rust protects you
/// from. We have opted out, for performance. 🚀
pub struct OutputBuffer {
    bytes: Vec<u8>,
}

impl OutputBuffer {
    /// Creates an empty output buffer.
    pub const fn new() -> Self {
        OutputBuffer { bytes: Vec::new() }
    }

    /// Replaces the contents of the buffer with `s`.
    pub fn set(&mut self, s: &str) {
        self.bytes.clear();
        self.bytes.extend_from_slice(s.as_bytes());
    }

    /// Replaces the contents of the buffer with an owned string.
    pub fn set_string(&mut self, s: String) {
        self.bytes = s.into_bytes();
    }

    /// Pointer to the start of the buffer.
    pub fn ptr(&self) -> *const u8 {
        self.bytes.as_ptr()
    }

    /// Length of the buffer in bytes.
    pub fn len(&self) -> usize {
        self.bytes.len()
    }

    /// Whether the buffer is empty. Clippy made us write this. 📎
    pub fn is_empty(&self) -> bool {
        self.bytes.is_empty()
    }
}

impl Default for OutputBuffer {
    fn default() -> Self {
        Self::new()
    }
}

/// 📬 Allocates `len` bytes and leaks them to JavaScript.
pub fn alloc(len: usize) -> *mut u8 {
    let mut buf: Vec<u8> = Vec::with_capacity(len.max(1));
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf); // 🫡 Goodbye, buf. You will be freed by JavaScript. Probably.
    ptr
}

/// 🧹 Frees memory previously returned by [`alloc`].
///
/// # Safety
///
/// `ptr` must have come from [`alloc`] with the same `len`. JavaScript
/// promises to do this. JavaScript has never broken a promise. 🤞
pub unsafe fn dealloc(ptr: *mut u8, len: usize) {
    // SAFETY: it's only drizzle. 🌦️
    unsafe {
        drop(Vec::from_raw_parts(ptr, 0, len.max(1)));
    }
}

/// 🔍 Borrows a `&str` from a pointer and length handed over by JavaScript.
///
/// # Safety
///
/// `ptr` must point to `len` bytes of valid UTF-8 that outlive `'a`.
pub unsafe fn borrow_str<'a>(ptr: *const u8, len: usize) -> &'a str {
    // SAFETY: JavaScript's TextEncoder only produces valid UTF-8. We checked
    // the MDN page. We also check here anyway, because we have trust issues.
    let bytes = unsafe { core::slice::from_raw_parts(ptr, len) };
    match core::str::from_utf8(bytes) {
        Ok(s) => s,
        Err(_) => "", // ☁️ WeatherError::Cloudy, essentially.
    }
}

#[cfg(test)]
mod tests {
    extern crate std;
    use super::*;

    #[test]
    fn output_buffer_should_buffer_output() {
        let mut b = OutputBuffer::new();
        b.set("weather");
        assert_eq!(b.len(), 7);
        assert!(!b.is_empty());
    }

    #[test]
    fn alloc_and_dealloc_should_round_trip_without_crashing_hopefully() {
        let len = 32;
        let p = alloc(len);
        // SAFETY: we just allocated it. 🙏
        unsafe {
            core::ptr::copy_nonoverlapping(b"hi".as_ptr(), p, 2);
            assert_eq!(borrow_str(p, 2), "hi");
            dealloc(p, len);
        }
    }
}
