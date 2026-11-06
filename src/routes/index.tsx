import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { GameThumb } from '#/components/game-thumb'
import { Logo } from '#/components/logo'
import { NewRecordScreen } from '#/components/new-record-screen'
import { PhotoPlaceholder } from '#/components/photo-placeholder'
import { PixelPanel } from '#/components/pixel-panel'
import { PixelStar } from '#/components/pixel-star'
import { QrCode } from '#/components/qr-code'
import { RecordsWall } from '#/components/records-wall'
import { ScreenStage } from '#/components/screen-stage'
import { ScoreTable } from '#/components/score-table'
import type { ScoreTableRow } from '#/components/score-table'
import {
  DEFAULT_SETTINGS,
  PUBLIC_RELOAD_AFTER_MS,
  findNewRecords,
  formatScore,
  formatScoreWhen,
  formatStation,
  isMock,
  leaderboardQuery,
  photoUrl,
  pixelCaps,
  realtimeFallbackInterval,
  recordsQuery,
  settingsQuery,
  useHighscoresRealtime,
  visibleGamesQuery,
} from '#/lib/highscores'
import { FRESH_MS, findFreshScores } from '#/lib/fresh-scores'
import type { DisplayedGame, GameRecord, NewRecord } from '#/lib/highscores'
import { screenOptions, screenSearchSchema } from '#/lib/screen-options'
import { useSubmitScoreUrl } from '#/lib/submit-url'
import { useScreenWakeLock } from '#/lib/wake-lock'
import {
  DOUBLE_CLICK_MS,
  INITIAL_ROTATION,
  advance,
  afterCelebration,
  clickPill,
  progressShown,
  resume,
  settleClick,
} from '#/lib/rotation-control'
import type { RotationState } from '#/lib/rotation-control'
import { cn } from '#/lib/utils'
import { wallPages } from '#/lib/wall-pages'

/** Brief dip to black when the screen changes: out, then back in on the new one. */
const FADE_MS = 300
/** How long the "Nouveau record" takeover stays on screen. */
const NEW_RECORD_MS = 12_000

type Slide =
  | { kind: 'game'; game: DisplayedGame }
  | { kind: 'wall'; page: number; pages: number }

export const Route = createFileRoute('/')({
  staticData: { theme: 'scene' },
  validateSearch: screenSearchSchema,
  component: PublicScreen,
})

