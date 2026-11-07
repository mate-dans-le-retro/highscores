import { describe, expect, it } from 'vitest'

import { parseScoreInput, parseTimeInput } from './parse-score'

const time = (raw: string) => parseScoreInput(raw, 'time')

describe('parseScoreInput', () => {
  it('parses French points', () => {
    expect(parseScoreInput('128 400', 'points')).toBe(128_400)
    expect(parseScoreInput('128400', 'points')).toBe(128_400)
  })

  it('rejects empty or invalid points', () => {
    expect(parseScoreInput('', 'points')).toBeNull()
    expect(parseScoreInput('abc', 'points')).toBeNull()
  })

  it('rejects points with more than 15 digits', () => {
    expect(parseScoreInput('1'.repeat(15), 'points')).toBe(Number('1'.repeat(15)))
    expect(parseScoreInput('1'.repeat(16), 'points')).toBeNull()
  })
})

describe('parseTimeInput', () => {
  it('reads digits alone like a stopwatch, from the right', () => {
    expect(time('13248')).toBe(92_480)
    expect(time('013248')).toBe(92_480)
    expect(time('3248')).toBe(32_480)
    expect(time('48')).toBe(480)
    expect(time('1 32 48')).toBe(92_480)
  })

  it('reads the formats printed by games and typed by players', () => {
    expect(time(`1'32"48`)).toBe(92_480)
    expect(time(`1'32''48`)).toBe(92_480)
    expect(time('1:32.48')).toBe(92_480)
    expect(time('1:32,48')).toBe(92_480)
    expect(time('1:32:48')).toBe(92_480)
    expect(time('1.32.48')).toBe(92_480)
    expect(time(`1' 32" 48`)).toBe(92_480)
    expect(time('1min32s48')).toBe(92_480)
  })

  it('accepts the typographic quotes of phone keyboards', () => {
    expect(time('1’32”48')).toBe(92_480)
    expect(time('1′32″48')).toBe(92_480)
  })

  it('reads partial times', () => {
    expect(time('1:32')).toBe(92_000)
    expect(time(`1'32`)).toBe(92_000)
    expect(time(`1'`)).toBe(60_000)
    expect(time(`32"48`)).toBe(32_480)
    expect(time('32,5')).toBe(32_500)
    expect(time('92.48')).toBe(92_480)
  })

  it('reads tenths, hundredths and milliseconds', () => {
    expect(time(`1'32"4`)).toBe(92_400)
    expect(time('1:32.485')).toBe(92_485)
  })

  it('reads hours', () => {
    expect(time(`1h02'03"45`)).toBe(3_723_450)
    expect(time('1:02:03.45')).toBe(3_723_450)
    expect(time('1h30')).toBe(5_400_000)
  })

  it('says why a time is refused', () => {
    expect(parseTimeInput(`1'75"00`)).toEqual({ ok: false, error: 'seconds' })
    expect(parseTimeInput('17500')).toEqual({ ok: false, error: 'seconds' })
    expect(parseTimeInput('1h75')).toEqual({ ok: false, error: 'minutes' })
    expect(parseTimeInput('0')).toEqual({ ok: false, error: 'zero' })
    expect(parseTimeInput(`0'00"00`)).toEqual({ ok: false, error: 'zero' })
    expect(parseTimeInput('vite')).toEqual({ ok: false, error: 'format' })
    expect(parseTimeInput(`'32`)).toEqual({ ok: false, error: 'format' })
    expect(parseTimeInput('1::32')).toEqual({ ok: false, error: 'format' })
    expect(parseTimeInput(`32"1'`)).toEqual({ ok: false, error: 'format' })
    expect(parseTimeInput('1:32.4855')).toEqual({ ok: false, error: 'format' })
    expect(parseTimeInput('123456789')).toEqual({ ok: false, error: 'format' })
  })
})
