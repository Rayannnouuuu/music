import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Play, Pause, Gauge, Repeat, Guitar, Minus, Plus, type Icon } from '@phosphor-icons/react'
import NoteHighway from '../components/tab/NoteHighway'
import FretboardDiagram from '../components/tab/FretboardDiagram'
import TabPerformanceView from '../components/tab/TabPerformanceView'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Slider } from '../components/ui/Slider'
import BeatIndicator from '../components/audio/BeatIndicator'
import { activeEventIndex, isEventActive } from '../lib/tab/playback'
import { flattenTabEvents, eventsInRange } from '../lib/tab/flatten'
import { useLoopPlayback } from '../lib/tab/useLoopPlayback'
import { loadAllTabs } from '../lib/content/loadTabs'
import { useProgression, XP_PER_MINUTE } from '../lib/progression/ProgressionContext'
import { localDateString } from '../lib/date'

const BEATS_PER_MEASURE = 4

function ToggleChip({
  active,
  icon: IconComponent,
  label,
  onClick,
}: {
  active: boolean
  icon: Icon
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[var(--radius-control)] border px-4 py-2.5 text-sm font-medium transition-colors active:scale-[0.96] ${
        active
          ? 'border-accent-soft bg-accent-soft text-accent-strong'
          : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
      }`}
    >
      <IconComponent size={17} weight={active ? 'fill' : 'regular'} />
      {label}
    </button>
  )
}

export default function TabPlayerPage() {
  const { id } = useParams()
  const { state: progressState, completeTabPractice, setTempoForTab } = useProgression()
  const tab = useMemo(
    () => [...loadAllTabs(), ...progressState.importedTabs].find((t) => t.id === id),
    [id, progressState.importedTabs],
  )
  const measureCount = tab?.measures.length ?? 0
  const totalBeats = measureCount * BEATS_PER_MEASURE
  const baseBpm = tab ? (progressState.customTempoByTabId[tab.id] ?? tab.originalTempo) : 0

  const { state, dispatch, effectiveBpm, togglePlayback, metronome, practiceSecondsRef } = useLoopPlayback({
    loopKey: tab?.id ?? '',
    totalBeats,
    baseBpm,
    onStop: (minutesSpent) => {
      if (tab) completeTabPractice(tab, minutesSpent, localDateString())
    },
  })
  const [showFretboard, setShowFretboard] = useState(true)
  const [loopMeasures, setLoopMeasures] = useState<[number, number]>([0, Math.max(0, measureCount - 1)])

  // Keep the measure-range picker in sync whenever the tab itself changes.
  useEffect(() => {
    setLoopMeasures([0, Math.max(0, measureCount - 1)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab?.id])

  if (!tab) {
    return <p>Tab introuvable.</p>
  }

  const loopRange = state.loopRange ?? [0, totalBeats]
  const measureIndex = Math.min(Math.floor(state.elapsedBeats / BEATS_PER_MEASURE), measureCount - 1)
  const localBeat = state.elapsedBeats - measureIndex * BEATS_PER_MEASURE
  const measure = tab.measures[measureIndex]
  const nextMeasure = tab.measures[measureIndex + 1]
  const candidateIndex = activeEventIndex(measure.events, localBeat)
  const isActive = candidateIndex >= 0 && isEventActive(measure.events[candidateIndex], localBeat)
  const activeEvent = isActive ? measure.events[candidateIndex] : undefined
  const progressPercent = Math.min(
    100,
    ((measureIndex + localBeat / BEATS_PER_MEASURE) / measureCount) * 100,
  )

  const flatEvents = flattenTabEvents(tab, BEATS_PER_MEASURE)
  const loopEvents = eventsInRange(flatEvents, loopRange[0], loopRange[1])
  const loopLength = loopRange[1] - loopRange[0]
  const scrollPos = Math.min(loopLength, Math.max(0, state.elapsedBeats - loopRange[0]))
  const xpSoFar = Math.round((practiceSecondsRef.current / 60) * XP_PER_MINUTE)

  function updateLoopRange(start: number, end: number) {
    const clampedEnd = Math.max(start, end)
    setLoopMeasures([start, clampedEnd])
    const range: [number, number] = [start * BEATS_PER_MEASURE, (clampedEnd + 1) * BEATS_PER_MEASURE]
    dispatch({ type: 'setLoop', range })
    dispatch({ type: 'seek', beat: range[0] })
  }

  function resetLoopToFullTab() {
    updateLoopRange(0, measureCount - 1)
  }

  function handleSpeedChange(percent: number) {
    dispatch({ type: 'setSpeed', percent })
  }

  function adjustBaseTempo(delta: number) {
    setTempoForTab(tab!.id, Math.max(20, Math.min(400, baseBpm + delta)))
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {state.status === 'playing' && (
          <TabPerformanceView
            title={tab.title}
            artist={tab.artist}
            loopEvents={loopEvents}
            loopLength={loopLength}
            scrollPos={scrollPos}
            activeEvent={activeEvent}
            effectiveBpm={effectiveBpm}
            speedPercent={state.speedPercent}
            onSpeedChange={handleSpeedChange}
            onExit={togglePlayback}
            xpSoFar={xpSoFar}
          />
        )}
      </AnimatePresence>

      <Link
        to="/tabs"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={15} />
        Bibliothèque de tabs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {tab.title}
          </h1>
          <p className="mt-1 text-text-muted">{tab.artist}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{tab.subgenre}</Badge>
          <Badge>{tab.tuning}</Badge>
          <Badge>Difficulté {tab.difficulty}/10</Badge>
          <Badge>{tab.originalTempo} BPM d'origine</Badge>
        </div>
      </div>

      <Card className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={togglePlayback}
            aria-label={state.status === 'playing' ? 'Pause' : 'Lecture'}
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-text transition-shadow ${
              state.status === 'playing' ? 'shadow-[0_0_0_6px_var(--color-accent-soft)]' : ''
            }`}
          >
            {state.status === 'playing' ? (
              <Pause size={28} weight="fill" />
            ) : (
              <Play size={28} weight="fill" />
            )}
          </motion.button>

          <div className="min-w-[160px] flex-1 space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Mesure {measureIndex + 1} / {measureCount}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-accent"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap font-mono text-sm text-text-muted">
            <Gauge size={16} />
            {Math.round(effectiveBpm)} BPM
            {metronome.isPlaying && <BeatIndicator bpm={effectiveBpm} isPlaying size="sm" />}
          </div>
        </div>

        <p className="text-xs text-text-muted">
          Lecture démarre automatiquement le métronome et passe en plein écran.
        </p>

        <div className="grid gap-5 sm:grid-cols-3">
          <Slider
            label="Vitesse"
            value={state.speedPercent}
            min={50}
            max={150}
            step={5}
            onChange={handleSpeedChange}
            formatValue={(v) => `${v}%`}
          />

          <div className="space-y-2">
            <p className="text-sm text-text-muted">Tempo de base</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustBaseTempo(-1)}
                aria-label="Ralentir le tempo de base"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
              >
                <Minus size={14} />
              </button>
              <span className="w-16 text-center font-mono text-sm tabular-nums text-text">
                {Math.round(baseBpm)} BPM
              </span>
              <button
                onClick={() => adjustBaseTempo(1)}
                aria-label="Accélérer le tempo de base"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
              >
                <Plus size={14} />
              </button>
              {baseBpm !== tab.originalTempo && (
                <button
                  onClick={() => setTempoForTab(tab.id, tab.originalTempo)}
                  className="text-xs font-medium text-accent-strong hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          <ToggleChip
            active={showFretboard}
            icon={Guitar}
            label="Manche"
            onClick={() => setShowFretboard((v) => !v)}
          />
        </div>

        {measureCount > 1 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border-soft pt-4">
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <Repeat size={17} />
              Boucle sur
            </span>
            <select
              value={loopMeasures[0]}
              onChange={(e) => updateLoopRange(Number(e.target.value), loopMeasures[1])}
              className="rounded-[var(--radius-input)] border border-border bg-panel-raised px-2 py-2 text-sm text-text-muted"
            >
              {Array.from({ length: measureCount }, (_, i) => (
                <option key={i} value={i}>
                  Mesure {i + 1}
                </option>
              ))}
            </select>
            <span className="text-text-muted">à</span>
            <select
              value={loopMeasures[1]}
              onChange={(e) => updateLoopRange(loopMeasures[0], Number(e.target.value))}
              className="rounded-[var(--radius-input)] border border-border bg-panel-raised px-2 py-2 text-sm text-text-muted"
            >
              {Array.from({ length: measureCount }, (_, i) => (
                <option key={i} value={i}>
                  Mesure {i + 1}
                </option>
              ))}
            </select>
            {(loopMeasures[0] !== 0 || loopMeasures[1] !== measureCount - 1) && (
              <button
                onClick={resetLoopToFullTab}
                className="text-sm font-medium text-accent-strong hover:underline"
              >
                Toute la tab
              </button>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-3 p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Mesure {measureIndex + 1}
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-input)] bg-bg/60 p-4">
            <NoteHighway events={measure.events} totalBeats={BEATS_PER_MEASURE} activeBeat={localBeat} />
          </div>
        </Card>

        <div className="space-y-4">
          {showFretboard && (
            <Card className="p-4">
              <FretboardDiagram activeString={activeEvent?.string} activeFret={activeEvent?.fret} />
            </Card>
          )}
          {nextMeasure && (
            <Card className="space-y-2 p-4 opacity-60">
              <p className="text-xs uppercase tracking-wide text-text-muted">Mesure suivante</p>
              <NoteHighway events={nextMeasure.events} totalBeats={BEATS_PER_MEASURE} />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
