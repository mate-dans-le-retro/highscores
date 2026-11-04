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
