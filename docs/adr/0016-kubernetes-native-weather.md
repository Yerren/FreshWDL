# ADR-0016: Kubernetes-Native Weather

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0003](0003-adopt-rust.md), [ADR-0015](0015-ai-powered-forecasting.md), [ROADMAP.md](../../ROADMAP.md)

## Context

FreshWDL-rs ships a Helm chart, a HorizontalPodAutoscaler that scales on humidity, and a Kafka topic. However, during an internal review (one person, late at night), a critical gap was found: ☸️

**The weather itself was not a Kubernetes resource.**

This meant that:

- You could not `kubectl get weather`. 😱
- The weather could not be managed declaratively, via GitOps.
- There was no reconcile loop, so the weather drifted from its desired state constantly, which meteorologists call "weather".
- Platform teams had no way to apply RBAC to the sky.

Industry best practice is clear: anything important should be a Custom Resource with an operator. The weather is important. Therefore, the weather must be a Custom Resource with an operator. 🧠

## Decision

We will introduce:

1. **A `Weather` CustomResourceDefinition** in the `weather.freshwdl.io` API group (`v1`, namespaced, short name `wx`). Its `spec` says where the weather station uploads `clientraw.txt`. Its `status` contains the temperature, humidity, wind, wind direction (a first-class citizen, [ADR-0004](0004-wind-direction-as-a-first-class-citizen.md)), pressure, conditions, vibe, AI forecast ([ADR-0015](0015-ai-powered-forecasting.md)) and a message from Ferris.
2. **`freshwdl-operator`**, a real Kubernetes operator written in Rust with [kube-rs](https://kube.rs). It watches every `Weather`, fetches its `clientraw.txt` every `refreshSeconds`, tokenizes it with `freshwdl-clientraw` (the same tokenizer the web page uses, so the weather is consistent across runtimes), and patches the status.
3. **`kubectl-weather`**, a kubectl plugin, so that `kubectl weather` prints the weather with an ASCII crab.
4. **Helm chart support:** the CRD, the operator Deployment, least-privilege RBAC, and a default `Weather` named `outside`.

The CRD is generated from Rust types (`cargo run -p freshwdl-operator --bin crdgen`). The generator outputs JSON, which we save with a `.yaml` extension, because YAML is a superset of JSON. Helm accepts this. We have decided not to ask further questions.

### RBAC

The operator's ClusterRole grants `get`, `list` and `watch` on `weathers`, and `patch` on `weathers/status`. It may **observe** the weather. It may **not** create, delete or modify the weather. Least privilege applies to the sky too. 🔐

### Why not just open the web page?

The web page does not support `kubectl`. 🤷

## Consequences

### Positive ✅

- `kubectl get weather` works. This is genuinely the best thing in this PR.
- The weather is now GitOps-compatible. You can `git revert` a `Weather`, although the actual weather will not change.
- If the weather station goes down, the `Weather` status becomes `Data Currently Unavailable` with vibe `Fog 🌫️`, which is the same message the web page shows, so the experience is consistent.
- The weather can now be managed from any Kubernetes dashboard, alongside your databases and other mission-critical workloads.

### Negative ❌

- Building the operator downloads 184 crates from crates.io. 📦 This takes the dependency graph from 0 third-party crates to 184 third-party crates, to observe one weather. `Cargo.lock` grew by about 2,700 lines, which is good for the diff.
- The web page does not use any of this.
- The status is stored as pre-formatted strings (`"14.3°C"`) so that `kubectl get` looks nice. Type safety, which we spent 22 crates on, ends at the API server.
- There is no leader election. If you run two replicas, both will observe the weather. The weather will not mind.

### Neutral 😐

- Changing the weather (`spec.desiredTemperature`) is deferred to ADR-0023, pending sentience ([ROADMAP.md](../../ROADMAP.md)).