function PublicScreen() {
  useScreenWakeLock()
  const realtime = useHighscoresRealtime({
    reloadAfterMs: PUBLIC_RELOAD_AFTER_MS,
  })
  const refetchInterval = realtimeFallbackInterval(realtime)
  const games = useQuery({ ...visibleGamesQuery, refetchInterval })
  const settings = useQuery({ ...settingsQuery, refetchInterval })
  const records = useQuery({ ...recordsQuery, refetchInterval })
  const {
    gameDurationMs,
    wallDurationMs,
    screenMode,
    rows,
    minAllTimeRows,
    showHeader,
  } = screenOptions(settings.data ?? DEFAULT_SETTINGS, Route.useSearch())

  const slides = useMemo<Array<Slide>>(() => {
    const list = games.data ?? []
    const pages = wallPages(list).length
    const wall = Array.from({ length: pages }, (_, page) => ({
      kind: 'wall' as const,
      page,
      pages,
    }))
    const perGame = list.map((game) => ({ kind: 'game' as const, game }))
    if (screenMode === 'wall') return wall
    if (screenMode === 'game') return perGame
    // "Alterner les deux": the wall first, then each game (docs/screens.md).
    return [...wall, ...perGame]
  }, [games.data, screenMode])

  const [rotation, setRotation] = useState<RotationState>(INITIAL_ROTATION)
  const { index, lap, held, pending } = rotation
  const settleTimer = useRef<number | undefined>(undefined)
  const [fadedOut, setFadedOut] = useState(false)
  const [celebration, setCelebration] = useState<NewRecord | null>(null)
  const [celebrationQueue, setCelebrationQueue] = useState<Array<NewRecord>>([])
  /** Last celebrated score: its row turns pink when the takeover ends. */
  const [celebrated, setCelebrated] = useState<{
    gameId: string
    scoreId: string
  } | null>(null)
  const previousRecords = useRef<Array<GameRecord> | null>(null)
  const slidesRef = useRef(slides)
  const count = slides.length
  const safeIndex = count === 0 ? 0 : index % count
  const slide: Slide | undefined = count === 0 ? undefined : slides[safeIndex]
  const durationMs =
    slide && slide.kind === 'wall' ? wallDurationMs : gameDurationMs
  const paused = celebration !== null

  useEffect(() => {
    slidesRef.current = slides
  }, [slides])

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  /** A click on a pill; a double click holds the slide (rotation-control.ts). */
  const selectSlide = (i: number, clicks: number) => {
    window.clearTimeout(settleTimer.current)
    setRotation((state) => clickPill(state, i, clicks))
    if (clicks >= 2) return
    settleTimer.current = window.setTimeout(
      () => setRotation(settleClick),
      DOUBLE_CLICK_MS,
    )
  }

  const resumeRotation = () => {
    window.clearTimeout(settleTimer.current)
    setRotation(resume)
  }

  useEffect(() => {
    if (!records.data) return
    if (previousRecords.current === null) {
      previousRecords.current = records.data
      return
    }
    const found = findNewRecords(previousRecords.current, records.data)
    previousRecords.current = records.data
    if (found.length === 0) return
    setCelebrationQueue((queue) => [...queue, ...found])
  }, [records.data])

  useEffect(() => {
    if (celebration || celebrationQueue.length === 0) return
    const [next, ...rest] = celebrationQueue
    setCelebration(next)
    setCelebrationQueue(rest)
  }, [celebration, celebrationQueue])

  // After the takeover, the screen shows the game of the record, from the
  // start of its time, with the new row in pink; a held slide stays held.
  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => {
      const target = slidesRef.current.findIndex(
        (entry) =>
          entry.kind === 'game' && entry.game.id === celebration.game.id,
      )
      setRotation((state) => afterCelebration(state, target))
      setCelebrated({
        gameId: celebration.game.id,
        scoreId: celebration.record.id,
      })
      setCelebration(null)
    }, NEW_RECORD_MS)
    return () => window.clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    setRotation((state) => ({ ...state, index: 0 }))
  }, [screenMode, games.data?.length])

  // Two timers per slide, so the screen only renders when something changes:
  // the progress bar animates on its own (see RotationProgress).
  useEffect(() => {
    setFadedOut(false)
    if (paused || held || pending || count === 0) return
    const fade =
      count > 1
        ? window.setTimeout(() => setFadedOut(true), durationMs - FADE_MS)
        : undefined
    const next = window.setTimeout(
      () => setRotation((state) => advance(state, count)),
      durationMs,
    )
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(next)
    }
  }, [safeIndex, lap, count, durationMs, paused, held, pending])

  const game = slide && slide.kind === 'game' ? slide.game : undefined
  const record = game
    ? records.data?.find((entry) => entry.game.id === game.id)
    : undefined
  const emptyGame = Boolean(record && !record.all_time)
  const wallPage = slide && slide.kind === 'wall' ? slide.page : null
  const showWall = wallPage !== null

  return (
    <ScreenStage>
      <main className="relative flex size-full flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-surface-base bg-[url('/pixel-background.svg')] bg-cover bg-center"
        />

        <RotationProgress
          key={`${safeIndex}-${lap}-${count}-${durationMs}`}
          durationMs={durationMs}
          shown={progressShown(rotation, count)}
          frozen={paused}
        />

        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-300 ease-linear',
            fadedOut ? 'opacity-100' : 'opacity-0',
          )}
        />

        {showHeader ? (
          <header className="flex h-44 shrink-0 items-center justify-between gap-8 border-b-4 border-line-subtle bg-surface-sunken px-24">
            {showWall ? (
              <div className="flex flex-col gap-2">
                <p className="font-display text-scene-pixel text-ink-accent">
                  {pixelCaps('Highscores')}
                </p>
                <h1 className="text-scene-hero uppercase">Les records</h1>
              </div>
            ) : (
              <h1 className="text-scene-hero uppercase">Highscores</h1>
            )}
            <Logo alt="" className="m-0 w-60 shrink-0" />
          </header>
        ) : null}

        {showWall ? (
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col gap-6 px-24',
              showHeader ? 'pt-10' : 'pt-24',
            )}
          >
            <div className="flex shrink-0 items-start justify-between gap-8">
              {showHeader ? (
                <div className="min-w-0 flex-1" />
              ) : (
                <h1 className="min-w-0 font-display text-scene-pixel text-ink-accent">
                  {pixelCaps('Les records')}
                </h1>
              )}
              <GlobalSubmitQr />
            </div>
            {records.isPending && <p className="text-scene-row">Chargement…</p>}
            {records.isError && (
              <p className="text-scene-row">
                Impossible de charger les records.
              </p>
            )}
            {records.isSuccess && (
              <RecordsWall
                records={wallPages(records.data)[wallPage] ?? []}
                showGameQr
              />
            )}
          </div>
        ) : (
          <div
            className={cn(
              'flex min-h-0 flex-1 gap-12 px-24',
              showHeader ? 'pt-10' : 'pt-24',
            )}
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {games.isPending && <p className="text-scene-row">Chargement…</p>}
              {games.isError && (
                <p className="text-scene-row">
                  Impossible de charger les jeux.
                </p>
              )}
              {games.isSuccess && !game && (
                <p className="text-scene-row">
                  Aucun jeu affiché pour l&apos;instant.
                </p>
              )}
              {game && (
                <GameLeaderboard
                  key={game.id}
                  game={game}
                  rows={rows}
                  minAllTimeRows={minAllTimeRows}
                  paused={paused}
                  celebratedId={
                    celebrated?.gameId === game.id ? celebrated.scoreId : null
                  }
                  refetchInterval={refetchInterval}
                />
              )}
            </div>
            {emptyGame ? null : (
              <aside className="flex min-h-0 w-140 shrink-0 flex-col gap-8">
                {game && <RecordPanel game={game} record={record} />}
                <SubmitScorePanel gameSlug={game?.slug} />
              </aside>
            )}
          </div>
        )}

        {count > 0 ? (
          <RotationPills
            slides={slides}
            current={safeIndex}
            held={held}
            onSelect={selectSlide}
            onResume={resumeRotation}
          />
        ) : null}

        {celebration ? <NewRecordScreen entry={celebration} /> : null}
      </main>
    </ScreenStage>
  )
}

