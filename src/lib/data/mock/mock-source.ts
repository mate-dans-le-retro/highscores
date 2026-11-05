import { toPublicRow } from '../anonymize'
import { preparePhoto } from '../photo'
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

    const prepared = await preparePhoto(input.photo)
    const photoId = newId()
    let photoPath: string | null = mockPhotoPath(photoId)
    try {
      await saveMockPhoto(photoId, prepared.proof, prepared.thumb)
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

  subscribe: subscribeToStore,
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

/** Testing helpers until the admin exists, exposed as `window.mdlrMock` in mock mode. */
export const mockTools = {
  pending: () =>
    readState()
      .scores.filter((score) => score.status === 'pending')
      .map(({ id, game_id, custom_game_name, player_name, score }) => ({
        id,
        game: game_id ?? `${custom_game_name} (autre jeu)`,
        player_name,
        score,
      })),
  approve: (id: string) => review(id, 'approved'),
  reject: (id: string) => review(id, 'rejected'),
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
