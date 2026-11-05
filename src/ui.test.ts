// @vitest-environment jsdom
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from './config'
import { parseFeeds } from './data/parser'
import type { AppConfig, Locale, WeatherData } from './domain'
import { AppStore } from './store'
import { AppView } from './ui'

vi.mock('./charts', () => ({ drawSeries: vi.fn() }))

let sample: WeatherData

beforeAll(async () => {
  const [current, extra, hourly, daily] = await Promise.all(
    ['clientraw.txt', 'clientrawextra.txt', 'clientrawhour.txt', 'clientrawdaily.txt'].map(async (name) =>
      (await readFile(resolve('public/fixtures', name), 'utf8')).trim().split(/\s+/),
    ),
  )
  const weather = parseFeeds({ current, extra, hourly, daily, receivedAt: new Date(2026, 10, 3, 14, 8, 33) })
  sample = {
    ...weather,
    temperature: 8.5,
    apparentTemperature: 5.7,
    history: {
      ...weather.history,
      temperature: [{ label: '00:00', value: 4.2 }, { label: '12:00', value: 8.4 }],
    },
  }
})

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(sample.updatedAt)
})

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

function mount(
  data: WeatherData = sample,
  locale: Locale = 'nb',
  config: Partial<AppConfig> = {},
): { root: HTMLElement; store: AppStore; retry: () => void } {
  const root = document.createElement('div')
  document.body.append(root)
  const store = new AppStore({ ...defaultConfig, ...config, locale })
  store.updated(data)
  const retry = vi.fn()
  const view = new AppView(root, store, retry)
  view.render()
  return { root, store, retry }
}

function card(root: HTMLElement, index = 1): HTMLButtonElement {
  const node = root.querySelector<HTMLButtonElement>(`.kpis .kpi:nth-child(${index})`)
  if (!node) throw new Error(`Missing KPI card ${index}`)
  return node
}

function captions(root: HTMLElement, index = 1): string[] {
  return Array.from(card(root, index).querySelectorAll('.kpi__caption'), (node) => node.textContent)
}

describe('configured overview', () => {
  it('renders reordered metrics, starts with the first card and selects matching charts', () => {
    const { root, store } = mount(sample, 'en', {
      overview: ['pressure', 'temperature', 'humidity', 'windSpeed'],
    })
    expect(Array.from(root.querySelectorAll('.kpi__label'), (node) => node.textContent))
      .toEqual(['Pressure', 'Temperature', 'Humidity', 'Wind'])
    expect(card(root).getAttribute('aria-selected')).toBe('true')
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Pressure')
    expect(captions(root)[0]).toContain('Trend')
    store.setUnit('pressure', 'kPa')
    expect(card(root).querySelector('.kpi__value')?.textContent).toContain('kPa')
    card(root, 2).click()
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Temperature')
    expect(card(root, 2).getAttribute('aria-selected')).toBe('true')
  })

  it('supports solar, UV and wind direction alongside precipitation', () => {
    const { root } = mount(sample, 'en', {
      overview: ['solar', 'uv', 'windDirection', 'rainfall'],
    })
    expect(Array.from(root.querySelectorAll('.kpi__label'), (node) => node.textContent))
      .toEqual(['Solar', 'UV index', 'Wind · Direction', 'Precipitation'])
    expect(card(root).querySelector('.kpi__value')?.textContent).toBe(`${sample.solar.toFixed(0)}W/m²`)
    expect(card(root, 2).querySelector('.kpi__value')?.textContent).toBe(sample.uv.toFixed(1))
    expect(captions(root, 3)).toEqual([sample.windDirectionText])
    card(root, 3).click()
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Wind · Direction')
  })

  it('retains readings with disabled graphs but selects the first enabled configured chart', () => {
    const { root } = mount(sample, 'en', {
      overview: ['pressure', 'humidity', 'windSpeed', 'temperature'],
      graphs: { ...defaultConfig.graphs, barometer: false },
    })
    expect(card(root).disabled).toBe(true)
    expect(card(root).querySelector('.kpi__value')?.textContent).toContain('hPa')
    expect(card(root, 2).getAttribute('aria-selected')).toBe('true')
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Humidity')
    card(root).click()
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Humidity')
  })

  it('honors solar and UV widget visibility for chart selection without replacing configured readings', () => {
    const { root } = mount(sample, 'en', {
      overview: ['solar', 'uv', 'windDirection', 'pressure'],
      widgets: { ...defaultConfig.widgets, solar: false, uv: false },
    })
    expect(card(root).disabled).toBe(true)
    expect(card(root, 2).disabled).toBe(true)
    expect(card(root, 3).getAttribute('aria-selected')).toBe('true')
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Wind · Direction')
  })

  it('does not draw a disabled series when every graph is disabled', () => {
    const { root } = mount(sample, 'en', {
      graphs: {
        barometer: false, humidity: false, solar: false, temperature: false,
        uv: false, windDirection: false, windSpeed: false, rainfall: false,
      },
    })
    expect(root.querySelectorAll('.kpi:disabled')).toHaveLength(4)
    expect(root.querySelector('.chart-card .empty')?.textContent).toBe('No readings in this feed')
    expect(root.querySelector('.chart-card .chart')).toBeNull()
  })
})

