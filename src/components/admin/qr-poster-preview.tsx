import { useEffect, useRef } from 'react'

import { QrPosterDownload } from '#/components/admin/qr-poster-download'
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  drawPosterSheet,
  loadPosterAssets,
} from '#/lib/qr-poster'
import { submitScoreUrl } from '#/lib/submit-url'

/** /dev preview of the printable A4 submission poster sheet. */
export function QrPosterPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url =
    typeof window === 'undefined'
      ? null
      : submitScoreUrl('https://scores.matedansleretro.fr', false)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    void loadPosterAssets().then((assets) => {
      if (cancelled || !canvasRef.current) return
      drawPosterSheet(canvasRef.current, url, assets, 'branded', 1)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h4">Affiche QR d'envoi</h2>
      <p className="text-body-ui text-ink-secondary">
        A4 300 dpi ({POSTER_WIDTH} × {POSTER_HEIGHT}), QR vers la prod. Les
        mêmes options que « Télécharger le PDF » dans Écran.
      </p>
      <canvas
        ref={canvasRef}
        data-testid="qr-poster-canvas"
        className="w-full max-w-md border border-line-subtle bg-surface-sunken"
        style={{ aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
      />
      <QrPosterDownload url={url} />
    </section>
  )
}
