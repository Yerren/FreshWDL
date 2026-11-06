# ADR-0009: Three Separate Temperature Crates

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0002](0002-cargo-workspace-of-23-crates.md)

## Context

The legacy codebase contains three temperature widgets: `Temp01`, `Temp02` and `Temp03`.

Each one has its own:

- `formatInputTempXX`
- `drawTemperatureBarTempXX`
- `updateTweensTempXX`
- `updateTopTempXX`
- `resizeCanvasTempXX`
- `setUpTempXX`
- `initializeTempXX`

They are, for the most part, the same code with the number changed. 📋📋📋

A lesser architecture would see this as duplication to be removed: a single generic `TemperatureWidget<const N: usize>`, perhaps, or a trait with three implementations.

We see it differently. We see **heritage**.

The original author chose, deliberately and consistently, to give each temperature widget its own home. Collapsing them into one generic type would erase that history and, potentially, hurt their feelings.

## Decision

We will create **three separate crates**:

- `freshwdl-temperature-01`
- `freshwdl-temperature-02`
- `freshwdl-temperature-03`

Each crate will contain an independent implementation of the temperature widget logic. Shared code will **not** be extracted into a common crate. Where code is shared, it will be copied, in keeping with the conventions of the original codebase. 🏛️

We considered writing a `widget!` macro to generate them. This was rejected because it would allow us to generate `Temp04`, and we are not ready for that conversation.

## Consequences

### Positive ✅

- Perfect fidelity to the original design.
- Each temperature crate can evolve independently. `freshwdl-temperature-02` is free to become the best temperature crate, if it works hard.
- The diff is larger, which reviewers find impressive.

### Negative ❌

- A bug in temperature logic must now be fixed in three places, exactly as before. We consider this a **lossless migration**.

### Open Questions ❓

- Should `freshwdl-temperature-02` depend on `freshwdl-temperature-01`, as a gesture of respect to its elder? Deferred to a future ADR.
