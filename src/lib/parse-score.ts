import type { ScoreType } from './data/types'

/**
 * Parses the player score field.
 * Points: digits (spaces ignored).
 * Time: 1'32"48 / 1:32.48 / raw milliseconds.
 */
export function parseScoreInput(raw: string, type: ScoreType): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (type === 'points' || type === 'other') {
    const digits = trimmed.replace(/\s/g, '')
    if (!/^\d+$/.test(digits)) return null
    return Number(digits)
  }

  const asMs = Number(trimmed.replace(/\s/g, ''))
  if (/^\d+$/.test(trimmed.replace(/\s/g, '')) && asMs >= 1000) return asMs

  const match =
    /^(\d+)'(\d{1,2})"(\d{1,2})$/.exec(trimmed) ??
    /^(\d+):(\d{1,2})[.,](\d{1,2})$/.exec(trimmed)
  if (!match) return null
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  const hundredths = Number(match[3].padEnd(2, '0').slice(0, 2))
  if (seconds >= 60 || hundredths >= 100) return null
  return minutes * 60_000 + seconds * 1000 + hundredths * 10
}
