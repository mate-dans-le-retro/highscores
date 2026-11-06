import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { coverUrl } from '#/lib/admin'
import type { AdminGame } from '#/lib/admin'
import {
  POSTERS_PER_PAGE,
  POSTER_STYLES,
  buildPosterCanvases,
  canvasToPngBlob,
  canvasesToA4PdfBlob,
  loadPosterAssets,
  posterFileName,
  posterFileStem,
} from '#/lib/qr-poster'
import type { PosterGame, PosterStyle, PostersPerPage } from '#/lib/qr-poster'
import { cn } from '#/lib/utils'

function downloadBlob(blob: Blob, name: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = name
  link.click()
  URL.revokeObjectURL(objectUrl)
}

function toPosterGame(game: AdminGame): PosterGame {
  return {
    slug: game.slug,
    name: game.name,
    shortLabel: game.short_label,
    coverUrl: coverUrl(game.cover_path),
  }
}

/** Style, size, game pack and download controls for the submission QR poster. */
export function QrPosterDownload({
  url,
  games = [],
  className,
}: {
  url: string | null
  /** Admin games available for a per-game pack (hidden ones stay listed). */
  games?: Array<AdminGame>
  className?: string
}) {
  const [style, setStyle] = useState<PosterStyle>('plain')
  const [perPage, setPerPage] = useState<PostersPerPage>(4)
  const [withGames, setWithGames] = useState(true)
  const [selectedSlugs, setSelectedSlugs] = useState<Array<string>>([])
  const [selectionReady, setSelectionReady] = useState(false)
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null)
  const [failed, setFailed] = useState(false)

  const selectableGames = useMemo(
    () =>
      [...games].sort(
        (a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fr'),
      ),
    [games],
  )

  // First load: tick every visible game once the admin list arrives.
  useEffect(() => {
    if (selectionReady || selectableGames.length === 0) return
    setSelectedSlugs(
      selectableGames.filter((game) => game.visible).map((game) => game.slug),
    )
    setSelectionReady(true)
  }, [selectableGames, selectionReady])

  const selectedGames = useMemo(() => {
    if (!withGames) return [] as Array<PosterGame>
    const selected = new Set(selectedSlugs)
    return selectableGames
      .filter((game) => selected.has(game.slug))
      .map(toPosterGame)
  }, [withGames, selectedSlugs, selectableGames])

  const kind = selectedGames.length > 0 ? 'games' : 'generic'
  const canDownload =
    Boolean(url) && (!withGames || selectedGames.length > 0) && busy === null

  const toggleSlug = (slug: string, checked: boolean) => {
    setSelectedSlugs((current) => {
      if (checked) return current.includes(slug) ? current : [...current, slug]
      return current.filter((value) => value !== slug)
    })
  }

  const selectVisible = () => {
    setSelectedSlugs(
      selectableGames.filter((game) => game.visible).map((game) => game.slug),
    )
  }

  const selectAll = () => {
    setSelectedSlugs(selectableGames.map((game) => game.slug))
  }

  const selectNone = () => setSelectedSlugs([])

  const renderCanvases = async () => {
    if (!url) throw new Error('No submit URL')
    const assets = await loadPosterAssets()
    return buildPosterCanvases({
      submitUrl: url,
      assets,
      style,
      perPage,
      games: selectedGames,
    })
  }

  const download = async (format: 'pdf' | 'png') => {
    if (!canDownload || !url) return
    setBusy(format)
    setFailed(false)
    try {
      const canvases = await renderCanvases()
      if (format === 'pdf') {
        const blob = await canvasesToA4PdfBlob(canvases)
        downloadBlob(blob, posterFileName(url, style, perPage, 'pdf', kind))
        return
      }

      const stem = posterFileStem(url, style, perPage, kind)
      for (const [index, canvas] of canvases.entries()) {
        const suffix = canvases.length > 1 ? `-p${index + 1}` : ''
        downloadBlob(await canvasToPngBlob(canvas), `${stem}${suffix}.png`)
      }
    } catch (error) {
      console.warn('QR poster: download failed', error)
      setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Style">
        {POSTER_STYLES.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
              style === option.value
                ? 'border-line-accent ring-1 ring-line-accent'
                : 'border-line-strong hover:bg-surface-sunken',
            )}
          >
            <input
              type="radio"
              name="poster-style"
              className="mt-1 accent-primary"
              checked={style === option.value}
              onChange={() => setStyle(option.value)}
            />
            <span>
              <span className="block text-body-ui font-semibold">
                {option.label}
              </span>
              <span className="block text-caption text-ink-secondary">
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2 [&>[data-slot=native-select-wrapper]]:w-full">
        <Label htmlFor="posters-per-page">Taille</Label>
        <NativeSelect
          id="posters-per-page"
          className="w-full"
          value={perPage}
          onChange={(event) =>
            setPerPage(Number(event.target.value) as PostersPerPage)
          }
        >
          {POSTERS_PER_PAGE.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <label
        htmlFor="poster-with-games"
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
          withGames
            ? 'border-line-accent ring-1 ring-line-accent'
            : 'border-line-strong hover:bg-surface-sunken',
        )}
      >
        <Checkbox
          id="poster-with-games"
          className="mt-0.5"
          checked={withGames}
          onCheckedChange={(value) => setWithGames(value === true)}
        />
        <span>
          <span className="block text-body-ui font-semibold">
            Une affiche par jeu
          </span>
          <span className="block text-caption text-ink-secondary">
            Nom du jeu, vignette au centre du QR, lien avec ?game=slug.
          </span>
        </span>
      </label>

      {withGames && (
        <div className="flex flex-col gap-2 rounded-lg border border-line-subtle p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body-sm font-semibold">Jeux à imprimer</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectVisible}
              >
                Visibles
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                Tous
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectNone}
              >
                Aucun
              </Button>
            </div>
          </div>
          {selectableGames.length === 0 ? (
            <p className="text-caption text-ink-secondary">
              Aucun jeu pour l'instant. Ajoute-en dans Jeux.
            </p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {selectableGames.map((game) => {
                const checked = selectedSlugs.includes(game.slug)
                const id = `poster-game-${game.slug}`
                return (
                  <li key={game.id}>
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-sunken"
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleSlug(game.slug, value === true)
                        }
                      />
                      <span className="min-w-0 flex-1 truncate text-body-sm">
                        {game.name}
                        {!game.visible && (
                          <span className="text-ink-secondary"> (masqué)</span>
                        )}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
          {selectedGames.length > 0 && (
            <p className="text-caption text-ink-secondary">
              {selectedGames.length} jeu
              {selectedGames.length > 1 ? 'x' : ''} ·{' '}
              {Math.ceil(selectedGames.length / perPage)} page
              {Math.ceil(selectedGames.length / perPage) > 1 ? 's' : ''} PDF
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!canDownload}
          onClick={() => void download('pdf')}
        >
          <Download />
          {busy === 'pdf' ? 'Préparation…' : 'Télécharger le PDF'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canDownload}
          onClick={() => void download('png')}
          title="Même feuille, en PNG haute résolution"
        >
          {busy === 'png' ? 'Préparation…' : 'PNG'}
        </Button>
      </div>
      <p className="text-caption text-ink-secondary">
        PDF A4. Imprime sans marges si tu peux. Le QR pointe vers l'origine de
        cette page.
      </p>
      {failed && (
        <p role="alert" className="text-caption text-destructive">
          L'affiche n'est pas partie. Réessaie dans un instant.
        </p>
      )}
    </div>
  )
}
