import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DetectedTag } from '@/components/score/detected-tag'
import { DraftPhotoPreview } from '@/components/score/draft-photo-preview'
import { GameTile } from '@/components/score/game-tile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { detectFromPhoto } from '#/lib/detect-from-photo'
import type { DraftPhoto } from '#/lib/draft-photo'
import { formatScore } from '#/lib/highscores'
import type { DisplayedGame } from '#/lib/highscores'
import { parseScoreInput, parseTimeInput } from '#/lib/parse-score'
import type { TimeInputError } from '#/lib/parse-score'
import { writeScoreDraft } from '#/lib/score-draft'
import type { ScoreDraft } from '#/lib/score-draft'
import { cn } from '#/lib/utils'

type DetailsStepProps = {
  draft: ScoreDraft
  photo: DraftPhoto
  games: Array<DisplayedGame>
  onDraftChange: (draft: ScoreDraft) => void
}

const TIME_EXAMPLE = `13248 pour 1'32"48`

const TIME_ERRORS: Record<TimeInputError, string> = {
  format: `On n'a pas compris ce temps. Tape juste les chiffres : ${TIME_EXAMPLE}.`,
  seconds: "Les secondes s'arrêtent à 59 : vérifie ton temps.",
  minutes: "Les minutes s'arrêtent à 59 quand il y a des heures.",
  zero: 'Un chrono à zéro ? Même Sonic ne va pas si vite.',
}

