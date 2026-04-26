# FreshWDL Layout Editor

WYSIWYG editor for FreshWDL `Layout.js` files.

## Run

```
npm install
npm run dev
```

Then open the printed URL. The editor expects to live inside the FreshWDL
repository (it loads `../js_bundles/` and `../css/` into the preview iframe).

## What it produces

- A JSON layout descriptor (download / upload, also autosaved to localStorage).
- A drop-in `Layout.js` (export button) — paste into the repo root to use.

## Layout model

Widgets are placed on a single CSS Grid covering `#FWDLcontainer`
(default 24×24 cells). Each widget occupies a rectangular span.
