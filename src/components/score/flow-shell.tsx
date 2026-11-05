import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { Logo } from '@/components/logo'
import { PixelGrid } from '@/components/pixel-grid'
import { ScoreProgressBar } from '@/components/score/progress-bar'
import { formStepNumber } from '#/lib/score-step'
import type { ScoreStep } from '#/lib/score-step'
import { cn } from '#/lib/utils'

type ScoreFlowShellProps = {
  step: ScoreStep
  children: ReactNode
  className?: string
}

export function ScoreFlowShell({
  step,
  children,
  className,
}: ScoreFlowShellProps) {
  const formStep = formStepNumber(step)
  const showBack = step === 'details' || step === 'consent'
  const backStep = step === 'consent' ? 'details' : 'photo'

  return (
    <PixelGrid className="min-h-dvh bg-surface-base text-ink-primary">
      <div
        className={cn(
          'mx-auto flex w-full max-w-md flex-col px-4 pb-10 pt-4',
          className,
        )}
      >
        {step === 'done' ? (
          <div className="mb-6 flex justify-center">
            <Logo className="m-0 w-44" />
          </div>
        ) : (
          <header className="mb-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              {showBack ? (
                <Link
                  to="/score"
                  search={(prev) => ({ ...prev, step: backStep })}
                  className="inline-flex items-center gap-2 text-body-ui font-semibold text-ink-primary"
                >
                  <ArrowLeft className="size-5" aria-hidden="true" />
                  Retour
                </Link>
              ) : (
                <Logo className="m-0 w-36" />
              )}
              {formStep !== null && (
                <p className="shrink-0 text-body-sm text-ink-secondary">
                  Étape {formStep} sur 3
                </p>
              )}
            </div>
            {formStep !== null && <ScoreProgressBar step={formStep} />}
          </header>
        )}
        {children}
      </div>
    </PixelGrid>
  )
}
