import { describe, expect, it } from 'vitest'
import { dataFreshness, relativeTime } from './time'

const now = new Date('2026-11-03T14:00:00Z')

describe('data freshness', () => {
  const threshold = 7_200_000

  it.each([
    [-1, 'fresh'],
    [0, 'fresh'],
    [threshold - 1, 'fresh'],
    [threshold, 'warning'],
    [threshold * 2 - 1, 'warning'],
    [threshold * 2, 'danger'],
    [86_400_000, 'danger'],
  ] as const)('classifies a reading aged %i ms as %s', (age, expected) => {
    expect(dataFreshness(new Date(now.getTime() - age), threshold, now)).toBe(expected)
  })

  it('uses the configured threshold', () => {
    const reading = new Date(now.getTime() - 60_000)
    expect(dataFreshness(reading, 60_000, now)).toBe('warning')
    expect(dataFreshness(reading, 30_000, now)).toBe('danger')
  })
})

describe('relative update time', () => {
  it('selects useful units as data ages', () => {
    expect(relativeTime(new Date('2026-11-03T13:55:00Z'), 'en', now)).toBe('5 minutes ago')
    expect(relativeTime(new Date('2026-11-03T13:00:00Z'), 'en', now)).toBe('1 hour ago')
    expect(relativeTime(new Date('2026-11-01T14:00:00Z'), 'en', now)).toBe('2 days ago')
  })

  it('uses the selected locale', () => {
    expect(relativeTime(new Date('2026-11-03T13:55:00Z'), 'nb', now)).toContain('5 minutter')
  })
})
