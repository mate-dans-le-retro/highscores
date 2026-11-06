import { describe, expect, it } from 'vitest'

import { POSTER_HEIGHT, POSTER_WIDTH, posterFileName } from './qr-poster'

describe('qr poster', () => {
  it('is A4 at 300 DPI', () => {
    expect(POSTER_WIDTH).toBe(2480)
    expect(POSTER_HEIGHT).toBe(3508)
  })

  it('names the file after the host the QR points to', () => {
    expect(posterFileName('https://scores.matedansleretro.fr/score')).toBe(
      'mdlr-highscores-affiche-scores-matedansleretro-fr.png',
    )
    expect(posterFileName('not a url')).toBe('mdlr-highscores-affiche.png')
  })
})
