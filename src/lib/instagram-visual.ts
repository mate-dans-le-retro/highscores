import { displayablePhotoUrl } from './data/photo'
import { pixelCaps } from './format'
import {
  MDLR_INSTAGRAM,
  formatPostDate,
  instagramHeadline,
} from './instagram-post'
import type { InstagramPost } from './instagram-post'
import { BUST, CUP, EYES, MASK } from './pixel-art'
import type { PixelRect } from './pixel-art'

// Instagram visual (mockup p.15, 720 × 900) drawn on a canvas at 1080 × 1350,
// Instagram's 4:5 portrait size. Colors come from the design-system tokens of
// the arcade theme, read from the CSS, so nothing is hard-coded here.

export const VISUAL_WIDTH = 1080
export const VISUAL_HEIGHT = 1350

/** Mockup units (720 wide) to canvas pixels. */
const U = VISUAL_WIDTH / 720

const LOGO_SRC = '/mdlr-logo-couleur-fond-sombre.svg'
const BACKGROUND_SRC = '/pixel-background.svg'
const PIXEL_FONT = '"Press Start 2P"'
const SANS_FONT = 'Montserrat'

const TOKEN_NAMES = [
  'brand-pink',
  'surface-base',
  'surface-sunken',
  'surface-raised',
  'surface-overlay',
  'surface-accent',
  'surface-inverse',
  'ink-primary',
  'ink-secondary',
  'ink-accent',
  'ink-on-accent',
  'line-subtle',
  'line-accent',
  'rank-gold',
  'rank-silver',
  'rank-bronze',
  'rank-gold-hi',
  'rank-silver-hi',
  'rank-bronze-hi',
  'shadow-pixel',
  'opacity-grid',
] as const

type TokenName = (typeof TOKEN_NAMES)[number]
type Tokens = Record<TokenName, string>

/** Token values of a theme, read from the stylesheet. */
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

/** "4px 4px 0 #1d0b36" → the offset and the color. */
function pixelShadow(value: string) {
  const parts = value.split(/\s+/)
  return { offset: parseFloat(parts[0]) || 4, color: parts.at(-1) ?? '' }
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export type PhotoState = 'none' | 'loaded' | 'failed'

export interface VisualAssets {
  logo: HTMLImageElement | null
  background: HTMLImageElement | null
  photo: HTMLImageElement | null
  photoState: PhotoState
  /** Revokes the object URLs once the visual is drawn for good. */
  release: () => void
}

async function loadImage(src: string) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  await image.decode()
  return image
}

let staticAssets: Promise<{
  logo: HTMLImageElement | null
  background: HTMLImageElement | null
}> | null = null

/**
 * The logo has a viewBox but no size: some browsers refuse to draw such an
 * SVG on a canvas, so it gets one before loading.
 */
async function loadLogo() {
  const text = await (await fetch(LOGO_SRC)).text()
  const sized = /<svg[^>]*\swidth=/.test(text)
    ? text
    : text.replace('<svg', '<svg width="901" height="496"')
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
  return loadImage(url)
}

function loadStaticAssets() {
  staticAssets ??= Promise.all([
    loadLogo().catch(() => null),
    loadImage(BACKGROUND_SRC).catch(() => null),
    document.fonts
      .load(`32px ${PIXEL_FONT}`, 'NOUVEAU RECORD 0123456789')
      .catch(() => []),
    document.fonts.load(`800 32px ${SANS_FONT}`).catch(() => []),
    document.fonts.load(`600 32px ${SANS_FONT}`).catch(() => []),
  ]).then(([logo, background]) => ({ logo, background }))
  return staticAssets
}

/**
 * Loads the photo through fetch() into a local object URL: the canvas never
 * gets tainted, even if the bucket stopped sending CORS headers (the fetch
 * fails instead, and the visual falls back to the placeholder). A HEIC is
 * converted on the way, like in the rest of the admin.
 */
