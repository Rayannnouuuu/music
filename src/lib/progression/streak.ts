export interface DailyGoal {
  type: 'minutes' | 'exercises'
  amount: number
}

export interface DailyProgress {
  minutes: number
  exercisesCount: number
}

export function isGoalMet(progress: DailyProgress, goal: DailyGoal): boolean {
  if (goal.type === 'minutes') return progress.minutes >= goal.amount
  return progress.exercisesCount >= goal.amount
}

export function recordCompletion(
  history: Record<string, boolean>,
  date: string,
  met: boolean,
): Record<string, boolean> {
  return { ...history, [date]: met }
}

function shiftDay(dateStr: string, delta: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

const SAFETY_BOUND_DAYS = 3650

export function currentStreak(history: Record<string, boolean>, today: string): number {
  let count = 0
  let cursor = today

  for (let i = 0; i < SAFETY_BOUND_DAYS; i++) {
    const met = history[cursor] === true
    if (met) {
      count++
    } else if (cursor !== today) {
      break
    }
    cursor = shiftDay(cursor, -1)
  }

  return count
}

export function longestStreak(history: Record<string, boolean>): number {
  const trueDates = Object.keys(history)
    .filter((date) => history[date] === true)
    .sort()

  let longest = 0
  let current = 0
  let previousDate: string | null = null

  for (const date of trueDates) {
    current = previousDate !== null && shiftDay(previousDate, 1) === date ? current + 1 : 1
    longest = Math.max(longest, current)
    previousDate = date
  }

  return longest
}
