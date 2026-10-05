import { describe, test, expect } from 'vitest'
import { loadAllExercises } from '../lib/content/loadExercises'
import { validateExercise } from '../lib/content/validate'

const EXPECTED_COUNTS: Record<string, number> = {
  scales: 15,
  legato: 10,
  picking: 15,
  bends: 10,
  palmMuting: 10,
  sweep: 10,
  rhythm: 15,
  arpeggios: 15,
}

describe('exercise content', () => {
  const exercises = loadAllExercises()

  test('loads exactly 100 exercises', () => {
    expect(exercises).toHaveLength(100)
  })

  test('every exercise passes validateExercise', () => {
    for (const exercise of exercises) {
      expect(() => validateExercise(exercise)).not.toThrow()
    }
  })

  test('per-category counts match the pinned table', () => {
    for (const [category, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
      const count = exercises.filter((e) => e.category === category).length
      expect(count, `category ${category}`).toBe(expectedCount)
    }
  })

  test('every category has at least one beginner (<=3) and one advanced (>=7) exercise', () => {
    for (const category of Object.keys(EXPECTED_COUNTS)) {
      const inCategory = exercises.filter((e) => e.category === category)
      expect(inCategory.some((e) => e.difficulty <= 3), `${category} needs a beginner exercise`).toBe(
        true,
      )
      expect(
        inCategory.some((e) => e.difficulty >= 7),
        `${category} needs an advanced exercise`,
      ).toBe(true)
    }
  })

  test('no two exercises in the same category share an identical pattern', () => {
    for (const category of Object.keys(EXPECTED_COUNTS)) {
      const patterns = exercises
        .filter((e) => e.category === category)
        .map((e) => JSON.stringify(e.pattern))
      const unique = new Set(patterns)
      expect(unique.size, `category ${category} has duplicate patterns`).toBe(patterns.length)
    }
  })

  test('titles within a category are not all identical to each other', () => {
    // Catches a generator that produces N near-duplicate items differing
    // only by a trailing number, while still allowing a handful of title
    // templates to repeat across a 10-15 item category.
    for (const category of Object.keys(EXPECTED_COUNTS)) {
      const inCategory = exercises.filter((e) => e.category === category)
      const baseTitles = new Set(inCategory.map((e) => e.title.replace(/\s*\d+$/, '')))
      expect(baseTitles.size, `category ${category} should use more than one title template`).toBeGreaterThan(1)
    }
  })
})
