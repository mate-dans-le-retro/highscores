import { getSupabase, photoUrl } from '../supabase'
import { CHARACTERS_BY_GAME_ID, anonymousName } from './anonymous-name'
import { preparePhoto } from './photo'
import { rankScores } from './ranking'
import { buildScreenLeaderboard } from './screen-leaderboard'
import type { ScoreForScreen } from './screen-leaderboard'
import type { HighscoresSource, LeaderboardQueryOptions } from './source'
import type {
  AllTimeRecord,
  ChangedTable,
  DisplayedGame,
  GameRecord,
  LeaderboardRow,
  Settings,
} from './types'

// Reads the schema of supabase/migrations: the displayed_games view, the
// settings row, and public_scores(), which never returns the name or the photo
// of a score kept off screen (it returns a keyed hash instead, turned into a
// nickname here). Realtime listens to change_signals, never to scores.

/** A row of public_scores(): approved scores of visible games, every event. */
interface PublicScoreRow {
  id: string
  game_id: string
  event_id: string
  event_name: string
  is_current_event: boolean
  station_label: string | null
  player_name: string | null
  photo_path: string | null
  anonymous: boolean
  anonymous_seed: string | null
  score: number
  created_at: string
}

/** Covers are paths in the covers bucket; full URLs pass through. */
function coverUrl(path: string | null) {
  if (!path || /^(https?:|data:|\/)/.test(path)) return path
  return getSupabase().storage.from('covers').getPublicUrl(path).data.publicUrl
}

const toGame = (row: DisplayedGame): DisplayedGame => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  short_label: row.short_label,
  console: row.console,
  score_type: row.score_type,
  score_order: row.score_order,
  score_unit: row.score_unit,
  visible: row.visible,
  position: row.position,
  cover_path: coverUrl(row.cover_path),
  station_label: row.station_label,
})

/** Builds the public row; anonymous rows get their nickname from the seed. */
function toRow(row: PublicScoreRow, game: DisplayedGame): LeaderboardRow {
  const base = {
    id: row.id,
    game_id: row.game_id,
    event_id: row.event_id,
    score: row.score,
    created_at: row.created_at,
    rank: 0,
  }
  if (!row.anonymous) {
    return {
      ...base,
      player_name: row.player_name ?? '',
      photo_path: row.photo_path,
      anonymous: false,
    }
  }
  return {
    ...base,
    // The seed already hides the name: the nickname is stable per player and
    // per game, like in the mock. The cast follows the game's slug.
    player_name: anonymousName({
      playerName: row.anonymous_seed ?? row.id,
      gameId: row.game_id,
      characters: CHARACTERS_BY_GAME_ID[`g-${game.slug}`] ?? null,
    }),
    photo_path: null,
    anonymous: true,
  }
}

async function listVisibleGames() {
  const { data, error } = await getSupabase()
    .from('displayed_games')
    .select('*')
    .order('position')
  if (error) throw error
  return (data as Array<DisplayedGame>).map(toGame)
}

async function listPublicScores(gameIds: Array<string>) {
  if (gameIds.length === 0) return []
  const { data, error } = await getSupabase()
    .rpc('public_scores')
    .in('game_id', gameIds)
  if (error) throw error
  return data as Array<PublicScoreRow>
}

const ranked = (rows: Array<LeaderboardRow>, game: DisplayedGame) =>
  rankScores(rows, game.score_order).map(({ entry, rank }) => ({
    ...entry,
    rank,
  }))

function toGameRecord(
  game: DisplayedGame,
  scores: Array<PublicScoreRow>,
): GameRecord {
  const rows = scores.map((row) => ({ source: row, row: toRow(row, game) }))
  const [current = null, runner_up = null] = ranked(
    rows.filter(({ source }) => source.is_current_event).map(({ row }) => row),
    game,
  )
  const best = ranked(
    rows.map(({ row }) => row),
    game,
  ).at(0)
  const bestSource = best && scores.find(({ id }) => id === best.id)
  const all_time: AllTimeRecord | null =
    best && bestSource
      ? {
          ...best,
          event_name: bestSource.event_name,
          station_label: bestSource.station_label,
        }
      : null
  return { game, current, runner_up, all_time }
}

