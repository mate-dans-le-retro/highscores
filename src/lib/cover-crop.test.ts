import { describe, expect, it, vi } from 'vitest'

import {
  COVER_SIZE,
  coverFitCropArea,
  coverMaxZoom,
  coverMinZoom,
  drawCoverCrop,
  scaledCropSize,
} from './cover-crop'

function mockContext() {
  const drawImage = vi.fn()
  const fillRect = vi.fn()
  const context = {
    fillStyle: '',
    fillRect,
    drawImage,
  } as unknown as CanvasRenderingContext2D
  return { context, drawImage, fillRect }
}

function fakeImage(naturalWidth: number, naturalHeight: number) {
  return { naturalWidth, naturalHeight } as HTMLImageElement
}

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

describe('coverFitCropArea', () => {
  it('letterboxes a landscape Guitar Hero cover in a square', () => {
    expect(coverFitCropArea(1600, 600)).toEqual({
      x: 0,
      y: -500,
      width: 1600,
      height: 1600,
    })
  })

  it('pillarboxes a tall portrait in a square', () => {
    expect(coverFitCropArea(600, 1600)).toEqual({
      x: -500,
      y: 0,
      width: 1600,
      height: 1600,
    })
  })

  it('matches a square image', () => {
    expect(coverFitCropArea(800, 800)).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 800,
    })
  })
})

describe('drawCoverCrop', () => {
  it('letterboxes a zoomed-out landscape crop with black bands', () => {
    const { context, drawImage, fillRect } = mockContext()
    const crop = coverFitCropArea(1600, 600)
    const size = scaledCropSize(crop, COVER_SIZE)

    drawCoverCrop(context, fakeImage(1600, 600), crop, size)

    expect(context.fillStyle).toBe('#000')
    expect(fillRect).toHaveBeenCalledWith(0, 0, size, size)
    expect(size).toBe(COVER_SIZE)
    // Full width drawn, vertically centered: (1024 - 384) / 2 = 320.
    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1600,
      600,
      0,
      320,
      1024,
      384,
    )
  })

  it('does not leave black when the crop sits inside the image', () => {
    const { context, drawImage } = mockContext()
    const crop = { x: 500, y: 0, width: 600, height: 600 }

    drawCoverCrop(context, fakeImage(1600, 600), crop, 600)

    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      500,
      0,
      600,
      600,
      0,
      0,
      600,
      600,
    )
  })
})
