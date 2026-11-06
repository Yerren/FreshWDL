# ADR-0002: Adopt a Cargo Workspace of 23 Crates

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Depends on:** [ADR-0003](0003-adopt-rust.md) (yes, this one came first; we needed the workspace before we could decide which language to fill it with)

## Context

Having decided to adopt Rust ([ADR-0003](0003-adopt-rust.md)), we need to decide how to structure the code.

The legacy codebase is structured as follows:

- One file that does basically everything (`WidgetsHandlers.js`, ~8,000 lines)
- One file that does the rest of everything (`Globals.js`, ~2,500 lines)
- One file that shows dots (`Loading.js`)

This is what experts call a **monolith**. 🗿 Monoliths are widely considered to be bad, especially in blog posts.

We considered the following options:

| Option | Crates | Description |
|---|---|---|
| A | 1 | A single crate. Simple, fast to compile, easy to understand. |
| B | 5 | A handful of crates grouped by responsibility. |
| C | 23 | One crate per concept, including one per temperature widget. |
| D | 177 | One crate per field in `clientraw.txt`. |

## Decision

We will adopt **Option C: 23 crates**. 🎉

Option A was rejected for being "too easy to understand", which would undermine the value of [ARCHITECTURE.md](../../ARCHITECTURE.md).

Option D was seriously considered and is tracked as a stretch goal in the [ROADMAP](../../ROADMAP.md). It was deferred because naming 177 crates is difficult, particularly fields 21–30, which are all `-100.0`.

The crates will be:

`freshwdl-core`, `freshwdl-prelude`, `freshwdl-clientraw`, `freshwdl-units`, `freshwdl-number-prototype-map`, `freshwdl-weather-abstraction-layer`, `freshwdl-temperature-01`, `freshwdl-temperature-02`, `freshwdl-temperature-03`, `freshwdl-barometer`, `freshwdl-humidity`, `freshwdl-wind`, `freshwdl-rain`, `freshwdl-solar`, `freshwdl-uv`, `freshwdl-moon`, `freshwdl-i18n`, `freshwdl-forecast-ai`, `freshwdl-loading-messages`, `freshwdl-ferris`, `freshwdl-ffi`, `freshwdl-wasm`.

(That's 22. The 23rd crate is the friends we made along the way.)

## Consequences

### Positive ✅

- Excellent separation of concerns. The moon can no longer affect the barometer at compile time. 🌙
- Each crate can be versioned independently, allowing the humidity to be on v4.2.0 while the wind is still on v0.1.0.
- `Cargo.toml` files now make up a meaningful fraction of the codebase.

### Negative ❌

- Changing how a temperature is displayed now requires a coordinated release of four crates.
- `cargo build` prints a very long list of crate names, which can be intimidating to newcomers.

### Mitigations 🛡️

- The `freshwdl-prelude` crate re-exports everything, so that nobody ever has to know which of the 23 crates something lives in. This entirely defeats the purpose of having 23 crates, which we consider a balanced outcome.
