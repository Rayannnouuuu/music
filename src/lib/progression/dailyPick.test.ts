import { describe, test, expect } from 'vitest'
import { pickDailyTab } from './dailyPick'
import type { Tab } from '../content/types'

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

describe('pickDailyTab', () => {
  const tabs: Tab[] = [makeTab({ id: 'a' }), makeTab({ id: 'b' }), makeTab({ id: 'c' })]

  test('is deterministic for a fixed date', () => {
    const first = pickDailyTab(tabs, '2026-01-10')
    const second = pickDailyTab(tabs, '2026-01-10')
    expect(second).toEqual(first)
  })
})
