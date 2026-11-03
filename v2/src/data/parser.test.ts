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
