import { describe, expect, it } from 'vitest'

import { submissionErrorMessage } from './submission-error'

describe('submissionErrorMessage', () => {
  it('maps the room rate limit', () => {
    expect(
      submissionErrorMessage({ code: 'P0001', hint: 'rate_limited' }),
    ).toBe('Trop de monde, réessaie dans une minute.')
  })

  it('maps closed submissions from RLS', () => {
    expect(submissionErrorMessage({ code: '42501' })).toBe(
      'Les envois sont fermés pour le moment. Demande à un bénévole ou réessaie plus tard.',
    )
  })

  it('maps the mock closed-submissions message', () => {
    expect(submissionErrorMessage(new Error('Submissions are closed'))).toBe(
      'Les envois sont fermés pour le moment. Demande à un bénévole ou réessaie plus tard.',
    )
  })

  it('falls back to a generic message', () => {
    expect(submissionErrorMessage(new Error('network down'))).toMatch(/Oups/)
    expect(submissionErrorMessage(null)).toMatch(/Oups/)
  })
})
