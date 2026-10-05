import { describe, test, expect } from 'vitest'
import { hydrateProgressState, defaultProgressState } from './progressState'
import type { Tab } from '../content/types'

function validTab(id: string): Tab {
  return {
    id,
    title: 'T',
    artist: 'A',
    subgenre: 'thrash',
    tuning: 'Standard',
    originalTempo: 120,
    difficulty: 5,
    measures: [{ events: [{ string: 6, fret: 0, startBeat: 0, duration: 1 }] }],
  }
}

describe('hydrateProgressState', () => {
  test('null returns the default state', () => {
    expect(hydrateProgressState(null)).toEqual(defaultProgressState)
  })

  test('a non-object (e.g. a stray string) returns the default state', () => {
    expect(hydrateProgressState('not an object')).toEqual(defaultProgressState)
  })

  test('an empty object fills in every field with its default', () => {
    expect(hydrateProgressState({})).toEqual(defaultProgressState)
  })

  test('valid top-level fields are kept as-is', () => {
    const result = hydrateProgressState({ xpTotal: 250, tabsCompletedCount: 3 })
    expect(result.xpTotal).toBe(250)
    expect(result.tabsCompletedCount).toBe(3)
  })

  test('a wrong-type top-level field falls back to its default instead of propagating', () => {
    const result = hydrateProgressState({ xpTotal: 'not a number' })
    expect(result.xpTotal).toBe(0)
  })

  test('skillXp is merged per-category, filling in missing or wrong-type categories', () => {
    const result = hydrateProgressState({ skillXp: { scales: 100, legato: 'bad' } })
    expect(result.skillXp.scales).toBe(100)
    expect(result.skillXp.legato).toBe(0)
    expect(result.skillXp.rhythm).toBe(0)
  })

  test('importedTabs keeps valid tabs and drops invalid ones instead of crashing', () => {
    const malformed = { id: 'bad', measures: 'not an array' }
    const result = hydrateProgressState({ importedTabs: [validTab('ok'), malformed] })
    expect(result.importedTabs).toHaveLength(1)
    expect(result.importedTabs[0].id).toBe('ok')
  })

  test('a non-array importedTabs falls back to an empty array', () => {
    const result = hydrateProgressState({ importedTabs: 'not an array' })
    expect(result.importedTabs).toEqual([])
  })

  test('completedExerciseIdsByDay keeps valid day -> string[] entries', () => {
    const result = hydrateProgressState({
      completedExerciseIdsByDay: { '2026-10-05': ['ex-1', 'ex-2'] },
    })
    expect(result.completedExerciseIdsByDay).toEqual({ '2026-10-05': ['ex-1', 'ex-2'] })
  })

  test('completedExerciseIdsByDay drops a day whose value is not a string array', () => {
    const result = hydrateProgressState({
      completedExerciseIdsByDay: { '2026-10-05': ['ex-1'], '2026-10-06': 'not an array' },
    })
    expect(result.completedExerciseIdsByDay).toEqual({ '2026-10-05': ['ex-1'] })
  })

  test('a non-object completedExerciseIdsByDay falls back to an empty object', () => {
    const result = hydrateProgressState({ completedExerciseIdsByDay: 'nope' })
    expect(result.completedExerciseIdsByDay).toEqual({})
  })

  test('completedExerciseIds keeps a valid string array', () => {
    const result = hydrateProgressState({ completedExerciseIds: ['ex-1', 'ex-2'] })
    expect(result.completedExerciseIds).toEqual(['ex-1', 'ex-2'])
  })

  test('completedExerciseIds drops non-string entries instead of crashing', () => {
    const result = hydrateProgressState({ completedExerciseIds: ['ex-1', 42, null] })
    expect(result.completedExerciseIds).toEqual(['ex-1'])
  })

  test('a non-array completedExerciseIds falls back to an empty array', () => {
    const result = hydrateProgressState({ completedExerciseIds: 'nope' })
    expect(result.completedExerciseIds).toEqual([])
  })

  test('autoDetectEnabled defaults to true and keeps a valid boolean', () => {
    expect(hydrateProgressState({})).toHaveProperty('autoDetectEnabled', true)
    expect(hydrateProgressState({ autoDetectEnabled: false }).autoDetectEnabled).toBe(false)
  })

  test('a non-boolean autoDetectEnabled falls back to the default (true)', () => {
    expect(hydrateProgressState({ autoDetectEnabled: 'nope' }).autoDetectEnabled).toBe(true)
  })
})
