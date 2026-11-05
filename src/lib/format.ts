import type { ScoreType } from './data/types'

const pointsFormatter = new Intl.NumberFormat('fr-FR')

const pad = (value: number) => String(value).padStart(2, '0')

const formatPoints = (score: number) => pointsFormatter.format(score)

/** Milliseconds as 1'32"48. */
function formatTime(score: number) {
  const minutes = Math.floor(score / 60_000)
  const seconds = Math.floor((score % 60_000) / 1000)
  const hundredths = Math.floor((score % 1000) / 10)
  return `${minutes}'${pad(seconds)}"${pad(hundredths)}`
}

const formatters: Record<ScoreType, (score: number) => string> = {
  points: formatPoints,
  time: formatTime,
  other: formatPoints,
}

/** Eyebrow above a game name: "Super NES · Étage", or the console alone. */
export function formatStation(
  gameConsole: string | null,
  stationLabel: string | null,
) {
  return [gameConsole, stationLabel].filter(Boolean).join(' · ')
}

/** Points the French way ("128 400"), times as 1'32"48. */
export function formatScore(score: number, type: ScoreType = 'points') {
  return formatters[type](score)
}

const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: 'numeric',
  minute: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

const weekdayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })

/** Under a week, the weekday is unambiguous and reads better: "samedi". */
const WEEKDAY_WINDOW_MS = 6 * 24 * 3_600_000

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Relative under 1 h ("il y a 12 min"), time alone the same day ("14h32"),
 * weekday + time within the week ("samedi à 14h32"), date + time otherwise
 * ("11 avr. à 16h20").
 */
export function formatScoreWhen(iso: string, now: Date = new Date()) {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''

  const diffMs = now.getTime() - then.getTime()
  if (diffMs >= 0 && diffMs < 60_000) return "à l'instant"
  if (diffMs >= 0 && diffMs < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diffMs / 60_000))
    return `il y a ${minutes} min`
  }

  const time = timeFormatter
    .format(then)
    .replace(':', 'h')
    .replace(/\u202f/g, '')
    .replace(/ /g, '')

  if (sameCalendarDay(then, now)) return time
  if (diffMs >= 0 && diffMs < WEEKDAY_WINDOW_MS) {
    return `${weekdayFormatter.format(then)} à ${time}`
  }

  const date = dateTimeFormatter
    .format(then)
    .replace(',', '')
    .replace(':', 'h')
    .replace(/\u202f/g, ' ')
    .replace(/ (\d{1,2})h/, ' à $1h')
  return date
}
