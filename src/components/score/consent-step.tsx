import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { PhotoPlaceholder } from '@/components/photo-placeholder'
import { DraftPhotoPreview } from '@/components/score/draft-photo-preview'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DraftPhoto } from '#/lib/draft-photo'
import {
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from '#/lib/instagram-handle'
import { draftPhotos } from '#/lib/draft-photo'
import { resetScoreDraftKeepName, writeScoreDraft } from '#/lib/score-draft'
import type { ScoreDraft } from '#/lib/score-draft'
import {
  CHARACTERS_BY_SLUG,
  displayedPlayerName,
  formatScore,
  submitScore,
} from '#/lib/highscores'
import type { DisplayedGame } from '#/lib/highscores'
import { parseCustomScoreInput, parseScoreInput } from '#/lib/parse-score'
import { submissionErrorMessage } from '#/lib/submission-error'
import { cn } from '#/lib/utils'

type ConsentStepProps = {
  draft: ScoreDraft
  photo: DraftPhoto
  games: Array<DisplayedGame>
  onDraftChange: (draft: ScoreDraft) => void
}

const INSTAGRAM_HINT =
  "Le pseudo Instagram, c'est des lettres, chiffres, points ou _ (30 max)."

export function ConsentStep({
  draft,
  photo,
  games,
  onDraftChange,
}: ConsentStepProps) {
  const navigate = useNavigate({ from: '/score' })
  const [error, setError] = useState<string | null>(null)
  const [handleError, setHandleError] = useState<string | null>(null)
  const mutation = useMutation({ mutationFn: submitScore })

  const game = games.find((g) => g.id === draft.gameId)
  const gameLabel = draft.customGame
    ? (draft.customGameName?.trim() ?? 'Autre jeu')
    : (game?.name ?? 'Jeu')
  const customScore = draft.customGame
    ? parseCustomScoreInput(draft.scoreText)
    : null
  const scoreType = draft.customGame
    ? customScore?.ok
      ? customScore.scoreType
      : 'points'
    : (game?.score_type ?? 'points')
  const scoreValue = draft.customGame
    ? customScore?.ok
      ? customScore.value
      : null
    : parseScoreInput(draft.scoreText, scoreType)
  const scoreLabel =
    scoreValue === null ? draft.scoreText : formatScore(scoreValue, scoreType)
  // A hidden field is never sent: off screen, the score has no name at all.
  const playerName = draft.displayOnScreen
    ? draft.playerName.trim() || null
    : null
  const shownName = displayedPlayerName({
    scoreId: draft.submissionId,
    playerName,
    displayOnScreen: draft.displayOnScreen,
    gameId: game?.id ?? `custom:${gameLabel}`,
    characters: game ? CHARACTERS_BY_SLUG[game.slug] : null,
  })
  const handleOk =
    !draft.instagramConsent || isValidInstagramHandle(draft.instagramHandle)

  function patch(partial: Partial<ScoreDraft>) {
    const next = { ...draft, ...partial }
    writeScoreDraft(next)
    onDraftChange(next)
  }

  async function handleSubmit() {
    if (scoreValue === null) return
    if (draft.customGame && !draft.customGameName?.trim()) return
    if (!draft.customGame && !draft.gameId) return

    if (!handleOk) {
      setHandleError(INSTAGRAM_HINT)
      setError(null)
      return
    }

    setHandleError(null)
    setError(null)
    try {
      await mutation.mutateAsync({
        id: draft.submissionId,
        game_id: draft.customGame ? null : draft.gameId,
        custom_game_name: draft.customGame
          ? draft.customGameName?.trim() || null
          : null,
        player_name: playerName,
        score: scoreValue,
        photo: photo.photo,
        display_on_screen: draft.displayOnScreen,
        instagram_consent: draft.instagramConsent,
        instagram_handle: draft.instagramConsent
          ? normalizeInstagramHandle(draft.instagramHandle)
          : null,
        detected_game_id: draft.detectedGameId,
        detected_score: draft.detectedScore,
      })
      // Clear the form so back / reopen cannot resubmit the same pending.
      const next = resetScoreDraftKeepName(draft)
      next.sent = true
      writeScoreDraft(next)
      onDraftChange(next)
      await draftPhotos.clear()
      await navigate({
        search: (prev) => ({ ...prev, step: 'done' }),
        replace: true,
      })
    } catch (caught) {
      setError(submissionErrorMessage(caught))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h3 font-extrabold text-ink-primary">
          Tes autorisations
        </h1>
        <p className="text-body text-ink-secondary">
          Deux cases, et un mot sur ce qu'on fait de ta photo.
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-line-subtle bg-surface-raised p-4">
        <ConsentBox
          id="display-on-screen"
          checked={draft.displayOnScreen}
          onCheckedChange={(checked) => patch({ displayOnScreen: checked })}
          title="Affichage sur l'écran"
        >
          J'accepte que ma photo, mon nom et mon score soient affichés sur
          l'écran de l'événement.
        </ConsentBox>

        {draft.displayOnScreen ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="player" className="block text-body-ui leading-snug">
              Ton nom ou pseudo{' '}
              <span className="font-normal text-ink-secondary">
                (facultatif)
              </span>
            </Label>
            <Input
              id="player"
              className="h-12 rounded-xl text-arcade-name"
              value={draft.playerName}
              onChange={(event) => patch({ playerName: event.target.value })}
              maxLength={40}
              autoComplete="nickname"
              aria-describedby="player-hint"
            />
            <p id="player-hint" className="text-body-sm text-ink-secondary">
              Laisse vide et on t'invente un nom.
            </p>
          </div>
        ) : (
          <p className="text-body-sm text-ink-secondary">
            On t'invente un nom au hasard et on n'affiche pas ta photo.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-body-sm font-semibold text-ink-secondary">
            Sur l'écran, ça donnera :
          </p>
          <div
            className="flex items-center gap-4 rounded-xl bg-surface-sunken p-3"
            aria-live="polite"
          >
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-overlay">
              {draft.displayOnScreen ? (
                <DraftPhotoPreview url={photo.url} alt="Ta photo" />
              ) : (
                <PhotoPlaceholder anonymous size="sm" />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-display text-arcade-name break-words text-ink-primary">
                {shownName}
              </p>
              <p className="truncate text-body-sm text-ink-secondary">
                {gameLabel}
              </p>
              <p className="font-display text-arcade-name text-ink-accent">
                {scoreLabel}
              </p>
            </div>
          </div>
        </div>

        <ConsentBox
          id="instagram-consent"
          checked={draft.instagramConsent}
          onCheckedChange={(checked) => {
            setHandleError(null)
            patch({ instagramConsent: checked })
          }}
          title={
            <>
              Instagram{' '}
              <span className="font-normal text-ink-secondary">
                (facultatif)
              </span>
            </>
          }
        >
          J'accepte que Mate dans le Rétro… Gaming publie ma photo et mon score
          sur son compte @mate_dans_le_retro.
        </ConsentBox>

        {draft.instagramConsent && (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="instagram-handle"
              className="block text-body-ui leading-snug"
            >
              Ton compte Instagram, pour te taguer{' '}
              <span className="font-normal text-ink-secondary">
                (facultatif)
              </span>
            </Label>
            <Input
              id="instagram-handle"
              className={cn(
                'h-12 rounded-xl text-arcade-name',
                handleError && 'border-ink-accent',
              )}
              value={draft.instagramHandle}
              onChange={(event) => {
                setHandleError(null)
                patch({ instagramHandle: event.target.value })
              }}
              placeholder="@toncompte"
              autoComplete="username"
              autoCapitalize="none"
              maxLength={31}
              aria-invalid={Boolean(handleError) || !handleOk}
              aria-describedby={
                handleError ? 'instagram-handle-error' : undefined
              }
            />
            {handleError && (
              <p
                id="instagram-handle-error"
                role="alert"
                className="text-body-sm text-ink-accent"
              >
                {handleError}
              </p>
            )}
          </div>
        )}

        <p className="text-body-sm text-ink-secondary">
          Tu changes d'avis ? Dis-le à un bénévole, on retire ta photo.
        </p>

        {error && (
          <p role="alert" className="text-body-sm text-ink-accent">
            {error}
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl text-h5"
          disabled={mutation.isPending || scoreValue === null}
          onClick={() => void handleSubmit()}
        >
          <Send className="size-5" aria-hidden="true" />
          {mutation.isPending ? 'Envoi…' : 'Envoyer mon score'}
        </Button>
      </div>
    </div>
  )
}

function ConsentBox({
  id,
  checked,
  onCheckedChange,
  title,
  children,
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: ReactNode
  children: ReactNode
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 p-4',
        checked ? 'border-line-accent' : 'border-line-subtle',
      )}
    >
      <Checkbox
        id={id}
        className="mt-0.5 size-5"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="flex flex-col gap-1">
        <span className="text-body-ui font-semibold">{title}</span>
        <span className="text-body-sm font-normal text-ink-secondary">
          {children}
        </span>
      </span>
    </label>
  )
}
