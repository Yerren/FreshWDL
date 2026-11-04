import { describe, expect, it } from 'vitest'
import { defaultConfig, mergeConfig } from './config'

describe('configuration', () => {
  it('uses safe defaults for invalid input', () => {
    expect(mergeConfig(null)).toEqual(defaultConfig)
    expect(mergeConfig({ pollingIntervalMs: 20 })).toMatchObject({
      pollingIntervalMs: 30000,
    })
    expect(mergeConfig({ pollingIntervalMs: 60_000 })).toMatchObject({
      pollingIntervalMs: 60_000,
    })
    expect(mergeConfig({ siteName: '   ' })).toMatchObject({ siteName: 'FreshWDL' })
  })

  it('accepts direct raw-feed configuration', () => {
    const config = mergeConfig({
      stationName: 'My station',
      siteName: 'My brand',
      siteUrl: 'https://example.com/', // taste-skill-ignore: the reserved example domain, correct in a unit test
      dataMode: 'live',
      baseUrl: 'https://weather.example/data/',
      feedFiles: { current: 'raw.txt' },
      units: { temperature: 'fahrenheit', wind: 'mph' },
    })
    expect(config).toMatchObject({
      stationName: 'My station',
      siteName: 'My brand',
      siteUrl: 'https://example.com/', // taste-skill-ignore: the reserved example domain, correct in a unit test
      dataMode: 'live',
      baseUrl: 'https://weather.example/data/',
      feedFiles: { current: 'raw.txt' },
      units: { temperature: 'fahrenheit', wind: 'mph' },
    })
  })

  it('defaults the stale threshold to two hours and accepts an override', () => {
    expect(defaultConfig.staleAfterMs).toBe(7_200_000)
    expect(mergeConfig({}).staleAfterMs).toBe(7_200_000)
    expect(mergeConfig({ staleAfterMs: 3_600_000 }).staleAfterMs).toBe(3_600_000)
    for (const staleAfterMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, '7200000']) {
      expect(mergeConfig({ staleAfterMs }).staleAfterMs).toBe(7_200_000)
    }
  })

  it('accepts a separate dashboard URL and preserves the directory default', () => {
    expect(mergeConfig({}).dashboardUrl).toBe('./')
    expect(mergeConfig({ dashboardUrl: ' ./weather.html ' }).dashboardUrl).toBe('./weather.html')
    expect(mergeConfig({ dashboardUrl: 'https://weather.example/live.html' }).dashboardUrl)
      .toBe('https://weather.example/live.html')
    expect(mergeConfig({ siteUrl: 'https://example.com/' }).dashboardUrl).toBe('./')
    for (const dashboardUrl of ['', '   ', null, 123]) {
      expect(mergeConfig({ dashboardUrl }).dashboardUrl).toBe('./')
    }
  })
})
