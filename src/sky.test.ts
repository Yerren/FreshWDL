import { describe, expect, it } from 'vitest'
import { bodyState, clock, minutesOf, moonState, upSpans } from './sky'

describe('sky', () => {
  it('reads clock times and rejects anything else', () => {
    expect(minutesOf('09:11')).toBe(551)
    expect(minutesOf('14:08:33')).toBe(848)
    expect(minutesOf('24:00')).toBe(0)
    expect(minutesOf('--')).toBeNull()
    expect(clock(848)).toBe('14:08')
  })

  it('splits a span that crosses midnight', () => {
    expect(upSpans(551, 1028)).toEqual([[551, 1028]])
    expect(upSpans(1200, 300)).toEqual([
      [0, 300],
      [1200, 1440],
    ])
    expect(upSpans(600, 600)).toEqual([])
  })

  it('says whether a body is up and what comes next', () => {
    expect(bodyState(551, 1028, 848)).toEqual({ up: true, next: 1028, until: 180 })
    expect(bodyState(551, 1028, 1200)).toEqual({ up: false, next: 551, until: 791 })
    expect(bodyState(1200, 300, 60)).toEqual({ up: true, next: 300, until: 240 })
    expect(bodyState(1200, 300, 600)).toEqual({ up: false, next: 1200, until: 600 })
  })

  it('names the phase from the lit share and the direction from the age', () => {
    expect(moonState(23, 31.84)).toMatchObject({
      phase: 'waningCrescent',
      waxing: false,
      coming: { phase: 'newMoon', days: 7 },
    })
    expect(moonState(4, 20)?.phase).toBe('waxingCrescent')
    expect(moonState(7.4, 50)?.phase).toBe('firstQuarter')
    expect(moonState(11, 85)).toMatchObject({ phase: 'waxingGibbous', coming: { phase: 'fullMoon', days: 4 } })
    expect(moonState(14.6, 99.8)).toMatchObject({ phase: 'fullMoon', coming: { phase: 'newMoon', days: 15 } })
    expect(moonState(18, 85)?.phase).toBe('waningGibbous')
    expect(moonState(22, 51)?.phase).toBe('lastQuarter')
    expect(moonState(0.5, 1)).toMatchObject({ phase: 'newMoon', coming: { phase: 'fullMoon', days: 14 } })
    expect(moonState(Number.NaN, 50)).toBeNull()
  })
})
