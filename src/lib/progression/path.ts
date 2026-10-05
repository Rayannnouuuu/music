import type { Exercise, Category } from '../content/types'

// Pedagogical order: basic technique and rhythm first, melodic/expressive
// techniques next, the most demanding techniques last.
export const PATH_CATEGORY_ORDER: Category[] = [
  'picking',
  'palmMuting',
  'rhythm',
  'scales',
  'legato',
  'bends',
  'arpeggios',
  'sweep',
]

export interface PathChapter {
  category: Category
  exercises: Exercise[]
}

export const CATEGORY_LABELS: Record<Category, string> = {
  scales: 'Gammes',
  legato: 'Legato',
  picking: 'Picking',
  bends: 'Bends',
  palmMuting: 'Palm muting',
  sweep: 'Sweep picking',
  rhythm: 'Rythmique',
  arpeggios: 'Arpèges',
}

function idSuffix(id: string): number {
  const match = id.match(/(\d+)$/)
  return match ? Number(match[1]) : 0
}

// Builds one chapter per category, each a strictly increasing-difficulty
// sequence (ties broken by id) — the "suite" the content already encodes
// implicitly via difficulty, made explicit and orderable.
export function buildPath(exercises: Exercise[]): PathChapter[] {
  return PATH_CATEGORY_ORDER.map((category) => ({
    category,
    exercises: exercises
      .filter((e) => e.category === category)
      .slice()
      .sort((a, b) => a.difficulty - b.difficulty || idSuffix(a.id) - idSuffix(b.id)),
  })).filter((chapter) => chapter.exercises.length > 0)
}

export function flattenPath(chapters: PathChapter[]): Exercise[] {
  return chapters.flatMap((chapter) => chapter.exercises)
}

// Step 0 is always open; every later step unlocks only once its
// predecessor has been completed at least once (ever, not just today).
export function isExerciseUnlocked(
  orderedIds: string[],
  completedIds: string[],
  exerciseId: string,
): boolean {
  const index = orderedIds.indexOf(exerciseId)
  if (index === -1) return false
  if (index === 0) return true
  return completedIds.includes(orderedIds[index - 1])
}

// The first not-yet-completed step — "continue where you left off".
export function nextExerciseId(orderedIds: string[], completedIds: string[]): string | undefined {
  return orderedIds.find((id) => !completedIds.includes(id))
}
