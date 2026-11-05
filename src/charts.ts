import './vendor-charts.js'
import type { HistoryPoint } from './domain'

interface LineOptions {
  labels: string[]
  series: { name: string; values: (number | null)[] }[]
  format?: (value: number) => string
  tickFormat?: (value: number) => string
  height?: number | (() => number)
  min?: number
  max?: number
  yTicks?: number[]
  endLabel?: boolean
  annotations?: { at: number; label: string }[]
}

interface BarOptions {
  labels: string[]
  tickLabels?: string[]
  values: number[]
  format?: (value: number) => string
  height?: number | (() => number)
}

interface ChartsApi {
  line(el: HTMLElement, options: LineOptions): { legend: HTMLElement | null }
  bars(el: HTMLElement, options: BarOptions): void
  ticks(min: number, max: number, count?: number): number[]
}

declare global {
  interface Window {
    Charts: ChartsApi
  }
}

/** Charts are 160–200px tall on a phone and taller where there is room. */
const chartHeight = (): number => (window.innerWidth < 700 ? 180 : 300)

export interface SeriesView {
  name: string
  points: HistoryPoint[]
  format: (value: number) => string
  kind: 'line' | 'bars'
  tickLabels?: string[]
  min?: number
  max?: number
  yTicks?: number[]
}

export function drawSeries(target: HTMLElement, view: SeriesView): void {
  const labels = view.points.map((point) => point.label)
  const values = view.points.map((point) => point.value)
  if (view.kind === 'bars') {
    window.Charts.bars(target, {
      labels,
      tickLabels: view.tickLabels,
      values,
      format: view.format,
      height: chartHeight,
    })
    return
  }
  window.Charts.line(target, {
    labels,
    series: [{ name: view.name, values }],
    format: view.format,
    height: chartHeight,
    min: view.min,
    max: view.max,
    yTicks: view.yTicks,
    endLabel: true,
  })
}
