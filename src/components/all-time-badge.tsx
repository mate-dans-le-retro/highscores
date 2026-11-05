import { pixelCaps } from '#/lib/highscores'
import { cn } from '#/lib/utils'

/**
 * Gold « RECORD ABSOLU » tag: the score beats every event. Pixel register,
 * at the projected pixel minimum (28px).
 */
export function AllTimeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-none bg-rank-gold px-4 py-1 font-display text-scene-pixel text-ink-on-accent',
        className,
      )}
    >
      {pixelCaps('Record absolu')}
    </span>
  )
}
