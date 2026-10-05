import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAllExercises, filterExercises } from '../lib/content/loadExercises'
import type { Category } from '../lib/content/types'

export default function ExercisesListPage() {
  const allExercises = useMemo(() => loadAllExercises(), [])
  const categories = useMemo(
    () => Array.from(new Set(allExercises.map((e) => e.category))).sort(),
    [allExercises],
  )

  const [category, setCategory] = useState<Category | ''>('')
  const [maxDifficulty, setMaxDifficulty] = useState(10)

  const exercises = filterExercises(allExercises, {
    category: category || undefined,
    maxDifficulty,
  })

  return (
    <div className="space-y-4">
      <h1>Exercices</h1>

      <div className="flex flex-wrap gap-4 bg-panel border border-border rounded-lg p-3">
        <label className="flex items-center gap-2 text-sm">
          Catégorie
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | '')}
            className="bg-bg text-text border border-border rounded px-2 py-1"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Difficulté max {maxDifficulty}
          <input
            type="range"
            min={1}
            max={10}
            value={maxDifficulty}
            onChange={(e) => setMaxDifficulty(Number(e.target.value))}
          />
        </label>
      </div>

      {exercises.length === 0 ? (
        <p className="text-text-muted">Aucun exercice ne correspond à ces filtres.</p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                to={`/exercises/${exercise.id}`}
                className="block bg-panel border border-border rounded-lg p-3 hover:border-accent"
              >
                <span className="font-semibold">{exercise.title}</span>
                <span className="text-text-muted text-sm">
                  {' '}
                  · {exercise.category} · difficulté {exercise.difficulty}/10 · {exercise.targetBpm}{' '}
                  BPM
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
