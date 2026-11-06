# ADR-0013: Observability via ASCII Ferris Console Logging

- **Status:** ✅ Accepted
- **Date:** 2026-11-06

## Context

The legacy implementation has no observability strategy. When new weather data arrives, the gauges update silently. There are no logs, no metrics, no traces, and no crabs.

Modern systems require observability. 📈 Without it, how would anybody know that the temperature changed from 14.3 °C to 14.4 °C, other than by looking at the gauge that displays the temperature?

We evaluated:

| Option | Cost | Crabs |
|---|---|---|
| OpenTelemetry + Jaeger + Grafana | High | 0 |
| Datadog | Very high | 0 |
| `console.log` | Free | 0 |
| `console.log` with an ASCII crab | Free | **1** |

## Decision

We will adopt **`console.log` with an ASCII crab**, provided by `freshwdl-ferris`. 🦀

1. On page load, a large ASCII-art Ferris will be printed to the browser console, along with the version and a short motivational message.
2. On every data update, a structured log line will be emitted, prefixed with `🦀`, e.g.:

   ```
   🦀 [INFO] clientraw tokenized in Rust (179 fields). Final-mile tokenization handed to JS. Many fields, all of them borrow-checked. This is fine.
   ```

3. Log levels will be `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` and `CRAB`. All logs are emitted at `INFO`.

## Consequences

### Positive ✅

- Complete observability of the weather. 🔭
- Anyone who opens the console is greeted by a crab, which improves morale.

### Negative ❌

- The console now receives a new log line every 5 seconds forever. On a page left open for a day, this is 17,280 crabs.

### Future Work

- Ship crab logs to Kafka ([`kafka/topics.yaml`](../../kafka/topics.yaml), topic `weather.crab-logs.v1`).
