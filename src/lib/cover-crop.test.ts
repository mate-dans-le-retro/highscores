import { describe, expect, it } from 'vitest'

import {
  COVER_SIZE,
  coverMaxZoom,
  coverMinZoom,
  scaledCropSize,
} from './cover-crop'

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

describe('coverMinZoom', () => {
  it('stays at 1 for a square image', () => {
    expect(coverMinZoom(512, 512)).toBe(1)
  })

  it('zooms out for a wide landscape (Guitar Hero style)', () => {
    expect(coverMinZoom(1600, 600)).toBeCloseTo(0.375)
  })

  it('zooms out for a tall portrait', () => {
    expect(coverMinZoom(600, 1600)).toBeCloseTo(0.375)
  })

  it('rejects empty sizes', () => {
    expect(coverMinZoom(0, 100)).toBe(1)
  })
})

describe('coverMaxZoom', () => {
  it('keeps the default ceiling when minZoom is below it', () => {
    expect(coverMaxZoom(0.375)).toBe(3)
  })

  it('never sits under minZoom', () => {
    expect(coverMaxZoom(4)).toBe(4)
  })
})
