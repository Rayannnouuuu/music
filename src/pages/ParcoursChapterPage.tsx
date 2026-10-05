import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, CheckCircle, Lock, Play } from '@phosphor-icons/react'
import { loadAllExercises } from '../lib/content/loadExercises'
import { buildPath, flattenPath, isExerciseUnlocked, nextExerciseId, CATEGORY_LABELS } from '../lib/progression/path'
import { useProgression } from '../lib/progression/ProgressionContext'
import { CHAPTER_ICONS } from './parcoursShared'
import { Card } from '../components/ui/Card'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import { staggerContainer, fadeInScale, shake } from '../lib/motion/variants'
import type { Category } from '../lib/content/types'

export default function ParcoursChapterPage() {
  const { category } = useParams<{ category: string }>()
  const allExercises = useMemo(() => loadAllExercises(), [])
  const chapters = useMemo(() => buildPath(allExercises), [allExercises])
  const orderedIds = useMemo(() => flattenPath(chapters).map((e) => e.id), [chapters])
  const { state } = useProgression()
  const completedIds = state.completedExerciseIds
  const upNextId = nextExerciseId(orderedIds, completedIds)
  const [shakingId, setShakingId] = useState<string | null>(null)

  const chapterIndex = chapters.findIndex((c) => c.category === category)
  const chapter = chapters[chapterIndex]

  if (!chapter) {
    return <p>Chapitre introuvable.</p>
  }

  function handleLockedClick(id: string) {
    setShakingId(id)
    setTimeout(() => setShakingId((current) => (current === id ? null : current)), 400)
  }

  const ChapterIcon = CHAPTER_ICONS[chapterIndex % CHAPTER_ICONS.length]
  const doneInChapter = chapter.exercises.filter((e) => completedIds.includes(e.id)).length

  return (
    <div className="space-y-6">
      <Link
        to="/parcours"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={15} />
        Parcours
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <ChapterIcon size={22} />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Chapitre {chapterIndex + 1}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {CATEGORY_LABELS[category as Category]}
          </h1>
        </div>
        <span className="ml-auto text-sm text-text-muted">
          {doneInChapter}/{chapter.exercises.length} terminés
        </span>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto pb-2">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="relative flex w-max gap-7 pt-7"
          >
            <div className="absolute left-0 right-0 top-14 h-px bg-border-soft" />
            {chapter.exercises.map((exercise, i) => {
              const completed = completedIds.includes(exercise.id)
              const unlocked = isExerciseUnlocked(orderedIds, completedIds, exercise.id)
              const isUpNext = exercise.id === upNextId

              const node = (
                <motion.div
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors ${
                    completed
                      ? 'border-success bg-success-soft text-success'
                      : isUpNext
                        ? 'border-accent bg-accent text-text shadow-[0_0_0_6px_var(--color-accent-soft)]'
                        : unlocked
                          ? 'border-accent-soft bg-panel-raised text-accent-strong'
                          : 'border-border bg-panel-raised text-text-muted'
                  }`}
                  animate={
                    isUpNext
                      ? { scale: [1, 1.08, 1] }
                      : shakingId === exercise.id
                        ? shake
                        : undefined
                  }
                  transition={isUpNext ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  whileHover={unlocked ? { scale: 1.08 } : undefined}
                  whileTap={unlocked ? { scale: 0.95 } : undefined}
                >
                  {completed ? (
                    <CheckCircle size={24} weight="fill" />
                  ) : unlocked ? (
                    isUpNext ? (
                      <Play size={20} weight="fill" />
                    ) : (
                      i + 1
                    )
                  ) : (
                    <Lock size={18} />
                  )}
                </motion.div>
              )

              return (
                <motion.div
                  key={exercise.id}
                  variants={fadeInScale}
                  className="flex w-28 shrink-0 flex-col items-center gap-2 text-center"
                >
                  {unlocked ? (
                    <Link to={`/exercises/${exercise.id}`} aria-label={exercise.title}>
                      {node}
                    </Link>
                  ) : (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`${exercise.title} (verrouillé)`}
                      className="cursor-not-allowed"
                      onClick={() => handleLockedClick(exercise.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleLockedClick(exercise.id)
                      }}
                    >
                      {node}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p
                      className={`line-clamp-2 text-xs font-medium leading-tight ${
                        unlocked ? 'text-text' : 'text-text-muted'
                      }`}
                    >
                      {exercise.title}
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <DifficultyMeter value={exercise.difficulty} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Card>
    </div>
  )
}
