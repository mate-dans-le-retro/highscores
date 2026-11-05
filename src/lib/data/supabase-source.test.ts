import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type SubscribeCallback = (status: string) => void

const fake = vi.hoisted(() => {
  const channels: Array<{
    topic: string
    callback: SubscribeCallback
    removed: boolean
  }> = []
  const client = {
    channel(topic: string) {
      const entry = {
        topic,
        callback: (() => {}) as SubscribeCallback,
        removed: false,
      }
      channels.push(entry)
      const channel = {
        on: () => channel,
        subscribe: (callback: SubscribeCallback) => {
          entry.callback = callback
          return channel
        },
        entry,
      }
      return channel
    },
    removeChannel(channel: { entry: { removed: boolean } }) {
      channel.entry.removed = true
      return Promise.resolve('ok')
    },
  }
  return { channels, client }
})

vi.mock('../supabase', () => ({
  getSupabase: () => fake.client,
  photoUrl: () => null,
}))

const { supabaseSource } = await import('./supabase-source')

describe('supabaseSource.subscribe', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fake.channels.length = 0
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'])(
    'treats %s as a lost connection and resubscribes on a new channel',
    (status) => {
      const statuses: Array<string> = []
      const stop = supabaseSource.subscribe(
        () => {},
        (next) => statuses.push(next),
      )
      fake.channels[0].callback('SUBSCRIBED')
      fake.channels[0].callback(status)
      expect(statuses).toEqual(['connected', 'disconnected'])
      expect(fake.channels[0].removed).toBe(true)

      vi.advanceTimersByTime(1_000)
      expect(fake.channels).toHaveLength(2)
      expect(fake.channels[1].topic).not.toBe(fake.channels[0].topic)

      fake.channels[1].callback('SUBSCRIBED')
      expect(statuses).toEqual(['connected', 'disconnected', 'connected'])
      stop()
      expect(fake.channels[1].removed).toBe(true)
    },
  )
})
