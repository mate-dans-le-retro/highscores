import { describe, expect, it } from 'vitest'

import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  chunkPosterGames,
  jpegPagesToA4Pdf,
  jpegToA4Pdf,
  posterFileName,
  posterFileStem,
  sheetGrid,
} from './qr-poster'
import type { PosterGame } from './qr-poster'

const sampleGames: Array<PosterGame> = [
  { slug: 'duck-hunt', name: 'Duck Hunt', shortLabel: 'DH', coverUrl: null },
  {
    slug: 'super-mario-bros',
    name: 'Super Mario Bros.',
    shortLabel: 'SMB',
    coverUrl: null,
  },
  {
    slug: 'guitar-hero',
    name: 'Guitar Hero',
    shortLabel: 'GH',
    coverUrl: null,
  },
  {
    slug: 'donkey-konga',
    name: 'Donkey Konga',
    shortLabel: 'DKJ',
    coverUrl: null,
  },
]

describe('qr poster', () => {
  it('is A4 at 300 DPI', () => {
    expect(POSTER_WIDTH).toBe(2480)
    expect(POSTER_HEIGHT).toBe(3508)
  })

  it('names the file after host, style, count and kind', () => {
    expect(
      posterFileStem('https://scores.matedansleretro.fr/score', 'branded', 4),
    ).toBe('mdlr-highscores-affiche-scores-matedansleretro-fr-branded-x4')
    expect(
      posterFileName(
        'https://scores.matedansleretro.fr/score',
        'plain',
        2,
        'pdf',
        'games',
      ),
    ).toBe(
      'mdlr-highscores-affiche-scores-matedansleretro-fr-plain-x2-jeux.pdf',
    )
  })

  it('lays out 1, 2 and 4 posters on the sheet', () => {
    expect(sheetGrid(1)).toEqual({ cols: 1, rows: 1 })
    expect(sheetGrid(2)).toEqual({ cols: 1, rows: 2 })
    expect(sheetGrid(4)).toEqual({ cols: 2, rows: 2 })
  })

  it('chunks selected games into poster pages', () => {
    expect(chunkPosterGames([], 4)).toEqual([])
    expect(chunkPosterGames(sampleGames, 4)).toEqual([sampleGames])
    expect(chunkPosterGames(sampleGames, 2)).toEqual([
      sampleGames.slice(0, 2),
      sampleGames.slice(2, 4),
    ])
    expect(chunkPosterGames(sampleGames, 1)).toHaveLength(4)
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

  it('builds a multipage A4 PDF', async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])
    const pdf = jpegPagesToA4Pdf([
      { jpeg, widthPx: 10, heightPx: 10 },
      { jpeg, widthPx: 10, heightPx: 10 },
    ])
    const text = new TextDecoder('latin1').decode(await pdf.arrayBuffer())
    expect(text).toContain('/Count 2')
    expect(text).toContain('%%EOF')
  })
})
