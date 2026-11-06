#!/usr/bin/env bash
# Builds FreshWDL's Bend app into build/freshwdl.mjs, the module the page's
# host script imports. Needs bun and a bend checkout (or `bend` on PATH).
#
#   tools/build.sh            # regenerate the dictionary and markup, check, build
#   BEND="bun ~/bend/bend2/main.ts" tools/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BEND=${BEND:-bend}

# Generated sources: bend/lib/dict.bend from dictionary.json, bend/lib/markup.bend
# from markup/*.html, bend/wiring.bend from the table in tools/gen-wiring.mjs.
bun tools/gen-dict.mjs
bun tools/gen-markup.mjs
bun tools/gen-wiring.mjs

mkdir -p build
$BEND bend/app.bend --check-only
$BEND bend/app.bend -o build/freshwdl.mjs
echo "built build/freshwdl.mjs ($(wc -c < build/freshwdl.mjs) bytes)"
