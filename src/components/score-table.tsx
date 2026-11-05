import type { ReactNode } from 'react'

import { RankBadge } from '#/components/rank-badge'
import { cn } from '#/lib/utils'

export type ScoreTableRow = {
  id: string
  rank: number
  player: string
  /** Number → French thousands; string kept as-is (times, combos). */
  score: number | string
  /** Passing highlight for a score that just landed. */
  fresh?: boolean
  /** Past-event rows on the public screen. */
  dimmed?: boolean
  /** Optional secondary line under the player name (date, event…). */
  meta?: ReactNode
}

type ScoreTableProps = {
  game: string
  /** Eyebrow above the game name (console · station, or a machine label). */
  machine?: string | null
  rows: Array<ScoreTableRow>
  /** Index of the first row under the all-time / current separator. */
  separatorAt?: number | null
  emptyMessage?: string
  className?: string
  onSelectRow?: (index: number, row: ScoreTableRow) => void
}

function formatCell(score: number | string) {
  if (typeof score === 'string') return score
  return new Intl.NumberFormat('fr-FR').format(score)
}

/** Pink bar for the best score (and a score that just landed), dark otherwise. */
function barTone(row: ScoreTableRow) {
  return (row.rank === 1 && !row.dimmed) || row.fresh
    ? 'bg-surface-accent text-ink-on-accent'
    : 'bg-surface-overlay'
}

function placeLabel(rank: number) {
  return rank === 1 ? '1re place' : `${rank}e place`
}

/**
 * Pixel-register highscores table: rank, player, score.
 * Lives on a projected screen (`scene`) by default. It fills the height it is
 * given: rows are bars that share it, so 5 or 10 rows always fit the stage.
 * The best row is painted pink, as in the mockup.
 *
 * Note: the Highscores mockup paints this panel on a dark surface with a
 * light border (not PixelPanel's surface-inverse). Raised to Clément if the
 * DS should change.
 */
export function ScoreTable({
  game,
  machine,
  rows,
  separatorAt = null,
  emptyMessage = "Aucun score pour l'instant. À toi de jouer !",
  className,
  onSelectRow,
}: ScoreTableProps) {
  const selectable = typeof onSelectRow === 'function'

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col rounded-none border-4 border-line-strong bg-surface-raised text-ink-primary shadow-pixel',
        className,
      )}
    >
      <header className="shrink-0 px-8 pt-7 pb-5">
        {machine ? (
          <p className="mb-2 font-display text-arcade-title text-ink-secondary uppercase">
            {machine}
          </p>
        ) : null}
        <h2 className="font-display text-scene-pixel text-ink-accent uppercase">
          {game}
        </h2>
      </header>

      {rows.length === 0 ? (
        <p className="px-8 py-10 text-scene-row">{emptyMessage}</p>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-2 px-6 pb-6">
          {rows.map((row, index) => {
            const name = `${row.player} — ${formatCell(row.score)}, ${placeLabel(row.rank)}`
            const content = (
              <>
                <RankBadge rank={row.rank} size="md" />
                <div className="flex min-w-0 items-baseline gap-6">
                  <p className="shrink-0 truncate font-display text-scene-pixel">
                    {row.player}
                  </p>
                  {row.meta ? (
                    <p
                      className={
                        'truncate text-scene-meta ' +
                        (row.rank === 1 && !row.dimmed
                          ? 'text-ink-on-accent'
                          : 'text-ink-secondary')
                      }
                    >
                      {row.meta}
                    </p>
                  ) : null}
                </div>
                <p className="justify-self-end font-display text-scene-pixel tabular-nums">
                  {formatCell(row.score)}
                </p>
              </>
            )

            return (
              <li
                key={row.id}
                className="flex max-h-24 min-h-0 flex-1 basis-0 flex-col"
              >
                {separatorAt === index ? (
                  <div
                    role="separator"
                    className="mx-2 mb-2 shrink-0 border-t-4 border-dashed border-line-subtle"
                  />
                ) : null}
                {selectable ? (
                  <button
                    type="button"
                    aria-label={name}
                    onClick={() => onSelectRow(index, row)}
                    className={cn(
                      'grid min-h-0 w-full flex-1 grid-cols-[auto_1fr_auto] items-center gap-6 px-5 text-left transition-[background-color,transform,outline] duration-500',
                      barTone(row),
                      'hover:outline hover:outline-4 hover:outline-offset-[-4px] hover:outline-line-accent',
                      'active:translate-x-px active:translate-y-px',
                      'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring',
                      row.dimmed && !row.fresh && 'opacity-60',
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    className={cn(
                      'grid min-h-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-6 px-5 transition-[background-color] duration-500',
                      barTone(row),
                      row.dimmed && !row.fresh && 'opacity-60',
                    )}
                  >
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
