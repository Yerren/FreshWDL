// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from './config'
import { bootstrap, startupFailed } from './bootstrap'
import type { AppStore } from './store'

const mocks = vi.hoisted(() => ({
  loadConfig: vi.fn(),
  load: vi.fn(),
  abort: vi.fn(),
  parse: vi.fn(),
}))
vi.mock('./config', async (original) => ({
  ...await original<typeof import('./config')>(),
  loadConfig: mocks.loadConfig,
}))
vi.mock('./data/feed-client', () => ({
  FeedClient: class {
    load = mocks.load
    abort = mocks.abort
  },
}))
vi.mock('./data/parser', () => ({ parseFeeds: mocks.parse }))

afterEach(() => {
  window.dispatchEvent(new Event('beforeunload'))
  document.body.replaceChildren()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('shared bootstrap', () => {
  it('renders loading, loads fixtures once and passes retry through the view', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    mocks.loadConfig.mockResolvedValue(defaultConfig)
    mocks.load.mockResolvedValue({})
    mocks.parse.mockReturnValue({ updatedAt: new Date() })
    const render = vi.fn()
    let retry: (() => void) | undefined
    let appStore: AppStore | undefined
    await bootstrap((_root, store, refresh) => {
      appStore = store
      expect(store.state.status).toBe('loading')
      retry = refresh
      return { render }
    }, { persistPreferences: false, theme: 'light' })
    expect(render).toHaveBeenCalledOnce()
    expect(mocks.load).toHaveBeenCalledOnce()
    expect(appStore?.state.status).toBe('ready')
    retry?.()
    await vi.waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2))
  })

  it('polls live feeds, refreshes on visibility/online, handles failure and aborts on unload', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="app"></div>'
    mocks.loadConfig.mockResolvedValue({ ...defaultConfig, dataMode: 'live', pollingIntervalMs: 1000 })
    mocks.load.mockRejectedValue(new Error('Offline'))
    let appStore: AppStore | undefined
    const listeners: [EventTarget, string, EventListenerOrEventListenerObject][] = []
    for (const target of [window, document]) {
      const original = target.addEventListener.bind(target)
      vi.spyOn(target, 'addEventListener').mockImplementation((type, listener, options) => {
        if (listener) listeners.push([target, type, listener])
        original(type, listener, options)
      })
    }
    await bootstrap((_root, store) => {
      appStore = store
      return { render: vi.fn() }
    }, { persistPreferences: false })
    expect(appStore?.state.error).toBe('Offline')
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.load).toHaveBeenCalledTimes(2)
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)
    expect(mocks.load).toHaveBeenCalledTimes(3)
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(mocks.load).toHaveBeenCalledTimes(4)
    window.dispatchEvent(new Event('beforeunload'))
    expect(mocks.abort).toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    expect(mocks.load).toHaveBeenCalledTimes(4)
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener)
  })

  it('surfaces startup errors in the root and console', () => {
    document.body.innerHTML = '<div id="app"></div>'
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    startupFailed(new Error('Configuration request failed (500)'))
    expect(document.querySelector('#app')?.textContent).toBe('Configuration request failed (500)')
    expect(log).toHaveBeenCalledOnce()
  })
})
