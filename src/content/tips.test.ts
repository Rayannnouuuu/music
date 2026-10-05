import { describe, test, expect } from 'vitest'
import { bandForDifficulty, tipsFor } from './tips'
import type { Category } from '../lib/content/types'

const CATEGORIES: Category[] = [
  'scales',
  'legato',
  'picking',
  'bends',
  'palmMuting',
  'sweep',
  'rhythm',
  'arpeggios',
]

describe('bandForDifficulty', () => {
  test.each([
    [1, 'debutant'],
    [3, 'debutant'],
    [4, 'intermediaire'],
    [7, 'intermediaire'],
    [8, 'avance'],
    [10, 'avance'],
  ] as const)('difficulty %i maps to band %s', (difficulty, band) => {
    expect(bandForDifficulty(difficulty)).toBe(band)
  })
})

describe('tipsFor', () => {
  test('returns a non-empty tip list for every category and every band', () => {
    for (const category of CATEGORIES) {
      for (const difficulty of [1, 5, 10]) {
        const tips = tipsFor(category, difficulty)
        expect(tips.length).toBeGreaterThan(0)
        for (const tip of tips) expect(tip.length).toBeGreaterThan(10)
      }
    }
  })

  test('a harder exercise in the same category gets different tips than an easy one', () => {
    expect(tipsFor('scales', 1)).not.toEqual(tipsFor('scales', 10))
  })
})
