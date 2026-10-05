import { describe, test, expect } from 'vitest'
import { loadAllTabs } from '../lib/content/loadTabs'
import { validateTab } from '../lib/content/validate'

describe('tab content', () => {
  const tabs = loadAllTabs()

  test('loads exactly 40 tabs', () => {
    expect(tabs).toHaveLength(40)
  })

  test('every tab passes validateTab', () => {
    for (const tab of tabs) {
      expect(() => validateTab(tab)).not.toThrow()
    }
  })

  test('at least 6 distinct subgenres are present', () => {
    const subgenres = new Set(tabs.map((t) => t.subgenre))
    expect(subgenres.size).toBeGreaterThanOrEqual(6)
  })

  test('at least 4 tabs are beginner (<=3) and at least 4 are advanced (>=7)', () => {
    expect(tabs.filter((t) => t.difficulty <= 3).length).toBeGreaterThanOrEqual(4)
    expect(tabs.filter((t) => t.difficulty >= 7).length).toBeGreaterThanOrEqual(4)
  })
})
