import { describe, test, expect } from 'vitest'
import { BADGES, evaluateBadges, type BadgeCheckInput } from './badges'

function baseInput(overrides: Partial<BadgeCheckInput> = {}): BadgeCheckInput {
  return {
    streakCurrent: 0,
    globalLevel: 1,
    skillLevels: {},
    tabsCompletedCount: 0,
    ...overrides,
  }
}

function isUnlocked(id: string, input: BadgeCheckInput): boolean {
  const badge = BADGES.find((b) => b.id === id)
  if (!badge) throw new Error(`no badge with id ${id}`)
  return badge.isUnlocked(input)
}

describe('BADGES thresholds', () => {
  test('premiere-semaine unlocks at streakCurrent 7, not at 6', () => {
    expect(isUnlocked('premiere-semaine', baseInput({ streakCurrent: 7 }))).toBe(true)
    expect(isUnlocked('premiere-semaine', baseInput({ streakCurrent: 6 }))).toBe(false)
  })

  test('un-mois unlocks at streakCurrent 30, not at 29', () => {
    expect(isUnlocked('un-mois', baseInput({ streakCurrent: 30 }))).toBe(true)
    expect(isUnlocked('un-mois', baseInput({ streakCurrent: 29 }))).toBe(false)
  })

  test('centurion unlocks at streakCurrent 100, not at 99', () => {
    expect(isUnlocked('centurion', baseInput({ streakCurrent: 100 }))).toBe(true)
    expect(isUnlocked('centurion', baseInput({ streakCurrent: 99 }))).toBe(false)
  })

  test('premier-riff unlocks at tabsCompletedCount 1, not at 0', () => {
    expect(isUnlocked('premier-riff', baseInput({ tabsCompletedCount: 1 }))).toBe(true)
    expect(isUnlocked('premier-riff', baseInput({ tabsCompletedCount: 0 }))).toBe(false)
  })

  test('dix-riffs unlocks at tabsCompletedCount 10, not at 9', () => {
    expect(isUnlocked('dix-riffs', baseInput({ tabsCompletedCount: 10 }))).toBe(true)
    expect(isUnlocked('dix-riffs', baseInput({ tabsCompletedCount: 9 }))).toBe(false)
  })

  test('monte-en-gamme unlocks when any skill level reaches 10, not at 9', () => {
    expect(isUnlocked('monte-en-gamme', baseInput({ skillLevels: { legato: 10 } }))).toBe(true)
    expect(isUnlocked('monte-en-gamme', baseInput({ skillLevels: { legato: 9 } }))).toBe(false)
  })

  test('virtuose-en-herbe unlocks at globalLevel 25, not at 24', () => {
    expect(isUnlocked('virtuose-en-herbe', baseInput({ globalLevel: 25 }))).toBe(true)
    expect(isUnlocked('virtuose-en-herbe', baseInput({ globalLevel: 24 }))).toBe(false)
  })

  test('shred-master unlocks when any skill level reaches 25, not at 24', () => {
    expect(isUnlocked('shred-master', baseInput({ skillLevels: { sweep: 25 } }))).toBe(true)
    expect(isUnlocked('shred-master', baseInput({ skillLevels: { sweep: 24 } }))).toBe(false)
  })
})

describe('evaluateBadges', () => {
  test('returns newly unlocked ids and excludes already-unlocked ones', () => {
    const input = baseInput({ streakCurrent: 30, tabsCompletedCount: 1 })
    const result = evaluateBadges(input, ['premiere-semaine'])

    expect(result).toContain('un-mois')
    expect(result).toContain('premier-riff')
    expect(result).not.toContain('premiere-semaine')
  })
})
