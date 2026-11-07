import { describe, expect, it } from 'vitest'
import type { Session } from '@supabase/supabase-js'

import {
  coverUrl,
  defaultShortLabel,
  deleteGameBlockedMessage,
  isScoreRuleLocked,
  parseScore,
  passwordUpdateErrorMessage,
  placeFor,
  requiresCurrentPasswordForChange,
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

describe('requiresCurrentPasswordForChange', () => {
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

  it('is false for a first password set (no stored password)', () => {
    expect(
      requiresCurrentPasswordForChange(false, sessionWith(['google'])),
    ).toBe(false)
    expect(
      requiresCurrentPasswordForChange(false, sessionWith(['email'])),
    ).toBe(false)
  })

  it('is false for Google-only even when encrypted_password is already set', () => {
    expect(
      requiresCurrentPasswordForChange(true, sessionWith(['google'])),
    ).toBe(false)
  })

  it('is true when changing a password tied to an email identity', () => {
    expect(requiresCurrentPasswordForChange(true, sessionWith(['email']))).toBe(
      true,
    )
    expect(
      requiresCurrentPasswordForChange(true, sessionWith(['google', 'email'])),
    ).toBe(true)
  })
})

describe('passwordUpdateErrorMessage', () => {
  it('explains same_password after a Google user retries the password already stored', () => {
    expect(
      passwordUpdateErrorMessage({
        code: 'same_password',
        message: 'New password should be different from the old password.',
      }),
    ).toContain('Choisis un mot de passe différent de celui déjà enregistré.')
  })

  it('explains current_password_required (Highscores Auth, unlike Tournoi)', () => {
    expect(
      passwordUpdateErrorMessage({
        code: 'current_password_required',
        message: 'Current password required when setting new password.',
        status: 400,
      }),
    ).toContain('mot de passe actuel')
  })

  it('keeps the Auth code and message in the alert', () => {
    expect(passwordUpdateErrorMessage({ message: 'network boom' })).toContain(
      'network boom',
    )
  })
})

describe('isScoreRuleLocked', () => {
  it('locks once any score exists', () => {
    expect(isScoreRuleLocked(0)).toBe(false)
    expect(isScoreRuleLocked(1)).toBe(true)
    expect(isScoreRuleLocked(12)).toBe(true)
  })
})

describe('deleteGameBlockedMessage', () => {
  it('mentions every score status, singular and plural', () => {
    expect(deleteGameBlockedMessage(1)).toContain(
      '1 score (validé, en attente ou refusé)',
    )
    expect(deleteGameBlockedMessage(3)).toContain(
      '3 scores (validés, en attente ou refusés)',
    )
  })
})
