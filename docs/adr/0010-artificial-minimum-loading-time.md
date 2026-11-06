# ADR-0010: Artificial Minimum Loading Time for Perceived Enterprise-ness

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0013](0013-ascii-ferris-console-logging.md)

## Context

After the migration to Rust, the WebAssembly module is embedded directly in the page ([ADR-0012](0012-embed-wasm-as-base64.md)) and instantiated synchronously. As a result, the page loads **exactly as fast as before**.

User research\* has shown that this is a problem.

When a page loads instantly, users assume it is simple. When a page displays the message *"Borrow-checking the clouds…"* for a few seconds, users assume it is doing something sophisticated, and their trust increases dramatically. This is known in the industry as the **Enterprise Loading Effect**.

The previous loading screen displayed `Collecting Data.` followed by an animated number of dots, and then disappeared as soon as the data had arrived. It did not inspire awe. It simply worked. 😞

<sub>\* One person, asked once.</sub>

## Decision

1. The loading screen will cycle through a series of **enterprise-grade loading messages**, provided by `freshwdl-loading-messages`, including:
   - "Initializing memory-safe weather pipeline"
   - "Borrow-checking the clouds"
   - "Negotiating with the barometer"
   - and others
2. The loading screen will remain visible for **a minimum of approximately 5 seconds**, even if the data has already loaded.
3. The original animated dots will be preserved, because they are good dots.

## Consequences

### Positive ✅

- The page now feels like it is doing a lot of work. 🏢
- Users get time to read all of the loading messages, which were expensive to write.
- The page now loads more slowly than the legacy version, which makes the Rust version feel more serious.

### Negative ❌

- Time to first gauge has regressed from ~210 ms to ~5,000 ms. This is documented in [BENCHMARKS.md](../../BENCHMARKS.md) as a **24× improvement in perceived value**.

### Rejected Alternatives

- **A fake progress bar that gets stuck at 99%.** Rejected as "too honest".
- **A 30-second minimum.** Rejected after it was pointed out that weather changes over 30 seconds, so the data might be stale by the time it displays.
