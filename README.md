# FreshWDL

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
  "dashboardUrl": "./",
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

Other configuration fields control the refresh interval, request timeout, initial units, widget visibility, and graph visibility. `pollingIntervalMs` sets how often live feeds are checked in milliseconds; it defaults to 30000 (30 seconds) and can be increased or decreased in `public/freshwdl.config.json`. Every graph left enabled appears in the chart card's series picker; the card shows one series at a time. `siteName` sets the brand text in the top-left corner and `siteUrl` its link target; `stationName` sets the browser tab title and the page heading. The top-right settings menu stores user-selected units and the system/light/dark appearance preference in the browser.

`staleAfterMs` sets how old a reading can be before it is considered stale. It defaults to `7200000` (2 hours). At that age, the entire "Updated" stamp turns a warning color and a matching notice above the readings explains that conditions may have changed. At twice that age (4 hours by default), both turn a danger color. In live mode, the notice explains that the station is checked automatically for new readings; it disappears when fresh readings arrive. Fixture data is identified as a static sample instead. Fetch failures use the same notice, keeping the error and Retry action visible even if the last reading is still fresh. These states refresh every 15 seconds, even without a new reading or a weather-chart redraw.

The sun/moon chart's "Now" marker uses the current browser time, not the reading time. It remains visible while the reading is from the same local calendar day, even when the weather data is stale. The marker and rise/set countdowns refresh every 15 seconds without redrawing the weather charts. When the reading is from a different day, the marker is hidden and rise/set times are shown without countdowns.

The "Updated" stamp counts from the station's own date and clock in `clientraw.txt` (time fields 29-31, day 35, month 36, year 141), not from the moment the file was fetched, so yesterday's data remains old after a reload. The feed does not carry a timezone; its date and time are interpreted in the browser's local timezone, and future timestamps are treated as clock drift and clamped to the fetch time. A newer reading timestamp updates freshness even if the weather values have not changed, without redrawing the weather charts.

## Design

The four overview blocks show temperature, wind, humidity, and rainfall. The rainfall
block shows the latest cumulative total in Weather Display's 24-hour rain history,
with today's station-reported total below it, and selects the rainfall chart when
clicked. Pressure remains available in the chart's series picker. The 24-hour rain
amount follows the feed's latest history sample rather than the live daily counter;
the cumulative samples must not be summed. Missing history is shown as a dash.

The interface follows an app-screen direction dealt by the `design-taste-frontend` skill (`achromatic-ledger`, seed 1224798985): achromatic chrome, one container of KPIs divided by rules, one large chart as the screen's main element, and a 384px rail. The single accent is the station's teal, used only on the selected data series. Charts are drawn as dependency-free SVG by `src/vendor-charts.js`, vendored unchanged from that skill; the Geist typeface is bundled locally, so the page still makes no external requests.

## Static deployment

1. Run `npm run build`.
2. Upload the contents of `dist/` to any static web host.
3. For live mode, make the four raw `clientraw*.txt` files available at the configured base URL.

The build uses relative asset URLs, so it can be hosted at a domain root or in a subdirectory.

## Compact iframe

The same build includes `embed.html`, a transparent weather view designed around
268 × 268 pixels. It shows current temperature, feels-like, today's station-reported
high/low (not rolling 24-hour extremes), and current wind speed with a compass
pointing toward the direction the wind comes from. Feels-like and daily high/low
sit to the right of the main temperature, with the external link aligned at the top.
Below the temperature row,
wind and precipitation appear side by side with equal-sized values. The smaller
compass sits beside the wind direction; the precipitation caption identifies the
last 24 hours, using the same latest cumulative history sample as the dashboard
and the configured precipitation unit. There is no station heading,
branding, or dashboard controls. A small external-link icon in the top-right
opens the full dashboard in a new tab.

The embed keeps the dashboard's achromatic app-screen direction: transparent
background, one bundled typeface, tabular readings, and matching wind/precipitation
type sizes. Its compact compass omits cardinal lettering that would be illegible
at this size; the adjacent direction text supplies that information.
Both rows share the same two-column grid, aligning temperature details with
precipitation. Supporting readings use 13px text, and the compass is 36px wide.
The main temperature and its unit stay together on one line, centered vertically
beside the supporting readings. Its size reserves room for the unit and adapts to
the number's length so negative and three-digit readings stay in their column.

Set `dashboardUrl` in `freshwdl.config.json` to the full dashboard's location.
It defaults to `./` (the same directory's index page). If you rename the dashboard
HTML file, use e.g. `"dashboardUrl": "./weather.html"`. Relative paths resolve
against the embed page's URL; an absolute URL also works. This is separate from
`siteUrl`, which controls the dashboard's brand link.

```html
<iframe
  src="https://weather.example.com/embed.html?theme=light"
  title="Current weather"
  width="268"
  height="268"
  style="border: 0; background: transparent;"
></iframe>
```

For a responsive square, place the iframe inside a sized wrapper:

```html
<div style="width: 100%; max-width: 360px; aspect-ratio: 1;">
  <iframe
    src="https://weather.example.com/embed.html?theme=dark"
    title="Current weather"
    style="display: block; width: 100%; height: 100%; border: 0; background: transparent;"
  ></iframe>
</div>
```

Replace the example URL with your deployment URL, including its subdirectory if
applicable. `theme=light` (the default) uses dark text for light host backgrounds;
`theme=dark` uses light text for dark backgrounds. `theme=system` follows the
iframe's browser color-scheme preference. Explicit unsupported theme values show
an error. Transparency reveals the host background; it does not inherit the host
page's CSS, fonts, or automatically detect its background. Choose a matching
theme, and do not disable scrolling: expanded error details may need extra room.

The embed uses the same `freshwdl.config.json`, locale, units, feeds, and live
refresh interval as the dashboard, but never reads or changes saved dashboard
preferences. Fixture mode remains a static sample. Healthy readings have no
timestamp; stale readings show a compact updated-time warning, escalating to
danger at twice `staleAfterMs`. Fetch failures retain any last readings and show
Retry alongside an expandable error message (expanded initially if no readings
are available).

The embedding site's CSP must allow this URL in `frame-src`. Your weather host
must also permit the parent site through its `frame-ancestors` CSP and any
`X-Frame-Options` policy; application code cannot override those HTTP headers.

## Releases

Push a semantic version tag to publish a GitHub release containing the production
bundle as both a ZIP and a tarball:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The release workflow runs the tests and production build before packaging `dist/`.
Normal pushes to `master` and pull requests run the same validation through CI,
but do not create a release.