const SETTINGS_COLUMNS =
  'submissions_open, screen_mode, game_duration_s, wall_duration_s, rows_shown, min_all_time_rows, show_header'

async function getSettings(): Promise<Settings> {
  const { data, error } = await getSupabase()
    .from('settings')
    .select(SETTINGS_COLUMNS)
    .single()
  if (error) throw error
  return data
}

function extensionOf(photo: Blob) {
  const fromName =
    photo instanceof File ? photo.name.split('.').pop()?.toLowerCase() : null
  if (photo.type === 'image/jpeg') return 'jpg'
  return fromName && /^[a-z0-9]{1,5}$/.test(fromName) ? fromName : 'jpg'
}

/** "@julie.retro" → "julie.retro"; anything Instagram would refuse is dropped. */
function instagramHandle(handle: string | null) {
  const clean = handle?.trim().replace(/^@/, '') ?? ''
  return /^[A-Za-z0-9._]{1,30}$/.test(clean) ? clean : null
}

export const supabaseSource: HighscoresSource = {
  listVisibleGames,

  getLeaderboard: async (gameId, options: LeaderboardQueryOptions = {}) => {
    const [games, scores, settings] = await Promise.all([
      listVisibleGames(),
      listPublicScores([gameId]),
      options.rows !== undefined && options.minAllTimeRows !== undefined
        ? null
        : getSettings(),
    ])
    const game = games.find(({ id }) => id === gameId)
    if (!game) return { rows: [], separator_at: null, empty: true }

    const currentEventId =
      scores.find((row) => row.is_current_event)?.event_id ?? 'none'
    const rows: Array<ScoreForScreen> = scores.map((row) => ({
      ...toRow(row, game),
      event_name: row.event_name,
    }))
    return buildScreenLeaderboard(rows, game.score_order, {
      rowsShown: options.rows ?? settings?.rows_shown ?? 10,
      minAllTimeRows:
        options.minAllTimeRows ?? settings?.min_all_time_rows ?? 5,
      currentEventId,
    })
  },

  listRecords: async () => {
    const games = await listVisibleGames()
    const scores = await listPublicScores(games.map(({ id }) => id))
    return games.map((game) =>
      toGameRecord(
        game,
        scores.filter((row) => row.game_id === game.id),
      ),
    )
  },

  getSettings,

  submitScore: async (input) => {
    const customGameName = input.custom_game_name?.trim() || null
    if (!input.game_id === !customGameName)
      throw new Error('Pick a game from the list or type its name, not both')

    const supabase = getSupabase()
    const { proof, thumb } = await preparePhoto(input.photo)
    const id = crypto.randomUUID()
    const photoPath = `submissions/${id}.${extensionOf(proof)}`
    const thumbPath =
      thumb === proof ? null : `submissions/${id}.thumb.${extensionOf(thumb)}`

    const upload = (path: string, file: Blob) =>
      supabase.storage.from('photos').upload(path, file, {
        // Some phones send no type at all: the bucket accepts any image.
        contentType: file.type || input.photo.type || 'image/jpeg',
      })
    const uploads = await Promise.all([
      upload(photoPath, proof),
      thumbPath ? upload(thumbPath, thumb) : null,
    ])
    for (const result of uploads) if (result?.error) throw result.error

    const { error } = await supabase.from('scores').insert({
      game_id: input.game_id,
      custom_game_name: input.game_id ? null : customGameName,
      player_name: input.player_name.trim(),
      score: input.score,
      photo_path: photoPath,
      thumb_path: thumbPath,
      display_on_screen: input.display_on_screen,
      instagram_consent: input.instagram_consent,
      instagram_handle: instagramHandle(input.instagram_handle),
      detected_game_id: input.detected_game_id,
      detected_score: input.detected_score,
    })
    if (error) throw error
  },

  photoUrl,

  subscribe: (onChange) => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('highscores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'change_signals' },
        (payload) => {
          const topic = (payload.new as { topic?: ChangedTable }).topic
          if (topic) onChange(topic)
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  },
}
