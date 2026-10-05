import { describe, test, expect } from 'vitest'
import { filterExercises } from './loadExercises'
import type { Exercise } from './types'

function makeExercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: overrides.id ?? 'ex',
    title: 'Title',
    category: 'scales',
    difficulty: 5,
    description: 'desc',
    targetBpm: 80,
    xpReward: 30,
    pattern: [],
    ...overrides,
  }
}

const exercises: Exercise[] = [
  makeExercise({ id: 'a', category: 'scales', difficulty: 4 }),
  makeExercise({ id: 'b', category: 'scales', difficulty: 8 }),
  makeExercise({ id: 'c', category: 'legato', difficulty: 5 }),
  makeExercise({ id: 'd', category: 'bends', difficulty: 2 }),
]

describe('filterExercises', () => {
  test('no filter returns all exercises', () => {
    expect(filterExercises(exercises, {})).toHaveLength(4)
  })

  test('filters by category', () => {
    const result = filterExercises(exercises, { category: 'scales' })
    expect(result.map((e) => e.id)).toEqual(['a', 'b'])
  })

  test('filters by maxDifficulty', () => {
    const result = filterExercises(exercises, { maxDifficulty: 4 })
    expect(result.map((e) => e.id)).toEqual(['a', 'd'])
  })

  test('combined filters intersect', () => {
    const result = filterExercises(exercises, { category: 'scales', maxDifficulty: 4 })
    expect(result.map((e) => e.id)).toEqual(['a'])
  })
})
