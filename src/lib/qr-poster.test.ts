import { describe, expect, it } from 'vitest'

import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  jpegToA4Pdf,
  posterFileName,
  posterFileStem,
  sheetGrid,
} from './qr-poster'

describe('qr poster', () => {
  it('is A4 at 300 DPI', () => {
    expect(POSTER_WIDTH).toBe(2480)
    expect(POSTER_HEIGHT).toBe(3508)
  })

  it('names the file after host, style and count', () => {
    expect(
      posterFileStem('https://scores.matedansleretro.fr/score', 'branded', 4),
    ).toBe('mdlr-highscores-affiche-scores-matedansleretro-fr-branded-x4')
    expect(
      posterFileName(
        'https://scores.matedansleretro.fr/score',
        'plain',
        1,
        'pdf',
      ),
    ).toBe('mdlr-highscores-affiche-scores-matedansleretro-fr-plain-x1.pdf')
  })

  it('lays out 1, 2 and 4 posters on the sheet', () => {
    expect(sheetGrid(1)).toEqual({ cols: 1, rows: 1 })
    expect(sheetGrid(2)).toEqual({ cols: 1, rows: 2 })
    expect(sheetGrid(4)).toEqual({ cols: 2, rows: 2 })
  })

  it('builds a one-page A4 PDF around a JPEG', async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])
    const pdf = jpegToA4Pdf(jpeg, 10, 10)
    expect(pdf.type).toBe('application/pdf')
    const text = new TextDecoder('latin1').decode(await pdf.arrayBuffer())
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('/MediaBox [0 0 595.28 841.89]')
    expect(text).toContain('/DCTDecode')
    expect(text).toContain('%%EOF')
  })
})
