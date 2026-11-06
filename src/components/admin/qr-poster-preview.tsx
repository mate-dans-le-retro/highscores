import { useEffect, useRef, useState } from 'react'

import { QrPosterDownload } from '#/components/admin/qr-poster-download'
import { Button } from '#/components/ui/button'
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  buildPosterCanvases,
  canvasToPngBlob,
  canvasesToA4PdfBlob,
  drawPosterSheet,
  loadPosterAssets,
  posterFileStem,
} from '#/lib/qr-poster'
import type { PosterGame, PosterStyle, PostersPerPage } from '#/lib/qr-poster'
import { submitScoreUrl } from '#/lib/submit-url'

/** Current event games for printable packs (covers from the public bucket). */
const CURRENT_EVENT_GAMES: Array<PosterGame> = [
  {
    slug: 'duck-hunt',
    name: 'Duck Hunt',
    shortLabel: 'DH',
    coverUrl:
      'https://urhxiwltkixafejwxqfw.supabase.co/storage/v1/object/public/covers/duck-hunt-ba1902b3.jpg',
  },
  {
    slug: 'super-mario-bros',
    name: 'Super Mario Bros.',
    shortLabel: 'SMB',
    coverUrl:
      'https://urhxiwltkixafejwxqfw.supabase.co/storage/v1/object/public/covers/super-mario-bros-1620073c.jpg',
  },
  {
    slug: 'guitar-hero',
    name: 'Guitar Hero',
    shortLabel: 'GH',
    coverUrl:
      'https://urhxiwltkixafejwxqfw.supabase.co/storage/v1/object/public/covers/guitar-hero-e997d4f1.png',
  },
  {
    slug: 'donkey-kong-jungle-beat-1998',
    name: 'Donkey Konga',
    shortLabel: 'DKJ',
    coverUrl:
      'https://urhxiwltkixafejwxqfw.supabase.co/storage/v1/object/public/covers/donkey-kong-jungle-beat-1998-317471e2.png',
  },
]

const PACK_VARIANTS: Array<{ style: PosterStyle; perPage: PostersPerPage }> = [
  { style: 'plain', perPage: 2 },
  { style: 'plain', perPage: 4 },
  { style: 'branded', perPage: 2 },
  { style: 'branded', perPage: 4 },
]

type ExportedPosterFile = {
  name: string
  mime: string
  base64: string
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Build the printable current-event packs (used by /dev and the export script). */
export async function exportCurrentEventPosterPacks(
  submitUrl = 'https://scores.matedansleretro.fr/score',
): Promise<Array<ExportedPosterFile>> {
  const assets = await loadPosterAssets()
  const files: Array<ExportedPosterFile> = []

  for (const variant of PACK_VARIANTS) {
    const canvases = await buildPosterCanvases({
      submitUrl,
      assets,
      style: variant.style,
      perPage: variant.perPage,
      games: CURRENT_EVENT_GAMES,
    })
    const pdf = await canvasesToA4PdfBlob(canvases)
    const stem = posterFileStem(
      submitUrl,
      variant.style,
      variant.perPage,
      'games',
    )
    files.push({
      name: `${stem}.pdf`,
      mime: 'application/pdf',
      base64: await blobToBase64(pdf),
    })

    const preview = canvases.at(0)
    if (!preview) continue
    const png = await canvasToPngBlob(preview)
    files.push({
      name: `preview-${variant.style}-x${variant.perPage}.png`,
      mime: 'image/png',
      base64: await blobToBase64(png),
    })
  }

  return files
}

declare global {
  interface Window {
    __exportQrPosterGames?: typeof exportCurrentEventPosterPacks
  }
}

/** /dev preview of the printable A4 submission poster sheet. */
export function QrPosterPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportNote, setExportNote] = useState<string | null>(null)
  const url =
    typeof window === 'undefined'
      ? null
      : submitScoreUrl('https://scores.matedansleretro.fr', false)

  useEffect(() => {
    window.__exportQrPosterGames = exportCurrentEventPosterPacks
    return () => {
      delete window.__exportQrPosterGames
    }
  }, [])

  useEffect(() => {
    if (!url) return
    let cancelled = false
    void loadPosterAssets().then((assets) => {
      if (cancelled || !canvasRef.current) return
      drawPosterSheet(
        canvasRef.current,
        url,
        assets,
        'plain',
        4,
        CURRENT_EVENT_GAMES,
      )
    })
    return () => {
      cancelled = true
    }
  }, [url])

  const downloadPacks = async () => {
    setExporting(true)
    setExportNote(null)
    try {
      const files = await exportCurrentEventPosterPacks()
      for (const file of files) {
        const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: file.mime })
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = file.name
        link.click()
        URL.revokeObjectURL(objectUrl)
      }
      setExportNote(`${files.length} fichiers prêts.`)
    } catch (error) {
      console.warn('QR poster pack export failed', error)
      setExportNote("L'export a échoué. Réessaie.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4">Affiche QR d'envoi</h2>
      <p className="text-body-ui text-ink-secondary">
        A4 300 dpi ({POSTER_WIDTH} × {POSTER_HEIGHT}), QR vers la prod. Les
        mêmes options que « Télécharger le PDF » dans Écran (clair/sombre,
        taille, jeux).
      </p>
      <canvas
        ref={canvasRef}
        data-testid="qr-poster-canvas"
        className="w-full max-w-md border border-line-subtle bg-surface-sunken"
        style={{ aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={exporting}
          onClick={() => void downloadPacks()}
        >
          {exporting
            ? 'Préparation du pack…'
            : 'Exporter le pack jeux (PDF + aperçus)'}
        </Button>
      </div>
      {exportNote && (
        <p className="text-caption text-ink-secondary">{exportNote}</p>
      )}
      <QrPosterDownload url={url} />
    </section>
  )
}
