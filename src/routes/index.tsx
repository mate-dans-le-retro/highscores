import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { QrCode } from '#/components/qr-code'
import {
  formatScore,
  formatStation,
  leaderboardQuery,
  useHighscoresRealtime,
  visibleGamesQuery,
} from '#/lib/highscores'
import type { DisplayedGame } from '#/lib/highscores'

/** How long each game stays on screen before the next one (screens guideline: 15 s). */
const ROTATION_MS = 15_000

export const Route = createFileRoute('/')({
  staticData: { theme: 'scene' },
  component: PublicScreen,
})

function PublicScreen() {
  useHighscoresRealtime()
  const games = useQuery(visibleGamesQuery)
  const [index, setIndex] = useState(0)
  const count = games.data?.length ?? 0

  useEffect(() => {
    if (count < 2) return
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % count),
      ROTATION_MS,
    )
    return () => clearInterval(timer)
  }, [count])

  const game = games.data?.[index % Math.max(count, 1)]

  return (
    <main className="flex min-h-screen flex-col gap-12 p-24">
      <header className="flex items-baseline justify-between gap-8">
        <h1 className="text-scene-hero">Highscores</h1>
        {game && (
          <p className="text-scene-meta text-ink-secondary">
            {index + 1} / {count}
          </p>
        )}
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
          {game && <GameLeaderboard game={game} />}
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
    <aside className="flex w-144 shrink-0 flex-col items-center gap-6 border-4 border-line-accent bg-surface-raised p-8 text-center shadow-pixel">
      <h2 className="font-display text-scene-pixel text-ink-accent">
        À TOI DE JOUER
      </h2>
      {submitUrl ? (
        <QrCode
          value={submitUrl}
          label="QR code pour envoyer ton score"
          className="size-80"
        />
      ) : (
        <div className="size-80 bg-surface-inverse" />
      )}
      <p className="text-scene-row">Un record à afficher ?</p>
      <p className="text-scene-row text-ink-secondary">
        Scanne, prends ta photo, c'est parti !
      </p>
    </aside>
  )
}

function GameLeaderboard({ game }: { game: DisplayedGame }) {
  const rows = useQuery(leaderboardQuery(game.id))

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-scene-pixel text-ink-accent">
          {game.name}
        </h2>
        {(game.console || game.station_label) && (
          <p className="text-scene-meta text-ink-secondary">
            {formatStation(game.console, game.station_label)}
          </p>
        )}
      </div>
      {rows.isSuccess && rows.data.length === 0 && (
        <p className="text-scene-row">
          Aucun score pour l'instant. À toi de jouer !
        </p>
      )}
      <ol className="flex flex-col">
        {rows.data?.map((row) => (
          <li
            key={row.id}
            className="grid grid-cols-[4ch_1fr_auto] items-center gap-8 text-scene-row"
          >
            <span className="font-display text-scene-pixel">{row.rank}</span>
            <span className="truncate">{row.player_name}</span>
            <span className="font-display text-scene-pixel">
              {formatScore(row.score, game.score_type)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
