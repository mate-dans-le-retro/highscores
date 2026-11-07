import { randomUuid } from './random-uuid'

export const SCORE_DRAFT_KEY = 'mdlr-highscores:score-draft:v2'
/** v1 kept the photo as a data URL: dropped on read to free the quota. */
const LEGACY_DRAFT_KEY = 'mdlr-highscores:score-draft:v1'

export interface ScoreDraft {
  /**
   * Id the score gets once sent. Known in advance, it seeds the nickname
   * previewed for a nameless score, and makes a retried send harmless.
   */
  submissionId: string
  /** Id of the photo held by draftPhotos (memory + IndexedDB), never the photo itself. */
  photoId: string | null
  gameId: string | null
  customGameName: string | null
  /** When true, the player picked "Un autre jeu" instead of a listed game. */
  customGame: boolean
  /** Digits only for points; free text for time (see parseTimeInput). */
  scoreText: string
  /** Optional, and only sent when the score is displayed. */
  playerName: string
  displayOnScreen: boolean
  instagramConsent: boolean
  instagramHandle: string
  detectedGameId: string | null
  detectedScore: number | null
  /** Set after a successful send; gates `?step=done` and clears on a new draft. */
  sent: boolean
}

export const emptyScoreDraft = (): ScoreDraft => ({
  submissionId: randomUuid(),
  photoId: null,
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
  sent: false,
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
  store.removeItem(LEGACY_DRAFT_KEY)
  const raw = store.getItem(SCORE_DRAFT_KEY)
  if (!raw) return emptyScoreDraft()
  try {
    const parsed = JSON.parse(raw) as Partial<ScoreDraft>
    return { ...emptyScoreDraft(), ...parsed }
  } catch {
    return emptyScoreDraft()
  }
}

/** The draft is a few hundred bytes, but a full storage must not block the form. */
export function writeScoreDraft(
  draft: ScoreDraft,
  store: SessionStore | null = sessionStore(),
) {
  try {
    store?.setItem(SCORE_DRAFT_KEY, JSON.stringify(draft))
  } catch (error) {
    console.warn('Score draft not saved', error)
  }
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
