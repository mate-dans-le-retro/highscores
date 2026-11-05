import { describe, expect, it } from 'vitest'

import { formatScore, formatScoreWhen, formatStation } from './format'

// Intl uses a narrow no-break space as the French thousands separator.
const nbsp = '\u202f'

describe('formatScore', () => {
  it('formats points the French way', () => {
    expect(formatScore(128_400)).toBe(`128${nbsp}400`)
    expect(formatScore(1_234_567, 'points')).toBe(`1${nbsp}234${nbsp}567`)
    expect(formatScore(0)).toBe('0')
  })

  it('formats times stored in milliseconds', () => {
    expect(formatScore(92_480, 'time')).toBe(`1'32"48`)
    expect(formatScore(59_990, 'time')).toBe(`0'59"99`)
    expect(formatScore(605_004, 'time')).toBe(`10'05"00`)
  })

  it('formats other scores as numbers', () => {
    expect(formatScore(42_000, 'other')).toBe(`42${nbsp}000`)
  })
})

describe('formatStation', () => {
  it('joins the console and the station label', () => {
    expect(formatStation('Super NES', 'Étage')).toBe('Super NES · Étage')
  })

  it('shows what is there when one part is missing', () => {
    expect(formatStation('Super NES', null)).toBe('Super NES')
    expect(formatStation(null, 'Étage')).toBe('Étage')
    expect(formatStation(null, null)).toBe('')
  })
})

describe('formatScoreWhen', () => {
  const now = new Date('2026-11-07T15:00:00+01:00')

  it('says "à l\'instant" under one minute', () => {
    expect(formatScoreWhen('2026-11-07T14:59:30+01:00', now)).toBe(
      "à l'instant",
    )
  })

  it('uses a relative form under one hour', () => {
    expect(formatScoreWhen('2026-11-07T14:48:00+01:00', now)).toBe(
      'il y a 12 min',
    )
  })

  it('shows only the time on the same day', () => {
    const label = formatScoreWhen('2026-11-07T10:32:00+01:00', now)
    expect(label).toMatch(/^\d{1,2}h\d{2}$/)
  })

  it('shows the date and the time otherwise', () => {
    const label = formatScoreWhen('2026-11-05T14:32:00+01:00', now)
    expect(label).toMatch(/nov/i)
    expect(label).toMatch(/\d{1,2}h\d{2}/)
    expect(label).toContain('à')
  })
})
