import type { ScoreDraft } from './score-draft'
import { findGameIdBySlug } from './score-step'

/**
 * Seeds the draft's game from `?game=<slug>` when the player has not picked
 * one yet (and has not chosen "Un autre jeu"). Returns null when nothing
 * changes, so the caller can skip a write.
 */
export function seedGameFromSearch(
  draft: ScoreDraft,
  games: Array<{ id: string; slug: string }>,
  gameSlug: string | undefined,
): ScoreDraft | null {
  if (draft.gameId || draft.customGame) return null
  const gameId = findGameIdBySlug(games, gameSlug)
  if (!gameId) return null
  return {
    ...draft,
    gameId,
    customGame: false,
    customGameName: null,
  }
}
