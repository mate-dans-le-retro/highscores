import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import { GameDialog } from '#/components/admin/game-dialog'
import { GameThumb, scoreRuleLabel } from '#/components/admin/game-thumb'
import { useAdminRefetchInterval } from '#/components/admin/realtime-provider'
import { Button } from '#/components/ui/button'
import { Switch } from '#/components/ui/switch'
import {
  GameHasScoresError,
  adminGamesQuery,
  approvedScoresQuery,
  currentEventQuery,
  deleteGame,
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

function stopRowClick(event: { stopPropagation: () => void }) {
  event.stopPropagation()
}

function Games() {
  const refetchInterval = useAdminRefetchInterval()
  const games = useQuery({ ...adminGamesQuery, refetchInterval })
  const approved = useQuery({ ...approvedScoresQuery, refetchInterval })
  const event = useQuery({ ...currentEventQuery, refetchInterval })
  const invalidate = useInvalidateAdmin()
  const [editing, setEditing] = useState<AdminGame | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
  const remove = useMutation({
    mutationFn: (game: AdminGame) => deleteGame(game),
    onSuccess: async () => {
      setConfirmDeleteId(null)
      setDeleteError(null)
      await invalidate()
    },
    onError: (error) => {
      if (error instanceof GameHasScoresError) {
        setDeleteError(
          error.count === 1
            ? 'Ce jeu a encore 1 score (validé, en attente ou refusé). Masque-le de l’écran, ou va dans Records pour supprimer les scores d’abord.'
            : `Ce jeu a encore ${error.count} scores (validés, en attente ou refusés). Masque-le de l’écran, ou va dans Records pour supprimer les scores d’abord.`,
        )
        return
      }
      setDeleteError(
        'La suppression n’est pas passée. Réessaie dans un instant.',
      )
    },
  })

  const list = games.data ?? []

  const openEdit = (game: AdminGame) => setEditing(game)

  const onRowKeyDown = (
    keyEvent: KeyboardEvent<HTMLTableRowElement>,
    game: AdminGame,
  ) => {
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      keyEvent.preventDefault()
      openEdit(game)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h3 text-ink-primary">Jeux</h1>
          <p className="mt-1 text-body-ui text-ink-secondary">
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
        <p className="text-body-ui text-ink-secondary">Chargement…</p>
      )}

      {deleteError && (
        <p role="alert" className="text-body-sm text-destructive">
          {deleteError}
        </p>
      )}

      {!games.isPending && (
        <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-raised shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-surface-sunken text-eyebrow uppercase tracking-wide text-ink-secondary">
                <tr>
                  <th className="w-20 px-5 py-3 font-semibold">
                    <span className="sr-only">Ordre</span>
                  </th>
                  <th className="px-5 py-3 font-semibold">Jeu</th>
                  <th className="px-5 py-3 font-semibold">Scores</th>
                  <th className="px-5 py-3 font-semibold">Record</th>
                  <th className="px-5 py-3 font-semibold">Écran</th>
                  <th className="px-5 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {list.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-10 text-center text-body-ui text-ink-secondary"
                      colSpan={6}
                    >
                      Aucun jeu pour le moment
                    </td>
                  </tr>
                ) : (
                  list.map((game, index) => {
                    const ranking = rankGameScores(
                      approved.data ?? [],
                      game,
                      event.data?.id,
                    )
                    const best = ranking.at(0)
                    const confirming = confirmDeleteId === game.id
                    const meta = [
                      game.station_label,
                      scoreRuleLabel(game.score_type, game.score_order),
                    ]
                      .filter(Boolean)
                      .join(' · ')

                    return (
                      <tr
                        key={game.id}
                        className="cursor-pointer hover:bg-surface-sunken/60"
                        tabIndex={0}
                        onClick={() => openEdit(game)}
                        onKeyDown={(keyEvent) => onRowKeyDown(keyEvent, game)}
                      >
                        <td className="px-5 py-4" onClick={stopRowClick}>
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
                              disabled={
                                index === list.length - 1 || move.isPending
                              }
                              onClick={() => move.mutate({ index, by: 1 })}
                            >
                              <ArrowDown />
                            </Button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <GameThumb
                              game={game}
                              className="size-12 rounded-md"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-ink-primary">
                                {game.name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {game.console ? (
                                  <span className="inline-flex rounded-full border border-line-strong px-2 py-0.5 text-caption text-ink-secondary">
                                    {game.console}
                                  </span>
                                ) : null}
                                {meta ? (
                                  <span className="text-caption text-ink-secondary">
                                    {meta}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 tabular-nums text-body-ui text-ink-primary">
                          {ranking.length}
                        </td>
                        <td className="px-5 py-4">
                          {best ? (
                            <div>
                              <p className="flex items-center gap-1 font-display text-xs">
                                {!best.display_on_screen && (
                                  <EyeOff
                                    className="size-3 text-ink-secondary"
                                    aria-label="Masqué"
                                  />
                                )}
                                {best.player_name ?? 'Sans nom'}
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
                        <td className="px-5 py-4" onClick={stopRowClick}>
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
                        <td className="px-5 py-4" onClick={stopRowClick}>
                          <div className="flex items-center justify-end gap-1">
                            {confirming ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setConfirmDeleteId(null)
                                    setDeleteError(null)
                                  }}
                                >
                                  Garder
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={remove.isPending}
                                  onClick={() => {
                                    setDeleteError(null)
                                    remove.mutate(game)
                                  }}
                                >
                                  Supprimer
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Modifier ${game.name}`}
                                  onClick={() => openEdit(game)}
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Supprimer ${game.name}`}
                                  onClick={() => {
                                    if (ranking.length > 0) {
                                      setConfirmDeleteId(null)
                                      setDeleteError(
                                        ranking.length === 1
                                          ? 'Ce jeu a encore 1 score validé. Masque-le de l’écran, ou va dans Records pour supprimer les scores d’abord.'
                                          : `Ce jeu a encore ${ranking.length} scores validés. Masque-le de l’écran, ou va dans Records pour supprimer les scores d’abord.`,
                                      )
                                      return
                                    }
                                    setDeleteError(null)
                                    setConfirmDeleteId(game.id)
                                  }}
                                >
                                  <Trash2 />
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GameDialog open={adding} onOpenChange={setAdding} />
      <GameDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        game={editing ?? undefined}
      />
    </div>
  )
}
