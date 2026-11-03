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
    this.#set({ status: this.#state.data ? 'stale' : 'loading', error: null })
  }

  updated(data: WeatherData): void {
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
