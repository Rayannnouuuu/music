import { useEffect, useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import TabStaticView from '../components/tab/TabStaticView'
import FretboardDiagram from '../components/tab/FretboardDiagram'
import { playerReducer, type PlayerState } from '../lib/tab/playerState'
import { activeEventIndex, isEventActive } from '../lib/tab/playback'
import { loadAllTabs } from '../lib/content/loadTabs'
import { useMetronome } from '../lib/audio/useMetronome'
import { useProgression } from '../lib/progression/ProgressionContext'

const BEATS_PER_MEASURE = 4

const initialState: PlayerState = { status: 'idle', speedPercent: 100, elapsedBeats: 0 }

export default function TabPlayerPage() {
  const { id } = useParams()
  const { state: progressState } = useProgression()
  const tab = useMemo(
    () => [...loadAllTabs(), ...progressState.importedTabs].find((t) => t.id === id),
    [id, progressState.importedTabs],
  )
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const [showFretboard, setShowFretboard] = useState(true)
  const metronome = useMetronome()

  const totalBeats = tab ? tab.measures.length * BEATS_PER_MEASURE : 0
  const effectiveBpm = tab ? (tab.originalTempo * state.speedPercent) / 100 : 0

  // Drive the playback clock. Only runs while actually playing.
  useEffect(() => {
    if (!tab || state.status !== 'playing') return
    const currentTab = tab
    let rafId: number
    let lastTime: number | null = null
    function frame(time: number) {
      if (lastTime !== null) {
        const deltaSeconds = (time - lastTime) / 1000
        dispatch({ type: 'tick', deltaSeconds, bpm: currentTab.originalTempo })
      }
      lastTime = time
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [tab, state.status])

  // Auto-pause at the end when not looping.
  useEffect(() => {
    if (!tab) return
    if (!state.loopRange && state.elapsedBeats >= totalBeats && state.status === 'playing') {
      dispatch({ type: 'pause' })
    }
  }, [tab, state.elapsedBeats, state.loopRange, state.status, totalBeats])

  // Keep the shared metronome's tempo in sync with this tab's effective BPM while it's running.
  useEffect(() => {
    if (metronome.isPlaying && effectiveBpm > 0) {
      metronome.start(effectiveBpm)
    }
    // Only re-sync when the effective BPM actually changes.
  }, [effectiveBpm])

  if (!tab) {
    return <p>Tab introuvable.</p>
  }

  const measureIndex = Math.min(
    Math.floor(state.elapsedBeats / BEATS_PER_MEASURE),
    tab.measures.length - 1,
  )
  const localBeat = state.elapsedBeats - measureIndex * BEATS_PER_MEASURE
  const measure = tab.measures[measureIndex]
  const candidateIndex = activeEventIndex(measure.events, localBeat)
  const isActive = candidateIndex >= 0 && isEventActive(measure.events[candidateIndex], localBeat)
  const activeEvent = isActive ? measure.events[candidateIndex] : undefined
  const highlightIndex = isActive ? candidateIndex : undefined

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
            onChange={(e) =>
              dispatch({ type: 'setLoop', range: e.target.checked ? [0, totalBeats] : undefined })
            }
          />
          Boucle
        </label>

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

      <TabStaticView measure={measure} highlightIndex={highlightIndex} />
    </div>
  )
}
