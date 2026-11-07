import { useNavigate } from '@tanstack/react-router'
import { Camera, ChevronRight, Images, Info } from 'lucide-react'
import { useRef, useState } from 'react'

import { DraftPhotoPreview } from '@/components/score/draft-photo-preview'
import { Button } from '@/components/ui/button'
import { PHOTO_ACCEPT, isAllowedPhotoMime, preparePhoto } from '#/lib/data/photo'
import { draftPhotos } from '#/lib/draft-photo'
import type { ScoreDraft } from '#/lib/score-draft'

type PhotoStepProps = {
  draft: ScoreDraft
  photoUrl: string | null
  onDraftChange: (draft: ScoreDraft) => void
}

export function PhotoStep({ draft, photoUrl, onDraftChange }: PhotoStepProps) {
  const navigate = useNavigate({ from: '/score' })
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'preparing' | 'converting' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.type && !isAllowedPhotoMime(file.type)) {
      setError('Format non pris en charge. Utilise JPEG, PNG, WebP ou HEIC.')
      return
    }
    setBusy('preparing')
    setError(null)
    try {
      const prepared = await preparePhoto(file, {
        onConvert: () => setBusy('converting'),
      })
      const saved = await draftPhotos.save(prepared)
      const next: ScoreDraft = {
        ...draft,
        photoId: saved.id,
        // Fresh photo clears previous detection tags.
        detectedGameId: null,
        detectedScore: null,
      }
      onDraftChange(next)
      await navigate({
        search: (prev) => ({ ...prev, step: 'details' }),
      })
    } catch {
      setError("Oups, on n'a pas pu lire cette photo. Retente avec une autre.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-h3 font-extrabold text-ink-primary">
          Un record à afficher ?
        </h1>
        <p className="text-body text-ink-secondary">
          Prends ton score en photo, si possible avec toi devant l'écran.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-subtle bg-surface-raised">
        <div className="flex aspect-[4/3] items-center justify-center bg-surface-sunken">
          {photoUrl ? (
            <DraftPhotoPreview url={photoUrl} alt="Aperçu de ta photo" />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <Camera
                className="size-10 text-ink-secondary"
                aria-hidden="true"
              />
              <p className="text-body-ui font-semibold text-ink-primary">
                Cadre l'écran de score
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-4">
          {photoUrl && !busy ? (
            <>
              <Button
                type="button"
                size="lg"
                className="h-12 w-full rounded-xl text-h5"
                onClick={() =>
                  void navigate({
                    search: (prev) => ({ ...prev, step: 'details' }),
                  })
                }
              >
                Continuer avec cette photo
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl border-line-subtle text-body-ui"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="size-5" aria-hidden="true" />
                  Reprendre
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl border-line-subtle text-body-ui"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <Images className="size-5" aria-hidden="true" />
                  Galerie
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="lg"
                className="h-12 w-full rounded-xl text-h5"
                disabled={busy !== null}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="size-5" aria-hidden="true" />
                {busy === 'converting'
                  ? 'Conversion de la photo…'
                  : busy
                    ? 'Préparation…'
                    : 'Prendre la photo'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-line-subtle text-h5"
                disabled={busy !== null}
                onClick={() => galleryInputRef.current?.click()}
              >
                <Images className="size-5" aria-hidden="true" />
                Choisir dans la galerie
              </Button>
            </>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-line-subtle bg-surface-raised px-4 py-3">
        <Info
          className="mt-0.5 size-5 shrink-0 text-ink-secondary"
          aria-hidden="true"
        />
        <p className="text-body-sm text-ink-secondary">
          Ta photo n'apparaît sur l'écran que si tu l'acceptes à la dernière
          étape, et une fois validée par l'équipe.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-ink-accent">
          {error}
        </p>
      )}
    </div>
  )
}
