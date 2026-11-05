import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { InstagramPreview } from '#/components/admin/instagram-preview'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { Switch } from '#/components/ui/switch'
import {
  DEFAULT_SETTINGS,
  formatScore,
  formatScoreWhen,
  isMock,
  mockTools,
  pendingSubmissionsQuery,
  photoUrl,
  settingsQuery,
  useHighscoresRealtime,
} from '#/lib/highscores'
import type { MockPendingScore, Settings } from '#/lib/highscores'

export const Route = createFileRoute('/dev')({
  staticData: { theme: 'console' },
  component: DevPanel,
})

const SCREEN_MODES: Array<{ value: Settings['screen_mode']; label: string }> = [
  { value: 'game', label: 'Jeux seulement' },
  { value: 'wall', label: 'Mur seulement' },
  { value: 'both', label: 'Mur puis jeux' },
]

const GAME_DURATIONS: Array<Settings['game_duration_s']> = [15, 30, 60]
const WALL_DURATIONS: Array<Settings['wall_duration_s']> = [10, 20, 30]
const ROW_COUNTS: Array<Settings['rows_shown']> = [3, 5, 10]
const MIN_ALL_TIME: Array<Settings['min_all_time_rows']> = [3, 5, 10]

function DevPanel() {
  useHighscoresRealtime()

  if (!isMock) {
    return (
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 px-6 py-12">
        <h1 className="text-h2">Panneau de démo</h1>
        <p className="text-body-ui text-ink-secondary">
          Cette page ne marche qu&apos;en mode mock. Ajoute{' '}
          <code className="font-mono text-body-sm">?mock=1</code> à l&apos;URL,
          ou mets{' '}
          <code className="font-mono text-body-sm">VITE_DATA_SOURCE=mock</code>{' '}
          dans ton{' '}
          <code className="font-mono text-body-sm">.env.development.local</code>
          .
        </p>
        <p>
          <a href="/?mock=1" className="text-ink-accent underline">
            Ouvrir l&apos;écran public en mock
          </a>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-eyebrow text-ink-accent">Mock seulement</p>
          <h1 className="text-h2">Panneau de démo</h1>
          <p className="text-body-ui text-ink-secondary">
            Valide les soumissions, règle l&apos;écran, remets le seed.
            L&apos;écran public écoute les changements en direct.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href="/?mock=1">Écran public</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/score?mock=1">Formulaire joueur</a>
          </Button>
        </div>
      </header>

      <PendingSection />
      <InstagramPreview />
      <SettingsSection />
      <ResetSection />
    </main>
  )
}

function PendingSection() {
  const pending = useQuery(pendingSubmissionsQuery)
  const games = mockTools.listGames()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4">À valider</h2>
      {pending.isPending && (
        <p className="text-body-ui text-ink-secondary">Chargement…</p>
      )}
      {pending.isSuccess && pending.data.length === 0 && (
        <p className="text-body-ui text-ink-secondary">
          Rien en attente. Envoie un score depuis le formulaire joueur, ou
          remets le seed (Antoine et Chloé y sont).
        </p>
      )}
      <ul className="flex flex-col gap-4">
        {pending.data?.map((entry) => (
          <PendingCard key={entry.id} entry={entry} games={games} />
        ))}
      </ul>
    </section>
  )
}

