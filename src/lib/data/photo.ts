/** Proof kept for the admin (~2000 px) and thumbnail for the public screen (~800 px). */
export interface PreparedPhoto {
  proof: Blob
  thumb: Blob
}

/** MIME types allowed in the photos Storage bucket (no SVG). */
export const PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

/** MIME types allowed in the covers Storage bucket (no SVG). */
export const COVER_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const PHOTO_ACCEPT = [...PHOTO_MIME_TYPES, '.heic', '.heif'].join(',')
export const COVER_ACCEPT = COVER_MIME_TYPES.join(',')

const PHOTO_MIME_SET = new Set<string>(PHOTO_MIME_TYPES)
const COVER_MIME_SET = new Set<string>(COVER_MIME_TYPES)

export function isAllowedPhotoMime(type: string) {
  return PHOTO_MIME_SET.has(type.toLowerCase())
}

export function isAllowedCoverMime(type: string) {
  return COVER_MIME_SET.has(type.toLowerCase())
}

export const PROOF_SIZE = { maxSize: 2000, quality: 0.85 }
export const THUMB_SIZE = { maxSize: 800, quality: 0.7 }

/** Anything canvas can draw and that knows its own size. */
export interface DecodedPhoto {
  width: number
  height: number
  source: CanvasImageSource
  close: () => void
}

export interface PhotoCodec {
  /** What the browser decodes by itself (JPEG, PNG, WebP, HEIC in Safari 17+). */
  decode: (photo: Blob) => Promise<DecodedPhoto>
  /** WebAssembly HEIC decoder, only loaded when the browser gave up. */
  decodeHeif: (photo: Blob) => Promise<DecodedPhoto>
  encode: (
    photo: DecodedPhoto,
    maxSize: number,
    quality: number,
  ) => Promise<Blob>
}

const HEIF_MIME = /^image\/hei[cf](-sequence)?$/i
const HEIF_EXTENSION = /\.(heic|heif|hif)$/i
// Brands of the `ftyp` box for HEVC-coded HEIF (iPhone photos use `heic`).
// `mif1` / `msf1` are generic HEIF brands: AVIF uses them too, but browsers
// decode AVIF natively, so it never reaches the HEIC decoder.
const HEIF_BRANDS = new Set([
  'heic',
  'heix',
  'heim',
  'heis',
  'hevc',
  'hevx',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
])

/**
 * Reads the ISO BMFF `ftyp` box: bytes 4–7 are "ftyp", then the major brand,
 * a version, and the compatible brands up to the end of the box.
 */
export function hasHeifSignature(bytes: Uint8Array) {
  if (bytes.length < 12) return false
  const text = (from: number) =>
    String.fromCharCode(...bytes.subarray(from, from + 4))
  if (text(4) !== 'ftyp') return false
  const boxSize =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
  const end = Math.min(bytes.length, boxSize || bytes.length)
  const brands = [text(8)]
  for (let offset = 16; offset + 4 <= end; offset += 4)
    brands.push(text(offset))
  return brands.some((brand) => HEIF_BRANDS.has(brand))
}

/** Phones and desktops label HEIC inconsistently (or not at all): sniff the bytes too. */
export async function isHeif(photo: Blob) {
  if (HEIF_MIME.test(photo.type)) return true
  if (photo instanceof File && HEIF_EXTENSION.test(photo.name)) return true
  const head = new Uint8Array(await photo.slice(0, 64).arrayBuffer())
  return hasHeifSignature(head)
}

export function scaledSize(width: number, height: number, maxSize: number) {
  const scale = Math.min(1, maxSize / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function decodeWithBrowser(photo: Blob): Promise<DecodedPhoto> {
  try {
    const bitmap = await createImageBitmap(photo)
    return {
      width: bitmap.width,
      height: bitmap.height,
      source: bitmap,
      close: () => bitmap.close(),
    }
  } catch {
    // Safari 15–16 only half supports createImageBitmap: try an <img>.
    const url = URL.createObjectURL(photo)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        source: image,
        close: () => URL.revokeObjectURL(url),
      }
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
  }
}

async function decodeHeifWithWasm(photo: Blob): Promise<DecodedPhoto> {
  // ~3 MB of libheif compiled to WebAssembly: fetched on the first HEIC only.
  const { heicTo } = await import('heic-to/csp')
  const bitmap = await heicTo({ blob: photo, type: 'bitmap' })
  return {
    width: bitmap.width,
    height: bitmap.height,
    source: bitmap,
    close: () => bitmap.close(),
  }
}

function encodeJpeg(photo: DecodedPhoto, maxSize: number, quality: number) {
  const { width, height } = scaledSize(photo.width, photo.height, maxSize)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('Canvas 2D is not available'))
  context.drawImage(photo.source, 0, 0, width, height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0
        canvas.height = 0
        if (blob) resolve(blob)
        else reject(new Error('Could not encode the photo'))
      },
      'image/jpeg',
      quality,
    )
  })
}

