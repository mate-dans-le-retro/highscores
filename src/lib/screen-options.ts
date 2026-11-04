import { z } from 'zod'

import type { Settings } from './data/types'

/** Whole number from the URL, clamped to [min, max]; anything else is ignored. */
const boundedInt = (min: number, max: number) =>
  z.coerce
    .number()
    .int()
    .transform((value) => Math.min(max, Math.max(min, value)))
    .optional()
    .catch(undefined)

/**
 * Search params of the public screen, to override the settings on the fly:
 * `/?rotation=30` (seconds per game) and `/?rows=10` (rows per leaderboard).
 */
export const screenSearchSchema = z.object({
  rotation: boundedInt(5, 300),
  // The design system allows ten rows at most on the projected screen.
  rows: boundedInt(1, 10),
})

export type ScreenSearch = z.infer<typeof screenSearchSchema>

export function screenOptions(settings: Settings, search: ScreenSearch) {
  return {
    rotationMs: (search.rotation ?? settings.game_duration_s) * 1000,
    rows: search.rows ?? settings.rows_shown,
  }
}
