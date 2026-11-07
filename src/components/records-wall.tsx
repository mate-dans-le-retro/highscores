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
   * When true (forced `?mode=wall` kiosk), each card links to that game's
   * locked view (`?game=<slug>`).
   */
  linkToGame?: boolean
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
}

/**
 * Absolute title + QR sit at `top-24` (~96px) and the QR is ~144px tall, so
 * it ends near 240px. The top flex spacer is at least 400px (≈160px of air
 * under the QR); the bottom spacer is at least 160px so the purple above and
 * below the block match in a full-HD frame (including the stage overscan).
 */
const WALL_TOP_SPACER = 'min-h-[400px] flex-1'
const WALL_BOTTOM_SPACER = 'min-h-40 flex-1'

/** Two-row block: 220px rows + `gap-y-20` (80px). */
const TWO_ROW_BLOCK_PX = 520
/** Single-row block: one card row, same visual weight as one two-row track. */
const ONE_ROW_BLOCK_PX = 240

/**
 * `wallCells` still speaks in 1/3 on a 4-track grid; the visual wall is two
 * tracks, so row 3 maps to row-start-2.
 */
function visualRow(cellRow: number): 1 | 2 {
  return cellRow <= 2 ? 1 : 2
}

/**
 * Projected "mur des records": one card per visible game (mockup p.2).
 * What each card says about the all-time record is in `wallCardView()`.
 * The card block is a fixed height, vertically balanced under the QR (not
 * stretched), with a row gap larger than the column gap so two rows breathe.
 */
export function RecordsWall({
  records,
  showGameQr = false,
  linkToGame = false,
  className,
}: RecordsWallProps) {
  const singleRow = records.length <= WALL_COLUMNS
  const cells = wallCells(records.length)

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className={WALL_TOP_SPACER} aria-hidden="true" />
      <div
        className={cn(
          'grid w-full shrink-0 grid-cols-6 gap-x-10',
          singleRow ? 'grid-rows-1' : 'grid-rows-2 gap-y-20',
        )}
        style={{ height: singleRow ? ONE_ROW_BLOCK_PX : TWO_ROW_BLOCK_PX }}
      >
        {records.map((record, i) => (
          <RecordCard
            key={record.game.id}
            record={record}
            showGameQr={showGameQr}
            linkToGame={linkToGame}
            className={cn(
              'col-span-2 min-h-0',
              COLUMN_START[cells[i].column],
              singleRow ? undefined : ROW_START[visualRow(cells[i].row)],
            )}
          />
        ))}
      </div>
      <div className={WALL_BOTTOM_SPACER} aria-hidden="true" />
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
