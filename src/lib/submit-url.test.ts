import { describe, expect, it } from 'vitest'

import { submitScoreUrl } from './submit-url'

describe('submitScoreUrl', () => {
  it('points to /score on the current domain, without any parameter', () => {
    expect(submitScoreUrl('https://scores.matedansleretro.fr', false)).toBe(
      'https://scores.matedansleretro.fr/score',
    )
    expect(
      submitScoreUrl('https://scores.preview.matedansleretro.fr', false),
    ).toBe('https://scores.preview.matedansleretro.fr/score')
  })

  it('keeps the port of a local server', () => {
    expect(submitScoreUrl('http://192.168.1.20:3000', false)).toBe(
      'http://192.168.1.20:3000/score',
    )
  })

  it('keeps the phone on the demo data in mock mode', () => {
    expect(submitScoreUrl('http://localhost:3000', true)).toBe(
      'http://localhost:3000/score?mock=1',
    )
  })

  it('adds ?game=<slug> when a game is known', () => {
    expect(
      submitScoreUrl('https://scores.matedansleretro.fr', false, {
        gameSlug: 'duck-hunt',
      }),
    ).toBe('https://scores.matedansleretro.fr/score?game=duck-hunt')
  })

  it('keeps mock and game together', () => {
    expect(
      submitScoreUrl('http://localhost:3000', true, {
        gameSlug: 'super-mario-bros',
      }),
    ).toBe('http://localhost:3000/score?mock=1&game=super-mario-bros')
  })

  it('ignores an empty game slug', () => {
    expect(
      submitScoreUrl('https://scores.matedansleretro.fr', false, {
        gameSlug: null,
      }),
    ).toBe('https://scores.matedansleretro.fr/score')
    expect(
      submitScoreUrl('https://scores.matedansleretro.fr', false, {
        gameSlug: '',
      }),
    ).toBe('https://scores.matedansleretro.fr/score')
  })
})
