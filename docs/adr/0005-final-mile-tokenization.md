# ADR-0005: Final-Mile Tokenization™

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0008](0008-reject-wasm-bindgen.md)

## Context

The core responsibility of `freshwdl-clientraw` is to take the contents of `clientraw.txt` and turn it into a list of fields.

`clientraw.txt` looks like this:

```
12345 11.9 7.0 300 14.3 72 1015.6 0.0 27.4 1318.6 ...
```

The legacy implementation tokenized it with:

```js
xhttpCR.responseText.toString().split(" ");
```

Our Rust implementation tokenizes it with a production-grade, zero-copy, iterator-based tokenizer featuring Meteohub `-` → `0` compatibility, robust whitespace handling, and extensive documentation. 🚀

There is one remaining problem: having tokenized the input in Rust, **we need to get the tokens back to JavaScript**.

Because we have rejected `wasm-bindgen` ([ADR-0008](0008-reject-wasm-bindgen.md)), the only thing we can pass across the FFI boundary is a pointer and a length into WebAssembly linear memory. Returning an array of strings would require designing a binary format, length prefixes, an allocator protocol, and an afternoon.

## Decision

The Rust tokenizer will return the tokens as **a single string, with each field separated by a NUL byte (`\0`)**.

The JavaScript side will then perform the **final mile** of tokenization:

```js
result.split("\0");
```

We call this pattern **Final-Mile Tokenization™**. In logistics, the "last mile" is the most expensive and complex part of a delivery, so it is fitting that we have handed it back to JavaScript.

## Consequences

### Positive ✅

- The vast majority of tokenization (everything except the splitting) now happens in Rust. 🦀
- The tokens are now separated by a character that does not appear in weather data, instead of a space, which does. This is a significant robustness improvement.
- The benchmarks for the Rust tokenizer exclude the `.split("\0")` step, which makes them very impressive (see [BENCHMARKS.md](../../BENCHMARKS.md)).

### Negative ❌

- We now tokenize the input in Rust, join it back into a string, and then split it again in JavaScript, which is two more steps than the original implementation.
- Some reviewers have pointed out that this is equivalent to replacing `" "` with `"\0"` and then calling `split`. These reviewers have been invited to re-read [ADR-0003](0003-adopt-rust.md).

### Alternatives Rejected

- **Returning JSON:** Would require writing a JSON serializer in `no_std`, or adding `serde`, which would make the WASM binary larger than the weather.
- **Splitting on spaces in JavaScript directly:** This is what the code did before. Rejected as "regressive".
