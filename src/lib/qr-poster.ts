import { encode } from 'uqr'

import { pixelCaps } from './format'

/**
 * Printable A4 poster sheet for the submission QR. Drawn at 300 DPI, then
 * downloaded as PDF (preferred) or PNG.
 */

export const POSTER_WIDTH = 2480
export const POSTER_HEIGHT = 3508

/** A4 width / height in PDF points (1/72"). */
export const A4_WIDTH_PT = 595.28
export const A4_HEIGHT_PT = 841.89

export type PosterStyle = 'branded' | 'plain'
export type PostersPerPage = 1 | 2 | 4

export const POSTER_STYLES: Array<{
  value: PosterStyle
  label: string
  hint: string
}> = [
  {
    value: 'branded',
    label: 'Full MDLR',
    hint: 'Fond violet et motif pixel.',
  },
  {
    value: 'plain',
    label: 'Économe en encre',
    hint: 'Fond blanc, sans motif.',
  },
]

export const POSTERS_PER_PAGE: Array<PostersPerPage> = [1, 2, 4]

const LOGO_ON_DARK_SRC = '/mdlr-logo-couleur-fond-sombre.svg'
const LOGO_ON_LIGHT_SRC = '/mdlr-logo.svg'
const BACKGROUND_SRC = '/pixel-background.svg'
const PIXEL_FONT = '"Press Start 2P"'
const SANS_FONT = 'Montserrat'
const GAP = 36

const TOKEN_NAMES = [
  'brand-pink',
  'brand-purple',
  'surface-base',
  'ink-accent',
  'ink-inverse',
  'opacity-grid',
] as const

type TokenName = (typeof TOKEN_NAMES)[number]
type Tokens = Record<TokenName, string>

function readTokens(theme: 'arcade' = 'arcade'): Tokens {
  const probe = document.createElement('div')
  probe.dataset.theme = theme
  probe.hidden = true
  document.body.append(probe)
  const style = getComputedStyle(probe)
  const tokens = Object.fromEntries(
    TOKEN_NAMES.map((name) => [
      name,
      style.getPropertyValue(`--${name}`).trim(),
    ]),
  ) as Tokens
  probe.remove()
  return tokens
}

async function loadImage(src: string) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  await image.decode()
  return image
}

/** SVG logos without width/height refuse to paint on some canvases. */
async function loadLogo(src: string) {
  const text = await (await fetch(src)).text()
  const sized = /<svg[^>]*\swidth=/.test(text)
    ? text
    : text.replace('<svg', '<svg width="901" height="496"')
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface PosterAssets {
  logoOnDark: HTMLImageElement | null
  logoOnLight: HTMLImageElement | null
  background: HTMLImageElement | null
}

let staticAssets: Promise<PosterAssets> | null = null

export function loadPosterAssets(): Promise<PosterAssets> {
  staticAssets ??= Promise.all([
    loadLogo(LOGO_ON_DARK_SRC).catch(() => null),
    loadLogo(LOGO_ON_LIGHT_SRC).catch(() => null),
    loadImage(BACKGROUND_SRC).catch(() => null),
    document.fonts
      .load(`48px ${PIXEL_FONT}`, 'A TOI DE JOUER HIGHSCORES')
      .catch(() => []),
    document.fonts.load(`700 40px ${SANS_FONT}`).catch(() => []),
    document.fonts.load(`600 32px ${SANS_FONT}`).catch(() => []),
  ]).then(([logoOnDark, logoOnLight, background]) => ({
    logoOnDark,
    logoOnLight,
    background,
  }))
  return staticAssets
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  )
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  )
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  dark: string,
  light: string,
) {
  const { data, size: modules } = encode(value, { ecc: 'M', border: 4 })
  const module = size / modules
  ctx.fillStyle = light
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = dark
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (data[row]?.[col]) {
        ctx.fillRect(
          x + col * module,
          y + row * module,
          module + 0.5,
          module + 0.5,
        )
      }
    }
  }
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  max: number,
  min: number,
  width: number,
) {
  for (let size = max; size >= min; size -= 2) {
    ctx.font = font(size)
    if (ctx.measureText(text).width <= width) return size
  }
  ctx.font = font(min)
  return min
}

function displayHost(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, '')
  } catch {
    return url.replace(/^https?:\/\//, '')
  }
}

export function sheetGrid(perPage: PostersPerPage) {
  if (perPage === 1) return { cols: 1, rows: 1 }
  if (perPage === 2) return { cols: 1, rows: 2 }
  return { cols: 2, rows: 2 }
}

/** File stem shared by PNG and PDF downloads. */
export function posterFileStem(
  submitUrl: string,
  style: PosterStyle,
  perPage: PostersPerPage,
) {
  let host = 'affiche'
  try {
    host = new URL(submitUrl).hostname.replace(/\./g, '-')
  } catch {
    /* keep default */
  }
  return `mdlr-highscores-affiche-${host}-${style}-x${perPage}`
}

export function posterFileName(
  submitUrl: string,
  style: PosterStyle,
  perPage: PostersPerPage,
  extension: 'png' | 'pdf',
) {
  return `${posterFileStem(submitUrl, style, perPage)}.${extension}`
}

