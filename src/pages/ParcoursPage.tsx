import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, CaretRight } from '@phosphor-icons/react'
import { loadAllExercises } from '../lib/content/loadExercises'
import { buildPath, flattenPath, nextExerciseId, CATEGORY_LABELS } from '../lib/progression/path'
import { useProgression } from '../lib/progression/ProgressionContext'
import { Card } from '../components/ui/Card'
import { CHAPTER_ICONS } from './parcoursShared'

export default function ParcoursPage() {
  const allExercises = useMemo(() => loadAllExercises(), [])
  const chapters = useMemo(() => buildPath(allExercises), [allExercises])
  const orderedIds = useMemo(() => flattenPath(chapters).map((e) => e.id), [chapters])
  const { state } = useProgression()
  const completedIds = state.completedExerciseIds

  const totalCount = orderedIds.length
  const doneCount = orderedIds.filter((id) => completedIds.includes(id)).length
  const upNextId = nextExerciseId(orderedIds, completedIds)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Parcours</h1>
        <p className="mt-1 text-text-muted">
          Un chemin guidé à travers les {totalCount} exercices, du plus simple au plus avancé — ouvre un
          chapitre pour voir ses étapes, termine une étape pour débloquer la suivante.
        </p>
      </div>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">
            {doneCount} / {totalCount} étapes terminées
          </span>
          <span className="font-mono text-text-muted">{Math.round((doneCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / totalCount) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {upNextId && (
          <Link
            to={`/exercises/${upNextId}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline"
          >
            Continuer le parcours <ArrowRight size={15} />
          </Link>
        )}
      </Card>

      <div className="space-y-3">
        {chapters.map((chapter, chapterIndex) => {
          const ChapterIcon = CHAPTER_ICONS[chapterIndex % CHAPTER_ICONS.length]
          const doneInChapter = chapter.exercises.filter((e) => completedIds.includes(e.id)).length
          return (
            <Link key={chapter.category} to={`/parcours/${chapter.category}`}>
              <Card interactive className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <ChapterIcon size={19} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Chapitre {chapterIndex + 1}</p>
                  <h2 className="font-semibold text-text">{CATEGORY_LABELS[chapter.category]}</h2>
                </div>
                <span className="ml-auto flex items-center gap-3">
                  <span className="text-sm text-text-muted">
                    {doneInChapter}/{chapter.exercises.length}
                  </span>
                  <CaretRight size={16} className="text-text-muted" />
                </span>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
