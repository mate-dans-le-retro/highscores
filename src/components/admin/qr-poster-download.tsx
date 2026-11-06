import { Download } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import {
  POSTERS_PER_PAGE,
  POSTER_STYLES,
  canvasToA4PdfBlob,
  canvasToPngBlob,
  drawPosterSheet,
  loadPosterAssets,
  posterFileName,
} from '#/lib/qr-poster'
import type { PosterStyle, PostersPerPage } from '#/lib/qr-poster'
import { cn } from '#/lib/utils'

function downloadBlob(blob: Blob, name: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = name
  link.click()
  URL.revokeObjectURL(objectUrl)
}

/** Style, count and download controls for the submission QR poster. */
export function QrPosterDownload({
  url,
  className,
}: {
  url: string | null
  className?: string
}) {
  const [style, setStyle] = useState<PosterStyle>('branded')
  const [perPage, setPerPage] = useState<PostersPerPage>(1)
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null)
  const [failed, setFailed] = useState(false)

  const renderSheet = async () => {
    if (!url) throw new Error('No submit URL')
    const assets = await loadPosterAssets()
    const canvas = document.createElement('canvas')
    drawPosterSheet(canvas, url, assets, style, perPage)
    return canvas
  }

  const download = async (format: 'pdf' | 'png') => {
    if (!url || busy) return
    setBusy(format)
    setFailed(false)
    try {
      const canvas = await renderSheet()
      const blob =
        format === 'pdf'
          ? await canvasToA4PdfBlob(canvas)
          : await canvasToPngBlob(canvas)
      downloadBlob(blob, posterFileName(url, style, perPage, format))
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
        <Label htmlFor="posters-per-page">Affiches par page</Label>
        <NativeSelect
          id="posters-per-page"
          className="w-full"
          value={perPage}
          onChange={(event) =>
            setPerPage(Number(event.target.value) as PostersPerPage)
          }
        >
          {POSTERS_PER_PAGE.map((count) => (
            <option key={count} value={count}>
              {count === 1
                ? '1 (plein A4)'
                : count === 2
                  ? '2 (à découper)'
                  : '4 (à découper)'}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!url || busy !== null}
          onClick={() => void download('pdf')}
        >
          <Download />
          {busy === 'pdf' ? 'Préparation…' : 'Télécharger le PDF'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!url || busy !== null}
          onClick={() => void download('png')}
          title="Même feuille, en PNG haute résolution"
        >
          {busy === 'png' ? 'Préparation…' : 'PNG'}
        </Button>
      </div>
      <p className="text-caption text-ink-secondary">
        PDF A4. Imprime sans marges si tu peux, depuis l'admin de prod pour que
        le QR pointe vers scores.matedansleretro.fr.
      </p>
      {failed && (
        <p role="alert" className="text-caption text-destructive">
          L'affiche n'est pas partie. Réessaie dans un instant.
        </p>
      )}
    </div>
  )
}
