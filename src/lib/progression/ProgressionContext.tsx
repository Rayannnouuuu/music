import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadJSON, saveJSON } from '../storage'
import { levelFromXp } from './xp'
import {
  isGoalMet,
  recordCompletion,
  currentStreak,
  type DailyGoal,
  type DailyProgress,
} from './streak'
import { evaluateBadges, type BadgeCheckInput } from './badges'
import type { Category, Exercise, Tab } from '../content/types'

const STORAGE_KEY = 'guitar-progress'
const XP_PER_MINUTE = 5

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
}

const defaultProgressState: ProgressState = {
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
}

function skillLevels(skillXp: Record<Category, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(skillXp).map(([category, xp]) => [category, levelFromXp(xp)]),
  )
}

interface ProgressionContextValue {
  state: ProgressState
  completeExercise(exercise: Exercise, today: string): void
  completeTabPractice(tab: Tab, minutesSpent: number, today: string): void
  setDailyGoal(goal: DailyGoal): void
  importTab(tab: Tab): void
  setTempoForTab(tabId: string, bpm: number): void
}

const ProgressionContext = createContext<ProgressionContextValue | null>(null)

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() =>
    loadJSON(STORAGE_KEY, defaultProgressState),
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

  const value: ProgressionContextValue = {
    state,
    completeExercise(exercise, today) {
      setState((prev) =>
        applyXpGain(prev, today, exercise.xpReward, exercise.category, { exercisesCount: 1 }, 0),
      )
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
    setTempoForTab(tabId, bpm) {
      setState((prev) => ({
        ...prev,
        customTempoByTabId: { ...prev.customTempoByTabId, [tabId]: bpm },
      }))
    },
  }

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>
}

export function useProgression(): ProgressionContextValue {
  const ctx = useContext(ProgressionContext)
  if (!ctx) throw new Error('useProgression must be used within a ProgressionProvider')
  return ctx
}
