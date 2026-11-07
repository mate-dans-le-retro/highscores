import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type UpdateRow = Record<string, unknown>

const fake = vi.hoisted(() => {
  const state = {
    userId: 'volunteer-1' as string | null,
    updateError: null as { message: string } | null,
    rpcError: null as { message: string } | null,
    updates: [] as Array<{ table: string; row: UpdateRow; id: string }>,
    rpcs: [] as Array<{ name: string; args: Record<string, unknown> }>,
  }

  const client = {
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null },
      }),
    },
    from(table: string) {
      return {
        update(row: UpdateRow) {
          return {
            eq(_column: string, id: string) {
              state.updates.push({ table, row, id })
              return Promise.resolve({ error: state.updateError })
            },
          }
        },
      }
    },
    rpc(name: string, args: Record<string, unknown>) {
      state.rpcs.push({ name, args })
      return Promise.resolve({ error: state.rpcError })
    },
  }

  return { state, client }
})

vi.mock('./supabase', () => ({
  getSupabase: () => fake.client,
}))

const {
  approveScore,
  archiveCurrentEvent,
  rejectScore,
  reopenScore,
  updateScore,
} = await import('./admin')

describe('admin score mutations', () => {
  beforeEach(() => {
    fake.state.userId = 'volunteer-1'
    fake.state.updateError = null
    fake.state.rpcError = null
    fake.state.updates = []
    fake.state.rpcs = []
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-07T10:15:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('approves a submission with trimmed name and clears custom game + rejection', async () => {
    await approveScore('score-1', {
      game_id: 'game-tetris',
      score: 128_400,
      player_name: '  Clem  ',
      display_on_screen: true,
    })

    expect(fake.state.updates).toHaveLength(1)
    expect(fake.state.updates[0]).toMatchObject({
      table: 'scores',
      id: 'score-1',
      row: {
        game_id: 'game-tetris',
        score: 128_400,
        player_name: 'Clem',
        display_on_screen: true,
        custom_game_name: null,
        status: 'approved',
        rejection_reason: null,
        reviewed_at: '2026-11-07T10:15:00.000Z',
        reviewed_by: 'volunteer-1',
      },
    })
  })

  it('stores a blank approved name as null', async () => {
    await approveScore('score-2', {
      game_id: 'game-tetris',
      score: 10,
      player_name: '   ',
      display_on_screen: false,
    })

    expect(fake.state.updates[0]?.row.player_name).toBeNull()
  })

  it('rejects with an optional trimmed reason', async () => {
    await rejectScore('score-3', '  photo floue  ')

    expect(fake.state.updates[0]).toMatchObject({
      table: 'scores',
      id: 'score-3',
      row: {
        status: 'rejected',
        rejection_reason: 'photo floue',
        reviewed_at: '2026-11-07T10:15:00.000Z',
        reviewed_by: 'volunteer-1',
      },
    })
  })

  it('rejects without a reason as null', async () => {
    await rejectScore('score-4')
    expect(fake.state.updates[0]?.row.rejection_reason).toBeNull()
  })

  it('reopens a reviewed score and clears the rejection reason', async () => {
    await reopenScore('score-5')

    expect(fake.state.updates[0]).toMatchObject({
      table: 'scores',
      id: 'score-5',
      row: {
        status: 'pending',
        rejection_reason: null,
        reviewed_at: null,
        reviewed_by: null,
      },
    })
  })

  it('updates score fields by id', async () => {
    await updateScore('score-6', { score: 99, display_on_screen: true })

    expect(fake.state.updates[0]).toEqual({
      table: 'scores',
      id: 'score-6',
      row: { score: 99, display_on_screen: true },
    })
  })

  it('archives the current event through the RPC with a trimmed name', async () => {
    await archiveCurrentEvent('  Soirée novembre  ')

    expect(fake.state.rpcs).toEqual([
      {
        name: 'archive_current_event',
        args: { new_event_name: 'Soirée novembre' },
      },
    ])
  })

  it('throws when a score update fails', async () => {
    fake.state.updateError = { message: 'boom' }
    await expect(rejectScore('score-7', 'nope')).rejects.toEqual({
      message: 'boom',
    })
  })

  it('throws when archive_current_event fails', async () => {
    fake.state.rpcError = { message: 'not admin' }
    await expect(archiveCurrentEvent('Next')).rejects.toEqual({
      message: 'not admin',
    })
  })
})
