import type {
  AppState,
  HistoryPoint,
  PressureUnit,
  RainUnit,
  TemperatureUnit,
  ThemeMode,
  UnitPreferences,
  WeatherData,
  WeatherRecord,
  WindUnit,
} from './domain'
import { translator, type MessageKey } from './i18n'
import { percent, pressure, rainfall, temperature, wind } from './units'
import type { AppStore } from './store'
import { drawSeries, type SeriesView } from './charts'
import { dataFreshness, relativeTime } from './time'
import { bodyState, clock, formatDuration, minutesOf, minutesUntil, moonState, upSpans, type MoonState } from './sky'
import { element, shape } from './dom'
import { windRose } from './wind-rose'

type Translate = (key: MessageKey) => string
type FormattedValue = ReturnType<typeof temperature>
type SeriesKey = keyof WeatherData['history']

const svgNamespace = 'http://www.w3.org/2000/svg'

function figure(value: FormattedValue): HTMLElement {
  const wrapper = element('span')
  wrapper.append(value.value)
  if (value.unit) wrapper.append(element('small', '', value.unit))
  return wrapper
}

function valueText(value: FormattedValue): string {
  return value.unit ? `${value.value} ${value.unit}` : value.value
}

function skyMinute(updatedAt: Date, now = new Date()): number | null {
  return updatedAt.toDateString() === now.toDateString() ? now.getHours() * 60 + now.getMinutes() : null
}

