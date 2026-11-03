import type { AppConfig, FeedBundle, FeedName } from '../domain'

const feedOrder: FeedName[] = ['current', 'extra', 'hourly', 'daily']

function joinUrl(base: string, file: string): string {
  return `${base.replace(/\/?$/, '/')}${file.replace(/^\//, '')}`
}

function tokenize(text: string, feed: FeedName): readonly string[] {
  const values = text.trim().split(/\s+/)
  if (values[0] !== '12345') {
    throw new Error(`${feed} feed has an invalid header`)
  }
  return values
}

export class FeedClient {
  readonly #config: AppConfig
  #controller: AbortController | null = null

  constructor(config: AppConfig) {
    this.#config = config
  }

  abort(): void {
    this.#controller?.abort()
  }

  async load(): Promise<FeedBundle> {
    this.abort()
    this.#controller = new AbortController()
    const signal = this.#controller.signal
    const timeout = window.setTimeout(() => this.#controller?.abort(), this.#config.requestTimeoutMs)
    const base =
      this.#config.dataMode === 'fixtures'
        ? this.#config.fixtureBaseUrl
        : this.#config.baseUrl

    try {
      const entries = await Promise.all(
        feedOrder.map(async (feed) => {
          const url = new URL(
            joinUrl(base, this.#config.feedFiles[feed]),
            document.baseURI,
          )
          if (this.#config.dataMode === 'live') {
            url.searchParams.set('_', Date.now().toString())
          }
          const response = await fetch(url, {
            cache: 'no-store',
            signal,
          })
          if (!response.ok) {
            throw new Error(`${feed} feed request failed (${response.status})`)
          }
          return [feed, tokenize(await response.text(), feed)] as const
        }),
      )
      const feeds = Object.fromEntries(entries) as Record<FeedName, readonly string[]>
      return {
        current: feeds.current,
        extra: feeds.extra,
        hourly: feeds.hourly,
        daily: feeds.daily,
        receivedAt: new Date(),
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Weather data request timed out or was cancelled', { cause: error })
      }
      throw error
    } finally {
      window.clearTimeout(timeout)
      this.#controller = null
    }
  }
}
