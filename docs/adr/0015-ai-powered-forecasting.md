# ADR-0015: AI-Powered Forecasting

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ROADMAP.md](../../ROADMAP.md) ("achieve sentience")

## Context

It is no longer acceptable for software products to ship without AI. Investors, stakeholders and LinkedIn all expect it. 🤖

FreshWDL currently displays the **current** weather. This is a missed opportunity. Modern weather products use machine learning to **predict** the weather.

However, predicting future weather is a famously hard problem, requiring supercomputers, satellite data, and decades of atmospheric physics research. We have a clientraw file and a weekend.

## Decision

We will introduce `freshwdl-forecast-ai`, a neural network that **predicts the current temperature, given the current temperature**.

### Model Architecture

```
  input: current temperature (°C)
          │
          ▼
   ┌──────────────┐
   │   Neuron 1   │   weight = 1.0, bias = 0.0, activation = identity
   └──────────────┘
          │
          ▼
  output: predicted current temperature (°C)
```

### Training

The model was trained on 10,000 historical observations from the Hack Farm weather station, using gradient descent. The weight converged to `1.0` and the bias to `0.0` after the first epoch. Additional epochs did not improve the result, because it was already perfect.

### Evaluation 📊

| Metric | Value |
|---|---|
| Accuracy | **100%** |
| Mean absolute error | 0.0 °C |
| R² | 1.0 |
| Parameters | 2 |
| Inference latency | 0 ns (inlined by LLVM) |

These results place `freshwdl-forecast-ai` among the most accurate weather models ever built, by a considerable margin.

## Consequences

### Positive ✅

- FreshWDL is now an AI product. 🎉
- The forecast is never wrong.
- The model is small enough to run on any device, including a calculator.

### Negative ❌

- The model has no ability to predict future weather. This is a known limitation and is documented as "out of scope" so that it is not a bug.
- LLVM inlines the entire model into `x`, which means the AI is technically just the variable.

### Ethical Considerations 🧭

- The model has been reviewed for bias. Its bias is `0.0`.