function PendingCard({
  entry,
  games,
}: {
  entry: MockPendingScore
  games: ReturnType<typeof mockTools.listGames>
}) {
  const [attachId, setAttachId] = useState(games[0]?.id ?? '')
  const image = photoUrl(entry.photo_path)
  const gameLabel = entry.game_id
    ? (entry.game_name ?? entry.game_id)
    : `Autre jeu · ${entry.custom_game_name}`
  const freeSubmission = !entry.game_id

  return (
    <li className="flex flex-col gap-4 rounded-lg border border-line-subtle bg-surface-raised p-4 shadow-card sm:flex-row">
      <div className="size-28 shrink-0 overflow-hidden rounded-md border border-line-subtle bg-surface-sunken">
        {image ? (
          <img
            src={image}
            alt=""
            className="size-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-caption text-ink-muted">
            Pas de photo
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-h6">
            {entry.player_name ?? 'Sans nom'}{' '}
            <span className="font-mono text-body-ui text-ink-secondary">
              {formatScore(entry.score, entry.score_type)}
            </span>
          </p>
          <p className="text-body-sm text-ink-secondary">
            {gameLabel}
            {' · '}
            {formatScoreWhen(entry.created_at) || "à l'instant"}
          </p>
          <p className="text-caption text-ink-muted">
            {entry.display_on_screen
              ? "Affiché à l'écran"
              : "Anonyme à l'écran"}
            {entry.instagram_consent
              ? ` · Instagram ${entry.instagram_handle ?? 'sans compte'}`
              : " · Pas d'Instagram"}
          </p>
        </div>

        {freeSubmission ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`attach-${entry.id}`}>Rattacher à</Label>
              <NativeSelect
                id={`attach-${entry.id}`}
                value={attachId}
                onChange={(event) => setAttachId(event.target.value)}
              >
                {games.map((game) => (
                  <NativeSelectOption key={game.id} value={game.id}>
                    {game.name}
                    {game.visible ? '' : ' (caché)'}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <Button
              type="button"
              disabled={!attachId}
              onClick={() => mockTools.attachAndApprove(entry.id, attachId)}
            >
              Rattacher et valider
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => mockTools.createGameAndApprove(entry.id)}
            >
              Créer le jeu et valider
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => mockTools.reject(entry.id)}
            >
              Refuser
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => mockTools.approve(entry.id)}>
              Valider
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => mockTools.reject(entry.id)}
            >
              Refuser
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

function SettingsSection() {
  const settings = useQuery(settingsQuery)
  const current = settings.data ?? DEFAULT_SETTINGS

  const patch = (partial: Partial<Settings>) => {
    mockTools.setSettings(partial)
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4">Réglages de l&apos;écran</h2>
      <div className="grid gap-6 rounded-lg border border-line-subtle bg-surface-raised p-4 shadow-card sm:grid-cols-2">
        <Field label="Mode de rotation">
          <NativeSelect
            value={current.screen_mode}
            onChange={(event) =>
              patch({
                screen_mode: event.target.value as Settings['screen_mode'],
              })
            }
          >
            {SCREEN_MODES.map((mode) => (
              <NativeSelectOption key={mode.value} value={mode.value}>
                {mode.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Durée par jeu">
          <NativeSelect
            value={String(current.game_duration_s)}
            onChange={(event) =>
              patch({
                game_duration_s: Number(
                  event.target.value,
                ) as Settings['game_duration_s'],
              })
            }
          >
            {GAME_DURATIONS.map((value) => (
              <NativeSelectOption key={value} value={String(value)}>
                {value} s
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Durée du mur">
          <NativeSelect
            value={String(current.wall_duration_s)}
            onChange={(event) =>
              patch({
                wall_duration_s: Number(
                  event.target.value,
                ) as Settings['wall_duration_s'],
              })
            }
          >
            {WALL_DURATIONS.map((value) => (
              <NativeSelectOption key={value} value={String(value)}>
                {value} s
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Lignes affichées">
          <NativeSelect
            value={String(current.rows_shown)}
            onChange={(event) =>
              patch({
                rows_shown: Number(
                  event.target.value,
                ) as Settings['rows_shown'],
              })
            }
          >
            {ROW_COUNTS.map((value) => (
              <NativeSelectOption key={value} value={String(value)}>
                {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Minimum de records absolus">
          <NativeSelect
            value={String(current.min_all_time_rows)}
            onChange={(event) =>
              patch({
                min_all_time_rows: Number(
                  event.target.value,
                ) as Settings['min_all_time_rows'],
              })
            }
          >
            {MIN_ALL_TIME.map((value) => (
              <NativeSelectOption key={value} value={String(value)}>
                {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="submissions-open">Soumissions ouvertes</Label>
          <Switch
            id="submissions-open"
            checked={current.submissions_open}
            onCheckedChange={(checked) => patch({ submissions_open: checked })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="show-header">Titre et logo sur l'écran</Label>
          <Switch
            id="show-header"
            checked={current.show_header}
            onCheckedChange={(checked) => patch({ show_header: checked })}
          />
        </div>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ResetSection() {
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState(false)

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4">Remise à zéro</h2>
      <p className="text-body-ui text-ink-secondary">
        Recharge le seed mock (jeux, scores, réglages) et vide les photos
        IndexedDB. Utile après une série de tests.
      </p>
      {!confirm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirm(true)}
        >
          Remettre le seed
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              mockTools.reset()
              void queryClient.invalidateQueries()
              setConfirm(false)
            }}
          >
            Oui, tout effacer
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirm(false)}
          >
            Annuler
          </Button>
        </div>
      )}
    </section>
  )
}