/** The station writes its forecast in lower case; the screen states it as a sentence. */
function sentence(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

/* The disc as seen from the northern hemisphere: lit on the right while waxing. */
function moonGlyph(moon: MoonState): SVGElement {
  const root = document.createElementNS(svgNamespace, 'svg')
  root.setAttribute('viewBox', '0 0 26 26')
  root.setAttribute('aria-hidden', 'true')
  const radius = 12
  shape('circle', { class: 'moon__disc', cx: 13, cy: 13, r: radius }, root)
  const terminator = Math.max(Math.abs(1 - 2 * moon.lit) * radius, 0.01)
  const gibbous = moon.lit > 0.5
  const outerSweep = moon.waxing ? 1 : 0
  const innerSweep = moon.waxing === gibbous ? 1 : 0
  shape(
    'path',
    {
      class: 'moon__lit',
      d:
        `M 13 ${13 - radius} A ${radius} ${radius} 0 0 ${outerSweep} 13 ${13 + radius}` +
        ` A ${terminator.toFixed(2)} ${radius} 0 0 ${innerSweep} 13 ${13 - radius} Z`,
    },
    root,
  )
  return root
}

/* The bearing drawn small, the same pointer as the rail's rose. */
function bearingArrow(degrees: number): SVGElement {
  const root = document.createElementNS(svgNamespace, 'svg')
  root.setAttribute('class', 'kpi__mark')
  root.setAttribute('viewBox', '0 0 24 24')
  root.setAttribute('aria-hidden', 'true')
  const needle = shape('g', { transform: `rotate(${degrees.toFixed(1)} 12 12)` }, root)
  shape('path', { d: 'M12 2.5 19 21 12 16.6 5 21Z' }, needle)
  return root
}

/** Converts a raw station reading into the reader's unit and keeps the formatting with it. */
function adapter(format: (value: number) => FormattedValue): {
  unit: string
  convert: (value: number) => number
  label: (value: number) => string
  tick: (value: number) => string
} {
  const sample = format(0)
  const digits = (sample.value.split('.')[1] ?? '').length
  return {
    unit: sample.unit,
    convert: (value) => Number(format(value).value),
    label: (value) => (sample.unit ? `${value.toFixed(digits)} ${sample.unit}` : value.toFixed(digits)),
    tick: (value) => value.toFixed(Math.min(digits, 1)),
  }
}

function seriesAdapters(units: UnitPreferences): Record<SeriesKey, ReturnType<typeof adapter>> {
  return {
    temperature: adapter((value) => temperature(value, units.temperature)),
    pressure: adapter((value) => pressure(value, units.pressure)),
    windSpeed: adapter((value) => wind(value, units.wind)),
    rainfall: adapter((value) => rainfall(value, units.rainfall)),
    humidity: adapter(percent),
    solar: adapter((value) => ({ value: value.toFixed(0), unit: 'W/m²' })),
    uv: adapter((value) => ({ value: value.toFixed(1), unit: '' })),
    windDirection: adapter((value) => ({ value: value.toFixed(0), unit: '°' })),
  }
}

function hasReadings(points: HistoryPoint[]): boolean {
  return points.some((point) => Number.isFinite(point.value))
}

function recordValue(record: WeatherRecord, units: UnitPreferences): string {
  const formatted = {
    temperature: () => temperature(record.value, units.temperature),
    pressure: () => pressure(record.value, units.pressure),
    wind: () => wind(record.value, units.wind),
    rainfall: () => rainfall(record.value, units.rainfall),
    humidity: () => percent(record.value),
    solar: () => ({ value: record.value.toFixed(0), unit: 'W/m²' }),
    uv: () => ({ value: record.value.toFixed(1), unit: '' }),
  }[record.unit]()
  return valueText(formatted)
}

function option(value: string, label: string, selected: boolean): HTMLOptionElement {
  const node = element('option', '', label)
  node.value = value
  node.selected = selected
  return node
}

function field<Value extends string>(
  label: string,
  values: readonly Value[],
  labels: readonly string[],
  selected: Value,
  dataset: Record<string, string>,
): HTMLLabelElement {
  const wrapper = element('label', 'field')
  wrapper.append(element('span', '', label))
  const select = element('select')
  Object.assign(select.dataset, dataset)
  values.forEach((value, index) => select.append(option(value, labels[index] ?? value, value === selected)))
  wrapper.append(select)
  return wrapper
}

export class AppView {
  readonly #root: HTMLElement
  readonly #store: AppStore
  readonly #retry: () => void
  #series: SeriesKey = 'temperature'

  constructor(root: HTMLElement, store: AppStore, retry: () => void) {
    this.#root = root
    this.#store = store
    this.#retry = retry
    this.#store.addEventListener('change', () => this.render())
    window.setInterval(() => this.#updateFreshness(), 15_000)
    window.addEventListener('scroll', () => this.#updateScroll(), { passive: true })
  }

  render(): void {
    const openDialog = this.#root.querySelector<HTMLDialogElement>('dialog[open]')?.dataset.dialog
    const state = this.#store.state
    const t = translator(state.config.locale)
    document.documentElement.lang = state.config.locale
    document.title = state.config.stationName

    this.#root.replaceChildren(this.#topbar(state, t), this.#column(state, t))
    this.#updateFreshness()
    this.#updateScroll()
    if (openDialog) {
      this.#root.querySelector<HTMLDialogElement>(`dialog[data-dialog="${openDialog}"]`)?.showModal()
    }
  }

  #topbar(state: Readonly<AppState>, t: Translate): HTMLElement {
    const bar = element('header', 'topbar')
    const inner = element('div', 'topbar__inner')
    const brand = element('a', 'brand', state.config.siteName)
    brand.href = state.config.siteUrl

    const cluster = element('div', 'topbar__cluster')
    const stamp = element('p', 'stamp')
    stamp.append(`${t('lastUpdated')} `)
    const relative = element('time', 'stamp__time', '—')
    stamp.append(relative)

    const settings = element('button', 'icon-button')
    settings.type = 'button'
    settings.setAttribute('aria-label', t('settings'))
    settings.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/>' +
      '<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>'
    const dialog = this.#settingsDialog(state, t)
    settings.addEventListener('click', () => dialog.showModal())

    cluster.append(stamp, settings)
    inner.append(brand, cluster)
    bar.append(inner, dialog)
    return bar
  }

  #column(state: Readonly<AppState>, t: Translate): HTMLElement {
    const column = element('main', 'column')
    const data = state.data

    const titleRow = element('div', 'title-row')
    const heading = element('div')
    heading.append(element('h1', '', state.config.stationName))
    const subline = data ? data.forecast || data.condition : ''
    if (subline) heading.append(element('p', 'finding', sentence(subline)))
    titleRow.append(heading)

    if (data) {
      const records = element('button', 'btn btn--primary', t('records'))
      records.type = 'button'
      const dialog = this.#recordsDialog(state, t)
      records.addEventListener('click', () => dialog.showModal())
      titleRow.append(records, dialog)
    }
    column.append(titleRow)

    if (!data) {
      column.append(this.#firstRun(state, t))
      return column
    }

    column.append(this.#staleNotice(state, t))

    const grid = element('div', 'grid')
    const main = element('div', 'main-col')
    main.append(this.#kpis(state, data, t), this.#chartCard(state, data, t), this.#todayCard(state, data, t))
    const rail = element('div', 'rail')
    rail.append(this.#windCard(state, data, t), this.#skyCard(data, t))
    grid.append(main, rail)
    column.append(grid)
    return column
  }

  #firstRun(state: Readonly<AppState>, t: Translate): HTMLElement {
    const panel = element('section', 'panel first-run')
    const body = element('div')
    if (state.status === 'error') {
      body.append(element('h2', '', t('dataError')), element('p', '', state.error ?? ''))
      const retry = element('button', 'btn', t('retry'))
      retry.type = 'button'
      retry.style.marginTop = '14px'
      retry.addEventListener('click', this.#retry)
      body.append(retry)
    } else {
      body.append(element('h2', '', t('loadingData')))
      const bar = element('p', 'skeleton')
      bar.style.height = '10px'
      bar.style.width = '180px'
      bar.style.marginTop = '12px'
      body.append(bar)
    }
    panel.append(body)
    return panel
  }

  #staleNotice(state: Readonly<AppState>, t: Translate): HTMLElement {
    const notice = element('div', 'notice')
    notice.setAttribute('role', 'status')
    notice.hidden = true
    const copy = element('div', 'notice__copy')
    copy.append(element('strong', 'notice__title'), element('p', 'notice__detail'))
    if (state.error) copy.append(element('p', 'notice__error', state.error))
    notice.append(copy)
    if (state.status === 'stale' || state.status === 'error') {
      const retry = element('button', 'link-button', t('retry'))
      retry.type = 'button'
      retry.addEventListener('click', this.#retry)
      notice.append(retry)
    }
    return notice
  }

  /* One container split by rules. The cells are also the chart's tabs. */
  #kpis(state: Readonly<AppState>, data: WeatherData, t: Translate): HTMLElement {
    const strip = element('div', 'kpis')
    strip.setAttribute('role', 'tablist')
    strip.setAttribute('aria-label', t('currentConditions'))
    const units = state.units
    const temperatures = data.history.temperature.map((point) => point.value)
    const humidities = data.history.humidity.map((point) => point.value)
    const low = temperatures.length ? Math.min(...temperatures) : data.temperatureLow
    const high = temperatures.length ? Math.max(...temperatures) : data.temperatureHigh
    const trend = pressure(data.pressureTrend, units.pressure)

    const cells: [SeriesKey, string, FormattedValue, string[], SVGElement?][] = [
      [
        'temperature',
        t('temperature'),
        temperature(data.temperature, units.temperature),
        [
          `${t('apparent')} ${valueText(temperature(data.apparentTemperature, units.temperature))}`,
          `${t('high')} ${valueText(temperature(high, units.temperature))} · ${t('low')} ${valueText(temperature(low, units.temperature))}`,
        ],
      ],
      [
        'windSpeed',
        t('wind'),
        wind(data.windSpeed, units.wind),
        [`${t('gust')} ${valueText(wind(data.windGust, units.wind))} · ${data.windDirectionText} ${data.windDirection.toFixed(0)}°`],
        bearingArrow(data.windDirection),
      ],
      [
        'humidity',
        t('humidity'),
        percent(data.humidity),
        humidities.length
          ? [`${t('last24Hours')} ${Math.min(...humidities).toFixed(0)}–${Math.max(...humidities).toFixed(0)} %`]
          : [],
      ],
      [
        'pressure',
        t('pressure'),
        pressure(data.pressure, units.pressure),
        [`${t('trend')} ${data.pressureTrend >= 0 ? '+' : '−'}${trend.value.replace('-', '')} ${trend.unit}`],
      ],
    ]

    for (const [key, label, value, captions, mark] of cells) {
      const selected = key === this.#series
      const cell = element('button', selected ? 'kpi kpi--lead' : 'kpi')
      cell.type = 'button'
      cell.setAttribute('role', 'tab')
      cell.setAttribute('aria-selected', String(selected))
      const amount = element('p', 'kpi__value')
      amount.append(figure(value))
      if (mark) amount.append(mark)
      cell.append(
        element('p', 'kpi__label', label),
        amount,
        ...captions.map((caption) => element('p', 'kpi__caption', caption)),
      )
      cell.addEventListener('click', () => this.#selectSeries(key))
      strip.append(cell)
    }
    return strip
  }

  #availableSeries(state: Readonly<AppState>, t: Translate): [SeriesKey, string][] {
    const graphs = state.config.graphs
    const all: [SeriesKey, string, boolean][] = [
      ['temperature', t('temperature'), graphs.temperature],
      ['windSpeed', t('wind'), graphs.windSpeed],
      ['humidity', t('humidity'), graphs.humidity],
      ['pressure', t('pressure'), graphs.barometer],
      ['rainfall', t('rain'), graphs.rainfall],
      ['solar', t('solar'), graphs.solar && state.config.widgets.solar],
      ['uv', t('uv'), graphs.uv && state.config.widgets.uv],
      ['windDirection', `${t('wind')} · ${t('windDirection')}`, graphs.windDirection],
    ]
    return all.filter(([, , enabled]) => enabled).map(([key, label]) => [key, label])
  }

  #chartCard(state: Readonly<AppState>, data: WeatherData, t: Translate): HTMLElement {
    const available = this.#availableSeries(state, t)
    if (available.length && !available.some(([key]) => key === this.#series)) {
      this.#series = available[0]![0]
    }
    const key = this.#series
    const units = seriesAdapters(state.units)[key]
    const label = available.find(([name]) => name === key)?.[1] ?? t('graphs')

    const panel = element('section', 'panel chart-card')
    const header = element('header')
    const heading = element('div')
    heading.append(element('h2', '', label))
    heading.append(element('p', 'meta', units.unit ? `${t('last24Hours')} · ${units.unit}` : t('last24Hours')))
    header.append(heading)

    if (available.length > 1) {
      const picker = element('select', 'select')
      picker.setAttribute('aria-label', t('series'))
      for (const [name, text] of available) picker.append(option(name, text, name === key))
      picker.addEventListener('change', () => this.#selectSeries(picker.value as SeriesKey))
      header.append(picker)
    }
    panel.append(header)

    const points = data.history[key]
    if (!hasReadings(points)) {
      panel.append(element('p', 'empty', t('noReadings')))
      return panel
    }

    const target = element('div', 'chart')
    panel.append(target)
    const view: SeriesView = {
      name: label,
      points: points.map((point) => ({ label: point.label, value: units.convert(point.value) })),
      format: units.label,
      kind: key === 'rainfall' ? 'bars' : 'line',
      min: key === 'humidity' || key === 'windDirection' ? 0 : undefined,
      yTicks: key === 'windDirection' ? [0, 90, 180, 270, 360] : undefined,
    }
    requestAnimationFrame(() => drawSeries(target, view))
    return panel
  }

  #todayCard(state: Readonly<AppState>, data: WeatherData, t: Translate): HTMLElement {
    const units = state.units
    const panel = element('section', 'panel')
    const header = element('header')
    header.append(element('h2', '', t('today')), element('p', 'meta', data.stationDate))
    panel.append(header)

    const rows: [string, FormattedValue][] = [
      [t('high'), temperature(data.temperatureHigh, units.temperature)],
      [t('low'), temperature(data.temperatureLow, units.temperature)],
      [t('apparent'), temperature(data.apparentTemperature, units.temperature)],
      [t('windChill'), temperature(data.windChill, units.temperature)],
      [t('gust'), wind(data.windGust, units.wind)],
      [t('rainDay'), rainfall(data.rainDay, units.rainfall)],
      [t('rainRate'), rainfall(data.rainRate, units.rainfall)],
      [t('rainMonth'), rainfall(data.rainMonth, units.rainfall)],
      [t('rainYear'), rainfall(data.rainYear, units.rainfall)],
    ]
    if (state.config.widgets.solar) rows.push([t('solar'), { value: data.solar.toFixed(0), unit: 'W/m²' }])
    if (state.config.widgets.uv) rows.push([t('uv'), { value: data.uv.toFixed(1), unit: '' }])

    const list = element('div', 'kv-split')
    const half = Math.ceil(rows.length / 2)
    for (const group of [rows.slice(0, half), rows.slice(half)]) {
      const column = element('div', 'kv')
      for (const [label, value] of group) {
        const row = element('div', 'kv__row')
        const amount = element('p', 'kv__value')
        amount.append(figure(value))
        row.append(element('p', 'kv__label', label), amount)
        column.append(row)
      }
      list.append(column)
    }
    panel.append(list)
    return panel
  }

  #railBlock(heading: string): { block: HTMLElement; panel: HTMLElement } {
    const block = element('section', 'rail__block')
    block.append(element('h2', '', heading))
    const panel = element('div', 'panel')
    block.append(panel)
    return { block, panel }
  }

  #windCard(state: Readonly<AppState>, data: WeatherData, t: Translate): HTMLElement {
    const { block, panel } = this.#railBlock(t('wind'))
    const row = element('div', 'rose')
    row.append(windRose(data.windDirection, data.windDirectionText))
    const readout = element('div', 'rose__readout')
    const speed = element('p', 'rose__value')
    speed.append(figure(wind(data.windSpeed, state.units.wind)))
    readout.append(
      speed,
      element('p', 'rose__sub', `${data.windDirectionText} · ${data.windDirection.toFixed(0)}°`),
      element('p', 'rose__sub', `${t('gust')} ${valueText(wind(data.windGust, state.units.wind))}`),
      element('p', 'rose__sub', `${t('windChill')} ${valueText(temperature(data.windChill, state.units.temperature))}`),
    )
    row.append(readout)
    panel.append(row)
    return block
  }

  /* The station's day on one 24-hour axis, with a live clock only while it is still today. */
  #skyCard(data: WeatherData, t: Translate, now = skyMinute(data.updatedAt)): HTMLElement {
    const { block, panel } = this.#railBlock(t('sunAndMoon'))
    block.dataset.skyMinute = String(now)
    const bodies = [
      { name: t('sun'), kind: 'sun', rise: data.sunrise, set: data.sunset, riseLabel: t('sunrise'), setLabel: t('sunset') },
      { name: t('moon'), kind: 'moon', rise: data.moonrise, set: data.moonset, riseLabel: t('moonrise'), setLabel: t('moonset') },
    ].map((body) => ({ ...body, from: minutesOf(body.rise), to: minutesOf(body.set) }))
    const at = (minutes: number): string => `${((minutes / 1440) * 100).toFixed(3)}%`

    const chart = element('div', 'sky')
    const plot = element('div', 'sky__plot')
    const spoken: string[] = []
    for (const body of bodies) {
      chart.append(element('p', 'sky__name', body.name))
      const lane = element('div', `sky__lane sky__lane--${body.kind}`)
      if (body.from !== null && body.to !== null) {
        for (const [from, to] of upSpans(body.from, body.to)) {
          const up = element('span', 'sky__up')
          up.style.left = at(from)
          up.style.width = at(to - from)
          lane.append(up)
        }
      }
      plot.append(lane)
      spoken.push(`${body.name} ${body.rise} – ${body.set}`)
    }
    const marker = element('div', 'sky__now')
    marker.hidden = true
    marker.append(element('span', 'sky__now-label'))
    plot.append(marker)
    const axis = element('div', 'sky__axis')
    for (const hour of [0, 6, 12, 18, 24]) {
      const mark = element('span', '', String(hour).padStart(2, '0'))
      mark.style.setProperty('--at', at(hour * 60))
      axis.append(mark)
    }
    plot.append(axis)
    chart.append(plot)
    chart.setAttribute('role', 'img')
    chart.setAttribute('aria-label', spoken.join(', '))
    panel.append(chart)

    const facts = element('div', 'kv sky__facts')
    const fact = (label: string | Node, value: string, when?: string): void => {
      const row = element('div', 'kv__row')
      const name = element('p', 'kv__label')
      name.append(label)
      const amount = element('p', 'kv__value', value)
      if (when) amount.append(element('small', 'kv__when', when))
      row.append(name, amount)
      facts.append(row)
    }
    const inTime = (minutes: number): string => t('minutesAway').replace('{d}', formatDuration(minutes))

    for (const body of bodies) {
      const state = body.from !== null && body.to !== null && now !== null ? bodyState(body.from, body.to, now) : null
      if (state) fact(state.up ? body.setLabel : body.riseLabel, clock(state.next), inTime(state.until))
      else fact(`${body.riseLabel} – ${body.setLabel}`, `${body.rise} – ${body.set}`)
      if (body.kind === 'sun') {
        const daylight = body.from !== null && body.to !== null ? formatDuration(minutesUntil(body.from, body.to)) : '—'
        fact(t('daylight'), daylight, `${body.rise} – ${body.set}`)
      }
    }

    const moon = moonState(data.moonAge, Number.parseFloat(data.moonPhase))
    if (moon) {
      const phase = element('span', 'sky__phase')
      phase.append(moonGlyph(moon), t(moon.phase))
      fact(phase, `${Math.round(moon.lit * 100)} % ${t('illuminated')}`)
      const days = moon.coming.days === 1 ? t('dayAway') : t('daysAway').replace('{n}', String(moon.coming.days))
      fact(t(moon.coming.phase), days)
    }
    panel.append(facts)
    return block
  }

  #selectSeries(key: SeriesKey): void {
    if (this.#series === key) return
    this.#series = key
    this.render()
  }

  #updateScroll(): void {
    const bar = this.#root.querySelector<HTMLElement>('.topbar')
    if (bar) bar.dataset.scrolled = String(window.scrollY > 2)
  }

  #updateFreshness(): void {
    const state = this.#store.state
    const timestamp = state.lastSuccessfulUpdate
    const output = this.#root.querySelector<HTMLTimeElement>('.stamp__time')
    if (!timestamp || !output) return
    const now = new Date()
    const freshness = dataFreshness(timestamp, state.config.staleAfterMs, now)
    output.textContent = relativeTime(timestamp, state.config.locale, now)
    output.dateTime = timestamp.toISOString()
    output.title = new Intl.DateTimeFormat(state.config.locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(timestamp)
    const stamp = output.closest<HTMLElement>('.stamp')
    if (stamp) stamp.dataset.freshness = freshness

    const notice = this.#root.querySelector<HTMLElement>('.notice')
    if (notice) {
      const failed = state.status === 'stale' || state.status === 'error'
      notice.hidden = freshness === 'fresh' && !failed
      notice.dataset.freshness = freshness
      const t = translator(state.config.locale)
      const title = notice.querySelector<HTMLElement>('.notice__title')
      const detail = notice.querySelector<HTMLElement>('.notice__detail')
      const titleText = t(freshness === 'fresh' ? 'dataStale' : 'dataOutdated')
      const detailText = [
        freshness === 'fresh' ? '' : t('dataOutdatedDetail'),
        t(state.config.dataMode === 'live' ? 'checkingForUpdates' : 'dataStatic'),
      ].filter(Boolean).join(' ')
      if (title && title.textContent !== titleText) title.textContent = titleText
      if (detail && detail.textContent !== detailText) detail.textContent = detailText
    }

    const minutes = state.data ? skyMinute(state.data.updatedAt, now) : null
    const skyBlock = this.#root.querySelector<HTMLElement>('[data-sky-minute]')
    if (skyBlock && state.data && skyBlock.dataset.skyMinute !== String(minutes)) {
      skyBlock.replaceWith(this.#skyCard(state.data, translator(state.config.locale), minutes))
    }
    const marker = this.#root.querySelector<HTMLElement>('.sky__now')
    if (!marker) return
    marker.hidden = minutes === null
    const label = marker.querySelector<HTMLElement>('.sky__now-label')
    if (minutes !== null && label) {
      label.textContent = `${translator(state.config.locale)('now')} ${clock(minutes)}`
      marker.style.setProperty('--at', `${((minutes / 1440) * 100).toFixed(3)}%`)
    }
    const sky = marker.closest<HTMLElement>('.sky')
    if (marker.hidden) sky?.removeAttribute('aria-description')
    else if (label) sky?.setAttribute('aria-description', label.textContent)
  }

  #dialog(name: string, title: string, t: Translate): { dialog: HTMLDialogElement; body: HTMLElement } {
    const dialog = element('dialog', 'dialog')
    dialog.dataset.dialog = name
    const head = element('div', 'dialog__head')
    const close = element('button', 'icon-button')
    close.type = 'button'
    close.setAttribute('aria-label', t('close'))
    close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
    close.addEventListener('click', () => dialog.close())
    head.append(element('h2', '', title), close)
    const body = element('div', 'dialog__body')
    dialog.append(head, body)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close()
    })
    return { dialog, body }
  }

  #recordsDialog(state: Readonly<AppState>, t: Translate): HTMLDialogElement {
    const { dialog, body } = this.#dialog('records', t('records'), t)
    const groups = [
      [t('recordsMonth'), state.data?.records.month ?? []],
      [t('recordsYear'), state.data?.records.year ?? []],
      [t('recordsAllTime'), state.data?.records.allTime ?? []],
    ] as const

    const tabs = element('div', 'tabs')
    const panels = groups.map(([, records]) => {
      const list = element('div', 'kv')
      if (!records.length) list.append(element('p', 'empty', t('noReadings')))
      for (const record of records) {
        const row = element('div', 'kv__row')
        const value = element('p', 'kv__value')
        value.append(recordValue(record, state.units))
        if (record.occurredAt) value.append(element('small', 'kv__when', record.occurredAt))
        row.append(element('p', 'kv__label', record.label), value)
        list.append(row)
      }
      return list
    })

    const show = (index: number): void => {
      panels.forEach((panel, position) => {
        panel.hidden = position !== index
      })
      tabs.querySelectorAll('button').forEach((button, position) => {
        button.setAttribute('aria-selected', String(position === index))
      })
    }
    groups.forEach(([label], index) => {
      const button = element('button', '', label)
      button.type = 'button'
      button.setAttribute('role', 'tab')
      button.addEventListener('click', () => show(index))
      tabs.append(button)
    })
    body.append(tabs, ...panels)
    show(0)
    return dialog
  }

  #settingsDialog(state: Readonly<AppState>, t: Translate): HTMLDialogElement {
    const { dialog, body } = this.#dialog('settings', t('settings'), t)

    const appearance = element('div', 'dialog__section')
    appearance.append(element('h3', '', t('appearance')))
    appearance.append(
      field(
        t('theme'),
        ['system', 'light', 'dark'] satisfies ThemeMode[],
        [t('system'), t('light'), t('dark')],
        state.theme,
        { theme: 'true' },
      ),
    )

    const units = element('div', 'dialog__section')
    units.append(element('h3', '', t('units')))
    units.append(
      field(
        t('temperature'),
        ['celsius', 'fahrenheit'] satisfies TemperatureUnit[],
        ['°C', '°F'],
        state.units.temperature,
        { unit: 'temperature' },
      ),
      field(
        t('pressure'),
        ['hPa', 'mmHg', 'kPa', 'inHg', 'mb'] satisfies PressureUnit[],
        ['hPa', 'mmHg', 'kPa', 'inHg', 'mb'],
        state.units.pressure,
        { unit: 'pressure' },
      ),
      field(
        t('wind'),
        ['ms', 'kmh', 'mph', 'kts', 'B'] satisfies WindUnit[],
        ['m/s', 'km/h', 'mph', 'kt', 'Bft'],
        state.units.wind,
        { unit: 'wind' },
      ),
      field(
        t('rain'),
        ['mm', 'inch'] satisfies RainUnit[],
        ['mm', 'in'],
        state.units.rainfall,
        { unit: 'rainfall' },
      ),
    )

    const form = element('form')
    form.append(appearance, units)
    form.addEventListener('change', (event) => {
      const select = event.target
      if (!(select instanceof HTMLSelectElement)) return
      if (select.dataset.theme) {
        this.#store.setTheme(select.value as ThemeMode)
        return
      }
      if (!select.dataset.unit) return
      this.#store.setUnit(select.dataset.unit as keyof UnitPreferences, select.value as never)
    })
    body.append(form)
    return dialog
  }
}
