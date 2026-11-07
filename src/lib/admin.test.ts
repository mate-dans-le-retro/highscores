import { describe, expect, it } from 'vitest'
import type { Session } from '@supabase/supabase-js'

import {
  coverUrl,
  defaultShortLabel,
  parseScore,
  passwordUpdateErrorMessage,
  placeFor,
  sessionHasPasswordIdentity,
} from './admin'

describe('parseScore', () => {
  it('reads points with or without separators', () => {
    expect(parseScore('128400', 'points')).toBe(128400)
    expect(parseScore('128 400', 'points')).toBe(128400)
    expect(parseScore('128 400', 'points')).toBe(128400)
    expect(parseScore('128.400', 'points')).toBe(128400)
    expect(parseScore('12a', 'points')).toBeNull()
    expect(parseScore('', 'points')).toBeNull()
  })

  it('reads times in milliseconds', () => {
    expect(parseScore(`1'32"48`, 'time')).toBe(92480)
    expect(parseScore('1:32.48', 'time')).toBe(92480)
    expect(parseScore(`1'32`, 'time')).toBe(92000)
    expect(parseScore('92.48', 'time')).toBe(92480)
    expect(parseScore(`0'09"5`, 'time')).toBe(9500)
    expect(parseScore(`1'75"00`, 'time')).toBeNull()
    expect(parseScore('vite', 'time')).toBeNull()
  })
})

describe('defaultShortLabel', () => {
  it('takes initials, or the first letters of a single word', () => {
    expect(defaultShortLabel('Super Mario Bros.')).toBe('SMB')
    expect(defaultShortLabel('Tetris')).toBe('TET')
    expect(defaultShortLabel('Pac-Man')).toBe('PM')
    expect(defaultShortLabel('Éclair')).toBe('ECL')
    expect(defaultShortLabel('')).toBe('???')
  })
})

describe('placeFor', () => {
  const ranking = [
    { id: 'a', score: 300 },
    { id: 'b', score: 200 },
    { id: 'c', score: 100 },
  ]

  it('counts the better scores', () => {
    expect(placeFor(400, ranking, 'desc')).toBe(1)
    expect(placeFor(250, ranking, 'desc')).toBe(2)
    expect(placeFor(200, ranking, 'desc')).toBe(2)
    expect(placeFor(50, ranking, 'asc')).toBe(1)
  })

  it('ignores the score being edited', () => {
    expect(placeFor(250, ranking, 'desc', 'a')).toBe(1)
  })
})

describe('coverUrl', () => {
  it('passes through blob, data, http and rooted paths used as previews', () => {
    expect(coverUrl(null)).toBeNull()
    expect(coverUrl('blob:http://localhost:3000/abc')).toBe(
      'blob:http://localhost:3000/abc',
    )
    expect(coverUrl('data:image/png;base64,xx')).toBe(
      'data:image/png;base64,xx',
    )
    expect(coverUrl('https://cdn.example/cover.png')).toBe(
      'https://cdn.example/cover.png',
    )
    expect(coverUrl('/covers/local.svg')).toBe('/covers/local.svg')
  })
})

describe('sessionHasPasswordIdentity', () => {
  function sessionWith(providers: Array<string>): Session {
    return {
      user: {
        identities: providers.map((provider) => ({
          provider,
          id: provider,
          user_id: 'u1',
          identity_id: provider,
          identity_data: {},
          created_at: '',
          last_sign_in_at: '',
          updated_at: '',
        })),
      },
    } as Session
  }

  it('is false for a Google-only account even after a password was set server-side', () => {
    // updateUser({ password }) sets encrypted_password without adding an email identity.
    expect(sessionHasPasswordIdentity(sessionWith(['google']))).toBe(false)
  })

  it('is true when an email identity exists', () => {
    expect(sessionHasPasswordIdentity(sessionWith(['google', 'email']))).toBe(
      true,
    )
  })
})

describe('passwordUpdateErrorMessage', () => {
  it('explains same_password after a Google user retries the password already stored', () => {
    expect(
      passwordUpdateErrorMessage({
        code: 'same_password',
        message: 'New password should be different from the old password.',
      }),
    ).toBe('Choisis un mot de passe différent de celui déjà enregistré.')
  })

  it('falls back to a generic French message', () => {
    expect(passwordUpdateErrorMessage({ message: 'network boom' })).toBe(
      "Le mot de passe n'a pas pu être enregistré. Réessaie !",
    )
  })
})
