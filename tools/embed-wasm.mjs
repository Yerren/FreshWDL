#!/usr/bin/env node
// 🦀📦 embed-wasm.mjs
//
// Takes the compiled WebAssembly module and embeds it, as base64, into a
// JavaScript file, so that it can be loaded synchronously by a <script> tag.
//
// This means FreshWDL-rs ships a binary, encoded as text, inside JavaScript,
// that is decoded back into a binary, compiled into WebAssembly, and then
// called by JavaScript. This is called "the web platform". 🌐
//
// Usage: node tools/embed-wasm.mjs [path/to/freshwdl_wasm.wasm]

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const input = process.argv[2] ?? "target/wasm32-unknown-unknown/release/freshwdl_wasm.wasm";
const output = "js_bundles/freshwdl_rs.generated.js";

const bytes = readFileSync(input);
const b64 = bytes.toString("base64");
const sha = createHash("sha256").update(bytes).digest("hex");

// Wrap at 100 columns so the diff is longer and therefore more impressive. 📈
const lines = b64.match(/.{1,100}/g).map((l) => `    "${l}"`).join(" +\n");

writeFileSync(
    output,
    `/*
 * ⚠️ GENERATED FILE. DO NOT EDIT. (Unlike WidgetsHandlers.legacy.deprecated.old.DO_NOT_USE.js,
 * which you also should not edit, but which is not generated.)
 *
 * 🦀 FreshWDL-rs WebAssembly module, base64-encoded.
 * Source:  ${input.replace(/\\/g, "/")}
 * Size:    ${bytes.length} bytes (${b64.length} bytes as base64, a ${((b64.length / bytes.length - 1) * 100).toFixed(0)}% improvement in size)
 * SHA-256: ${sha}
 *
 * Regenerate with: make weather
 */
var FRESHWDL_RS_WASM_BASE64 =
${lines};
`,
);

console.log(`🦀 Embedded ${bytes.length} bytes of memory-safe weather into ${output}`);
