import { toPublicRow } from '../anonymize'
import { keepSubscribed } from '../realtime-connection'
import { buildScreenLeaderboard } from '../screen-leaderboard'
import type { HighscoresSource } from '../source'
import type {
  DisplayedGame,
  Game,
  LeaderboardRow,
  Score,
  ScoreStatus,
  Settings,
} from '../types'
import { rankScores } from '../ranking'
import {
  cachedMockPhotoUrl,
  clearMockPhotos,
  hydrateMockPhoto,
  isMockPhotoPath,
  mockPhotoPath,
  saveMockPhoto,
} from './photo-store'
import {
  newId,
  readState,
  resetState,
  subscribeToStore,
  writeState,
} from './store'
import type { MockState } from './store'

function currentEventId(state: MockState) {
  const event = state.events.find((candidate) => !candidate.archived_at)
  if (!event) throw new Error('No current event in the mock data')
  return event.id
}

const stationLabel = (state: MockState, gameId: string, eventId: string) =>
  state.game_event_setups.find(
    (setup) => setup.game_id === gameId && setup.event_id === eventId,
  )?.station_label ?? null

const eventName = (state: MockState, eventId: string) =>
  state.events.find(({ id }) => id === eventId)?.name ?? null

const visibleGames = (state: MockState): Array<DisplayedGame> =>
  state.games
    .filter((game) => game.visible)
    .sort((a, b) => a.position - b.position)
    .map((game) => ({
      ...game,
      station_label: stationLabel(state, game.id, currentEventId(state)),
    }))

const toRow = (score: Score, gameId: string, rank: number) =>
  toPublicRow(
    {
      id: score.id,
      game_id: gameId,
      event_id: score.event_id,
      player_name: score.player_name,
      score: score.score,
      photo_path: score.photo_path,
      created_at: score.created_at,
      rank,
    },
    score.display_on_screen,
  )

/** Approved scores of a game, ranked. All events when eventId is omitted. */
function rankedRows(
  state: MockState,
  game: Game,
  eventId?: string,
): Array<LeaderboardRow> {
  const scores = state.scores.filter(
    (score) =>
      score.game_id === game.id &&
      score.status === 'approved' &&
      (!eventId || score.event_id === eventId),
  )
  return rankScores(scores, game.score_order).map(({ entry, rank }) =>
    toRow(entry, game.id, rank),
  )
}

async function hydrateScorePhotos(state: MockState) {
  await Promise.all(
    state.scores.map(async (score) => {
      if (isMockPhotoPath(score.photo_path))
        await hydrateMockPhoto(score.photo_path)
    }),
  )
}

export const mockSource: HighscoresSource = {
  listVisibleGames: async () => visibleGames(readState()),

  getLeaderboard: async (gameId, options = {}) => {
    const state = readState()
    await hydrateScorePhotos(state)
    const game = visibleGames(state).find(({ id }) => id === gameId)
    if (!game) {
      return { rows: [], separator_at: null, empty: true }
    }
    const rows = rankedRows(state, game).map((row) => ({
      ...row,
      event_name: eventName(state, row.event_id),
    }))
    return buildScreenLeaderboard(rows, game.score_order, {
      rowsShown: options.rows ?? state.settings.rows_shown,
      minAllTimeRows:
        options.minAllTimeRows ?? state.settings.min_all_time_rows,
      currentEventId: currentEventId(state),
    })
  },

  listRecords: async () => {
    const state = readState()
    await hydrateScorePhotos(state)
    const eventId = currentEventId(state)
    return visibleGames(state).map((game) => {
      const [current = null, runner_up = null] = rankedRows(
        state,
        game,
        eventId,
      )
      const best = rankedRows(state, game).at(0)
      const all_time = best && {
        ...best,
        event_name: eventName(state, best.event_id),
        station_label: stationLabel(state, game.id, best.event_id),
      }
      return { game, current, runner_up, all_time: all_time ?? null }
    })
  },

  getSettings: async () => readState().settings,

  submitScore: async (input) => {
    const customGameName = input.custom_game_name?.trim() || null
    if (!input.game_id === !customGameName)
      throw new Error('Pick a game from the list or type its name, not both')

    const photoId = newId()
    let photoPath: string | null = mockPhotoPath(photoId)
    try {
      await saveMockPhoto(photoId, input.photo.proof, input.photo.thumb)
    } catch (error) {
      console.warn('Mock photo store unavailable, photo dropped', error)
      photoPath = null
    }

    const state = readState()
    if (!state.settings.submissions_open)
      throw new Error('Submissions are closed')
    if (
      input.game_id &&
      !visibleGames(state).some(({ id }) => id === input.game_id)
    )
      throw new Error('This game is not on display')

    const submission: Score = {
      id: newId(),
      event_id: currentEventId(state),
      game_id: input.game_id,
      custom_game_name: customGameName,
      player_name: input.player_name.trim(),
      score: input.score,
      photo_path: photoPath,
      display_on_screen: input.display_on_screen,
      instagram_consent: input.instagram_consent,
      instagram_handle: input.instagram_handle,
      detected_game_id: input.detected_game_id,
      detected_score: input.detected_score,
      status: 'pending',
      source: 'player',
      created_at: new Date().toISOString(),
      reviewed_at: null,
    }
    state.scores.push(submission)
    writeState(state, 'scores')
  },

  photoUrl: (path) => cachedMockPhotoUrl(path, 'thumb') ?? path,

  // No socket to lose here: the attempt joins at once, and the browser's
  // offline/online events drive the same reconnection path as Supabase.
  subscribe: (onChange, onStatus) =>
    keepSubscribed({
      onStatus: (status) => onStatus?.(status),
      open: (report) => {
        const joined = setTimeout(() => report('joined'), 0)
        const unsubscribe = subscribeToStore(onChange)
        return () => {
          clearTimeout(joined)
          unsubscribe()
        }
      },
    }),
}

