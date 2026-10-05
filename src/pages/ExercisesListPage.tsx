import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Barbell, Gauge, ArrowRight, Lock } from '@phosphor-icons/react'
import { loadAllExercises, filterExercises } from '../lib/content/loadExercises'
import { buildPath, flattenPath, isExerciseUnlocked } from '../lib/progression/path'
import { useProgression } from '../lib/progression/ProgressionContext'
import { Card } from '../components/ui/Card'
import { Slider } from '../components/ui/Slider'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import type { Category } from '../lib/content/types'

export default function ExercisesListPage() {
  const allExercises = useMemo(() => loadAllExercises(), [])
  const categories = useMemo(
    () => Array.from(new Set(allExercises.map((e) => e.category))).sort(),
    [allExercises],
  )
  const orderedIds = useMemo(() => flattenPath(buildPath(allExercises)).map((e) => e.id), [allExercises])
  const { state: progressState } = useProgression()

  const [category, setCategory] = useState<Category | ''>('')
  const [maxDifficulty, setMaxDifficulty] = useState(10)

  const exercises = filterExercises(allExercises, {
    category: category || undefined,
    maxDifficulty,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Exercices</h1>
        <p className="mt-1 text-text-muted">
          {allExercises.length} exercices à pratiquer — débloqués au fil du{' '}
          <Link to="/parcours" className="text-accent-strong hover:underline">
            parcours
          </Link>
          .
        </p>
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory('')}
            className={`rounded-[var(--radius-control)] border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === ''
                ? 'border-accent-soft bg-accent-soft text-accent-strong'
                : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
            }`}
          >
            Toutes
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-[var(--radius-control)] border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                category === c
                  ? 'border-accent-soft bg-accent-soft text-accent-strong'
                  : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="max-w-xs">
          <Slider
            label="Difficulté max"
            value={maxDifficulty}
            min={1}
            max={10}
            onChange={setMaxDifficulty}
          />
        </div>
      </Card>

      {exercises.length === 0 ? (
        <Card className="p-8 text-center text-text-muted">
          Aucun exercice ne correspond à ces filtres.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((exercise) => {
            const unlocked = isExerciseUnlocked(orderedIds, progressState.completedExerciseIds, exercise.id)
            const card = (
              <Card
                interactive={unlocked}
                className={`flex h-full flex-col gap-3 p-5 ${unlocked ? '' : 'opacity-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      unlocked ? 'bg-accent-soft text-accent-strong' : 'bg-border text-text-muted'
                    }`}
                  >
                    {unlocked ? <Barbell size={17} /> : <Lock size={15} />}
                  </span>
                  <span className="text-xs capitalize text-text-muted">{exercise.category}</span>
                </div>
                <p className="flex-1 font-semibold text-text">{exercise.title}</p>
                <div className="flex items-center justify-between">
                  <DifficultyMeter value={exercise.difficulty} />
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Gauge size={13} />
                    {exercise.targetBpm} BPM
                  </span>
                </div>
                {unlocked ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-accent-strong">
                    Voir <ArrowRight size={14} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-text-muted">
                    <Lock size={12} />
                    Verrouillé
                  </span>
                )}
              </Card>
            )
            return unlocked ? (
              <Link key={exercise.id} to={`/exercises/${exercise.id}`}>
                {card}
              </Link>
            ) : (
              <div key={exercise.id} aria-label={`${exercise.title} (verrouillé)`}>
                {card}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
