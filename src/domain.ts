export const supportedLocales = [
  'en',
  'nl',
  'da',
  'ro',
  'fr',
  'gr',
  'it',
  'es',
  'nb',
  'bg',
  'cs',
  'fi',
  'si',
  'de',
  'pt',
  'sv',
  'ca',
  'hr',
] as const

export type Locale = (typeof supportedLocales)[number]
export type FeedName = 'current' | 'extra' | 'hourly' | 'daily'
export type DataStatus = 'loading' | 'ready' | 'stale' | 'error'
export type ThemeMode = 'system' | 'light' | 'dark'
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type PressureUnit = 'hPa' | 'mmHg' | 'kPa' | 'inHg' | 'mb'
export type WindUnit = 'kmh' | 'mph' | 'kts' | 'ms' | 'B'
export type RainUnit = 'mm' | 'inch'
export type AltitudeUnit = 'm' | 'yds' | 'ft'
export const overviewMetrics = [
  'temperature', 'windSpeed', 'humidity', 'rainfall', 'pressure', 'solar', 'uv', 'windDirection',
] as const
export type OverviewMetric = (typeof overviewMetrics)[number]
export type OverviewLayout = [OverviewMetric, OverviewMetric, OverviewMetric, OverviewMetric]

export interface UnitPreferences {
  temperature: TemperatureUnit
  pressure: PressureUnit
  wind: WindUnit
  rainfall: RainUnit
  altitude: AltitudeUnit
}

export interface FeedFiles {
  current: string
  extra: string
  hourly: string
  daily: string
}

export interface WidgetSettings {
  solar: boolean
  uv: boolean
  tooltips: boolean
}

export interface GraphSettings {
  barometer: boolean
  humidity: boolean
  solar: boolean
  temperature: boolean
  uv: boolean
  windDirection: boolean
  windSpeed: boolean
  rainfall: boolean
}

export interface AppConfig {
  stationName: string
  siteName: string
  siteUrl: string
  dashboardUrl: string
  locale: Locale
  dataMode: 'live' | 'fixtures'
  baseUrl: string
  fixtureBaseUrl: string
  feedFiles: FeedFiles
  pollingIntervalMs: number
  requestTimeoutMs: number
  staleAfterMs: number
  overview: OverviewLayout
  units: UnitPreferences
  widgets: WidgetSettings
  graphs: GraphSettings
}

export interface FeedBundle {
  current: readonly string[]
  extra: readonly string[]
  hourly: readonly string[]
  daily: readonly string[]
  receivedAt: Date
}

export interface HistoryPoint {
  label: string
  value: number
}

export interface WeatherRecord {
  label: string
  value: number
  unit: 'temperature' | 'pressure' | 'wind' | 'rainfall' | 'humidity' | 'solar' | 'uv'
  occurredAt?: string
}

export interface WeatherData {
  updatedAt: Date
  stationTime: string
  stationDate: string
  forecast: string
  condition: string
  temperature: number
  temperatureLow: number
  temperatureHigh: number
  apparentTemperature: number
  windChill: number
  indoorTemperature: number
  indoorHumidity: number
  humidity: number
  pressure: number
  pressureTrend: number
  windDirection: number
  windDirectionText: string
  windSpeed: number
  windGust: number
  rainRate: number
  rainDay: number
  rainMonth: number
  rainYear: number
  solar: number
  uv: number
  sunrise: string
  sunset: string
  moonrise: string
  moonset: string
  moonAge: number
  moonPhase: string
  history: {
    temperature: HistoryPoint[]
    pressure: HistoryPoint[]
    windSpeed: HistoryPoint[]
    rainfall: HistoryPoint[]
    humidity: HistoryPoint[]
    solar: HistoryPoint[]
    uv: HistoryPoint[]
    windDirection: HistoryPoint[]
  }
  records: {
    month: WeatherRecord[]
    year: WeatherRecord[]
    allTime: WeatherRecord[]
  }
}

export interface AppState {
  config: AppConfig
  units: UnitPreferences
  theme: ThemeMode
  status: DataStatus
  data: WeatherData | null
  error: string | null
  lastSuccessfulUpdate: Date | null
}
