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

/**
 * Eyebrow above a game name: "Super NES · Étage", or the console alone.
 * A station named like its console is said once ("Arcade", not "Arcade · Arcade").
 */
export function formatStation(
  gameConsole: string | null,
  stationLabel: string | null,
) {
  const same =
    gameConsole &&
    stationLabel &&
    gameConsole.trim().toLocaleLowerCase('fr') ===
      stationLabel.trim().toLocaleLowerCase('fr')
  return [gameConsole, same ? null : stationLabel].filter(Boolean).join(' · ')
}

/**
 * Text for the pixel font in capitals. Press Start 2P draws É, È and À as
 * small lowercase letters, so capitals in that font go without accents.
 */
export function pixelCaps(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
}

const GAME_TITLE_SEPARATOR = ' - '

/**
 * Wall cards only: split a game name at the first " - " into a main title
 * and a smaller subtitle. Names without that separator stay as a single title.
 */
export function splitGameTitle(name: string): {
  title: string
  subtitle: string | null
} {
  const index = name.indexOf(GAME_TITLE_SEPARATOR)
  if (index <= 0) return { title: name, subtitle: null }

  const title = name.slice(0, index).trimEnd()
  const subtitle = name.slice(index + GAME_TITLE_SEPARATOR.length).trimStart()
  if (!title || !subtitle) return { title: name, subtitle: null }

  return { title, subtitle }
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

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Relative under 1 h ("il y a 12 min"), time alone the same day ("14h32"),
 * date + time otherwise ("11 avr. à 16h20").
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

  const date = dateTimeFormatter
    .format(then)
    .replace(',', '')
    .replace(':', 'h')
    .replace(/\u202f/g, ' ')
    .replace(/ (\d{1,2})h/, ' à $1h')
  return date
}
