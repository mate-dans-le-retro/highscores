import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  canvasToPngBlob,
  drawQrPoster,
  loadPosterAssets,
  posterFileName,
} from '#/lib/qr-poster'
import { submitScoreUrl } from '#/lib/submit-url'

/** /dev preview of the printable A4 submission poster. */
export function QrPosterPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const url =
    typeof window === 'undefined'
      ? null
      : submitScoreUrl('https://scores.matedansleretro.fr', false)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    setReady(false)
    void loadPosterAssets().then((assets) => {
      if (cancelled || !canvasRef.current) return
      drawQrPoster(canvasRef.current, url, assets)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  const download = async () => {
    const canvas = canvasRef.current
    if (!canvas || !url || busy) return
    setBusy(true)
    try {
      const blob = await canvasToPngBlob(canvas)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = posterFileName(url)
      link.click()
      URL.revokeObjectURL(objectUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4">Affiche QR d'envoi</h2>
      <p className="text-body-ui text-ink-secondary">
        A4 300 dpi ({POSTER_WIDTH} × {POSTER_HEIGHT}), QR vers la prod. Même
        fichier que « Télécharger l'affiche » dans Écran.
      </p>
      <canvas
        ref={canvasRef}
        data-testid="qr-poster-canvas"
        className="w-full max-w-md border border-line-subtle bg-surface-sunken"
        style={{ aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
      />
      <Button
        type="button"
        disabled={!ready || busy}
        onClick={() => void download()}
        className="self-start"
      >
        <Download />
        {busy ? 'Préparation…' : "Télécharger l'affiche"}
      </Button>
    </section>
  )
}
