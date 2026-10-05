import { useParams } from 'react-router-dom'
import { loadAllExercises } from '../lib/content/loadExercises'
import TabStaticView from '../components/tab/TabStaticView'
import { useProgression } from '../lib/progression/ProgressionContext'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ExerciseDetailPage() {
  const { id } = useParams()
  const exercise = loadAllExercises().find((e) => e.id === id)
  const { completeExercise } = useProgression()

  if (!exercise) {
    return <p>Exercice introuvable.</p>
  }

  return (
    <div className="space-y-4">
      <h1>{exercise.title}</h1>
      <p className="text-text-muted">
        {exercise.category} · difficulté {exercise.difficulty}/10 · {exercise.targetBpm} BPM
      </p>
      <p>{exercise.description}</p>

      <TabStaticView measure={{ events: exercise.pattern }} />

      <button
        className="text-accent font-semibold"
        onClick={() => completeExercise(exercise, todayString())}
      >
        Marquer comme fait
      </button>
    </div>
  )
}
