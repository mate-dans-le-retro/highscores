import { describe, expect, it } from 'vitest'

import { MOCK_SESSION_KEY, resolveMockMode } from './mode'

function fakeSession(initial?: string) {
  const values = new Map<string, string>()
  if (initial) values.set(MOCK_SESSION_KEY, initial)
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

describe('resolveMockMode', () => {
  it('keeps the real backend by default', () => {
    expect(resolveMockMode('', fakeSession(), undefined)).toBe(false)
    expect(resolveMockMode('', fakeSession(), 'supabase')).toBe(false)
  })

  it('follows VITE_DATA_SOURCE=mock without a parameter', () => {
    expect(resolveMockMode('', fakeSession(), 'mock')).toBe(true)
  })

  it('turns the mock on with ?mock=1 and remembers it', () => {
    const session = fakeSession()
    expect(resolveMockMode('?mock=1', session, undefined)).toBe(true)
    expect(resolveMockMode('', session, undefined)).toBe(true)
  })

  it('turns the mock off with ?mock=0, even when the env enables it', () => {
    const session = fakeSession()
    expect(resolveMockMode('?mock=0', session, 'mock')).toBe(false)
    expect(resolveMockMode('', session, 'mock')).toBe(false)
  })

  it('lets a new parameter replace the remembered one', () => {
    const session = fakeSession('1')
    expect(resolveMockMode('?mock=0', session, undefined)).toBe(false)
    expect(session.values.get(MOCK_SESSION_KEY)).toBe('0')
  })

  it('ignores other parameter values', () => {
    expect(resolveMockMode('?mock=yes', fakeSession(), undefined)).toBe(false)
    expect(resolveMockMode('?mock=yes', fakeSession(), 'mock')).toBe(true)
  })

  it('works without sessionStorage (server render)', () => {
    expect(resolveMockMode('', null, 'mock')).toBe(true)
    expect(resolveMockMode('?mock=1', null, undefined)).toBe(true)
  })
})
