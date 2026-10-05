import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProgression } from '../lib/progression/ProgressionContext'
import { pickDailyExercise, pickDailyTab } from '../lib/progression/dailyPick'
import { xpToNext, cumulativeXpForLevel, levelFromXp, tierName } from '../lib/progression/xp'
import { currentStreak } from '../lib/progression/streak'
import { loadAllExercises } from '../lib/content/loadExercises'
import { loadAllTabs } from '../lib/content/loadTabs'
import MetronomeWidget from '../components/audio/MetronomeWidget'
import type { DailyGoal } from '../lib/progression/streak'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { state, setDailyGoal } = useProgression()
  const today = todayString()

  const allExercises = useMemo(() => loadAllExercises(), [])
  const allTabs = useMemo(() => loadAllTabs(), [])

  const todaysExercise =
    allExercises.length > 0 ? pickDailyExercise(allExercises, state.skillXp, today) : null
  const todaysTab = allTabs.length > 0 ? pickDailyTab(allTabs, today) : null

  const level = levelFromXp(state.xpTotal)
  const tier = tierName(level)
  const xpIntoLevel = state.xpTotal - cumulativeXpForLevel(level)
  const xpForNext = xpToNext(level)
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100))

  const streak = currentStreak(state.streakHistory, today)
  const goalMetToday = state.streakHistory[today] === true

  function handleGoalTypeChange(type: DailyGoal['type']) {
    setDailyGoal({ type, amount: state.dailyGoal.amount })
  }

  function handleGoalAmountChange(amount: number) {
    setDailyGoal({ type: state.dailyGoal.type, amount })
  }

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      <section className="bg-panel border border-border rounded-lg p-4 space-y-2">
        <p className="text-text-muted text-sm">
          Niveau {level} · {tier}
        </p>
        <div className="h-2 bg-bg border border-border rounded overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-text-muted text-sm">
          {xpIntoLevel} / {xpForNext} XP jusqu'au niveau {level + 1}
        </p>
      </section>

      <section className="bg-panel border border-border rounded-lg p-4 space-y-3">
        <p>
          🔥 Streak actuel : <span className="text-accent font-semibold">{streak} jour(s)</span>
          {goalMetToday ? ' — objectif du jour atteint' : ''}
        </p>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            Objectif
            <select
              value={state.dailyGoal.type}
              onChange={(e) => handleGoalTypeChange(e.target.value as DailyGoal['type'])}
              className="bg-bg text-text border border-border rounded px-2 py-1"
            >
              <option value="exercises">exercices</option>
              <option value="minutes">minutes</option>
            </select>
          </label>
          <input
            type="number"
            min={1}
            value={state.dailyGoal.amount}
            onChange={(e) => handleGoalAmountChange(Number(e.target.value))}
            className="bg-bg text-text border border-border rounded px-2 py-1 w-16"
          />
          <span className="text-text-muted">par jour</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="bg-panel border border-border rounded-lg p-4 space-y-2">
          <p className="text-text-muted text-sm">Exercice du jour</p>
          {todaysExercise ? (
            <Link to={`/exercises/${todaysExercise.id}`} className="text-accent font-semibold">
              {todaysExercise.title}
            </Link>
          ) : (
            <p className="text-text-muted">Aucun exercice disponible pour l'instant.</p>
          )}
        </div>

        <div className="bg-panel border border-border rounded-lg p-4 space-y-2">
          <p className="text-text-muted text-sm">Tab du jour</p>
          {todaysTab ? (
            <Link to={`/tabs/${todaysTab.id}`} className="text-accent font-semibold">
              {todaysTab.title} — {todaysTab.artist}
            </Link>
          ) : (
            <p className="text-text-muted">Aucune tab disponible pour l'instant.</p>
          )}
        </div>
      </section>

      <section className="flex items-center gap-4">
        <Link to="/tuner" className="text-accent font-semibold">
          Ouvrir le tuner
        </Link>
        <MetronomeWidget />
      </section>
    </div>
  )
}
