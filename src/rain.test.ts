import { describe, expect, it, vi } from 'vitest'
import { last24HoursRain, rainIntervals } from './rain'

describe('24-hour rainfall', () => {
  it('uses the final cumulative sample without summing or subtracting earlier readings', () => {
    expect(last24HoursRain([
      { label: '11:00', value: 2 },
      { label: '12:00', value: 3 },
      { label: '10:00', value: 8.5 },
    ])).toBe(8.5)
  })

  describe('precipitation intervals', () => {
    it('subtracts cumulative readings, preserving dry periods and midnight continuity', () => {
      const points = [
        { label: '22:30', value: 2 },
        { label: '23:30', value: 3.2 },
        { label: '00:30', value: 3.2 },
        { label: '01:30', value: 5.7 },
      ]
      const intervals = rainIntervals(points)
      expect(intervals[0]!.value).toBeCloseTo(1.2)
      expect(intervals[1]!.value).toBe(0)
      expect(intervals[2]!.value).toBeCloseTo(2.5)
      expect(intervals.map((point) => point.label)).toEqual([
        '22:30–23:30', '23:30–00:30', '00:30–01:30',
      ])
      expect(intervals.map((point) => point.tickLabel)).toEqual(['22:00', '23:00', '00:00'])
      expect(points[0]!.value).toBe(2)
      expect(last24HoursRain(points)).toBe(5.7)
    })

    it('does not invent an amount for the first sample', () => {
      expect(rainIntervals([])).toEqual([])
      expect(rainIntervals([{ label: '13:10', value: 7 }])).toEqual([])
    })

    it('uses start-hour axis markers while preserving exact irregular intervals for hover', () => {
      const intervals = rainIntervals([
        { label: '08:28', value: 1.5 },
        { label: '13:01', value: 2 },
        { label: '13:30', value: 2.2 },
      ])
      expect(intervals.map((point) => point.tickLabel)).toEqual(['08:00', '13:00'])
      expect(intervals.map((point) => point.label)).toEqual(['08:28–13:01', '13:01–13:30'])
    })

    it('keeps the full multi-hour interval in the hover label', () => {
      expect(rainIntervals([
        { label: '08:30', value: 1.5 },
        { label: '13:30', value: 2 },
      ])[0]).toEqual({ label: '08:30–13:30', tickLabel: '08:00', value: 0.5 })
    })

    it('omits invalid or decreasing pairs with a warning and never bridges missing samples', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        expect(rainIntervals([
          { label: '08:30', value: 2 },
          { label: '09:30', value: Number.NaN },
          { label: '10:30', value: 4 },
          { label: '11:30', value: 1 },
          { label: '12:30', value: 1.5 },
        ])).toEqual([{ label: '11:30–12:30', tickLabel: '11:00', value: 0.5 }])
        expect(warn).toHaveBeenCalledTimes(3)
      } finally {
        warn.mockRestore()
      }
    })
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
