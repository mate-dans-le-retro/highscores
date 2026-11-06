import { z } from 'zod'

/** Interactive steps of the player form (thanks is a fourth screen without the bar). */
export const SCORE_STEPS = ['photo', 'details', 'consent', 'done'] as const

export type ScoreStep = (typeof SCORE_STEPS)[number]

const FORM_STEPS = ['photo', 'details', 'consent'] as const

export type ScoreFormStep = (typeof FORM_STEPS)[number]

export const scoreSearchSchema = z.object({
  step: z.enum(SCORE_STEPS).optional().catch(undefined),
  /** Visible game slug from a QR (`?game=duck-hunt`). Ignored when unknown. */
  game: z.string().min(1).optional().catch(undefined),
})

export type ScoreSearch = z.infer<typeof scoreSearchSchema>

export function resolveScoreStep(search: ScoreSearch): ScoreStep {
  return search.step ?? 'photo'
}

/** 1-based index for the three-segment progress bar; `done` has no bar. */
export function formStepNumber(step: ScoreStep): number | null {
  const index = FORM_STEPS.indexOf(step as ScoreFormStep)
  return index === -1 ? null : index + 1
}

/** Match a `?game=` slug against the visible list; unknown slugs are ignored. */
export function findGameIdBySlug(
  games: Array<{ id: string; slug: string }>,
  slug: string | undefined,
): string | null {
  if (!slug) return null
  return games.find((game) => game.slug === slug)?.id ?? null
}
