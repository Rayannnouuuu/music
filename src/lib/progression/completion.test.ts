import { describe, test, expect } from 'vitest'
import { hasCompletedExerciseToday, recordExerciseCompletion } from './completion'

describe('hasCompletedExerciseToday', () => {
  test('false when the day has no entry', () => {
    expect(hasCompletedExerciseToday({}, '2026-10-05', 'ex-1')).toBe(false)
  })

  test('false when the day has other exercises but not this one', () => {
    const byDay = { '2026-10-05': ['ex-2'] }
    expect(hasCompletedExerciseToday(byDay, '2026-10-05', 'ex-1')).toBe(false)
  })

  test('true when the exercise is already recorded for that day', () => {
    const byDay = { '2026-10-05': ['ex-1', 'ex-2'] }
    expect(hasCompletedExerciseToday(byDay, '2026-10-05', 'ex-1')).toBe(true)
  })

  test('does not leak across days', () => {
    const byDay = { '2026-10-04': ['ex-1'] }
    expect(hasCompletedExerciseToday(byDay, '2026-10-05', 'ex-1')).toBe(false)
  })
})

describe('recordExerciseCompletion', () => {
  test('adds the exercise under a fresh day', () => {
    const result = recordExerciseCompletion({}, '2026-10-05', 'ex-1')
    expect(result).toEqual({ '2026-10-05': ['ex-1'] })
  })

  test('appends to an existing day without disturbing other exercises', () => {
    const result = recordExerciseCompletion({ '2026-10-05': ['ex-1'] }, '2026-10-05', 'ex-2')
    expect(result).toEqual({ '2026-10-05': ['ex-1', 'ex-2'] })
  })

  test('is idempotent: recording the same exercise twice does not duplicate it', () => {
    const once = recordExerciseCompletion({}, '2026-10-05', 'ex-1')
    const twice = recordExerciseCompletion(once, '2026-10-05', 'ex-1')
    expect(twice).toEqual({ '2026-10-05': ['ex-1'] })
  })

  test('leaves other days untouched', () => {
    const result = recordExerciseCompletion({ '2026-10-04': ['ex-1'] }, '2026-10-05', 'ex-2')
    expect(result).toEqual({ '2026-10-04': ['ex-1'], '2026-10-05': ['ex-2'] })
  })
})
