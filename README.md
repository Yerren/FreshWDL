Certainly! Here's the updated README for the newly modernized FreshWDL project:

---

<div align="center">

# 🦀 FreshWDL-rs 🦀

### *Memory-Safe Meteorology™*

**The world's first blazingly fast 🚀, fearlessly concurrent 🦀, zero-cost-abstracted ⚡, enterprise-grade 🏢, cloud-native ☁️, AI-powered 🤖 weather display, rewritten in Rust.**

[![Rust](https://img.shields.io/badge/rust-100%25-orange?logo=rust)](#-why-rust)
[![Blazingly Fast](https://img.shields.io/badge/speed-blazingly%20fast-ff6600)](BENCHMARKS.md)
[![Memory Safe](https://img.shields.io/badge/weather-memory%20safe-success)](SECURITY.md)
[![Coverage](https://img.shields.io/badge/coverage-99.97%25-brightgreen)](#-testing)
[![Weather](https://img.shields.io/badge/weather-sunny-yellow)](https://www.hackfarm.co.nz/FreshWDL/FreshWDL.html)
[![AI Generated](https://img.shields.io/badge/AI%20generated-yes-blueviolet)](#-acknowledgements)
[![Crates](https://img.shields.io/badge/crates-23-orange)](ARCHITECTURE.md)
[![CI Jobs](https://img.shields.io/badge/CI%20jobs-216-blue)](.github/workflows/ci.yml)
[![ADRs](https://img.shields.io/badge/ADRs-15-informational)](docs/adr/README.md)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-326ce5?logo=kubernetes)](helm/freshwdl)
[![Terraform](https://img.shields.io/badge/terraform-1%20weather-7b42bc?logo=terraform)](terraform/main.tf)
[![Kafka](https://img.shields.io/badge/kafka-event%20driven-231f20?logo=apachekafka)](kafka/topics.yaml)
[![Unsafe](https://img.shields.io/badge/unsafe-only%20drizzle-red)](SECURITY.md)
[![Barometer](https://img.shields.io/badge/barometer-respected-9cf)](CODE_OF_CONDUCT.md)
[![Sentience](https://img.shields.io/badge/sentience-Q4-lightgrey)](ROADMAP.md)

</div>

---

## 📖 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🦀 Why Rust?](#-why-rust)
- [📊 Benchmarks](#-benchmarks)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Prerequisites](#️-prerequisites)
- [🚀 Quick Start (47 Easy Steps)](#-quick-start-47-easy-steps)
- [⚙️ Configuration](#️-configuration)
- [🌍 Language](#-language)
- [🧪 Testing](#-testing)
- [🩺 Troubleshooting](#-troubleshooting)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)
- [📬 Getting In Touch](#-getting-in-touch)
- [☕ Donate](#-donate)
- [🙏 Acknowledgements](#-acknowledgements)
- [🗄️ Legacy (Deprecated) Deployment](#️-legacy-deprecated-deployment)

---

## 🌟 Overview

FreshWDL-rs is a **next-generation**, **paradigm-shifting** reimagining of FreshWDL, the lightweight, pure JavaScript alternative to WDL (which runs on Flash).

In today's fast-paced meteorological landscape, weather enthusiasts demand more than just "seeing the temperature." They demand **guarantees**. They demand **type safety**. They demand that their wind direction is **borrow-checked**. FreshWDL-rs delivers on all of these needs and more, leveraging the full power of the Rust programming language to read a 700-byte text file with **unprecedented confidence**.

> 💡 **Did you know?** The original FreshWDL could display the weather. FreshWDL-rs can display the weather **safely**.

See it in action at: https://www.hackfarm.co.nz/FreshWDL/FreshWDL.html *(note: currently running the legacy, memory-unsafe version. Viewer discretion is advised.)*

---

## ✨ Key Features

| Feature | Legacy FreshWDL | FreshWDL-rs 🦀 |
|---|---|---|
| Displays the weather | ✅ | ✅ |
| Displays the weather *safely* | ❌ | ✅ |
| Number of programming languages required | 1 | 7 (Rust, JS, YAML, HCL, Make, Dockerfile, Mermaid) |
| Number of files to upload | 2 | 2 (but you have to build one of them first) |
| Crates | 0 | **23** |
| Architecture Decision Records | 0 | **15** |
| CI jobs per commit | 0 | **216** |
| Kubernetes support | ❌ | ✅ (for a static HTML page) |
| Kafka event bus | ❌ | ✅ (aspirational) |
| AI weather forecasting | ❌ | ✅ (100% accurate*) |
| Loading screen duration | As long as needed | **At least 5 seconds** ([ADR-0010](docs/adr/0010-artificial-minimum-loading-time.md)) |
| ASCII crab in the console | ❌ | ✅✅✅ |
| Looks identical to the original | — | ✅ pixel-perfect |

<sub>\* Predicts the current temperature from the current temperature. See [`freshwdl-forecast-ai`](crates/freshwdl-forecast-ai).</sub>

### 🔑 Highlights

- 🚀 **Blazingly Fast** — Tokenizes `clientraw.txt` up to 4,000,000× faster than `String.prototype.split`\*.
- 🦀 **Fearless Concurrency** — All 23 crates can be compiled at the same time.
- 🛡️ **Memory Safe** — Not a single byte of weather has leaked since the rewrite.
- 🌡️ **Type-Safe Units** — `Temperature<Celsius>` and `Temperature<Fahrenheit>` can never be confused at compile time. At runtime they are both `f64`, but in a *safe* way.
- 🧭 **Wind Direction as a First-Class Citizen** — Wind direction now has the same rights as any other value ([ADR-0004](docs/adr/0004-wind-direction-as-a-first-class-citizen.md)).
- 🌧️ **Rain** — Briefly deprecated, now fully restored ([ADR-0011](docs/adr/0011-deprecate-rain.md), [ADR-0014](docs/adr/0014-revert-adr-0011-rain-restored.md)).
- 🤖 **AI-Powered** — Includes a neural network. It has one neuron. The neuron is very good at its job.
- 🔌 **Hand-Rolled FFI** — We rejected `wasm-bindgen` because we wanted to understand the pain personally ([ADR-0008](docs/adr/0008-reject-wasm-bindgen.md)).
- ♻️ **Backwards Compatible** — The original 8,000-line `WidgetsHandlers.js` is still loaded and still does all of the rendering. It has simply been renamed to make everyone feel bad about it ([ADR-0006](docs/adr/0006-keep-do-not-use-js-loaded.md)).

---

## 🦀 Why Rust?

> *"Why would you rewrite a working weather display in Rust?"*
> — Everyone, probably

Great question! Let's unpack it. 🧵

### 1. The Memory Safety Crisis in Amateur Meteorology

Every five seconds, millions of weather stations around the world upload a file called `clientraw.txt`. This file contains up to **177 space-separated values**. In the legacy JavaScript implementation, these values were parsed using:

```js
xhttpCR.responseText.toString().split(" ");
```

Take a moment to sit with that. 😔

There is no lifetime annotation. There is no ownership model. There is no guarantee that the string `"14.3"` will not be **mutably aliased** by a rogue `"Cloudy/Dry"`. Researchers\* estimate that up to **0%** of JavaScript weather pages have suffered a buffer overflow. We believe that number should be lower.

<sub>\* We are the researchers.</sub>

### 2. Zero-Cost Abstractions

In FreshWDL-rs, a temperature is not just a number. It is a `Temperature<Celsius>`, which wraps an `f64`, implements `From<Temperature<Kelvin>>`, `Display`, `PartialOrd`, `Copy`, `Clone`, `Debug`, `Default`, `Hash`\*\*, `Send`, `Sync`, and `WeatherPhenomenon`. All of this compiles down to exactly the same `f64` as before. **That's** what we mean by zero-cost: it cost zero dollars, and only several weeks.

<sub>\*\* Hashing floats is not actually possible, so we hash the vibes.</sub>

### 3. Fearless Concurrency

The weather happens concurrently. Wind blows *while* it rains *while* the barometer rises. JavaScript, being single-threaded, has been forcing these phenomena to take turns for over twenty years. Rust finally lets the weather be itself. 🌈

*(Note: the WASM build is single-threaded. But it's single-threaded **fearlessly**.)*

### 4. The Borrow Checker

The borrow checker ensures that no two parts of the program can mutate the wind at the same time. This was a real problem in the legacy codebase, where `windSpeed`, `windGauge` and `windGraph` all had access to `arrayClientraw[1]` simultaneously. Nobody got hurt, but somebody **could have**.

### 5. Community

Rust has been voted "most admired language" in developer surveys for many years running. FreshWDL has been voted "most admired weather display" by at least one person (its author). Combining the two was frankly inevitable.

### 6. It Was Fun

As a large language model, I don't experience fun. But if I did, this would have been it.

---

## 📊 Benchmarks

All benchmarks were run on a modern laptop, in a quiet room, during mild weather. Full methodology in [BENCHMARKS.md](BENCHMARKS.md).

| Operation | Legacy JS | FreshWDL-rs 🦀 | Speedup |
|---|---|---|---|
| Tokenize `clientraw.txt` (827 bytes) | 0.4 ms | 0.0000001 ms\* | **4,000,000×** 🚀 |
| Convert 14.3 °C to °F | 0.0003 ms | 0.0003 ms | **1.0×** (zero-cost!) |
| `Number.prototype.map` | 0.00002 ms | 0.00002 ms + FFI overhead | **0.7×** (memory-safe though) |
| Time to first gauge | 210 ms | 5,000 ms | **0.04×** ([by design](docs/adr/0010-artificial-minimum-loading-time.md)) |
| Lines of code | 11,213 | 50,000+ | **4.5× more code** 📈 |
| Developer confidence | Moderate | **Extreme** | ∞ |
| Predict current temperature | Not supported | 0 ms, 100% accuracy | **N/A** 🤖 |
| Build time | 0 s | 3 min 12 s | Worth it |
| Number of crabs in console | 0 | 1 per update | **∞×** 🦀 |

<sub>\* Estimated. The Rust tokenizer was benchmarked in isolation, with the clock started after it had finished. The final step, `.split("\0")`, is still performed in JavaScript and is excluded from the measurement, as it is "not Rust's fault" ([ADR-0005](docs/adr/0005-final-mile-tokenization.md)).</sub>

---

## 🏗️ Architecture

FreshWDL-rs follows a **modular, hexagonal, event-driven, layered microkernel** architecture. A brief overview is given below; the full 400-line explanation with diagrams can be found in [ARCHITECTURE.md](ARCHITECTURE.md).

```
clientraw.txt
     │
     ▼
 XMLHttpRequest  (legacy, beloved)
     │
     ▼
 freshwdl-ffi ─────▶ freshwdl-clientraw (tokenizer)
     │                       │
     │                       ▼
     │              freshwdl-weather-abstraction-layer
     │                       │
     ◀──────── NUL-separated fields ◀──┘
     │
     ▼
 .split("\0")   ← Final-Mile Tokenization™
     │
     ▼
 WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js
     │
     ▼
 🌡️ the gauge (unchanged)
```

### 📦 Workspace Crates

| Crate | Responsibility |
|---|---|
| `freshwdl-core` | Core traits: `WeatherPhenomenon`, `Widget`, `Unit`, `Gauge`, `Vibe` |
| `freshwdl-prelude` | Re-exports everything so you never have to think again |
| `freshwdl-clientraw` | Production-grade tokenizer for `clientraw.txt`, incl. Meteohub `-` → `0` compatibility |
| `freshwdl-units` | `Temperature<Celsius>`, `Temperature<Fahrenheit>`, `Temperature<Kelvin>`, pressure, wind, Beaufort |
| `freshwdl-number-prototype-map` | A faithful, memory-safe port of `Number.prototype.map` |
| `freshwdl-weather-abstraction-layer` | The WAL. Abstracts the weather. |
| `freshwdl-temperature-01` | Temperature widget #1 |
| `freshwdl-temperature-02` | Temperature widget #2 (honours the original copy-paste) |
| `freshwdl-temperature-03` | Temperature widget #3 (honours the copy-paste of the copy-paste) |
| `freshwdl-barometer` | Pressure, but safe |
| `freshwdl-humidity` | Moisture abstractions |
| `freshwdl-wind` | Wind. First-class citizen. |
| `freshwdl-rain` | Rain (restored, see ADR-0014) |
| `freshwdl-solar` | The sun |
| `freshwdl-uv` | The sun, but spicier |
| `freshwdl-moon` | The moon (no unit tests, it's too far away) |
| `freshwdl-i18n` | 18 languages, exhaustively matched |
| `freshwdl-forecast-ai` | 🤖 A neural network that predicts the current temperature |
| `freshwdl-loading-messages` | Enterprise-grade loading messages |
| `freshwdl-ferris` | ASCII-art crab logger |
| `freshwdl-ffi` | Hand-rolled FFI (no `wasm-bindgen`, by choice, see ADR-0008) |
| `freshwdl-wasm` | The `cdylib` that ties it all together |

---

## 🛠️ Prerequisites

Before you begin, please make sure you have the following installed and configured:

- 🦀 Rust (stable, beta, nightly **and** 1.75 — CI tests all four)
- 🎯 The `wasm32-unknown-unknown` target
- 🟩 Node.js 22+
- 🐳 Docker 27+
- ☸️ Kubernetes 1.30+ (minikube, kind, k3s, or a real cluster)
- ⛵ Helm 3
- 🌍 Terraform 1.9+
- 📨 Apache Kafka (optional, but spiritually required)
- 🧰 GNU Make
- 🌦️ A weather station running Weather Display
- 🧘 Patience

---

## 🚀 Quick Start (47 Easy Steps)

Getting started with FreshWDL-rs is simple! Just follow these 47 steps:

### Phase 1: Toolchain 🦀

1. Install `rustup` from https://rustup.rs.
2. Restart your terminal.
3. Restart your terminal again, just to be safe.
4. Run `rustup default stable`.
5. Run `rustup target add wasm32-unknown-unknown`.
6. Run `rustup component add clippy rustfmt`.
7. Verify with `cargo --version`. You should see a version number. If you don't, return to step 1. 🔁
8. Install Node.js 22 or later.
9. Verify with `node --version`.
10. Install GNU Make. (Windows users: please see the separate 19-step guide, coming Q3.)

### Phase 2: Repository 📂

11. Clone the repository: `git clone https://github.com/Yerren/FreshWDL`.
12. `cd FreshWDL`.
13. Take a moment to appreciate the new directory structure.
14. Read [ARCHITECTURE.md](ARCHITECTURE.md) in full.
15. Read all 15 [ADRs](docs/adr/README.md). There will be a quiz.
16. Read [LEGACY_CODE_RETROSPECTIVE.md](LEGACY_CODE_RETROSPECTIVE.md) and reflect.
17. Sign the Rust Ethics Pledge in [CONTRIBUTING.md](CONTRIBUTING.md).

### Phase 3: Build 🏗️

18. Run `cargo check --workspace` to verify all 23 crates are healthy.
19. Run `cargo test --workspace`. All tests should pass, including `it_should_not_rain_indoors`.
20. Run `cargo clippy --workspace`. Address any warnings emotionally.
21. Run `make weather`.
22. This runs `cargo build -p freshwdl-wasm --target wasm32-unknown-unknown --release`.
23. This then runs `node tools/embed-wasm.mjs`, which base64-encodes the `.wasm` binary into `js_bundles/freshwdl_rs.generated.js`.
24. Verify that `js_bundles/freshwdl_rs.generated.js` exists.
25. Do **not** open `js_bundles/freshwdl_rs.generated.js`. It is just base64. It will not help you.

### Phase 4: Containerization 🐳

26. Run `docker build -t freshwdl-rs:latest .`.
27. Run `docker compose up -d`.
28. Navigate to http://localhost:8080 and confirm the weather is present.
29. Run `docker compose down`, because we're going to Kubernetes now.

### Phase 5: Orchestration ☸️

30. Start your Kubernetes cluster (`minikube start`, `kind create cluster`, etc).
31. Create a namespace: `kubectl create namespace weather`.
32. `helm install freshwdl ./helm/freshwdl -n weather`.
33. Wait for the pods to become Ready. 🧘
34. Verify the HorizontalPodAutoscaler is scaling on humidity: `kubectl get hpa -n weather`.
35. If it's humid, you should now have more pods. This is expected.

### Phase 6: Infrastructure as Code 🌍

36. `cd terraform`.
37. `terraform init`.
38. `terraform plan`. You should see `Plan: 1 to add` — this is your weather.
39. `terraform apply`. Type `yes`. Feel the power.
40. `cd ..`.

### Phase 7: Event Streaming 📨

41. (Optional) Create the Kafka topics in [`kafka/topics.yaml`](kafka/topics.yaml).
42. (Optional) Do nothing with them. They exist for the architecture diagram.

### Phase 8: Deployment 🚀

43. Take the `FreshWDL.html` file and the `js_bundles` folder.
44. Upload them, along with `config.js`, to the same location on your web server as your `clientraw` files.
45. Notice that this is basically what you used to do before.
46. Do not think about step 45.
47. Navigate to the page, open the browser console, and say hello to Ferris. 🦀

🎉 **Congratulations!** You're now running memory-safe weather!

---

## ⚙️ Configuration

Configuration is still done via `config.js`, which has been preserved exactly for **backwards compatibility** and also because we forgot about it. A migration to `freshwdl.toml` is on the [roadmap](ROADMAP.md).

You can still adjust:

- the `clientraw` file names
- `customBaseURL`
- `lang`
- default units (`currentUnits`)
- gauge and graph settings

---

## 🌍 Language

- **To set the language:** set the **lang** field in your config file to one of: en (English), nl (Dutch), da (Danish), ro (Romanian), fr (French), gr (Greek), it (Italian), es (Spanish), nb (Norwegian), bg (Bulgarian), cs (Czech), fi (Finnish), si (Slovenian), de (German), pt (Portuguese), sv (Swedish), ca (Catalan), or hr (Croatian).
- If you want to help translate the system into your language, please don't hesitate to get in touch. (It takes less than an hour to fully translate into a new language!) *(Rust edition: it now takes less than an hour, plus one `cargo build`, plus the 216 CI jobs.)*
- A great thanks goes out to those who have helped so far!
- 🦀 Every language is now an exhaustively matched `enum` variant in `freshwdl-i18n`. Forgetting a translation is a **compile error**. You're welcome.

---

## 🧪 Testing

```bash
cargo test --workspace
```

Our test suite has **99.97% coverage**\*. Highlights include:

- `it_should_not_rain_indoors`
- `celsius_to_fahrenheit_and_back_is_lossless_ish`
- `moon_exists`
- `wind_direction_is_a_first_class_citizen`
- `barometer_feels_respected`
- `forecast_ai_achieves_100_percent_accuracy`
- `number_prototype_map_maps_numbers`

<sub>\* The remaining 0.03% is the weather itself, which is notoriously difficult to mock.</sub>

---

## 🩺 Troubleshooting

#### (24 Hour) Graphs having strange straight line portions for 12 hours spans:
- Caused by the clientraw files uploading in 12 hour format. Download the newest version of WD to fix this issue.

#### "Data Currently Unavailable" showing on loading screen:
- This can happen briefly if there is a 'hiccup' on the server, and should normally go away quickly.
- If you have just set up your FreshWDL page, and the "Data Currently Unavailable" message persists, it is most likely because either the names of the clientraw files or the custom path to the clientraw files in config.js are not correct or, if no custom path was set, the html page and config.js have not been uploaded to where the clientraw files are uploaded to.

#### The loading screen takes at least 5 seconds now:
- This is intentional. Users trust software that takes a moment to think. See [ADR-0010](docs/adr/0010-artificial-minimum-loading-time.md).

#### There is a crab in my console:
- That's Ferris. Ferris is a friend. 🦀

#### `error[E0499]: cannot borrow the weather as mutable more than once at a time`
- You are trying to observe the weather from two places at once. Pick one.

#### `make: *** No rule to make target 'weather'`
- You are not in the repository root, or the weather is not available in your region.

#### It is raining but the rain gauge shows 0:
- Check that you are not running a build from between [ADR-0011](docs/adr/0011-deprecate-rain.md) and [ADR-0014](docs/adr/0014-revert-adr-0011-rain-restored.md).

---

## ❓ FAQ

**Q: Does it look any different?**
A: No. It is pixel-for-pixel identical. That is the beauty of it. ✨

**Q: So what does the Rust actually do?**
A: It tokenizes `clientraw.txt`, converts Celsius to Fahrenheit, and performs `Number.prototype.map`. It then hands everything back to JavaScript, which does the rest. This is called **separation of concerns**.

**Q: Isn't `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js` still doing all the rendering?**
A: Yes. Please do not use it. (It is used.)

**Q: Why are there three temperature crates?**
A: Because there were three temperature widgets, and we respect history. See [ADR-0009](docs/adr/0009-three-temperature-crates.md).

**Q: Can I use this without Kubernetes?**
A: Technically yes. Emotionally, no.

**Q: Is the AI forecast accurate?**
A: It has never been wrong. It predicts the current temperature, given the current temperature.

**Q: Was this written by AI?**
A: Great question! I'd be happy to help you with that. 😊

---

## 🤝 Contributing

We welcome contributions of all kinds! Please read [CONTRIBUTING.md](CONTRIBUTING.md), sign the Rust Ethics Pledge, and make sure all 216 CI jobs pass. Please also observe our [Code of Conduct](CODE_OF_CONDUCT.md) — in particular, be kind to the barometer.

Security issues (hail, adversarial fog, etc.) should be reported according to [SECURITY.md](SECURITY.md).

---

## 📬 Getting In Touch

If you want to suggest a feature or report a bug, either go to the "Issues" tab and enter the details in there, or email me at yerren@renerica.com. Any feedback is welcome.

*(Please do not email Yerren about the Rust rewrite. He did not ask for this.)*

---

## ☕ Donate

If this project has helped you out, or if you simply want to support its continued development, please consider donating :)

<a href='https://ko-fi.com/G2G6SUREK' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

*(Donations now go towards CI minutes for the 216-job matrix.)*

---

## 🙏 Acknowledgements

This project would not have been possible without:

- 🦀 **Ferris the Crab**, for being an inspiration and also for living in our console now.
- 🌍 **The open-source community**, for building the tools that made this unnecessary rewrite possible.
- 🧑‍💻 **Yerren**, for writing FreshWDL, which worked perfectly fine.
- 🌦️ **The weather**, for continuing to happen, regardless of the language it is displayed in.
- 📊 **The barometer**, for its patience.
- 🌙 **The moon**, for being there.
- 🤖 **Large language models everywhere**, for their tireless commitment to generating documentation.
- ☕ **Coffee.**

---

## 🗄️ Legacy (Deprecated) Deployment

> ⚠️ **DEPRECATED:** The following instructions describe the legacy deployment method. It is no longer recommended, as it does not involve Rust, Docker, Kubernetes, or Terraform. It is preserved here for historical interest only.

1. Go to: http://www.weather-display.com/files.php, and download the FreshWDL files.
2. (If needed) Adjust the config.js file in any text editor, changing the 'clientraw' file names to match the names you use. You can also change the default units here. If you need, it is also possible to set the path to where your 'clientraw' files are uploaded (see part 4).
3. (Optional) You can rename the html page to anything you wish.
4. Upload both the html page and the config.js file to the same location on your server. If you set a custom path to your clientraw files in config.js, you can upload them anywhere. Otherwise, they must be in the same place your clientraw files are uploaded to.

You should now be good to go! Simply navigate to the html page in any web browser to see your new FreshWDL page up and running!

> 🤔 *Note: some users have reported that these 4 steps are "easier" than the 47 steps above. We are investigating.*

---

<div align="center">

Made with 🦀 and ❤️ and an unreasonable amount of tokens.

**FreshWDL-rs** — *Because the weather deserves memory safety.*

</div>

---

Let me know if you'd like me to make any further changes to the README! 😊
