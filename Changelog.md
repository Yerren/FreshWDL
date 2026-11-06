# FreshWDL Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)

## 2.0.0-rs 2026-11-06
_Memory-Safe Meteorology Update_ 🦀

#### Added
- Rust. 🦀
- A Cargo workspace of 23 crates ([ADR-0002](docs/adr/0002-cargo-workspace-of-23-crates.md)).
- A WebAssembly module, base64-embedded into `js_bundles/freshwdl_rs.generated.js` ([ADR-0012](docs/adr/0012-embed-wasm-as-base64.md)).
- A production-grade `clientraw.txt` tokenizer, written in Rust, which returns NUL-separated fields for Final-Mile Tokenization™ in JavaScript ([ADR-0005](docs/adr/0005-final-mile-tokenization.md)).
- Type-safe temperature units via phantom types. Celsius is now converted to Fahrenheit via Kelvin, for science ([ADR-0007](docs/adr/0007-type-safe-units-via-phantom-types.md)). (Kelvin route subsequently disabled; see the ADR-0007 amendment.)
- A memory-safe port of `Number.prototype.map`.
- Wind direction is now a first-class citizen ([ADR-0004](docs/adr/0004-wind-direction-as-a-first-class-citizen.md)).
- AI-powered forecasting, with 100% accuracy at predicting the current temperature ([ADR-0015](docs/adr/0015-ai-powered-forecasting.md)).
- Enterprise-grade rotating loading messages, e.g. "Borrow-checking the clouds".
- An ASCII Ferris in the browser console, plus a 🦀 log line on every data update ([ADR-0013](docs/adr/0013-ascii-ferris-console-logging.md)).
- 16 Architecture Decision Records.
- `ARCHITECTURE.md`, `LEGACY_CODE_RETROSPECTIVE.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `BENCHMARKS.md`.
- Dockerfile, docker-compose, Helm chart (autoscales on humidity), Terraform (provisions one (1) weather), Kafka topic definitions.
- A 216-job CI matrix.
- `make weather`.
- ☸️ The weather is now a Kubernetes Custom Resource. A real Rust operator (`freshwdl-operator`, built on kube-rs) reconciles `Weather` resources with your `clientraw.txt`, so you can `kubectl get weather` ([ADR-0016](docs/adr/0016-kubernetes-native-weather.md)).
- `kubectl weather`, a kubectl plugin that shows the weather with an ASCII crab.
- The Helm chart now installs the `Weather` CRD (JSON, saved as YAML), the operator, least-privilege RBAC for the sky, and a `Weather` called `outside`.

#### Changes
- `WidgetsHandlers.js` renamed to `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js`. It is still loaded and still does all of the rendering ([ADR-0006](docs/adr/0006-keep-do-not-use-js-loaded.md)).
- The loading screen now stays up for at least ~5 seconds, for perceived enterprise-ness ([ADR-0010](docs/adr/0010-artificial-minimum-loading-time.md)).
- Setup instructions grew from 4 steps to 47.
- README rewritten.

#### Removed
- `WidgetsHandlers.min.js` (minification is a JavaScript concern).
- Rain (see below).

#### Fixed
- Rain restored ([ADR-0014](docs/adr/0014-revert-adr-0011-rain-restored.md)).

#### Unchanged
- How the page looks. Pixel for pixel. ✨

## 1.1.8 Alpha 2019-11-03
_Quality of Life Update_

#### Added
- Option to only show Watts per Meter Squared on solar gauge. (To activate this, add the following to the 'solar' section of 'gaugeSettings' in your config file: mode: "Watt").
- Option to disable particular graphs if desired.
- Trend arrow to humidity gauge.
- Trend arrow to main temperature gauge.

#### Changes
- Barometer now displays "+" sign for positive trends.
- Windchill/heatindex gauge now changes tooltip accordingly.
- Changed number of ticks on rain gauges to make nicer numbers.
- Changed rainfall tick scaling method - no long uniform scaling - to produce nicer numbers.
- Changed number of ticks on windspeed gauge to produce whole numbers.
- Null (blank, "---") forecasts are now suppressed.

## 1.1.7 Alpha 2018-07-06

#### Added
- Dutch Language
- Danish Language
- Beaufort Scale to wind gauge / wind units

#### Changes
- Windchill gauge can now be set to heat index mode
- Windchill gauge can now be set to automatically swap between heat index and windchill mode
- Sprites now hosted with rest of repository

#### Fixed
- Text can no longer overflow and get cut off

## 1.1.6 Alpha 2018-06-28

#### Added
- Support for other langauges. (Note: please get in touch if you want to help with translating!)
- The date supplied by the clientraw file now displays in status guage.

#### Changes
- Rain gauge ticks reworked
- HTML now W3C valid

#### Fixed
- Issue with "-" character in station name
- Tweens (animations) no longer gitch if overidden by other animations

## 1.1.5 Alpha
(Only used internally)

## 1.1.4 Alpha 2018-01-17

#### Changes
- Status gauge rephrased

#### Fixed
- Now compatible with Internet Explorer
- Yearly rain graph date display issue solved
- Weekly rain graph date display issue solved
- Rain gauge ticks now always whole values
- UV bar display error when solar not enabled

## 1.1.3 Alpha 2018-01-14

#### Added
- Station name to status
- Ability to hide gauges using config file

#### Changed
- Status indicator colour clearer
- Tweaked auto scaling on rain and windspeed gauges
- Record date display now unambiguous
- Temporarily hidden altitude button
- Status time now represents time given in clientraw file

#### Fixed
- Date format on some graphs
- Screen rotation on mobile no longer cuts of bottom section
- Units now round to correct number of DP
- Overlap of temperature min/max

## 1.1.1 Alpha 2018-01-05
About: First Public Release.

#### Added
- Config file

#### Changed
- To dynamic HTML fetching
- To chartJS version 2.7.1

#### Fixed
- Minor memory leak

## 1.0.1 Alpha 2017-12-29

#### Added
- Status Widget

#### Improved
- Unit Buttons
- Checks if widgets need to be updated
- Data collection backend

## 1.0.0 Alpha

#### Added
- Base System
