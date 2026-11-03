import type {
  AppState,
  HistoryPoint,
  PressureUnit,
  RainUnit,
  TemperatureUnit,
  ThemeMode,
  UnitPreferences,
  WeatherRecord,
  WindUnit,
} from './domain'
import { translator, type MessageKey } from './i18n'
import { pressure, rainfall, temperature, wind } from './units'
import type { AppStore } from './store'
import { ChartManager } from './charts'
import { relativeTime } from './time'

type FormatResult = ReturnType<typeof temperature>

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function icon(name: 'temperature' | 'wind' | 'humidity' | 'pressure' | 'rain' | 'sun' | 'settings'): string {
  const paths = {
    temperature: '<path d="M12 3a3 3 0 0 0-3 3v7.2a5 5 0 1 0 6 0V6a3 3 0 0 0-3-3Zm1 11.4a3 3 0 1 1-2 0V6a1 1 0 0 1 2 0Z"/>',
    wind: '<path d="M4 8h9a2 2 0 1 0-2-2M4 12h14a2 2 0 1 1-2 2M4 16h7"/>',
    humidity: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Zm-3 12a3 3 0 0 0 3 3"/>',
    pressure: '<circle cx="12" cy="12" r="8"/><path d="m12 12 4-3M7 16h10"/>',
    rain: '<path d="M7 15a4 4 0 1 1 1-7 5 5 0 0 1 9 2 3 3 0 0 1 0 6H7Zm1 3-1 2m5-2-1 2m5-2-1 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3-7-2 2M7 17l-2 2m0-14 2 2m10 10 2 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`
}

function valueText(result: FormatResult): string {
  return `${result.value} ${result.unit}`
}

function sparkline(points: HistoryPoint[], accent: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'metric__sparkline')
  svg.setAttribute('viewBox', '0 0 100 40')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.setAttribute('aria-hidden', 'true')
  const values = points.map((point) => point.value)
  const minimum = Math.min(...values)
  const range = Math.max(Math.max(...values) - minimum, 1)
  const coordinates = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100
    const y = 36 - ((value - minimum) / range) * 28
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  area.setAttribute('points', `0,40 ${coordinates.join(' ')} 100,40`)
  area.setAttribute('fill', accent)
  area.setAttribute('opacity', '0.12')
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  line.setAttribute('points', coordinates.join(' '))
  line.setAttribute('fill', 'none')
  line.setAttribute('stroke', accent)
  line.setAttribute('stroke-width', '1.8')
  line.setAttribute('vector-effect', 'non-scaling-stroke')
  svg.append(area, line)
  return svg
}

function compass(degrees: number, direction: string, compact = false): HTMLElement {
  const wrapper = element('div', compact ? 'compass compass--compact' : 'compass')
  wrapper.setAttribute('aria-label', `${direction}, ${degrees.toFixed(0)} degrees`)
  wrapper.innerHTML = `
    <span class="compass__mark compass__mark--north">N</span>
    <span class="compass__mark compass__mark--east">E</span>
    <span class="compass__mark compass__mark--south">S</span>
    <span class="compass__mark compass__mark--west">W</span>
    <span class="compass__needle" aria-hidden="true"></span>
    <span class="compass__center"></span>
  `
  const needle = wrapper.querySelector<HTMLElement>('.compass__needle')
  if (needle) needle.style.transform = `translateX(-50%) rotate(${degrees}deg)`
  return wrapper
}

function moonPhase(age: number): { symbol: string; label: string } {
  const phases = [
    ['●', 'New moon'],
    ['◔', 'Waxing crescent'],
    ['◐', 'First quarter'],
    ['◕', 'Waxing gibbous'],
    ['○', 'Full moon'],
    ['◕', 'Waning gibbous'],
    ['◑', 'Last quarter'],
    ['◔', 'Waning crescent'],
  ] as const
  const index = Math.round((((age % 29.53) + 29.53) % 29.53) / 29.53 * 8) % 8
  const phase = phases[index]
  return { symbol: phase[0], label: phase[1] }
}

function minutes(time: string): number {
  const [hours = 0, minute = 0] = time.split(':').map(Number)
  return hours * 60 + minute
}

