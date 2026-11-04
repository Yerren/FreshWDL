// @vitest-environment jsdom
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from './config'
import { parseFeeds } from './data/parser'
import type { AppConfig, WeatherData, WindUnit } from './domain'
import { EmbedView, embedTheme } from './embed-ui'
import { AppStore } from './store'
import { wind } from './units'

let sample: WeatherData
let view: EmbedView

beforeAll(async () => {
  const [current, extra, hourly, daily] = await Promise.all(
    ['clientraw.txt', 'clientrawextra.txt', 'clientrawhour.txt', 'clientrawdaily.txt'].map(async (name) =>
      (await readFile(resolve('public/fixtures', name), 'utf8')).trim().split(/\s+/),
    ),
  )
  sample = {
    ...parseFeeds({ current, extra, hourly, daily, receivedAt: new Date(2026, 10, 3, 14, 8, 33) }),
    temperature: -8.5,
    apparentTemperature: -12.7,
    temperatureHigh: 3.2,
    temperatureLow: -9.1,
    windSpeed: 10,
    windDirection: 225,
    windDirectionText: 'SW',
  }
})

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(sample.updatedAt)
})

afterEach(() => {
  view?.destroy()
  document.body.replaceChildren()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function mount(data: WeatherData | null = sample, config: Partial<AppConfig> = {}) {
  const root = document.createElement('div')
  document.body.append(root)
  const store = new AppStore({ ...defaultConfig, locale: 'en', ...config }, {
    persistPreferences: false,
    theme: 'light',
  })
  if (data) store.updated(data)
  const retry = vi.fn()
  view = new EmbedView(root, store, retry)
  view.render()
  const status = root.querySelector<HTMLElement>('.embed__status')!
  const main = root.querySelector<HTMLElement>('main')!
  return { root, store, retry, status, main }
}

describe('compact readings', () => {
  it('shows only requested readings with station daily extremes rather than history extrema', () => {
    const { root, status } = mount()
    expect(root.querySelector('.embed__current')?.textContent).toBe('-8.5°C')
    expect(root.querySelector('.embed__felt')?.textContent).toBe('Feels like -12.7 °C')
    expect(root.querySelector('.embed__extremes')?.textContent).toBe('High 3.2 °CLow -9.1 °C')
    expect(root.querySelector('.embed__extremes')?.getAttribute('aria-label')).toBe('Today')
    expect(root.querySelector('.embed__speed')?.textContent).toBe('5.1m/s')
    expect(root.querySelector('.embed__direction')?.textContent).toBe('SW 225°')
    expect(root.querySelector('.embed__wind svg g')?.getAttribute('transform')).toBe('rotate(225.0 50 50)')
    expect(root.querySelector('.embed__wind svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(root.querySelector('main')?.getAttribute('aria-label')).toBe('Current conditions')
    expect(status.hidden).toBe(true)
    expect(root.querySelector('header, dialog, button, .chart-card')).toBeNull()
    expect(root.querySelectorAll('a')).toHaveLength(1)
    expect(root.textContent).not.toContain(defaultConfig.stationName)
  })

  it('opens the full dashboard in a new tab with an accessible external link', () => {
    const { root } = mount()
    const link = root.querySelector<HTMLAnchorElement>('.embed__external')!
    expect(link.href).toBe(new URL('./', document.baseURI).href)
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
    expect(link.getAttribute('aria-label')).toBe('Open full weather dashboard in a new tab')
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(link.closest('.embed__headline')?.querySelector('.embed__current')).toBe(root.querySelector('.embed__current'))
  })

  it('keeps the wind readout before its supporting compass', () => {
    const { root } = mount()
    const breeze = root.querySelector('.embed__wind')!
    expect(breeze.firstElementChild?.className).toBe('embed__wind-readout')
    expect(breeze.lastElementChild?.tagName.toLowerCase()).toBe('svg')
  })

  it.each([
    './weather.html',
    '../station/live.html',
    'https://weather.example/custom.html',
  ])('links to configured dashboard %s rather than the brand URL', (dashboardUrl) => {
    const { root, store } = mount(sample, { dashboardUrl, siteUrl: 'https://example.com/' })
    const expected = new URL(dashboardUrl, document.baseURI).href
    expect(root.querySelector<HTMLAnchorElement>('.embed__external')?.href).toBe(expected)
    store.updated({ ...sample, temperature: 10 })
    expect(root.querySelector<HTMLAnchorElement>('.embed__external')?.href).toBe(expected)
  })

  it('uses configured Fahrenheit and Norwegian labels', () => {
    const { root } = mount(sample, {
      locale: 'nb',
      units: { ...defaultConfig.units, temperature: 'fahrenheit' },
    })
    expect(root.querySelector('.embed__current')?.textContent).toBe('16.7°F')
    expect(root.querySelector('.embed__felt')?.textContent).toBe('Føles som 9.1 °F')
    expect(root.querySelector('.embed__extremes')?.textContent).toBe('Høy 37.8 °FLav 15.6 °F')
    expect(document.documentElement.lang).toBe('nb')
  })

  it.each<WindUnit>(['ms', 'kmh', 'mph', 'kts', 'B'])('uses configured %s wind units', (unit) => {
    const { root } = mount(sample, { units: { ...defaultConfig.units, wind: unit } })
    const formatted = wind(sample.windSpeed, unit)
    expect(root.querySelector('.embed__speed')?.textContent).toBe(`${formatted.value}${formatted.unit}`)
  })

  it('renders changed weather without adding unrelated readings', () => {
    const { root, store } = mount()
    store.updated({ ...sample, temperature: 0, windSpeed: 0, windDirection: 0, windDirectionText: 'N' })
    expect(root.querySelector('.embed__current')?.textContent).toBe('0.0°C')
    expect(root.querySelector('.embed__speed')?.textContent).toBe('0.0m/s')
    expect(root.querySelector('.embed__wind svg g')?.getAttribute('transform')).toBe('rotate(0.0 50 50)')
  })
})

describe('embed appearance and preference isolation', () => {
  it.each(['light', 'dark', 'system'] as const)('accepts explicit %s theme', (theme) => {
    expect(embedTheme(new URLSearchParams({ theme }))).toBe(theme)
    const store = new AppStore(defaultConfig, { persistPreferences: false, theme })
    expect(store.state.theme).toBe(theme)
    expect(document.documentElement.dataset.theme).toBe(theme === 'system' ? undefined : theme)
    expect(document.documentElement.style.colorScheme).toBe(theme === 'system' ? 'light dark' : theme)
  })

  it('defaults to light and rejects invalid explicit values', () => {
    expect(embedTheme(new URLSearchParams())).toBe('light')
    expect(() => embedTheme(new URLSearchParams('theme=unknown'))).toThrow('Unsupported embed theme')
    expect(() => embedTheme(new URLSearchParams('theme='))).toThrow('Unsupported embed theme')
  })

  it('never accesses storage, even if iframe storage is blocked', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
    const { root, store } = mount()
    expect(root.querySelector('.embed__current')?.textContent).toBe('-8.5°C')
    store.setTheme('dark')
    store.setUnit('temperature', 'fahrenheit')
    expect(get).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })

  it('ignores saved dashboard preferences without changing them or dashboard defaults', () => {
    localStorage.setItem('freshwdl-v2-theme', 'dark')
    localStorage.setItem('freshwdl-v2-units', JSON.stringify({ temperature: 'fahrenheit' }))
    const { store } = mount()
    expect(store.state.theme).toBe('light')
    expect(store.state.units.temperature).toBe('celsius')
    store.setTheme('system')
    store.setUnit('temperature', 'celsius')
    const dashboard = new AppStore(defaultConfig)
    expect(dashboard.state.theme).toBe('dark')
    expect(dashboard.state.units.temperature).toBe('fahrenheit')
  })
})

describe('compact data states', () => {
  it('shows loading, initial failure with details, retry and recovery', () => {
    const { root, store, retry } = mount(null)
    expect(root.textContent).toContain('Reading the station')
    expect(root.querySelector('.embed__external')).not.toBeNull()
    store.failed(new Error('current feed request failed (503)'))
    expect(root.querySelector('details')?.open).toBe(true)
    expect(root.textContent).toContain('Weather data unavailable')
    expect(root.textContent).toContain('current feed request failed (503)')
    root.querySelector<HTMLButtonElement>('button')?.click()
    expect(retry).toHaveBeenCalledOnce()
    store.loading()
    expect(root.textContent).toContain('Reading the station')
    expect(root.querySelector('button')).toBeNull()
    store.updated(sample)
    expect(root.querySelector<HTMLElement>('.embed__status')?.hidden).toBe(true)
  })

  it('retains cached readings on failure with expandable error and keyboard retry', () => {
    const { root, store, retry } = mount()
    store.failed(new Error('Network unavailable'))
    expect(root.querySelector('.embed__current')?.textContent).toBe('-8.5°C')
    expect(root.querySelector('details')?.open).toBe(false)
    expect(root.querySelector('summary')?.textContent).toBe('Showing the last successful update')
    expect(root.textContent).toContain('Network unavailable')
    root.querySelector<HTMLButtonElement>('button')?.click()
    expect(retry).toHaveBeenCalledOnce()
    store.updated(sample)
    expect(root.querySelector<HTMLElement>('.embed__status')?.hidden).toBe(true)
  })

  it('keeps focus and expanded error details intact during status ticks', () => {
    const { root, store } = mount()
    store.failed(new Error('Offline'))
    const details = root.querySelector('details')!
    const retry = root.querySelector<HTMLButtonElement>('button')!
    details.open = true
    retry.focus()
    vi.advanceTimersByTime(15_000)
    expect(root.querySelector('details')).toBe(details)
    expect(details.open).toBe(true)
    expect(document.activeElement).toBe(retry)
  })

  it.each([
    [59_999, 'fresh', true],
    [60_000, 'warning', false],
    [119_999, 'warning', false],
    [120_000, 'danger', false],
  ] as const)('marks %s ms old data as %s', (age, freshness, hidden) => {
    vi.setSystemTime(sample.updatedAt.getTime() + age)
    const { status, main } = mount(sample, { staleAfterMs: 60_000 })
    expect(main.dataset.freshness).toBe(freshness)
    expect(status.hidden).toBe(hidden)
    if (!hidden) expect(status.querySelector('time')?.dateTime).toBe(sample.updatedAt.toISOString())
  })

  it('ages and recovers after a timestamp-only update without redrawing weather', () => {
    const { root, store, status, main } = mount(sample, { staleAfterMs: 60_000 })
    const compass = root.querySelector('.embed__wind svg')
    vi.advanceTimersByTime(60_000)
    expect(main.dataset.freshness).toBe('warning')
    vi.advanceTimersByTime(60_000)
    expect(main.dataset.freshness).toBe('danger')
    store.updated({ ...sample, updatedAt: new Date() })
    vi.advanceTimersByTime(15_000)
    expect(main.dataset.freshness).toBe('fresh')
    expect(status.hidden).toBe(true)
    expect(root.querySelector('.embed__wind svg')).toBe(compass)
  })

  it('cleans up the status timer and store subscription', () => {
    const { root, store } = mount()
    const text = root.textContent
    view.destroy()
    store.updated({ ...sample, temperature: 99 })
    vi.advanceTimersByTime(defaultConfig.staleAfterMs * 2)
    expect(root.textContent).toBe(text)
    expect(root.querySelector<HTMLElement>('.embed__status')?.hidden).toBe(true)
  })
})