/**
 * Draws one poster into a rectangle of an existing canvas context. Coordinates
 * and size are in canvas pixels.
 */
export function drawQrPosterInRect(
  ctx: CanvasRenderingContext2D,
  submitUrl: string,
  assets: PosterAssets,
  style: PosterStyle,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const tokens = readTokens()
  const scale = Math.min(width / POSTER_WIDTH, height / POSTER_HEIGHT)
  const W = POSTER_WIDTH * scale
  const H = POSTER_HEIGHT * scale
  const left = x + (width - W) / 2
  const top = y + (height - H) / 2
  const margin = 160 * scale
  const branded = style === 'branded'

  const purple = tokens['brand-purple'] || tokens['surface-base'] || '#331655'
  const pink = tokens['brand-pink'] || '#ea4592'
  const pageBg = branded ? purple : '#ffffff'
  const subtitleColor = branded ? tokens['ink-accent'] || '#f7b0d2' : purple
  const bodyColor = branded ? '#ffffff' : purple
  const bodyMuted = branded
    ? 'rgba(255, 255, 255, 0.85)'
    : 'rgba(51, 22, 85, 0.75)'
  const qrDark = tokens['ink-inverse'] || purple
  const logo = branded ? assets.logoOnDark : assets.logoOnLight

  ctx.save()
  ctx.beginPath()
  ctx.rect(left, top, W, H)
  ctx.clip()

  ctx.fillStyle = pageBg
  ctx.fillRect(left, top, W, H)
  if (branded && assets.background) {
    ctx.globalAlpha = parseFloat(tokens['opacity-grid']) || 0.6
    drawCover(ctx, assets.background, left, top, W, H)
    ctx.globalAlpha = 1
  }

  const framePad = 72 * scale
  ctx.fillStyle = pink
  ctx.fillRect(
    left + framePad,
    top + framePad,
    W - framePad * 2,
    H - framePad * 2,
  )
  ctx.fillStyle = pageBg
  ctx.fillRect(
    left + framePad + 12 * scale,
    top + framePad + 12 * scale,
    W - (framePad + 12 * scale) * 2,
    H - (framePad + 12 * scale) * 2,
  )
  if (branded && assets.background) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(
      left + framePad + 12 * scale,
      top + framePad + 12 * scale,
      W - (framePad + 12 * scale) * 2,
      H - (framePad + 12 * scale) * 2,
    )
    ctx.clip()
    ctx.globalAlpha = parseFloat(tokens['opacity-grid']) || 0.6
    drawCover(ctx, assets.background, left, top, W, H)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  let cursorY = top + margin + 40 * scale

  if (logo) {
    const logoHeight = 220 * scale
    const logoWidth = (logoHeight * logo.naturalWidth) / logo.naturalHeight
    ctx.drawImage(
      logo,
      left + (W - logoWidth) / 2,
      cursorY,
      logoWidth,
      logoHeight,
    )
    cursorY += logoHeight + 80 * scale
  }

  const pixelFont = (size: number) => `${size}px ${PIXEL_FONT}`
  const sansFont = (weight: number) => (size: number) =>
    `${weight} ${size}px ${SANS_FONT}`

  const title = pixelCaps('À toi de jouer')
  const titleSize = fitFont(
    ctx,
    title,
    pixelFont,
    96 * scale,
    56 * scale,
    W - margin * 2,
  )
  ctx.font = pixelFont(titleSize)
  ctx.fillStyle = pink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(title, left + W / 2, cursorY)
  cursorY += titleSize + 48 * scale

  const subtitle = 'Highscores'
  const subSize = fitFont(
    ctx,
    subtitle,
    sansFont(700),
    64 * scale,
    40 * scale,
    W - margin * 2,
  )
  ctx.font = sansFont(700)(subSize)
  ctx.fillStyle = subtitleColor
  ctx.fillText(subtitle, left + W / 2, cursorY)
  cursorY += subSize + 100 * scale

  const qrSize = Math.min(1480 * scale, W - margin * 2)
  const qrX = left + (W - qrSize) / 2
  const mat = 36 * scale
  const border = 16 * scale
  ctx.fillStyle = pink
  ctx.fillRect(
    qrX - mat - border,
    cursorY - mat - border,
    qrSize + (mat + border) * 2,
    qrSize + (mat + border) * 2,
  )
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(qrX - mat, cursorY - mat, qrSize + mat * 2, qrSize + mat * 2)
  drawQr(ctx, submitUrl, qrX, cursorY, qrSize, qrDark, '#ffffff')
  cursorY += qrSize + mat + border + 90 * scale

  const hook = 'Un record à afficher ?'
  const hookSize = fitFont(
    ctx,
    hook,
    sansFont(700),
    72 * scale,
    44 * scale,
    W - margin * 2,
  )
  ctx.font = sansFont(700)(hookSize)
  ctx.fillStyle = bodyColor
  ctx.fillText(hook, left + W / 2, cursorY)
  cursorY += hookSize + 36 * scale

  const line = "Scanne, prends ta photo, c'est parti !"
  const lineSize = fitFont(
    ctx,
    line,
    sansFont(600),
    48 * scale,
    32 * scale,
    W - margin * 2,
  )
  ctx.font = sansFont(600)(lineSize)
  ctx.fillStyle = bodyMuted
  ctx.fillText(line, left + W / 2, cursorY)
  cursorY += lineSize + 80 * scale

  const host = displayHost(submitUrl)
  const hostSize = fitFont(
    ctx,
    host,
    sansFont(600),
    36 * scale,
    24 * scale,
    W - margin * 2,
  )
  ctx.font = sansFont(600)(hostSize)
  ctx.fillStyle = pink
  ctx.fillText(
    host,
    left + W / 2,
    Math.min(cursorY, top + H - margin - hostSize),
  )

  ctx.restore()
  ctx.textAlign = 'left'
}