function daylight(sunrise: string, sunset: string): string {
  const duration = Math.max(minutes(sunset) - minutes(sunrise), 0)
  return `${Math.floor(duration / 60)}h ${duration % 60}m`
}

function celestialVisual(age: number, illumination: string): HTMLElement {
  const phase = moonPhase(age)
  const visual = element('div', 'celestial')
  const sun = element('span', 'celestial__sun')
  sun.setAttribute('aria-hidden', 'true')
  const moon = element('span', 'celestial__moon', phase.symbol)
  moon.setAttribute('aria-hidden', 'true')
  const copy = element('span', 'celestial__copy')
  copy.append(
    element('strong', '', phase.label),
    element('small', '', `${illumination} illuminated`),
  )
  visual.append(sun, moon, copy)
  visual.setAttribute('aria-label', `${phase.label}, ${illumination} illuminated`)
  return visual
}

function metric(
  title: string,
  value: FormatResult | string,
  symbol: Parameters<typeof icon>[0],
  details: [string, string][] = [],
  history?: HistoryPoint[],
  accent = '#0f766e',
  extraVisual?: HTMLElement,
): HTMLElement {
  const card = element('article', 'metric card')
  card.style.setProperty('--metric-accent', accent)
  const heading = element('div', 'metric__heading')
  const iconNode = element('span', 'metric__icon')
  iconNode.innerHTML = icon(symbol)
  heading.append(iconNode, element('h2', '', title))
  card.append(heading)
  card.append(element('p', 'metric__value', typeof value === 'string' ? value : valueText(value)))
  if (extraVisual) card.append(extraVisual)
  if (details.length) {
    const list = element('dl', 'metric__details')
    for (const [label, detail] of details) {
      list.append(element('dt', '', label), element('dd', '', detail))
    }
    card.append(list)
  }
  if (history?.length) card.append(sparkline(history, accent))
  return card
}

function option(value: string, label: string, selected: boolean): HTMLOptionElement {
  const node = element('option', '', label)
  node.value = value
  node.selected = selected
  return node
}

function settingSelect<K extends keyof UnitPreferences>(
  label: string,
  key: K,
  values: readonly UnitPreferences[K][],
  selected: UnitPreferences[K],
): HTMLLabelElement {
  const wrapper = element('label', 'setting')
  wrapper.append(element('span', '', label))
  const select = element('select')
  select.dataset.unit = key
  for (const value of values) select.append(option(value, value, value === selected))
  wrapper.append(select)
  return wrapper
}

function themeSelect(
  selected: ThemeMode,
  t: (key: MessageKey) => string,
): HTMLLabelElement {
  const wrapper = element('label', 'setting')
  wrapper.append(element('span', '', t('theme')))
  const select = element('select')
  select.dataset.theme = 'true'
  select.append(
    option('system', t('system'), selected === 'system'),
    option('light', t('light'), selected === 'light'),
    option('dark', t('dark'), selected === 'dark'),
  )
  wrapper.append(select)
  return wrapper
}

function recordValue(record: WeatherRecord, units: UnitPreferences): string {
  const formatted = {
    temperature: () => temperature(record.value, units.temperature),
    pressure: () => pressure(record.value, units.pressure),
    wind: () => wind(record.value, units.wind),
    rainfall: () => rainfall(record.value, units.rainfall),
    humidity: () => ({ value: record.value.toFixed(1), unit: '' }),
    solar: () => ({ value: record.value.toFixed(0), unit: 'W/m²' }),
    uv: () => ({ value: record.value.toFixed(1), unit: '' }),
  }[record.unit]()
  return valueText(formatted)
}

export class AppView {
  readonly #root: HTMLElement
  readonly #store: AppStore
  readonly #charts = new ChartManager()
  readonly #retry: () => void