function review(id: string, status: ScoreStatus) {
  const state = readState()
  const score = state.scores.find((candidate) => candidate.id === id)
  if (!score) throw new Error(`No score with id ${id}`)
  if (status === 'approved' && !score.game_id)
    throw new Error('Link this score to a game before approving it')
  score.status = status
  score.reviewed_at = new Date().toISOString()
  writeState(state, 'scores')
}

function requireScore(id: string) {
  const state = readState()
  const score = state.scores.find((candidate) => candidate.id === id)
  if (!score) throw new Error(`No score with id ${id}`)
  return { state, score }
}

function slugify(name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'autre-jeu'
}

function shortLabelFromName(name: string) {
  const letters = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
  return (letters.slice(0, 3) || '???').padEnd(3, 'X')
}

export type MockPendingScore = {
  id: string
  game_id: string | null
  game_name: string | null
  custom_game_name: string | null
  player_name: string
  score: number
  score_type: Game['score_type']
  photo_path: string | null
  display_on_screen: boolean
  instagram_consent: boolean
  instagram_handle: string | null
  created_at: string
}

/** Testing helpers until the admin exists, exposed as `window.mdlrMock` in mock mode. */
export const mockTools = {
  /** Compact list for the browser console. Prefer `listPending()` in the /dev UI. */
  pending: () =>
    mockTools.listPending().map((entry) => ({
      id: entry.id,
      game: entry.game_id
        ? (entry.game_name ?? entry.game_id)
        : `${entry.custom_game_name} (autre jeu)`,
      player_name: entry.player_name,
      score: entry.score,
    })),
  listPending: (): Array<MockPendingScore> => {
    const state = readState()
    return state.scores
      .filter((score) => score.status === 'pending')
      .map((score) => {
        const game = score.game_id
          ? state.games.find(({ id }) => id === score.game_id)
          : undefined
        return {
          id: score.id,
          game_id: score.game_id,
          game_name: game?.name ?? null,
          custom_game_name: score.custom_game_name,
          player_name: score.player_name,
          score: score.score,
          score_type: game?.score_type ?? 'points',
          photo_path: score.photo_path,
          display_on_screen: score.display_on_screen,
          instagram_consent: score.instagram_consent,
          instagram_handle: score.instagram_handle,
          created_at: score.created_at,
        }
      })
  },
  listGames: () =>
    readState()
      .games.slice()
      .sort((a, b) => a.position - b.position)
      .map(({ id, name, visible, score_type }) => ({
        id,
        name,
        visible,
        score_type,
      })),
  approve: (id: string) => review(id, 'approved'),
  reject: (id: string) => review(id, 'rejected'),
  /** Attaches a free "Un autre jeu" submission to an existing game, then approves it. */
  attachAndApprove: (id: string, gameId: string) => {
    const { state, score } = requireScore(id)
    if (!state.games.some(({ id: candidate }) => candidate === gameId))
      throw new Error(`No game with id ${gameId}`)
    score.game_id = gameId
    score.custom_game_name = null
    score.status = 'approved'
    score.reviewed_at = new Date().toISOString()
    writeState(state, 'scores')
  },
  /** Creates a visible game from the typed name, then approves the submission. */
  createGameAndApprove: (id: string) => {
    const { state, score } = requireScore(id)
    const name = score.custom_game_name?.trim()
    if (!name) throw new Error('This submission has no free game name')
    const slug = slugify(name)
    const gameId = `g-${slug}-${newId().slice(0, 6)}`
    const maxPosition = state.games.reduce(
      (max, game) => Math.max(max, game.position),
      0,
    )
    state.games.push({
      id: gameId,
      slug: `${slug}-${newId().slice(0, 4)}`,
      name,
      short_label: shortLabelFromName(name),
      console: null,
      score_type: 'points',
      score_order: 'desc',
      score_unit: 'pts',
      visible: true,
      position: maxPosition + 1,
      cover_path: null,
    })
    score.game_id = gameId
    score.custom_game_name = null
    score.status = 'approved'
    score.reviewed_at = new Date().toISOString()
    writeState(state, 'games')
    writeState(state, 'scores')
  },
  /** Sets the station label of a game for one event (the current one by default). */
  setStationLabel: (gameId: string, label: string | null, eventId?: string) => {
    const state = readState()
    const event_id = eventId ?? currentEventId(state)
    const station_label = label?.trim() || null
    const setup = state.game_event_setups.find(
      (candidate) =>
        candidate.game_id === gameId && candidate.event_id === event_id,
    )
    if (setup) setup.station_label = station_label
    else
      state.game_event_setups.push({ event_id, game_id: gameId, station_label })
    writeState(state, 'games')
  },
  setSettings: (settings: Partial<Settings>) => {
    const state = readState()
    state.settings = { ...state.settings, ...settings }
    writeState(state, 'settings')
  },
  reset: () => {
    void clearMockPhotos()
    resetState()
  },
}