async function loadPhoto(url: string) {
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) throw new Error(`Photo: HTTP ${response.status}`)
  const objectUrl = await displayablePhotoUrl(await response.blob())
  if (!objectUrl) throw new Error('Photo: unreadable')
  try {
    return { image: await loadImage(objectUrl), objectUrl }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

export async function loadVisualAssets(
  photoUrl: string | null,
): Promise<VisualAssets> {
  const [{ logo, background }, photo] = await Promise.all([
    loadStaticAssets(),
    photoUrl
      ? loadPhoto(photoUrl).catch((error: unknown) => {
          console.warn('Instagram visual: photo not loaded', error)
          return 'failed' as const
        })
      : null,
  ])
  const loaded = photo && photo !== 'failed' ? photo : null
  return {
    logo,
    background,
    photo: loaded?.image ?? null,
    photoState: photo === 'failed' ? 'failed' : loaded ? 'loaded' : 'none',
    release: () => {
      if (loaded) URL.revokeObjectURL(loaded.objectUrl)
    },
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

type Ctx = CanvasRenderingContext2D

function drawPixelArt(
  ctx: Ctx,
  rects: ReadonlyArray<PixelRect>,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const unit = size / 16
  ctx.fillStyle = color
  for (const [rx, ry, width, height] of rects)
    ctx.fillRect(x + rx * unit, y + ry * unit, width * unit, height * unit)
}

/** Largest font size, down to `min`, at which the text fits the width. */
function fitFont(
  ctx: Ctx,
  text: string,
  font: (size: number) => string,
  max: number,
  min: number,
  width: number,
) {
  let size = max
  ctx.font = font(size)
  while (size > min && ctx.measureText(text).width > width) {
    size -= 2
    ctx.font = font(size)
  }
  return size
}

/** Cuts the text with "…" until it fits the width, in the current font. */
function ellipsize(ctx: Ctx, text: string, width: number) {
  if (ctx.measureText(text).width <= width) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width)
    cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

const pixelFont = (size: number) => `${size}px ${PIXEL_FONT}`

/** Greedy word wrap in the current font; breaks after a hyphen too. */
function wrapWords(ctx: Ctx, text: string, width: number) {
  const lines: Array<string> = []
  for (const word of text.split(/\s+/).filter(Boolean)) {
    word.split(/(?<=-)/).forEach((part, index) => {
      const last = lines.at(-1)
      const joined =
        last === undefined ? part : `${last}${index > 0 ? '' : ' '}${part}`
      if (last !== undefined && ctx.measureText(joined).width <= width)
        lines[lines.length - 1] = joined
      else lines.push(part)
    })
  }
  return lines
}

/**
 * The player's name on one line, down to 28px; otherwise on two lines,
 * smaller. A nickname is never cut unless nothing else fits.
 */
function fitName(ctx: Ctx, name: string, width: number) {
  const single = fitFont(ctx, name, pixelFont, 36, 28, width)
  if (ctx.measureText(name).width <= width)
    return { size: single, lines: [name] }
  let size = 26
  let lines: Array<string> = []
  for (; size >= 16; size -= 2) {
    ctx.font = pixelFont(size)
    lines = wrapWords(ctx, name, width)
    if (
      lines.length <= 2 &&
      lines.every((line) => ctx.measureText(line).width <= width)
    )
      return { size, lines }
  }
  size = 16
  ctx.font = pixelFont(size)
  const [first = '', ...rest] = lines
  return {
    size,
    lines: [
      ellipsize(ctx, first, width),
      ...(rest.length ? [ellipsize(ctx, rest.join(' '), width)] : []),
    ],
  }
}

const sansFont = (weight: number) => (size: number) =>
  `${weight} ${size}px ${SANS_FONT}`

/** Panel of the pixel register: square corners and a hard shadow. */
function drawPanel(
  ctx: Ctx,
  tokens: Tokens,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
) {
  const shadow = pixelShadow(tokens['shadow-pixel'])
  ctx.fillStyle = shadow.color
  ctx.fillRect(x + shadow.offset * U, y + shadow.offset * U, width, height)
  ctx.fillStyle = fill
  ctx.fillRect(x, y, width, height)
}

function drawCover(
  ctx: Ctx,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  mode: 'cover' | 'contain',
) {
  const scale = (mode === 'cover' ? Math.max : Math.min)(
    width / image.naturalWidth,
    height / image.naturalHeight,
  )
  const drawnWidth = image.naturalWidth * scale
  const drawnHeight = image.naturalHeight * scale
  ctx.drawImage(
    image,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  )
}

/** Same plate and cup as RankBadge: metal for 1 to 3, numbered square beyond. */
function drawRankBadge(
  ctx: Ctx,
  tokens: Tokens,
  rank: number,
  x: number,
  y: number,
  size: number,
) {
  const metal =
    rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : null
  if (!metal) {
    ctx.fillStyle = tokens['surface-overlay']
    ctx.fillRect(x, y, size, size)
    const label = String(rank)
    fitFont(ctx, label, pixelFont, 40 * (size / 120), 12, size * 0.8)
    ctx.fillStyle = tokens['ink-primary']
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + size / 2, y + size / 2 + 2)
    ctx.textAlign = 'left'
    return
  }

  // CSS linear-gradient(155deg, hi 0%, metal 62%) over the square.
  const angle = (155 * Math.PI) / 180
  const dx = Math.sin(angle)
  const dy = -Math.cos(angle)
  const half = (size * (Math.abs(dx) + Math.abs(dy))) / 2
  const cx = x + size / 2
  const cy = y + size / 2
  const gradient = ctx.createLinearGradient(
    cx - dx * half,
    cy - dy * half,
    cx + dx * half,
    cy + dy * half,
  )
  gradient.addColorStop(0, tokens[`rank-${metal}-hi`])
  gradient.addColorStop(0.62, tokens[`rank-${metal}`])
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, size, size)

  drawPixelArt(ctx, CUP, x, y, size, tokens['ink-on-accent'])

  ctx.font = pixelFont(Math.round(size * 0.22))
  ctx.fillStyle = tokens[`rank-${metal}`]
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(rank), cx, y + size * 0.33 + 1)
  ctx.textAlign = 'left'
}

