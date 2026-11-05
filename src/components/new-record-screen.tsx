import { AllTimeBadge } from '#/components/all-time-badge'
import { PhotoPlaceholder } from '#/components/photo-placeholder'
import { RankBadge } from '#/components/rank-badge'
import { formatScore, photoUrl, pixelCaps } from '#/lib/highscores'
import type { NewRecord } from '#/lib/highscores'
import { cn } from '#/lib/utils'

type NewRecordScreenProps = {
  entry: NewRecord
  className?: string
}

/** Past this length, the name drops to the smaller pixel size to fit two lines. */
const LONG_NAME = 16

/**
 * Full-screen takeover when a validated score takes 1st place (mockup p.3).
 * Looping confetti is allowed here despite the design-system rule for scene.
 */
export function NewRecordScreen({ entry, className }: NewRecordScreenProps) {
  const { game, record, previous, all_time } = entry
  const image = record.anonymous ? null : photoUrl(record.photo_path)

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'absolute inset-0 z-40 flex flex-col overflow-hidden bg-surface-base px-24 pt-16 pb-24',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/pixel-background.svg')] bg-cover bg-center opacity-80"
      />
      <Confetti />

      <h1 className="relative z-10 font-display text-scene-hero text-brand-pink">
        {pixelCaps('Nouveau record !')}
      </h1>

      <div className="relative z-10 mt-14 flex min-h-0 flex-1 items-start gap-16">
        <div className="aspect-square h-full shrink-0 rounded-none border-4 border-line-accent shadow-pixel">
          <div className="flex size-full items-center justify-center overflow-hidden border-4 border-line-strong bg-surface-sunken">
            {image ? (
              <img
                src={image}
                alt=""
                className="size-full object-contain"
                draggable={false}
              />
            ) : (
              <PhotoPlaceholder anonymous={record.anonymous} size="lg" />
            )}
          </div>
        </div>

        <div className="mt-16 flex min-w-0 flex-1 flex-col gap-8 rounded-none border-4 border-line-subtle bg-surface-sunken p-12 shadow-pixel">
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-display text-scene-pixel text-ink-accent">
              {pixelCaps(game.name)}
            </p>
            {all_time ? <AllTimeBadge /> : null}
          </div>

          <div className="flex items-center gap-6">
            <RankBadge rank={1} size="lg" />
            <p
              className={cn(
                'line-clamp-2 min-w-0 font-display text-ink-primary',
                record.player_name.length > LONG_NAME
                  ? 'text-scene-pixel'
                  : 'text-scene-row',
              )}
            >
              {record.player_name}
            </p>
          </div>

          <p className="font-display text-scene-hero text-ink-primary">
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
          100% { transform: translate3d(0,1200px,0) rotate(360deg); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
