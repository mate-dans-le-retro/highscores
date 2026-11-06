import { ImageUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InstagramPanel } from '#/components/admin/instagram-panel'
import { Label } from '#/components/ui/label'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { buildInstagramPost } from '#/lib/instagram-post'
import type { InstagramPostInput } from '#/lib/instagram-post'
import type { Game } from '#/lib/data/types'

// Preview of the Instagram post for /dev: fixed scenarios, no Supabase, no
// store. The panel is the one of the admin.

const CURRENT = 'event-current'
const PAST = 'event-past'

const game = (
  slug: string,
  name: string,
  score_type: Game['score_type'] = 'points',
): InstagramPostInput['game'] => ({
  id: `g-${slug}`,
  slug,
  name,
  score_type,
  score_order: score_type === 'time' ? 'asc' : 'desc',
  score_unit: score_type === 'points' ? 'pts' : null,
})

const at = (minutesAgo: number) =>
  new Date(Date.UTC(2026, 10, 7, 15, 0) - minutesAgo * 60_000).toISOString()

const scoreRow = (
  id: string,
  gameId: string,
  score: number,
  eventId = CURRENT,
) => ({ id, game_id: gameId, event_id: eventId, score, created_at: at(90) })

type Scenario = {
  label: string
  input: Omit<InstagramPostInput, 'eventName'>
  withPhoto: boolean
}

const tetris = game('tetris', 'Tetris')
const duckHunt = game('duck-hunt', 'Duck Hunt')
const marioKart = game('mario-kart', 'Mario Kart', 'time')
const turtles = game('tmnt', 'Teenage Mutant Ninja Turtles')

const player = (
  id: string,
  postGame: InstagramPostInput['game'],
  score: number,
  extra: Partial<InstagramPostInput['score']> = {},
): InstagramPostInput['score'] => ({
  id,
  game_id: postGame.id,
  event_id: CURRENT,
  player_name: 'Julie',
  score,
  photo_path: 'demo',
  display_on_screen: true,
  instagram_handle: 'julie.retro',
  created_at: at(5),
  ...extra,
})

const SCENARIOS = {
  record: {
    label: 'Record de l’évènement, avec photo',
    withPhoto: true,
    input: {
      game: tetris,
      score: player('s-record', tetris, 128_400),
      approved: [
        scoreRow('a1', tetris.id, 98_200),
        scoreRow('a2', tetris.id, 152_300, PAST),
      ],
    },
  },
  allTime: {
    label: 'Record absolu, sans compte Instagram',
    withPhoto: true,
    input: {
      game: tetris,
      score: player('s-all-time', tetris, 161_900, {
        player_name: 'Marc',
        instagram_handle: null,
      }),
      approved: [
        scoreRow('a1', tetris.id, 98_200),
        scoreRow('a2', tetris.id, 152_300, PAST),
      ],
    },
  },
  anonymous: {
    label: 'Score masqué à l’écran (anonyme)',
    withPhoto: true,
    input: {
      game: duckHunt,
      score: player('s-anonymous', duckHunt, 24_500, {
        player_name: 'Camille Dupont',
        display_on_screen: false,
        instagram_handle: 'camille.dpt',
      }),
      approved: [scoreRow('a3', duckHunt.id, 31_000)],
    },
  },
  podium: {
    label: '2e place',
    withPhoto: true,
    input: {
      game: duckHunt,
      score: player('s-podium', duckHunt, 24_500, {
        player_name: 'Inès',
        instagram_handle: 'ines_8bit',
      }),
      approved: [
        scoreRow('a3', duckHunt.id, 31_000),
        scoreRow('a4', duckHunt.id, 12_000),
      ],
    },
  },
  time: {
    label: 'Temps, record absolu',
    withPhoto: true,
    input: {
      game: marioKart,
      score: player('s-time', marioKart, 92_480, { player_name: 'Yanis' }),
      approved: [
        scoreRow('a5', marioKart.id, 95_120),
        scoreRow('a6', marioKart.id, 93_900, PAST),
      ],
    },
  },
  noPhoto: {
    label: '5e place, sans photo',
    withPhoto: false,
    input: {
      game: tetris,
      score: player('s-no-photo', tetris, 52_100, {
        player_name: 'Thomas',
        photo_path: null,
      }),
      approved: [150_000, 120_000, 90_000, 60_000].map((value, index) =>
        scoreRow(`b${index}`, tetris.id, value),
      ),
    },
  },
  long: {
    label: 'Nom, jeu et score très longs',
    withPhoto: true,
    input: {
      game: turtles,
      score: player('s-long', turtles, 12_345_678, {
        player_name: 'Maximilien-Alexandre',
        instagram_handle: 'maximilien.alexandre.de.la.tour',
      }),
      approved: [],
    },
  },
} satisfies Record<string, Scenario>

