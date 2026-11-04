import type { ThemeMode } from './domain'
import { element } from './dom'
import { translator } from './i18n'
import type { AppStore } from './store'
import { dataFreshness, relativeTime } from './time'
import { temperature, wind, type FormattedValue } from './units'
import { windRose } from './wind-rose'

export function embedTheme(params: URLSearchParams): ThemeMode {
  const value = params.get('theme') ?? 'light'
  if (value === 'light' || value === 'dark' || value === 'system') return value
  throw new Error('Unsupported embed theme. Use theme=light, theme=dark, or theme=system.')
}

function valueText(value: FormattedValue): string {
  return `${value.value} ${value.unit}`
}

function figure(value: FormattedValue, className: string): HTMLElement {
  const node = element('p', className)
  node.append(value.value, element('small', '', value.unit))
  return node
}

export class EmbedView {
  readonly #root: HTMLElement
  readonly #store: AppStore
  readonly #retry: () => void
  readonly #timer: number
  readonly #onChange = (): void => this.render()

  constructor(root: HTMLElement, store: AppStore, retry: () => void) {
    this.#root = root
    this.#store = store
    this.#retry = retry
    store.addEventListener('change', this.#onChange)
    this.#timer = window.setInterval(() => this.#updateStatus(), 15_000)
    window.addEventListener('beforeunload', () => this.destroy(), { once: true })
  }

  destroy(): void {
    this.#store.removeEventListener('change', this.#onChange)
    window.clearInterval(this.#timer)
  }

  render(): void {
    const { config, data, units } = this.#store.state
    const t = translator(config.locale)
    document.documentElement.lang = config.locale
    document.title = `${config.stationName} - ${t('currentConditions')}`
    const main = element('main', 'embed')
    main.setAttribute('aria-label', t('currentConditions'))
    main.append(element('h1', 'sr-only', t('currentConditions')))
    const external = element('a', 'embed__external')
    external.href = './'
    external.target = '_blank'
    external.rel = 'noopener noreferrer'
    external.setAttribute('aria-label', t('openDashboard'))
    external.title = t('openDashboard')
    external.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4 10 14M10 4H4v16h16v-6"/></svg>'
    main.append(external)

    if (data) {
      const current = element('section', 'embed__temperature')
      current.setAttribute('aria-label', t('temperature'))
      current.append(
        figure(temperature(data.temperature, units.temperature), 'embed__current'),
        element('p', 'embed__felt', `${t('apparent')} ${valueText(temperature(data.apparentTemperature, units.temperature))}`),
      )
      const extremes = element('div', 'embed__extremes')
      extremes.setAttribute('aria-label', t('today'))
      extremes.append(
        element('p', '', `${t('high')} ${valueText(temperature(data.temperatureHigh, units.temperature))}`),
        element('p', '', `${t('low')} ${valueText(temperature(data.temperatureLow, units.temperature))}`),
      )
      current.append(extremes)

      const breeze = element('section', 'embed__wind')
      breeze.setAttribute('aria-label', t('wind'))
      const compass = windRose(data.windDirection, data.windDirectionText)
      // The adjacent direction text supplies the localized accessible equivalent.
      compass.setAttribute('aria-hidden', 'true')
      compass.removeAttribute('role')
      compass.removeAttribute('aria-label')
      const readout = element('div', 'embed__wind-readout')
      readout.append(
        element('p', 'embed__label', t('wind')),
        figure(wind(data.windSpeed, units.wind), 'embed__speed'),
        element('p', 'embed__direction', `${data.windDirectionText} ${data.windDirection.toFixed(0)}°`),
      )
      breeze.append(compass, readout)
      main.append(current, breeze)
    }

    const status = element('div', 'embed__status')
    status.setAttribute('role', 'status')
    main.append(status)
    this.#root.replaceChildren(main)
    this.#updateStatus()
  }

  #updateStatus(): void {
    const status = this.#root.querySelector<HTMLElement>('.embed__status')
    const main = this.#root.querySelector<HTMLElement>('.embed')
    if (!status || !main) return
    const { config, data, error } = this.#store.state
    const t = translator(config.locale)
    const freshness = data ? dataFreshness(data.updatedAt, config.staleAfterMs) : 'fresh'
    main.dataset.freshness = error ? 'danger' : freshness

    if (data && !error && freshness === 'fresh') {
      status.hidden = true
      status.replaceChildren()
      return
    }

    const nodes: HTMLElement[] = []
    if (error) {
      if (status.querySelector('details')) return
      const details = element('details')
      details.open = !data
      details.append(
        element('summary', '', t(data ? 'dataStale' : 'dataError')),
        element('p', 'embed__error', error),
      )
      const retry = element('button', 'embed__retry', t('retry'))
      retry.type = 'button'
      retry.addEventListener('click', this.#retry)
      nodes.push(details, retry)
    } else if (data) {
      const existing = status.querySelector('time')
      const time = existing ?? element('time')
      time.textContent = `${t('lastUpdated')} ${relativeTime(data.updatedAt, config.locale)}`
      time.dateTime = data.updatedAt.toISOString()
      time.title = `${t('dataOutdated')}. ${t(config.dataMode === 'fixtures' ? 'dataStatic' : 'checkingForUpdates')}`
      if (existing) return
      nodes.push(time)
    } else {
      nodes.push(element('p', '', t('loadingData')))
    }
    status.hidden = false
    status.replaceChildren(...nodes)
  }
}
