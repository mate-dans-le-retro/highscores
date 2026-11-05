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
})
