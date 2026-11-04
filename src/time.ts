export function dataFreshness(
  date: Date,
  staleAfterMs: number,
  now = new Date(),
): 'fresh' | 'warning' | 'danger' {
  const age = now.getTime() - date.getTime()
  if (age >= staleAfterMs * 2) return 'danger'
  return age >= staleAfterMs ? 'warning' : 'fresh'
}

export function relativeTime(
  date: Date,
  locale: string,
  now = new Date(),
): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1_000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const absoluteSeconds = Math.abs(seconds)
  if (absoluteSeconds < 60) return formatter.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}
