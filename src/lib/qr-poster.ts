import { encode } from 'uqr'

import { pixelCaps } from './format'

/**
 * Printable A4 poster (portrait) for the submission QR. Drawn at 300 DPI so a
 * phone can read it from across a machine, then downloaded as a PNG.
 */

export const POSTER_WIDTH = 2480
export const POSTER_HEIGHT = 3508

const LOGO_SRC = '/mdlr-logo-couleur-fond-sombre.svg'
const BACKGROUND_SRC = '/pixel-background.svg'
const PIXEL_FONT = '"Press Start 2P"'
const SANS_FONT = 'Montserrat'

const TOKEN_NAMES = [
  'brand-pink',
  'surface-base',
  'surface-inverse',
  'ink-primary',
  'ink-secondary',
  'ink-accent',
  'ink-inverse',
  'line-accent',
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
async function loadLogo() {
  const text = await (await fetch(LOGO_SRC)).text()
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
  logo: HTMLImageElement | null
  background: HTMLImageElement | null
}

let staticAssets: Promise<PosterAssets> | null = null

export function loadPosterAssets(): Promise<PosterAssets> {
  staticAssets ??= Promise.all([
    loadLogo().catch(() => null),
    loadImage(BACKGROUND_SRC).catch(() => null),
    document.fonts
      .load(`48px ${PIXEL_FONT}`, 'A TOI DE JOUER HIGHSCORES')
      .catch(() => []),
    document.fonts.load(`700 40px ${SANS_FONT}`).catch(() => []),
    document.fonts.load(`600 32px ${SANS_FONT}`).catch(() => []),
  ]).then(([logo, background]) => ({ logo, background }))
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

/** File name for the download, based on the host the QR points to. */
export function posterFileName(submitUrl: string) {
  try {
    const host = new URL(submitUrl).hostname.replace(/\./g, '-')
    return `mdlr-highscores-affiche-${host}.png`
  } catch {
    return 'mdlr-highscores-affiche.png'
  }
}

/**
 * Draws the A4 poster. The canvas is resized to {@link POSTER_WIDTH} ×
 * {@link POSTER_HEIGHT}. `submitUrl` is the absolute `/score` URL encoded in
 * the QR (prod when the admin is opened on prod).
 */
export function drawQrPoster(
  canvas: HTMLCanvasElement,
  submitUrl: string,
  assets: PosterAssets,
) {
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const tokens = readTokens()
  const W = POSTER_WIDTH
  const H = POSTER_HEIGHT
  const margin = 160

  ctx.fillStyle = tokens['surface-base']
  ctx.fillRect(0, 0, W, H)
  if (assets.background) {
    ctx.globalAlpha = parseFloat(tokens['opacity-grid']) || 0.6
    drawCover(ctx, assets.background, 0, 0, W, H)
    ctx.globalAlpha = 1
  }

  // Pink outer frame, like the pixel panels on the public screen.
  const framePad = 72
  ctx.fillStyle = tokens['line-accent']
  ctx.fillRect(framePad, framePad, W - framePad * 2, H - framePad * 2)
  ctx.fillStyle = tokens['surface-base']
  ctx.fillRect(
    framePad + 12,
    framePad + 12,
    W - (framePad + 12) * 2,
    H - (framePad + 12) * 2,
  )
  if (assets.background) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(
      framePad + 12,
      framePad + 12,
      W - (framePad + 12) * 2,
      H - (framePad + 12) * 2,
    )
    ctx.clip()
    ctx.globalAlpha = parseFloat(tokens['opacity-grid']) || 0.6
    drawCover(ctx, assets.background, 0, 0, W, H)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  let y = margin + 40

  if (assets.logo) {
    const logoHeight = 220
    const logoWidth =
      (logoHeight * assets.logo.naturalWidth) / assets.logo.naturalHeight
    ctx.drawImage(assets.logo, (W - logoWidth) / 2, y, logoWidth, logoHeight)
    y += logoHeight + 80
  }

  const pixelFont = (size: number) => `${size}px ${PIXEL_FONT}`
  const sansFont = (weight: number) => (size: number) =>
    `${weight} ${size}px ${SANS_FONT}`

  const title = pixelCaps('À toi de jouer')
  const titleSize = fitFont(ctx, title, pixelFont, 96, 56, W - margin * 2)
  ctx.font = pixelFont(titleSize)
  ctx.fillStyle = tokens['brand-pink']
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(title, W / 2, y)
  y += titleSize + 48

  const subtitle = 'Highscores'
  const subSize = fitFont(ctx, subtitle, sansFont(700), 64, 40, W - margin * 2)
  ctx.font = sansFont(700)(subSize)
  ctx.fillStyle = tokens['ink-accent']
  ctx.fillText(subtitle, W / 2, y)
  y += subSize + 100

  const qrSize = Math.min(1480, W - margin * 2)
  const qrX = (W - qrSize) / 2
  // White mat + pink border around the QR for contrast on a purple wall.
  const mat = 36
  const border = 16
  ctx.fillStyle = tokens['line-accent']
  ctx.fillRect(
    qrX - mat - border,
    y - mat - border,
    qrSize + (mat + border) * 2,
    qrSize + (mat + border) * 2,
  )
  ctx.fillStyle = tokens['surface-inverse']
  ctx.fillRect(qrX - mat, y - mat, qrSize + mat * 2, qrSize + mat * 2)
  // Same pairing as <QrCode>: dark modules use ink-inverse on a white mat
  // (arcade ink-primary is white, so it would vanish on surface-inverse).
  drawQr(
    ctx,
    submitUrl,
    qrX,
    y,
    qrSize,
    tokens['ink-inverse'] || '#331655',
    tokens['surface-inverse'] || '#ffffff',
  )
  y += qrSize + mat + border + 90

  const hook = 'Un record à afficher ?'
  const hookSize = fitFont(ctx, hook, sansFont(700), 72, 44, W - margin * 2)
  ctx.font = sansFont(700)(hookSize)
  ctx.fillStyle = tokens['ink-primary']
  // On the purple poster, ink-primary from arcade is light.
  ctx.fillStyle = '#ffffff'
  ctx.fillText(hook, W / 2, y)
  y += hookSize + 36

  const line = "Scanne, prends ta photo, c'est parti !"
  const lineSize = fitFont(ctx, line, sansFont(600), 48, 32, W - margin * 2)
  ctx.font = sansFont(600)(lineSize)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fillText(line, W / 2, y)
  y += lineSize + 80

  const host = displayHost(submitUrl)
  const hostSize = fitFont(ctx, host, sansFont(600), 36, 24, W - margin * 2)
  ctx.font = sansFont(600)(hostSize)
  ctx.fillStyle = tokens['brand-pink']
  ctx.fillText(host, W / 2, Math.min(y, H - margin - hostSize))

  ctx.textAlign = 'left'
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Empty canvas'))),
      'image/png',
    ),
  )
}
