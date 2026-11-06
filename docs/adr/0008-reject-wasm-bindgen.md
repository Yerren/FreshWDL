# ADR-0008: Reject `wasm-bindgen` in Favour of a Hand-Rolled FFI

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0005](0005-final-mile-tokenization.md), [ADR-0012](0012-embed-wasm-as-base64.md)

## Context

To call Rust from JavaScript, the Rust ecosystem offers `wasm-bindgen`, a mature, widely used, well-documented tool that generates bindings automatically, handles strings, arrays, objects, closures and errors, and is used by thousands of production projects.

We considered it carefully.

## Decision

We will **not** use `wasm-bindgen`. 🙅

Instead, we will write our own FFI layer, `freshwdl-ffi`, which exposes:

- `freshwdl_alloc(len) -> *mut u8`, to allocate memory inside WebAssembly
- `freshwdl_dealloc(ptr, len)`, to give it back (please remember to call this)
- Functions that take a `(ptr, len)` pair and return a `(ptr, len)` pair packed into a single `u64`, because WebAssembly functions can only return one value and we were not going to let that stop us

JavaScript will then:

1. Encode the string to UTF-8 with `TextEncoder`
2. Call `freshwdl_alloc`
3. Copy the bytes into WebAssembly memory
4. Call the function
5. Unpack the `u64` into a pointer and length using `BigInt`
6. Decode the result with `TextDecoder`
7. Call `freshwdl_dealloc` once, for the input. (The output buffer is a single global that lives forever. This is called "caching".)
8. `.split("\0")` ([ADR-0005](0005-final-mile-tokenization.md))

### Reasons

1. **Dependency minimalism.** `wasm-bindgen` would add a dependency. We already have 23 crates, and they are all ours, which is different.
2. **Educational value.** By writing our own FFI, we will gain a deep, personal understanding of linear memory, pointer packing and suffering.
3. **Binary size.** The hand-rolled approach produces a smaller `.wasm`, which we then base64-encode, making it 33% larger again ([ADR-0012](0012-embed-wasm-as-base64.md)).
4. **wasm-pack was not installed** on the machine this decision was made on.

## Consequences

### Positive ✅

- Zero external dependencies. 🦀
- Every byte crossing the FFI boundary has been personally escorted.

### Negative ❌

- We are responsible for memory management across a language boundary, which is exactly the kind of thing Rust was supposed to save us from.
- Every exported function is `unsafe extern "C"`. Each `unsafe` block has a `// SAFETY:` comment explaining why it's fine. Most of them say "it's only drizzle".

### Neutral 😐

- If we ever adopt `wasm-bindgen` in the future, this ADR will be superseded and we will write ADR-0016 explaining why we were wrong, which is a valuable learning outcome.
