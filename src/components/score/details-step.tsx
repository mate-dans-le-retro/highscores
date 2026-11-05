import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DetectedTag } from '@/components/score/detected-tag'
import { GameTile } from '@/components/score/game-tile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { detectFromPhoto } from '#/lib/detect-from-photo'
import type { DisplayedGame } from '#/lib/highscores'
import { dataUrlToBlob, writeScoreDraft } from '#/lib/score-draft'
import type { ScoreDraft } from '#/lib/score-draft'
import { cn } from '#/lib/utils'

type DetailsStepProps = {
  draft: ScoreDraft
  games: Array<DisplayedGame>
  onDraftChange: (draft: ScoreDraft) => void
}

function formatPointsInput(digits: string) {
  if (!digits) return ''
  const n = Number(digits)
  if (!Number.isFinite(n)) return digits
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function DetailsStep({ draft, games, onDraftChange }: DetailsStepProps) {
  const navigate = useNavigate({ from: '/score' })
  const [detecting, setDetecting] = useState(false)
  const detectionKey = useRef<string | null>(null)
  const draftRef = useRef(draft)
  const onDraftChangeRef = useRef(onDraftChange)
  draftRef.current = draft
  onDraftChangeRef.current = onDraftChange

  useEffect(() => {
    const photoDataUrl = draft.photoDataUrl
    if (!photoDataUrl) return
    if (detectionKey.current === photoDataUrl) return
    detectionKey.current = photoDataUrl

    let cancelled = false
    setDetecting(true)
    void detectFromPhoto(dataUrlToBlob(photoDataUrl))
      .then((result) => {
        if (cancelled) return
        const current = draftRef.current
        const next: ScoreDraft = {
          ...current,
          detectedGameId: result.gameId,
          detectedScore: result.score,
          gameId: current.gameId ?? result.gameId,
          scoreText:
            current.scoreText ||
            (result.score !== null ? String(result.score) : ''),
        }
        writeScoreDraft(next)
        onDraftChangeRef.current(next)
      })
      .finally(() => {
        if (!cancelled) setDetecting(false)
      })

    return () => {
      cancelled = true
    }
  }, [draft.photoDataUrl])

  const selectedGame = games.find((game) => game.id === draft.gameId) ?? null
  const scoreType = selectedGame?.score_type ?? 'points'
  const gameDetected =
    draft.detectedGameId !== null && draft.gameId === draft.detectedGameId
  const scoreDetected =
    draft.detectedScore !== null &&
    draft.scoreText.replace(/\D/g, '') === String(draft.detectedScore)

  const scoreOk =
    scoreType === 'time'
      ? draft.scoreText.trim().length > 0
      : /^\d+$/.test(draft.scoreText.replace(/\s/g, ''))
  const gameOk = draft.customGame
    ? (draft.customGameName?.trim().length ?? 0) > 0
    : Boolean(draft.gameId)
  const canContinue =
    Boolean(draft.photoDataUrl) &&
    gameOk &&
    scoreOk &&
    draft.playerName.trim().length > 0

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
            {draft.photoDataUrl && (
              <img
                src={draft.photoDataUrl}
                alt="Ta photo"
                className="size-full object-cover"
              />
            )}
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
                Score
              </Label>
              {scoreDetected && <DetectedTag />}
            </div>
            <Input
              id="score"
              className="h-12 rounded-xl font-mono text-arcade-name"
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
              inputMode={scoreType === 'time' ? 'text' : 'numeric'}
              placeholder={scoreType === 'time' ? `1'32"48` : '0'}
              required
            />
            <p className="text-body-sm text-ink-secondary">
              Tel qu'affiché sur l'écran du jeu.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="player"
              className="text-body-sm leading-snug font-bold"
            >
              Ton nom ou pseudo
            </Label>
            <Input
              id="player"
              className="h-12 rounded-xl text-arcade-name"
              value={draft.playerName}
              onChange={(event) => patch({ playerName: event.target.value })}
              maxLength={40}
              autoComplete="nickname"
              placeholder="Julie"
              required
            />
            <p className="text-body-sm text-ink-secondary">
              C'est ce qui s'affichera sur l'écran.
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
