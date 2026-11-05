// Pixel art on a 16-unit grid, as (x, y, width, height) rectangles. Shared by
// the SVG components and the canvas that draws the Instagram visual.

export type PixelRect = readonly [number, number, number, number]

/** Cup: bowl, handles, stem, base. */
export const CUP: ReadonlyArray<PixelRect> = [
  [3, 2, 10, 2],
  [4, 4, 8, 4],
  [5, 8, 6, 1],
  [1, 3, 1, 4],
  [2, 7, 2, 1],
  [14, 3, 1, 4],
  [12, 7, 2, 1],
  [7, 9, 2, 2],
  [5, 11, 6, 1],
  [4, 12, 8, 2],
]

/** Player bust: head, neck, shoulders. */
export const BUST: ReadonlyArray<PixelRect> = [
  [6, 1, 4, 1],
  [5, 2, 6, 1],
  [4, 3, 8, 5],
  [5, 8, 6, 1],
  [6, 9, 4, 1],
  [7, 10, 2, 1],
  [4, 11, 8, 1],
  [2, 12, 12, 3],
]

/** Bandit mask over the eyes, wider than the head; the eyes are cut out of it. */
export const MASK: ReadonlyArray<PixelRect> = [
  [3, 4, 10, 2],
  [13, 3, 1, 1],
  [13, 6, 1, 1],
]

export const EYES: ReadonlyArray<PixelRect> = [
  [5, 5, 2, 1],
  [9, 5, 2, 1],
]
