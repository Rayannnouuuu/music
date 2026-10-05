import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import TabStaticView from '../components/tab/TabStaticView'
import FretboardDiagram from '../components/tab/FretboardDiagram'
import { playerReducer, type PlayerState } from '../lib/tab/playerState'
import { activeEventIndex, isEventActive } from '../lib/tab/playback'
import { loadAllTabs } from '../lib/content/loadTabs'
import { useMetronome } from '../lib/audio/useMetronome'
import { useProgression } from '../lib/progression/ProgressionContext'
import { localDateString } from '../lib/date'

const BEATS_PER_MEASURE = 4

const initialState: PlayerState = { status: 'idle', speedPercent: 100, elapsedBeats: 0 }

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
    <div className="space-y-4">
      <h1>{tab.title}</h1>
      <p className="text-text-muted">{tab.artist}</p>

      <div className="flex flex-wrap items-center gap-4 bg-panel border border-border rounded-lg p-3">
        <button
          className="text-accent font-semibold"
          onClick={() => dispatch({ type: state.status === 'playing' ? 'pause' : 'play' })}
        >
          {state.status === 'playing' ? 'Pause' : 'Lecture'}
        </button>

        <label className="flex items-center gap-2 text-sm">
          Vitesse {state.speedPercent}%
          <input
            type="range"
            min={50}
            max={150}
            value={state.speedPercent}
            onChange={(e) => dispatch({ type: 'setSpeed', percent: Number(e.target.value) })}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!state.loopRange}
            onChange={(e) => toggleLoop(e.target.checked)}
          />
          Boucle
        </label>

        {state.loopRange && measureCount > 1 && (
          <div className="flex items-center gap-1 text-sm">
            <select
              value={loopMeasures[0]}
              onChange={(e) => updateLoopRange(Number(e.target.value), loopMeasures[1])}
              className="bg-bg text-text border border-border rounded px-1 py-1"
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
              className="bg-bg text-text border border-border rounded px-1 py-1"
            >
              {Array.from({ length: measureCount }, (_, i) => (
                <option key={i} value={i}>
                  Mesure {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showFretboard}
            onChange={(e) => setShowFretboard(e.target.checked)}
          />
          Manche
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={metronome.isPlaying}
            onChange={(e) =>
              e.target.checked ? metronome.start(effectiveBpm) : metronome.stop()
            }
          />
          Métronome
        </label>

        <span className="text-text-muted text-sm">{Math.round(effectiveBpm)} BPM</span>
      </div>

      {showFretboard && (
        <FretboardDiagram activeString={activeEvent?.string} activeFret={activeEvent?.fret} />
      )}

      <div className="space-y-1">
        <p className="text-text-muted text-xs uppercase tracking-wide">Mesure {measureIndex + 1}</p>
        <TabStaticView measure={measure} highlightIndex={highlightIndex} />
      </div>

      {nextMeasure && (
        <div className="space-y-1 opacity-50">
          <p className="text-text-muted text-xs uppercase tracking-wide">Mesure suivante</p>
          <TabStaticView measure={nextMeasure} />
        </div>
      )}
    </div>
  )
}
