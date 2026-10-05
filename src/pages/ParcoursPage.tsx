import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  CheckCircle,
  Lock,
  Play,
  ArrowRight,
  CaretDown,
  type Icon,
  Guitar,
  MusicNotes,
  Waveform,
} from '@phosphor-icons/react'
import { loadAllExercises } from '../lib/content/loadExercises'
import { buildPath, flattenPath, isExerciseUnlocked, nextExerciseId, type PathChapter } from '../lib/progression/path'
import { useProgression } from '../lib/progression/ProgressionContext'
import { Card } from '../components/ui/Card'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import type { Category } from '../lib/content/types'

const CATEGORY_LABELS: Record<Category, string> = {
  scales: 'Gammes',
  legato: 'Legato',
  picking: 'Picking',
  bends: 'Bends',
  palmMuting: 'Palm muting',
  sweep: 'Sweep picking',
  rhythm: 'Rythmique',
  arpeggios: 'Arpèges',
}

const CHAPTER_ICONS: Icon[] = [Guitar, MusicNotes, Waveform]

export default function ParcoursPage() {
  const allExercises = useMemo(() => loadAllExercises(), [])
  const chapters = useMemo(() => buildPath(allExercises), [allExercises])
  const orderedIds = useMemo(() => flattenPath(chapters).map((e) => e.id), [chapters])
  const { state } = useProgression()
  const completedIds = state.completedExerciseIds

  const totalCount = orderedIds.length
  const doneCount = orderedIds.filter((id) => completedIds.includes(id)).length
  const upNextId = nextExerciseId(orderedIds, completedIds)
  const upNextCategory = allExercises.find((e) => e.id === upNextId)?.category

  const [openCategory, setOpenCategory] = useState<Category | null>(
    upNextCategory ?? chapters[0]?.category ?? null,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Parcours</h1>
        <p className="mt-1 text-text-muted">
          Un chemin guidé à travers les {totalCount} exercices, du plus simple au plus avancé — clique sur un
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
        {chapters.map((chapter, chapterIndex) => (
          <ChapterAccordion
            key={chapter.category}
            chapter={chapter}
            chapterIndex={chapterIndex}
            orderedIds={orderedIds}
            completedIds={completedIds}
            upNextId={upNextId}
            open={openCategory === chapter.category}
            onToggle={() =>
              setOpenCategory((current) => (current === chapter.category ? null : chapter.category))
            }
          />
        ))}
      </div>
    </div>
  )
}

function ChapterAccordion({
  chapter,
  chapterIndex,
  orderedIds,
  completedIds,
  upNextId,
  open,
  onToggle,
}: {
  chapter: PathChapter
  chapterIndex: number
  orderedIds: string[]
  completedIds: string[]
  upNextId: string | undefined
  open: boolean
  onToggle: () => void
}) {
  const ChapterIcon = CHAPTER_ICONS[chapterIndex % CHAPTER_ICONS.length]
  const doneInChapter = chapter.exercises.filter((e) => completedIds.includes(e.id)).length

  return (
    <Card className="overflow-hidden p-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-panel-hover"
      >
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
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <CaretDown size={16} className="text-text-muted" />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto border-t border-border-soft px-5 pb-5 pt-6">
              <div className="relative flex w-max gap-6">
                <div className="absolute left-0 right-0 top-7 h-px bg-border-soft" />
                {chapter.exercises.map((exercise, i) => {
                  const completed = completedIds.includes(exercise.id)
                  const unlocked = isExerciseUnlocked(orderedIds, completedIds, exercise.id)
                  const isUpNext = exercise.id === upNextId

                  const node = (
                    <div
                      className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors ${
                        completed
                          ? 'border-success bg-success-soft text-success'
                          : isUpNext
                            ? 'border-accent bg-accent text-text shadow-[0_0_0_6px_var(--color-accent-soft)]'
                            : unlocked
                              ? 'border-accent-soft bg-panel-raised text-accent-strong'
                              : 'border-border bg-panel-raised text-text-muted'
                      }`}
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
                    </div>
                  )

                  return (
                    <div key={exercise.id} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
                      {unlocked ? (
                        <Link to={`/exercises/${exercise.id}`} aria-label={exercise.title}>
                          {node}
                        </Link>
                      ) : (
                        <span aria-label={`${exercise.title} (verrouillé)`}>{node}</span>
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
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