function drawPlaceholder(
  ctx: Ctx,
  tokens: Tokens,
  anonymous: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const art = Math.min(width, height) * 0.5
  const caption = pixelCaps(anonymous ? 'Incognito !' : 'Sans photo')
  const gap = 32
  const captionSize = 32
  const top = y + (height - art - gap - captionSize) / 2
  const left = x + (width - art) / 2
  drawPixelArt(ctx, BUST, left, top, art, tokens['line-subtle'])
  if (anonymous) {
    drawPixelArt(ctx, MASK, left, top, art, tokens['surface-accent'])
    drawPixelArt(ctx, EYES, left, top, art, tokens['surface-base'])
  } else {
    drawPixelArt(ctx, EYES, left, top, art, tokens['surface-base'])
  }
  ctx.font = pixelFont(captionSize)
  ctx.fillStyle = tokens['ink-secondary']
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(caption, x + width / 2, top + art + gap)
  ctx.textAlign = 'left'
}

/** Gold « RECORD ABSOLU » tag, like AllTimeBadge on the screen. */
function drawAllTimeTag(ctx: Ctx, tokens: Tokens, right: number, y: number) {
  const label = pixelCaps('Record absolu')
  ctx.font = pixelFont(22)
  const padX = 18
  const height = 46
  const width = ctx.measureText(label).width + padX * 2
  ctx.fillStyle = tokens['rank-gold']
  ctx.fillRect(right - width, y - height / 2, width, height)
  ctx.fillStyle = tokens['ink-on-accent']
  ctx.textBaseline = 'middle'
  ctx.fillText(label, right - width + padX, y + 2)
}