describe('rainfall card', () => {
  it.each([
    ['nb', 'Nedbør', 'Siste 24 timer', 'I dag 1.0 mm'],
    ['en', 'Precipitation', 'Last 24 hours', 'Today 1.0 mm'],
  ] as const)('replaces pressure while keeping four blocks in %s', (locale, label, period, today) => {
    const { root } = mount({ ...sample, rainDay: 1 }, locale)
    expect(root.querySelectorAll('.kpi')).toHaveLength(4)
    expect(card(root, 4).querySelector('.kpi__label')?.textContent).toBe(label)
    expect(card(root, 4).querySelector('.kpi__value')?.textContent).toBe('1.5mm')
    expect(captions(root, 4)).toEqual([period, today])
    card(root, 4).click()
    expect(card(root, 4).getAttribute('aria-selected')).toBe('true')
    expect(root.querySelector('.chart-card h2')?.textContent).toBe(label)
    expect(root.querySelector('option[value="pressure"]')).not.toBeNull()
    const picker = root.querySelector<HTMLSelectElement>('.chart-card select')!
    picker.value = 'pressure'
    picker.dispatchEvent(new Event('change'))
    expect(root.querySelector('.chart-card h2')?.textContent).toBe(locale === 'nb' ? 'Lufttrykk' : 'Pressure')
  })

  it('updates rainfall totals and respects selected units', () => {
    const { root, store } = mount()
    store.updated({ ...sample, history: { ...sample.history, rainfall: [{ label: '10:00', value: 25.4 }] } })
    store.setUnit('rainfall', 'inch')
    expect(card(root, 4).querySelector('.kpi__value')?.textContent).toBe('1.00in')
    store.updated({ ...sample, history: { ...sample.history, rainfall: [] } })
    expect(card(root, 4).querySelector('.kpi__value')?.textContent).toBe('—in')
  })
})

