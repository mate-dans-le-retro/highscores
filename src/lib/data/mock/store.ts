import type {
  ChangedTable,
  EventEdition,
  Game,
  GameEventSetup,
  Score,
  Settings,
} from '../types'
import {
  buildSeedScores,
  seedEvents,
  seedGameEventSetups,
  seedGames,
  seedSettings,
} from './seed'

/** Bump the version when the seed or the shape changes: the seed is reloaded. */
const STORAGE_KEY = 'mdlr-highscores:mock:v5'

const ALL_TABLES: Array<ChangedTable> = ['games', 'scores', 'settings']

export interface MockState {
  events: Array<EventEdition>
  games: Array<Game>
  game_event_setups: Array<GameEventSetup>
  scores: Array<Score>
  settings: Settings
}

/** Dated from now: a reset brings the « il y a 12 min » scores back. */
const seedState = (): MockState =>
  structuredClone({
    events: seedEvents,
    games: seedGames,
    game_event_setups: seedGameEventSetups,
    scores: buildSeedScores(),
    settings: seedSettings,
  })

export function readState(): MockState {
  if (typeof window === 'undefined') return seedState()
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return JSON.parse(saved) as MockState
  const state = seedState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return state
}

const listeners = new Set<(table: ChangedTable) => void>()

export function writeState(state: MockState, table: ChangedTable) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((listener) => listener(table))
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY)
  ALL_TABLES.forEach((table) =>
    listeners.forEach((listener) => listener(table)),
  )
}

/**
 * Same-tab writes notify the listeners directly; writes from other tabs
 * (the phone tab, the screen tab) arrive through the `storage` event.
 */
export function subscribeToStore(listener: (table: ChangedTable) => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null)
      ALL_TABLES.forEach(listener)
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** crypto.randomUUID() needs HTTPS, and the mock also runs over the LAN in HTTP. */
export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
