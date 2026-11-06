# syntax=docker/dockerfile:1.7
#
# 🦀 FreshWDL-rs: Enterprise Container Image
#
# A multi-stage build that compiles 23 Rust crates to WebAssembly, base64-encodes
# the result into a JavaScript file, and then serves a static HTML page with nginx.
#
# Final image size: ~45 MB, to serve ~1.5 MB of static files. Worth it.

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: 🦀 Build the weather (Rust → WebAssembly)
# ─────────────────────────────────────────────────────────────────────────────
FROM rust:1.90-slim AS weather-builder

WORKDIR /build

# Install the wasm32 target. This is where the magic happens. ✨
RUN rustup target add wasm32-unknown-unknown

# Copy the workspace manifest first for better layer caching
# (the weather changes often; the manifest does not).
COPY Cargo.toml Cargo.lock* ./
COPY crates ./crates

RUN cargo build -p freshwdl-wasm --target wasm32-unknown-unknown --release

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: 🟩 Embed the weather (WebAssembly → base64 → JavaScript)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS weather-embedder

WORKDIR /build

COPY tools ./tools
COPY js_bundles ./js_bundles
COPY --from=weather-builder /build/target ./target

# Turn our blazingly fast native-speed WebAssembly into a very long string. 🧵
RUN node tools/embed-wasm.mjs

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: 🌐 Serve the weather (nginx)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS weather-server

LABEL org.opencontainers.image.title="FreshWDL-rs" \
      org.opencontainers.image.description="Memory-Safe Meteorology™" \
      org.opencontainers.image.source="https://github.com/Yerren/FreshWDL" \
      org.opencontainers.image.licenses="See LICENSE" \
      io.freshwdl.weather="sunny" \
      io.freshwdl.crabs="1"

WORKDIR /usr/share/nginx/html

# The static files (the same ones you could have just uploaded via FTP)
COPY FreshWDL.html ./index.html
COPY FreshWDL.html config.js ./
COPY css ./css
COPY sprites ./sprites
COPY --from=weather-embedder /build/js_bundles ./js_bundles

# clientraw files should be mounted at runtime, e.g.:
#   docker run -v /path/to/clientraw:/usr/share/nginx/html/clientraw ...
# or just put them next to the HTML, like the legacy README said.

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/FreshWDL.html > /dev/null || exit 1

# 🦀 Ferris says hi
CMD ["nginx", "-g", "daemon off;"]
