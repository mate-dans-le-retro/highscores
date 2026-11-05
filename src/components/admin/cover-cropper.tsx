import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useCallback, useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { COVER_ASPECT, cropCoverToFile } from '#/lib/cover-crop'

/**
 * Square crop step shown after a volunteer picks a cover file.
 * Confirm yields a JPEG `File`; cancel discards the selection.
 */
export function CoverCropper({
  imageSrc,
  fileName,
  onConfirm,
  onCancel,
}: {
  imageSrc: string
  fileName: string
  onConfirm: (file: File) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const onCropComplete = useCallback((_percent: Area, pixels: Area) => {
    setArea(pixels)
  }, [])

  async function confirm() {
    if (!area || busy) return
    setBusy(true)
    setError(false)
    try {
      onConfirm(await cropCoverToFile(imageSrc, area, fileName))
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Recadrer la vignette</DialogTitle>
        <DialogDescription>
          Cadre carré, comme sur l'écran. Déplace et zoome pour choisir la zone.
        </DialogDescription>
      </DialogHeader>

      <div className="relative h-72 w-full overflow-hidden rounded-md bg-surface-sunken">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={COVER_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
          showGrid
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cover-zoom">Zoom</Label>
        <input
          id="cover-zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-destructive">
          Impossible de découper l'image. Réessaie avec un autre fichier.
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={busy}
        >
          Annuler
        </Button>
        <Button type="button" onClick={confirm} disabled={busy || !area}>
          {busy ? 'Découpe…' : 'Valider le cadrage'}
        </Button>
      </DialogFooter>
    </div>
  )
}
