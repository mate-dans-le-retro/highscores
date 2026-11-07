import type { ScoreType } from './data/types'

export type TimeInputError = 'format' | 'seconds' | 'minutes' | 'zero'

export type TimeInput =
  { ok: true; ms: number } | { ok: false; error: TimeInputError }

/** h, ' (minutes), " (seconds), ':' (positional), '.' or ',' (decimals). */
type Separator = 'h' | "'" | '"' | ':' | '.' | ','

const HOURS = 0
const MINUTES = 1
const SECONDS = 2

/** Digits typed in a row, like on a stopwatch: at most 9999'59"99. */
const MAX_DIGITS = 8

/**
 * Phone keyboards turn ' and " into typographic quotes ("smart punctuation"),
 * and players write units in letters: everything becomes h, ', " or a digit.
 */
function normalizeTime(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[’‘′´`]/g, "'")
    .replace(/[”“″«»]/g, '"')
    .replace(/''/g, '"')
    .replace(/(?:sec|s)/g, '"')
    .replace(/(?:min|mn|m)/g, "'")
}

function fromDigits(digits: string): TimeInput {
  if (digits.length > MAX_DIGITS) return { ok: false, error: 'format' }
  const padded = digits.padStart(5, '0')
  const minutes = Number(padded.slice(0, -4))
  const seconds = Number(padded.slice(-4, -2))
  const hundredths = Number(padded.slice(-2))
  return total(
    { minutes, seconds, fractionMs: hundredths * 10 },
    digits.length > 4,
  )
}

function total(
  parts: {
    hours?: number
    minutes?: number
    seconds: number
    fractionMs: number
  },
  minutesShown: boolean,
): TimeInput {
  const { hours, minutes = 0, seconds, fractionMs } = parts
  if (hours !== undefined && minutes >= 60)
    return { ok: false, error: 'minutes' }
  if ((minutesShown || hours !== undefined) && seconds >= 60)
    return { ok: false, error: 'seconds' }
  const ms = ((hours ?? 0) * 3600 + minutes * 60 + seconds) * 1000 + fractionMs
  return ms > 0 ? { ok: true, ms } : { ok: false, error: 'zero' }
}

const EXPLICIT_UNIT: Partial<Record<Separator, number>> = {
  h: HOURS,
  "'": MINUTES,
  '"': SECONDS,
  '.': SECONDS,
  ',': SECONDS,
}

/**
 * Reads a time typed by a player, in milliseconds. Digits alone are read like
 * a stopwatch, from the right: 13248 is 1'32"48. With separators: 1'32"48,
 * 1’32”48, 1:32.48, 1:32:48 (minutes, seconds, hundredths), 1:32, 32"48,
 * 32,5, 1h02'03"45, 1min32s. One, two or three decimals (tenths to
 * milliseconds). Seconds stop at 59 when minutes are shown.
 */
export function parseTimeInput(raw: string): TimeInput {
  const text = normalizeTime(raw)
  if (!/^[\dh'":.,]+$/.test(text)) return { ok: false, error: 'format' }
  if (/^\d+$/.test(text)) return fromDigits(text)

  const groups: Array<{ digits: string; separator: Separator | null }> = []
  for (const [, digits, separator] of text.matchAll(/(\d+)([h'":.,])?/g)) {
    groups.push({
      digits,
      separator: (separator as Separator | undefined) ?? null,
    })
  }
  // A separator with no number before it ("'32", "1::32") is a typo.
  if (
    groups
      .map(({ digits, separator }) => digits + (separator ?? ''))
      .join('') !== text
  )
    return { ok: false, error: 'format' }

  let fraction = ''
  const last = groups.at(-1)
  const beforeLast = groups.at(-2)
  // Racing games print 1:32:48 or 1.32.48 for minutes, seconds, hundredths.
  const positional =
    groups.length === 3 &&
    groups.every(({ separator }) => [':', '.', ',', null].includes(separator))
  if (positional) {
    fraction = groups.pop()?.digits ?? ''
  } else if (
    last &&
    beforeLast &&
    last.separator === null &&
    (beforeLast.separator === '"' ||
      beforeLast.separator === '.' ||
      beforeLast.separator === ',')
  ) {
    fraction = last.digits
    groups.pop()
  }
  if (fraction.length > 3) return { ok: false, error: 'format' }
  const decimal = groups.findIndex(
    ({ separator }) => separator === '.' || separator === ',',
  )
  if (!positional && decimal !== -1 && decimal !== groups.length - 1)
    return { ok: false, error: 'format' }

  const units: Array<number | undefined> = groups.map(({ separator }) =>
    positional || !separator ? undefined : EXPLICIT_UNIT[separator],
  )
  const lastIndex = units.length - 1
  if (units[lastIndex] === undefined) {
    const previous = units[lastIndex - 1]
    units[lastIndex] = previous === undefined ? SECONDS : previous + 1
  }
  for (let index = lastIndex - 1; index >= 0; index -= 1) {
    units[index] ??= (units[index + 1] ?? SECONDS) - 1
  }
  const ordered = units.every(
    (unit, index) =>
      unit !== undefined &&
      unit >= HOURS &&
      unit <= SECONDS &&
      (index === 0 || unit > (units[index - 1] ?? -1)),
  )
  if (!ordered) return { ok: false, error: 'format' }
  if (fraction && units[lastIndex] !== SECONDS)
    return { ok: false, error: 'format' }

  const value = (unit: number) => {
    const index = units.indexOf(unit)
    return index === -1 ? undefined : Number(groups[index]?.digits)
  }
  const hours = value(HOURS)
  const minutes = value(MINUTES)
  return total(
    {
      hours,
      minutes,
      seconds: value(SECONDS) ?? 0,
      fractionMs: fraction ? Number(fraction.padEnd(3, '0')) : 0,
    },
    minutes !== undefined,
  )
}

/**
 * Parses the player score field.
 * Points: digits (spaces ignored). Time: see parseTimeInput().
 */
export function parseScoreInput(raw: string, type: ScoreType): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (type === 'points' || type === 'other') {
    const digits = trimmed.replace(/\s/g, '')
    // Same ceiling as admin parseScore and the SQL scores_score_check (10^15).
    if (!/^\d{1,15}$/.test(digits)) return null
    return Number(digits)
  }

  const time = parseTimeInput(trimmed)
  return time.ok ? time.ms : null
}
