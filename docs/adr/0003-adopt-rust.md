# ADR-0003: Adopt Rust

- **Status:** ✅ Accepted (enthusiastically)
- **Date:** 2026-11-06
- **Deciders:** Everyone who has ever posted "rewrite it in Rust" on the internet

## Context

FreshWDL is currently written in JavaScript. It works. It has worked for years. It runs on nearly any device and platform, which was the entire point, as the original README says:

> "This allows for users to access it from nearly any device and platform."

However, we identified the following problems with the current implementation:

1. It is not written in Rust. 🦀
2. See point 1.

On closer inspection, we also noted some secondary concerns:

- JavaScript numbers are `f64`s, but they don't *know* that they're `f64`s. Rust numbers know exactly what they are and they're proud of it.
- There is no compiler to tell us when we are wrong, so we have just been *right* this whole time, which is not sustainable.
- The phrase "blazingly fast" cannot legally be used to describe JavaScript.

## Options Considered

### Option 1: Keep JavaScript

- ✅ Works
- ✅ Zero build step
- ✅ The author understands it
- ❌ Not Rust

### Option 2: TypeScript

- ✅ Adds types
- ✅ Gradual migration possible
- ❌ Not Rust
- ❌ Would only take an afternoon, which is not enough to justify an ADR

### Option 3: Rust compiled to WebAssembly

- ✅ Rust
- ✅ Memory safe
- ✅ Blazingly fast 🚀
- ✅ Fearless 🦀
- ❌ Requires a toolchain, a build step, a target, an embedding script, and this document
- ❌ Still needs JavaScript to actually do anything in the browser

### Option 4: Rewrite the browser in Rust

- ✅ Very Rust
- ❌ Already in progress elsewhere; we did not want to step on any toes

## Decision

We will adopt **Option 3: Rust compiled to WebAssembly**.

The Rust code will be responsible for the **most critical** parts of the system:

- Tokenizing `clientraw.txt`
- Converting Celsius to Fahrenheit
- `Number.prototype.map`

Everything else (fetching, rendering, animation, tooltips, graphs, runtime translations, the modal, the buttons, the ticker, the forecast text, the records, drawing the moon, the loading screen) will continue to be handled by the existing JavaScript, which has been renamed to discourage its use ([ADR-0006](0006-keep-do-not-use-js-loaded.md)).

## Consequences

### Positive ✅

- FreshWDL is now written in Rust. 🎉
- We can now say "rewritten in Rust" in the README.
- The weather is memory safe.

### Negative ❌

- FreshWDL is now also still written in JavaScript.
- The proportion of the page's behaviour driven by Rust is estimated at 0.6%. We believe this is the most important 0.6%.

### Follow-up

- Investigate rewriting the remaining 99.4% (tracked in the [ROADMAP](../../ROADMAP.md) as "Rust 2: Rust Harder").
