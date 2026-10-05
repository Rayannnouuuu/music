import type { Category, Exercise, Tab } from '../content/types'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function pickDailyExercise(
  exercises: Exercise[],
  skillXp: Record<Category, number>,
  date: string,
): Exercise {
  const availableCategories = Array.from(new Set(exercises.map((e) => e.category)))
  const lowestCategory = availableCategories.reduce((lowest, category) =>
    (skillXp[category] ?? 0) < (skillXp[lowest] ?? 0) ? category : lowest,
  )

  const candidates = exercises.filter((e) => e.category === lowestCategory)
  return candidates[hashString(date) % candidates.length]
}

export function pickDailyTab(tabs: Tab[], date: string): Tab {
  return tabs[hashString(date) % tabs.length]
}
