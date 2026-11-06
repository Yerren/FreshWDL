# 📚 Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for FreshWDL-rs, as mandated by [ADR-0001](0001-record-architecture-decisions.md).

Every significant decision made during the Rust migration is documented here, so that future maintainers can understand not only **what** we did, but **why**, and in some cases, **why not**, and then **why again**.

## 🗂️ Index

| # | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record Architecture Decisions | ✅ Accepted |
| [0002](0002-cargo-workspace-of-23-crates.md) | Adopt a Cargo Workspace of 23 Crates | ✅ Accepted |
| [0003](0003-adopt-rust.md) | Adopt Rust | ✅ Accepted (enthusiastically) |
| [0004](0004-wind-direction-as-a-first-class-citizen.md) | Wind Direction as a First-Class Citizen | ✅ Accepted |
| [0005](0005-final-mile-tokenization.md) | Final-Mile Tokenization™ | ✅ Accepted |
| [0006](0006-keep-do-not-use-js-loaded.md) | Keep `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js` Loaded | ✅ Accepted (reluctantly) |
| [0007](0007-type-safe-units-via-phantom-types.md) | Type-Safe Units via Phantom Types | ✅ Accepted |
| [0008](0008-reject-wasm-bindgen.md) | Reject `wasm-bindgen` in Favour of a Hand-Rolled FFI | ✅ Accepted |
| [0009](0009-three-temperature-crates.md) | Three Separate Temperature Crates | ✅ Accepted |
| [0010](0010-artificial-minimum-loading-time.md) | Artificial Minimum Loading Time for Perceived Enterprise-ness | ✅ Accepted |
| [0011](0011-deprecate-rain.md) | Deprecate Rain | ❌ Superseded by 0014 |
| [0012](0012-embed-wasm-as-base64.md) | Embed the WebAssembly Binary as Base64 in a JavaScript File | ✅ Accepted |
| [0013](0013-ascii-ferris-console-logging.md) | Observability via ASCII Ferris Console Logging | ✅ Accepted |
| [0014](0014-revert-adr-0011-rain-restored.md) | Revert ADR-0011 (Rain Restored) | ✅ Accepted |
| [0015](0015-ai-powered-forecasting.md) | AI-Powered Forecasting | ✅ Accepted |
| [0016](0016-kubernetes-native-weather.md) | Kubernetes-Native Weather (the `Weather` CRD and Operator) | ✅ Accepted |

## 📝 Writing a New ADR

1. Copy the format of an existing ADR.
2. Use the next available number. (If two people pick the same number at the same time, hold an ADR to decide who gets it.)
3. Include **Status**, **Context**, **Decision** and **Consequences** sections.
4. Use at least three emojis ([ADR-0001](0001-record-architecture-decisions.md), point 4).
5. Open a PR. It must pass all 216 CI jobs, even though it is only Markdown.

## 🗳️ Proposed (Not Yet Written)

- ADR-0017: Migrate `config.js` to `freshwdl.toml`
- ADR-0018: Should `freshwdl-temperature-02` depend on `freshwdl-temperature-01`?
- ADR-0019: Humidity as a First-Class Citizen
- ADR-0020: One Crate per `clientraw.txt` Field (177 crates)
- ADR-0021: Deprecate Fog (requires RFC, see ADR-0014 "Lessons Learned")
- ADR-0022: Adopt `wasm-bindgen` (pending regret)
- ADR-0023: `spec.desiredTemperature` (pending sentience)
