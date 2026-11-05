import { PhotoPlaceholder } from '#/components/photo-placeholder'
import { PixelPanel } from '#/components/pixel-panel'
import { PixelStar } from '#/components/pixel-star'
import {
  formatScore,
  formatScoreWhen,
  photoUrl,
  pixelCaps,
} from '#/lib/highscores'
import type { GameRecord } from '#/lib/highscores'
import { cn } from '#/lib/utils'
import { wallCardView } from '#/lib/wall-card'
import { wallCells } from '#/lib/wall-pages'

type RecordsWallProps = {
  /** One page of the wall: six records at most. */
  records: Array<GameRecord>
  className?: string
}

const COLUMN_START: Record<number, string> = {
  1: 'col-start-1',
  2: 'col-start-2',
  3: 'col-start-3',
  4: 'col-start-4',
  5: 'col-start-5',
}

const ROW_START: Record<number, string> = {
  1: 'row-start-1',
  2: 'row-start-2',
  3: 'row-start-3',
}

/**
 * Projected "mur des records": one card per visible game (mockup p.2).
 * What each card says about the all-time record is in `wallCardView()`.
 * Cards keep the same size on every page; the rows of a partial page are
 * centred.
 */
export function RecordsWall({ records, className }: RecordsWallProps) {
  const cells = wallCells(records.length)
  return (
    <div
      className={cn(
        'grid min-h-0 flex-1 grid-cols-6 grid-rows-4 gap-x-10 gap-y-4',
        className,
      )}
    >
      {records.map((record, i) => (
        <RecordCard
          key={record.game.id}
          record={record}
          className={cn(
            'col-span-2 row-span-2',
            COLUMN_START[cells[i].column],
            ROW_START[cells[i].row],
          )}
        />
      ))}
    </div>
  )
}

function RecordCard({
  record,
  className,
}: {
  record: GameRecord
  className?: string
}) {
  const { game } = record
  const view = wallCardView(record)

  if (view.kind === 'empty') {
    return (
      <PixelPanel label={game.name} className={cn('min-w-0', className)}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="font-display text-scene-pixel text-ink-inverse">
            {pixelCaps('À prendre !')}
          </p>
          <p className="text-scene-meta text-ink-inverse">
            Pas encore de record sur ce jeu.
          </p>
        </div>
      </PixelPanel>
    )
  }

  const { main, allTimeStar, otherAllTime, origin } = view
  const image = main.anonymous ? null : photoUrl(main.photo_path)

  return (
    <PixelPanel label={game.name} className={cn('min-w-0', className)}>
      <div className="flex min-h-0 flex-1 items-center gap-6">
        <div className="flex aspect-square max-h-full w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-none border-4 border-line-subtle bg-surface-base">
          {image ? (
            <img
              src={image}
              alt=""
              className="size-full object-contain"
              draggable={false}
            />
          ) : (
            <PhotoPlaceholder anonymous={main.anonymous} size="sm" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="flex min-w-0 items-center gap-3">
            {allTimeStar ? (
              // In em of the pixel font: one star cell is one font pixel
              // (1/8 em), and the letters fill the top 7/8 of the em, so
              // their centre is 1/16 em above the line's.
              <PixelStar
                label="Record absolu"
                className="relative -top-[0.0625em] h-[1.25em] text-scene-pixel"
              />
            ) : null}
            <p className="truncate font-display text-scene-pixel text-ink-inverse">
              {main.player_name}
            </p>
          </div>
          <p className="font-display text-scene-pixel text-ink-inverse">
            {formatScore(main.score, game.score_type)}
          </p>
          {otherAllTime ? (
            <p className="flex min-w-0 items-center gap-2 text-h4 text-ink-inverse">
              <PixelStar className="h-4" />
              <span className="truncate">
                <span className="sr-only">Record absolu : </span>
                {otherAllTime.player_name}
                {' · '}
                {formatScore(otherAllTime.score, game.score_type)}
              </span>
            </p>
          ) : null}
          {origin ? (
            <div className="text-h4 text-ink-inverse">
              {origin.event_name ? (
                <p className="truncate">{origin.event_name}</p>
              ) : null}
              <p className="truncate font-semibold">
                {formatScoreWhen(origin.created_at)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </PixelPanel>
  )
}
