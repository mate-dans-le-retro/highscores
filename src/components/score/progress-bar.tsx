import { cn } from '#/lib/utils'

type ScoreProgressBarProps = {
  /** 1-based form step (1 to 3). */
  step: number
  className?: string
}

/** Three-segment progress bar for the player form (mockups p.4–12). */
export function ScoreProgressBar({ step, className }: ScoreProgressBarProps) {
  return (
    <div
      className={cn('grid grid-cols-3 gap-2', className)}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={step}
      aria-label={`Étape ${step} sur 3`}
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            'h-1.5 rounded-full',
            n <= step ? 'bg-surface-accent' : 'bg-surface-overlay',
          )}
        />
      ))}
    </div>
  )
}
