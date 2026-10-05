import { describe, test, expect } from 'vitest'
import { xpToNext, cumulativeXpForLevel, levelFromXp, tierName } from './xp'

describe('xpToNext', () => {
  test('level 1 needs 100 xp', () => {
    expect(xpToNext(1)).toBe(100)
  })
  test('level 5 needs 300 xp', () => {
    expect(xpToNext(5)).toBe(300)
  })
})

describe('cumulativeXpForLevel', () => {
  test('level 1 requires 0 cumulative xp', () => {
    expect(cumulativeXpForLevel(1)).toBe(0)
  })
  test('level 2 requires 100 cumulative xp', () => {
    expect(cumulativeXpForLevel(2)).toBe(100)
  })
  test('level 3 requires 250 cumulative xp', () => {
    expect(cumulativeXpForLevel(3)).toBe(250)
  })
})

describe('levelFromXp', () => {
  test('0 xp is level 1', () => {
    expect(levelFromXp(0)).toBe(1)
  })
  test('99 xp is still level 1', () => {
    expect(levelFromXp(99)).toBe(1)
  })
  test('100 xp is level 2', () => {
    expect(levelFromXp(100)).toBe(2)
  })
  test('250 xp is level 3', () => {
    expect(levelFromXp(250)).toBe(3)
  })
})

describe('tierName', () => {
  test.each([
    [1, 'Débutant'],
    [10, 'Intermédiaire'],
    [20, 'Avancé'],
    [35, 'Expert'],
    [50, 'Virtuose'],
    [80, 'Virtuose'],
  ] as const)('level %i is %s', (level, expected) => {
    expect(tierName(level)).toBe(expected)
  })
})
