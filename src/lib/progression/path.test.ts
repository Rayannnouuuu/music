import { describe, test, expect } from 'vitest'
import { buildPath, flattenPath, isExerciseUnlocked, nextExerciseId } from './path'
import type { Exercise } from '../content/types'

function ex(id: string, category: Exercise['category'], difficulty: number): Exercise {
  return {
    id,
    category,
    difficulty,
    title: id,
    description: '',
    targetBpm: 100,
    xpReward: 10,
    pattern: [],
  }
}

describe('buildPath', () => {
  test('orders categories per PATH_CATEGORY_ORDER, dropping empty categories', () => {
    const exercises = [ex('sweep-1', 'sweep', 1), ex('picking-1', 'picking', 1)]
    const chapters = buildPath(exercises)
    expect(chapters.map((c) => c.category)).toEqual(['picking', 'sweep'])
  })

  test('sorts a chapter by difficulty ascending', () => {
    const exercises = [ex('scales-3', 'scales', 5), ex('scales-1', 'scales', 1), ex('scales-2', 'scales', 3)]
    const chapters = buildPath(exercises)
    const scalesChapter = chapters.find((c) => c.category === 'scales')!
    expect(scalesChapter.exercises.map((e) => e.id)).toEqual(['scales-1', 'scales-2', 'scales-3'])
  })

  test('breaks a difficulty tie by numeric id suffix', () => {
    const exercises = [ex('scales-11', 'scales', 1), ex('scales-1', 'scales', 1)]
    const chapters = buildPath(exercises)
    expect(chapters[0].exercises.map((e) => e.id)).toEqual(['scales-1', 'scales-11'])
  })
})

describe('flattenPath', () => {
  test('concatenates every chapter in order', () => {
    const chapters = buildPath([ex('picking-1', 'picking', 1), ex('scales-1', 'scales', 1)])
    expect(flattenPath(chapters).map((e) => e.id)).toEqual(['picking-1', 'scales-1'])
  })
})

describe('isExerciseUnlocked', () => {
  const orderedIds = ['a', 'b', 'c']

  test('the first step is always unlocked', () => {
    expect(isExerciseUnlocked(orderedIds, [], 'a')).toBe(true)
  })

  test('a later step is locked until its predecessor is completed', () => {
    expect(isExerciseUnlocked(orderedIds, [], 'b')).toBe(false)
    expect(isExerciseUnlocked(orderedIds, ['a'], 'b')).toBe(true)
  })

  test('completing an earlier step does not unlock one two steps ahead', () => {
    expect(isExerciseUnlocked(orderedIds, ['a'], 'c')).toBe(false)
  })

  test('an id not in the path is never unlocked', () => {
    expect(isExerciseUnlocked(orderedIds, ['a', 'b', 'c'], 'z')).toBe(false)
  })
})

describe('nextExerciseId', () => {
  test('returns the first not-yet-completed id', () => {
    expect(nextExerciseId(['a', 'b', 'c'], ['a'])).toBe('b')
  })

  test('returns the first id when nothing is completed', () => {
    expect(nextExerciseId(['a', 'b', 'c'], [])).toBe('a')
  })

  test('returns undefined once everything is completed', () => {
    expect(nextExerciseId(['a', 'b'], ['a', 'b'])).toBeUndefined()
  })
})
