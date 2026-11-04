import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { visibleGamesQuery } from '#/lib/highscores'
import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/score')({
  staticData: { theme: 'arcade' },
  component: SubmitScore,
})

interface Submission {
  gameId: string
  playerName: string
  score: number
  photo: File
  instagramConsent: boolean
}

async function submitScore(submission: Submission) {
  const extension =
    submission.photo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const photoPath = `submissions/${crypto.randomUUID()}.${extension}`

  const upload = await supabase.storage
    .from('photos')
    .upload(photoPath, submission.photo, { contentType: submission.photo.type })
  if (upload.error) throw upload.error

  const { error } = await supabase.from('scores').insert({
    game_id: submission.gameId,
    player_name: submission.playerName.trim(),
    score: submission.score,
    photo_path: photoPath,
    instagram_consent: submission.instagramConsent,
  })
  if (error) throw error
}

const fieldClass = 'h-12 text-arcade-name'

function SubmitScore() {
  const games = useQuery(visibleGamesQuery)
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [score, setScore] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [instagramConsent, setInstagramConsent] = useState(false)

  const mutation = useMutation({ mutationFn: submitScore })

  if (mutation.isSuccess) {
    return (
      <main className="mx-auto flex max-w-prose flex-col gap-6 px-4 py-12">
        <h1 className="font-display text-arcade-title">Bien reçu !</h1>
        <p className="text-body">
          Un bénévole MDLR vérifie ta photo, puis ton score s'affiche sur
          l'écran. Bien joué !
        </p>
        <Button
          size="lg"
          onClick={() => {
            mutation.reset()
            setScore('')
            setPhoto(null)
          }}
        >
          Envoyer un autre score
        </Button>
      </main>
    )
  }

  const canSubmit = gameId && playerName.trim() && score !== '' && photo

  return (
    <main className="mx-auto flex max-w-prose flex-col gap-8 px-4 py-12">
      <h1 className="font-display text-arcade-title">Envoyer mon score</h1>
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (!canSubmit) return
          mutation.mutate({
            gameId,
            playerName,
            score: Number(score),
            photo,
            instagramConsent,
          })
        }}
      >
        <div className="flex flex-col gap-2 *:data-[slot=native-select-wrapper]:w-full">
          <Label htmlFor="game" className="text-arcade-label uppercase">
            Le jeu
          </Label>
          <NativeSelect
            id="game"
            className={fieldClass}
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            required
          >
            <NativeSelectOption value="">Choisis ton jeu</NativeSelectOption>
            {games.data?.map((game) => (
              <NativeSelectOption key={game.id} value={game.id}>
                {game.name}
                {game.machine ? ` (${game.machine})` : ''}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="player" className="text-arcade-label uppercase">
            Ton pseudo
          </Label>
          <Input
            id="player"
            className={fieldClass}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={40}
            autoComplete="nickname"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="score" className="text-arcade-label uppercase">
            Ton score
          </Label>
          <Input
            id="score"
            className={`${fieldClass} font-mono`}
            value={score}
            onChange={(event) =>
              setScore(event.target.value.replace(/\D/g, ''))
            }
            inputMode="numeric"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="photo" className="text-arcade-label uppercase">
            Photo devant l'écran
          </Label>
          <Input
            id="photo"
            className={fieldClass}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            required
          />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="instagram"
            className="mt-0.5 size-5"
            checked={instagramConsent}
            onCheckedChange={(checked) => setInstagramConsent(checked === true)}
          />
          <Label htmlFor="instagram" className="text-body-sm font-normal">
            J'accepte que MDLR publie ma photo et mon score sur Instagram.
          </Label>
        </div>

        {mutation.isError && (
          <p role="alert" className="text-body-sm text-ink-accent">
            Oups, l'envoi a planté. Vérifie ta connexion et retente ta chance.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-h5"
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </form>
    </main>
  )
}
