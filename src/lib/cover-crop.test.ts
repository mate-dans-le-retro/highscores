import { describe, expect, it } from 'vitest'

import { COVER_SIZE, scaledCropSize } from './cover-crop'

describe('scaledCropSize', () => {
  it('keeps a small crop as-is', () => {
    expect(scaledCropSize({ width: 200, height: 200 }, COVER_SIZE)).toBe(200)
  })

  it('caps a large crop at maxSize', () => {
    expect(scaledCropSize({ width: 4000, height: 4000 }, COVER_SIZE)).toBe(
      COVER_SIZE,
    )
  })

  it('uses the longer side of a non-square area', () => {
    expect(scaledCropSize({ width: 800, height: 600 }, COVER_SIZE)).toBe(800)
  })
})
