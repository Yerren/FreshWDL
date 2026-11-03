import {
  supportedLocales,
  type AppConfig,
  type Locale,
  type UnitPreferences,
} from './domain'

const defaultUnits: UnitPreferences = {
  temperature: 'celsius',
  pressure: 'hPa',
  wind: 'ms',
  rainfall: 'mm',
  altitude: 'm',
}

export const defaultConfig: AppConfig = {
  stationName: 'FreshWDL',
  siteName: 'FreshWDL',
  siteUrl: './',
  locale: 'nb',
  dataMode: 'fixtures',
  baseUrl: './',
  fixtureBaseUrl: './fixtures/',
  feedFiles: {
    current: 'clientraw.txt',
    extra: 'clientrawextra.txt',
    hourly: 'clientrawhour.txt',
    daily: 'clientrawdaily.txt',
  },
  pollingIntervalMs: 5_000,
  requestTimeoutMs: 8_000,
  staleAfterMs: 30_000,
  units: defaultUnits,
  widgets: {
    solar: true,
    uv: true,
    tooltips: true,
  },
  graphs: {
    barometer: true,
    humidity: true,
    solar: true,
    temperature: true,
    uv: true,
    windDirection: true,
    windSpeed: true,
    rainfall: true,
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function locale(value: unknown, fallback: Locale): Locale {
  if (typeof value === 'string' && supportedLocales.includes(value as Locale)) {
    return value as Locale
  }
  return fallback
}

function boundedNumber(value: unknown, fallback: number, minimum: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum
    ? value
    : fallback
}

export function mergeConfig(input: unknown): AppConfig {
  if (!isRecord(input)) return structuredClone(defaultConfig)

  const feedFiles = isRecord(input.feedFiles) ? input.feedFiles : {}
  const units = isRecord(input.units) ? input.units : {}
  const widgets = isRecord(input.widgets) ? input.widgets : {}
  const graphs = isRecord(input.graphs) ? input.graphs : {}

  return {
    ...defaultConfig,
    stationName:
      typeof input.stationName === 'string' && input.stationName.trim()
        ? input.stationName.trim()
        : defaultConfig.stationName,
    siteName:
      typeof input.siteName === 'string' && input.siteName.trim()
        ? input.siteName.trim()
        : defaultConfig.siteName,
    siteUrl:
      typeof input.siteUrl === 'string' && input.siteUrl.trim()
        ? input.siteUrl.trim()
        : defaultConfig.siteUrl,
    locale: locale(input.locale, defaultConfig.locale),
    dataMode: input.dataMode === 'live' ? 'live' : defaultConfig.dataMode,
    baseUrl: typeof input.baseUrl === 'string' ? input.baseUrl : defaultConfig.baseUrl,
    fixtureBaseUrl:
      typeof input.fixtureBaseUrl === 'string'
        ? input.fixtureBaseUrl
        : defaultConfig.fixtureBaseUrl,
    pollingIntervalMs: boundedNumber(
      input.pollingIntervalMs,
      defaultConfig.pollingIntervalMs,
      1_000,
    ),
    requestTimeoutMs: boundedNumber(
      input.requestTimeoutMs,
      defaultConfig.requestTimeoutMs,
      1_000,
    ),
    staleAfterMs: boundedNumber(input.staleAfterMs, defaultConfig.staleAfterMs, 5_000),
    feedFiles: {
      current:
        typeof feedFiles.current === 'string'
          ? feedFiles.current
          : defaultConfig.feedFiles.current,
      extra:
        typeof feedFiles.extra === 'string' ? feedFiles.extra : defaultConfig.feedFiles.extra,
      hourly:
        typeof feedFiles.hourly === 'string'
          ? feedFiles.hourly
          : defaultConfig.feedFiles.hourly,
      daily:
        typeof feedFiles.daily === 'string' ? feedFiles.daily : defaultConfig.feedFiles.daily,
    },
    units: {
      temperature:
        units.temperature === 'fahrenheit' ? 'fahrenheit' : defaultUnits.temperature,
      pressure:
        units.pressure === 'mmHg' ||
        units.pressure === 'kPa' ||
        units.pressure === 'inHg' ||
        units.pressure === 'mb'
          ? units.pressure
          : defaultUnits.pressure,
      wind:
        units.wind === 'kmh' ||
        units.wind === 'mph' ||
        units.wind === 'kts' ||
        units.wind === 'B'
          ? units.wind
          : defaultUnits.wind,
      rainfall: units.rainfall === 'inch' ? 'inch' : defaultUnits.rainfall,
      altitude:
        units.altitude === 'yds' || units.altitude === 'ft'
          ? units.altitude
          : defaultUnits.altitude,
    },
    widgets: {
      solar: typeof widgets.solar === 'boolean' ? widgets.solar : defaultConfig.widgets.solar,
      uv: typeof widgets.uv === 'boolean' ? widgets.uv : defaultConfig.widgets.uv,
      tooltips:
        typeof widgets.tooltips === 'boolean'
          ? widgets.tooltips
          : defaultConfig.widgets.tooltips,
    },
    graphs: {
      ...defaultConfig.graphs,
      ...Object.fromEntries(
        Object.entries(graphs).filter((entry): entry is [string, boolean] => {
          return typeof entry[1] === 'boolean' && entry[0] in defaultConfig.graphs
        }),
      ),
    },
  }
}

export async function loadConfig(url = './freshwdl.config.json'): Promise<AppConfig> {
  const response = await fetch(url, { cache: 'no-store' })
  if (response.status === 404) return structuredClone(defaultConfig)
  if (!response.ok) throw new Error(`Configuration request failed (${response.status})`)
  return mergeConfig(await response.json())
}