/** Fills the canvas with an A4 sheet of 1, 2 or 4 posters. */
export function drawPosterSheet(
  canvas: HTMLCanvasElement,
  submitUrl: string,
  assets: PosterAssets,
  style: PosterStyle,
  perPage: PostersPerPage,
) {
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = style === 'branded' ? '#331655' : '#ffffff'
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  const { cols, rows } = sheetGrid(perPage)
  const cellW = (POSTER_WIDTH - GAP * (cols + 1)) / cols
  const cellH = (POSTER_HEIGHT - GAP * (rows + 1)) / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellX = GAP + col * (cellW + GAP)
      const cellY = GAP + row * (cellH + GAP)
      drawQrPosterInRect(
        ctx,
        submitUrl,
        assets,
        style,
        cellX,
        cellY,
        cellW,
        cellH,
      )
    }
  }
}

/** Single full-page poster (preview helper). */
export function drawQrPoster(
  canvas: HTMLCanvasElement,
  submitUrl: string,
  assets: PosterAssets,
  style: PosterStyle = 'branded',
) {
  drawPosterSheet(canvas, submitUrl, assets, style, 1)
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Empty canvas'))),
      'image/png',
    ),
  )
}

export function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality = 0.92,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Empty canvas'))
          return
        }
        void blob.arrayBuffer().then((buffer) => {
          resolve(new Uint8Array(buffer))
        }, reject)
      },
      'image/jpeg',
      quality,
    )
  })
}

/**
 * One-page A4 PDF that embeds the sheet as a JPEG (no dependency). The page
 * size matches ISO A4 so printers pick the right paper.
 */
export function jpegToA4Pdf(
  jpeg: Uint8Array,
  widthPx: number,
  heightPx: number,
): Blob {
  const encoder = new TextEncoder()
  const objects: Array<string | Uint8Array> = []

  const add = (content: string | Uint8Array) => {
    objects.push(content)
    return objects.length
  }

  const catalogId = add('')
  const pagesId = add('')
  const pageId = add('')
  const contentId = add('')
  const imageId = add('')

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`
  objects[pageId - 1] =
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] /Contents ${contentId} 0 R /Resources << /XObject << /Im0 ${imageId} 0 R >> >> >>`
  const contentStream = `q\n${A4_WIDTH_PT} 0 0 ${A4_HEIGHT_PT} 0 0 cm\n/Im0 Do\nQ\n`
  objects[contentId - 1] =
    `<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`

  const imageHeader = encoder.encode(
    `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.byteLength} >>\nstream\n`,
  )
  const imageEnd = encoder.encode('\nendstream')
  const imageBody = new Uint8Array(
    imageHeader.byteLength + jpeg.byteLength + imageEnd.byteLength,
  )
  imageBody.set(imageHeader, 0)
  imageBody.set(jpeg, imageHeader.byteLength)
  imageBody.set(imageEnd, imageHeader.byteLength + jpeg.byteLength)
  objects[imageId - 1] = imageBody

  const headerBytes = encoder.encode('%PDF-1.4\n')
  const chunks: Array<Uint8Array> = [headerBytes]
  const offsets: Array<number> = [0]
  let offset = headerBytes.byteLength

  objects.forEach((body, index) => {
    offsets.push(offset)
    const objHeader = encoder.encode(`${index + 1} 0 obj\n`)
    const footer = encoder.encode('\nendobj\n')
    chunks.push(objHeader)
    offset += objHeader.byteLength
    if (typeof body === 'string') {
      const bytes = encoder.encode(body)
      chunks.push(bytes)
      offset += bytes.byteLength
    } else {
      chunks.push(body)
      offset += body.byteLength
    }
    chunks.push(footer)
    offset += footer.byteLength
  })

  const xrefStart = offset
  let xref = `xref\n0 ${objects.length + 1}\n`
  xref += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`
  xref += `startxref\n${xrefStart}\n%%EOF\n`
  chunks.push(encoder.encode(xref))

  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const pdf = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    pdf.set(chunk, at)
    at += chunk.byteLength
  }
  return new Blob([pdf], { type: 'application/pdf' })
}

export async function canvasToA4PdfBlob(canvas: HTMLCanvasElement) {
  const jpeg = await canvasToJpegBytes(canvas)
  return jpegToA4Pdf(jpeg, canvas.width, canvas.height)
}
