import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AtSign, Camera, Check, EyeOff, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { GameThumb } from '#/components/admin/game-thumb'
import { ScoreInstagram } from '#/components/admin/score-instagram'
import { SubmissionDetail } from '#/components/admin/submission-detail'
import { Switch } from '#/components/ui/switch'
import {
  adminGamesQuery,
  adminSettingsQuery,
  approvedScoresQuery,
  currentEventQuery,
  placeFor,
  proofUrl,
  rankGameScores,
  submissionCountsQuery,
  submissionsQuery,
  updateSettings,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminGame, AdminScore, SubmissionFilter } from '#/lib/admin'
import { formatScore, formatScoreWhen } from '#/lib/format'
import { useReadablePhotoUrl } from '#/lib/readable-photo'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/')({
  component: Submissions,
})

const filters: Array<{ status: SubmissionFilter; label: string }> = [
  { status: 'pending', label: 'À valider' },
  { status: 'approved', label: 'Validées' },
  { status: 'rejected', label: 'Rejetées' },
  { status: 'to_post', label: 'À publier' },
]

function Submissions() {
  const [status, setStatus] = useState<SubmissionFilter>('pending')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const submissions = useQuery(submissionsQuery(status))
  const counts = useQuery(submissionCountsQuery)
  const games = useQuery(adminGamesQuery)
  const approved = useQuery(approvedScoresQuery)
  const event = useQuery(currentEventQuery)

  const list = submissions.data ?? []
  const selected = list.find(({ id }) => id === selectedId) ?? list.at(0)

  // When the selected submission leaves the list (approved, rejected), the
  // next one takes its place.
  useEffect(() => {
    if (selectedId && !list.some(({ id }) => id === selectedId))
      setSelectedId(null)
  }, [list, selectedId])

  const gamesById = new Map((games.data ?? []).map((game) => [game.id, game]))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
      <section className="flex min-w-0 flex-col gap-4">
        <h1 className="text-h3">Soumissions</h1>
        <div className="grid grid-cols-2 gap-2" role="tablist">
          {filters.map((filter) => (
            <button
              key={filter.status}
              type="button"
              role="tab"
              aria-selected={status === filter.status}
              onClick={() => {
                setStatus(filter.status)
                setSelectedId(null)
              }}
              className={cn(
                'h-10 rounded-full border border-line-strong px-2 text-sm font-semibold transition-colors',
                status === filter.status
                  ? 'bg-surface-inverse text-ink-inverse'
                  : 'bg-surface-raised hover:bg-surface-sunken',
              )}
            >
              {filter.label}
              {counts.data && ` · ${counts.data[filter.status]}`}
            </button>
          ))}
        </div>

        {submissions.isPending && (
          <p className="text-body-sm text-ink-secondary">Chargement…</p>
        )}
        {submissions.isError && (
          <p className="text-body-sm text-destructive">
            Impossible de charger les soumissions.
          </p>
        )}
        {submissions.isSuccess && list.length === 0 && (
          <EmptyQueue status={status} />
        )}

        <ul className="flex flex-col gap-3">
          {list.map((submission) => (
            <li key={submission.id}>
              <SubmissionCard
                submission={submission}
                game={
                  submission.game_id
                    ? gamesById.get(submission.game_id)
                    : undefined
                }
                approved={approved.data ?? []}
                eventId={event.data?.id}
                selected={submission.id === selected?.id}
                onSelect={() => {
                  setSelectedId(submission.id)
                  // On a phone the detail sits under the list: bring it up.
                  if (!window.matchMedia('(min-width: 1024px)').matches)
                    requestAnimationFrame(() =>
                      document
                        .getElementById('submission-detail')
                        ?.scrollIntoView({ behavior: 'smooth' }),
                    )
                }}
              />
            </li>
          ))}
        </ul>

        <SubmissionsSwitch />
      </section>

      <section id="submission-detail" className="min-w-0 scroll-mt-4">
        {selected && games.data && status === 'to_post' ? (
          <PostDetail
            key={selected.id}
            submission={selected}
            game={
              selected.game_id ? gamesById.get(selected.game_id) : undefined
            }
          />
        ) : selected && games.data ? (
          <SubmissionDetail
            key={selected.id}
            submission={selected}
            games={games.data}
            approved={approved.data ?? []}
            eventId={event.data?.id}
          />
        ) : (
          <div className="hidden h-full min-h-64 place-items-center rounded-xl border border-dashed border-line-subtle lg:grid">
            <p className="text-body-sm text-ink-secondary">
              Choisis une soumission pour la voir en grand.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

/** A score to post: what the volunteer needs, without the review form. */
function PostDetail({
  submission,
  game,
}: {
  submission: AdminScore
  game: AdminGame | undefined
}) {
  return (
    <article className="flex flex-col gap-6 rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
      <header className="flex flex-wrap items-center gap-3">
        {game && <GameThumb game={game} />}
        <h2 className="text-h5">
          {submission.player_name ?? 'Sans nom'} · {game?.name}
        </h2>
        <span className="text-caption text-ink-secondary">
          Validée{' '}
          {formatScoreWhen(submission.reviewed_at ?? submission.created_at)}
        </span>
      </header>
      {game ? (
        <ScoreInstagram submission={submission} game={game} />
      ) : (
        <p className="text-body-sm text-ink-secondary">Chargement…</p>
      )}
    </article>
  )
}

function EmptyQueue({ status }: { status: SubmissionFilter }) {
  const text = {
    pending: 'Rien à valider. Profites-en pour aller jouer !',
    approved: 'Aucune soumission validée pour l’instant.',
    rejected: 'Aucune soumission rejetée.',
    to_post:
      'Rien à publier : tout est en ligne, ou personne n’a dit oui à Instagram.',
  }[status]
  return (
    <p className="rounded-xl bg-surface-raised p-6 text-center text-body-sm text-ink-secondary shadow-card">
      {text}
    </p>
  )
}

function SubmissionCard({
  submission,
  game,
  approved,
  eventId,
  selected,
  onSelect,
}: {
  submission: AdminScore
  game: AdminGame | undefined
  approved: Array<AdminScore>
  eventId: string | undefined
  selected: boolean
  onSelect: () => void
}) {
  const photo = useReadablePhotoUrl(
    proofUrl(submission.thumb_path ?? submission.photo_path),
  )
  const place =
    game && submission.status === 'pending'
      ? placeFor(
          submission.score,
          rankGameScores(approved, game, eventId),
          game.score_order,
        )
      : null

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border-2 bg-surface-raised p-3 text-left shadow-card transition-colors',
        selected
          ? 'border-line-accent'
          : 'border-transparent hover:border-line-subtle',
      )}
    >
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-sunken text-ink-secondary">
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <Camera className="size-5" aria-hidden="true" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-display text-sm">
          {submission.player_name ?? 'Sans nom'}
        </span>
        <span className="truncate text-caption text-ink-secondary">
          {game?.name ?? `${submission.custom_game_name} (jeu libre)`} ·{' '}
          {formatScoreWhen(submission.created_at)}
        </span>
        <span className="flex flex-wrap gap-1.5">
          {place === 1 && (
            <Tag className="bg-rank-gold text-ink-primary">
              <Trophy className="size-3" aria-hidden="true" />
              Record battu
            </Tag>
          )}
          {place !== null && (
            <Tag className="border border-line-strong">
              {place === 1 ? '1re' : `${place}e`} place
            </Tag>
          )}
          {submission.instagram_consent &&
            (submission.instagram_post_id ? (
              <Tag className="bg-state-live-surface text-state-live-ink">
                <Check className="size-3" aria-hidden="true" />
                Publié sur Instagram
              </Tag>
            ) : (
              <Tag className="bg-surface-sunken text-ink-primary">
                <AtSign className="size-3" aria-hidden="true" />
                Instagram
              </Tag>
            ))}
          {!submission.display_on_screen && (
            <Tag className="bg-surface-sunken text-ink-secondary">
              <EyeOff className="size-3" aria-hidden="true" />
              Masqué
            </Tag>
          )}
        </span>
      </span>
      <span className="shrink-0 font-display text-sm text-ink-accent">
        {formatScore(submission.score, game?.score_type)}
      </span>
    </button>
  )
}

function Tag({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    // Not cn(): tailwind-merge would take text-caption (a size) and a text
    // color for the same property and drop one.
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

function SubmissionsSwitch() {
  const settings = useQuery(adminSettingsQuery)
  const invalidate = useInvalidateAdmin()
  const toggle = useMutation({
    mutationFn: (open: boolean) => updateSettings({ submissions_open: open }),
    onSettled: invalidate,
  })
  const open = toggle.isPending
    ? toggle.variables
    : (settings.data?.submissions_open ?? true)

  return (
    <div className="mt-auto flex items-center justify-between gap-4 rounded-xl bg-surface-raised p-4 shadow-card">
      <div>
        <p className="text-body-ui font-semibold">
          Envois {open ? 'ouverts' : 'fermés'}
        </p>
        <p className="text-caption text-ink-secondary">
          {open
            ? 'Les joueurs peuvent scanner le QR code.'
            : 'Le formulaire joueur refuse les envois.'}
        </p>
      </div>
      <Switch
        checked={open}
        disabled={!settings.data}
        onCheckedChange={(checked) => toggle.mutate(checked)}
        aria-label="Envois ouverts"
      />
    </div>
  )
}
