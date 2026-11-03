import type {
  FeedBundle,
  HistoryPoint,
  WeatherData,
  WeatherRecord,
} from '../domain'

const minimumLengths = {
  current: 145,
  extra: 701,
  hourly: 674,
  daily: 430,
} as const

function assertLength(feed: keyof typeof minimumLengths, values: readonly string[]): void {
  if (values.length < minimumLengths[feed]) {
    throw new Error(
      `${feed} feed is truncated: expected at least ${minimumLengths[feed]} values, received ${values.length}`,
    )
  }
}

function numberAt(values: readonly string[], index: number, feed: string): number {
  const source = values[index]
  const value = source === '-' ? 0 : Number.parseFloat(source)
  if (!Number.isFinite(value)) {
    throw new Error(`${feed}[${index}] is not numeric: ${source ?? '<missing>'}`)
  }
  return value
}

function textAt(values: readonly string[], index: number): string {
  const value = values[index]
  return value === '---' || value === undefined ? '' : value.replaceAll('_', ' ')
}

function history(
  values: readonly string[],
  valueStart: number,
  labelStart: number,
  count: number,
  feed: string,
): HistoryPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    label: textAt(values, labelStart + index),
    value: numberAt(values, valueStart + index, feed),
  }))
}

function extraHistory(
  values: readonly string[],
  firstStart: number,
  splitStart: number,
): HistoryPoint[] {
  const first = history(values, firstStart, 459, 20, 'extra')
  const second = history(values, splitStart, 578, 4, 'extra')
  return [...first, ...second]
}

type RecordUnit = WeatherRecord['unit']

/**
 * The feed stamps a reading with the station's clock (fields 29-31) but no date and no
 * timezone, so the time of day is placed on the day the feed was fetched. A stamp far
 * ahead of the fetch belongs to the previous day (23:58 read just after midnight); a
 * stamp a little ahead is the station's clock running fast, or standing in another
 * timezone, and is read as "now" rather than as a day of staleness.
 */
function stationTimestamp(values: readonly string[], receivedAt: Date): Date {
  const parts = [29, 30, 31].map((index) => Number.parseInt(values[index] ?? '', 10))
  if (parts.some((part) => !Number.isFinite(part))) return receivedAt
  const [hours = 0, minutes = 0, seconds = 0] = parts
  if (hours > 23 || minutes > 59 || seconds > 59) return receivedAt

  const stamp = new Date(receivedAt)
  stamp.setHours(hours, minutes, seconds, 0)
  const ahead = stamp.getTime() - receivedAt.getTime()
  if (ahead > 14 * 60 * 60 * 1000) stamp.setDate(stamp.getDate() - 1)
  else if (ahead > 0) return receivedAt
  return stamp
}

function recordAt(
  values: readonly string[],
  index: number,
  label: string,
  unit: RecordUnit,
): WeatherRecord {
  const hour = textAt(values, index + 1).padStart(2, '0')
  const minute = textAt(values, index + 2).padStart(2, '0')
  const day = textAt(values, index + 3).padStart(2, '0')
  const month = textAt(values, index + 4).padStart(2, '0')
  const year = textAt(values, index + 5)
  return {
    label,
    value: numberAt(values, index, 'extra'),
    unit,
    occurredAt: `${hour}:${minute} ${day}.${month}.${year}`,
  }
}

function records(values: readonly string[], start: number, secondaryStart: number): WeatherRecord[] {
  return [
    recordAt(values, start, 'Highest temperature', 'temperature'),
    recordAt(values, start + 6, 'Lowest temperature', 'temperature'),
    recordAt(values, start + 12, 'Highest gust', 'wind'),
    recordAt(values, start + 18, 'Highest rain rate', 'rainfall'),
    recordAt(values, start + 24, 'Lowest pressure', 'pressure'),
    recordAt(values, start + 30, 'Highest pressure', 'pressure'),
    recordAt(values, start + 36, 'Highest daily rain', 'rainfall'),
    recordAt(values, start + 42, 'Highest hourly rain', 'rainfall'),
    recordAt(values, start + 48, 'Highest average wind', 'wind'),
    recordAt(values, start + 72, 'Lowest wind chill', 'temperature'),
    recordAt(values, start + 90, 'Warmest day', 'temperature'),
    recordAt(values, start + 96, 'Coldest night', 'temperature'),
    recordAt(values, start + 102, 'Coldest day', 'temperature'),
    recordAt(values, start + 108, 'Warmest night', 'temperature'),
    recordAt(values, start + 114, 'Highest heat index', 'temperature'),
    recordAt(values, secondaryStart, 'Highest solar radiation', 'solar'),
    recordAt(values, secondaryStart + 6, 'Highest UV index', 'uv'),
  ]
}

export function parseFeeds(bundle: FeedBundle): WeatherData {
  assertLength('current', bundle.current)
  assertLength('extra', bundle.extra)
  assertLength('hourly', bundle.hourly)
  assertLength('daily', bundle.daily)

  const current = bundle.current
  const extra = bundle.extra

  return {
    updatedAt: stationTimestamp(current, bundle.receivedAt),
    stationTime: `${textAt(current, 29)}:${textAt(current, 30)}:${textAt(current, 31)}`,
    stationDate: textAt(current, 74),
    forecast: textAt(extra, 531),
    condition: textAt(current, 49),
    windSpeed: numberAt(current, 1, 'current'),
    windGust: numberAt(current, 2, 'current'),
    windDirection: numberAt(current, 3, 'current'),
    temperature: numberAt(current, 4, 'current'),
    humidity: numberAt(current, 5, 'current'),
    pressure: numberAt(current, 6, 'current'),
    rainDay: numberAt(current, 7, 'current'),
    rainMonth: numberAt(current, 8, 'current'),
    rainYear: numberAt(current, 9, 'current'),
    rainRate: numberAt(current, 10, 'current'),
    indoorTemperature: numberAt(current, 12, 'current'),
    indoorHumidity: numberAt(current, 13, 'current'),
    solar: numberAt(current, 34, 'current'),
    windChill: numberAt(current, 44, 'current'),
    temperatureHigh: numberAt(current, 46, 'current'),
    temperatureLow: numberAt(current, 47, 'current'),
    pressureTrend: numberAt(current, 50, 'current'),
    uv: numberAt(current, 79, 'current'),
    apparentTemperature: numberAt(current, 130, 'current'),
    windDirectionText: compassPoint(numberAt(current, 3, 'current')),
    sunrise: textAt(extra, 556),
    sunset: textAt(extra, 557),
    moonrise: textAt(extra, 558),
    moonset: textAt(extra, 559),
    moonAge: numberAt(extra, 561, 'extra'),
    moonPhase: `${textAt(extra, 560)}%`,
    history: {
      windSpeed: extraHistory(extra, 1, 562),
      temperature: extraHistory(extra, 21, 566),
      rainfall: extraHistory(extra, 41, 570),
      pressure: extraHistory(extra, 439, 574),
      solar: extraHistory(extra, 491, 582),
      uv: extraHistory(extra, 511, 586),
      windDirection: extraHistory(extra, 536, 590),
      humidity: extraHistory(extra, 611, 630),
    },
    records: {
      month: records(extra, 61, 660),
      year: records(extra, 187, 672),
      allTime: records(extra, 313, 684),
    },
  }
}

export function compassPoint(degrees: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
  const normalized = ((degrees % 360) + 360) % 360
  return points[Math.round(normalized / 45) % points.length]
}
