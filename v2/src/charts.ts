import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import type { HistoryPoint, UnitPreferences, WeatherData } from './domain'
import { pressure, rainfall, temperature, wind } from './units'

Chart.register(...registerables)

type GraphName = keyof WeatherData['history']

function converted(
  graph: GraphName,
  points: HistoryPoint[],
  units: UnitPreferences,
): { values: number[]; unit: string } {
  const format = {
    temperature: (value: number) => temperature(value, units.temperature),
    pressure: (value: number) => pressure(value, units.pressure),
    windSpeed: (value: number) => wind(value, units.wind),
    rainfall: (value: number) => rainfall(value, units.rainfall),
    humidity: (value: number) => ({ value: value.toFixed(0), unit: '%' }),
    solar: (value: number) => ({ value: value.toFixed(0), unit: 'W/m²' }),
    uv: (value: number) => ({ value: value.toFixed(1), unit: '' }),
    windDirection: (value: number) => ({ value: value.toFixed(0), unit: '°' }),
  }[graph]
  const formatted = points.map((point) => format(point.value))
  return {
    values: formatted.map((value) => Number.parseFloat(value.value)),
    unit: formatted[0]?.unit ?? '',
  }
}

export class ChartManager {
  #charts: Chart[] = []

  render(data: WeatherData, units: UnitPreferences): void {
    this.destroy()
    const styles = getComputedStyle(document.documentElement)
    const muted = styles.getPropertyValue('--muted').trim() || '#64748b'
    const grid = styles.getPropertyValue('--grid').trim() || '#e2e8f0'
    const colors: Record<GraphName, string> = {
      temperature: '#ef6c57',
      pressure: '#6256b3',
      windSpeed: '#0f766e',
      rainfall: '#3182ce',
      humidity: '#0891b2',
      solar: '#d97706',
      uv: '#9333ea',
      windDirection: '#475569',
    }
    const labels: Record<GraphName, string> = {
      temperature: 'Temperature',
      pressure: 'Pressure',
      windSpeed: 'Wind',
      rainfall: 'Rain',
      humidity: 'Humidity',
      solar: 'Solar',
      uv: 'UV',
      windDirection: 'Wind direction',
    }

    for (const graph of Object.keys(data.history) as GraphName[]) {
      const canvas = document.querySelector<HTMLCanvasElement>(`[data-chart="${graph}"]`)
      if (!canvas) continue
      const points = data.history[graph]
      const { values, unit } = converted(graph, points, units)
      const configuration: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: points.map((point) => point.label),
          datasets: [
            {
              label: `${labels[graph]} (${unit})`,
              data: values,
              borderColor: colors[graph],
              backgroundColor: `${colors[graph]}18`,
              borderWidth: 2,
              pointRadius: 0,
              pointHitRadius: 12,
              fill: true,
              tension: 0.28,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
          interaction: { intersect: false, mode: 'index' },
          scales: {
            x: {
              grid: { display: false },
              ticks: { maxTicksLimit: 6, color: muted },
            },
            y: {
              grid: { color: grid },
              ticks: { maxTicksLimit: 5, color: muted },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: { displayColors: false },
          },
        },
      }
      this.#charts.push(new Chart(canvas, configuration))
    }
  }

  destroy(): void {
    this.#charts.forEach((chart) => chart.destroy())
    this.#charts = []
  }
}
