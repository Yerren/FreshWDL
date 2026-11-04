import './embed.css'
import { bootstrap, startupFailed } from './bootstrap'
import { EmbedView, embedTheme } from './embed-ui'

async function start(): Promise<void> {
  const theme = embedTheme(new URLSearchParams(window.location.search))
  await bootstrap((root, store, retry) => new EmbedView(root, store, retry), {
    persistPreferences: false,
    theme,
  })
}

void start().catch(startupFailed)
