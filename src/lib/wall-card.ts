import type { AllTimeRecord, GameRecord, LeaderboardRow } from './data/types'

export type WallCardView =
  | { kind: 'empty' }
  | {
      kind: 'record'
      /** The score the card shows: the event record, or the all-time one. */
      main: LeaderboardRow
      /** The shown score is also the best of every event: star by the name. */
      allTimeStar: boolean
      /** The all-time record, when it is another score (the ★ line). */
      otherAllTime: AllTimeRecord | null
      /** Event and date of the shown score, when it comes from a past event. */
      origin: { event_name: string | null; created_at: string } | null
    }

/**
 * What a records-wall card says about its game:
 * - the event record is also the all-time record: a star by the name;
 * - the all-time record is another score: no star, a ★ line for it;
 * - nobody has scored this event: the all-time record, starred, with the
 *   event and the date it comes from.
 */
export function wallCardView({ current, all_time }: GameRecord): WallCardView {
  if (current) {
    const isAllTime = all_time === null || all_time.id === current.id
    return {
      kind: 'record',
      main: current,
      allTimeStar: all_time !== null && isAllTime,
      otherAllTime: isAllTime ? null : all_time,
      origin: null,
    }
  }
  if (all_time) {
    return {
      kind: 'record',
      main: all_time,
      allTimeStar: true,
      otherAllTime: null,
      origin: {
        event_name: all_time.event_name,
        created_at: all_time.created_at,
      },
    }
  }
  return { kind: 'empty' }
}
