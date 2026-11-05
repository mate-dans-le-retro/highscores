import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { randomUuid } from './random-uuid'
import { getSupabase } from './supabase'
import { isOriginalPhoto, photoFileType, preparePhoto } from './data/photo'
import { isBetter } from './data/records'
import { rankScores } from './data/ranking'
import type {
  EventEdition,
  Game,
  Score,
  ScoreType,
  ScreenMode,
  Settings,
} from './data/types'

// Data access of the volunteer admin. It talks to Supabase directly with the
// volunteer's session: RLS (public.is_admin()) is what grants the rights. The
// mock data source has no admin: the /dev panel covers it.

export interface AdminGame extends Game {
  /** Station label for the current event ("Étage"), null when unset. */
  station_label: string | null
}

export interface AdminScore extends Score {
  thumb_path: string | null
  rejection_reason: string | null
  /** Set once posted on Instagram; see manualPostId() for a post made by hand. */
  instagram_post_id: string | null
  reviewed_by: string | null
}

export type AdminSettings = Settings & {
  instagram_enabled: boolean
  instagram_mode: 'on_approval' | 'ask' | 'off'
  instagram_caption: string
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

/** Approved submissions whose player agreed to a post, not posted yet. */
export type SubmissionFilter = SubmissionStatus | 'to_post'

/** The queue refreshes on its own: the public cannot listen to scores. */
const QUEUE_REFRESH_MS = 10_000

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type AdminAuth =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'not-admin'; session: Session }
  | { status: 'admin'; session: Session }

/** Volunteer session, and whether the account is in public.admins. */
export function useAdminAuth(): AdminAuth {
  const [session, setSession] = useState<Session | null | undefined>()

  useEffect(() => {
    const supabase = getSupabase()
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    )
    return () => data.subscription.unsubscribe()
  }, [])

  const isAdmin = useQuery({
    queryKey: ['admin', 'is-admin', session?.user.id ?? null],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('is_admin')
      if (error) throw error
      return data as boolean
    },
    enabled: Boolean(session),
  })

  if (session === undefined) return { status: 'loading' }
  if (!session) return { status: 'signed-out' }
  if (isAdmin.isPending) return { status: 'loading' }
  return isAdmin.data
    ? { status: 'admin', session }
    : { status: 'not-admin', session }
}

export async function signIn(email: string, password: string) {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
}

export async function signInWithGoogle() {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
      // Volunteers may share a laptop: always ask which account to use.
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
}

export async function signOut() {
  await getSupabase().auth.signOut()
}

async function currentUserId() {
  const { data } = await getSupabase().auth.getUser()
  return data.user?.id ?? null
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const currentEventQuery = queryOptions({
  queryKey: ['admin', 'current-event'],
  queryFn: async (): Promise<EventEdition> => {
    const { data, error } = await getSupabase()
      .from('events')
      .select('id, name, archived_at')
      .is('archived_at', null)
      .single()
    if (error) throw error
    return data
  },
})

/** Every event, archived ones included. */
export const eventsQuery = queryOptions({
  queryKey: ['admin', 'events'],
  queryFn: async (): Promise<Array<EventEdition>> => {
    const { data, error } = await getSupabase()
      .from('events')
      .select('id, name, archived_at')
    if (error) throw error
    return data
  },
})

export const archivedEventsQuery = queryOptions({
  queryKey: ['admin', 'archived-events'],
  queryFn: async (): Promise<Array<EventEdition>> => {
    const { data, error } = await getSupabase()
      .from('events')
      .select('id, name, archived_at')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
    if (error) throw error
    return data
  },
})

/** Every game, hidden ones included, with its station label for the current event. */
export const adminGamesQuery = queryOptions({
  queryKey: ['admin', 'games'],
  queryFn: async (): Promise<Array<AdminGame>> => {
    const supabase = getSupabase()
    const [games, setups] = await Promise.all([
      supabase.from('games').select('*').order('position').order('name'),
      supabase
        .from('game_event_setups')
        .select('game_id, station_label, events!inner(archived_at)')
        .is('events.archived_at', null),
    ])
    if (games.error) throw games.error
    if (setups.error) throw setups.error
    const labels = new Map(
      (
        setups.data as Array<{ game_id: string; station_label: string | null }>
      ).map((setup) => [setup.game_id, setup.station_label]),
    )
    return (games.data as Array<Game>).map((game) => ({
      ...game,
      station_label: labels.get(game.id) ?? null,
    }))
  },
})

/** Player submissions of one filter, newest first (posts to make: oldest first). */
export const submissionsQuery = (filter: SubmissionFilter) =>
  queryOptions({
    queryKey: ['admin', 'submissions', filter],
    queryFn: async (): Promise<Array<AdminScore>> => {
      const base = getSupabase()
        .from('scores')
        .select('*')
        .eq('source', 'player')
      const query =
        filter === 'to_post'
          ? base
              .eq('status', 'approved')
              .eq('instagram_consent', true)
              .is('instagram_post_id', null)
          : base.eq('status', filter)
      const { data, error } = await query
        .order('created_at', { ascending: filter === 'to_post' })
        .limit(200)
      if (error) throw error
      return data as Array<AdminScore>
    },
    refetchInterval: QUEUE_REFRESH_MS,
  })

export const submissionCountsQuery = queryOptions({
  queryKey: ['admin', 'submissions', 'counts'],
  queryFn: async (): Promise<Record<SubmissionFilter, number>> => {
    const supabase = getSupabase()
    const count = async (filter: SubmissionFilter) => {
      const base = supabase
        .from('scores')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'player')
      const { count: total, error } =
        filter === 'to_post'
          ? await base
              .eq('status', 'approved')
              .eq('instagram_consent', true)
              .is('instagram_post_id', null)
          : await base.eq('status', filter)
      if (error) throw error
      return total ?? 0
    }
    const [pending, approved, rejected, to_post] = await Promise.all([
      count('pending'),
      count('approved'),
      count('rejected'),
      count('to_post'),
    ])
    return { pending, approved, rejected, to_post }
  },
  refetchInterval: QUEUE_REFRESH_MS,
})

