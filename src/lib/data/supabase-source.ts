import { getSupabase, photoUrl } from '../supabase'
import { DEFAULT_SETTINGS } from './source'
import type { HighscoresSource } from './source'
import type { DisplayedGame, Game, LeaderboardRow } from './types'

// The current schema covers a single event, without score types, station
// labels, masking or settings: the new fields get defaults until the migration
// lands.

type GameRow = Omit<Game, 'short_label' | 'score_type' | 'console'> & {
  machine: string | null
}
type LeaderboardViewRow = Omit<LeaderboardRow, 'event_id' | 'masked'>

const CURRENT_EVENT_ID = 'current'

function initials(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  const label =
    words.length > 1 ? words.map((word) => word.charAt(0)).join('') : name
  return label.slice(0, 3).toUpperCase()
}

const toGame = ({ machine, ...row }: GameRow): DisplayedGame => ({
  ...row,
  console: machine,
  short_label: initials(row.name),
  score_type: 'points',
  station_label: null,
})

const toRow = (row: LeaderboardViewRow): LeaderboardRow => ({
  ...row,
  event_id: CURRENT_EVENT_ID,
  masked: false,
})

async function listVisibleGames() {
  const { data, error } = await getSupabase()
    .from('games')
    .select('*')
    .eq('visible', true)
    .order('position')
  if (error) throw error
  return (data as Array<GameRow>).map(toGame)
}

export const supabaseSource: HighscoresSource = {
  listVisibleGames,

  getLeaderboard: async (gameId, limit) => {
    const { data, error } = await getSupabase()
      .from('leaderboard')
      .select('*')
      .eq('game_id', gameId)
      .order('rank')
      .limit(limit)
    if (error) throw error
    return (data as Array<LeaderboardViewRow>).map(toRow)
  },

  listRecords: async () => {
    const games = await listVisibleGames()
    const { data, error } = await getSupabase()
      .from('leaderboard')
      .select('*')
      .in(
        'game_id',
        games.map(({ id }) => id),
      )
      .lte('rank', 2)
      .order('rank')
      .order('created_at')
    if (error) throw error
    const rows = (data as Array<LeaderboardViewRow>).map(toRow)
    return games.map((game) => {
      const [current = null, runner_up = null] = rows.filter(
        (row) => row.game_id === game.id,
      )
      return {
        game,
        current,
        runner_up,
        all_time: current && {
          ...current,
          event_name: null,
          station_label: null,
        },
      }
    })
  },

  getSettings: async () => DEFAULT_SETTINGS,

  submitScore: async (input) => {
    if (!input.game_id)
      throw new Error('Custom games need a schema migration first')
    const supabase = getSupabase()
    const extension =
      (input.photo instanceof File &&
        input.photo.name.split('.').pop()?.toLowerCase()) ||
      'jpg'
    const photoPath = `submissions/${crypto.randomUUID()}.${extension}`

    const upload = await supabase.storage
      .from('photos')
      .upload(photoPath, input.photo, { contentType: input.photo.type })
    if (upload.error) throw upload.error

    const { error } = await supabase.from('scores').insert({
      game_id: input.game_id,
      player_name: input.player_name.trim(),
      score: input.score,
      photo_path: photoPath,
      instagram_consent: input.instagram_consent,
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
        { event: '*', schema: 'public', table: 'scores' },
        () => onChange('scores'),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => onChange('games'),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  },
}
