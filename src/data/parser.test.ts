import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { FeedBundle } from '../domain'
import { compassPoint, parseFeeds } from './parser'

const fixtures = fileURLToPath(new URL('../../public/fixtures/', import.meta.url))

async function values(name: string): Promise<string[]> {
  return (await readFile(`${fixtures}${name}`, 'utf8')).trim().split(/\s+/)
}

async function bundle(): Promise<FeedBundle> {
  const [current, extra, hourly, daily] = await Promise.all([
    values('clientraw.txt'),
    values('clientrawextra.txt'),
    values('clientrawhour.txt'),
    values('clientrawdaily.txt'),
  ])
  return {
    current,
    extra,
    hourly,
    daily,
    receivedAt: new Date('2026-11-03T14:00:00Z'),
  }
}

describe('Weather Display parser', () => {
  it('parses untouched raw clientraw fixtures into named values', async () => {
    const weather = parseFeeds(await bundle())
    expect(weather.temperature).toBeTypeOf('number')
    expect(weather.pressure).toBeGreaterThan(900)
    expect(weather.forecast).not.toContain('_')
    expect(weather.history.temperature).toHaveLength(24)
    expect(weather.records.month).toHaveLength(17)
    expect(weather.sunrise).toMatch(/^\d{2}:\d{2}$/)
    expect(weather.moonrise).toMatch(/^\d{2}:\d{2}$/)
    expect(weather.moonAge).toBeGreaterThanOrEqual(0)
  })

  it('stamps the reading with the station clock, not the fetch', async () => {
    const feeds = await bundle()
    const current = [...feeds.current]
    const received = new Date(2026, 10, 3, 14, 0, 0)
    current[29] = '13'
    current[30] = '45'
    current[31] = '30'
    const weather = parseFeeds({ ...feeds, current, receivedAt: received })
    expect(weather.updatedAt).toEqual(new Date(2026, 10, 3, 13, 45, 30))
    expect(weather.stationTime).toBe('13:45:30')
  })

  it('uses the station date for a reading from the previous day', async () => {
    const feeds = await bundle()
    const current = [...feeds.current]
    const received = new Date(2026, 10, 3, 0, 5, 0)
    current[29] = '23'
    current[30] = '58'
    current[31] = '00'
    current[35] = '2'
    const weather = parseFeeds({ ...feeds, current, receivedAt: received })
    expect(weather.updatedAt).toEqual(new Date(2026, 10, 2, 23, 58, 0))
  })

  it('does not make a frozen feed from yesterday fresh after a reload', async () => {
    const feeds = await bundle()
    const received = new Date(2026, 10, 4, 7, 0, 0)
    expect(parseFeeds({ ...feeds, receivedAt: received }).updatedAt).toEqual(
      new Date(2026, 10, 3, 14, 8, 33),
    )
  })

  it('uses numeric date fields rather than guessing the display date format', async () => {
    const feeds = await bundle()
    const current = [...feeds.current]
    current[35] = '31'
    current[36] = '12'
    current[141] = '2025'
    current[74] = '12/31/2025'
    expect(parseFeeds({ ...feeds, current }).updatedAt).toEqual(new Date(2025, 11, 31, 14, 8, 33))
  })

  it('places the clock on the fetch day when the station date is unusable', async () => {
    const feeds = await bundle()
    const current = [...feeds.current]
    current[35] = '31'
    current[36] = '2'
    const received = new Date(2026, 10, 4, 15, 0, 0)
    expect(parseFeeds({ ...feeds, current, receivedAt: received }).updatedAt).toEqual(
      new Date(2026, 10, 4, 14, 8, 33),
    )
    current[29] = '23'
    current[30] = '58'
    current[31] = '00'
    const justAfterMidnight = new Date(2026, 10, 4, 0, 5, 0)
    expect(parseFeeds({ ...feeds, current, receivedAt: justAfterMidnight }).updatedAt).toEqual(
      new Date(2026, 10, 3, 23, 58, 0),
    )
  })

  it('falls back to the fetch when the station clock runs ahead or is unusable', async () => {
    const feeds = await bundle()
    const received = new Date(2026, 10, 3, 14, 0, 0)
    const ahead = [...feeds.current]
    ahead[29] = '15'
    ahead[30] = '00'
    ahead[31] = '00'
    expect(parseFeeds({ ...feeds, current: ahead, receivedAt: received }).updatedAt).toEqual(received)

    const broken = [...feeds.current]
    broken[29] = '--'
    expect(parseFeeds({ ...feeds, current: broken, receivedAt: received }).updatedAt).toEqual(received)
  })

  it('rejects a truncated feed with field context', async () => {
    const feeds = await bundle()
    expect(() => parseFeeds({ ...feeds, current: ['12345'] })).toThrow(
      'current feed is truncated',
    )
  })

  it('normalizes compass headings', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(90)).toBe('E')
    expect(compassPoint(225)).toBe('SW')
    expect(compassPoint(360)).toBe('N')
  })
})
