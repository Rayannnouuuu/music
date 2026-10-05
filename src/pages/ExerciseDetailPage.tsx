import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CheckCircle, Gauge } from '@phosphor-icons/react'
import { loadAllExercises } from '../lib/content/loadExercises'
import TabStaticView from '../components/tab/TabStaticView'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import { useProgression } from '../lib/progression/ProgressionContext'
import { localDateString } from '../lib/date'

export default function ExerciseDetailPage() {
  const { id } = useParams()
  const exercise = loadAllExercises().find((e) => e.id === id)
  const { completeExercise } = useProgression()
  const [justCompleted, setJustCompleted] = useState(false)

  if (!exercise) {
    return <p>Exercice introuvable.</p>
  }

  function handleComplete() {
    completeExercise(exercise!, localDateString())
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 2500)
  }

  return (
    <div className="space-y-6">
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

      <Card className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-wide text-text-muted">Tablature</p>
        <div className="overflow-x-auto rounded-[var(--radius-input)] bg-bg/60 p-4">
          <TabStaticView measure={{ events: exercise.pattern }} />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleComplete}>
          <CheckCircle size={18} weight="fill" />
          Marquer comme fait
        </Button>

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
      </div>
    </div>
  )
}
