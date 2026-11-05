export const SCORE_DRAFT_KEY = 'mdlr-highscores:score-draft:v1'

export interface ScoreDraft {
  /** Resized JPEG as a data URL (survives reload; used for preview and submit). */
  photoDataUrl: string | null
  gameId: string | null
  customGameName: string | null
  /** When true, the player picked "Un autre jeu" instead of a listed game. */
  customGame: boolean
  /** Digits only for points; free text for time (parsed on submit). */
  scoreText: string
  playerName: string
  displayOnScreen: boolean
  instagramConsent: boolean
  instagramHandle: string
  detectedGameId: string | null
  detectedScore: number | null
}

export const emptyScoreDraft = (): ScoreDraft => ({
  photoDataUrl: null,
  gameId: null,
  customGameName: null,
  customGame: false,
  scoreText: '',
  playerName: '',
  displayOnScreen: true,
  instagramConsent: false,
  instagramHandle: '',
  detectedGameId: null,
  detectedScore: null,
})

interface SessionStore {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function sessionStore(): SessionStore | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

export function readScoreDraft(
  store: SessionStore | null = sessionStore(),
): ScoreDraft {
  if (!store) return emptyScoreDraft()
  const raw = store.getItem(SCORE_DRAFT_KEY)
  if (!raw) return emptyScoreDraft()
  try {
    const parsed = JSON.parse(raw) as Partial<ScoreDraft>
    return { ...emptyScoreDraft(), ...parsed }
  } catch {
    return emptyScoreDraft()
  }
}

export function writeScoreDraft(
  draft: ScoreDraft,
  store: SessionStore | null = sessionStore(),
) {
  store?.setItem(SCORE_DRAFT_KEY, JSON.stringify(draft))
}

export function clearScoreDraft(store: SessionStore | null = sessionStore()) {
  store?.removeItem(SCORE_DRAFT_KEY)
}

/** Keep the nickname when the player sends another score. */
export function resetScoreDraftKeepName(
  draft: ScoreDraft,
  store: SessionStore | null = sessionStore(),
) {
  const next = emptyScoreDraft()
  next.playerName = draft.playerName
  writeScoreDraft(next, store)
  return next
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read the photo'))
    }
    reader.onerror = () =>
      reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',', 2)
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
