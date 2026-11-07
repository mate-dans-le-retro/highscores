import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SubmissionInput } from './types'

const fake = vi.hoisted(() => {
  const state = {
    uploadError: null as { message: string } | null,
    insertError: null as { message: string; code?: string } | null,
    uploads: [] as Array<{ path: string; contentType: string }>,
    inserts: [] as Array<Record<string, unknown>>,
    removals: [] as Array<{ bucket: string; paths: Array<string> }>,
  }

  const storageFrom = (bucket: string) => ({
    upload(path: string, _file: Blob, options: { contentType: string }) {
      state.uploads.push({ path, contentType: options.contentType })
      return Promise.resolve({ error: state.uploadError })
    },
    remove(paths: Array<string>) {
      state.removals.push({ bucket, paths })
      return Promise.resolve({ error: null })
    },
  })

  const client = {
    storage: { from: storageFrom },
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          if (table !== 'scores') throw new Error(`unexpected table ${table}`)
          state.inserts.push(row)
          return Promise.resolve({ error: state.insertError })
        },
      }
    },
  }

  return { state, client }
})

vi.mock('../supabase', () => ({
  getSupabase: () => fake.client,
  photoUrl: () => null,
}))

vi.mock('../random-uuid', () => ({
  randomUuid: () => '11111111-1111-4111-8111-111111111111',
}))

const { supabaseSource } = await import('./supabase-source')

function submission(
  overrides: Partial<SubmissionInput> = {},
): SubmissionInput {
  const proof = new Blob(['proof'], { type: 'image/jpeg' })
  const thumb = new Blob(['thumb'], { type: 'image/jpeg' })
  return {
    id: 'sub-1',
    game_id: 'game-1',
    custom_game_name: null,
    player_name: 'Ada',
    score: 42,
    photo: { proof, thumb },
    display_on_screen: true,
    instagram_consent: false,
    instagram_handle: null,
    detected_game_id: null,
    detected_score: null,
    ...overrides,
  }
}

describe('supabaseSource.submitScore', () => {
  beforeEach(() => {
    fake.state.uploadError = null
    fake.state.insertError = null
    fake.state.uploads = []
    fake.state.inserts = []
    fake.state.removals = []
  })

  it('uploads proof and thumb then inserts a pending row', async () => {
    await supabaseSource.submitScore(submission())

    expect(fake.state.uploads.map((u) => u.path)).toEqual([
      'submissions/11111111-1111-4111-8111-111111111111.jpg',
      'submissions/11111111-1111-4111-8111-111111111111.thumb.jpg',
    ])
    expect(fake.state.inserts).toHaveLength(1)
    expect(fake.state.inserts[0]).toMatchObject({
      id: 'sub-1',
      game_id: 'game-1',
      custom_game_name: null,
      player_name: 'Ada',
      score: 42,
      photo_path: 'submissions/11111111-1111-4111-8111-111111111111.jpg',
      thumb_path: 'submissions/11111111-1111-4111-8111-111111111111.thumb.jpg',
      display_on_screen: true,
      instagram_consent: false,
    })
    expect(fake.state.removals).toEqual([])
  })

  it('ignores a duplicate-id insert (23505) after a lost first response', async () => {
    fake.state.insertError = { message: 'duplicate', code: '23505' }
    await expect(
      supabaseSource.submitScore(submission()),
    ).resolves.toBeUndefined()
  })

  it('throws when insert fails for another reason', async () => {
    fake.state.insertError = { message: 'rls', code: '42501' }
    await expect(supabaseSource.submitScore(submission())).rejects.toEqual({
      message: 'rls',
      code: '42501',
    })
  })

  // G18: uploads stay in Storage when insert fails (non-23505). Flip this to a
  // real assertion when storage.remove lands in the catch path.
  it.todo(
    'removes uploaded proof and thumb when insert fails with a non-23505 error',
  )
})