  constructor(root: HTMLElement, store: AppStore, retry: () => void) {
    this.#root = root
    this.#store = store
    this.#retry = retry
    this.#store.addEventListener('change', () => this.render())
    window.setInterval(() => this.#updateFreshness(), 15_000)
  }

  render(): void {
    const openDialog = this.#root.querySelector<HTMLDialogElement>('dialog[open]')?.dataset.dialog
    this.#charts.destroy()
    this.#root.replaceChildren()
    const state = this.#store.state
    const t = translator(state.config.locale)
    document.documentElement.lang = state.config.locale
    document.title = state.config.stationName

    this.#root.append(this.#header(state, t))

    if (!state.data) {
      const status = element('main', 'empty-state')
      if (state.status === 'error') {
        status.append(element('h1', '', t('dataError')), element('p', '', state.error ?? ''))
        const retry = element('button', 'button button--primary', t('retry'))
        retry.addEventListener('click', this.#retry)
        status.append(retry)
      } else {
        const spinner = element('span', 'spinner')
        spinner.setAttribute('aria-hidden', 'true')
        status.append(spinner, element('p', '', 'Collecting weather data…'))
      }
      this.#root.append(status)
      return
    }

    const data = state.data
    const main = element('main', 'dashboard')
    if (state.status === 'stale') {
      const warning = element('div', 'status-banner')
      warning.setAttribute('role', 'status')
      warning.append(
        element('strong', '', t('dataStale')),
        element('span', '', state.error ?? ''),
      )
      main.append(warning)
    }

    const hero = element('section', 'hero card')
    const heroCopy = element('div')
    heroCopy.append(
      element('p', 'eyebrow', t('currentConditions')),
      element('h1', '', state.config.stationName),
      element('p', 'hero__condition', data.forecast || data.condition),
    )
    const heroFacts = element('div', 'hero__facts')
    const heroWind = wind(data.windSpeed, state.units.wind)
    const factValues: [string, string][] = [
      [t('wind'), valueText(heroWind)],
      [t('windDirection'), `${data.windDirectionText} · ${data.windDirection.toFixed(0)}°`],
      [t('humidity'), `${data.humidity.toFixed(0)}%`],
    ]
    for (const [label, value] of factValues) {
      const fact = element('div', 'hero__fact')
      fact.append(element('span', '', label), element('strong', '', value))
      heroFacts.append(fact)
    }
    heroCopy.append(heroFacts)
    const heroTemp = element('div', 'hero__temperature')
    const currentTemperature = temperature(data.temperature, state.units.temperature)
    heroTemp.append(
      element('strong', '', `${currentTemperature.value}°`),
      element('span', '', currentTemperature.unit.replace('°', '')),
    )
    const heroVisual = element('div', 'hero__visual')
    heroVisual.append(compass(data.windDirection, data.windDirectionText), heroTemp)
    hero.append(heroCopy, heroVisual)
    main.append(hero)

    const grid = element('section', 'metrics')
    grid.setAttribute('aria-label', t('currentConditions'))
    grid.append(
      metric(
        t('temperature'),
        currentTemperature,
        'temperature',
        [
          [t('low'), valueText(temperature(data.temperatureLow, state.units.temperature))],
          [t('high'), valueText(temperature(data.temperatureHigh, state.units.temperature))],
          [t('apparent'), valueText(temperature(data.apparentTemperature, state.units.temperature))],
        ],
        data.history.temperature,
        '#ef6c57',
      ),
      metric(
        t('wind'),
        wind(data.windSpeed, state.units.wind),
        'wind',
        [
          ['Gust', valueText(wind(data.windGust, state.units.wind))],
          [t('windDirection'), `${data.windDirectionText} ${data.windDirection.toFixed(0)}°`],
          [t('windChill'), valueText(temperature(data.windChill, state.units.temperature))],
        ],
        data.history.windSpeed,
        '#0f8f83',
        compass(data.windDirection, data.windDirectionText, true),
      ),
      metric(
        t('humidity'),
        { value: data.humidity.toFixed(0), unit: '%' },
        'humidity',
        [],
        data.history.humidity,
        '#0891b2',
      ),
      metric(
        t('pressure'),
        pressure(data.pressure, state.units.pressure),
        'pressure',
        [['Trend', valueText(pressure(data.pressureTrend, state.units.pressure))]],
        data.history.pressure,
        '#6256b3',
      ),
      metric(
        t('rain'),
        rainfall(data.rainDay, state.units.rainfall),
        'rain',
        [
          [t('rainRate'), valueText(rainfall(data.rainRate, state.units.rainfall))],
          [t('rainMonth'), valueText(rainfall(data.rainMonth, state.units.rainfall))],
          [t('rainYear'), valueText(rainfall(data.rainYear, state.units.rainfall))],
        ],
        data.history.rainfall,
        '#3182ce',
      ),
    )
    if (state.config.widgets.solar || state.config.widgets.uv) {
      const details: [string, string][] = []
      if (state.config.widgets.uv) details.push([t('uv'), data.uv.toFixed(1)])
      grid.append(
        metric(
          t('solar'),
          state.config.widgets.solar ? `${data.solar.toFixed(0)} W/m²` : `${data.uv.toFixed(1)}`,
          'sun',
          details,
          data.history.solar,
          '#d97706',
        ),
      )
    }
    grid.append(
      metric(
        t('sunAndMoon'),
        daylight(data.sunrise, data.sunset),
        'sun',
        [
          [t('sunrise'), data.sunrise],
          [t('sunset'), data.sunset],
          [t('moonrise'), data.moonrise],
          [t('moonset'), data.moonset],
        ],
        undefined,
        '#d97706',
        celestialVisual(data.moonAge, data.moonPhase),
      ),
    )
    main.append(grid, this.#chartsSection(state, t), this.#actions(state, t))
    this.#root.append(main)

    requestAnimationFrame(() => this.#charts.render(data, state.units))
    if (openDialog) {
      this.#root.querySelector<HTMLDialogElement>(`dialog[data-dialog="${openDialog}"]`)?.showModal()
    }
  }

  #updateFreshness(): void {
    const timestamp = this.#store.state.lastSuccessfulUpdate
    const output = this.#root.querySelector<HTMLTimeElement>('.freshness__time')
    if (!timestamp || !output) return
    output.textContent = relativeTime(timestamp, this.#store.state.config.locale)
  }

  #header(state: Readonly<AppState>, t: (key: MessageKey) => string): HTMLElement {
    const header = element('header', 'site-header')
    const brand = element('a', 'brand', state.config.siteName)
    brand.href = state.config.siteUrl
    const tools = element('div', 'header-tools')
    const update = element('p', 'freshness')
    update.append(`${t('lastUpdated')} `)
    const relative = element('time', 'freshness__time')
    if (state.lastSuccessfulUpdate) {
      relative.dateTime = state.lastSuccessfulUpdate.toISOString()
      relative.title = new Intl.DateTimeFormat(state.config.locale, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(state.lastSuccessfulUpdate)
      relative.textContent = relativeTime(state.lastSuccessfulUpdate, state.config.locale)
    } else {
      relative.textContent = '—'
    }
    update.append(relative)
    const settingsButton = element('button', 'icon-button')
    settingsButton.type = 'button'
    settingsButton.setAttribute('aria-label', t('settings'))
    settingsButton.innerHTML = icon('settings')
    const settingsDialog = this.#settingsDialog(state, t)
    settingsButton.addEventListener('click', () => settingsDialog.showModal())
    tools.append(update, settingsButton)
    header.append(brand, tools, settingsDialog)
    return header
  }

  #chartsSection(state: Readonly<AppState>, t: (key: MessageKey) => string): HTMLElement {
    const section = element('section', 'section')
    section.append(element('h2', 'section__title', t('graphs')))
    const grid = element('div', 'chart-grid')
    const charts = [
      ['temperature', t('temperature'), state.config.graphs.temperature],
      ['pressure', t('pressure'), state.config.graphs.barometer],
      ['windSpeed', t('wind'), state.config.graphs.windSpeed],
      ['rainfall', t('rain'), state.config.graphs.rainfall],
      ['humidity', t('humidity'), state.config.graphs.humidity],
      ['solar', t('solar'), state.config.graphs.solar],
      ['uv', t('uv'), state.config.graphs.uv],
      ['windDirection', `${t('wind')} °`, state.config.graphs.windDirection],
    ] as const
    for (const [name, label, enabled] of charts) {
      if (!enabled) continue
      const figure = element('figure', 'chart-card card')
      figure.append(element('figcaption', '', label))
      const wrapper = element('div', 'chart')
      const canvas = element('canvas')
      canvas.dataset.chart = name
      canvas.setAttribute('aria-label', `${label}, 24 hour history`)
      canvas.setAttribute('role', 'img')
      wrapper.append(canvas)
      figure.append(wrapper)
      grid.append(figure)
    }
    section.append(grid)
    return section
  }

  #actions(state: Readonly<AppState>, t: (key: MessageKey) => string): HTMLElement {
    const actions = element('section', 'actions')
    const recordsButton = element('button', 'button', t('records'))
    actions.append(recordsButton)
    const recordsDialog = this.#recordsDialog(state, t)
    recordsButton.addEventListener('click', () => recordsDialog.showModal())
    actions.append(recordsDialog)
    return actions
  }

  #recordsDialog(state: Readonly<AppState>, t: (key: MessageKey) => string): HTMLDialogElement {
    const dialog = element('dialog', 'dialog')
    dialog.dataset.dialog = 'records'
    const title = element('h2', '', t('records'))
    const close = element('button', 'button button--icon', '×')
    close.setAttribute('aria-label', t('close'))
    close.addEventListener('click', () => dialog.close())
    const header = element('header', 'dialog__header')
    header.append(title, close)
    const tabs = element('div', 'record-groups')
    const groups = [
      [t('recordsMonth'), state.data?.records.month ?? []],
      [t('recordsYear'), state.data?.records.year ?? []],
      [t('recordsAllTime'), state.data?.records.allTime ?? []],
    ] as const
    for (const [label, records] of groups) {
      const details = element('details', 'record-group')
      if (label === t('recordsMonth')) details.open = true
      details.append(element('summary', '', label))
      const list = element('dl', 'records')
      for (const record of records) {
        const value = element('dd')
        value.append(
          element('strong', '', recordValue(record, state.units)),
          element('small', '', record.occurredAt ?? ''),
        )
        list.append(element('dt', '', record.label), value)
      }
      details.append(list)
      tabs.append(details)
    }
    dialog.append(header, tabs)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close()
    })
    return dialog
  }

  #settingsDialog(state: Readonly<AppState>, t: (key: MessageKey) => string): HTMLDialogElement {
    const dialog = element('dialog', 'dialog dialog--small')
    dialog.dataset.dialog = 'settings'
    const header = element('header', 'dialog__header')
    const close = element('button', 'button button--icon', '×')
    close.setAttribute('aria-label', t('close'))
    close.addEventListener('click', () => dialog.close())
    header.append(element('h2', '', t('settings')), close)
    const form = element('form', 'settings')
    const appearanceHeading = element('h3', 'settings__heading', t('appearance'))
    const unitsHeading = element('h3', 'settings__heading', t('units'))
    form.append(
      appearanceHeading,
      themeSelect(state.theme, t),
      unitsHeading,
      settingSelect(t('temperature'), 'temperature', ['celsius', 'fahrenheit'] satisfies TemperatureUnit[], state.units.temperature),
      settingSelect(t('pressure'), 'pressure', ['hPa', 'mmHg', 'kPa', 'inHg', 'mb'] satisfies PressureUnit[], state.units.pressure),
      settingSelect(t('wind'), 'wind', ['ms', 'kmh', 'mph', 'kts', 'B'] satisfies WindUnit[], state.units.wind),
      settingSelect(t('rain'), 'rainfall', ['mm', 'inch'] satisfies RainUnit[], state.units.rainfall),
    )
    form.addEventListener('change', (event) => {
      const select = event.target
      if (!(select instanceof HTMLSelectElement)) return
      if (select.dataset.theme) {
        this.#store.setTheme(select.value as ThemeMode)
        return
      }
      if (!select.dataset.unit) return
      const unit = select.dataset.unit as keyof UnitPreferences
      this.#store.setUnit(unit, select.value as never)
    })
    dialog.append(header, form)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close()
    })
    return dialog
  }
}
