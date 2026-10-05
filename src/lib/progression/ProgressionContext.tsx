import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadJSON, saveJSON } from '../storage'
import { levelFromXp } from './xp'
import { isGoalMet, recordCompletion, currentStreak, type DailyGoal, type DailyProgress } from './streak'
import { evaluateBadges, type BadgeCheckInput } from './badges'
import { hydrateProgressState, type ProgressState } from './progressState'
import { hasCompletedExerciseToday, recordExerciseCompletion } from './completion'
import type { Category, Exercise, Tab } from '../content/types'

export type { ProgressState } from './progressState'

const STORAGE_KEY = 'guitar-progress'
export const XP_PER_MINUTE = 5

function skillLevels(skillXp: Record<Category, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(skillXp).map(([category, xp]) => [category, levelFromXp(xp)]),
  )
}

interface ProgressionContextValue {
  state: ProgressState
  completeExercise(exercise: Exercise, today: string): void
  completeExercisePractice(exercise: Exercise, minutesSpent: number, today: string): void
  completeTabPractice(tab: Tab, minutesSpent: number, today: string): void
  setDailyGoal(goal: DailyGoal): void
  importTab(tab: Tab): void
  deleteImportedTab(tabId: string): void
  setTempoForTab(tabId: string, bpm: number): void
  isExerciseCompletedToday(exerciseId: string, today: string): boolean
  setAutoDetectEnabled(enabled: boolean): void
}

const ProgressionContext = createContext<ProgressionContextValue | null>(null)

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() =>
    hydrateProgressState(loadJSON<unknown>(STORAGE_KEY, null)),
  )

  useEffect(() => {
    saveJSON(STORAGE_KEY, state)
  }, [state])

  function applyXpGain(
    prev: ProgressState,
    today: string,
    xpGained: number,
    category: Category | null,
    progressDelta: Partial<DailyProgress>,
    tabsCompletedDelta: number,
  ): ProgressState {
    const skillXp = category
      ? { ...prev.skillXp, [category]: prev.skillXp[category] + xpGained }
      : prev.skillXp
    const xpLog = [...prev.xpLog, { date: today, xpGained }]

    const previousTodayProgress = prev.dailyProgress[today] ?? { minutes: 0, exercisesCount: 0 }
    const todayProgress: DailyProgress = {
      minutes: previousTodayProgress.minutes + (progressDelta.minutes ?? 0),
      exercisesCount: previousTodayProgress.exercisesCount + (progressDelta.exercisesCount ?? 0),
    }
    const dailyProgress = { ...prev.dailyProgress, [today]: todayProgress }

    const met = isGoalMet(todayProgress, prev.dailyGoal)
    const streakHistory = recordCompletion(prev.streakHistory, today, met)
    const tabsCompletedCount = prev.tabsCompletedCount + tabsCompletedDelta

    const badgeInput: BadgeCheckInput = {
      streakCurrent: currentStreak(streakHistory, today),
      globalLevel: levelFromXp(prev.xpTotal + xpGained),
      skillLevels: skillLevels(skillXp),
      tabsCompletedCount,
    }
    const newlyUnlocked = evaluateBadges(badgeInput, prev.badgesUnlocked)

    return {
      ...prev,
      xpTotal: prev.xpTotal + xpGained,
      skillXp,
      xpLog,
      dailyProgress,
      streakHistory,
      tabsCompletedCount,
      badgesUnlocked: [...prev.badgesUnlocked, ...newlyUnlocked],
    }
  }

  function markExerciseEverCompleted(prev: ProgressState, exerciseId: string): ProgressState {
    if (prev.completedExerciseIds.includes(exerciseId)) return prev
    return { ...prev, completedExerciseIds: [...prev.completedExerciseIds, exerciseId] }
  }

  const value: ProgressionContextValue = {
    state,
    completeExercise(exercise, today) {
      setState((prev) => {
        const everCompleted = markExerciseEverCompleted(prev, exercise.id)
        if (hasCompletedExerciseToday(prev.completedExerciseIdsByDay, today, exercise.id)) {
          return everCompleted
        }
        const withCompletion: ProgressState = {
          ...everCompleted,
          completedExerciseIdsByDay: recordExerciseCompletion(
            everCompleted.completedExerciseIdsByDay,
            today,
            exercise.id,
          ),
        }
        return applyXpGain(
          withCompletion,
          today,
          exercise.xpReward,
          exercise.category,
          { exercisesCount: 1 },
          0,
        )
      })
    },
    completeExercisePractice(exercise, minutesSpent, today) {
      const xpGained = Math.round(minutesSpent * XP_PER_MINUTE)
      setState((prev) => {
        const everCompleted = markExerciseEverCompleted(prev, exercise.id)
        return applyXpGain(everCompleted, today, xpGained, exercise.category, { minutes: minutesSpent }, 0)
      })
    },
    completeTabPractice(_tab, minutesSpent, today) {
      const xpGained = Math.round(minutesSpent * XP_PER_MINUTE)
      setState((prev) => applyXpGain(prev, today, xpGained, 'rhythm', { minutes: minutesSpent }, 1))
    },
    setDailyGoal(goal) {
      setState((prev) => ({ ...prev, dailyGoal: goal }))
    },
    importTab(tab) {
      setState((prev) => ({ ...prev, importedTabs: [...prev.importedTabs, tab] }))
    },
    deleteImportedTab(tabId) {
      setState((prev) => ({
        ...prev,
        importedTabs: prev.importedTabs.filter((t) => t.id !== tabId),
      }))
    },
    setTempoForTab(tabId, bpm) {
      setState((prev) => ({
        ...prev,
        customTempoByTabId: { ...prev.customTempoByTabId, [tabId]: bpm },
      }))
    },
    isExerciseCompletedToday(exerciseId, today) {
      return hasCompletedExerciseToday(state.completedExerciseIdsByDay, today, exerciseId)
    },
    setAutoDetectEnabled(enabled) {
      setState((prev) => ({ ...prev, autoDetectEnabled: enabled }))
    },
  }

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>
}

export function useProgression(): ProgressionContextValue {
  const ctx = useContext(ProgressionContext)
  if (!ctx) throw new Error('useProgression must be used within a ProgressionProvider')
  return ctx
}
