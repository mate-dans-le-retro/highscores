import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  EyeOff,
  Pencil,
  Plus,
} from 'lucide-react'
import { useState } from 'react'

import { GameDialog } from '#/components/admin/game-dialog'
import { GameThumb, scoreRuleLabel } from '#/components/admin/game-thumb'
import { Button } from '#/components/ui/button'
import { Switch } from '#/components/ui/switch'
import {
  adminGamesQuery,
  approvedScoresQuery,
  currentEventQuery,
  rankGameScores,
  reorderGames,
  setGameVisible,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminGame } from '#/lib/admin'
import { formatScore } from '#/lib/format'

export const Route = createFileRoute('/admin/games/')({
  component: Games,
})

function Games() {
  const games = useQuery(adminGamesQuery)
  const approved = useQuery(approvedScoresQuery)
  const event = useQuery(currentEventQuery)
  const invalidate = useInvalidateAdmin()
  const [editing, setEditing] = useState<AdminGame | null>(null)
  const [adding, setAdding] = useState(false)

  const move = useMutation({
    mutationFn: ({ index, by }: { index: number; by: -1 | 1 }) => {
      const ids = (games.data ?? []).map(({ id }) => id)
      const [moved] = ids.splice(index, 1)
      ids.splice(index + by, 0, moved)
      return reorderGames(ids)
    },
    onSettled: invalidate,
  })
  const visibility = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      setGameVisible(id, visible),
    onSettled: invalidate,
  })

  const list = games.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h3">Jeux</h1>
          <p className="text-body-sm text-ink-secondary">
            Choisis les jeux affichés sur l'écran public, et leur ordre de
            passage.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus />
          Ajouter un jeu
        </Button>
      </header>

      {games.isPending && (
        <p className="text-body-sm text-ink-secondary">Chargement…</p>
      )}

      <div className="overflow-x-auto rounded-xl bg-surface-raised shadow-card">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-line-subtle text-eyebrow text-ink-secondary">
              <th className="w-20 px-4 py-3 font-semibold">
                <span className="sr-only">Ordre</span>
              </th>
              <th className="px-2 py-3 font-semibold">Jeu</th>
              <th className="px-2 py-3 font-semibold">Scores</th>
              <th className="px-2 py-3 font-semibold">Record</th>
              <th className="px-2 py-3 font-semibold">Écran</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((game, index) => {
              const ranking = rankGameScores(
                approved.data ?? [],
                game,
                event.data?.id,
              )
              const best = ranking.at(0)
              return (
                <tr
                  key={game.id}
                  className="border-b border-line-subtle last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Monter ${game.name}`}
                        disabled={index === 0 || move.isPending}
                        onClick={() => move.mutate({ index, by: -1 })}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Descendre ${game.name}`}
                        disabled={index === list.length - 1 || move.isPending}
                        onClick={() => move.mutate({ index, by: 1 })}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <GameThumb game={game} className="size-12" />
                      <div className="min-w-0">
                        <p className="font-semibold">{game.name}</p>
                        <p className="text-caption text-ink-secondary">
                          {[
                            game.console,
                            game.station_label,
                            scoreRuleLabel(game.score_type, game.score_order),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 tabular-nums">{ranking.length}</td>
                  <td className="px-2 py-3">
                    {best ? (
                      <div>
                        <p className="flex items-center gap-1 font-display text-xs">
                          {!best.display_on_screen && (
                            <EyeOff
                              className="size-3 text-ink-secondary"
                              aria-label="Masqué"
                            />
                          )}
                          {best.player_name}
                        </p>
                        <p className="font-display text-xs text-ink-accent">
                          {formatScore(best.score, game.score_type)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-caption text-ink-secondary">
                        Pas encore de score
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <label className="flex items-center gap-2 text-body-sm">
                      <Switch
                        checked={game.visible}
                        onCheckedChange={(visible) =>
                          visibility.mutate({ id: game.id, visible })
                        }
                      />
                      {game.visible ? 'Affiché' : 'Masqué'}
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Modifier ${game.name}`}
                        onClick={() => setEditing(game)}
                      >
                        <Pencil />
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          to="/admin/games/$gameId"
                          params={{ gameId: game.id }}
                        >
                          Records
                          <ChevronRight />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <GameDialog open={adding} onOpenChange={setAdding} />
      <GameDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        game={editing ?? undefined}
      />
    </div>
  )
}
