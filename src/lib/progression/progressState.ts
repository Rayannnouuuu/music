import { validateTab } from '../content/validate'
import type { DailyGoal, DailyProgress } from './streak'
import type { Category, Tab } from '../content/types'

export interface ProgressState {
  xpTotal: number
  skillXp: Record<Category, number>
  xpLog: { date: string; xpGained: number }[]
  dailyGoal: DailyGoal
  streakHistory: Record<string, boolean>
  badgesUnlocked: string[]
  customTempoByTabId: Record<string, number>
  importedTabs: Tab[]
  // Beyond the plan's literal field list: completeExercise/completeTabPractice
  // need a running tab-practice count (for badges) and per-day progress (for
  // the daily-goal check) — see Task 16 ledger ruling.
  tabsCompletedCount: number
  dailyProgress: Record<string, DailyProgress>
  // Which exercise ids have already paid out XP on which day — the guard
  // that makes XP mean something instead of being free on repeat clicks.
  completedExerciseIdsByDay: Record<string, string[]>
}

export const defaultProgressState: ProgressState = {
  xpTotal: 0,
  skillXp: {
    scales: 0,
    legato: 0,
    picking: 0,
    bends: 0,
    palmMuting: 0,
    sweep: 0,
    rhythm: 0,
    arpeggios: 0,
  },
  xpLog: [],
  dailyGoal: { type: 'exercises', amount: 1 },
  streakHistory: {},
  badgesUnlocked: [],
  customTempoByTabId: {},
  importedTabs: [],
  tabsCompletedCount: 0,
  dailyProgress: {},
  completedExerciseIdsByDay: {},
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function hydrateSkillXp(loaded: unknown): Record<Category, number> {
  const base = { ...defaultProgressState.skillXp }
  if (!isPlainObject(loaded)) return base
  for (const category of Object.keys(base) as Category[]) {
    base[category] = numberOr(loaded[category], 0)
  }
  return base
}

function hydrateCompletedExerciseIdsByDay(loaded: unknown): Record<string, string[]> {
  if (!isPlainObject(loaded)) return {}
  const result: Record<string, string[]> = {}
  for (const [day, ids] of Object.entries(loaded)) {
    if (Array.isArray(ids) && ids.every((id) => typeof id === 'string')) {
      result[day] = ids
    }
  }
  return result
}

function hydrateImportedTabs(loaded: unknown): Tab[] {
  if (!Array.isArray(loaded)) return []
  const tabs: Tab[] = []
  for (const item of loaded) {
    try {
      tabs.push(validateTab(item))
    } catch (err) {
      console.warn('hydrateProgressState: dropping an invalid imported tab', err)
    }
  }
  return tabs
}

// Merges a value loaded from localStorage with the default shape, so a
// corrupted key, a value saved by an older schema, or a value hand-edited in
// devtools can never produce a ProgressState the rest of the app can't
// render — every field falls back to its default independently.
export function hydrateProgressState(loaded: unknown): ProgressState {
  if (!isPlainObject(loaded)) return defaultProgressState

  return {
    xpTotal: numberOr(loaded.xpTotal, 0),
    skillXp: hydrateSkillXp(loaded.skillXp),
    xpLog: Array.isArray(loaded.xpLog) ? (loaded.xpLog as ProgressState['xpLog']) : [],
    dailyGoal: isPlainObject(loaded.dailyGoal)
      ? (loaded.dailyGoal as unknown as DailyGoal)
      : defaultProgressState.dailyGoal,
    streakHistory: isPlainObject(loaded.streakHistory)
      ? (loaded.streakHistory as Record<string, boolean>)
      : {},
    badgesUnlocked: Array.isArray(loaded.badgesUnlocked)
      ? (loaded.badgesUnlocked as string[])
      : [],
    customTempoByTabId: isPlainObject(loaded.customTempoByTabId)
      ? (loaded.customTempoByTabId as Record<string, number>)
      : {},
    importedTabs: hydrateImportedTabs(loaded.importedTabs),
    tabsCompletedCount: numberOr(loaded.tabsCompletedCount, 0),
    dailyProgress: isPlainObject(loaded.dailyProgress)
      ? (loaded.dailyProgress as Record<string, DailyProgress>)
      : {},
    completedExerciseIdsByDay: hydrateCompletedExerciseIdsByDay(loaded.completedExerciseIdsByDay),
  }
}
