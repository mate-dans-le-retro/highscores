import type { ReactNode } from 'react'

import { RankBadge } from '#/components/rank-badge'
import { pixelCaps } from '#/lib/highscores'
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
  /** Says what the rows under the separator are (the event name). */
  separatorLabel?: string | null
  /** Shown instead of the rows when there is none. */
  empty?: ReactNode
  className?: string
  onSelectRow?: (index: number, row: ScoreTableRow) => void
}

function formatCell(score: number | string) {
  if (typeof score === 'string') return score
  return new Intl.NumberFormat('fr-FR').format(score)
}

type Tone = 'fresh' | 'first' | 'first-past' | 'dimmed' | 'plain'

function toneOf(row: ScoreTableRow, belowSeparator: boolean): Tone {
  if (row.fresh) return 'fresh'
  if (row.rank === 1 && !belowSeparator)
    return row.dimmed ? 'first-past' : 'first'
  return row.dimmed ? 'dimmed' : 'plain'
}

/**
 * A score that just landed is pink for a while, then fades back; the best
 * score is white, faded like any past-event row when it comes from an older
 * event. Pink stays rare so a new score always catches the eye.
 */
const BAR: Record<Tone, string> = {
  fresh: 'bg-surface-accent text-ink-on-accent',
  first: 'bg-surface-inverse text-ink-inverse',
  'first-past': 'bg-surface-inverse/50 text-ink-inverse',
  dimmed: 'bg-surface-overlay/50',
  plain: 'bg-surface-overlay',
}

const META: Record<Tone, string> = {
  fresh: 'text-ink-on-accent',
  first: 'text-ink-inverse',
  'first-past': 'text-ink-inverse',
  dimmed: 'text-ink-secondary',
  plain: 'text-ink-secondary',
}

function placeLabel(rank: number) {
  return rank === 1 ? '1re place' : `${rank}e place`
}

/**
 * Pixel-register highscores table: rank, player, score.
 * Lives on a projected screen (`scene`) by default. It fills the height it is
 * given: rows are bars that share it, so 5 or 10 rows always fit the stage.
 *
 * Rows under the separator keep their all-time rank in a plain square: the
 * cups belong to the podium at the top.
 *
 * Note: the Highscores mockup paints this panel on a dark surface with a
 * light border (not PixelPanel's surface-inverse), as Clément chose.
 */
export function ScoreTable({
  game,
  machine,
  rows,
  separatorAt = null,
  separatorLabel = null,
  empty,
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
          <p className="mb-2 font-display text-arcade-title text-ink-secondary">
            {pixelCaps(machine)}
          </p>
        ) : null}
        <h2 className="font-display text-scene-pixel text-ink-accent">
          {pixelCaps(game)}
        </h2>
      </header>

      {rows.length === 0 ? (
        (empty ?? (
          <p className="px-8 py-10 text-scene-row">
            Aucun score pour l&apos;instant. À toi de jouer !
          </p>
        ))
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-2 px-6 pb-6">
          {rows.map((row, index) => {
            const belowSeparator = separatorAt !== null && index >= separatorAt
            const tone = toneOf(row, belowSeparator)
            const name = `${row.player} — ${formatCell(row.score)}, ${placeLabel(row.rank)}`
            const dimmedText =
              (tone === 'dimmed' || tone === 'first-past') && 'opacity-60'
            // Name and date together are as tall as the cup (48px), so the
            // three line up even when ten rows squeeze the bars.
            const content = (
              <>
                <RankBadge rank={row.rank} size="md" plain={belowSeparator} />
                <div className={cn('min-w-0', dimmedText)}>
                  <p className="truncate font-display text-scene-pixel leading-7">
                    {row.player}
                  </p>
                  {row.meta ? (
                    <p
                      className={cn('truncate text-body leading-5', META[tone])}
                    >
                      {row.meta}
                    </p>
                  ) : null}
                </div>
                <p
                  className={cn(
                    'justify-self-end font-display text-scene-pixel tabular-nums',
                    dimmedText,
                  )}
                >
                  {formatCell(row.score)}
                </p>
              </>
            )
            const bar = cn(
              'grid min-h-0 w-full flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 px-5 text-left transition-[background-color,color] duration-1000 ease-out',
              BAR[tone],
            )

            return [
              separatorAt === index ? (
                <li
                  key="separator"
                  role="separator"
                  aria-label={separatorLabel ?? undefined}
                  className="flex h-11 shrink-0 items-center gap-4 px-2"
                >
                  <span className="flex-1 border-t-4 border-dashed border-line-strong/60" />
                  {separatorLabel ? (
                    <span className="font-display text-scene-pixel text-ink-accent">
                      {pixelCaps(separatorLabel)}
                    </span>
                  ) : null}
                  <span className="flex-1 border-t-4 border-dashed border-line-strong/60" />
                </li>
              ) : null,
              <li
                key={row.id}
                className="relative flex max-h-24 min-h-0 flex-1 basis-0 flex-col"
              >
                {selectable ? (
                  <button
                    type="button"
                    aria-label={name}
                    onClick={() => onSelectRow(index, row)}
                    className={cn(
                      bar,
                      'hover:outline hover:outline-4 hover:outline-offset-[-4px] hover:outline-line-accent',
                      'active:translate-x-px active:translate-y-px',
                      'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring',
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={bar}>{content}</div>
                )}
              </li>,
            ]
          })}
        </ol>
      )}
    </section>
  )
}
