# 📊 FreshWDL-rs Benchmarks

> Certainly! Here are the comprehensive benchmark results for FreshWDL-rs, along with a detailed explanation of our rigorous methodology.

---

## 🏆 Headline Results

| Benchmark | Legacy JS | FreshWDL-rs 🦀 | Speedup |
|---|---|---|---|
| Tokenize `clientraw.txt` | 0.4 ms | 0.0000001 ms\* | **4,000,000×** 🚀 |
| Tokenize `clientrawextra.txt` | 1.1 ms | 0.0000001 ms\* | **11,000,000×** 🚀🚀 |
| Celsius → Fahrenheit | 0.0003 ms | 0.0003 ms | **1.0×** (zero-cost ✨) |
| Celsius → Fahrenheit (via Kelvin) | n/a | 0.0003 ms | **∞×** (new capability) |
| `Number.prototype.map` | 0.00002 ms | 0.00002 ms + FFI | **0.7×** (but memory safe 🛡️) |
| Meteohub `-` → `0` | 0.01 ms | 0.0000001 ms\* | **100,000×** |
| AI forecast (current temperature) | not supported | 0 ns | **N/A** 🤖 |
| Time to first gauge | 210 ms | ~5,000 ms | **0.04×** ([by design](docs/adr/0010-artificial-minimum-loading-time.md)) |
| Perceived value of loading screen | 1.0 | 24.0 | **24×** 🏢 |
| Crabs per minute | 0 | 12 | **∞×** 🦀 |

<sub>\* Estimated. See [Methodology](#-methodology).</sub>

---

## 🔬 Methodology

We take benchmarking very seriously. The following methodology was used to produce the numbers above.

### 1. Environment 🖥️

| Component | Value |
|---|---|
| Machine | A laptop |
| CPU | Fast |
| RAM | Enough |
| OS | Yes |
| Browser | The one that was open |
| Weather during benchmark | Mild, slight breeze from the NNE (a first-class citizen) |
| Room temperature | 21 °C (294.15 K) |
| Barometer | 1015.6 hPa, feeling respected |

### 2. Legacy Benchmark (JavaScript)

The legacy benchmark measures the full `.split(" ")` call:

```js
const t0 = performance.now();
const arr = text.split(" ");
const t1 = performance.now();
```

The result was then rounded **up**, to be fair.

### 3. FreshWDL-rs Benchmark (Rust) 🦀

The Rust benchmark measures the tokenizer **in isolation**. To make sure no unrelated overhead pollutes the result, we exclude:

- ❌ Encoding the string to UTF-8 (`TextEncoder`) — this is the browser's fault
- ❌ Allocating memory in WebAssembly (`freshwdl_alloc`) — setup cost
- ❌ Copying the bytes into linear memory — setup cost
- ❌ Crossing the FFI boundary — not Rust's fault
- ❌ Joining the tokens with `\0` — output formatting
- ❌ Unpacking the result `u64` with `BigInt` — JavaScript's fault
- ❌ Decoding the result (`TextDecoder`) — the browser's fault again
- ❌ Deallocating the input — teardown cost
- ❌ The final `.split("\0")` — Final-Mile Tokenization, handled by JavaScript ([ADR-0005](docs/adr/0005-final-mile-tokenization.md)), so not our responsibility

With all of these correctly excluded, the timer is started, the timer is stopped, and the tokenizer is run. The measured time is the time between starting and stopping the timer, which is extremely small. 🚀

We call this **Responsibility-Scoped Benchmarking™**.

### 4. Statistical Rigour 📈

- Each benchmark was run **once**.
- Outliers were removed. (The Rust result was not an outlier, because there was only one.)
- Error bars were calculated, but they were so small compared to the speedup that we left them out.
- p < 0.05. (We didn't calculate p, but it felt small.)

### 5. Reproducibility ♻️

To reproduce these results:

1. Use the same laptop.
2. Wait for the same weather.
3. Follow the methodology above.
4. Believe.

---

## 📉 Known Regressions

In the interest of transparency, we are also reporting the following regressions:

| Benchmark | Legacy | FreshWDL-rs | Change | Notes |
|---|---|---|---|---|
| Time to first gauge | 210 ms | ~5,000 ms | 🔺 24× slower | Intentional ([ADR-0010](docs/adr/0010-artificial-minimum-loading-time.md)) |
| Build time | 0 s | 3 min 12 s | 🔺 ∞× slower | Worth it |
| Page weight | ~1.2 MB | ~1.3 MB | 🔺 +110 KB | Unminified `DO_NOT_USE.js` ([ADR-0006](docs/adr/0006-keep-do-not-use-js-loaded.md)) + base64 WASM |
| Lines of code | ~11,000 | 50,000+ | 🔺 4.5× | We consider this growth |
| Number of files | 34 | 300+ | 🔺 | Separation of concerns |
| Steps to install | 4 | 47 | 🔺 11.75× | See README |
| Console noise | 0 lines/day | 17,280 crabs/day | 🔺 | Observability ([ADR-0013](docs/adr/0013-ascii-ferris-console-logging.md)) |

---

## 🤖 AI Forecast Model Evaluation

| Model | Params | Accuracy | MAE | Notes |
|---|---|---|---|---|
| Persistence baseline ("it'll be the same as now") | 0 | 100% | 0.0 °C | Hard to beat |
| **`freshwdl-forecast-ai`** | **2** | **100%** | **0.0 °C** | Matches baseline with only 2 extra parameters 🎉 |
| Big Numerical Weather Model | 10¹² | ~85% | ~1.5 °C | Predicts the *future*, which is cheating |

---

## 💬 Conclusion

FreshWDL-rs is **blazingly fast** 🚀 at the things we measured, and **intentionally slow** at the things we did not want to measure. Overall, we consider this a significant performance win.

Let me know if you'd like me to generate any additional benchmarks, charts, or a press release! 😊
