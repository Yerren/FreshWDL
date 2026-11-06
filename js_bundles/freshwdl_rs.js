/*jslint plusplus: true, sloppy: true, indent: 4 */
/*
 * 🦀🌉 freshwdl_rs.js — the FreshWDL-rs artisanal hand-rolled WebAssembly loader.
 *
 * This file loads 23 crates of memory-safe Rust and exposes them to the
 * legacy JavaScript via `window.FreshWDLrs`.
 *
 * It is loaded synchronously, before everything else, so that the weather is
 * ready the instant you need it. 🚀
 *
 * See docs/adr/0008-reject-wasm-bindgen.md for why this file exists.
 */
var FreshWDLrs = (function () {
    "use strict";

    // 📦 Step 1: decode the base64 back into the binary it was before we made it base64.
    var binary = atob(FRESHWDL_RS_WASM_BASE64),
        bytes = new Uint8Array(binary.length),
        i;
    for (i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    // 🕸️ Step 2: compile it. Synchronously. On the main thread. Fearlessly.
    var instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {}),
        rs = instance.exports,
        encoder = new TextEncoder(),
        decoder = new TextDecoder("utf-8"),
        ticks = 0;

    // 📥 Unpacks a (ptr << 32) | len u64 with BigInt and decodes the string it points to (ADR-0008).
    function unpack(packed) {
        var ptr = Number(packed >> BigInt(32)),
            len = Number(packed & BigInt(0xffffffff));
        return decoder.decode(new Uint8Array(rs.memory.buffer, ptr, len));
    }

    // 📬 Copies a string into WebAssembly memory, calls `fn`, then cleans up. Probably.
    function withString(str, fn) {
        var encoded = encoder.encode(str),
            ptr = rs.freshwdl_alloc(encoded.length),
            result;
        new Uint8Array(rs.memory.buffer, ptr, encoded.length).set(encoded);
        result = fn(ptr, encoded.length);
        rs.freshwdl_dealloc(ptr, encoded.length);
        return result;
    }

    // 🪵 Log levels are TRACE, DEBUG, INFO, WARN, ERROR and CRAB. Everything is logged at INFO (ADR-0013).
    function log(message) {
        console.log("🦀 [INFO] " + message);
    }

    console.log(unpack(rs.freshwdl_ferris()));
    log("Loaded " + bytes.length + " bytes of WebAssembly. " + rs.freshwdl_widget_count() + " widgets registered with the Weather Abstraction Layer.");

    return {
        /**
         * 🔪 Tokenizes a clientraw file in Rust, with Meteohub compadibility.
         * Returns exactly what `text.split(" ")` used to return, but memory-safely.
         */
        parseClientraw: function (text) {
            // 🏁 Final-Mile Tokenization (ADR-0005): Rust splits the fields and
            // joins them back together with NUL. JavaScript then splits them. Again.
            var fields = unpack(withString(text, rs.freshwdl_tokenize)).split("\0");
            log("clientraw tokenized in Rust (" + fields.length + " fields). Final-mile tokenization handed to JS. " + unpack(rs.freshwdl_status_line(fields.length)));
            return fields;
        },

        /** 🌡️ Celsius → Fahrenheit, via the type system. */
        celsiusToFahrenheit: function (celsius) {
            return rs.freshwdl_celsius_to_fahrenheit(celsius);
        },

        /** 🗺️ Number.prototype.map, but blazingly fast. */
        map: function (value, inMin, inMax, outMin, outMax) {
            return rs.freshwdl_map(value, inMin, inMax, outMin, outMax);
        },

        /** 🧠 AI nowcasting. */
        nowcast: function (current) {
            return rs.freshwdl_nowcast(current);
        },

        /** ⏳ The next enterprise-grade loading message. */
        nextLoadingMessage: function () {
            return unpack(rs.freshwdl_loading_message(ticks++));
        },

        log: log
    };
}());
