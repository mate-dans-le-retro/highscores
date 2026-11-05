import { useMutation } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { CoverCropper } from '#/components/admin/cover-cropper'
import { GameThumb } from '#/components/admin/game-thumb'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  createGame,
  defaultShortLabel,
  updateGame,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminGame, GameInput } from '#/lib/admin'
import type { ScoreOrder, ScoreType } from '#/lib/data/types'
import { cn } from '#/lib/utils'

const scoreTypes: Array<{ value: ScoreType; label: string }> = [
  { value: 'points', label: 'Points' },
  { value: 'time', label: 'Temps' },
  { value: 'other', label: 'Autre' },
]

const scoreOrders: Array<{ value: ScoreOrder; label: string }> = [
  { value: 'desc', label: 'Le plus haut' },
  { value: 'asc', label: 'Le plus bas' },
]

/**
 * Adds a game (no `game`) or edits one. `initialName` prefills the name, for a
 * free game name typed by a player. Calls onSaved with the game id.
 */
export function GameDialog({
  open,
  onOpenChange,
  game,
  initialName,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  game?: AdminGame
  initialName?: string
  onSaved?: (gameId: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-md">
        {open && (
          <GameForm
            game={game}
            initialName={initialName}
            onDone={(id) => {
              onOpenChange(false)
              onSaved?.(id)
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function GameForm({
  game,
  initialName = '',
  onDone,
  onCancel,
}: {
  game?: AdminGame
  initialName?: string
  onDone: (id: string) => void
  onCancel: () => void
}) {
  const invalidate = useInvalidateAdmin()
  const [name, setName] = useState(game?.name ?? initialName)
  const [shortLabel, setShortLabel] = useState(game?.short_label ?? '')
  const [gameConsole, setGameConsole] = useState(game?.console ?? '')
  const [stationLabel, setStationLabel] = useState(game?.station_label ?? '')
  const [scoreType, setScoreType] = useState<ScoreType>(
    game?.score_type ?? 'points',
  )
  const [scoreOrder, setScoreOrder] = useState<ScoreOrder>(
    game?.score_order ?? 'desc',
  )
  const [visible, setVisible] = useState(game?.visible ?? true)
  const [cover, setCover] = useState<File | null>(null)
  const [pendingCrop, setPendingCrop] = useState<{
    src: string
    name: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const label = shortLabel.trim() || defaultShortLabel(name)
  const coverPreview = useMemo(
    () => (cover ? URL.createObjectURL(cover) : null),
    [cover],
  )
  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    },
    [coverPreview],
  )
  useEffect(
    () => () => {
      if (pendingCrop) URL.revokeObjectURL(pendingCrop.src)
    },
    [pendingCrop],
  )
  const preview = coverPreview ?? game?.cover_path ?? null

  const save = useMutation({
    mutationFn: async () => {
      const input: GameInput = {
        name,
        short_label: label,
        console: gameConsole,
        score_type: scoreType,
        score_order: scoreOrder,
        visible,
        station_label: stationLabel,
        cover,
      }
      if (game) {
        await updateGame(game, input)
        return game.id
      }
      return createGame(input)
    },
    onSuccess: async (id) => {
      await invalidate()
      onDone(id)
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) save.mutate()
  }

  function pickCover(file: File | undefined) {
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    setPendingCrop({ src: URL.createObjectURL(file), name: file.name })
  }

  function cancelCrop() {
    setPendingCrop((current) => {
      if (current) URL.revokeObjectURL(current.src)
      return null
    })
  }

  function confirmCrop(file: File) {
    setPendingCrop((current) => {
      if (current) URL.revokeObjectURL(current.src)
      return null
    })
    setCover(file)
  }

  if (pendingCrop) {
    return (
      <CoverCropper
        imageSrc={pendingCrop.src}
        fileName={pendingCrop.name}
        onConfirm={confirmCrop}
        onCancel={cancelCrop}
      />
    )
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{game ? 'Modifier le jeu' : 'Ajouter un jeu'}</DialogTitle>
        <DialogDescription>
          Nom, type de score et affichage sur l'écran.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="game-name">Nom du jeu</Label>
        <Input
          id="game-name"
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="game-console">Console</Label>
          <Input
            id="game-console"
            placeholder="Super NES"
            maxLength={40}
            value={gameConsole}
            onChange={(event) => setGameConsole(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="game-station">Surnom de la borne</Label>
          <Input
            id="game-station"
            placeholder="Étage"
            maxLength={40}
            value={stationLabel}
            onChange={(event) => setStationLabel(event.target.value)}
          />
        </div>
      </div>
      <p className="-mt-3 text-caption text-ink-secondary">
        Le surnom vaut pour l'évènement en cours seulement.
      </p>

      <div className="flex min-w-0 flex-col gap-2">
        <Label>Vignette</Label>
        <div className="flex min-w-0 items-center gap-3">
          <GameThumb
            game={{ name, short_label: label, cover_path: preview }}
            className="size-12 shrink-0"
          />
          <Input
            aria-label="Initiales"
            className="w-20 shrink-0 uppercase"
            maxLength={4}
            placeholder={defaultShortLabel(name)}
            value={shortLabel}
            onChange={(event) => setShortLabel(event.target.value)}
          />
          <label
            className="flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed border-line-strong px-3 text-sm font-semibold hover:bg-surface-sunken"
            title={cover?.name}
          >
            <Upload className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">
              {cover ? cover.name : 'Ajouter une image'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => pickCover(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <ChoiceGroup
        label="Type de score"
        options={scoreTypes}
        value={scoreType}
        onChange={(value) => {
          setScoreType(value)
          // A time is usually best when lowest.
          if (!game) setScoreOrder(value === 'time' ? 'asc' : 'desc')
        }}
      />
      <ChoiceGroup
        label="Le meilleur score est"
        options={scoreOrders}
        value={scoreOrder}
        onChange={setScoreOrder}
      />

      <label className="flex items-center gap-3 text-body-ui font-semibold">
        <Switch checked={visible} onCheckedChange={setVisible} />
        {visible ? 'Affiché sur l’écran' : 'Masqué de l’écran'}
      </label>

      {save.isError && (
        <p role="alert" className="text-body-sm text-destructive">
          Impossible d'enregistrer le jeu. Réessaie dans un instant.
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={save.isPending || !name.trim()}>
          {!game && <Plus />}
          {save.isPending
            ? 'Enregistrement…'
            : game
              ? 'Enregistrer'
              : 'Ajouter le jeu'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold',
              value === option.value
                ? 'border-line-accent bg-surface-raised ring-1 ring-line-accent'
                : 'border-line-strong hover:bg-surface-sunken',
            )}
          >
            <input
              type="radio"
              className="accent-primary"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
