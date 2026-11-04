import type { ScoreType } from './data/types'

const pointsFormatter = new Intl.NumberFormat('fr-FR')

const pad = (value: number) => String(value).padStart(2, '0')

/** Eyebrow above a game name: "Super NES · Étage", or the console alone. */
export function formatStation(
  gameConsole: string | null,
  stationLabel: string | null,
) {
  return [gameConsole, stationLabel].filter(Boolean).join(' · ')
}

/** Points the French way ("128 400"), times as 1'32"48 (stored in milliseconds). */
export function formatScore(score: number, type: ScoreType = 'points') {
  if (type !== 'time') return pointsFormatter.format(score)
  const minutes = Math.floor(score / 60_000)
  const seconds = Math.floor((score % 60_000) / 1000)
  const hundredths = Math.floor((score % 1000) / 10)
  return `${minutes}'${pad(seconds)}"${pad(hundredths)}`
}
