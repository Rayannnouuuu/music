import { describe, test, expect } from 'vitest'
import { filterTabs } from './loadTabs'
import type { Tab } from './types'

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

const tabs: Tab[] = [
  makeTab({ id: 'a', subgenre: 'thrash', tuning: 'Standard', difficulty: 4 }),
  makeTab({ id: 'b', subgenre: 'thrash', tuning: 'Eb', difficulty: 8 }),
  makeTab({ id: 'c', subgenre: 'groove', tuning: 'Drop D', difficulty: 5 }),
  makeTab({ id: 'd', subgenre: 'heavy', tuning: 'Standard', difficulty: 2 }),
]

describe('filterTabs', () => {
  test('no filter returns all tabs', () => {
    expect(filterTabs(tabs, {})).toHaveLength(4)
  })

  test('filters by subgenre', () => {
    const result = filterTabs(tabs, { subgenre: 'thrash' })
    expect(result.map((t) => t.id)).toEqual(['a', 'b'])
  })

  test('filters by maxDifficulty', () => {
    const result = filterTabs(tabs, { maxDifficulty: 4 })
    expect(result.map((t) => t.id)).toEqual(['a', 'd'])
  })

  test('filters by tuning', () => {
    const result = filterTabs(tabs, { tuning: 'Drop D' })
    expect(result.map((t) => t.id)).toEqual(['c'])
  })

  test('combined filters intersect', () => {
    const result = filterTabs(tabs, { subgenre: 'thrash', maxDifficulty: 4 })
    expect(result.map((t) => t.id)).toEqual(['a'])
  })
})
