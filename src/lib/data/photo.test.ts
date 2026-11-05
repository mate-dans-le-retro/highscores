import { describe, expect, it, vi } from 'vitest'

import {
  hasHeifSignature,
  isHeif,
  isOriginalPhoto,
  photoFileType,
  preparePhoto,
  scaledSize,
} from './photo'
import type { DecodedPhoto, PhotoCodec } from './photo'

/** First bytes of an ISO BMFF file: a `ftyp` box with its brands. */
function ftyp(major: string, compatible: Array<string> = []) {
  const brands = [major, '\0\0\0\0', ...compatible].join('')
  const size = 8 + brands.length
  const bytes = new Uint8Array(size)
  new DataView(bytes.buffer).setUint32(0, size)
  bytes.set(
    [...'ftyp'].map((c) => c.charCodeAt(0)),
    4,
  )
  bytes.set(
    [...brands].map((c) => c.charCodeAt(0)),
    8,
  )
  return bytes
}

// What an iPhone writes: major brand heic, compatible mif1 heic miaf.
const IPHONE_HEIC = ftyp('heic', ['mif1', 'heic', 'miaf'])
const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1,
])

const decoded = (width = 4032, height = 3024): DecodedPhoto => ({
  width,
  height,
  source: {} as CanvasImageSource,
  close: vi.fn(),
})

function fakeCodec(overrides: Partial<PhotoCodec> = {}): PhotoCodec {
  return {
    decode: vi.fn(() => Promise.resolve(decoded())),
    decodeHeif: vi.fn(() => Promise.resolve(decoded())),
    encode: vi.fn((_photo, maxSize: number) =>
      Promise.resolve(new Blob([`jpeg-${maxSize}`], { type: 'image/jpeg' })),
    ),
    ...overrides,
  }
}

const refuse = () => Promise.reject(new Error('cannot decode'))

describe('HEIC detection', () => {
  it('reads the ftyp brands', () => {
    expect(hasHeifSignature(IPHONE_HEIC)).toBe(true)
    expect(hasHeifSignature(ftyp('heix'))).toBe(true)
    expect(hasHeifSignature(ftyp('mif1', ['heic']))).toBe(true)
    expect(hasHeifSignature(ftyp('isom', ['heic']))).toBe(true)
  })

  it('leaves other files alone', () => {
    expect(hasHeifSignature(JPEG)).toBe(false)
    expect(hasHeifSignature(ftyp('isom', ['mp41', 'avc1']))).toBe(false)
    expect(hasHeifSignature(new Uint8Array(4))).toBe(false)
  })

  it('trusts the type, then the extension, then the bytes', async () => {
    expect(await isHeif(new Blob([JPEG], { type: 'image/heic' }))).toBe(true)
    expect(await isHeif(new Blob([JPEG], { type: 'image/HEIF' }))).toBe(true)
    expect(await isHeif(new File([JPEG], 'IMG_0001.HEIC'))).toBe(true)
    // Some phones and desktops send no type and a generic name.
    expect(await isHeif(new File([IPHONE_HEIC], 'photo'))).toBe(true)
    expect(await isHeif(new File([JPEG], 'image.jpg'))).toBe(false)
    expect(await isHeif(new Blob([JPEG], { type: 'image/jpeg' }))).toBe(false)
  })
})

describe('preparePhoto', () => {
  it('encodes a proof and a thumbnail from one decode', async () => {
    const codec = fakeCodec()
    const photo = await preparePhoto(new File([JPEG], 'image.jpg'), { codec })
    expect(await photo.proof.text()).toBe('jpeg-2000')
    expect(await photo.thumb.text()).toBe('jpeg-800')
    expect(codec.decode).toHaveBeenCalledTimes(1)
    expect(codec.decodeHeif).not.toHaveBeenCalled()
    expect(isOriginalPhoto(photo)).toBe(false)
  })

  it('converts a HEIC the browser cannot read', async () => {
    const codec = fakeCodec({ decode: vi.fn(refuse) })
    const onConvert = vi.fn()
    const photo = await preparePhoto(new File([IPHONE_HEIC], 'IMG_0001.HEIC'), {
      codec,
      onConvert,
    })
    expect(codec.decodeHeif).toHaveBeenCalledTimes(1)
    expect(onConvert).toHaveBeenCalledTimes(1)
    expect(photo.proof.type).toBe('image/jpeg')
    expect(await photo.thumb.text()).toBe('jpeg-800')
  })

  it('keeps a HEIC as is when even the converter fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const original = new File([IPHONE_HEIC], 'IMG_0001.HEIC')
    const codec = fakeCodec({
      decode: vi.fn(refuse),
      decodeHeif: vi.fn(refuse),
    })
    const photo = await preparePhoto(original, { codec })
    expect(photo.proof).toBe(original)
    expect(photo.thumb).toBe(original)
    expect(isOriginalPhoto(photo)).toBe(true)
  })

  it('keeps an unreadable non-HEIC file without trying the converter', async () => {
    const original = new File([JPEG.slice(0, 4)], 'broken.jpg')
    const codec = fakeCodec({ decode: vi.fn(refuse) })
    const photo = await preparePhoto(original, { codec })
    expect(codec.decodeHeif).not.toHaveBeenCalled()
    expect(photo.proof).toBe(original)
  })

  it('keeps the original when encoding fails, and frees the decoded image', async () => {
    const image = decoded()
    const original = new File([JPEG], 'image.jpg')
    const codec = fakeCodec({
      decode: vi.fn(() => Promise.resolve(image)),
      encode: vi.fn(refuse),
    })
    const photo = await preparePhoto(original, { codec })
    expect(photo.proof).toBe(original)
    expect(image.close).toHaveBeenCalled()
  })
})

describe('photo helpers', () => {
  it('shrinks on the longest side, never enlarges', () => {
    expect(scaledSize(4032, 3024, 2000)).toEqual({ width: 2000, height: 1500 })
    expect(scaledSize(3024, 4032, 800)).toEqual({ width: 600, height: 800 })
    expect(scaledSize(640, 480, 2000)).toEqual({ width: 640, height: 480 })
  })

  it('names stored files after what they are', () => {
    expect(photoFileType(new Blob([], { type: 'image/jpeg' }))).toEqual({
      extension: 'jpg',
      contentType: 'image/jpeg',
    })
    expect(photoFileType(new File([], 'IMG_0001.HEIC'))).toEqual({
      extension: 'heic',
      contentType: 'image/heic',
    })
    expect(
      photoFileType(new File([], 'photo.png', { type: 'image/png' })),
    ).toEqual({ extension: 'png', contentType: 'image/png' })
  })
})
