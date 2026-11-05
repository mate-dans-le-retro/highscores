import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Logo } from '#/components/logo'
import { PixelPanel } from '#/components/pixel-panel'
import { QrCode } from '#/components/qr-code'
import { ScoreTable } from '#/components/score-table'
import type { ScoreTableRow } from '#/components/score-table'
import {
  DEFAULT_SETTINGS,
  formatScore,
  formatStation,
  leaderboardQuery,
  settingsQuery,
  useHighscoresRealtime,
  visibleGamesQuery,
} from '#/lib/highscores'
import type { DisplayedGame } from '#/lib/highscores'
import { screenOptions, screenSearchSchema } from '#/lib/screen-options'

export const Route = createFileRoute('/')({
  staticData: { theme: 'scene' },
  validateSearch: screenSearchSchema,
  component: PublicScreen,
})

function PublicScreen() {
  useHighscoresRealtime()
  const games = useQuery(visibleGamesQuery)
  const settings = useQuery(settingsQuery)
  const { rotationMs, rows, minAllTimeRows } = screenOptions(
    settings.data ?? DEFAULT_SETTINGS,
    Route.useSearch(),
  )
  const [index, setIndex] = useState(0)
  const count = games.data?.length ?? 0

  useEffect(() => {
    if (count < 2) return
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % count),
      rotationMs,
    )
    return () => clearInterval(timer)
  }, [count, rotationMs])

  const game = games.data?.[index % Math.max(count, 1)]

  return (
    <main className="relative flex min-h-screen flex-col gap-12 overflow-hidden p-24">
      {/* Irregular brand pattern on the edges only — never under the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-surface-base bg-[url('/pixel-background.svg')] bg-cover bg-center"
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
              positionLabel={`${index + 1} / ${count}`}
            />
          )}
        </div>
        <SubmitScorePanel />
      </div>
    </main>
  )
}

function SubmitScorePanel() {
  // The origin is only known in the browser: the placeholder keeps the same size during SSR.
  const [submitUrl, setSubmitUrl] = useState<string | null>(null)

  useEffect(() => {
    setSubmitUrl(`${window.location.origin}/score`)
  }, [])

  return (
    <PixelPanel label="À TOI DE JOUER" className="w-144 shrink-0">
      <div className="flex flex-col items-center gap-6 text-center">
        {submitUrl ? (
          <QrCode
            value={submitUrl}
            label="QR code pour envoyer ton score"
            className="size-80 bg-surface-inverse"
          />
        ) : (
          <div className="size-80 bg-surface-base" />
        )}
        <p className="text-scene-row text-ink-inverse">
          Un record à afficher ?
        </p>
        <p className="text-scene-row text-ink-secondary">
          Scanne, prends ta photo, c'est parti !
        </p>
      </div>
    </PixelPanel>
  )
}

function GameLeaderboard({
  game,
  rows: rowsShown,
  minAllTimeRows,
  positionLabel,
}: {
  game: DisplayedGame
  rows: number
  minAllTimeRows: number
  positionLabel: string
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
      meta: row.dimmed && row.event_name ? row.event_name : undefined,
    })) ?? []

  return (
    <div className="flex flex-col gap-4">
      <p className="self-end text-scene-meta text-ink-secondary">
        {positionLabel}
      </p>
      <ScoreTable
        game={game.name}
        machine={formatStation(game.console, game.station_label) || null}
        rows={tableRows}
        separatorAt={board.data?.separator_at ?? null}
      />
    </div>
  )
}
