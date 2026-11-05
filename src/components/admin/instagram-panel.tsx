import {
  AtSign,
  Check,
  Copy,
  Download,
  ImageOff,
  RotateCcw,
  Share2,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { copyText } from '#/lib/copy-text'
import { formatScoreWhen } from '#/lib/format'
import {
  MDLR_INSTAGRAM,
  instagramCaption,
  instagramFileName,
} from '#/lib/instagram-post'
import type { InstagramPost } from '#/lib/instagram-post'
import {
  VISUAL_HEIGHT,
  VISUAL_WIDTH,
  canvasToBlob,
  drawInstagramVisual,
  loadVisualAssets,
} from '#/lib/instagram-visual'
import type { PhotoState } from '#/lib/instagram-visual'

type Posted =
  | { posted: false }
  /** `at` is null when the date is unknown (a post not made from here). */
  | { posted: true; at: string | null }

export function InstagramPanel({
  post,
  photoUrl,
  status,
  onPostedChange,
  saving = false,
  saveFailed = false,
}: {
  post: InstagramPost
  /** Full URL of the proof photo; ignored for an anonymous score. */
  photoUrl: string | null
  status: Posted
  onPostedChange: (posted: boolean) => void
  saving?: boolean
  saveFailed?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawn, setDrawn] = useState(false)
  const [photoState, setPhotoState] = useState<PhotoState>('none')
  const [attempt, setAttempt] = useState(0)
  const [canShare, setCanShare] = useState(false)
  const [busy, setBusy] = useState<'png' | 'jpg' | 'share' | null>(null)

  const generated = instagramCaption(post)
  const [caption, setCaption] = useState(generated)
  useEffect(() => setCaption(generated), [generated])

  const source = post.anonymous ? null : photoUrl
  const postKey = JSON.stringify(post)

  useEffect(() => {
    setCanShare(
      window.isSecureContext && typeof navigator.canShare === 'function',
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    let release: (() => void) | null = null
    setDrawn(false)
    void loadVisualAssets(source).then((assets) => {
      release = assets.release
      if (cancelled || !canvasRef.current) {
        assets.release()
        return
      }
      drawInstagramVisual(canvasRef.current, post, assets)
      setPhotoState(assets.photoState)
      setDrawn(true)
    })
    return () => {
      cancelled = true
      release?.()
    }
    // postKey stands for post, which is rebuilt on every render.
  }, [postKey, source, attempt])

  const exportFile = async (extension: 'png' | 'jpg') => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const type = extension === 'png' ? 'image/png' : 'image/jpeg'
    const blob = await canvasToBlob(canvas, type)
    return new File([blob], instagramFileName(post, extension), { type })
  }

  const download = async (extension: 'png' | 'jpg') => {
    setBusy(extension)
    try {
      const file = await exportFile(extension)
      if (!file) return
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } finally {
      setBusy(null)
    }
  }

  const share = async () => {
    setBusy('share')
    try {
      const file = await exportFile('jpg')
      if (!file) return
      if (navigator.canShare({ files: [file] }))
        await navigator.share({ files: [file] }).catch(() => undefined)
      else await download('jpg')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      aria-labelledby={`instagram-${post.scoreId}`}
      className="flex flex-col gap-5"
    >
      <header className="flex flex-wrap items-center gap-3">
        <h3 id={`instagram-${post.scoreId}`} className="text-h5">
          Instagram
        </h3>
        {status.posted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-state-live-surface px-2.5 py-0.5 text-caption font-semibold text-state-live-ink">
            <Check className="size-3" aria-hidden="true" />
            Publié{status.at ? ` ${postedWhen(status.at)}` : ''}
          </span>
        ) : (
          <span className="rounded-full bg-state-soon-surface px-2.5 py-0.5 text-caption font-semibold text-state-soon-ink">
            À publier
          </span>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-lg bg-surface-sunken shadow-card">
            <canvas
              ref={canvasRef}
              width={VISUAL_WIDTH}
              height={VISUAL_HEIGHT}
              role="img"
              aria-label={`Visuel Instagram : ${post.playerName}, ${post.gameName}, ${post.scoreText}`}
              className="block aspect-[4/5] h-auto w-full"
            />
            {!drawn && (
              <p className="absolute inset-0 grid place-items-center text-body-sm text-ink-secondary">
                Préparation du visuel…
              </p>
            )}
          </div>
          {photoState === 'failed' && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-md bg-state-soon-surface p-3 text-body-sm text-state-soon-ink"
            >
              <p className="flex items-start gap-2">
                <ImageOff
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                La photo ne s'est pas chargée : le visuel est fait sans elle.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setAttempt((count) => count + 1)}
              >
                <RotateCcw />
                Réessayer
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!drawn || busy !== null}
              onClick={() => void download('png')}
            >
              <Download />
              Télécharger l'image
            </Button>
            <Button
              variant="outline"
              disabled={!drawn || busy !== null}
              onClick={() => void download('jpg')}
              title="Même image, en JPEG : plus léger"
            >
              JPEG
            </Button>
            {canShare && (
              <Button
                variant="outline"
                disabled={!drawn || busy !== null}
                onClick={() => void share()}
              >
                <Share2 />
                Partager
              </Button>
            )}
          </div>
          <p className="text-caption text-ink-secondary">
            PNG 1080 × 1350, le format portrait d'Instagram.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <ol className="list-inside list-decimal text-body-sm text-ink-secondary">
            <li>Télécharge l'image (ou partage-la depuis ton téléphone).</li>
            <li>
              Dans Instagram, connecté à @{MDLR_INSTAGRAM}, colle la légende.
            </li>
            <li>Tague le joueur sur la photo, s'il a donné son compte.</li>
            <li>Reviens ici et marque le score comme publié.</li>
          </ol>

          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor={`caption-${post.scoreId}`}>Légende</Label>
              <div className="flex gap-1">
                {caption !== generated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCaption(generated)}
                  >
                    <Undo2 />
                    Rétablir
                  </Button>
                )}
                <CopyButton text={caption} label="Copier la légende" />
              </div>
            </div>
            <Textarea
              id={`caption-${post.scoreId}`}
              value={caption}
              rows={9}
              onChange={(event) => setCaption(event.target.value)}
              className="text-body-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Compte du joueur à taguer</p>
            {post.handle ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-sunken px-3 py-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-body-sm font-semibold">
                  <AtSign className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{post.handle}</span>
                </span>
                <CopyButton text={`@${post.handle}`} label="Copier" />
              </div>
            ) : (
              <p className="rounded-md bg-surface-sunken px-3 py-2 text-body-sm">
                Pas de compte Instagram renseigné : publie sans taguer.
              </p>
            )}
            {post.anonymous && (
              <p className="text-caption text-ink-secondary">
                Score masqué à l'écran : le visuel et la légende gardent son
                pseudo, jamais son vrai nom.
                {post.handle
                  ? ' Le taguer dévoilerait qui c’est : fais-le seulement si le joueur te le demande.'
                  : ''}
              </p>
            )}
          </div>

          {saveFailed && (
            <p role="alert" className="text-body-sm text-destructive">
              Ça n'est pas passé. Réessaie dans un instant.
            </p>
          )}

          <div className="mt-auto flex flex-wrap justify-end gap-2">
            {status.posted ? (
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => onPostedChange(false)}
              >
                <Undo2 />
                Remettre à publier
              </Button>
            ) : (
              <Button disabled={saving} onClick={() => onPostedChange(true)}>
                <Check />
                Marquer comme publié
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** "à l'instant", "il y a 3 min", "à 14h32", "le 7 nov. à 14h32". */
function postedWhen(at: string) {
  const when = formatScoreWhen(at)
  if (!/^\d/.test(when)) return when
  return when.includes(' à ') ? `le ${when}` : `à ${when}`
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState<boolean | null>(null)
  useEffect(() => {
    if (copied === null) return
    const timer = setTimeout(() => setCopied(null), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void copyText(text).then(setCopied)}
    >
      {copied ? <Check /> : <Copy />}
      {copied === null ? label : copied ? 'Copié !' : 'Copie ratée'}
    </Button>
  )
}
