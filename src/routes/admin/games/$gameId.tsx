import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  Camera,
  Check,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { GameThumb } from '#/components/admin/game-thumb'
import { useAdminRefetchInterval } from '#/components/admin/realtime-provider'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  addManualScore,
  adminGamesQuery,
  approvedScoresQuery,
  archiveCurrentEvent,
  archivedEventsQuery,
  currentEventQuery,
  deleteScore,
  parseScore,
  proofUrl,
  rankGameScores,
  updateScore,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminGame, RankedScore } from '#/lib/admin'
import { formatScore, formatScoreWhen } from '#/lib/format'
import { useReadablePhotoUrl } from '#/lib/readable-photo'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/games/$gameId')({
  component: GameRecords,
})

function GameRecords() {
  const { gameId } = Route.useParams()
  const refetchInterval = useAdminRefetchInterval()
  const games = useQuery({ ...adminGamesQuery, refetchInterval })
  const approved = useQuery({ ...approvedScoresQuery, refetchInterval })
  const event = useQuery({ ...currentEventQuery, refetchInterval })
  const archived = useQuery({ ...archivedEventsQuery, refetchInterval })
  const game = games.data?.find(({ id }) => id === gameId)

  if (games.isPending) {
    return <p className="text-body-sm text-ink-secondary">Chargement…</p>
  }
  if (!game) {
    return (
      <p className="text-body-sm">
        Jeu introuvable.{' '}
        <Link to="/admin/games" className="underline">
          Retour aux jeux
        </Link>
      </p>
    )
  }

  const ranking = rankGameScores(approved.data ?? [], game, event.data?.id)
  const allTime = rankGameScores(approved.data ?? [], game).at(0)
  const allTimeEvent =
    allTime && allTime.event_id !== event.data?.id
      ? archived.data?.find(({ id }) => id === allTime.event_id)?.name
      : event.data?.name

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/admin/games" aria-label="Retour aux jeux">
              <ArrowLeft />
            </Link>
          </Button>
          <GameThumb game={game} />
          <h1 className="text-h3">Records de {game.name}</h1>
        </div>
        <p className="flex flex-wrap items-center gap-1.5 pl-11 text-body-sm text-ink-secondary">
          <Star className="size-4" aria-hidden="true" />
          Record all-time :{' '}
          {allTime ? (
            <>
              <strong className="text-ink-primary">
                {allTime.player_name ?? 'Sans nom'} ·{' '}
                {formatScore(allTime.score, game.score_type)}
              </strong>
              {allTimeEvent && <span>· {allTimeEvent}</span>}
            </>
          ) : (
            'aucun pour l’instant'
          )}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-x-auto rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
          <h2 className="mb-4 text-h5">
            Classement de l'évènement
            {event.data && (
              <span className="font-normal text-ink-secondary">
                {' '}
                · {event.data.name}
              </span>
            )}
          </h2>
          {ranking.length === 0 ? (
            <p className="text-body-sm text-ink-secondary">
              Personne n'a encore de score sur ce jeu. Le premier à jouer
              décroche le record !
            </p>
          ) : (
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-line-subtle text-eyebrow text-ink-secondary">
                  <th className="py-2 pr-2 font-semibold">Rang</th>
                  <th className="px-2 py-2 font-semibold">Joueur</th>
                  <th className="px-2 py-2 font-semibold">Score</th>
                  <th className="px-2 py-2 font-semibold">Origine</th>
                  <th className="py-2 pl-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((score) => (
                  <RankingRow key={score.id} score={score} game={game} />
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <ManualScoreForm game={game} />
          <ArchivePanel currentName={event.data?.name} />
        </aside>
      </div>
    </div>
  )
}

const rankColors: Record<number, string> = {
  1: 'bg-rank-gold text-ink-primary',
  2: 'bg-rank-silver text-ink-primary',
  3: 'bg-rank-bronze text-ink-primary',
}

function RankingRow({ score, game }: { score: RankedScore; game: AdminGame }) {
  const invalidate = useInvalidateAdmin()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(score.player_name ?? '')
  const [scoreText, setScoreText] = useState(
    formatScore(score.score, game.score_type),
  )
  const [shown, setShown] = useState(score.display_on_screen)
  const parsed = parseScore(scoreText, game.score_type)
  const photo = useReadablePhotoUrl(
    proofUrl(score.thumb_path ?? score.photo_path),
  )

  const save = useMutation({
    mutationFn: () =>
      updateScore(score.id, {
        player_name: name.trim() || null,
        score: parsed ?? score.score,
        display_on_screen: shown,
      }),
    onSuccess: async () => {
      await invalidate()
      setEditing(false)
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteScore(score.id),
    onSuccess: invalidate,
  })

  return (
    <tr className="border-b border-line-subtle align-middle last:border-0">
      <td className="py-2 pr-2">
        <span
          className={cn(
            'grid size-8 place-items-center rounded-sm bg-surface-sunken text-sm font-extrabold',
            rankColors[score.rank],
          )}
        >
          {score.rank}
        </span>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-sunken text-ink-secondary">
            {photo ? (
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <Camera className="size-4" aria-hidden="true" />
            )}
          </span>
          {editing ? (
            <div className="flex flex-col gap-1">
              <Input
                aria-label="Nom affiché"
                className="h-8"
                maxLength={40}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <label className="flex items-center gap-2 text-caption">
                <Checkbox
                  checked={shown}
                  onCheckedChange={(checked) => setShown(checked === true)}
                />
                Afficher sur l'écran
              </label>
            </div>
          ) : (
            <span
              className={cn(
                'flex flex-wrap items-center gap-2 font-display text-xs',
                !score.display_on_screen && 'text-ink-secondary',
              )}
            >
              {score.player_name ?? 'Sans nom'}
              {!score.display_on_screen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 font-sans text-caption font-semibold">
                  <EyeOff className="size-3" aria-hidden="true" />
                  Masqué
                </span>
              )}
            </span>
          )}
        </div>
      </td>
      <td className="px-2 py-2">
        {editing ? (
          <Input
            aria-label="Score"
            className="h-8 w-32"
            aria-invalid={parsed === null}
            value={scoreText}
            onChange={(event) => setScoreText(event.target.value)}
          />
        ) : (
          <span className="font-display text-sm text-ink-accent">
            {formatScore(score.score, game.score_type)}
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-caption text-ink-secondary">
        {score.source === 'player' ? 'Soumission validée' : 'Saisi à la main'}
        <span className="block">{formatScoreWhen(score.created_at)}</span>
      </td>
      <td className="py-2 pl-2">
        <div className="flex justify-end gap-1">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Annuler"
                onClick={() => setEditing(false)}
              >
                <X />
              </Button>
              <Button
                size="icon-sm"
                aria-label="Enregistrer"
                disabled={parsed === null || save.isPending}
                onClick={() => save.mutate()}
              >
                <Check />
              </Button>
            </>
          ) : confirmDelete ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Garder
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                Supprimer
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Modifier le score de ${score.player_name ?? 'Sans nom'}`}
                onClick={() => setEditing(true)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Supprimer le score de ${score.player_name ?? 'Sans nom'}`}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function ManualScoreForm({ game }: { game: AdminGame }) {
  const invalidate = useInvalidateAdmin()
  const [name, setName] = useState('')
  const [scoreText, setScoreText] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [shown, setShown] = useState(true)
  const parsed = parseScore(scoreText, game.score_type)

  const add = useMutation({
    mutationFn: () =>
      addManualScore({
        game_id: game.id,
        player_name: name,
        score: parsed ?? 0,
        display_on_screen: shown,
        photo,
      }),
    onSuccess: async () => {
      await invalidate()
      setName('')
      setScoreText('')
      setPhoto(null)
      setShown(true)
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (parsed !== null && name.trim()) add.mutate()
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-xl bg-surface-raised p-4 shadow-card md:p-6"
    >
      <h2 className="text-h5">Ajouter un score à la main</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-name">Nom affiché</Label>
        <Input
          id="manual-name"
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-score">Score</Label>
        <Input
          id="manual-score"
          required
          inputMode={game.score_type === 'time' ? 'text' : 'numeric'}
          placeholder={game.score_type === 'time' ? `1'32"48` : '128 400'}
          aria-invalid={scoreText !== '' && parsed === null}
          value={scoreText}
          onChange={(event) => setScoreText(event.target.value)}
        />
      </div>
      <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line-strong px-3 text-sm font-semibold hover:bg-surface-sunken">
        <Upload className="size-4" aria-hidden="true" />
        <span className="truncate">
          {photo ? photo.name : 'Ajouter une photo (facultatif)'}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
        />
      </label>
      <label className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5"
          checked={shown}
          onCheckedChange={(checked) => setShown(checked === true)}
        />
        <span>
          <span className="text-body-ui font-semibold">
            Afficher sur l'écran public
          </span>
          <span className="block text-caption text-ink-secondary">
            Décoché : le score reste classé, sous un pseudo et sans photo.
          </span>
        </span>
      </label>
      {add.isError && (
        <p role="alert" className="text-body-sm text-destructive">
          Le score n'est pas passé. Réessaie dans un instant.
        </p>
      )}
      <Button
        type="submit"
        disabled={add.isPending || parsed === null || !name.trim()}
      >
        <Plus />
        {add.isPending ? 'Ajout…' : 'Ajouter le score'}
      </Button>
    </form>
  )
}

function ArchivePanel({ currentName }: { currentName: string | undefined }) {
  const invalidate = useInvalidateAdmin()
  const [confirming, setConfirming] = useState(false)
  const [nextName, setNextName] = useState('')
  const archive = useMutation({
    mutationFn: () => archiveCurrentEvent(nextName),
    onSuccess: async () => {
      await invalidate()
      setConfirming(false)
      setNextName('')
    },
  })

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
      <h2 className="text-h5">Archiver l'évènement</h2>
      <p className="text-body-sm text-ink-secondary">
        Pour un nouvel évènement, archive {currentName ?? 'celui-ci'} : les
        scores sont gardés et comptent toujours pour les records all-time, mais
        chaque classement repart de zéro. Ça vaut pour tous les jeux.
      </p>
      {confirming ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (nextName.trim()) archive.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="next-event">Nom du nouvel évènement</Label>
            <Input
              id="next-event"
              required
              maxLength={80}
              placeholder="Avril 2027"
              value={nextName}
              onChange={(event) => setNextName(event.target.value)}
            />
          </div>
          {archive.isError && (
            <p role="alert" className="text-body-sm text-destructive">
              L'archivage n'est pas passé. Réessaie dans un instant.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={archive.isPending || !nextName.trim()}
            >
              Archiver et repartir à zéro
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="h-auto py-2 whitespace-normal"
          onClick={() => setConfirming(true)}
        >
          <Archive />
          Archiver et commencer un nouvel évènement
        </Button>
      )}
    </section>
  )
}
