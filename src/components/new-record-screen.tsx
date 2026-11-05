import { RankBadge } from '#/components/rank-badge'
import { formatScore, photoUrl } from '#/lib/highscores'
import type { NewRecord } from '#/lib/highscores'
import { cn } from '#/lib/utils'

type NewRecordScreenProps = {
  entry: NewRecord
  className?: string
}

/**
 * Full-screen takeover when a validated score takes 1st place (mockup p.3).
 * Looping confetti is allowed here despite the design-system rule for scene.
 */
export function NewRecordScreen({ entry, className }: NewRecordScreenProps) {
  const { game, record, previous, all_time } = entry
  const image = photoUrl(record.photo_path)

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'absolute inset-0 z-40 flex flex-col overflow-hidden bg-surface-base p-24',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/pixel-background.svg')] bg-cover bg-center opacity-80"
      />
      <Confetti />

      <h1 className="relative z-10 text-center font-display text-scene-hero uppercase text-ink-accent">
        Nouveau record !
      </h1>

      <div className="relative z-10 mt-16 flex flex-1 items-center justify-center gap-16">
        <div
          className={cn(
            'flex size-[min(40vw,520px)] shrink-0 items-center justify-center overflow-hidden rounded-none border-4 border-line-strong bg-surface-sunken',
          )}
        >
          {image ? (
            <img
              src={image}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <p className="text-scene-meta text-ink-secondary">
              Photo de {record.player_name}
            </p>
          )}
        </div>

        <div className="flex min-w-0 max-w-xl flex-col gap-8 rounded-none border-4 border-line-subtle bg-surface-raised p-12 shadow-pixel">
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-display text-arcade-title uppercase text-ink-accent">
              {game.name}
            </p>
            {all_time ? (
              <span className="rounded-full bg-rank-gold px-4 py-1 text-caption font-extrabold uppercase tracking-wide text-ink-on-accent">
                Tous les temps
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <RankBadge rank={1} size="lg" />
            <p className="truncate font-display text-scene-row text-ink-primary">
              {record.player_name}
            </p>
          </div>

          <p className="font-mono text-scene-hero text-ink-primary">
            {formatScore(record.score, game.score_type)}
          </p>

          {previous ? (
            <p className="text-scene-meta text-ink-secondary">
              Ancien record : {previous.player_name},{' '}
              {formatScore(previous.score, game.score_type)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Lightweight looping confetti (CSS only, no extra dependency). */
function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => i)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-[-10%] block size-3 animate-[mdlr-confetti_4s_linear_infinite] rounded-none"
          style={{
            left: `${(i * 17) % 100}%`,
            animationDelay: `${(i % 8) * 0.35}s`,
            backgroundColor:
              i % 3 === 0
                ? 'var(--surface-accent)'
                : i % 3 === 1
                  ? 'var(--rank-gold)'
                  : 'var(--surface-inverse)',
          }}
        />
      ))}
      <style>{`
        @keyframes mdlr-confetti {
          0% { transform: translate3d(0,-10%,0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(0,110vh,0) rotate(360deg); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
