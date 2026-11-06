# ADR-0011: Deprecate Rain

- **Status:** ❌ Superseded by [ADR-0014](0014-revert-adr-0011-rain-restored.md)
- **Date:** 2026-11-06
- **Deciders:** The Architecture Council, on a sunny afternoon

## Context

During the migration, `freshwdl-rain` was found to be the most complex crate in the workspace. Rainfall involves:

- Daily totals
- Monthly totals
- Yearly totals
- Rain rate
- Hourly rain
- Three separate `UniBar` widgets (`Uni01`, `Uni02`, `Uni03`), which display rain but are not named after rain
- A "rainfall title" widget, which is a widget for the word "rainfall"
- Unit conversion between millimetres and inches

During the sprint in which this crate was being implemented, it did not rain once. ☀️

Data from the test station showed `0.0` for daily rainfall on every single observation. Analysis of this data led the team to conclude that **rain may no longer be a relevant use case**.

Rust best practice encourages removing unused code. `cargo` itself would, if it could, emit a `dead_code` warning for rain.

## Decision

Rain is deprecated, effective immediately. 🌂

- `freshwdl-rain` will be marked `#[deprecated(note = "rain is no longer supported")]`.
- The rain gauges will display `0`, which matches observed data.
- Users relying on rain are encouraged to migrate to sunshine, which is fully supported by `freshwdl-solar`.

## Consequences

### Positive ✅

- Simplified codebase.
- Removes the need to handle the inches/millimetres conversion, which nobody enjoys.
- The rain gauges are now always accurate on sunny days.

### Negative ❌

- Inaccurate on rainy days.

### Notes

- A follow-up review has been scheduled for the next time it rains.
