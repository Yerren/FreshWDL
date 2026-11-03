# FreshWDL v2

FreshWDL v2 is a mobile-first, static Weather Display dashboard built with Vanilla TypeScript and Vite. It reads the original Weather Display files directly in the browser:

- `clientraw.txt`
- `clientrawextra.txt`
- `clientrawhour.txt`
- `clientrawdaily.txt`

The feeds remain raw, space-delimited text files. No server-side conversion, API, or preprocessing step is required.

## Development

```sh
npm install
npm run dev
```

The checked-in configuration uses unchanged raw feed snapshots in `public/fixtures/`, captured from the Varmestua station. This makes local development and tests deterministic and network-independent.

## Validation

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

The production bundle is written to `dist/` and contains all application code and dependencies. It does not load JavaScript or CSS from a CDN.

## Live weather configuration

Edit `public/freshwdl.config.json` before building:

```json
{
  "stationName": "My weather station",
  "siteName": "My weather station",
  "siteUrl": "./",
  "locale": "en",
  "dataMode": "live",
  "baseUrl": "./",
  "feedFiles": {
    "current": "clientraw.txt",
    "extra": "clientrawextra.txt",
    "hourly": "clientrawhour.txt",
    "daily": "clientrawdaily.txt"
  }
}
```

With `baseUrl` set to `./`, place the built v2 and the four files in the same directory, as with the original FreshWDL. A different same-origin path or absolute URL can also be used. Cross-origin URLs require the feed host to return appropriate CORS headers.

Other configuration fields control the refresh interval, request timeout, initial units, widget visibility, and graph visibility. Every graph left enabled appears in the chart card's series picker; the card shows one series at a time. `siteName` sets the brand text in the top-left corner and `siteUrl` its link target; `stationName` sets the browser tab title and the page heading. The top-right settings menu stores user-selected units and the system/light/dark appearance preference in the browser.

The "Updated" stamp counts from the station's own clock in `clientraw.txt` (fields 29-31), not from the moment the file was fetched, so a station that has stopped writing is visible as such. The feed carries a time of day without a date or timezone, so the time is placed on the day of the fetch; a clock far ahead of the fetch is read as the previous day, and one slightly ahead is treated as clock drift.

## Design

The interface follows an app-screen direction dealt by the `design-taste-frontend` skill (`achromatic-ledger`, seed 1224798985): achromatic chrome, one container of KPIs divided by rules, one large chart as the screen's main element, and a 384px rail. The single accent is the station's teal, used only on the selected data series. Charts are drawn as dependency-free SVG by `src/vendor-charts.js`, vendored unchanged from that skill; the Geist typeface is bundled locally, so the page still makes no external requests.

## Static deployment

1. Run `npm run build`.
2. Upload the contents of `dist/` to any static web host.
3. For live mode, make the four raw `clientraw*.txt` files available at the configured base URL.

The build uses relative asset URLs, so it can be hosted at a domain root or in a subdirectory.
