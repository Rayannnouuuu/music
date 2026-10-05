import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Flame,
  Barbell,
  MusicNotes,
  Waveform,
  Trophy,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react'
import { useProgression } from '../lib/progression/ProgressionContext'
import { pickDailyExercise, pickDailyTab } from '../lib/progression/dailyPick'
import { xpToNext, cumulativeXpForLevel, levelFromXp, tierName } from '../lib/progression/xp'
import { currentStreak } from '../lib/progression/streak'
import { BADGES } from '../lib/progression/badges'
import { loadAllExercises } from '../lib/content/loadExercises'
import { loadAllTabs } from '../lib/content/loadTabs'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import type { DailyGoal } from '../lib/progression/streak'
import { localDateString } from '../lib/date'

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function DashboardPage() {
  const { state, setDailyGoal } = useProgression()
  const today = localDateString()

  const allExercises = useMemo(() => loadAllExercises(), [])
  const allTabs = useMemo(() => loadAllTabs(), [])

  const todaysExercise =
    allExercises.length > 0 ? pickDailyExercise(allExercises, state.skillXp, today) : null
  const todaysTab = allTabs.length > 0 ? pickDailyTab(allTabs, today) : null

  const level = levelFromXp(state.xpTotal)
  const tier = tierName(level)
  const xpIntoLevel = state.xpTotal - cumulativeXpForLevel(level)
  const xpForNext = xpToNext(level)
  const progressFraction = Math.min(1, xpIntoLevel / xpForNext)

  const streak = currentStreak(state.streakHistory, today)
  const goalMetToday = state.streakHistory[today] === true
  const unlockedBadges = state.badgesUnlocked.length

  function handleGoalTypeChange(type: DailyGoal['type']) {
    setDailyGoal({ type, amount: state.dailyGoal.amount })
  }

  function handleGoalAmountChange(amount: number) {
    setDailyGoal({ type: state.dailyGoal.type, amount: Math.max(1, amount) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-text-muted">Prêt à jouer aujourd'hui ?</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center lg:col-span-2 lg:row-span-2">
          <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx={60}
                cy={60}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={10}
              />
              <motion.circle
                cx={60}
                cy={60}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - progressFraction) }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums text-text">{level}</span>
              <span className="text-xs uppercase tracking-wide text-text-muted">Niveau</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <p className="text-lg font-semibold text-accent-strong">{tier}</p>
            <p className="text-text-muted">
              {xpIntoLevel} / {xpForNext} XP jusqu'au niveau {level + 1}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressFraction * 100}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning"
              animate={streak > 0 ? { scale: [1, 1.08, 1] } : undefined}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame size={22} weight="fill" />
            </motion.div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-text">
                {streak} <span className="text-sm font-normal text-text-muted">jour(s)</span>
              </p>
              {goalMetToday && (
                <p className="flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle size={13} weight="fill" />
                  Objectif atteint
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-border-soft pt-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Objectif quotidien</p>
            <div className="flex items-center gap-1.5">
              {(['exercises', 'minutes'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleGoalTypeChange(type)}
                  className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    state.dailyGoal.type === type
                      ? 'border-accent-soft bg-accent-soft text-accent-strong'
                      : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
                  }`}
                >
                  {type === 'exercises' ? 'exercices' : 'minutes'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleGoalAmountChange(state.dailyGoal.amount - 1)}
              >
                <Minus size={14} />
              </Button>
              <span className="w-10 text-center font-mono text-sm tabular-nums text-text">
                {state.dailyGoal.amount}
              </span>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleGoalAmountChange(state.dailyGoal.amount + 1)}
              >
                <Plus size={14} />
              </Button>
              <span className="text-xs text-text-muted">par jour</span>
            </div>
          </div>
        </Card>

        <Card interactive className="p-5">
          {todaysExercise ? (
            <Link to={`/exercises/${todaysExercise.id}`} className="block space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
                <Barbell size={15} />
                Exercice du jour
              </div>
              <p className="font-semibold text-text">{todaysExercise.title}</p>
              <p className="text-sm text-text-muted">
                {todaysExercise.category} · difficulté {todaysExercise.difficulty}/10
              </p>
              <span className="flex items-center gap-1 text-sm font-medium text-accent-strong">
                Commencer <ArrowRight size={14} />
              </span>
            </Link>
          ) : (
            <p className="text-text-muted">Aucun exercice disponible pour l'instant.</p>
          )}
        </Card>

        <Card interactive className="p-5">
          {todaysTab ? (
            <Link to={`/tabs/${todaysTab.id}`} className="block space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
                <MusicNotes size={15} />
                Tab du jour
              </div>
              <p className="font-semibold text-text">{todaysTab.title}</p>
              <p className="text-sm text-text-muted">{todaysTab.artist}</p>
              <span className="flex items-center gap-1 text-sm font-medium text-accent-strong">
                Jouer <ArrowRight size={14} />
              </span>
            </Link>
          ) : (
            <p className="text-text-muted">Aucune tab disponible pour l'instant.</p>
          )}
        </Card>

        <Card interactive className="p-5">
          <Link to="/tuner" className="block space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
              <Waveform size={15} />
              Tuner
            </div>
            <p className="font-semibold text-text">Accorder ma guitare</p>
            <p className="text-sm text-text-muted">Détection en direct via le micro</p>
            <span className="flex items-center gap-1 text-sm font-medium text-accent-strong">
              Ouvrir <ArrowRight size={14} />
            </span>
          </Link>
        </Card>

        <Card interactive className="p-5">
          <Link to="/progression" className="block space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
              <Trophy size={15} />
              Badges
            </div>
            <p className="font-semibold text-text">
              {unlockedBadges} / {BADGES.length} débloqués
            </p>
            <p className="text-sm text-text-muted">Voir toute la progression</p>
            <span className="flex items-center gap-1 text-sm font-medium text-accent-strong">
              Explorer <ArrowRight size={14} />
            </span>
          </Link>
        </Card>
      </div>
    </div>
  )
}
