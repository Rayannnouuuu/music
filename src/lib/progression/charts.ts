import { levelFromXp } from './xp'
import type { Category } from '../content/types'
import type { ProgressState } from './ProgressionContext'

export function aggregateXpByDay(
  xpLog: ProgressState['xpLog'],
): { date: string; total: number }[] {
  const totals = new Map<string, number>()
  for (const entry of xpLog) {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.xpGained)
  }
  return Array.from(totals.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function skillBreakdown(
  skillXp: Record<Category, number>,
): { category: Category; xp: number; level: number }[] {
  return (Object.entries(skillXp) as [Category, number][]).map(([category, xp]) => ({
    category,
    xp,
    level: levelFromXp(xp),
  }))
}
