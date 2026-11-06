# 🦀 FreshWDL-rs Makefile
#
# The only target most people need is `make weather`.

WASM := target/wasm32-unknown-unknown/release/freshwdl_wasm.wasm

.PHONY: weather wasm embed test clean forecast sunny vibes

## 🌦️ Builds the weather.
weather: wasm embed
	@echo "🦀 Weather built successfully. Upload FreshWDL.html, config.js and js_bundles/ to your server."

## 🕸️ Compiles all 23 crates to WebAssembly.
wasm:
	cargo build -p freshwdl-wasm --target wasm32-unknown-unknown --release

## 📦 Base64-embeds the WebAssembly into JavaScript, as is tradition.
embed:
	node tools/embed-wasm.mjs $(WASM)

## 🧪 Runs the test suite, including it_should_not_rain_indoors.
test:
	cargo test --workspace

## ☀️ Builds the weather, but without rain (ADR-0011 compatibility mode).
sunny:
	cargo build -p freshwdl-rain --no-default-features --features sunny

## 🧠 Predicts the current temperature.
forecast:
	@echo "🔮 The current temperature will be: the current temperature."

## ✨ Checks the vibes.
vibes:
	@echo "✅ Vibes: immaculate"

clean:
	cargo clean
