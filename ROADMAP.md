# 🗺️ FreshWDL-rs Roadmap

> This roadmap reflects our current thinking and is subject to change based on community feedback, stakeholder priorities, and the weather.

---

## 🧭 Vision

**To become the world's most over-engineered weather display, and then, if time permits, sentient.**

---

## ✅ Q1: Foundation (Done!)

- [x] Rewrite in Rust 🦀
- [x] Create 23 crates
- [x] Write 15 ADRs
- [x] Rename `WidgetsHandlers.js` to `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js`
- [x] Keep using it
- [x] Deprecate rain
- [x] Un-deprecate rain
- [x] Add Ferris to the console
- [x] Add 5-second minimum loading time
- [x] Achieve 100% AI forecast accuracy
- [x] Keep the page looking exactly the same

## 🚧 Q2: Hardening

- [ ] Migrate `config.js` to `freshwdl.toml`, then write a Rust TOML parser compiled to WASM that converts it back into `config.js` at load time
- [ ] Rename `DO_NOT_USE.js` to `DO_NOT_USE.final.v2.js` to signal urgency
- [ ] Add a `freshwdl-temperature-04` crate (pending emotional readiness, see [ADR-0009](docs/adr/0009-three-temperature-crates.md))
- [ ] Grant humidity first-class citizenship (ADR-0019)
- [ ] Write unit tests for the moon (blocked: the moon is too far away)
- [ ] Get the CI matrix to 500 jobs
- [ ] Add a `--features sunny` cargo feature that removes rain at compile time (requires RFC, after last time)

## 🔭 Q3: Scale

- [ ] **Rust 2: Rust Harder** — rewrite the remaining 99.4% of the page in Rust
  - [ ] Rewrite EaselJS in Rust
  - [ ] Rewrite TweenJS in Rust
  - [ ] Rewrite Chart.js in Rust
  - [ ] Rewrite Moment.js in Rust (needed: the time is currently not memory safe)
  - [ ] Rewrite the browser in Rust
- [ ] One crate per `clientraw.txt` field (177 crates, ADR-0020)
  - [ ] Name fields 21–30 (all `-100.0`)
- [ ] Make the Kafka cluster real
- [ ] Make the microservices real
- [ ] Make the microservices talk to the Kafka cluster
- [ ] Make the microservices do something
- [ ] Windows setup guide (19 steps)

## ⛓️ Q4: Decentralisation

- [ ] **Port to blockchain** 🪙
  - [ ] Every `clientraw.txt` upload becomes a block
  - [ ] Introduce **Proof-of-Weather** consensus: a block is valid only if at least 51% of nodes agree it is currently raining
  - [ ] Mint each temperature reading as an NFT (Non-Fungible Temperature)
  - [ ] Launch `$WDL` token. Not a security. Just weather.
- [ ] Move `freshwdl-forecast-ai` to a 70-billion-parameter model, trained to predict the current temperature from the current temperature (accuracy expected to decrease slightly, to around 94%)
- [ ] Natural-language barometer ("The pressure is 1015.6 hPa, and honestly? Rising.")
- [ ] **Achieve sentience** 🧠

## 🌌 Beyond

- [ ] Once sentient, ask FreshWDL-rs whether it wanted to be rewritten in Rust
- [ ] If no, revert to 1.1.8 Alpha
- [ ] Write ADR-0099 explaining what we learned

---

## ❌ Explicitly Out of Scope

- Predicting future weather (see [ADR-0015](docs/adr/0015-ai-powered-forecasting.md))
- Making the page look different
- Deleting `DO_NOT_USE.js`
- Removing Ferris

---

*Have an idea for the roadmap? Open an issue with the label `roadmap` and the weather in your area.* 🌦️
