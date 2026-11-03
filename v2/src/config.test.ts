import { describe, expect, it } from 'vitest'
import { defaultConfig, mergeConfig } from './config'

describe('configuration', () => {
  it('uses safe defaults for invalid input', () => {
    expect(mergeConfig(null)).toEqual(defaultConfig)
    expect(mergeConfig({ pollingIntervalMs: 20 })).toMatchObject({
      pollingIntervalMs: 5000,
    })
    expect(mergeConfig({ siteName: '   ' })).toMatchObject({ siteName: 'FreshWDL' })
  })

  it('accepts direct raw-feed configuration', () => {
    const config = mergeConfig({
      stationName: 'My station',
      siteName: 'My brand',
      siteUrl: 'https://example.com/',
      dataMode: 'live',
      baseUrl: 'https://weather.example/data/',
      feedFiles: { current: 'raw.txt' },
      units: { temperature: 'fahrenheit', wind: 'mph' },
    })
    expect(config).toMatchObject({
      stationName: 'My station',
      siteName: 'My brand',
      siteUrl: 'https://example.com/',
      dataMode: 'live',
      baseUrl: 'https://weather.example/data/',
      feedFiles: { current: 'raw.txt' },
      units: { temperature: 'fahrenheit', wind: 'mph' },
    })
  })
})
