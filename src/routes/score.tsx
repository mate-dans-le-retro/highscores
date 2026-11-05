import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { ConsentStep } from '@/components/score/consent-step'
import { DetailsStep } from '@/components/score/details-step'
import { ScoreFlowShell } from '@/components/score/flow-shell'
import { PhotoStep } from '@/components/score/photo-step'
import { ThanksStep } from '@/components/score/thanks-step'
import { readScoreDraft, writeScoreDraft } from '#/lib/score-draft'
import type { ScoreDraft } from '#/lib/score-draft'
import { resolveScoreStep, scoreSearchSchema } from '#/lib/score-step'
import { settingsQuery, visibleGamesQuery } from '#/lib/highscores'

export const Route = createFileRoute('/score')({
  staticData: { theme: 'arcade' },
  validateSearch: scoreSearchSchema,
  component: SubmitScore,
})

function SubmitScore() {
  const search = Route.useSearch()
  const step = resolveScoreStep(search)
  const games = useQuery(visibleGamesQuery)
  const settings = useQuery(settingsQuery)
  const [draft, setDraft] = useState<ScoreDraft>(() => readScoreDraft())

  const onDraftChange = useCallback((next: ScoreDraft) => {
    writeScoreDraft(next)
    setDraft(next)
  }, [])

  if (settings.data && !settings.data.submissions_open && step !== 'done') {
    return (
      <ScoreFlowShell step="photo">
        <div className="flex flex-col gap-4 rounded-xl border border-line-subtle bg-surface-raised p-5">
          <h1 className="font-display text-arcade-title text-ink-accent">
            Envois fermés
          </h1>
          <p className="text-body text-ink-secondary">
            On a coupé les envois pour le moment. Demande à un bénévole si tu
            veux quand même coller ton score.
          </p>
        </div>
      </ScoreFlowShell>
    )
  }

  if ((step === 'details' || step === 'consent') && !draft.photoDataUrl) {
    return (
      <Navigate
        to="/score"
        search={(prev) => ({ ...prev, step: 'photo' })}
        replace
      />
    )
  }

  if (step === 'consent') {
    const scoreFilled = draft.scoreText.trim().length > 0
    const nameFilled = draft.playerName.trim().length > 0
    const gameFilled = draft.customGame
      ? (draft.customGameName?.trim().length ?? 0) > 0
      : Boolean(draft.gameId)
    if (!scoreFilled || !nameFilled || !gameFilled) {
      return (
        <Navigate
          to="/score"
          search={(prev) => ({ ...prev, step: 'details' })}
          replace
        />
      )
    }
  }

  return (
    <ScoreFlowShell step={step}>
      {step === 'photo' && (
        <PhotoStep draft={draft} onDraftChange={onDraftChange} />
      )}
      {step === 'details' && (
        <DetailsStep
          draft={draft}
          games={games.data ?? []}
          onDraftChange={onDraftChange}
        />
      )}
      {step === 'consent' && (
        <ConsentStep
          draft={draft}
          games={games.data ?? []}
          onDraftChange={onDraftChange}
        />
      )}
      {step === 'done' && (
        <ThanksStep draft={draft} onDraftChange={onDraftChange} />
      )}
    </ScoreFlowShell>
  )
}
