import { loadConfig } from './config'
import { FeedClient } from './data/feed-client'
import { parseFeeds } from './data/parser'
import { AppStore, type StoreOptions } from './store'

export async function bootstrap(
  createView: (root: HTMLElement, store: AppStore, retry: () => void) => { render(): void },
  options: StoreOptions = {},
): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app')
  if (!root) throw new Error('FreshWDL root element was not found')

  const config = await loadConfig()
  const store = new AppStore(config, options)
  const client = new FeedClient(config)
  let refreshTimer: number | undefined

  const refresh = async (): Promise<void> => {
    store.loading()
    try {
      store.updated(parseFeeds(await client.load()))
    } catch (error) {
      store.failed(error)
    }
  }

  createView(root, store, () => void refresh()).render()
  await refresh()

  if (config.dataMode === 'live') {
    refreshTimer = window.setInterval(() => void refresh(), config.pollingIntervalMs)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void refresh()
    })
    window.addEventListener('online', () => void refresh())
  }

  window.addEventListener('beforeunload', () => {
    client.abort()
    if (refreshTimer !== undefined) window.clearInterval(refreshTimer)
  })
}

export function startupFailed(error: unknown): void {
  const root = document.querySelector<HTMLElement>('#app')
  if (root) root.textContent = error instanceof Error ? error.message : 'FreshWDL could not start'
  console.error(error)
}
