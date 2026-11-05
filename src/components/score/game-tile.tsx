import { Check } from 'lucide-react'
import { Fragment } from 'react'

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
        'flex min-h-16 items-center gap-2.5 rounded-xl border-2 bg-surface-raised px-2.5 py-2 text-left transition-colors',
        selected
          ? 'border-line-accent'
          : 'border-line-subtle hover:border-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md font-display text-arcade-label',
          selected && !coverPath
            ? 'bg-surface-accent text-ink-on-accent'
            : 'bg-surface-inverse text-ink-inverse',
        )}
      >
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
        {keepHyphenatedWords(name)}
      </span>
      {selected && (
        <Check className="size-5 shrink-0 text-ink-accent" aria-hidden="true" />
      )}
    </button>
  )
}

/** "Pac-Man" wraps as a whole word, never as "Pac-" over "Man". */
function keepHyphenatedWords(name: string) {
  return name.split(' ').map((word, index) => (
    <Fragment key={index}>
      {index > 0 ? ' ' : null}
      {word.includes('-') ? (
        <span className="whitespace-nowrap">{word}</span>
      ) : (
        word
      )}
    </Fragment>
  ))
}
