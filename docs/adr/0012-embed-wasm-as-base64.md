# ADR-0012: Embed the WebAssembly Binary as Base64 in a JavaScript File

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Related:** [ADR-0008](0008-reject-wasm-bindgen.md), [ADR-0010](0010-artificial-minimum-loading-time.md)

## Context

The legacy page loads all of its scripts with plain `<script>` tags, in order, synchronously. The data fetching starts as soon as `WidgetsHandlers.js` is loaded, and it calls `.split(" ")` on the response.

In the Rust edition, that `.split(" ")` must instead call into WebAssembly. That means the WebAssembly module must be **ready** before the first response arrives.

The standard, recommended approach to loading WebAssembly is `WebAssembly.instantiateStreaming(fetch("freshwdl.wasm"))`, which is asynchronous. Using it would require restructuring the page's startup to wait for a promise, which would mean changing the legacy JavaScript, which is called `DO_NOT_USE` ([ADR-0006](0006-keep-do-not-use-js-loaded.md)).

Additionally, the README's deployment instructions tell users to upload "the html page and the config.js file". Adding a `.wasm` file would require users to configure their web server to serve `application/wasm`, which some hosting providers do not do.

## Decision

The `.wasm` binary will be **base64-encoded** and embedded as a string literal inside a generated JavaScript file:

```
js_bundles/freshwdl_rs.generated.js
```

This file is produced by `node tools/embed-wasm.mjs`, run as part of `make weather`. 🏗️

At load time, the file will:

1. Decode the base64 string with `atob`
2. Copy it into a `Uint8Array`
3. Compile it with `new WebAssembly.Module(bytes)` — **synchronously**, on the main thread
4. Instantiate it with `new WebAssembly.Instance(module, {})`
5. Expose the result as a global

Synchronous compilation on the main thread is discouraged by browser vendors for large modules. Our module is small, because it does almost nothing.

## Consequences

### Positive ✅

- No changes to web server configuration.
- No async startup changes.
- The `.wasm` file is now a `.js` file, which is the most portable kind of `.wasm` file.

### Negative ❌

- Base64 encoding makes the binary 33% larger.
- The generated file is a single, very long line of base64 checked into git. Code reviewers have been advised not to open it.
- Any change to the Rust code produces a diff that rewrites that entire line. This is fine. 🔥

### Neutral 😐

- We have, in effect, compiled Rust into JavaScript, which some would say defeats the purpose. We would say it **completes** the purpose.
