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

Other configuration fields control the refresh interval, request timeout, initial units, widget visibility, and graph visibility. `siteName` sets the brand text in the top-left corner and `siteUrl` its link target; `stationName` sets the browser tab title and the name shown in the summary card. The top-right settings menu stores user-selected units and the system/light/dark appearance preference in the browser.

## Static deployment

1. Run `npm run build`.
2. Upload the contents of `dist/` to any static web host.
3. For live mode, make the four raw `clientraw*.txt` files available at the configured base URL.

The build uses relative asset URLs, so it can be hosted at a domain root or in a subdirectory.
