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
): { root: HTMLElement; store: AppStore } {
  const root = document.createElement('div')
  document.body.append(root)
  const store = new AppStore({ ...defaultConfig, ...config, locale })
  store.updated(data)
  const view = new AppView(root, store, () => {})
  view.render()
  return { root, store }
}

function card(root: HTMLElement, index = 1): HTMLButtonElement {
  const node = root.querySelector<HTMLButtonElement>(`.kpis .kpi:nth-child(${index})`)
  if (!node) throw new Error(`Missing KPI card ${index}`)
  return node
}

function captions(root: HTMLElement, index = 1): string[] {
  return Array.from(card(root, index).querySelectorAll('.kpi__caption'), (node) => node.textContent)
}

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
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(hidden)
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(!hidden)
      expect(root.querySelector('.sky__facts')?.textContent).toContain('09:11')
    })

    it('honors a custom stale threshold', () => {
      vi.setSystemTime(sample.updatedAt.getTime() + 60_000)
      const { root } = mount(sample, 'en', { staleAfterMs: 60_000 })
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('warning')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
    })

    it('ages into warning and danger without a new reading or a dashboard redraw', () => {
      vi.setSystemTime(sample.updatedAt.getTime() + threshold - 15_000)
      const { root } = mount()
      const chart = root.querySelector('.chart-card')

      vi.advanceTimersByTime(15_000)
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('warning')
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
      expect(root.querySelector('.sky')?.hasAttribute('aria-description')).toBe(true)

      vi.advanceTimersByTime(threshold)
      expect(root.querySelector<HTMLElement>('.stamp')?.dataset.freshness).toBe('danger')
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
      expect(root.querySelector<HTMLElement>('.sky__now')?.hidden).toBe(false)
      expect(root.querySelector('.sky__now-label')?.textContent).toBe('Nå 14:08')
      expect(root.querySelector('.sky__facts')?.textContent).toContain('Solnedgang')
      expect(root.querySelector('.stamp__time')?.getAttribute('datetime')).toBe(updatedAt.toISOString())
      expect(root.querySelector('.chart-card')).toBe(chart)
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
