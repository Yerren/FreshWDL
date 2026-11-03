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
    store.updated(weather({
      updatedAt: new Date('2026-11-03T14:00:05Z'),
      stationTime: '14:00:05',
    }))
    expect(changes).toBe(1)
    expect(store.state.data).toBe(first)
    expect(store.state.lastSuccessfulUpdate).toBe(first.updatedAt)

    store.updated(weather({ temperature: 21 }))
    expect(changes).toBe(2)
    expect(store.state.data?.temperature).toBe(21)
  })
})