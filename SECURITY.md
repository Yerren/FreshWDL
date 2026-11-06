# 🛡️ Security Policy

FreshWDL-rs takes the security of the weather extremely seriously.

## 📋 Supported Versions

| Version | Supported | Notes |
|---|---|---|
| 2.0.0-rs | ✅ | Memory safe 🦀 |
| 1.1.8 Alpha | ⚠️ | Memory unsafe, but has never actually had a problem |
| 1.1.7 Alpha and earlier | ❌ | Please upgrade to Rust |
| Flash-based WDL | 🪦 | Rest in peace |

## 🧨 Threat Model

We follow the STRIDE methodology, adapted for meteorology (**STORMY**):

| Letter | Threat | Example | Mitigation |
|---|---|---|---|
| **S** | Spoofed weather | An attacker uploads a `clientraw.txt` claiming it is 9,000 °C | Type-safe `Temperature<Celsius>` (still displays 9,000 °C, but safely) |
| **T** | Tampering | Wind direction modified in transit | Wind direction is a first-class citizen and is entitled to due process ([ADR-0004](docs/adr/0004-wind-direction-as-a-first-class-citizen.md)) |
| **O** | Overcast | Sun not visible | `freshwdl-solar` reports a lower number |
| **R** | Repudiation | The barometer denies having risen | All pressure changes are logged by Ferris 🦀 |
| **M** | Moisture escalation | Humidity exceeds 100% | Clamped. Humidity has been spoken to. |
| **Y** | "Yes but it's a static page" | Reviewer asks why this document exists | See [ADR-0001](docs/adr/0001-record-architecture-decisions.md) |

### 🌨️ Hail

Hail is classified as a **high-severity, physical-layer** threat. FreshWDL-rs cannot prevent hail. However, the rain gauge will report it, eventually, once it melts.

### 🌫️ Adversarial Fog

Fog can obscure the weather station's light sensors, causing the solar gauge to report incorrect values. We call this **adversarial fog**.

Mitigations:

- Fog is routed to the dead-letter queue `weather.fog.v1` ([`kafka/topics.yaml`](kafka/topics.yaml)) in the aspirational architecture.
- Deprecating fog has been proposed (ADR-0021) but requires an RFC, following the rain incident ([ADR-0014](docs/adr/0014-revert-adr-0011-rain-restored.md)).

### ☁️ Supply-Chain Clouds

Modern software is vulnerable to **supply-chain attacks**, where a compromised upstream dependency affects everything downstream. In meteorology this is known as a **cloud**, which travels from upwind and affects everything downwind.

FreshWDL-rs has **zero external Rust dependencies**. All 23 crates are first-party. We cannot be compromised by somebody else's cloud, only by our own.

The legacy JavaScript libraries (EaselJS, TweenJS, Chart.js, Moment.js, OpenTip) are still vendored. They are not Rust and are therefore out of scope for this document.

### ⚡ Lightning

Lightning is a **zero-day** threat (it strikes without warning). We recommend surge protection for the Windows PC running Weather Display. This is genuinely good advice and we're not sure how it got in here.

### 🦀 `unsafe` Code

FreshWDL-rs contains a small amount of `unsafe` code, in the hand-rolled FFI layer ([ADR-0008](docs/adr/0008-reject-wasm-bindgen.md)). Every `unsafe` block has been audited and has a `// SAFETY:` comment. Examples:

```rust
// SAFETY: it's only drizzle
// SAFETY: the pointer came from freshwdl_alloc, which we trust, because we wrote it
// SAFETY: as long as nobody looks directly at the sun
```

## 📣 Reporting a Vulnerability

If you discover a security vulnerability in FreshWDL-rs, please **do not** open a public issue.

Instead:

1. Go outside.
2. Check whether the weather is actually affected.
3. If yes, write it down.
4. Email the maintainer at the address in the README with the subject line `[SECURITY] Weather`.

We aim to acknowledge reports within 48 hours, or within one weather front, whichever is longer.

## 🏆 Hall of Fame

We would like to thank the following for responsibly disclosing issues:

- **The Sun**, for reporting that UV values above 11 were rendered off the end of the gauge.
- **A cloud**, for repeatedly demonstrating adversarial fog.
- **Rain**, for reporting [ADR-0011](docs/adr/0011-deprecate-rain.md) by happening.

## ⚖️ Bug Bounty

FreshWDL-rs does not currently offer a monetary bug bounty, as noted in the legacy code's variable `nocashe_string`. Valid reports will be rewarded with one (1) ASCII crab.
