import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from '#/lib/instagram-handle'
import { dataUrlToBlob, writeScoreDraft } from '#/lib/score-draft'
import type { ScoreDraft } from '#/lib/score-draft'
import { formatScore, submitScore } from '#/lib/highscores'
import type { DisplayedGame } from '#/lib/highscores'
import { parseScoreInput } from '#/lib/parse-score'
import { submissionErrorMessage } from '#/lib/submission-error'
import { cn } from '#/lib/utils'

type ConsentStepProps = {
  draft: ScoreDraft
  games: Array<DisplayedGame>
  onDraftChange: (draft: ScoreDraft) => void
}

const INSTAGRAM_HINT =
  "Le pseudo Instagram, c'est des lettres, chiffres, points ou _ (30 max)."

export function ConsentStep({ draft, games, onDraftChange }: ConsentStepProps) {
  const navigate = useNavigate({ from: '/score' })
  const [error, setError] = useState<string | null>(null)
  const [handleError, setHandleError] = useState<string | null>(null)
  const mutation = useMutation({ mutationFn: submitScore })

  const game = games.find((g) => g.id === draft.gameId)
  const gameLabel = draft.customGame
    ? (draft.customGameName?.trim() ?? 'Autre jeu')
    : (game?.name ?? 'Jeu')
  const scoreType = game?.score_type ?? 'points'
  const scoreValue = parseScoreInput(draft.scoreText, scoreType)
  const scoreLabel =
    scoreValue === null ? draft.scoreText : formatScore(scoreValue, scoreType)
  const handleOk = isValidInstagramHandle(draft.instagramHandle)

  function patch(partial: Partial<ScoreDraft>) {
    const next = { ...draft, ...partial }
    writeScoreDraft(next)
    onDraftChange(next)
  }

  async function handleSubmit() {
    if (!draft.photoDataUrl || scoreValue === null) return
    if (draft.customGame && !draft.customGameName?.trim()) return
    if (!draft.customGame && !draft.gameId) return

    if (!isValidInstagramHandle(draft.instagramHandle)) {
      setHandleError(INSTAGRAM_HINT)
      setError(null)
      return
    }

    setHandleError(null)
    setError(null)
    try {
      await mutation.mutateAsync({
        game_id: draft.customGame ? null : draft.gameId,
        custom_game_name: draft.customGame
          ? draft.customGameName?.trim() || null
          : null,
        player_name: draft.playerName.trim(),
        score: scoreValue,
        photo: dataUrlToBlob(draft.photoDataUrl),
        display_on_screen: draft.displayOnScreen,
        instagram_consent: draft.instagramConsent,
        instagram_handle: normalizeInstagramHandle(draft.instagramHandle),
        detected_game_id: draft.detectedGameId,
        detected_score: draft.detectedScore,
      })
      await navigate({
        search: (prev) => ({ ...prev, step: 'done' }),
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

      <div className="rounded-xl border border-line-subtle bg-surface-raised p-4">
        <div className="mb-5 flex items-center gap-4 rounded-xl bg-surface-sunken p-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surface-overlay">
            {draft.photoDataUrl && (
              <img
                src={draft.photoDataUrl}
                alt=""
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <p className="truncate font-display text-arcade-name text-ink-primary">
              {draft.playerName.trim() || '—'}
            </p>
            <p className="truncate text-body-sm text-ink-secondary">
              {gameLabel}
            </p>
            <p className="font-display text-arcade-name text-ink-accent">
              {scoreLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label
            className={cnConsent(draft.displayOnScreen)}
            htmlFor="display-on-screen"
          >
            <Checkbox
              id="display-on-screen"
              className="mt-0.5 size-5"
              checked={draft.displayOnScreen}
              onCheckedChange={(checked) =>
                patch({ displayOnScreen: checked === true })
              }
            />
            <span className="flex flex-col gap-1">
              <span className="text-body-ui font-semibold">
                Affichage sur l'écran
              </span>
              <span className="text-body-sm font-normal text-ink-secondary">
                J'accepte que ma photo, mon nom et mon score soient affichés sur
                l'écran de l'événement.
              </span>
            </span>
          </label>

          <label
            className={cnConsent(draft.instagramConsent)}
            htmlFor="instagram-consent"
          >
            <Checkbox
              id="instagram-consent"
              className="mt-0.5 size-5"
              checked={draft.instagramConsent}
              onCheckedChange={(checked) =>
                patch({ instagramConsent: checked === true })
              }
            />
            <span className="flex flex-col gap-1">
              <span className="text-body-ui font-semibold">
                Instagram{' '}
                <span className="font-normal text-ink-secondary">
                  (facultatif)
                </span>
              </span>
              <span className="text-body-sm font-normal text-ink-secondary">
                J'accepte que Mate dans le Rétro… Gaming publie ma photo et mon
                score sur son compte @mate_dans_le_retro.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Label htmlFor="instagram-handle" className="text-body-ui">
            Ton compte Instagram, pour te taguer (facultatif)
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

        <p className="mt-5 text-body-sm text-ink-secondary">
          Tu changes d'avis ? Dis-le à un bénévole, on retire ta photo.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-body-sm text-ink-accent">
            {error}
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="mt-5 h-12 w-full rounded-xl text-h5"
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

function cnConsent(active: boolean) {
  return [
    'flex items-start gap-3 rounded-xl border-2 p-4',
    active ? 'border-line-accent' : 'border-line-subtle',
  ].join(' ')
}
