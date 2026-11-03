import { describe, expect, it } from 'vitest'
import { beaufort, pressure, rainfall, temperature, wind } from './units'

describe('unit conversion', () => {
  it('converts temperatures', () => {
    expect(temperature(10, 'celsius')).toEqual({ value: '10.0', unit: '°C' })
    expect(temperature(10, 'fahrenheit')).toEqual({ value: '50.0', unit: '°F' })
  })

  it('matches legacy pressure, wind, and rainfall factors', () => {
    expect(pressure(1000, 'inHg')).toEqual({ value: '29.53', unit: 'inHg' })
    expect(wind(10, 'ms')).toEqual({ value: '5.1', unit: 'm/s' })
    expect(rainfall(25.4, 'inch')).toEqual({ value: '1.00', unit: 'in' })
  })

  it('caps Beaufort values at force 12', () => {
    expect(beaufort(0)).toBe(0)
    expect(beaufort(70)).toBe(12)
  })
})
