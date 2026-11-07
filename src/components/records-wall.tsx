import { Link } from '@tanstack/react-router'

import { PhotoPlaceholder } from '#/components/photo-placeholder'
import { PixelPanel } from '#/components/pixel-panel'
import { PixelStar } from '#/components/pixel-star'
import { QrCode } from '#/components/qr-code'
import {
  formatScore,
  formatScoreWhen,
  isMock,
  photoUrl,
  pixelCaps,
  splitGameTitle,
} from '#/lib/highscores'
import type { GameRecord } from '#/lib/highscores'
import { useSubmitScoreUrl } from '#/lib/submit-url'
import { cn } from '#/lib/utils'
import { wallCardView } from '#/lib/wall-card'
import { WALL_COLUMNS, wallCells } from '#/lib/wall-pages'

type RecordsWallProps = {
  /** One page of the wall: six records at most. */
  records: Array<GameRecord>
  /**
   * When true, empty "À prendre !" cards show a per-game QR (`?game=<slug>`).
   * Filled cards stay as they are: no room next to the photo.
   */
  showGameQr?: boolean
  /**
   * Forced `?mode=wall` kiosk only: rebalanced top band / row gap / overscan,
   * and each card links to that game's locked view (`?game=<slug>`).
   * Rotation wall slides keep the pre-#105 layout.
   */
  forced?: boolean
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
 * Forced wall only: band under absolute title + QR at `top-24` (QR ends
 * ~240px). 320px leaves ~80px of air; spacer is `shrink-0` so cards still
 * stretch in the remaining height.
 */
const FORCED_TOP_BAND = 'h-80 shrink-0'

/**
 * Projected "mur des records": one card per visible game (mockup p.2).
 * What each card says about the all-time record is in `wallCardView()`.
 * Rotation uses the classic `pt-36` / `gap-y-4` grid; `forced` applies the
 * kiosk spacing from #105 without changing rotation card height.
 */
export function RecordsWall({
  records,
  showGameQr = false,
  forced = false,
  className,
}: RecordsWallProps) {
  const singleRow = records.length <= WALL_COLUMNS
  const cells = wallCells(records.length)

  if (forced) {
    return (
      <ForcedRecordsWall
        records={records}
        cells={cells}
        singleRow={singleRow}
        showGameQr={showGameQr}
        className={className}
      />
    )
  }

  // Rotation / admin wall: layout from before #105.
  if (singleRow) {
    return (
      <div
        className={cn(
          'flex min-h-0 flex-1 items-center justify-center',
          className,
        )}
      >
        <div
          className="grid w-full grid-cols-6 gap-x-10"
          // Match one row of a full 3×2 page. Nudge up 12px so the gap above
          // the cards equals the gap down to the pills (title/QR are absolute).
          style={{ height: 'min(100%, 46%)', transform: 'translateY(-12px)' }}
        >
          {records.map((record, i) => (
            <RecordCard
              key={record.game.id}
              record={record}
              showGameQr={showGameQr}
              linkToGame={false}
              className={cn(
                'col-span-2 min-h-0',
                COLUMN_START[cells[i].column],
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid min-h-0 flex-1 grid-cols-6 grid-rows-4 gap-x-10 gap-y-4 pt-36',
        className,
      )}
    >
      {records.map((record, i) => (
        <RecordCard
          key={record.game.id}
          record={record}
          showGameQr={showGameQr}
          linkToGame={false}
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

function ForcedRecordsWall({
  records,
  cells,
  singleRow,
  showGameQr,
  className,
}: {
  records: Array<GameRecord>
  cells: ReturnType<typeof wallCells>
  singleRow: boolean
  showGameQr: boolean
  className?: string
}) {
  if (singleRow) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
        <div className={FORCED_TOP_BAND} aria-hidden="true" />
        <div className="flex min-h-0 flex-1 items-center justify-center pb-24">
          <div
            className="grid w-full grid-cols-6 gap-x-10"
            style={{ height: 'min(100%, 46%)' }}
          >
            {records.map((record, i) => (
              <RecordCard
                key={record.game.id}
                record={record}
                showGameQr={showGameQr}
                linkToGame
                className={cn(
                  'col-span-2 min-h-0',
                  COLUMN_START[cells[i].column],
                )}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className={FORCED_TOP_BAND} aria-hidden="true" />
      <div className="grid min-h-0 flex-1 grid-cols-6 grid-rows-4 gap-x-10 gap-y-12 pb-24">
        {records.map((record, i) => (
          <RecordCard
            key={record.game.id}
            record={record}
            showGameQr={showGameQr}
            linkToGame
            className={cn(
              'col-span-2 row-span-2',
              COLUMN_START[cells[i].column],
              ROW_START[cells[i].row],
            )}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyGameQr({
  gameSlug,
  gameName,
}: {
  gameSlug: string
  gameName: string
}) {
  const submitUrl = useSubmitScoreUrl(isMock, { gameSlug })
  if (!submitUrl) return <div className="size-24 shrink-0" aria-hidden="true" />
  // No shadow-pixel: inside a white panel the hard offset clips and reads as
  // a broken border. `inline-flex` + fixed SVG avoids the baseline hairline.
  return (
    <div className="inline-flex shrink-0 rounded-none border-4 border-line-accent bg-surface-inverse p-2">
      <QrCode
        value={submitUrl}
        label={`QR code pour envoyer un score sur ${gameName}`}
        className="size-24"
      />
    </div>
  )
}

function RecordCard({
  record,
  showGameQr,
  linkToGame,
  className,
}: {
  record: GameRecord
  showGameQr: boolean
  linkToGame: boolean
  className?: string
}) {
  const { game } = record
  const view = wallCardView(record)
  const { title, subtitle } = splitGameTitle(game.name)
  const openLabel = `Voir le classement de ${game.name}`

  const panel = (
    <PixelPanel
      label={title}
      subtitle={subtitle}
      className={cn('min-w-0', linkToGame ? 'size-full' : className)}
    >
      {view.kind === 'empty' ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-2 text-center">
          <p className="font-display text-scene-pixel text-ink-inverse">
            {pixelCaps('À prendre !')}
          </p>
          <p className="text-scene-meta text-ink-inverse">
            Pas encore de record sur ce jeu.
          </p>
          {showGameQr ? (
            <EmptyGameQr gameSlug={game.slug} gameName={game.name} />
          ) : null}
        </div>
      ) : (
        <FilledCardBody game={game} view={view} />
      )}
    </PixelPanel>
  )

  if (!linkToGame) return panel

  return (
    <Link
      to="/"
      search={(prev) => ({ ...prev, mode: undefined, game: game.slug })}
      aria-label={openLabel}
      title={openLabel}
      className={cn(
        'min-h-0 min-w-0 cursor-pointer rounded-none outline-none focus-visible:ring-4 focus-visible:ring-line-accent',
        className,
      )}
    >
      {panel}
    </Link>
  )
}

function FilledCardBody({
  game,
  view,
}: {
  game: GameRecord['game']
  view: Exclude<ReturnType<typeof wallCardView>, { kind: 'empty' }>
}) {
  const { main, allTimeStar, otherAllTime, origin } = view
  const image = main.anonymous ? null : photoUrl(main.photo_path)

  return (
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
  )
}
