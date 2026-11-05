import type { Area } from 'react-easy-crop'

/** Square covers match every tile (admin, public screen, player form). */
export const COVER_ASPECT = 1

/** Longest side after crop; tiles stay sharp on a projected wall. */
export const COVER_SIZE = 1024

export const COVER_QUALITY = 0.85

/** Output side length: never upscale, never exceed `maxSize`. */
export function scaledCropSize(
  pixelCrop: Pick<Area, 'width' | 'height'>,
  maxSize: number,
) {
  const side = Math.max(pixelCrop.width, pixelCrop.height)
  return Math.max(1, Math.min(maxSize, Math.round(side)))
}

function ensureJpgName(name: string) {
  const base = name.replace(/\.[^.]+$/, '') || 'cover'
  return `${base}.jpg`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () =>
      reject(new Error('Could not load the cover image')),
    )
    image.src = src
  })
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0
        canvas.height = 0
        if (blob) resolve(blob)
        else reject(new Error('Could not encode the cover'))
      },
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Crops `imageSrc` to a square JPEG ready for the `covers` bucket.
 * `fileName` only seeds the download name; the extension is always `.jpg`.
 */
export async function cropCoverToFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName = 'cover.jpg',
): Promise<File> {
  const image = await loadImage(imageSrc)
  const size = scaledCropSize(pixelCrop, COVER_SIZE)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  )
  const blob = await canvasToJpeg(canvas, COVER_QUALITY)
  return new File([blob], ensureJpgName(fileName), { type: 'image/jpeg' })
}
