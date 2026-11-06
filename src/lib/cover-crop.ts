import type { Area } from 'react-easy-crop'

/** Square covers match every tile (admin, public screen, player form). */
export const COVER_ASPECT = 1

/** Longest side after crop; tiles stay sharp on a projected wall. */
export const COVER_SIZE = 1024

export const COVER_QUALITY = 0.85

/** Default max zoom of react-easy-crop; raised if minZoom is already high. */
export const COVER_MAX_ZOOM = 3

export type CoverCropBackground = 'black' | 'transparent'

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

/**
 * Pixel crop that frames the whole image in an `aspect` box (letterbox).
 * Matches what react-easy-crop reports at `coverMinZoom` when
 * `restrictPosition` is false (x/y may be negative, size may exceed the media).
 */
export function coverFitCropArea(
  width: number,
  height: number,
  aspect: number = COVER_ASPECT,
): Area {
  if (width <= 0 || height <= 0 || aspect <= 0) {
    return { x: 0, y: 0, width: 1, height: 1 }
  }
  const mediaAspect = width / height
  if (mediaAspect > aspect) {
    const cropHeight = width / aspect
    return {
      x: 0,
      y: (height - cropHeight) / 2,
      width,
      height: cropHeight,
    }
  }
  const cropWidth = height * aspect
  return {
    x: (width - cropWidth) / 2,
    y: 0,
    width: cropWidth,
    height,
  }
}

/** Output side length: never upscale, never exceed `maxSize`. */
export function scaledCropSize(
  pixelCrop: Pick<Area, 'width' | 'height'>,
  maxSize: number,
) {
  const side = Math.max(pixelCrop.width, pixelCrop.height)
  return Math.max(1, Math.min(maxSize, Math.round(side)))
}

/** True when any RGBA pixel in `data` has alpha below 255. */
export function pixelDataHasAlpha(data: ArrayLike<number>) {
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 255) < 255) return true
  }
  return false
}

/**
 * Scans the decoded bitmap for a non-opaque pixel.
 * Opaque JPEG/PNG sources stay on the black + JPEG path; logos with
 * transparency (Donkey Konga) keep alpha and export as PNG.
 */
export function imageHasAlpha(
  image: Pick<HTMLImageElement, 'naturalWidth' | 'naturalHeight'> &
    CanvasImageSource,
) {
  const width = image.naturalWidth
  const height = image.naturalHeight
  if (width <= 0 || height <= 0) return false

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return false

  context.drawImage(image, 0, 0)
  const { data } = context.getImageData(0, 0, width, height)
  canvas.width = 0
  canvas.height = 0
  return pixelDataHasAlpha(data)
}

export function ensureCoverName(name: string, extension: 'jpg' | 'png') {
  const base = name.replace(/\.[^.]+$/, '') || 'cover'
  return `${base}.${extension}`
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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/jpeg' | 'image/png',
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0
        canvas.height = 0
        if (blob) resolve(blob)
        else reject(new Error('Could not encode the cover'))
      },
      type,
      quality,
    )
  })
}

/**
 * Draws `pixelCrop` onto a square canvas.
 * Opaque sources keep black letterbox bands; transparent sources leave empty
 * bands clear so PNG export preserves alpha.
 */
export function drawCoverCrop(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'naturalWidth' | 'naturalHeight'> &
    CanvasImageSource,
  pixelCrop: Area,
  size: number,
  background: CoverCropBackground = 'black',
) {
  if (background === 'transparent') {
    context.clearRect(0, 0, size, size)
  } else {
    context.fillStyle = '#000'
    context.fillRect(0, 0, size, size)
  }

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
 * Crops `imageSrc` to a square file ready for the `covers` bucket.
 * PNG when the source has alpha, otherwise JPEG (~0.85).
 * `fileName` only seeds the download base name.
 */
export async function cropCoverToFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName = 'cover.jpg',
): Promise<File> {
  const image = await loadImage(imageSrc)
  const hasAlpha = imageHasAlpha(image)
  const size = scaledCropSize(pixelCrop, COVER_SIZE)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  drawCoverCrop(
    context,
    image,
    pixelCrop,
    size,
    hasAlpha ? 'transparent' : 'black',
  )
  if (hasAlpha) {
    const blob = await canvasToBlob(canvas, 'image/png')
    return new File([blob], ensureCoverName(fileName, 'png'), {
      type: 'image/png',
    })
  }
  const blob = await canvasToBlob(canvas, 'image/jpeg', COVER_QUALITY)
  return new File([blob], ensureCoverName(fileName, 'jpg'), {
    type: 'image/jpeg',
  })
}
