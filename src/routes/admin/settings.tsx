import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { QrPosterDownload } from '#/components/admin/qr-poster-download'
import { useAdminRefetchInterval } from '#/components/admin/realtime-provider'
import { QrCode } from '#/components/qr-code'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { Switch } from '#/components/ui/switch'
import {
  adminSettingsQuery,
  currentEventQuery,
  renameEvent,
  updateSettings,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminSettings, SettingsChanges } from '#/lib/admin'
import type { ScreenMode } from '#/lib/data/types'
import { useSubmitScoreUrl } from '#/lib/submit-url'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/settings')({
  component: ScreenSettings,
})

const modes: Array<{ value: ScreenMode; label: string; hint: string }> = [
  {
    value: 'game',
    label: 'Un jeu à la fois',
    hint: 'Le classement d’un jeu, puis le suivant.',
  },
  {
    value: 'wall',
    label: 'Mur des records',
    hint: 'Le meilleur score de chaque jeu, en une vue.',
  },
  {
    value: 'both',
    label: 'Alterner les deux',
    hint: 'Le mur, puis chaque jeu à tour de rôle.',
  },
]

function ScreenSettings() {
  const refetchInterval = useAdminRefetchInterval()
  const settings = useQuery({ ...adminSettingsQuery, refetchInterval })
  const invalidate = useInvalidateAdmin()
  const save = useMutation({
    mutationFn: (changes: SettingsChanges) => updateSettings(changes),
    onSettled: invalidate,
  })

  if (!settings.data) {
    return <p className="text-body-sm text-ink-secondary">Chargement…</p>
  }
  // Show the change right away, before the server confirms it.
  const value: AdminSettings = {
    ...settings.data,
    ...(save.isPending ? save.variables : {}),
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h3">Écran</h1>
      {save.isError && (
        <p role="alert" className="text-body-sm text-destructive">
          Le réglage n'est pas passé. Réessaie dans un instant.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
          <h2 className="text-h5">Écran public</h2>
          <div className="flex flex-col gap-2" role="radiogroup">
            {modes.map((mode) => (
              <label
                key={mode.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                  value.screen_mode === mode.value
                    ? 'border-line-accent ring-1 ring-line-accent'
                    : 'border-line-strong hover:bg-surface-sunken',
                )}
              >
                <input
                  type="radio"
                  name="screen-mode"
                  className="mt-1 accent-primary"
                  checked={value.screen_mode === mode.value}
                  onChange={() => save.mutate({ screen_mode: mode.value })}
                />
                <span>
                  <span className="block text-body-ui font-semibold">
                    {mode.label}
                  </span>
                  <span className="block text-caption text-ink-secondary">
                    {mode.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectSetting
              id="game-duration"
              label="Durée par jeu"
              value={value.game_duration_s}
              options={[15, 30, 60]}
              format={(seconds) => `${seconds} secondes`}
              onChange={(game_duration_s) =>
                save.mutate({
                  game_duration_s: game_duration_s as 15 | 30 | 60,
                })
              }
            />
            <SelectSetting
              id="wall-duration"
              label="Durée du mur"
              value={value.wall_duration_s}
              options={[10, 20, 30]}
              format={(seconds) => `${seconds} secondes`}
              onChange={(wall_duration_s) =>
                save.mutate({
                  wall_duration_s: wall_duration_s as 10 | 20 | 30,
                })
              }
            />
            <SelectSetting
              id="rows-shown"
              label="Places affichées"
              value={value.rows_shown}
              options={[3, 5, 10]}
              format={(rows) => `Top ${rows}`}
              onChange={(rows_shown) =>
                save.mutate({ rows_shown: rows_shown as 3 | 5 | 10 })
              }
            />
          </div>
          <SelectSetting
            id="min-all-time"
            label="Places réservées aux records absolus"
            value={value.min_all_time_rows}
            options={[3, 5, 10]}
            format={(rows) => `Au moins ${rows}`}
            onChange={(min_all_time_rows) =>
              save.mutate({
                min_all_time_rows: min_all_time_rows as 3 | 5 | 10,
              })
            }
          />
          <label className="flex items-center justify-between gap-4 text-body-ui">
            <span>
              Afficher le titre et le logo en haut de l'écran
              <span className="block text-caption text-ink-secondary">
                Masqués, ils laissent plus de place aux scores.
              </span>
            </span>
            <Switch
              checked={value.show_header}
              onCheckedChange={(show_header) => save.mutate({ show_header })}
            />
          </label>
          <p className="text-caption text-ink-secondary">
            Les scores de l'évènement en cours qui ne rentrent pas dans le top
            s'affichent sous un séparateur, à la place des derniers records
            absolus.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <section className="flex items-center justify-between gap-4 rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
            <div>
              <h2 className="text-h5">Envois des joueurs</h2>
              <p className="text-caption text-ink-secondary">
                {value.submissions_open
                  ? 'Ouverts : le QR code mène au formulaire.'
                  : 'Fermés : le formulaire refuse les envois.'}
              </p>
            </div>
            <Switch
              checked={value.submissions_open}
              onCheckedChange={(submissions_open) =>
                save.mutate({ submissions_open })
              }
              aria-label="Envois ouverts"
            />
          </section>

          <SubmitQrCode />
          <EventName />
        </div>
      </div>
    </div>
  )
}

function SelectSetting({
  id,
  label,
  value,
  options,
  format,
  onChange,
}: {
  id: string
  label: string
  value: number
  options: Array<number>
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2 [&>[data-slot=native-select-wrapper]]:w-full">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        className="w-full"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}

function SubmitQrCode() {
  // The admin always reads the real backend, so its QR code never carries the demo.
  const url = useSubmitScoreUrl(false)
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface-raised p-4 shadow-card sm:flex-row sm:items-start md:p-6">
      <div className="aspect-square w-40 shrink-0 border border-line-subtle">
        {url && (
          <QrCode
            className="bg-surface-raised fill-ink-primary"
            value={url}
            label="QR code vers le formulaire joueur"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-h5">QR code d'envoi</h2>
          <p className="text-body-sm text-ink-secondary">
            Ouvre le formulaire joueur
            {url ? ` (${url.replace(/^https?:\/\//, '')})` : ''}. À imprimer
            près de chaque borne.
          </p>
        </div>
        <QrPosterDownload url={url} />
      </div>
    </section>
  )
}

function EventName() {
  const refetchInterval = useAdminRefetchInterval()
  const event = useQuery({ ...currentEventQuery, refetchInterval })
  const invalidate = useInvalidateAdmin()
  const [name, setName] = useState<string | null>(null)
  const rename = useMutation({
    mutationFn: () => renameEvent(event.data?.id ?? '', name ?? ''),
    onSuccess: async () => {
      await invalidate()
      setName(null)
    },
  })
  const value = name ?? event.data?.name ?? ''

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
      <h2 className="text-h5">Évènement en cours</h2>
      <form
        className="flex gap-2"
        onSubmit={(formEvent) => {
          formEvent.preventDefault()
          if (value.trim()) rename.mutate()
        }}
      >
        <Input
          aria-label="Nom de l'évènement"
          maxLength={80}
          value={value}
          onChange={(change) => setName(change.target.value)}
        />
        <Button
          type="submit"
          disabled={name === null || !value.trim() || rename.isPending}
        >
          Renommer
        </Button>
      </form>
      <p className="text-caption text-ink-secondary">
        Il s'affiche sous les anciens records sur l'écran. Pour en commencer un
        nouveau, passe par les records d'un jeu.
      </p>
    </section>
  )
}
