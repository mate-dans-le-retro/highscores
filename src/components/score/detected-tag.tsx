import { Sparkles } from 'lucide-react'

import { cn } from '#/lib/utils'

type DetectedTagProps = {
  className?: string
}

/** Pink tag when a value was suggested from the photo (stub detection for now). */
export function DetectedTag({ className }: DetectedTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-surface-accent/15 px-2.5 py-1 text-caption font-semibold text-ink-accent',
        className,
      )}
    >
      <Sparkles className="size-3.5" aria-hidden="true" />
      Lu sur la photo
    </span>
  )
}
