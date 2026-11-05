import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { GameThumb } from '#/components/game-thumb'
import { Logo } from '#/components/logo'
import { NewRecordScreen } from '#/components/new-record-screen'
import { PixelPanel } from '#/components/pixel-panel'
import { QrCode } from '#/components/qr-code'
import { RecordsWall } from '#/components/records-wall'
import { ScreenStage } from '#/components/screen-stage'
import { ScoreTable } from '#/components/score-table'
import type { ScoreTableRow } from '#/components/score-table'
import {
  DEFAULT_SETTINGS,
  findNewRecords,
  formatScore,
  formatScoreWhen,
  formatStation,
  leaderboardQuery,
  photoUrl,
  recordsQuery,
  settingsQuery,
  useHighscoresRealtime,
  visibleGamesQuery,
} from '#/lib/highscores'
import { FRESH_MS, findFreshScores } from '#/lib/fresh-scores'
import type { DisplayedGame, GameRecord, NewRecord } from '#/lib/highscores'
import { screenOptions, screenSearchSchema } from '#/lib/screen-options'
import { cn } from '#/lib/utils'

/** Brief dip to black when the screen changes: out, then back in on the new one. */
const FADE_MS = 300
/** How long the "Nouveau record" takeover stays on screen. */
const NEW_RECORD_MS = 12_000
/** The records wall shows 3×2 cards (mockup p.2); more games add a page. */
const WALL_PAGE_SIZE = 6
/** Reload the screen when the live connection stays lost this long. */
const RECONNECT_RELOAD_MS = 60_000

type Slide =
  { kind: 'game'; game: DisplayedGame } | { kind: 'wall'; page: number }

export const Route = createFileRoute('/')({
  staticData: { theme: 'scene' },
  validateSearch: screenSearchSchema,
  component: PublicScreen,
})

function PublicScreen() {
  useHighscoresRealtime({ reloadAfterMs: RECONNECT_RELOAD_MS })
  const games = useQuery(visibleGamesQuery)
  const settings = useQuery(settingsQuery)
  const records = useQuery(recordsQuery)
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
    const wallPages = Array.from(
      { length: Math.max(1, Math.ceil(list.length / WALL_PAGE_SIZE)) },
      (_, page) => ({ kind: 'wall' as const, page }),
    )
    if (screenMode === 'wall') return wallPages
    if (screenMode === 'game')
      return list.map((game) => ({ kind: 'game' as const, game }))
    // "Alterner les deux": the wall first, then each game (docs/screens.md).
    return [
      ...wallPages,
      ...list.map((game) => ({ kind: 'game' as const, game })),
    ]
  }, [games.data, screenMode])

  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [celebration, setCelebration] = useState<NewRecord | null>(null)
  const [celebrationQueue, setCelebrationQueue] = useState<Array<NewRecord>>([])
  const previousRecords = useRef<Array<GameRecord> | null>(null)
  const count = slides.length
  const safeIndex = count === 0 ? 0 : index % count
  const slide: Slide | undefined = count === 0 ? undefined : slides[safeIndex]
  const durationMs =
    slide && slide.kind === 'wall' ? wallDurationMs : gameDurationMs
  const paused = celebration !== null

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

  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => setCelebration(null), NEW_RECORD_MS)
    return () => window.clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    setIndex(0)
  }, [screenMode, games.data?.length])

  useEffect(() => {
    setStartedAt(Date.now())
  }, [safeIndex, durationMs, count])

  useEffect(() => {
    if (paused || count < 2) return
    const tick = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t - startedAt >= durationMs) {
        setIndex((i) => (i + 1) % count)
      }
    }, 50)
    return () => window.clearInterval(tick)
  }, [count, durationMs, startedAt, paused])

  // Keep the progress bar alive when there is a single slide (wall-only).
  useEffect(() => {
    if (paused || count !== 1) return
    const tick = window.setInterval(() => setNow(Date.now()), 50)
    return () => window.clearInterval(tick)
  }, [count, paused])

  useEffect(() => {
    if (paused || count !== 1) return
    if (now - startedAt < durationMs) return
    setStartedAt(Date.now())
  }, [count, durationMs, now, startedAt, paused])

  const progress =
    count === 0 ? 0 : Math.min(1, Math.max(0, (now - startedAt) / durationMs))
  const fadedOut =
    count > 1 && !paused && now - startedAt >= durationMs - FADE_MS

  const game = slide && slide.kind === 'game' ? slide.game : undefined
  const record = game
    ? records.data?.find((entry) => entry.game.id === game.id)
    : undefined
  const wallPage = slide && slide.kind === 'wall' ? slide.page : null
  const showWall = wallPage !== null

  return (
    <ScreenStage>
      <main className="relative flex size-full flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-surface-base bg-[url('/pixel-background.svg')] bg-cover bg-center"
        />

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-20 h-2 bg-surface-sunken"
        >
          <div
            className="h-full bg-surface-accent transition-[width] duration-75 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

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
                <p className="font-display text-arcade-label uppercase text-ink-accent">
                  Highscores
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
              'flex min-h-0 flex-1 flex-col px-24',
              showHeader ? 'pt-10' : 'pt-24',
            )}
          >
            {records.isPending && <p className="text-scene-row">Chargement…</p>}
            {records.isError && (
              <p className="text-scene-row">
                Impossible de charger les records.
              </p>
            )}
            {records.isSuccess && (
              <RecordsWall
                records={records.data.slice(
                  wallPage * WALL_PAGE_SIZE,
                  (wallPage + 1) * WALL_PAGE_SIZE,
                )}
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
                  game={game}
                  rows={rows}
                  minAllTimeRows={minAllTimeRows}
                />
              )}
            </div>
            <aside className="flex min-h-0 w-136 shrink-0 flex-col gap-8">
              {game && <RecordPanel game={game} record={record} />}
              <SubmitScorePanel />
            </aside>
          </div>
        )}

        {count > 0 ? (
          <nav
            aria-label="Écrans en rotation"
            className="flex h-28 shrink-0 items-center justify-center gap-4"
          >
            {slides.map((entry, i) =>
              entry.kind === 'wall' ? (
                <button
                  key={`wall-${entry.page}`}
                  type="button"
                  aria-current={i === safeIndex ? 'true' : undefined}
                  aria-label={
                    entry.page === 0
                      ? 'Mur des records'
                      : `Mur des records, page ${entry.page + 1}`
                  }
                  onClick={() => setIndex(i)}
                  className="rounded-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <WallThumb active={i === safeIndex} />
                </button>
              ) : (
                <button
                  key={entry.game.id}
                  type="button"
                  aria-current={i === safeIndex ? 'true' : undefined}
                  aria-label={entry.game.name}
                  onClick={() => setIndex(i)}
                  className="rounded-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <GameThumb
                    name={entry.game.name}
                    shortLabel={entry.game.short_label}
                    coverPath={entry.game.cover_path}
                    active={i === safeIndex}
                  />
                </button>
              ),
            )}
          </nav>
        ) : null}

        {celebration ? <NewRecordScreen entry={celebration} /> : null}
      </main>
    </ScreenStage>
  )
}

