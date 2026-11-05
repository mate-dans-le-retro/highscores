import { describe, expect, it } from 'vitest'

import { parseScoreInput } from './parse-score'

describe('parseScoreInput', () => {
  it('parses French points', () => {
    expect(parseScoreInput('128 400', 'points')).toBe(128_400)
    expect(parseScoreInput('128400', 'points')).toBe(128_400)
  })

  it('parses time strings as milliseconds', () => {
    expect(parseScoreInput(`1'32"48`, 'time')).toBe(92_480)
    expect(parseScoreInput('1:32.48', 'time')).toBe(92_480)
  })

  it('rejects empty or invalid values', () => {
    expect(parseScoreInput('', 'points')).toBeNull()
    expect(parseScoreInput('abc', 'points')).toBeNull()
    expect(parseScoreInput(`1'99"00`, 'time')).toBeNull()
  })
})
