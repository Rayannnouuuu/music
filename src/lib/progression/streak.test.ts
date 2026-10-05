import { describe, test, expect } from 'vitest'
import { isGoalMet, recordCompletion, currentStreak, longestStreak } from './streak'

describe('isGoalMet', () => {
  test('minutes goal met exactly at the amount', () => {
    expect(isGoalMet({ minutes: 20, exercisesCount: 0 }, { type: 'minutes', amount: 20 })).toBe(
      true,
    )
  })
  test('minutes goal met above the amount', () => {
    expect(isGoalMet({ minutes: 25, exercisesCount: 0 }, { type: 'minutes', amount: 20 })).toBe(
      true,
    )
  })
  test('minutes goal not met below the amount', () => {
    expect(isGoalMet({ minutes: 19, exercisesCount: 0 }, { type: 'minutes', amount: 20 })).toBe(
      false,
    )
  })
  test('exercises goal met exactly at the amount', () => {
    expect(isGoalMet({ minutes: 0, exercisesCount: 3 }, { type: 'exercises', amount: 3 })).toBe(
      true,
    )
  })
  test('exercises goal not met below the amount', () => {
    expect(isGoalMet({ minutes: 0, exercisesCount: 2 }, { type: 'exercises', amount: 3 })).toBe(
      false,
    )
  })
})

describe('recordCompletion', () => {
  test('adds a new date', () => {
    const result = recordCompletion({}, '2026-01-10', true)
    expect(result).toEqual({ '2026-01-10': true })
  })
  test('overwrites an existing date', () => {
    const result = recordCompletion({ '2026-01-10': false }, '2026-01-10', true)
    expect(result).toEqual({ '2026-01-10': true })
  })
  test('is idempotent when called twice with the same values', () => {
    const once = recordCompletion({}, '2026-01-10', true)
    const twice = recordCompletion(once, '2026-01-10', true)
    expect(twice).toEqual(once)
  })
  test('does not mutate the input', () => {
    const input = { '2026-01-09': true }
    recordCompletion(input, '2026-01-10', true)
    expect(input).toEqual({ '2026-01-09': true })
  })
})

describe('currentStreak', () => {
  test('today plus 6 previous consecutive true days is 7', () => {
    const history = {
      '2026-01-10': true,
      '2026-01-09': true,
      '2026-01-08': true,
      '2026-01-07': true,
      '2026-01-06': true,
      '2026-01-05': true,
      '2026-01-04': true,
    }
    expect(currentStreak(history, '2026-01-10')).toBe(7)
  })

  test('today absent does not break the streak', () => {
    const history = {
      '2026-01-09': true,
      '2026-01-08': true,
      '2026-01-07': true,
      '2026-01-06': true,
      '2026-01-05': true,
    }
    expect(currentStreak(history, '2026-01-10')).toBe(5)
  })

  test('today explicitly false is treated the same as absent', () => {
    const history = {
      '2026-01-10': false,
      '2026-01-09': true,
      '2026-01-08': true,
      '2026-01-07': true,
      '2026-01-06': true,
      '2026-01-05': true,
    }
    expect(currentStreak(history, '2026-01-10')).toBe(5)
  })

  test('a false day two days ago breaks the streak at that point', () => {
    const history = {
      '2026-01-10': true,
      '2026-01-09': true,
      '2026-01-08': false,
      '2026-01-07': true,
      '2026-01-06': true,
    }
    expect(currentStreak(history, '2026-01-10')).toBe(2)
  })

  test('empty history is 0', () => {
    expect(currentStreak({}, '2026-01-10')).toBe(0)
  })
})

describe('longestStreak', () => {
  test('finds the longest of several true runs', () => {
    const history = {
      '2026-01-01': true,
      '2026-01-02': true,
      '2026-01-03': true,
      '2026-01-04': false,
      '2026-01-05': true,
      '2026-01-06': true,
      '2026-01-07': true,
      '2026-01-08': true,
      '2026-01-09': true,
    }
    expect(longestStreak(history)).toBe(5)
  })

  test('empty history is 0', () => {
    expect(longestStreak({})).toBe(0)
  })
})
