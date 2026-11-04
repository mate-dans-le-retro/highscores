import { describe, expect, it } from 'vitest'

import { formatScore, formatStation } from './format'

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