function formatPointsInput(digits: string) {
  if (!digits) return ''
  const n = Number(digits)
  if (!Number.isFinite(n)) return digits
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function DetailsStep({
  draft,
  photo,
  games,
  onDraftChange,
}: DetailsStepProps) {
  const navigate = useNavigate({ from: '/score' })
  const [detecting, setDetecting] = useState(false)
  const detectionKey = useRef<string | null>(null)
  const [scoreTouched, setScoreTouched] = useState(false)
  const draftRef = useRef(draft)
  const gamesRef = useRef(games)
  const onDraftChangeRef = useRef(onDraftChange)
  draftRef.current = draft
  gamesRef.current = games
  onDraftChangeRef.current = onDraftChange

  useEffect(() => {
    if (detectionKey.current === photo.id) return
    detectionKey.current = photo.id

    let cancelled = false
    let finished = false
    setDetecting(true)
    void detectFromPhoto(photo.photo.proof)
      .then((result) => {
        finished = true
        if (cancelled) return
        const current = draftRef.current
        const gameId = current.gameId ?? result.gameId
        const type = gamesRef.current.find(
          ({ id }) => id === gameId,
        )?.score_type
        const next: ScoreDraft = {
          ...current,
          detectedGameId: result.gameId,
          detectedScore: result.score,
          gameId,
          scoreText:
            current.scoreText ||
            (result.score !== null ? formatScore(result.score, type) : ''),
        }
        writeScoreDraft(next)
        onDraftChangeRef.current(next)
      })
      .finally(() => {
        if (!cancelled) setDetecting(false)
      })

    return () => {
      cancelled = true
      // Unmounted mid-reading (StrictMode does it on purpose): read again.
      if (!finished) detectionKey.current = null
    }
  }, [photo])

  const selectedGame = games.find((game) => game.id === draft.gameId) ?? null
  const scoreType = selectedGame?.score_type ?? 'points'
  const gameDetected =
    draft.detectedGameId !== null && draft.gameId === draft.detectedGameId
  const scoreValue = parseScoreInput(draft.scoreText, scoreType)
  const scoreDetected =
    draft.detectedScore !== null && scoreValue === draft.detectedScore

  const time =
    scoreType === 'time' && draft.scoreText.trim()
      ? parseTimeInput(draft.scoreText)
      : null
  const timeError =
    time && !time.ok && scoreTouched ? TIME_ERRORS[time.error] : null
  const gameOk = draft.customGame
    ? (draft.customGameName?.trim().length ?? 0) > 0
    : Boolean(draft.gameId)
  const canContinue = gameOk && scoreValue !== null

  function patch(partial: Partial<ScoreDraft>) {
    const next = { ...draft, ...partial }
    writeScoreDraft(next)
    onDraftChange(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h3 font-extrabold text-ink-primary">
          Vérifie tes infos
        </h1>
        <p className="text-body text-ink-secondary">
          {detecting
            ? 'On jette un œil à ta photo…'
            : "On a lu ta photo. Corrige ce qui n'est pas juste."}
        </p>
      </div>

      <div className="rounded-xl border border-line-subtle bg-surface-raised p-4">
        <div className="flex items-center gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
            <DraftPhotoPreview url={photo.url} alt="Ta photo" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-body-ui font-semibold">Photo prise</p>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              onClick={() =>
                void navigate({
                  search: (prev) => ({ ...prev, step: 'photo' }),
                })
              }
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reprendre
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-body-sm leading-snug font-bold">Jeu</Label>
              {gameDetected && <DetectedTag />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {games.map((game) => (
                <GameTile
                  key={game.id}
                  name={game.name}
                  shortLabel={game.short_label}
                  coverPath={game.cover_path}
                  selected={!draft.customGame && draft.gameId === game.id}
                  onSelect={() =>
                    patch({
                      gameId: game.id,
                      customGame: false,
                      customGameName: null,
                    })
                  }
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                patch({
                  customGame: true,
                  gameId: null,
                })
              }
              className={cn(
                'flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-body-ui font-semibold',
                draft.customGame
                  ? 'border-line-accent text-ink-accent'
                  : 'border-line-subtle text-ink-primary',
              )}
            >
              <Plus className="size-5" aria-hidden="true" />
              Un autre jeu
            </button>
            {draft.customGame && (
              <Input
                className="h-12 rounded-xl text-arcade-name"
                value={draft.customGameName ?? ''}
                onChange={(event) =>
                  patch({ customGameName: event.target.value })
                }
                placeholder="Nom du jeu"
                maxLength={60}
                autoComplete="off"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label
                htmlFor="score"
                className="text-body-sm leading-snug font-bold"
              >
                {scoreType === 'time' ? 'Temps' : 'Score'}
              </Label>
              {scoreDetected && <DetectedTag />}
            </div>
            <Input
              id="score"
              className={cn(
                'h-12 rounded-xl font-mono text-arcade-name',
                timeError && 'border-ink-accent',
              )}
              value={
                scoreType === 'time'
                  ? draft.scoreText
                  : formatPointsInput(draft.scoreText.replace(/\s/g, ''))
              }
              onChange={(event) => {
                if (scoreType === 'time') {
                  patch({ scoreText: event.target.value })
                  return
                }
                patch({
                  scoreText: event.target.value.replace(/\D/g, ''),
                })
              }}
              onBlur={() => setScoreTouched(true)}
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              placeholder={scoreType === 'time' ? '13248' : '0'}
              aria-invalid={Boolean(timeError)}
              aria-describedby="score-hint"
              required
            />
            <p
              id="score-hint"
              aria-live="polite"
              className={cn(
                'text-body-sm',
                timeError ? 'font-bold text-ink-accent' : 'text-ink-secondary',
              )}
            >
              {scoreType !== 'time' ? (
                "Tel qu'affiché sur l'écran du jeu."
              ) : timeError ? (
                timeError
              ) : time?.ok ? (
                <span className="inline-flex items-center gap-1.5">
                  On lit
                  <span className="inline-flex items-center">
                    <span className="font-display text-arcade-label leading-none text-ink-accent">
                      {formatScore(time.ms, 'time')}
                    </span>
                    .
                  </span>
                </span>
              ) : (
                `Tape les chiffres d'affilée, comme sur le chrono : ${TIME_EXAMPLE}.`
              )}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-12 w-full rounded-xl text-h5"
        disabled={!canContinue}
        onClick={() =>
          void navigate({
            search: (prev) => ({ ...prev, step: 'consent' }),
          })
        }
      >
        Continuer
        <ChevronRight className="size-5" aria-hidden="true" />
      </Button>
    </div>
  )
}