/**
 * Keyed hash public_scores() gives an anonymous score, by score id: the
 * Instagram post shows the same nickname as the screen. Only visible games.
 */
export const anonymousSeedsQuery = queryOptions({
  queryKey: ['admin', 'anonymous-seeds'],
  queryFn: async (): Promise<Map<string, string>> => {
    const { data, error } = await getSupabase()
      .rpc('public_scores')
      .select('id, anonymous_seed')
      .eq('anonymous', true)
    if (error) throw error
    return new Map(
      (data as Array<{ id: string; anonymous_seed: string | null }>).flatMap(
        (row) =>
          row.anonymous_seed ? [[row.id, row.anonymous_seed] as const] : [],
      ),
    )
  },
  refetchInterval: QUEUE_REFRESH_MS,
})

/** Approved scores of every event, for the records, rankings and game table. */
export const approvedScoresQuery = queryOptions({
  queryKey: ['admin', 'approved-scores'],
  queryFn: async (): Promise<Array<AdminScore>> => {
    const { data, error } = await getSupabase()
      .from('scores')
      .select('*')
      .eq('status', 'approved')
    if (error) throw error
    return data as Array<AdminScore>
  },
  refetchInterval: QUEUE_REFRESH_MS,
})

export const adminSettingsQuery = queryOptions({
  queryKey: ['admin', 'settings'],
  queryFn: async (): Promise<AdminSettings> => {
    const { data, error } = await getSupabase()
      .from('settings')
      .select('*')
      .single()
    if (error) throw error
    return data as AdminSettings
  },
})

/** Refreshes every admin query after a change. */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin'] })
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

export interface RankedScore extends AdminScore {
  rank: number
}

export function rankGameScores(
  scores: Array<AdminScore>,
  game: Pick<Game, 'id' | 'score_order'>,
  eventId?: string,
): Array<RankedScore> {
  const own = scores.filter(
    (score) =>
      score.game_id === game.id && (!eventId || score.event_id === eventId),
  )
  return rankScores(own, game.score_order).map(({ entry, rank }) => ({
    ...entry,
    rank,
  }))
}

/** Place a score would take in the current ranking of its game (1 = record). */
export function placeFor(
  score: number,
  ranking: Array<{ score: number; id: string }>,
  order: Game['score_order'],
  ignoreId?: string,
) {
  const better = ranking.filter(
    (entry) => entry.id !== ignoreId && isBetter(entry.score, score, order),
  )
  return better.length + 1
}

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export interface ScoreReview {
  game_id: string
  score: number
  /** Empty: the screen shows a nickname seeded by the score id. */
  player_name: string | null
  display_on_screen: boolean
}

