import { describe, test, expect } from 'vitest'
import { validateTab, validateExercise, ContentValidationError } from './validate'
import type { Tab, Exercise } from './types'

function makeValidTab(): Tab {
  return {
    id: 'tab-1',
    title: 'Test Riff',
    artist: 'Test Artist',
    subgenre: 'thrash',
    tuning: 'Standard',
    originalTempo: 120,
    difficulty: 5,
    measures: [
      {
        events: [
          { string: 6, fret: 0, startBeat: 0, duration: 1 },
          { string: 6, fret: 2, startBeat: 1, duration: 1 },
        ],
      },
    ],
  }
}

function makeValidExercise(): Exercise {
  return {
    id: 'ex-1',
    title: 'Test Scale',
    category: 'scales',
    difficulty: 3,
    description: 'A test scale exercise',
    targetBpm: 80,
    xpReward: 30,
    pattern: [
      { string: 6, fret: 0, startBeat: 0, duration: 1 },
      { string: 6, fret: 2, startBeat: 1, duration: 1 },
    ],
  }
}

describe('validateTab', () => {
  test('passes a valid Tab fixture through unchanged', () => {
    const tab = makeValidTab()
    expect(validateTab(tab)).toEqual(tab)
  })

  test('throws when a fret is out of 0-24 range', () => {
    const tab = makeValidTab()
    tab.measures[0].events[0].fret = 25
    expect(() => validateTab(tab)).toThrow(ContentValidationError)
    expect(() => validateTab(tab)).toThrow(/fret/i)
  })

  test('throws when a string is out of 1-6 range', () => {
    const tab = makeValidTab()
    // @ts-expect-error intentionally invalid for the test
    tab.measures[0].events[0].string = 7
    expect(() => validateTab(tab)).toThrow(/string/i)
  })

  test('throws when startBeat is not ascending within a measure', () => {
    const tab = makeValidTab()
    tab.measures[0].events = [
      { string: 6, fret: 2, startBeat: 1, duration: 1 },
      { string: 6, fret: 0, startBeat: 0, duration: 1 },
    ]
    expect(() => validateTab(tab)).toThrow(/startBeat/i)
  })

  test('throws when a required field is missing', () => {
    const tab = makeValidTab() as Partial<Tab>
    delete tab.title
    expect(() => validateTab(tab)).toThrow(/title/i)
  })
})

describe('validateExercise', () => {
  test('passes a valid Exercise fixture through unchanged', () => {
    const exercise = makeValidExercise()
    expect(validateExercise(exercise)).toEqual(exercise)
  })

  test('throws when a pattern event has duration 0', () => {
    const exercise = makeValidExercise()
    exercise.pattern[0].duration = 0
    expect(() => validateExercise(exercise)).toThrow(/duration/i)
  })

  test('throws when a required field is missing', () => {
    const exercise = makeValidExercise() as Partial<Exercise>
    delete exercise.title
    expect(() => validateExercise(exercise)).toThrow(/title/i)
  })

  test('throws when difficulty is out of 1-10 range', () => {
    const exercise = makeValidExercise()
    exercise.difficulty = 11
    expect(() => validateExercise(exercise)).toThrow(/difficulty/i)
  })
})
