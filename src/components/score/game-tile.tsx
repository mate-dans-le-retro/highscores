import { Check } from 'lucide-react'

import { cn } from '#/lib/utils'

type GameTileProps = {
  name: string
  shortLabel: string
  coverPath: string | null
  selected?: boolean
  onSelect: () => void
}

/** Selectable game tile for the player form (cover or trigramme fallback). */
export function GameTile({
  name,
  shortLabel,
  coverPath,
  selected = false,
  onSelect,
}: GameTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex min-h-16 items-center gap-3 rounded-xl border-2 bg-surface-raised px-3 py-2 text-left transition-colors',
        selected
          ? 'border-line-accent'
          : 'border-line-subtle hover:border-line-strong',
      )}
    >
      <span className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-inverse font-display text-arcade-label text-ink-inverse">
        {coverPath ? (
          <img
            src={coverPath}
            alt=""
            className="size-full object-cover"
            draggable={false}
          />
        ) : (
          <span aria-hidden="true">{shortLabel}</span>
        )}
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-body-ui leading-tight font-semibold break-words text-ink-primary">
        {name}
      </span>
      {selected && (
        <Check
          className="absolute right-2 bottom-2 size-5 text-ink-accent"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