/** Distinct mark for the records wall in the rotation pills. */
function WallThumb({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex size-14 shrink-0 items-center justify-center rounded-none border-4 bg-surface-overlay font-display text-arcade-label text-ink-primary',
        active
          ? 'border-line-accent shadow-pixel'
          : 'border-line-strong opacity-70',
      )}
      title="Mur des records"
    >
      <span aria-hidden="true">★</span>
    </span>
  )
}

function SubmitScorePanel() {
  const [submitUrl, setSubmitUrl] = useState<string | null>(null)

  useEffect(() => {
    setSubmitUrl(`${window.location.origin}/score`)
  }, [])

  return (
    <PixelPanel label="À TOI DE JOUER">
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
        <div className="min-w-0 text-left">
          <p className="text-body font-extrabold text-ink-inverse">
            Un record à afficher ?
          </p>
          <p className="text-body-sm text-ink-inverse/75">
            Scanne, prends ta photo, c&apos;est parti !
          </p>
        </div>
      </div>
    </PixelPanel>
  )
}

function RecordPanel({
  game,
  record,
}: {
  game: DisplayedGame
  record: GameRecord | undefined
}) {
  const current = record?.current
  const image = photoUrl(current?.photo_path ?? null)
  const when = current ? formatScoreWhen(current.created_at) : null

  return (
    <PixelPanel label="LE RECORD" className="min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-none border-4 border-line-subtle bg-surface-base">
          {image ? (
            <img
              src={image}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-ink-secondary">
              <span
                aria-hidden="true"
                className="size-12 border-4 border-line-subtle bg-surface-overlay"
              />
              <p className="text-body-sm">Photo du record</p>
            </div>
          )}
        </div>
        {current ? (
          <p className="text-body-ui text-ink-inverse">
            <span className="font-extrabold">{current.player_name}</span>
            {when ? (
              <span className="text-ink-inverse/75"> · {when}</span>
            ) : null}
          </p>
        ) : (
          <p className="text-body-sm text-ink-inverse/75">
            Pas encore de record sur {game.name}.
          </p>
        )}
      </div>
    </PixelPanel>
  )
}

function GameLeaderboard({
  game,
  rows: rowsShown,
  minAllTimeRows,
}: {
  game: DisplayedGame
  rows: number
  minAllTimeRows: number
}) {
  const board = useQuery(
    leaderboardQuery(game.id, { rows: rowsShown, minAllTimeRows }),
  )
  const fresh = useFreshScores(game.id, board.data?.rows)

  const tableRows: Array<ScoreTableRow> =
    board.data?.rows.map((row) => ({
      id: row.id,
      rank: row.rank,
      player: row.player_name,
      score: formatScore(row.score, game.score_type),
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
      separatorAt={board.data?.separator_at ?? null}
      className="flex-1"
    />
  )
}

/** Score ids already on screen, per game, for as long as the screen runs. */
const seenScores = new Map<string, Set<string>>()

/**
 * Ids of the scores approved since the screen last showed this game. They
 * stay highlighted for FRESH_MS (the passing pink row of the spec).
 */
function useFreshScores(
  gameId: string,
  rows: ReadonlyArray<{ id: string; created_at: string }> | undefined,
) {
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    if (!rows) return
    const result = findFreshScores(seenScores.get(gameId), rows)
    seenScores.set(gameId, result.seen)
    if (result.fresh.length === 0) return
    setFresh(new Set(result.fresh))
    const timer = window.setTimeout(() => setFresh(new Set()), FRESH_MS)
    return () => window.clearTimeout(timer)
  }, [gameId, rows])

  return fresh
}
