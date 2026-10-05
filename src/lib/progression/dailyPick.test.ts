import { describe, test, expect } from 'vitest'
import { pickDailyExercise, pickDailyTab } from './dailyPick'
import type { Category, Exercise, Tab } from '../content/types'

function makeExercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: overrides.id ?? 'ex',
    title: 'Title',
    category: 'scales',
    difficulty: 3,
    description: 'desc',
    targetBpm: 80,
    xpReward: 30,
    pattern: [],
    ...overrides,
  }
}

function makeTab(overrides: Partial<Tab>): Tab {
  return {
    id: overrides.id ?? 'tab',
    title: 'Title',
    artist: 'Artist',
    subgenre: 'thrash',
    tuning: 'Standard',
    originalTempo: 120,
    difficulty: 5,
    measures: [],
    ...overrides,
  }
}

describe('pickDailyExercise', () => {
  const exercises: Exercise[] = [
    makeExercise({ id: 'scales-1', category: 'scales' }),
    makeExercise({ id: 'scales-2', category: 'scales' }),
    makeExercise({ id: 'legato-1', category: 'legato' }),
    makeExercise({ id: 'bends-1', category: 'bends' }),
  ]

  const skillXp: Record<Category, number> = {
    scales: 500,
    legato: 10, // clearly the lowest
    picking: 400,
    bends: 300,
    palmMuting: 200,
    sweep: 100,
    rhythm: 600,
    arpeggios: 700,
  }

  test('always picks from the lowest-XP category', () => {
    const pick = pickDailyExercise(exercises, skillXp, '2026-01-10')
    expect(pick.category).toBe('legato')
  })

  test('is deterministic for a fixed date', () => {
    const first = pickDailyExercise(exercises, skillXp, '2026-01-10')
    const second = pickDailyExercise(exercises, skillXp, '2026-01-10')
    expect(second).toEqual(first)
  })
})

describe('pickDailyTab', () => {
  const tabs: Tab[] = [makeTab({ id: 'a' }), makeTab({ id: 'b' }), makeTab({ id: 'c' })]

  test('is deterministic for a fixed date', () => {
    const first = pickDailyTab(tabs, '2026-01-10')
    const second = pickDailyTab(tabs, '2026-01-10')
    expect(second).toEqual(first)
  })
})
