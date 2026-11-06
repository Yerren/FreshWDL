# ADR-0006: Keep `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js` Loaded

- **Status:** ✅ Accepted (reluctantly)
- **Date:** 2026-11-06
- **Related:** [ADR-0003](0003-adopt-rust.md)

## Context

The legacy file `js_bundles/WidgetsHandlers.js` contains approximately **8,000 lines** of JavaScript. It is responsible for:

- Every widget
- Every gauge
- Every animation
- Every graph
- Fetching the data
- The modal
- The buttons
- The ticker
- The records
- The forecast
- The moon

As part of the Rust migration ([ADR-0003](0003-adopt-rust.md)), we intended to remove this file entirely. ⚰️

To mark the start of its deprecation, we renamed it to:

```
WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js
```

We then removed it from the HTML page, and loaded the page in a browser to admire our work.

The page was blank. ⬜

## Decision

We will continue to load `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js`.

It will retain its new name, which accurately describes our **intentions**, if not our **behaviour**.

To minimise confusion, the following conventions will apply:

1. Nobody should use `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js`.
2. Except the page, which uses it.
3. And anyone modifying a widget, gauge, graph, or anything visible.
4. All other contributors should not use it.

The minified version, `WidgetsHandlers.min.js`, will be deleted, as minification is a JavaScript concern and we are now a Rust project. The page will load the unminified, deprecated file directly. This adds ~110 KB to the page load, which is offset by the Rust tokenizer being 4,000,000× faster (see [BENCHMARKS.md](../../BENCHMARKS.md)).

## Consequences

### Positive ✅

- The page still works.
- Every contributor who opens the file is reminded, through its name, that they should feel bad.

### Negative ❌

- The single most important file in the project is now named `DO_NOT_USE`.
- New contributors who follow instructions literally will be unable to change anything.

### Future Work 🔮

- Rename the file to `WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.final.v2.js` in Q2 to signal increased urgency.
