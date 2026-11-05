import { CHARACTERS_BY_SLUG } from './data/anonymous-name'
import { displayedPlayerName } from './data/anonymize'
import { rankScores } from './data/ranking'
import { isBetter } from './data/records'
import type { Game, Score } from './data/types'
import { formatScore } from './format'

// What the volunteer posts by hand on Instagram for an approved score whose
// player agreed: the visual (drawn by instagram-visual.ts), the caption and
// the account to tag. Pure functions, shared by the admin and /dev.

export const MDLR_INSTAGRAM = 'mate_dans_le_retro'

/** Marks a score posted by hand in scores.instagram_post_id. */
const MANUAL_POST_PREFIX = 'manual:'

type PostScore = Pick<
  Score,
  | 'id'
  | 'game_id'
  | 'event_id'
  | 'player_name'
  | 'score'
  | 'photo_path'
  | 'display_on_screen'
  | 'instagram_handle'
  | 'created_at'
>

type PostGame = Pick<
  Game,
  'id' | 'slug' | 'name' | 'score_type' | 'score_order' | 'score_unit'
>

type RankedScore = Pick<
  Score,
  'id' | 'game_id' | 'event_id' | 'score' | 'created_at'
>

export interface InstagramPostInput {
  score: PostScore
  game: PostGame
  eventName: string | null
  /** Approved scores, every game and event; the score itself may be among them. */
  approved: Array<RankedScore>
  /**
   * Keyed hash public_scores() returns for an anonymous score, so the post
   * shows the nickname of the screen. Without it, the nickname is seeded by
   * the score id: never by the real name.
   */
  anonymousSeed?: string | null
}

export interface InstagramPost {
  scoreId: string
  gameName: string
  scoreType: Game['score_type']
  /** "128 400", "1'32"48". */
  scoreText: string
  /** Name on the screen: the real one, or the nickname of an anonymous score. */
  playerName: string
  anonymous: boolean
  /** Proof photo; always null for an anonymous score. */
  photoPath: string | null
  /** Place in the ranking of the score's event (SQL rank()). */
  rank: number
  /** Beats every score of the other events ("RECORD ABSOLU"). */
  allTime: boolean
  eventName: string | null
  /** Player's account, without the @; null when they gave none. */
  handle: string | null
}

export function buildInstagramPost({
  score,
  game,
  eventName,
  approved,
  anonymousSeed,
}: InstagramPostInput): InstagramPost {
  const anonymous = !score.display_on_screen
  const sameGame = approved.filter(
    (entry) => entry.game_id === game.id && entry.id !== score.id,
  )
  const ranking = rankScores(
    [...sameGame.filter((entry) => entry.event_id === score.event_id), score],
    game.score_order,
  )
  const rank = ranking.find(({ entry }) => entry.id === score.id)?.rank ?? 1
  const otherEvents = sameGame.filter(
    (entry) => entry.event_id !== score.event_id,
  )
  const allTime =
    rank === 1 &&
    otherEvents.length > 0 &&
    otherEvents.every((entry) =>
      isBetter(score.score, entry.score, game.score_order),
    )

  return {
    scoreId: score.id,
    gameName: game.name,
    scoreType: game.score_type,
    scoreText: formatScore(score.score, game.score_type),
    playerName: displayedPlayerName({
      scoreId: score.id,
      playerName: anonymous ? (anonymousSeed ?? null) : score.player_name,
      displayOnScreen: !anonymous,
      gameId: game.id,
      characters: CHARACTERS_BY_SLUG[game.slug] ?? null,
    }),
    anonymous,
    photoPath: anonymous ? null : score.photo_path,
    rank,
    allTime,
    eventName,
    handle: score.instagram_handle?.trim().replace(/^@+/, '') || null,
  }
}

const ordinal = (rank: number) => (rank === 1 ? '1re' : `${rank}e`)

/** Title of the visual, in the pixel font: three words at most. */
export function instagramHeadline({ rank }: Pick<InstagramPost, 'rank'>) {
  if (rank === 1) return 'Nouveau record !'
  if (rank <= 3) return 'Sur le podium !'
  return 'Beau score !'
}

/** "128 400 points", "un temps de 1'32"48". */
function scorePhrase({ scoreText, scoreType }: InstagramPost) {
  if (scoreType === 'time') return `un temps de ${scoreText}`
  if (scoreType === 'points')
    return `${scoreText} point${scoreText === '0' || scoreText === '1' ? '' : 's'}`
  return scoreText
}

/** "SuperMarioBros" from "Super Mario Bros.", for a hashtag. */
export function gameHashtag(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/**
 * Caption ready to paste. An anonymous score keeps its nickname and is never
 * tagged in the text: the volunteer decides, with the player, whether to tag.
 */
export function instagramCaption(post: InstagramPost) {
  const who =
    post.handle && !post.anonymous
      ? `${post.playerName} (@${post.handle})`
      : post.playerName
  const where = post.eventName
    ? `à Mate dans le Rétro… Gaming (${post.eventName})`
    : 'à Mate dans le Rétro… Gaming'
  const score = scorePhrase(post)
  const game = post.gameName

  const intro = post.allTime
    ? `Record absolu sur ${game} ! ${who} a fait ${score} ${where}, personne n'avait jamais fait mieux chez nous. Tu crois pouvoir le détrôner ? La manette t'attend.`
    : post.rank === 1
      ? `Nouveau record sur ${game} ! ${who} a fait ${score} ${where}. Tu crois pouvoir faire mieux ? Viens le battre, la manette t'attend.`
      : post.rank <= 3
        ? `${who} monte sur le podium de ${game} : ${ordinal(post.rank)} place avec ${score} ${where}. Le record n'est pas loin, on dit ça, on dit rien.`
        : `${who} entre dans le classement de ${game} : ${ordinal(post.rank)} place avec ${score} ${where}. Bien joué ! Et toi, tu ferais combien ?`

  const tags = [
    'matedansleretro',
    'retrogaming',
    'highscore',
    gameHashtag(game),
    'jeuxvideo',
    'gaming',
  ]
    .filter((tag, index, all) => tag && all.indexOf(tag) === index)
    .map((tag) => `#${tag}`)

  return [intro, `@${MDLR_INSTAGRAM}`, tags.join(' ')].join('\n\n')
}

function slug(text: string) {
  return (
    text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'score'
  )
}

export function instagramFileName(
  post: Pick<InstagramPost, 'gameName' | 'playerName' | 'rank'>,
  extension: 'png' | 'jpg',
) {
  return `mdlr-${slug(post.gameName)}-${slug(post.playerName)}-${post.rank}.${extension}`
}

/** Value stored in scores.instagram_post_id once a volunteer posted by hand. */
export function manualPostId(at: Date = new Date()) {
  return `${MANUAL_POST_PREFIX}${at.toISOString()}`
}

/**
 * When a score was posted by hand; null when it is not posted, or when the id
 * comes from elsewhere (a future automatic post).
 */
export function manualPostDate(postId: string | null) {
  if (!postId?.startsWith(MANUAL_POST_PREFIX)) return null
  const date = postId.slice(MANUAL_POST_PREFIX.length)
  return Number.isNaN(Date.parse(date)) ? null : date
}
