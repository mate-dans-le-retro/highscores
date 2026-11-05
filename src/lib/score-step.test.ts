import { describe, expect, it } from 'vitest'

import {
  formStepNumber,
  resolveScoreStep,
  scoreSearchSchema,
} from './score-step'

describe('scoreSearchSchema', () => {
  it('accepts known steps', () => {
    expect(scoreSearchSchema.parse({ step: 'photo' }).step).toBe('photo')
    expect(scoreSearchSchema.parse({ step: 'details' }).step).toBe('details')
    expect(scoreSearchSchema.parse({ step: 'consent' }).step).toBe('consent')
    expect(scoreSearchSchema.parse({ step: 'done' }).step).toBe('done')
  })

  it('drops unknown steps', () => {
    expect(scoreSearchSchema.parse({ step: 'nope' }).step).toBeUndefined()
  })
})

describe('resolveScoreStep', () => {
  it('defaults to photo', () => {
    expect(resolveScoreStep({})).toBe('photo')
  })
})

describe('formStepNumber', () => {
  it('numbers the three form steps', () => {
    expect(formStepNumber('photo')).toBe(1)
    expect(formStepNumber('details')).toBe(2)
    expect(formStepNumber('consent')).toBe(3)
    expect(formStepNumber('done')).toBeNull()
  })
})
