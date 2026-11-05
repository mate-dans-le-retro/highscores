import { useMutation } from '@tanstack/react-query'
import {
  Check,
  ExternalLink,
  Plus,
  Sparkles,
  Trophy,
  Undo2,
  X,
} from 'lucide-react'
import { useState } from 'react'

import { GameDialog } from '#/components/admin/game-dialog'
import { GameThumb } from '#/components/admin/game-thumb'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import {
  approveScore,
  parseScore,
  placeFor,
  proofUrl,
  rankGameScores,
  rejectScore,
  reopenScore,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminGame, AdminScore } from '#/lib/admin'
import { formatScore, formatScoreWhen } from '#/lib/format'
import { useReadablePhotoUrl } from '#/lib/readable-photo'

const statusLabels = {
  pending: 'À valider',
  approved: 'Validée',
  rejected: 'Rejetée',
} as const

export function SubmissionDetail({
  submission,
  games,
  approved,
  eventId,
}: {
  submission: AdminScore
  games: Array<AdminGame>
  approved: Array<AdminScore>
  eventId: string | undefined
}) {
  const invalidate = useInvalidateAdmin()
  const [gameId, setGameId] = useState(submission.game_id ?? '')
  const game = games.find(({ id }) => id === gameId)
  const [scoreText, setScoreText] = useState(
    formatScore(submission.score, game?.score_type),
  )
  const [playerName, setPlayerName] = useState(submission.player_name ?? '')
  const [displayOnScreen, setDisplayOnScreen] = useState(
    submission.display_on_screen,
  )
  const [creatingGame, setCreatingGame] = useState(false)

  const score = game ? parseScore(scoreText, game.score_type) : null
  const detectedGame = games.find(
    ({ id }) => id === submission.detected_game_id,
  )
  const ranking = game ? rankGameScores(approved, game, eventId) : []
  const record = ranking.find(({ id }) => id !== submission.id)
  const place =
    game && score !== null
      ? placeFor(score, ranking, game.score_order, submission.id)
      : null
  const pending = submission.status === 'pending'
  const photo = proofUrl(submission.photo_path)
  const photoSrc = useReadablePhotoUrl(photo)

  const approve = useMutation({
    mutationFn: () =>
      approveScore(submission.id, {
        game_id: gameId,
        score: score ?? submission.score,
        player_name: playerName,
        display_on_screen: displayOnScreen,
      }),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: () => rejectScore(submission.id),
    onSuccess: invalidate,
  })
  const reopen = useMutation({
    mutationFn: () => reopenScore(submission.id),
    onSuccess: invalidate,
  })
  const busy = approve.isPending || reject.isPending || reopen.isPending
  const canApprove = Boolean(game) && score !== null

  return (
    <article className="flex flex-col gap-6 rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
      <header className="flex flex-wrap items-center gap-3">
        {game && <GameThumb game={game} />}
        <h2 className="text-h5">
          {submission.player_name ?? 'Sans nom'} ·{' '}
          {game?.name ?? submission.custom_game_name}
        </h2>
        <span className="rounded-full bg-surface-accent px-2.5 py-0.5 text-caption font-semibold text-ink-on-accent">
          {statusLabels[submission.status]}
        </span>
        <span className="text-caption text-ink-secondary">
          {formatScoreWhen(submission.created_at)}
        </span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="flex flex-col gap-3">
          {photo ? (
            <a
              href={photo}
              target="_blank"
              rel="noreferrer"
              className="group relative block overflow-hidden rounded-lg bg-surface-sunken"
            >
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={`Photo envoyée par ${submission.player_name ?? 'un joueur sans nom'}`}
                  className="max-h-[560px] w-full object-contain"
                />
              ) : (
                <span className="grid h-48 place-items-center text-body-sm text-ink-secondary">
                  Conversion de la photo…
                </span>
              )}
              <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-1 text-caption font-semibold opacity-0 shadow-card transition-opacity group-hover:opacity-100">
                <ExternalLink className="size-3" aria-hidden="true" />
                Ouvrir en grand
              </span>
            </a>
          ) : (
            <p className="grid h-48 place-items-center rounded-lg bg-surface-sunken text-body-sm text-ink-secondary">
              Pas de photo
            </p>
          )}
          {(detectedGame || submission.detected_score !== null) && (
            <p className="flex items-center gap-2 rounded-md bg-surface-sunken px-3 py-2 text-body-sm">
              <Sparkles className="size-4 shrink-0" aria-hidden="true" />
              <span>
                Lu sur la photo :{' '}
                <strong>
                  {[
                    detectedGame?.name,
                    submission.detected_score !== null &&
                      formatScore(
                        submission.detected_score,
                        detectedGame?.score_type ?? game?.score_type,
                      ),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </strong>
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {!submission.game_id && pending && (
            <div className="flex flex-col gap-3 rounded-lg border border-line-accent p-3">
              <p className="text-body-sm">
                Jeu tapé par le joueur :{' '}
                <strong>« {submission.custom_game_name} »</strong>. Crée-le, ou
                choisis un jeu existant juste en dessous.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreatingGame(true)}
              >
                <Plus />
                Créer ce jeu
              </Button>
              <GameDialog
                open={creatingGame}
                onOpenChange={setCreatingGame}
                initialName={submission.custom_game_name ?? ''}
                onSaved={setGameId}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 [&>[data-slot=native-select-wrapper]]:w-full">
            <Label htmlFor="review-game">Jeu</Label>
            <NativeSelect
              id="review-game"
              className="w-full"
              value={gameId}
              disabled={!pending}
              onChange={(event) => setGameId(event.target.value)}
            >
              <option value="" disabled>
                Choisis un jeu
              </option>
              {games.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                  {option.visible ? '' : ' (masqué)'}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-score">Score</Label>
            <Input
              id="review-score"
              inputMode={game?.score_type === 'time' ? 'text' : 'numeric'}
              value={scoreText}
              disabled={!pending}
              aria-invalid={Boolean(game) && score === null}
              onChange={(event) => setScoreText(event.target.value)}
            />
            {game?.score_type === 'time' && (
              <p className="text-caption text-ink-secondary">
                Format 1'32"48 (minutes, secondes, centièmes).
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-name">Nom affiché</Label>
            <Input
              id="review-name"
              maxLength={40}
              value={playerName}
              placeholder="Vide : nom inventé à l'affichage"
              disabled={!pending}
              onChange={(event) => setPlayerName(event.target.value)}
            />
          </div>

          {game && pending && (
            <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-rank-gold text-ink-primary">
                <Trophy className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-caption text-ink-secondary">Record actuel</p>
                {record ? (
                  <p className="font-display text-sm">
                    <span className="block truncate">
                      {record.player_name ?? 'Sans nom'}
                    </span>
                    <span className="block text-ink-accent">
                      {formatScore(record.score, game.score_type)}
                    </span>
                  </p>
                ) : (
                  <p className="text-body-sm font-semibold">
                    Aucun pour l’instant
                  </p>
                )}
                {place !== null && (
                  <p className="text-caption text-ink-secondary">
                    {place === 1
                      ? 'Ce score prend la 1re place.'
                      : `Ce score arrive ${place}e.`}
                  </p>
                )}
              </div>
            </div>
          )}

          <label className="flex items-start gap-3">
            <Checkbox
              className="mt-0.5"
              checked={displayOnScreen}
              disabled={!pending}
              onCheckedChange={(checked) =>
                setDisplayOnScreen(checked === true)
              }
            />
            <span>
              <span className="text-body-ui font-semibold">
                Afficher sur l'écran public
              </span>
              <span className="block text-caption text-ink-secondary">
                Décoché : le score reste classé, sous un pseudo rigolo et sans
                photo.
                {!submission.display_on_screen &&
                  ' Le joueur a demandé à ne pas apparaître.'}
              </span>
            </span>
          </label>

          <p className="text-caption text-ink-secondary">
            Instagram :{' '}
            {submission.instagram_consent
              ? `d'accord pour une publication${submission.instagram_handle ? `, à taguer @${submission.instagram_handle}` : ''}.`
              : 'pas d’accord, on ne publie pas.'}
          </p>

          {(approve.isError || reject.isError || reopen.isError) && (
            <p role="alert" className="text-body-sm text-destructive">
              Ça n'est pas passé. Réessaie dans un instant.
            </p>
          )}

          <div className="mt-auto flex flex-wrap justify-end gap-2">
            {pending ? (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => reject.mutate()}
                >
                  <X />
                  Rejeter
                </Button>
                <Button
                  disabled={busy || !canApprove}
                  onClick={() => approve.mutate()}
                >
                  <Check />
                  Valider et afficher
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => reopen.mutate()}
              >
                <Undo2 />
                Remettre à valider
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
