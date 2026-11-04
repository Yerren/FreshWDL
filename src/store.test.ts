// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { WeatherData } from './domain'
import { defaultConfig } from './config'
import { AppStore } from './store'

function weather(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    updatedAt: new Date('2026-11-03T14:00:00Z'),
    stationTime: '14:00:00',
    temperature: 20,
    ...overrides,
  } as WeatherData
}

describe('weather polling updates', () => {
  it('keeps the existing view quiet unless weather content changes', () => {
    const store = new AppStore(defaultConfig)
    let changes = 0
    store.addEventListener('change', () => changes++)

    store.loading()
    expect(changes).toBe(0)

    const first = weather()
    store.updated(first)
    expect(changes).toBe(1)

    store.loading()
    const next = weather({
      updatedAt: new Date('2026-11-03T14:00:05Z'),
      stationTime: '14:00:05',
    })
    store.updated(next)
    expect(changes).toBe(1)
    expect(store.state.data).toBe(next)
    expect(store.state.lastSuccessfulUpdate).toBe(next.updatedAt)

    store.updated(weather({ temperature: 21 }))
    expect(changes).toBe(2)
    expect(store.state.data?.temperature).toBe(21)
  })

  it('does not make a frozen reading fresh just because it was fetched again', () => {
    const store = new AppStore(defaultConfig)
    const first = weather()
    store.updated(first)
    store.updated(weather())
    expect(store.state.lastSuccessfulUpdate).toEqual(first.updatedAt)
  })
})