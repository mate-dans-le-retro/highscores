import { PixelPanel } from '#/components/pixel-panel'
import { RankBadge } from '#/components/rank-badge'
import { formatScore, photoUrl } from '#/lib/highscores'
import type { GameRecord } from '#/lib/highscores'
import { cn } from '#/lib/utils'

type RecordsWallProps = {
  records: Array<GameRecord>
  className?: string
}

/**
 * Projected "mur des records": one card per visible game (mockup p.2).
 * Main slot is the current-event 1st; a star line shows the all-time record
 * when it is a different score.
 */
export function RecordsWall({ records, className }: RecordsWallProps) {
  return (
    <div
      className={cn(
        'grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-x-10 gap-y-8',
        className,
      )}
    >
      {records.map((record) => (
        <RecordCard key={record.game.id} record={record} />
      ))}
    </div>
  )
}

function RecordCard({ record }: { record: GameRecord }) {
  const { game, current, all_time } = record
  const main = current ?? all_time
  const image = photoUrl(main?.photo_path ?? null)
  const showAllTimeLine = Boolean(
    current && all_time && all_time.id !== current.id,
  )

  return (
    <article className="flex min-h-0 min-w-0 flex-col gap-3">
      <h2 className="truncate font-display text-arcade-label text-ink-primary uppercase">
        {game.name}
      </h2>
      <PixelPanel className="min-h-0 flex-1">
        {!main ? (
          <p className="text-body-ui text-ink-inverse/75">
            Pas encore de record. À toi de jouer !
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 items-stretch gap-6">
            <div className="flex aspect-square h-full shrink-0 items-center justify-center overflow-hidden rounded-none border-4 border-line-subtle bg-surface-base">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-10 border-4 border-line-subtle bg-surface-overlay"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <RankBadge rank={1} size="sm" className="shrink-0" />
                <p className="truncate font-display text-scene-pixel text-ink-inverse">
                  {main.player_name}
                </p>
              </div>
              <p className="font-display text-scene-pixel text-ink-inverse">
                {formatScore(main.score, game.score_type)}
              </p>
              {showAllTimeLine && all_time ? (
                <p className="truncate text-body-ui text-ink-inverse/75">
                  <span aria-hidden="true" className="text-rank-gold">
                    ★{' '}
                  </span>
                  <span className="sr-only">Record tous les temps : </span>
                  {all_time.player_name}
                  {' · '}
                  {formatScore(all_time.score, game.score_type)}
                </p>
              ) : null}
              {!current && all_time ? (
                <p className="truncate text-body-ui text-ink-inverse/75">
                  {all_time.event_name ?? 'Tous les temps'}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </PixelPanel>
    </article>
  )
}