export async function approveScore(id: string, review: ScoreReview) {
  const { error } = await getSupabase()
    .from('scores')
    .update({
      ...review,
      player_name: review.player_name?.trim() || null,
      custom_game_name: null,
      status: 'approved',
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: await currentUserId(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function rejectScore(id: string) {
  const { error } = await getSupabase()
    .from('scores')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: await currentUserId(),
    })
    .eq('id', id)
  if (error) throw error
}

/** Puts a reviewed submission back in the queue. */
export async function reopenScore(id: string) {
  const { error } = await getSupabase()
    .from('scores')
    .update({ status: 'pending', reviewed_at: null, reviewed_by: null })
    .eq('id', id)
  if (error) throw error
}

export async function updateScore(
  id: string,
  changes: Partial<
    Pick<ScoreReview, 'score' | 'player_name' | 'display_on_screen'>
  >,
) {
  const { error } = await getSupabase()
    .from('scores')
    .update(changes)
    .eq('id', id)
  if (error) throw error
}

/** Marks a score as posted by hand on Instagram, or back to post (null). */
export async function setInstagramPostId(id: string, postId: string | null) {
  const { error } = await getSupabase()
    .from('scores')
    .update({ instagram_post_id: postId })
    .eq('id', id)
  if (error) throw error
}

export async function deleteScore(id: string) {
  const { error } = await getSupabase().from('scores').delete().eq('id', id)
  if (error) throw error
}

export interface ManualScore {
  game_id: string
  player_name: string
  score: number
  display_on_screen: boolean
  photo: File | null
}

/** A score typed by a volunteer: approved right away, in the current event. */
export async function addManualScore(input: ManualScore) {
  const supabase = getSupabase()
  let photoPath: string | null = null
  let thumbPath: string | null = null
  if (input.photo) {
    const photo = await preparePhoto(input.photo)
    const id = randomUuid()
    photoPath = `admin/${id}.${photoFileType(photo.proof).extension}`
    if (!isOriginalPhoto(photo))
      thumbPath = `admin/${id}.thumb.${photoFileType(photo.thumb).extension}`
    const uploads = await Promise.all([
      supabase.storage.from('photos').upload(photoPath, photo.proof, {
        contentType: photoFileType(photo.proof).contentType,
      }),
      thumbPath
        ? supabase.storage.from('photos').upload(thumbPath, photo.thumb, {
            contentType: photoFileType(photo.thumb).contentType,
          })
        : null,
    ])
    for (const upload of uploads) if (upload?.error) throw upload.error
  }
  const { error } = await supabase.from('scores').insert({
    game_id: input.game_id,
    player_name: input.player_name.trim(),
    score: input.score,
    photo_path: photoPath,
    thumb_path: thumbPath,
    display_on_screen: input.display_on_screen,
    status: 'approved',
    source: 'admin',
    reviewed_at: new Date().toISOString(),
    reviewed_by: await currentUserId(),
  })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export interface GameInput {
  name: string
  short_label: string
  console: string | null
  score_type: ScoreType
  score_order: Game['score_order']
  visible: boolean
  station_label: string | null
  cover: File | null
}

function slugify(name: string) {
  return (
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'jeu'
  )
}

/** "Super Mario Bros." → "SMB", "Tetris" → "TET". */
export function defaultShortLabel(name: string) {
  const words = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  const label =
    words.length > 1
      ? words.map((word) => word.charAt(0)).join('')
      : (words[0] ?? '')
  return label.slice(0, 3).toUpperCase() || '???'
}

function extensionOf(file: Blob) {
  const fromName =
    file instanceof File ? file.name.split('.').pop()?.toLowerCase() : null
  return fromName && /^[a-z0-9]{1,5}$/.test(fromName) ? fromName : 'jpg'
}

async function uploadCover(gameSlug: string, cover: File) {
  const path = `${gameSlug}-${randomUuid().slice(0, 8)}.${extensionOf(cover)}`
  const { error } = await getSupabase()
    .storage.from('covers')
    .upload(path, cover, { contentType: cover.type || 'image/png' })
  if (error) throw error
  return path
}

async function setStationLabel(gameId: string, label: string | null) {
  const supabase = getSupabase()
  const { data: eventId, error: eventError } =
    await supabase.rpc('current_event_id')
  if (eventError) throw eventError
  const { error } = label
    ? await supabase
        .from('game_event_setups')
        .upsert({ event_id: eventId, game_id: gameId, station_label: label })
    : await supabase
        .from('game_event_setups')
        .delete()
        .eq('event_id', eventId)
        .eq('game_id', gameId)
  if (error) throw error
}

/** Creates a game at the end of the list; returns its id. */
export async function createGame(input: GameInput) {
  const supabase = getSupabase()
  const slug = `${slugify(input.name)}-${randomUuid().slice(0, 4)}`
  const { data: last } = await supabase
    .from('games')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const cover_path = input.cover ? await uploadCover(slug, input.cover) : null
  const { data, error } = await supabase
    .from('games')
    .insert({
      slug,
      name: input.name.trim(),
      short_label: input.short_label.trim().toUpperCase(),
      console: input.console?.trim() || null,
      score_type: input.score_type,
      score_order: input.score_order,
      score_unit: input.score_type === 'points' ? 'pts' : null,
      visible: input.visible,
      position: (last?.position ?? 0) + 1,
      cover_path,
    })
    .select('id')
    .single()
  if (error) throw error
  const id = data.id
  await setStationLabel(id, input.station_label?.trim() || null)
  return id
}

export async function updateGame(game: AdminGame, input: GameInput) {
  const cover_path = input.cover
    ? await uploadCover(game.slug, input.cover)
    : game.cover_path
  const { error } = await getSupabase()
    .from('games')
    .update({
      name: input.name.trim(),
      short_label: input.short_label.trim().toUpperCase(),
      console: input.console?.trim() || null,
      score_type: input.score_type,
      score_order: input.score_order,
      visible: input.visible,
      cover_path,
    })
    .eq('id', game.id)
  if (error) throw error
  if ((input.station_label?.trim() || null) !== game.station_label)
    await setStationLabel(game.id, input.station_label?.trim() || null)
}

export async function setGameVisible(id: string, visible: boolean) {
  const { error } = await getSupabase()
    .from('games')
    .update({ visible })
    .eq('id', id)
  if (error) throw error
}

/** Thrown when a game still has scores: FK cascade would wipe them. */
export class GameHasScoresError extends Error {
  readonly count: number

  constructor(count: number) {
    super(`Game still has ${count} score(s)`)
    this.name = 'GameHasScoresError'
    this.count = count
  }
}

/**
 * Deletes a game for good. Refuses when any score still points at it
 * (pending, approved or rejected): `scores.game_id` cascades on delete.
 * Station labels for the game go away with it (`game_event_setups` cascade).
 * Cover file in storage is best-effort; an orphan is harmless.
 */
export async function deleteGame(game: Pick<AdminGame, 'id' | 'cover_path'>) {
  const supabase = getSupabase()
  const { count, error: countError } = await supabase
    .from('scores')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id)
  if (countError) throw countError
  if ((count ?? 0) > 0) throw new GameHasScoresError(count ?? 0)

  const { error } = await supabase.from('games').delete().eq('id', game.id)
  if (error) throw error

  if (game.cover_path) {
    await supabase.storage.from('covers').remove([game.cover_path])
  }
}

/** Saves a new display order: positions 1, 2, 3… */
export async function reorderGames(ids: Array<string>) {
  const supabase = getSupabase()
  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from('games')
        .update({ position: index + 1 })
        .eq('id', id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}

export function coverUrl(path: string | null) {
  // Pass through absolute/inline URLs (incl. blob: previews in the game modal).
  if (!path || /^(https?:|data:|blob:|\/)/.test(path)) return path
  return getSupabase().storage.from('covers').getPublicUrl(path).data.publicUrl
}

/** Full-size proof for the admin (the screen uses the thumbnail). */
export function proofUrl(path: string | null) {
  if (!path) return null
  return getSupabase().storage.from('photos').getPublicUrl(path).data.publicUrl
}

// ---------------------------------------------------------------------------
// Settings and events
// ---------------------------------------------------------------------------

export type SettingsChanges = Partial<
  Pick<
    AdminSettings,
    | 'submissions_open'
    | 'game_duration_s'
    | 'wall_duration_s'
    | 'rows_shown'
    | 'min_all_time_rows'
    | 'show_header'
    | 'instagram_enabled'
    | 'instagram_mode'
    | 'instagram_caption'
  > & { screen_mode: ScreenMode }
>

export async function updateSettings(changes: SettingsChanges) {
  const { error } = await getSupabase()
    .from('settings')
    .update(changes)
    .eq('id', true)
  if (error) throw error
}

export async function archiveCurrentEvent(newEventName: string) {
  const { error } = await getSupabase().rpc('archive_current_event', {
    new_event_name: newEventName.trim(),
  })
  if (error) throw error
}

export async function renameEvent(id: string, name: string) {
  const { error } = await getSupabase()
    .from('events')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Score input
// ---------------------------------------------------------------------------

/**
 * Reads what a volunteer typed. Points: digits, spaces allowed ("128 400").
 * Time: 1'32"48, 1:32.48, 1'32 or 92.48 (seconds), stored in milliseconds.
 */
export function parseScore(raw: string, type: ScoreType): number | null {
  const value = raw.trim()
  if (!value) return null
  if (type !== 'time') {
    const digits = value.replace(/[\s.]/g, '')
    return /^\d{1,15}$/.test(digits) ? Number(digits) : null
  }
  const match =
    /^(?:(\d+)\s*['’:])?\s*(\d{1,2})(?:\s*(?:["”.,])\s*(\d{1,3}))?\s*"?$/.exec(
      value,
    )
  if (!match) return null
  const [, minutes = '0', seconds, fraction = ''] = match
  if (Number(seconds) >= 60 && minutes !== '0') return null
  const ms = Number(fraction.padEnd(3, '0').slice(0, 3))
  return Number(minutes) * 60_000 + Number(seconds) * 1000 + ms
}
