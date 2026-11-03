const dayMinutes = 1440
const synodicMonth = 29.53

export function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim())
  if (!match) return null
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return minutes <= dayMinutes ? minutes % dayMinutes : null
}

/** Minutes from one clock time forward to the next, across midnight when needed. */
export function minutesUntil(from: number, to: number): number {
  return (((to - from) % dayMinutes) + dayMinutes) % dayMinutes
}

export function formatDuration(total: number): string {
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')} min`
}

export function clock(minutes: number): string {
  const wrapped = minutesUntil(0, minutes)
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

/** Spans above the horizon on a 0–1440 axis; a body that sets after midnight gets two. */
export function upSpans(rise: number, set: number): [number, number][] {
  if (rise === set) return []
  if (rise < set) return [[rise, set]]
  const spans: [number, number][] = [[rise, dayMinutes]]
  if (set > 0) spans.unshift([0, set])
  return spans
}

export interface BodyState {
  up: boolean
  /** The clock time of the next rise or set. */
  next: number
  /** Minutes until it. */
  until: number
}

export function bodyState(rise: number, set: number, now: number): BodyState | null {
  if (rise === set) return null
  const up = rise < set ? now >= rise && now < set : now >= rise || now < set
  const next = up ? set : rise
  return { up, next, until: minutesUntil(now, next) }
}

export type MoonPhase =
  | 'newMoon'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'fullMoon'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent'

export interface MoonState {
  phase: MoonPhase
  waxing: boolean
  /** Fraction of the disc lit, 0–1. */
  lit: number
  /** The next full or new moon and the whole days until it. */
  coming: { phase: 'fullMoon' | 'newMoon'; days: number }
}

/**
 * The station gives the moon's age in days and the lit share in percent. The share names the
 * shape; the age says which way it is going.
 */
export function moonState(age: number, illumination: number): MoonState | null {
  if (!Number.isFinite(age)) return null
  const days = ((age % synodicMonth) + synodicMonth) % synodicMonth
  const waxing = days < synodicMonth / 2
  const lit = Number.isFinite(illumination)
    ? Math.min(Math.max(illumination / 100, 0), 1)
    : (1 - Math.cos((2 * Math.PI * days) / synodicMonth)) / 2

  let phase: MoonPhase
  if (lit < 0.03) phase = 'newMoon'
  else if (lit > 0.97) phase = 'fullMoon'
  else if (Math.abs(lit - 0.5) <= 0.03) phase = waxing ? 'firstQuarter' : 'lastQuarter'
  else if (lit < 0.5) phase = waxing ? 'waxingCrescent' : 'waningCrescent'
  else phase = waxing ? 'waxingGibbous' : 'waningGibbous'

  const half = synodicMonth / 2
  const toFull = daysAhead(half - days)
  const toNew = daysAhead(synodicMonth - days)
  const coming =
    phase === 'fullMoon' || (phase !== 'newMoon' && !waxing)
      ? { phase: 'newMoon' as const, days: Math.max(1, Math.round(toNew)) }
      : { phase: 'fullMoon' as const, days: Math.max(1, Math.round(toFull)) }
  return { phase, waxing, lit, coming }
}

/** Days forward to an event in the cycle, never backward. */
function daysAhead(days: number): number {
  return ((days % synodicMonth) + synodicMonth) % synodicMonth
}
