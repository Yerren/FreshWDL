import { describe, expect, it } from 'vitest'
import { last24HoursRain } from './rain'

describe('24-hour rainfall', () => {
  it('uses the final cumulative sample without summing or subtracting earlier readings', () => {
    expect(last24HoursRain([
      { label: '11:00', value: 2 },
      { label: '12:00', value: 3 },
      { label: '10:00', value: 8.5 },
    ])).toBe(8.5)
  })

  it('preserves zero rainfall', () => {
    expect(last24HoursRain([{ label: '10:00', value: 0 }])).toBe(0)
  })

  it('keeps absent or invalid latest readings missing instead of using an older total', () => {
    expect(last24HoursRain([])).toBeNaN()
    expect(last24HoursRain([
      { label: '09:00', value: 4 },
      { label: '10:00', value: Number.NaN },
    ])).toBeNaN()
  })
})