type ScenarioId = keyof typeof SCENARIOS

/** A fake proof photo: a player in front of a CRT, drawn as an SVG. */
const DEMO_PHOTO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
<defs><radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#5b4a7a"/><stop offset="1" stop-color="#140a22"/></radialGradient>
<radialGradient id="s" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#3fa7d6"/><stop offset="1" stop-color="#123a5c"/></radialGradient></defs>
<rect width="1200" height="1600" fill="url(#g)"/>
<rect x="170" y="210" width="860" height="700" rx="70" fill="#2b2b33"/>
<rect x="230" y="270" width="740" height="560" rx="40" fill="url(#s)"/>
<g fill="#f2d24b"><rect x="300" y="620" width="60" height="60"/><rect x="360" y="620" width="60" height="60"/><rect x="420" y="620" width="60" height="60"/><rect x="360" y="560" width="60" height="60"/></g>
<g fill="#e5579a"><rect x="560" y="680" width="60" height="60"/><rect x="620" y="680" width="60" height="60"/><rect x="620" y="620" width="60" height="60"/><rect x="680" y="620" width="60" height="60"/></g>
<text x="600" y="400" font-family="monospace" font-weight="700" font-size="64" fill="#ffffff" text-anchor="middle">SCORE</text>
<text x="600" y="490" font-family="monospace" font-weight="700" font-size="88" fill="#ffffff" text-anchor="middle">128400</text>
<rect x="520" y="910" width="160" height="120" fill="#1f1f26"/>
<ellipse cx="600" cy="1080" rx="150" ry="170" fill="#f0c3a0"/>
<path d="M440 1010 Q600 860 760 1010 L760 1060 Q600 980 440 1060 Z" fill="#3a2414"/>
<path d="M240 1600 Q260 1260 600 1240 Q940 1260 960 1600 Z" fill="#e5579a"/>
<rect x="470" y="1330" width="260" height="90" rx="40" fill="#2b2b33"/>
</svg>`)}`

export function InstagramPreview() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('record')
  const [upload, setUpload] = useState<string | null>(null)
  const [posted, setPosted] = useState<Record<string, string | null>>({})
  const scenario = SCENARIOS[scenarioId]
  const post = buildInstagramPost({
    ...scenario.input,
    eventName: 'Novembre 2026',
  })
  const postId = posted[post.scoreId] ?? null

  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload)
    },
    [upload],
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">Visuel Instagram</h2>
        <p className="text-body-ui text-ink-secondary">
          Ce que voit un admin sous « À publier » dans l&apos;admin, avec des
          scores de démo. Rien n&apos;est enregistré.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="instagram-scenario">Exemple</Label>
          <NativeSelect
            id="instagram-scenario"
            value={scenarioId}
            onChange={(event) =>
              setScenarioId(event.target.value as ScenarioId)
            }
          >
            {Object.entries(SCENARIOS).map(([id, { label }]) => (
              <NativeSelectOption key={id} value={id}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input px-3 text-sm font-medium hover:bg-accent">
          <ImageUp className="size-4" aria-hidden="true" />
          Essayer avec ta photo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setUpload(URL.createObjectURL(file))
            }}
          />
        </label>
      </div>
      <div className="rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
        <InstagramPanel
          post={post}
          photoUrl={scenario.withPhoto ? (upload ?? DEMO_PHOTO) : null}
          status={postId ? { posted: true, at: postId } : { posted: false }}
          onPostedChange={(value) =>
            setPosted((current) => ({
              ...current,
              [post.scoreId]: value ? new Date().toISOString() : null,
            }))
          }
        />
      </div>
    </section>
  )
}
