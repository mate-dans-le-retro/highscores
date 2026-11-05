import { useNavigate } from '@tanstack/react-router'
import { Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { draftPhotos } from '#/lib/draft-photo'
import { resetScoreDraftKeepName } from '#/lib/score-draft'
import type { ScoreDraft } from '#/lib/score-draft'

type ThanksStepProps = {
  draft: ScoreDraft
  onDraftChange: (draft: ScoreDraft) => void
}

export function ThanksStep({ draft, onDraftChange }: ThanksStepProps) {
  const navigate = useNavigate({ from: '/score' })

  return (
    <div className="rounded-xl border border-line-subtle bg-surface-raised p-5">
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-arcade-title text-ink-accent">
          MERCI !
        </h1>
        <div className="flex flex-col gap-2">
          <p className="text-h4 font-extrabold text-ink-primary">
            Score envoyé
          </p>
          <p className="text-body text-ink-secondary">
            Un bénévole vérifie ton score. Une fois validé, tu apparais sur
            l'écran, près de la scène.
          </p>
        </div>

        <p className="inline-flex w-fit items-center gap-2 self-center rounded-full bg-surface-accent px-4 py-2 text-body-sm font-semibold text-ink-on-accent">
          <Info className="size-4" aria-hidden="true" />
          En attente de validation
        </p>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 w-full rounded-xl border-line-subtle text-h5"
          onClick={() => {
            const next = resetScoreDraftKeepName(draft)
            void draftPhotos.clear()
            onDraftChange(next)
            void navigate({
              search: (prev) => ({ ...prev, step: 'photo' }),
            })
          }}
        >
          Envoyer un autre score
        </Button>
      </div>
    </div>
  )
}