/** Draws the whole visual. The canvas is resized to 1080 × 1350. */
export function drawInstagramVisual(
  canvas: HTMLCanvasElement,
  post: InstagramPost,
  assets: Pick<VisualAssets, 'logo' | 'background' | 'photo'>,
) {
  canvas.width = VISUAL_WIDTH
  canvas.height = VISUAL_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const tokens = readTokens()
  const W = VISUAL_WIDTH
  const M = 44 * U
  const inner = W - M * 2

  // Background: brand purple and the pixel pattern, toned down.
  ctx.fillStyle = tokens['surface-base']
  ctx.fillRect(0, 0, W, VISUAL_HEIGHT)
  if (assets.background) {
    ctx.globalAlpha = parseFloat(tokens['opacity-grid']) || 0.6
    drawCover(ctx, assets.background, 0, 0, W, VISUAL_HEIGHT, 'cover')
    ctx.globalAlpha = 1
  }

  // Headline.
  const headline = pixelCaps(instagramHeadline(post))
  fitFont(ctx, headline, pixelFont, 40, 24, inner)
  ctx.fillStyle = tokens['brand-pink']
  ctx.textBaseline = 'top'
  ctx.fillText(headline, M, 40 * U)

  // Photo in a pink frame with a white mat (mockup p.15).
  const frameTop = 92 * U
  const frameHeight = 440 * U
  const border = 4 * U
  const mat = 10 * U
  ctx.fillStyle = tokens['line-accent']
  ctx.fillRect(M, frameTop, inner, frameHeight)
  ctx.fillStyle = tokens['surface-inverse']
  ctx.fillRect(
    M + border,
    frameTop + border,
    inner - border * 2,
    frameHeight - border * 2,
  )
  const photoX = M + border + mat
  const photoY = frameTop + border + mat
  const photoWidth = inner - (border + mat) * 2
  const photoHeight = frameHeight - (border + mat) * 2
  ctx.fillStyle = tokens['surface-sunken']
  ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
  ctx.save()
  ctx.beginPath()
  ctx.rect(photoX, photoY, photoWidth, photoHeight)
  ctx.clip()
  if (assets.photo && !post.anonymous) {
    // The whole photo stays visible (it is the proof); a blurred, darkened
    // copy fills the sides.
    ctx.filter = 'blur(28px)'
    drawCover(
      ctx,
      assets.photo,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
      'cover',
    )
    ctx.filter = 'none'
    ctx.globalAlpha = 0.55
    ctx.fillStyle = tokens['surface-sunken']
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
    ctx.globalAlpha = 1
    drawCover(
      ctx,
      assets.photo,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
      'contain',
    )
  } else {
    drawPlaceholder(
      ctx,
      tokens,
      post.anonymous,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
    )
  }
  ctx.restore()

  // Score card: cup or rank, game, name, score.
  const cardTop = 560 * U
  const cardHeight = 124 * U
  drawPanel(
    ctx,
    tokens,
    M,
    cardTop,
    inner,
    cardHeight,
    tokens['surface-sunken'],
  )
  const pad = 24 * U
  const badge = 76 * U
  drawRankBadge(
    ctx,
    tokens,
    post.rank,
    M + pad,
    cardTop + (cardHeight - badge) / 2,
    badge,
  )
  const textX = M + pad + badge + pad
  const right = M + inner - pad

  const scoreSize = fitFont(
    ctx,
    post.scoreText,
    pixelFont,
    48,
    24,
    inner * 0.42,
  )
  ctx.font = pixelFont(scoreSize)
  const scoreWidth = ctx.measureText(post.scoreText).width
  ctx.fillStyle = tokens['ink-primary']
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText(post.scoreText, right, cardTop + cardHeight / 2 + 2)
  ctx.textAlign = 'left'

  const textWidth = right - scoreWidth - pad - textX
  const gameLabel = pixelCaps(post.gameName)
  const gameSize = fitFont(ctx, gameLabel, pixelFont, 24, 14, textWidth)
  const gameLine = ellipsize(ctx, gameLabel, textWidth)
  const name = fitName(ctx, post.playerName, textWidth)
  const lineHeight = Math.round(name.size * 1.4)
  const gap = 14
  const blockHeight = gameSize + gap + lineHeight * name.lines.length
  let y = cardTop + (cardHeight - blockHeight) / 2
  ctx.textBaseline = 'top'
  ctx.font = pixelFont(gameSize)
  ctx.fillStyle = tokens['ink-accent']
  ctx.fillText(gameLine, textX, y)
  y += gameSize + gap
  ctx.font = pixelFont(name.size)
  ctx.fillStyle = tokens['ink-primary']
  for (const line of name.lines) {
    ctx.fillText(line, textX, y + (lineHeight - name.size) / 2)
    y += lineHeight
  }

  if (post.allTime) drawAllTimeTag(ctx, tokens, right + 8 * U, cardTop)

  // Signature: logo, event and account.
  const footTop = 716 * U
  const footHeight = 148 * U
  drawPanel(
    ctx,
    tokens,
    M,
    footTop,
    inner,
    footHeight,
    tokens['surface-raised'],
  )
  if (assets.logo) {
    const logoHeight = 108 * U
    const logoWidth =
      (logoHeight * assets.logo.naturalWidth) / assets.logo.naturalHeight
    ctx.drawImage(
      assets.logo,
      M + pad,
      footTop + (footHeight - logoHeight) / 2,
      logoWidth,
      logoHeight,
    )
  }
  const footRight = M + inner - pad
  const footText = inner * 0.48
  // Event, when the score was sent, account: stacked, centred in the panel.
  const footLines = [
    { text: post.eventName, weight: 800, size: 34, color: 'ink-primary' },
    {
      text: formatPostDate(post.scoredAt),
      weight: 600,
      size: 28,
      color: 'ink-primary',
    },
    {
      text: `@${MDLR_INSTAGRAM}`,
      weight: 600,
      size: 28,
      color: 'ink-secondary',
    },
  ] as const
  const shown = footLines.flatMap((line) =>
    line.text
      ? [
          {
            ...line,
            text: line.text,
            size: fitFont(
              ctx,
              line.text,
              sansFont(line.weight),
              line.size,
              18,
              footText,
            ),
          },
        ]
      : [],
  )
  const lineGap = 10
  const footBlock =
    shown.reduce((sum, line) => sum + line.size, 0) +
    lineGap * (shown.length - 1)
  let footY = footTop + (footHeight - footBlock) / 2
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  for (const line of shown) {
    ctx.font = sansFont(line.weight)(line.size)
    ctx.fillStyle = tokens[line.color]
    ctx.fillText(ellipsize(ctx, line.text, footText), footRight, footY)
    footY += line.size + lineGap
  }
  ctx.textAlign = 'left'
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg',
) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Empty canvas'))),
      type,
      0.92,
    ),
  )
}
