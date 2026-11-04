// @vitest-environment jsdom
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from './config'
import { parseFeeds } from './data/parser'
import type { Locale, WeatherData } from './domain'
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
  const weather = parseFeeds({ current, extra, hourly, daily, receivedAt: new Date('2026-11-03T14:00:00Z') })
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
})

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

function mount(data: WeatherData = sample, locale: Locale = 'nb'): { root: HTMLElement; store: AppStore } {
  const root = document.createElement('div')
  document.body.append(root)
  const store = new AppStore({ ...defaultConfig, locale })
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
