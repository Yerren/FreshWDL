import type { HistoryPoint } from './domain'

export function last24HoursRain(points: readonly HistoryPoint[]): number {
  // WD's 24-hour rain history is cumulative; summing its samples counts rain repeatedly.
  return points.at(-1)?.value ?? Number.NaN
}