describe('temperature card', () => {
  it.each([
    ['nb', 'Føles som 5.7 °C', 'Høy 8.4 °C · Lav 4.2 °C'],
    ['en', 'Feels like 5.7 °C', 'High 8.4 °C · Low 4.2 °C'],
  ] as const)('shows feels like and preserves high and low in %s', (locale, apparent, highLow) => {
    const { root } = mount(sample, locale)
    expect(card(root).querySelector('.kpi__value')?.textContent).toBe('8.5°C')
    expect(captions(root)).toEqual([apparent, highLow])
  })

  describe('data freshness', () => {
    const threshold = 7_200_000

    it.each([
      [0, 'fresh', false],
      [threshold - 1, 'fresh', false],
      [threshold, 'warning', false],
      [threshold * 2 - 1, 'warning', false],
      [threshold * 2, 'danger', false],
      [86_400_000, 'danger', true],
    ] as const)('shows %s ms old data as %s', (age, freshness, hidden) => {
      vi.setSystemTime(sample.updatedAt.getTime() + age)
      const { root } = mount()
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe(freshness)
      expect(root.querySelector<HTMLElement>('.notice')?.dataset.freshness).toBe(freshness)
      expect(root.querySelector<HTMLElement>('.notice')?.hidden).toBe(freshness === 'fresh')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(hidden)
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(!hidden)
      expect(root.querySelector('.sky__facts')?.textContent).toContain('09:11')
    })

    it('honors a custom stale threshold', () => {
      vi.setSystemTime(sample.updatedAt.getTime() + 60_000)
      const { root } = mount(sample, 'en', { staleAfterMs: 60_000 })
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('warning')
      expect(root.querySelector<HTMLElement>('.notice')?.hidden).toBe(false)
      expect(root.querySelector<HTMLElement>('.notice')?.dataset.freshness).toBe('warning')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)

      vi.advanceTimersByTime(59_999)
      expect(root.querySelector<HTMLElement>('.notice')?.dataset.freshness).toBe('warning')
      vi.advanceTimersByTime(1)
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('danger')
      expect(root.querySelector<HTMLElement>('.notice')?.dataset.freshness).toBe('danger')
    })

    it('ages into warning and danger without a new reading or a dashboard redraw', () => {
      vi.setSystemTime(sample.updatedAt.getTime() + threshold - 15_000)
      const { root } = mount(sample, 'nb', { dataMode: 'live' })
      const chart = root.querySelector('.chart-card')
      const notice = root.querySelector<HTMLElement>('.notice')
      expect(notice?.hidden).toBe(true)

      vi.advanceTimersByTime(15_000)
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('warning')
      expect(notice?.hidden).toBe(false)
      expect(notice?.dataset.freshness).toBe('warning')
      expect(notice?.querySelector('.notice__detail')?.textContent).toContain('Vi ser automatisk etter nye målinger.')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(true)

      vi.advanceTimersByTime(threshold)
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('danger')
      expect(notice?.dataset.freshness).toBe('danger')
      expect(notice?.querySelector('button, a')).toBeNull()
      expect(root.querySelector('.notice')).toBe(notice)
      expect(root.querySelector('.chart-card')).toBe(chart)
    })

    it('recovers when a newer station timestamp arrives without changed weather values', () => {
      vi.setSystemTime(sample.updatedAt.getTime() + 86_400_000)
      const { root, store } = mount()
      const chart = root.querySelector('.chart-card')
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('danger')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(true)

      const updatedAt = new Date()
      store.updated({ ...sample, updatedAt, stationTime: '18:00:00' })
      vi.advanceTimersByTime(15_000)

      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('fresh')
      expect(root.querySelector<HTMLElement>('.notice')?.hidden).toBe(true)
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
      expect(root.querySelector('.sky__now-label')?.textContent).toBe('Nå 14:08')
      expect(root.querySelector('.sky__facts')?.textContent).toContain('Solnedgang')
      expect(root.querySelector('.stamp__time')?.getAttribute('datetime')).toBe(updatedAt.toISOString())
      expect(root.querySelector('.chart-card')).toBe(chart)
    })

    it.each([
      ['en', 'Weather data is out of date', 'Conditions may have changed since the last reading. We check for new readings automatically.'],
      ['nb', 'Værdataene er utdaterte', 'Været kan ha endret seg siden siste måling. Vi ser automatisk etter nye målinger.'],
    ] as const)('explains stale live readings and automatic checks in %s', (locale, title, detail) => {
      vi.setSystemTime(sample.updatedAt.getTime() + threshold)
      const { root, retry } = mount(sample, locale, { dataMode: 'live' })
      expect(root.querySelector('.notice')?.getAttribute('role')).toBe('status')
      expect(root.querySelector('.notice__title')?.textContent).toBe(title)
      expect(root.querySelector('.notice__detail')?.textContent).toBe(detail)
      expect(root.querySelector('.notice button, .notice a')).toBeNull()
      expect(retry).not.toHaveBeenCalled()
    })

    it.each([
      ['en', 'Conditions may have changed since the last reading. Sample data is not updated automatically.'],
      ['nb', 'Været kan ha endret seg siden siste måling. Eksempeldata oppdateres ikke automatisk.'],
    ] as const)('does not claim static sample readings update automatically in %s', (locale, detail) => {
      vi.setSystemTime(sample.updatedAt.getTime() + threshold)
      const { root, store, retry } = mount(sample, locale, { dataMode: 'fixtures' })
      expect(root.querySelector('.notice__detail')?.textContent).toBe(detail)
      expect(root.querySelector('.notice button, .notice a')).toBeNull()

      store.failed(new Error('Station request timed out'))
      expect(root.querySelector('.notice__detail')?.textContent).toBe(detail)
      root.querySelector<HTMLButtonElement>('.notice button')?.click()
      expect(retry).toHaveBeenCalledOnce()
    })

    it.each([0, threshold, threshold * 2])('keeps fetch failures in one notice at age %s', (age) => {
      vi.setSystemTime(sample.updatedAt.getTime() + age)
      const { root, store, retry } = mount(sample, 'en', { dataMode: 'live' })
      store.failed(new Error('Station request timed out'))
      expect(root.querySelectorAll('.notice')).toHaveLength(1)
      expect(root.querySelector<HTMLElement>('.notice')?.hidden).toBe(false)
      expect(root.querySelector('.notice__title')?.textContent).toBe(
        age === 0 ? 'Showing the last successful update' : 'Weather data is out of date',
      )
      expect(root.querySelector('.notice__error')?.textContent).toBe('Station request timed out')
      expect(root.querySelector('.notice__detail')?.textContent).toContain('We check for new readings automatically.')
      const button = root.querySelector<HTMLButtonElement>('.notice button')
      expect(button?.textContent).toBe('Retry')
      button?.click()
      expect(retry).toHaveBeenCalledOnce()

      store.updated(sample)
      expect(root.querySelector('.notice__error')).toBeNull()
      expect(root.querySelector<HTMLElement>('.notice')?.hidden).toBe(age === 0)
      expect(root.querySelector('.notice button')).toBeNull()
    })

    it('does not repeat live-region messages on each freshness tick', () => {
      vi.setSystemTime(sample.updatedAt.getTime() + threshold)
      const { root } = mount()
      const title = root.querySelector('.notice__title')?.firstChild
      const detail = root.querySelector('.notice__detail')?.firstChild
      vi.advanceTimersByTime(15_000)
      expect(root.querySelector('.notice__title')?.firstChild).toBe(title)
      expect(root.querySelector('.notice__detail')?.firstChild).toBe(detail)
    })

    it.each(['loading', 'error'] as const)('keeps the first-run %s state without a stale notice', (status) => {
      const root = document.createElement('div')
      document.body.append(root)
      const store = new AppStore({ ...defaultConfig, locale: 'en' })
      if (status === 'error') store.failed(new Error('Station request timed out'))
      new AppView(root, store, () => {}).render()
      expect(root.querySelector('.notice')).toBeNull()
      expect(root.querySelector('.first-run h2')?.textContent).toBe(
        status === 'error' ? 'Weather data unavailable' : 'Reading the station…',
      )
    })

    it('uses the live clock even when the station clock is unavailable', () => {
      const { root } = mount({ ...sample, stationTime: '' })
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
      expect(root.querySelector('.sky__now-label')?.textContent).toBe('Nå 14:08')
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(true)
    })

    it('shows real time and advances the marker and event countdowns without redrawing weather charts', () => {
      vi.setSystemTime(new Date(2026, 10, 3, 15, 30, 45))
      const { root } = mount()
      const chart = root.querySelector('.chart-card')
      expect(root.querySelector('.sky__now-label')?.textContent).toBe('Nå 15:30')
      expect(root.querySelector<HTMLElement>('.sky__now')?.style.getPropertyValue('--at')).toBe('64.583%')
      expect(root.querySelector('.sky__facts')?.textContent).toContain('om 1 h 38 min')

      vi.advanceTimersByTime(15_000)

      expect(root.querySelector('.sky__now-label')?.textContent).toBe('Nå 15:31')
      expect(root.querySelector<HTMLElement>('.sky__now')?.style.getPropertyValue('--at')).toBe('64.653%')
      expect(root.querySelector('.sky')?.getAttribute('aria-description')).toBe('Nå 15:31')
      expect(root.querySelector('.sky__facts')?.textContent).toContain('om 1 h 37 min')
      expect(root.querySelector('.chart-card')).toBe(chart)
    })

    it('keeps the marker for very old readings from today', () => {
      vi.setSystemTime(new Date(2026, 10, 3, 23, 59))
      const { root } = mount({ ...sample, updatedAt: new Date(2026, 10, 3, 0, 1) })
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('danger')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
      expect(root.querySelector('.sky__now-label')?.textContent).toBe('Nå 23:59')
    })

    it('hides the marker and stops countdowns at midnight even while the reading is fresh', () => {
      const updatedAt = new Date(2026, 10, 3, 23, 59, 45)
      vi.setSystemTime(updatedAt)
      const { root } = mount({ ...sample, updatedAt })
      const chart = root.querySelector('.chart-card')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)

      vi.advanceTimersByTime(15_000)

      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('fresh')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(true)
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(false)
      expect(root.querySelector('.sky__facts .kv__row:first-child .kv__when')).toBeNull()
      expect(root.querySelector('.sky__facts')?.textContent).toContain('09:11 – 17:08')
      expect(root.querySelector('.chart-card')).toBe(chart)
    })

    it.each([
      new Date(2026, 10, 2, 23, 59),
      new Date(2026, 9, 3, 14, 8),
      new Date(2025, 10, 3, 14, 8),
      new Date(2026, 10, 4, 0, 1),
    ])('hides the marker for a different calendar date: %s', (updatedAt) => {
      const { root } = mount({ ...sample, updatedAt })
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(true)
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(false)
    })
  })

  it('uses the selected temperature unit for every temperature', () => {
    const { root, store } = mount()
    store.setUnit('temperature', 'fahrenheit')

    expect(card(root).querySelector('.kpi__value')?.textContent).toBe('47.3°F')
    expect(captions(root)).toEqual(['Føles som 42.3 °F', 'Høy 47.1 °F · Lav 39.6 °F'])
  })

  it('updates the displayed reading, including zero and missing values', () => {
    const { root, store } = mount()
    store.updated({ ...sample, apparentTemperature: 0 })
    expect(captions(root)[0]).toBe('Føles som 0.0 °C')

    store.updated({ ...sample, apparentTemperature: Number.NaN })
    expect(captions(root)[0]).toBe('Føles som — °C')
  })

  it('retains the reading when switching chart tabs', () => {
    const { root } = mount(sample, 'en')
    card(root, 2).click()

    expect(card(root).getAttribute('aria-selected')).toBe('false')
    expect(card(root, 2).getAttribute('aria-selected')).toBe('true')
    expect(root.querySelector('.chart-card h2')?.textContent).toBe('Wind')
    expect(captions(root)[0]).toBe('Feels like 5.7 °C')
  })

  it('does not place the temperature in the humidity card when humidity history is empty', () => {
    const { root } = mount({ ...sample, history: { ...sample.history, humidity: [] } })
    expect(captions(root)[0]).toBe('Føles som 5.7 °C')
    expect(captions(root, 3)).toEqual([])
  })
})
