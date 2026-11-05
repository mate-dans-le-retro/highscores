import { cn } from '#/lib/utils'
import { coverUrl } from '#/lib/admin'
import type { ScoreOrder, ScoreType } from '#/lib/data/types'

/** Cover of a game, or its short label on a purple square when it has none. */
export function GameThumb({
  game,
  className,
}: {
  game: { name: string; short_label: string; cover_path: string | null }
  className?: string
}) {
  const url = coverUrl(game.cover_path)
  return url ? (
    <img
      src={url}
      alt=""
      className={cn('size-10 shrink-0 object-cover', className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-10 shrink-0 place-items-center bg-surface-inverse text-xs font-extrabold text-ink-inverse',
        className,
      )}
    >
      {game.short_label}
    </span>
  )
}

const typeLabels: Record<ScoreType, string> = {
  points: 'Points',
  time: 'Temps',
  other: 'Autre',
}

/** "Points · le plus haut gagne". */
export function scoreRuleLabel(type: ScoreType, order: ScoreOrder) {
  return `${typeLabels[type]} · le plus ${order === 'desc' ? 'haut' : 'bas'} gagne`
}
