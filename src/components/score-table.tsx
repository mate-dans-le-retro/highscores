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

function placeLabel(rank: number) {
  return rank === 1 ? '1re place' : `${rank}e place`
}

/**
 * Pixel-register highscores table: rank, player, score.
 * Lives on a projected screen (`scene`) by default.
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
        'rounded-none border-4 border-line-strong bg-surface-raised text-ink-primary shadow-pixel',
        className,
      )}
    >
      <header className="px-8 pt-8 pb-4">
        {machine ? (
          <p className="text-scene-meta text-ink-secondary uppercase">
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
        <ol className="flex flex-col pb-4">
          {rows.map((row, index) => {
            const name = `${row.player} — ${formatCell(row.score)}, ${placeLabel(row.rank)}`
            const content = (
              <>
                <RankBadge rank={row.rank} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-scene-row">{row.player}</p>
                  {row.meta ? (
                    <p className="truncate text-scene-meta text-ink-secondary">
                      {row.meta}
                    </p>
                  ) : null}
                </div>
                <p className="justify-self-end font-mono text-scene-row tabular-nums">
                  {formatCell(row.score)}
                </p>
              </>
            )

            return (
              <li key={row.id}>
                {separatorAt === index ? (
                  <div
                    role="separator"
                    className="mx-8 my-2 border-t-4 border-line-subtle"
                  />
                ) : null}
                {selectable ? (
                  <button
                    type="button"
                    aria-label={name}
                    onClick={() => onSelectRow(index, row)}
                    className={cn(
                      'grid w-full grid-cols-[auto_1fr_auto] items-center gap-8 border-t-2 border-line-subtle px-8 py-4 text-left transition-[background-color,transform,outline] duration-500 first:border-t-0',
                      'hover:outline hover:outline-4 hover:outline-offset-[-4px] hover:outline-line-accent',
                      'active:translate-x-px active:translate-y-px',
                      'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring',
                      row.fresh &&
                        'border-transparent bg-surface-accent text-ink-on-accent',
                      row.dimmed && !row.fresh && 'opacity-60',
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    className={cn(
                      'grid grid-cols-[auto_1fr_auto] items-center gap-8 border-t-2 border-line-subtle px-8 py-4 transition-[background-color] duration-500 first:border-t-0',
                      row.fresh &&
                        'border-transparent bg-surface-accent text-ink-on-accent',
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
