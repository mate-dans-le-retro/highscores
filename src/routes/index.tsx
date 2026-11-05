import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { GameThumb } from '#/components/game-thumb'
import { Logo } from '#/components/logo'
import { PixelPanel } from '#/components/pixel-panel'
import { QrCode } from '#/components/qr-code'
import { ScoreTable } from '#/components/score-table'
import type { ScoreTableRow } from '#/components/score-table'
import {
  DEFAULT_SETTINGS,
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
import type { DisplayedGame, GameRecord } from '#/lib/highscores'
import { screenOptions, screenSearchSchema } from '#/lib/screen-options'
import { cn } from '#/lib/utils'

/** Last stretch of the rotation: fade the screen toward black. */
const FADE_MS = 2_500

export const Route = createFileRoute('/')({
  staticData: { theme: 'scene' },
  validateSearch: screenSearchSchema,
  component: PublicScreen,
})

function PublicScreen() {
  useHighscoresRealtime()
  const games = useQuery(visibleGamesQuery)
  const settings = useQuery(settingsQuery)
  const records = useQuery(recordsQuery)
  const { rotationMs, rows, minAllTimeRows } = screenOptions(
    settings.data ?? DEFAULT_SETTINGS,
    Route.useSearch(),
  )
  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const count = games.data?.length ?? 0

  useEffect(() => {
    setStartedAt(Date.now())
  }, [index, rotationMs, count])

  useEffect(() => {
    if (count < 2) return
    const tick = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t - startedAt >= rotationMs) {
        setIndex((i) => (i + 1) % count)
      }
    }, 50)
    return () => window.clearInterval(tick)
  }, [count, rotationMs, startedAt])

  const game = games.data?.[index % Math.max(count, 1)]
  const progress =
    count < 2 ? 0 : Math.min(1, Math.max(0, (now - startedAt) / rotationMs))
  const fade =
    count < 2
      ? 0
      : Math.min(
          1,
          Math.max(0, (now - startedAt - (rotationMs - FADE_MS)) / FADE_MS),
        )

  const record = records.data?.find((entry) => entry.game.id === game?.id)

  return (
    <main className="relative flex min-h-screen flex-col gap-10 overflow-hidden p-24 pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-surface-base bg-[url('/pixel-background.svg')] bg-cover bg-center"
      />

      {/* Rotation progress — top of the screen, light and visible. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-20 h-2 bg-surface-sunken"
      >
        <div
          className="h-full bg-surface-accent transition-[width] duration-75 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Fade to black in the last seconds (no big countdown). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-75"
        style={{ opacity: fade * 0.92 }}
      />

      <header className="flex items-start justify-between gap-8">
        <h1 className="text-scene-hero uppercase">Highscores</h1>
        <Logo alt="" className="m-0 w-72 shrink-0" />
      </header>

      <div className="flex flex-1 items-start gap-12">
        <div className="min-w-0 flex-1">
          {games.isPending && <p className="text-scene-row">Chargement…</p>}
          {games.isError && (
            <p className="text-scene-row">Impossible de charger les jeux.</p>
          )}
          {games.isSuccess && !game && (
            <p className="text-scene-row">Aucun jeu affiché pour l'instant.</p>
          )}
          {game && (
            <GameLeaderboard
              game={game}
              rows={rows}
              minAllTimeRows={minAllTimeRows}
            />
          )}
        </div>
        <aside className="flex w-144 shrink-0 flex-col gap-8">
          {game && <RecordPanel game={game} record={record} />}
          <SubmitScorePanel />
        </aside>
      </div>

      {games.data && games.data.length > 0 ? (
        <nav
          aria-label="Jeux en rotation"
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {games.data.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              aria-current={i === index % count ? 'true' : undefined}
              aria-label={entry.name}
              onClick={() => setIndex(i)}
              className="rounded-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <GameThumb
                name={entry.name}
                shortLabel={entry.short_label}
                coverPath={entry.cover_path}
                active={i === index % count}
              />
            </button>
          ))}
        </nav>
      ) : null}
    </main>
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
            className="size-56 shrink-0 bg-surface-inverse"
          />
        ) : (
          <div className="size-56 shrink-0 bg-surface-base" />
        )}
        <div className="min-w-0 text-left">
          <p className="text-body font-extrabold text-ink-inverse">
            Un record à afficher ?
          </p>
          <p className="text-body-sm text-ink-secondary">
            Scanne, prends ta photo, c'est parti !
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
    <PixelPanel label="LE RECORD">
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            'flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-none border-4 border-line-subtle bg-surface-base',
          )}
        >
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
              <span className="text-ink-secondary"> · {when}</span>
            ) : null}
          </p>
        ) : (
          <p className="text-body-sm text-ink-secondary">
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

  const tableRows: Array<ScoreTableRow> =
    board.data?.rows.map((row) => ({
      id: row.id,
      rank: row.rank,
      player: row.player_name,
      score: formatScore(row.score, game.score_type),
      dimmed: row.dimmed,
      meta: rowMeta(row.created_at, row.dimmed, row.event_name),
    })) ?? []

  return (
    <ScoreTable
      game={game.name}
      machine={formatStation(game.console, game.station_label) || null}
      rows={tableRows}
      separatorAt={board.data?.separator_at ?? null}
    />
  )
}

function rowMeta(createdAt: string, dimmed: boolean, eventName: string | null) {
  const when = formatScoreWhen(createdAt)
  if (dimmed && eventName) {
    return [when, eventName].filter(Boolean).join(' · ')
  }
  return when || undefined
}
