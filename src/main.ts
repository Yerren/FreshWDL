import './style.css'
import { loadConfig } from './config'
import { FeedClient } from './data/feed-client'
import { parseFeeds } from './data/parser'
import { AppStore } from './store'
import { AppView } from './ui'

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app')
  if (!root) throw new Error('FreshWDL root element was not found')

  const config = await loadConfig()
  const store = new AppStore(config)
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

  new AppView(root, store, () => void refresh()).render()
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

void bootstrap().catch((error: unknown) => {
  const root = document.querySelector<HTMLElement>('#app')
  if (root) {
    root.textContent = error instanceof Error ? error.message : 'FreshWDL could not start'
  }
  console.error(error)
})
