import type { Area } from 'react-easy-crop'

/** Square covers match every tile (admin, public screen, player form). */
export const COVER_ASPECT = 1

/** Longest side after crop; tiles stay sharp on a projected wall. */
export const COVER_SIZE = 1024

export const COVER_QUALITY = 0.85

/** Default max zoom of react-easy-crop; raised if minZoom is already high. */
export const COVER_MAX_ZOOM = 3

/**
 * Lowest zoom so the whole media fits inside a crop of `aspect` (letterbox).
 * Landscape Guitar Hero art needs this under 1; a square stays at 1.
 */
export function coverMinZoom(
  width: number,
  height: number,
  aspect: number = COVER_ASPECT,
) {
  if (width <= 0 || height <= 0 || aspect <= 0) return 1
  const mediaAspect = width / height
  return mediaAspect > aspect ? aspect / mediaAspect : mediaAspect / aspect
}

export function coverMaxZoom(
  minZoom: number,
  maxZoom: number = COVER_MAX_ZOOM,
) {
  return Math.max(maxZoom, minZoom)
}

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
 * Draws `pixelCrop` onto a square canvas. When the crop is larger than the
 * image (zoom out to fit a wide cover), empty bands stay black.
 */
export function drawCoverCrop(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'naturalWidth' | 'naturalHeight'> &
    CanvasImageSource,
  pixelCrop: Area,
  size: number,
) {
  context.fillStyle = '#000'
  context.fillRect(0, 0, size, size)

  const scaleX = size / pixelCrop.width
  const scaleY = size / pixelCrop.height
  const srcLeft = Math.max(0, pixelCrop.x)
  const srcTop = Math.max(0, pixelCrop.y)
  const srcRight = Math.min(image.naturalWidth, pixelCrop.x + pixelCrop.width)
  const srcBottom = Math.min(
    image.naturalHeight,
    pixelCrop.y + pixelCrop.height,
  )
  if (srcRight <= srcLeft || srcBottom <= srcTop) return

  context.drawImage(
    image,
    srcLeft,
    srcTop,
    srcRight - srcLeft,
    srcBottom - srcTop,
    (srcLeft - pixelCrop.x) * scaleX,
    (srcTop - pixelCrop.y) * scaleY,
    (srcRight - srcLeft) * scaleX,
    (srcBottom - srcTop) * scaleY,
  )
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
  drawCoverCrop(context, image, pixelCrop, size)
  const blob = await canvasToJpeg(canvas, COVER_QUALITY)
  return new File([blob], ensureJpgName(fileName), { type: 'image/jpeg' })
}
