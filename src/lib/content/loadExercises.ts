import { validateExercise } from './validate'
import type { Category, Exercise } from './types'

export function loadAllExercises(): Exercise[] {
  const modules = import.meta.glob('/src/content/exercises/*.json', { eager: true }) as Record<
    string,
    { default: unknown }
  >

  const exercises: Exercise[] = []
  for (const [path, mod] of Object.entries(modules)) {
    const data = mod.default
    if (!Array.isArray(data)) {
      console.warn(`loadAllExercises: expected an array in "${path}"`)
      continue
    }
    data.forEach((item, index) => {
      try {
        exercises.push(validateExercise(item))
      } catch (err) {
        // Never let one bad content file blank the whole app — skip and
        // warn, regardless of what validateExercise happened to throw.
        console.warn(`loadAllExercises: skipping invalid exercise at "${path}"[${index}]:`, err)
      }
    })
  }
  return exercises
}

export interface ExerciseFilter {
  category?: Category
  maxDifficulty?: number
}

export function filterExercises(exercises: Exercise[], filter: ExerciseFilter): Exercise[] {
  return exercises.filter((exercise) => {
    if (filter.category && exercise.category !== filter.category) return false
    if (filter.maxDifficulty !== undefined && exercise.difficulty > filter.maxDifficulty) return false
    return true
  })
}
