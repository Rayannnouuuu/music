import { useEffect, useReducer, useState } from 'react'
import TabStaticView from '../components/tab/TabStaticView'
import FretboardDiagram from '../components/tab/FretboardDiagram'
import { playerReducer, type PlayerState } from '../lib/tab/playerState'
import { activeEventIndex, isEventActive } from '../lib/tab/playback'
import type { Tab } from '../lib/content/types'

const BEATS_PER_MEASURE = 4

// Placeholder fixture — Task 8 replaces this with the real loader keyed by :id.
const FIXTURE_TAB: Tab = {
  id: 'fixture-1',
  title: 'Riff de démonstration',
  artist: 'Exemple',
  subgenre: 'heavy',
  tuning: 'Standard',
  originalTempo: 90,
  difficulty: 3,
  measures: [
    {
      events: [
        { string: 6, fret: 0, startBeat: 0, duration: 1, technique: 'palmMute' },
        { string: 6, fret: 0, startBeat: 1, duration: 1, technique: 'palmMute' },
        { string: 6, fret: 3, startBeat: 2, duration: 1 },
        { string: 6, fret: 2, startBeat: 3, duration: 1 },
      ],
    },
    {
      events: [
        { string: 6, fret: 0, startBeat: 0, duration: 2, technique: 'palmMute' },
        { string: 5, fret: 2, startBeat: 2, duration: 2 },
      ],
    },
  ],
}

const initialState: PlayerState = { status: 'idle', speedPercent: 100, elapsedBeats: 0 }

export default function TabPlayerPage() {
  const tab = FIXTURE_TAB
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const [showFretboard, setShowFretboard] = useState(true)

  const totalBeats = tab.measures.length * BEATS_PER_MEASURE
  const effectiveBpm = (tab.originalTempo * state.speedPercent) / 100

  // Drive the playback clock. Only runs while actually playing.
  useEffect(() => {
    if (state.status !== 'playing') return
    let rafId: number
    let lastTime: number | null = null
    function frame(time: number) {
      if (lastTime !== null) {
        const deltaSeconds = (time - lastTime) / 1000
        dispatch({ type: 'tick', deltaSeconds, bpm: tab.originalTempo })
      }
      lastTime = time
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [state.status, tab.originalTempo])

  // Auto-pause at the end when not looping.
  useEffect(() => {
    if (!state.loopRange && state.elapsedBeats >= totalBeats && state.status === 'playing') {
      dispatch({ type: 'pause' })
    }
  }, [state.elapsedBeats, state.loopRange, state.status, totalBeats])

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

        <span className="text-text-muted text-sm">{Math.round(effectiveBpm)} BPM</span>
      </div>

      {showFretboard && (
        <FretboardDiagram activeString={activeEvent?.string} activeFret={activeEvent?.fret} />
      )}

      <TabStaticView measure={measure} highlightIndex={highlightIndex} />
    </div>
  )
}
