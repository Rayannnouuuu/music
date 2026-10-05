import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Flame,
  MusicNotes,
  Waveform,
  Trophy,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle,
  Play,
} from '@phosphor-icons/react'
import { useProgression } from '../lib/progression/ProgressionContext'
import { pickDailyTab } from '../lib/progression/dailyPick'
import { xpToNext, cumulativeXpForLevel, levelFromXp, tierName } from '../lib/progression/xp'
import { currentStreak } from '../lib/progression/streak'
import { BADGES } from '../lib/progression/badges'
import { buildPath, flattenPath, nextExerciseId, CATEGORY_LABELS } from '../lib/progression/path'
import { loadAllExercises } from '../lib/content/loadExercises'
import { loadAllTabs } from '../lib/content/loadTabs'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import type { DailyGoal } from '../lib/progression/streak'
import { localDateString } from '../lib/date'

export default function DashboardPage() {
  const { state, setDailyGoal } = useProgression()
  const today = localDateString()

  const allExercises = useMemo(() => loadAllExercises(), [])
  const allTabs = useMemo(() => loadAllTabs(), [])
  const orderedIds = useMemo(
    () => flattenPath(buildPath(allExercises)).map((e) => e.id),
    [allExercises],
  )

  const nextId = nextExerciseId(orderedIds, state.completedExerciseIds)
  const nextExercise = nextId ? allExercises.find((e) => e.id === nextId) : undefined
  const doneCount = orderedIds.filter((id) => state.completedExerciseIds.includes(id)).length
  const pathComplete = orderedIds.length > 0 && doneCount === orderedIds.length

  const todaysTab = allTabs.length > 0 ? pickDailyTab(allTabs, today) : null

  const level = levelFromXp(state.xpTotal)
  const tier = tierName(level)
  const xpIntoLevel = state.xpTotal - cumulativeXpForLevel(level)
  const xpForNext = xpToNext(level)

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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {goalMetToday ? 'Bien joué aujourd’hui' : 'Prêt à jouer ?'}
        </h1>
        <p className="mt-1 text-text-muted">
          {streak > 0 ? `${streak} jour(s) de suite — continue sur ta lancée.` : 'Commence ton parcours du jour.'}
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
            <Flame size={15} className="text-warning" />
            Aujourd&rsquo;hui
          </p>

          {pathComplete ? (
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-xl font-semibold text-text">Parcours terminé — bravo !</p>
              <p className="text-text-muted">Tu as fini les {orderedIds.length} étapes. Rejoue tes tabs préférées en attendant la suite.</p>
              <Link to="/tabs">
                <Button>
                  Voir les tabs <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : nextExercise ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Link
                to={`/exercises/${nextExercise.id}`}
                className="flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-full bg-accent text-text shadow-[0_0_0_6px_var(--color-accent-soft)] transition-transform active:scale-95 sm:self-auto"
                aria-label="Commencer"
              >
                <Play size={26} weight="fill" />
              </Link>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <p className="text-sm text-text-muted">
                  {CATEGORY_LABELS[nextExercise.category] ?? nextExercise.category} · {doneCount}/
                  {orderedIds.length} étapes faites
                </p>
                <p className="text-xl font-semibold text-text">{nextExercise.title}</p>
              </div>
              <Link
                to={`/exercises/${nextExercise.id}`}
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] bg-accent px-5 py-3 text-sm font-semibold text-text transition-colors hover:bg-accent-strong"
              >
                {doneCount === 0 ? 'Commencer' : 'Continuer'} <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <p className="text-text-muted">Aucun exercice disponible pour l&rsquo;instant.</p>
          )}

          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${orderedIds.length > 0 ? (doneCount / orderedIds.length) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
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
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <span className="text-sm font-bold">{level}</span>
          </div>
          <div>
            <p className="font-semibold text-accent-strong">{tier}</p>
            <p className="text-xs text-text-muted">
              {xpIntoLevel}/{xpForNext} XP niveau {level + 1}
            </p>
          </div>
        </Card>

        <Card className="space-y-2 p-5">
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
