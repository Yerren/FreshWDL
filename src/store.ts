import type {
  AppConfig,
  AppState,
  ThemeMode,
  UnitPreferences,
  WeatherData,
} from './domain'

const unitsStorageKey = 'freshwdl-v2-units'
const themeStorageKey = 'freshwdl-v2-theme'

function restoredUnits(config: AppConfig): UnitPreferences {
  try {
    const saved = localStorage.getItem(unitsStorageKey)
    return saved ? { ...config.units, ...JSON.parse(saved) } : { ...config.units }
  } catch (error) {
    console.warn('FreshWDL could not restore saved unit preferences', error)
    return { ...config.units }
  }
}

function restoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(themeStorageKey)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch (error) {
    console.warn('FreshWDL could not restore the saved appearance', error)
    return 'system'
  }
}

function applyTheme(theme: ThemeMode): void {
  if (theme === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
  document.documentElement.style.colorScheme = theme === 'system' ? 'light dark' : theme
}

function sameWeatherContent(left: WeatherData, right: WeatherData): boolean {
  const serialize = (data: WeatherData): string | undefined =>
    JSON.stringify(data, (key, value: unknown) =>
      key === 'updatedAt' || key === 'stationTime' ? undefined : value,
    )
  return serialize(left) === serialize(right)
}

export class AppStore extends EventTarget {
  #state: AppState

  constructor(config: AppConfig) {
    super()
    this.#state = {
      config,
      units: restoredUnits(config),
      theme: restoredTheme(),
      status: 'loading',
      data: null,
      error: null,
      lastSuccessfulUpdate: null,
    }
    applyTheme(this.#state.theme)
  }

  get state(): Readonly<AppState> {
    return this.#state
  }

  loading(): void {
    if (this.#state.data) return
    if (this.#state.status !== 'loading' || this.#state.error !== null) {
      this.#set({ status: 'loading', error: null })
    }
  }

  updated(data: WeatherData): void {
    if (this.#state.data && sameWeatherContent(this.#state.data, data)) {
      this.#state = { ...this.#state, data, lastSuccessfulUpdate: data.updatedAt }
      if (this.#state.status !== 'ready' || this.#state.error !== null) {
        this.#set({ status: 'ready', error: null })
      }
      return
    }
    this.#set({
      data,
      status: 'ready',
      error: null,
      lastSuccessfulUpdate: data.updatedAt,
    })
  }

  failed(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unable to load weather data'
    this.#set({
      status: this.#state.data ? 'stale' : 'error',
      error: message,
    })
  }

  setUnit<K extends keyof UnitPreferences>(key: K, value: UnitPreferences[K]): void {
    const units = { ...this.#state.units, [key]: value }
    localStorage.setItem(unitsStorageKey, JSON.stringify(units))
    this.#set({ units })
  }

  setTheme(theme: ThemeMode): void {
    localStorage.setItem(themeStorageKey, theme)
    applyTheme(theme)
    this.#set({ theme })
  }

  #set(patch: Partial<AppState>): void {
    this.#state = { ...this.#state, ...patch }
    this.dispatchEvent(new Event('change'))
  }
}
