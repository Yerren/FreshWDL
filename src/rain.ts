import type { HistoryPoint } from './domain'

export function last24HoursRain(points: readonly HistoryPoint[]): number {
  // WD's 24-hour rain history is cumulative; summing its samples counts rain repeatedly.
  return points.at(-1)?.value ?? Number.NaN
}

export interface RainInterval extends HistoryPoint {
  tickLabel: string
}

export function rainIntervals(points: readonly HistoryPoint[]): RainInterval[] {
  const intervals: RainInterval[] = []
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!
    const current = points[index]!
    const amount = current.value - previous.value
    if (!Number.isFinite(amount) || previous.value < 0 || current.value < 0 || amount < 0) {
      console.warn('FreshWDL omitted an invalid precipitation interval', previous, current)
      continue
    }
    const start = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(previous.label)
    const label = `${previous.label}–${current.label}`
    intervals.push({
      label,
      tickLabel: start ? `${start[1]!.padStart(2, '0')}:00` : previous.label,
      value: amount,
    })
  }
  return intervals
}
