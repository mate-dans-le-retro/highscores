import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  formatScore,
  leaderboardQuery,
  useHighscoresRealtime,
  visibleGamesQuery,
} from '#/lib/highscores'
import type { Game } from '#/lib/highscores'

/** How long each game stays on screen before the next one (screens guideline: 15 s). */
const ROTATION_MS = 15_000

export const Route = createFileRoute('/screen')({
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
      {games.isPending && <p className="text-scene-row">Chargement…</p>}
      {games.isError && (
        <p className="text-scene-row">Impossible de charger les jeux.</p>
      )}
      {games.isSuccess && !game && (
        <p className="text-scene-row">Aucun jeu affiché pour l'instant.</p>
      )}
      {game && <GameLeaderboard game={game} />}
    </main>
  )
}

function GameLeaderboard({ game }: { game: Game }) {
  const rows = useQuery(leaderboardQuery(game.id))

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-scene-pixel text-ink-accent">
          {game.name}
        </h2>
        {game.machine && (
          <p className="text-scene-meta text-ink-secondary">{game.machine}</p>
        )}
      </div>
      {rows.isSuccess && rows.data.length === 0 && (
        <p className="text-scene-row">
          Aucun score pour l'instant. À vous de jouer !
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
              {formatScore(row.score)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
