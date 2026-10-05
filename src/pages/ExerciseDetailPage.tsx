import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Gauge,
  Play,
  Lightbulb,
  Lock,
  Trophy,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { loadAllExercises } from '../lib/content/loadExercises'
import NoteHighway from '../components/tab/NoteHighway'
import TabPerformanceView from '../components/tab/TabPerformanceView'
import { totalBeatsForEvents } from '../lib/tab/noteLayout'
import { activeEventIndex, isEventActive } from '../lib/tab/playback'
import { useLoopPlayback, LEAD_IN_BEATS } from '../lib/tab/useLoopPlayback'
import { buildPath, flattenPath, isExerciseUnlocked, exerciseAfter, CATEGORY_LABELS } from '../lib/progression/path'
import { tipsFor } from '../content/tips'
import { findTuningById } from '../lib/audio/tunings'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import { useProgression, XP_PER_MINUTE } from '../lib/progression/ProgressionContext'
import { localDateString } from '../lib/date'

// How long the "bravo, on enchaîne" banner stays up before auto-navigating
// to the next step — long enough to register the XP toast, short enough
// that the path still feels continuous rather than stalled.
const AUTO_ADVANCE_DELAY_MS = 2800

export default function ExerciseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const allExercises = useMemo(() => loadAllExercises(), [])
  const exercise = allExercises.find((e) => e.id === id)
  const {
    state: progressState,
    completeExercise,
    completeExercisePractice,
    isExerciseCompletedToday,
    uncompleteExerciseToday,
  } = useProgression()
  const [justCompleted, setJustCompleted] = useState(false)
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const today = localDateString()

  const chapters = useMemo(() => buildPath(allExercises), [allExercises])
  const orderedIds = useMemo(() => flattenPath(chapters).map((e) => e.id), [chapters])
  const chapter = chapters.find((c) => c.category === exercise?.category)
  const positionInChapter = chapter && exercise ? chapter.exercises.findIndex((e) => e.id === exercise.id) : -1

  const unlocked = exercise ? isExerciseUnlocked(orderedIds, progressState.completedExerciseIds, exercise.id) : false
  const nextId = exercise ? exerciseAfter(orderedIds, exercise.id) : undefined
  const nextExercise = nextId ? allExercises.find((e) => e.id === nextId) : undefined

  const doneToday = exercise ? isExerciseCompletedToday(exercise.id, today) : false

  // Shared by the manual button, the 90%-note-accuracy validation, and the
  // "play a full clean pass" mastery check below: whichever happens first
  // grants the XP and kicks off the "flow into the next step" sequence.
  function handleNewCompletion() {
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 2500)
    if (nextId) setAutoAdvancing(true)
  }

  function handlePieceValidated() {
    if (doneToday || !exercise) return
    completeExercise(exercise, today)
    handleNewCompletion()
  }

  const totalBeats = exercise ? totalBeatsForEvents(exercise.pattern) : 4
  const {
    state,
    dispatch,
    togglePlayback,
    effectiveBpm,
    practiceSecondsRef,
    performanceOpen,
    countdown,
    misses,
    maxMisses,
    hitKeys,
    missedKeys,
    justFailed,
    enterPerformance,
    exitPerformance,
    restartPerformance,
    setMode,
    advanceBeat,
    handleNoteResult,
  } = useLoopPlayback({
    loopKey: exercise?.id ?? '',
    totalBeats,
    baseBpm: exercise?.targetBpm ?? 0,
    // Exercises are short riffs — a single wrong note during a real attempt
    // sends it back to the start, and a clean 45s pass counts as mastered
    // rather than looping forever.
    maxMisses: 1,
    targetCleanSeconds: 45,
    onMastered: handlePieceValidated,
    onStop: (minutesSpent) => {
      if (exercise) completeExercisePractice(exercise, minutesSpent, localDateString())
    },
  })

  // Cancel any pending auto-advance if the user navigates away first.
  useEffect(() => {
    if (!autoAdvancing || !nextId) return
    const timer = setTimeout(() => navigate(`/exercises/${nextId}`), AUTO_ADVANCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [autoAdvancing, nextId, navigate])

  if (!exercise) {
    return <p>Exercice introuvable.</p>
  }

  if (!unlocked) {
    return (
      <div className="space-y-6">
        <Link
          to="/exercises"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={15} />
          Exercices
        </Link>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-border text-text-muted">
              <Lock size={24} />
            </span>
            <p className="font-semibold text-text">Exercice verrouillé</p>
            <p className="max-w-sm text-sm text-text-muted">
              Termine les étapes précédentes du parcours pour débloquer celle-ci.
            </p>
            <Link
              to="/parcours"
              className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-strong"
            >
              Voir le parcours <ArrowRight size={15} />
            </Link>
          </Card>
        </motion.div>
      </div>
    )
  }

  const scrollPos = Math.min(totalBeats, Math.max(-LEAD_IN_BEATS, state.elapsedBeats))
  const candidateIndex = activeEventIndex(exercise.pattern, scrollPos)
  const activeEvent =
    candidateIndex >= 0 && isEventActive(exercise.pattern[candidateIndex], scrollPos)
      ? exercise.pattern[candidateIndex]
      : undefined
  const xpSoFar = Math.round((practiceSecondsRef.current / 60) * XP_PER_MINUTE)
  const tips = tipsFor(exercise.category, exercise.difficulty)

  function handleComplete() {
    if (doneToday) return
    completeExercise(exercise!, today)
    handleNewCompletion()
  }

  function handleUndo() {
    uncompleteExerciseToday(exercise!, today)
    setJustCompleted(false)
    setAutoAdvancing(false)
  }

  function handleSpeedChange(percent: number) {
    dispatch({ type: 'setSpeed', percent })
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {performanceOpen && (
          <TabPerformanceView
            title={exercise.title}
            artist={`${CATEGORY_LABELS[exercise.category] ?? exercise.category} · niveau ${
              positionInChapter + 1
            }/${chapter?.exercises.length ?? '?'}`}
            loopEvents={exercise.pattern}
            loopLength={totalBeats}
            scrollPos={scrollPos}
            activeEvent={activeEvent}
            tuning={findTuningById(progressState.guitarTuningId)}
            effectiveBpm={effectiveBpm}
            speedPercent={state.speedPercent}
            onSpeedChange={handleSpeedChange}
            isPlaying={state.status === 'playing'}
            onTogglePause={togglePlayback}
            onExit={exitPerformance}
            xpSoFar={xpSoFar}
            onPieceValidated={handlePieceValidated}
            countdown={countdown}
            mode={state.mode}
            onModeChange={setMode}
            misses={misses}
            maxMisses={maxMisses}
            justFailed={justFailed}
            onRestart={restartPerformance}
            hitKeys={hitKeys}
            missedKeys={missedKeys}
            onNoteResult={handleNoteResult}
            onAdvanceBeat={advanceBeat}
          />
        )}
      </AnimatePresence>

      <Link
        to="/exercises"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={15} />
        Exercices
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{exercise.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge className="capitalize">{exercise.category}</Badge>
          {chapter && positionInChapter >= 0 && (
            <Badge>
              Niveau {positionInChapter + 1}/{chapter.exercises.length}
            </Badge>
          )}
          <Badge>
            <Gauge size={13} />
            {exercise.targetBpm} BPM
          </Badge>
          <Badge>
            <DifficultyMeter value={exercise.difficulty} />
          </Badge>
        </div>
      </div>

      <p className="max-w-2xl text-text-muted">{exercise.description}</p>

      <Card className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={enterPerformance}
            aria-label="Lecture"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-text transition-shadow"
          >
            <Play size={28} weight="fill" />
          </motion.button>
          <div className="space-y-1">
            <p className="font-semibold text-text">Jouer avec le métronome</p>
            <p className="text-xs text-text-muted">
              Un compte à rebours lance l'exercice en plein écran à {exercise.targetBpm} BPM. Une seule
              fausse note repart du début — tiens 45 secondes sans erreur pour le valider. Le mode
              entraînement (dans la vue plein écran) enlève la pression du tempo pour répéter à ton rythme.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-input)] bg-bg/60 p-4">
          <NoteHighway events={exercise.pattern} totalBeats={totalBeats} />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
          <Lightbulb size={15} />
          Astuces
        </p>
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleComplete} disabled={doneToday} variant={doneToday ? 'secondary' : 'primary'}>
          <CheckCircle size={18} weight="fill" />
          {doneToday ? 'Fait aujourd’hui' : 'Marquer comme fait'}
        </Button>

        {doneToday && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3.5 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent-soft hover:text-text"
          >
            <ArrowCounterClockwise size={15} />
            Annuler
          </button>
        )}

        <AnimatePresence>
          {justCompleted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-success-soft px-3 py-1.5 text-sm font-semibold text-success"
            >
              <CheckCircle size={16} weight="fill" />+{exercise.xpReward} XP
            </motion.span>
          )}
        </AnimatePresence>

        {doneToday && !justCompleted && !autoAdvancing && (
          <p className="text-sm text-text-muted">
            Déjà comptabilisé aujourd&rsquo;hui — reviens demain pour plus d&rsquo;XP.
          </p>
        )}
      </div>

      <AnimatePresence mode="sync">
        {autoAdvancing && nextExercise ? (
          <motion.div
            key="auto-advancing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="flex items-center justify-between gap-4 border-accent-soft bg-accent-soft/40 p-5">
              <div>
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-accent-strong">
                  <Trophy size={13} weight="fill" />
                  Bravo ! On enchaîne
                </p>
                <p className="font-semibold text-text">{nextExercise.title}</p>
              </div>
              <Link
                to={`/exercises/${nextExercise.id}`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-strong"
              >
                Continuer <ArrowRight size={15} />
              </Link>
            </Card>
          </motion.div>
        ) : doneToday && !nextExercise ? (
          <motion.div
            key="path-complete"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <Trophy size={28} weight="fill" className="text-accent-strong" />
              <p className="font-semibold text-text">Parcours terminé !</p>
              <p className="text-sm text-text-muted">Tu as fini les {orderedIds.length} étapes. Bravo.</p>
            </Card>
          </motion.div>
        ) : (
          nextExercise && (
            <motion.div
              key="suite"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Suite du parcours</p>
                  <p className="font-semibold text-text">{nextExercise.title}</p>
                </div>
                {doneToday ? (
                  <Link
                    to={`/exercises/${nextExercise.id}`}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-strong"
                  >
                    Continuer <ArrowRight size={15} />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] border border-border px-4 py-2.5 text-sm font-medium text-text-muted">
                    <Lock size={14} />
                    Termine celui-ci d&rsquo;abord
                  </span>
                )}
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  )
}