/**
 * Rotation progress at the top of the stage. A CSS animation fills it over
 * `durationMs`, without re-rendering anything; remount it (new `key`) to
 * start over. `frozen` stops it where it is.
 */
function RotationProgress({
  durationMs,
  shown,
  frozen,
}: {
  durationMs: number
  shown: boolean
  frozen: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 z-20 h-2 bg-surface-sunken"
    >
      {shown ? (
        <div
          className="h-full origin-left bg-surface-accent"
          style={{
            animation: `mdlr-rotation-progress ${durationMs}ms linear forwards`,
            animationPlayState: frozen ? 'paused' : 'running',
          }}
        />
      ) : null}
      <style>{`
        @keyframes mdlr-rotation-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}

/**
 * Position in the rotation, 96px clear of the bottom edge (overscan). A
 * click shows that slide from the start of its time; a double click holds
 * it, and the next click resumes. The pause button sits beside the pills
 * without moving them.
 */
function RotationPills({
  slides,
  current,
  held,
  onSelect,
  onResume,
}: {
  slides: Array<Slide>
  current: number
  held: boolean
  onSelect: (index: number, clicks: number) => void
  onResume: () => void
}) {
  return (
    <nav
      aria-label="Écrans en rotation"
      className="flex shrink-0 justify-center pt-6 pb-24"
    >
      <div className="relative flex items-center gap-6">
        {slides.map((entry, i) => (
          <button
            key={entry.kind === 'wall' ? `wall-${entry.page}` : entry.game.id}
            type="button"
            aria-current={i === current ? 'true' : undefined}
            aria-label={
              entry.kind === 'game'
                ? entry.game.name
                : entry.page === 0
                  ? 'Mur des records'
                  : `Mur des records, page ${entry.page + 1}`
            }
            onClick={(event) => onSelect(i, event.detail)}
            className="rounded-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {entry.kind === 'wall' ? (
              <WallThumb
                active={i === current}
                page={entry.pages > 1 ? entry.page + 1 : null}
              />
            ) : (
              <GameThumb
                name={entry.game.name}
                shortLabel={entry.game.short_label}
                coverPath={entry.game.cover_path}
                active={i === current}
                className="h-16 w-20 text-arcade-name"
              />
            )}
          </button>
        ))}
        {held ? <PauseButton onClick={onResume} /> : null}
      </div>
    </nav>
  )
}

/** Two bars on an 8-unit grid. */
const PAUSE_BARS = [
  [1, 1, 2, 6],
  [5, 1, 2, 6],
] as const

/**
 * Says the rotation is held; a click resumes it on the slide on screen.
 * Still, not blinking: no looping animation on the projected screen.
 */
function PauseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Reprendre la rotation"
      onClick={onClick}
      className="absolute left-full ml-6 inline-flex h-16 cursor-pointer items-center gap-3 rounded-none border-4 border-line-accent bg-surface-sunken px-4 font-display text-arcade-name leading-none text-ink-accent hover:bg-surface-overlay focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <svg
        viewBox="0 0 8 8"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
        className="size-4 shrink-0 fill-current"
      >
        {PAUSE_BARS.map(([x, y, width, height]) => (
          <rect key={x} x={x} y={y} width={width} height={height} />
        ))}
      </svg>
      <span className="translate-y-px">{pixelCaps('Pause')}</span>
    </button>
  )
}

/** Distinct mark for the records wall in the rotation pills. */
function WallThumb({ active, page }: { active: boolean; page: number | null }) {
  return (
    <span
      className={cn(
        'inline-flex h-16 w-20 shrink-0 items-center justify-center rounded-none border-4 bg-surface-overlay font-display text-arcade-name text-ink-primary',
        active
          ? 'border-line-accent shadow-pixel'
          : 'border-line-strong opacity-70',
      )}
      title="Mur des records"
    >
      <span aria-hidden="true" className="flex items-center gap-2 leading-none">
        <PixelStar className="h-3.5 text-current" />
        {/* Press Start 2P keeps a descender row under its digits. */}
        {page === null ? null : <span className="translate-y-px">{page}</span>}
      </span>
    </span>
  )
}

/**
 * Always-on QR to `/score` (no game). Lives on the wall so a player can send
 * any score without waiting for a game slide.
 */
function GlobalSubmitQr() {
  const submitUrl = useSubmitScoreUrl(isMock)

  return (
    <div className="flex shrink-0 items-center gap-4 rounded-none border-4 border-line-accent bg-surface-inverse p-3 shadow-pixel">
      {submitUrl ? (
        <QrCode
          value={submitUrl}
          label="QR code pour envoyer ton score"
          className="size-28 shrink-0"
        />
      ) : (
        <div className="size-28 shrink-0" aria-hidden="true" />
      )}
      <div className="flex min-w-0 max-w-56 flex-col gap-1 text-left">
        <p className="text-scene-meta font-extrabold text-ink-inverse">
          Un record ?
        </p>
        <p className="text-h4 font-semibold text-ink-inverse">
          Scanne, c&apos;est parti !
        </p>
      </div>
    </div>
  )
}

/**
 * Side-panel QR on a game slide. Prefills that game via `?game=<slug>` when
 * known; the player can still change it on the phone. No second global QR
 * here: the wall already carries the unscoped one, and the aside is tight.
 */
function SubmitScorePanel({ gameSlug }: { gameSlug?: string }) {
  const submitUrl = useSubmitScoreUrl(isMock, { gameSlug })

  return (
    <PixelPanel label="À toi de jouer" className="shrink-0">
      <div className="flex items-center gap-6">
        {submitUrl ? (
          <QrCode
            value={submitUrl}
            label="QR code pour envoyer ton score"
            className="size-44 shrink-0 bg-surface-inverse"
          />
        ) : (
          <div className="size-44 shrink-0 bg-surface-base" />
        )}
        <div className="flex min-w-0 flex-col gap-2 text-left">
          <p className="text-scene-meta font-extrabold text-ink-inverse">
            Un record à afficher ?
          </p>
          <p className="text-h4 font-semibold text-ink-inverse">
            Scanne, prends ta photo, c&apos;est parti !
          </p>
        </div>
      </div>
    </PixelPanel>
  )
}

/** A game nobody has played yet: the QR code takes the whole table. */
function EmptyGameInvite({ gameSlug }: { gameSlug: string }) {
  const submitUrl = useSubmitScoreUrl(isMock, { gameSlug })

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center gap-16 px-12 pb-12">
      <div className="shrink-0 rounded-none border-4 border-line-accent bg-surface-inverse p-4 shadow-pixel">
        {submitUrl ? (
          <QrCode
            value={submitUrl}
            label="QR code pour envoyer ton score"
            className="size-96"
          />
        ) : (
          <div className="size-96" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <p className="font-display text-scene-pixel text-ink-accent">
          {pixelCaps('À prendre !')}
        </p>
        <p className="text-scene-row">
          Personne n&apos;a encore posé de score.
        </p>
        <p className="text-scene-meta text-ink-secondary">
          Scanne, prends ta photo devant l&apos;écran, et le premier record est
          à toi !
        </p>
      </div>
    </div>
  )
}

/**
 * The record of the current event, or the all-time record (with its date and
 * event) when nobody has scored yet this time.
 */
function RecordPanel({
  game,
  record,
}: {
  game: DisplayedGame
  record: GameRecord | undefined
}) {
  const current = record?.current ?? null
  const allTime = record?.all_time ?? null
  const shown = current ?? allTime
  if (!shown) return null

  const image = shown.anonymous ? null : photoUrl(shown.photo_path)
  const when = formatScoreWhen(shown.created_at)
  const meta = current
    ? when
    : [when, allTime?.event_name].filter(Boolean).join(' · ')

  return (
    <PixelPanel
      label={current ? 'Record évènement' : 'Record absolu'}
      className="min-h-0 flex-1"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-none border-4 border-line-subtle bg-surface-base">
          {image ? (
            <img
              src={image}
              alt=""
              className="size-full object-contain"
              draggable={false}
            />
          ) : (
            <PhotoPlaceholder anonymous={shown.anonymous} size="md" />
          )}
        </div>
        <div className="flex shrink-0 items-baseline justify-between gap-4 text-ink-inverse">
          <p className="min-w-0 truncate text-scene-meta font-extrabold">
            {shown.player_name}
          </p>
          <p className="shrink-0 font-display text-scene-pixel">
            {formatScore(shown.score, game.score_type)}
          </p>
        </div>
        {meta ? (
          <p className="shrink-0 truncate text-h4 font-semibold text-ink-inverse">
            {meta}
          </p>
        ) : null}
      </div>
    </PixelPanel>
  )
}

function GameLeaderboard({
  game,
  rows: rowsShown,
  minAllTimeRows,
  paused,
  celebratedId,
  refetchInterval,
}: {
  game: DisplayedGame
  rows: number
  minAllTimeRows: number
  paused: boolean
  celebratedId: string | null
  refetchInterval: number | false
}) {
  const board = useQuery({
    ...leaderboardQuery(game.id, { rows: rowsShown, minAllTimeRows }),
    refetchInterval,
  })
  const fresh = useFreshScores(game.id, board.data?.rows, paused, celebratedId)
  const separatorAt = board.data?.separator_at ?? null

  const tableRows: Array<ScoreTableRow> =
    board.data?.rows.map((row) => ({
      id: row.id,
      rank: row.rank,
      player: row.player_name,
      score: formatScore(row.score, game.score_type),
      // Same wall rule: never a photo URL for an anonymous score.
      photoSrc: row.anonymous ? null : photoUrl(row.photo_path),
      anonymous: row.anonymous,
      dimmed: row.dimmed,
      fresh: fresh.has(row.id),
      meta: [formatScoreWhen(row.created_at), row.dimmed && row.event_name]
        .filter(Boolean)
        .join(' · '),
    })) ?? []

  return (
    <ScoreTable
      game={game.name}
      machine={formatStation(game.console, game.station_label) || null}
      rows={tableRows}
      separatorAt={separatorAt}
      separatorLabel={
        separatorAt === null
          ? null
          : (board.data?.rows[separatorAt]?.event_name ?? null)
      }
      empty={
        board.data?.empty ? <EmptyGameInvite gameSlug={game.slug} /> : undefined
      }
      className="flex-1"
    />
  )
}

/** Score ids already on screen, per game, for as long as the screen runs. */
const seenScores = new Map<string, Set<string>>()
/** Celebrated scores already highlighted once. */
const highlightedRecords = new Set<string>()

/**
 * Ids of the scores approved since the screen last showed this game, plus
 * the record just celebrated. They stay highlighted for FRESH_MS of screen
 * time: the clock waits while a takeover covers the table.
 */
function useFreshScores(
  gameId: string,
  rows: ReadonlyArray<{ id: string; created_at: string }> | undefined,
  paused: boolean,
  celebratedId: string | null,
) {
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    if (!rows) return
    const result = findFreshScores(seenScores.get(gameId), rows)
    seenScores.set(gameId, result.seen)
    const ids = result.fresh
    if (
      celebratedId &&
      !highlightedRecords.has(celebratedId) &&
      rows.some((row) => row.id === celebratedId)
    ) {
      highlightedRecords.add(celebratedId)
      ids.push(celebratedId)
    }
    if (ids.length === 0) return
    setFresh((previous) => new Set([...previous, ...ids]))
  }, [gameId, rows, celebratedId])

  useEffect(() => {
    if (paused || fresh.size === 0) return
    const timer = window.setTimeout(() => setFresh(new Set()), FRESH_MS)
    return () => window.clearTimeout(timer)
  }, [fresh, paused])

  return fresh
}
