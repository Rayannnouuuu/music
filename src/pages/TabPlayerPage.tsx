import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Play, Pause, Gauge, Metronome, Repeat, Guitar, type Icon } from '@phosphor-icons/react'
import TabStaticView from '../components/tab/TabStaticView'
import FretboardDiagram from '../components/tab/FretboardDiagram'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Slider } from '../components/ui/Slider'
import BeatIndicator from '../components/audio/BeatIndicator'
import { playerReducer, type PlayerState } from '../lib/tab/playerState'
import { activeEventIndex, isEventActive } from '../lib/tab/playback'
import { loadAllTabs } from '../lib/content/loadTabs'
import { useMetronome } from '../lib/audio/useMetronome'
import { useProgression } from '../lib/progression/ProgressionContext'
import { localDateString } from '../lib/date'

const BEATS_PER_MEASURE = 4

const initialState: PlayerState = { status: 'idle', speedPercent: 100, elapsedBeats: 0 }

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
  const { state: progressState, completeTabPractice } = useProgression()
  const tab = useMemo(
    () => [...loadAllTabs(), ...progressState.importedTabs].find((t) => t.id === id),
    [id, progressState.importedTabs],
  )
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const [showFretboard, setShowFretboard] = useState(true)
  const [loopMeasures, setLoopMeasures] = useState<[number, number]>([0, 0])
  const metronome = useMetronome()
  const practiceSecondsRef = useRef(0)

  const totalBeats = tab ? tab.measures.length * BEATS_PER_MEASURE : 0
  const effectiveBpm = tab ? (tab.originalTempo * state.speedPercent) / 100 : 0

  // Drive the playback clock, and accumulate real practice time while playing.
  // Only runs while actually playing; recording happens in the cleanup, which
  // fires on pause (manual or auto) and on unmount (navigating away mid-play).
  useEffect(() => {
    if (!tab || state.status !== 'playing') return
    const currentTab = tab
    let rafId: number
    let lastTime: number | null = null
    function frame(time: number) {
      if (lastTime !== null) {
        const deltaSeconds = (time - lastTime) / 1000
        practiceSecondsRef.current += deltaSeconds
        dispatch({ type: 'tick', deltaSeconds, bpm: currentTab.originalTempo })
      }
      lastTime = time
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafId)
      if (practiceSecondsRef.current > 0) {
        completeTabPractice(currentTab, practiceSecondsRef.current / 60, localDateString())
        practiceSecondsRef.current = 0
      }
    }
    // completeTabPractice intentionally omitted: it is stable in effect (new
    // object identity per render, but always closes over the latest setState).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state.status])

  // Auto-pause and rewind at the end when not looping, so the tab is ready to
  // replay immediately rather than stuck on its last frame.
  useEffect(() => {
    if (!tab) return
    if (!state.loopRange && state.elapsedBeats >= totalBeats && state.status === 'playing') {
      dispatch({ type: 'pause' })
      dispatch({ type: 'seek', beat: 0 })
      if (metronome.isPlaying) metronome.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state.elapsedBeats, state.loopRange, state.status, totalBeats])

  // Keep the shared metronome's tempo in sync with this tab's effective BPM while it's running.
  useEffect(() => {
    if (metronome.isPlaying && effectiveBpm > 0) {
      metronome.start(effectiveBpm)
    }
    // Only re-sync when the effective BPM actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBpm])

  if (!tab) {
    return <p>Tab introuvable.</p>
  }

  const measureCount = tab.measures.length
  const measureIndex = Math.min(Math.floor(state.elapsedBeats / BEATS_PER_MEASURE), measureCount - 1)
  const localBeat = state.elapsedBeats - measureIndex * BEATS_PER_MEASURE
  const measure = tab.measures[measureIndex]
  const nextMeasure = tab.measures[measureIndex + 1]
  const candidateIndex = activeEventIndex(measure.events, localBeat)
  const isActive = candidateIndex >= 0 && isEventActive(measure.events[candidateIndex], localBeat)
  const activeEvent = isActive ? measure.events[candidateIndex] : undefined
  const highlightIndex = isActive ? candidateIndex : undefined
  const progressPercent = Math.min(
    100,
    ((measureIndex + localBeat / BEATS_PER_MEASURE) / measureCount) * 100,
  )

  function toggleLoop(enabled: boolean) {
    if (enabled) {
      const range: [number, number] = [0, measureCount - 1]
      setLoopMeasures(range)
      dispatch({ type: 'setLoop', range: [0, measureCount * BEATS_PER_MEASURE] })
    } else {
      dispatch({ type: 'setLoop', range: undefined })
    }
  }

  function updateLoopRange(start: number, end: number) {
    const clampedEnd = Math.max(start, end)
    setLoopMeasures([start, clampedEnd])
    dispatch({
      type: 'setLoop',
      range: [start * BEATS_PER_MEASURE, (clampedEnd + 1) * BEATS_PER_MEASURE],
    })
  }

  return (
    <div className="space-y-6">
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
            onClick={() => dispatch({ type: state.status === 'playing' ? 'pause' : 'play' })}
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
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Slider
            label="Vitesse"
            value={state.speedPercent}
            min={50}
            max={150}
            step={5}
            onChange={(percent) => dispatch({ type: 'setSpeed', percent })}
            formatValue={(v) => `${v}%`}
          />

          <div className="flex items-center gap-3">
            <ToggleChip
              active={metronome.isPlaying}
              icon={Metronome}
              label="Métronome"
              onClick={() => (metronome.isPlaying ? metronome.stop() : metronome.start(effectiveBpm))}
            />
            {metronome.isPlaying && <BeatIndicator bpm={effectiveBpm} isPlaying />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToggleChip
            active={!!state.loopRange}
            icon={Repeat}
            label="Boucle"
            onClick={() => toggleLoop(!state.loopRange)}
          />
          <ToggleChip
            active={showFretboard}
            icon={Guitar}
            label="Manche"
            onClick={() => setShowFretboard((v) => !v)}
          />

          <AnimatePresence>
            {state.loopRange && measureCount > 1 && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-1.5 text-sm"
              >
                <select
                  value={loopMeasures[0]}
                  onChange={(e) => updateLoopRange(Number(e.target.value), loopMeasures[1])}
                  className="rounded-[var(--radius-input)] border border-border bg-panel-raised px-2 py-2 text-text-muted"
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
                  className="rounded-[var(--radius-input)] border border-border bg-panel-raised px-2 py-2 text-text-muted"
                >
                  {Array.from({ length: measureCount }, (_, i) => (
                    <option key={i} value={i}>
                      Mesure {i + 1}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-3 p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Mesure {measureIndex + 1}
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-input)] bg-bg/60 p-4">
            <TabStaticView measure={measure} highlightIndex={highlightIndex} />
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
              <TabStaticView measure={nextMeasure} />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
