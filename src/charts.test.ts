// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { drawSeries } from './charts'

afterEach(() => document.body.replaceChildren())

describe('bar chart interval labels', () => {
  it('uses compact axis labels but retains exact intervals in tooltips and accessibility', () => {
    const target = document.createElement('div')
    document.body.append(target)
    drawSeries(target, {
      name: 'Precipitation',
      kind: 'bars',
      points: [
        { label: '13:30–14:30', value: 0.5 },
        { label: '14:30–15:30', value: 0 },
      ],
      tickLabels: ['13:00', '14:00'],
      format: (value) => `${value.toFixed(1)} mm`,
    })
    const labels = Array.from(target.querySelectorAll('text'), (node) => node.textContent)
    expect(labels).toContain('13:00')
    expect(labels).toContain('14:00')
    expect(labels).not.toContain('13:30–14:30')
    expect(Array.from(target.querySelectorAll('rect title'), (node) => node.textContent))
      .toEqual(['13:30–14:30: 0.5 mm', '14:30–15:30: 0.0 mm'])
    expect(target.querySelector('svg')?.getAttribute('aria-label'))
      .toContain('13:30–14:30 to 14:30–15:30')
    expect(target.querySelector('rect')?.getAttribute('height')).not.toBe('0')
    expect(target.querySelectorAll('rect')[1]?.getAttribute('height')).toBe('0')
  })

  it('preserves ordinary bar labels when compact labels are not supplied', () => {
    const target = document.createElement('div')
    document.body.append(target)
    drawSeries(target, {
      name: 'Precipitation',
      kind: 'bars',
      points: [{ label: '13:00–14:00', value: 0 }],
      format: (value) => `${value} mm`,
    })
    expect(Array.from(target.querySelectorAll('text'), (node) => node.textContent))
      .toContain('13:00–14:00')
    expect(target.querySelector('[height="NaN"]')).toBeNull()
  })
})