export const browserPhotoCodec: PhotoCodec = {
  decode: decodeWithBrowser,
  decodeHeif: decodeHeifWithWasm,
  encode: encodeJpeg,
}

export interface PreparePhotoOptions {
  codec?: PhotoCodec
  /** Called before the slow path (loading and running the HEIC decoder). */
  onConvert?: () => void
}

async function encodeBoth(
  codec: PhotoCodec,
  decoded: DecodedPhoto,
): Promise<PreparedPhoto> {
  try {
    const proof = await codec.encode(
      decoded,
      PROOF_SIZE.maxSize,
      PROOF_SIZE.quality,
    )
    const thumb = await codec.encode(
      decoded,
      THUMB_SIZE.maxSize,
      THUMB_SIZE.quality,
    )
    return { proof, thumb }
  } finally {
    decoded.close()
  }
}

/**
 * Turns any phone photo into a JPEG proof and thumbnail, readable in every
 * browser. The photo is the proof, so it is never refused: HEIC goes through
 * the WebAssembly decoder when the browser cannot read it, and if even that
 * fails, the original file is kept as both versions.
 */
export async function preparePhoto(
  photo: Blob,
  { codec = browserPhotoCodec, onConvert }: PreparePhotoOptions = {},
): Promise<PreparedPhoto> {
  try {
    return await encodeBoth(codec, await codec.decode(photo))
  } catch {
    // The browser cannot read it: maybe a HEIC outside Safari.
  }
  try {
    if (await isHeif(photo)) {
      onConvert?.()
      return await encodeBoth(codec, await codec.decodeHeif(photo))
    }
  } catch (error) {
    console.warn('HEIC conversion failed, keeping the original photo', error)
  }
  return { proof: photo, thumb: photo }
}

/** Extension and Content-Type for the photos bucket (jpeg/png/webp/heic/heif). */
export function photoFileType(photo: Blob) {
  if (photo.type === 'image/jpeg')
    return { extension: 'jpg', contentType: 'image/jpeg' }
  if (photo.type === 'image/png')
    return { extension: 'png', contentType: 'image/png' }
  if (photo.type === 'image/webp')
    return { extension: 'webp', contentType: 'image/webp' }
  const fromName =
    photo instanceof File ? photo.name.split('.').pop()?.toLowerCase() : null
  const extension =
    fromName && /^[a-z0-9]{1,5}$/.test(fromName) ? fromName : 'jpg'
  if (HEIF_EXTENSION.test(`.${extension}`) || HEIF_MIME.test(photo.type)) {
    return {
      extension:
        extension === 'heif' || extension === 'hif' ? extension : 'heic',
      contentType: photo.type === 'image/heif' ? 'image/heif' : 'image/heic',
    }
  }
  const contentType = photo.type || 'image/jpeg'
  if (!isAllowedPhotoMime(contentType)) {
    throw new Error('Unsupported photo type (use JPEG, PNG, WebP or HEIC)')
  }
  return { extension, contentType }
}

/** True when preparePhoto had to keep the original file. */
export function isOriginalPhoto({ proof, thumb }: PreparedPhoto) {
  return proof === thumb
}

/**
 * Object URL of a photo an <img> can show. A HEIC kept as is (Chrome, Firefox
 * and Edge cannot show it) is converted on the fly, so volunteers can still
 * read the proof; null when nothing works.
 */
export async function displayablePhotoUrl(
  photo: Blob,
  codec: PhotoCodec = browserPhotoCodec,
): Promise<string | null> {
  if (!(await isHeif(photo))) return URL.createObjectURL(photo)
  try {
    const decoded = await codec
      .decode(photo)
      .catch(() => codec.decodeHeif(photo))
    try {
      const jpeg = await codec.encode(
        decoded,
        PROOF_SIZE.maxSize,
        PROOF_SIZE.quality,
      )
      return URL.createObjectURL(jpeg)
    } finally {
      decoded.close()
    }
  } catch {
    return null
  }
}
