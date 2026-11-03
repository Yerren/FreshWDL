import { describe, expect, it } from 'vitest'
import { relativeTime } from './time'

const now = new Date('2026-11-03T14:00:00Z')

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
