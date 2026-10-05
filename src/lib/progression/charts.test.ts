import { describe, test, expect } from 'vitest'
import { aggregateXpByDay, skillBreakdown } from './charts'
import { levelFromXp } from './xp'
import type { Category } from '../content/types'

describe('aggregateXpByDay', () => {
  test('sums multiple entries on the same date into one bucket', () => {
    const result = aggregateXpByDay([
      { date: '2026-01-01', xpGained: 30 },
      { date: '2026-01-01', xpGained: 20 },
    ])
    expect(result).toEqual([{ date: '2026-01-01', total: 50 }])
  })

  test('keeps different dates separate and sorts ascending', () => {
    const result = aggregateXpByDay([
      { date: '2026-01-02', xpGained: 10 },
      { date: '2026-01-01', xpGained: 5 },
    ])
    expect(result).toEqual([
      { date: '2026-01-01', total: 5 },
      { date: '2026-01-02', total: 10 },
    ])
  })
})

describe('skillBreakdown', () => {
  test('returns one entry per category with the correct level', () => {
    const skillXp: Record<Category, number> = {
      scales: 250,
      legato: 0,
      picking: 0,
      bends: 0,
      palmMuting: 0,
      sweep: 0,
      rhythm: 100,
      arpeggios: 0,
    }

    const result = skillBreakdown(skillXp)

    expect(result).toHaveLength(8)
    const scales = result.find((r) => r.category === 'scales')
    expect(scales).toEqual({ category: 'scales', xp: 250, level: levelFromXp(250) })
    const rhythm = result.find((r) => r.category === 'rhythm')
    expect(rhythm).toEqual({ category: 'rhythm', xp: 100, level: levelFromXp(100) })
  })
})
