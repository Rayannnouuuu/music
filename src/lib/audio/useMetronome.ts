import { useSyncExternalStore } from 'react'
import { MetronomeEngine } from './metronome'

const engine = new MetronomeEngine()

interface MetronomeStoreState {
  isPlaying: boolean
  bpm: number
}

let state: MetronomeStoreState = { isPlaying: false, bpm: 90 }
const listeners = new Set<() => void>()

function setState(partial: Partial<MetronomeStoreState>) {
  state = { ...state, ...partial }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): MetronomeStoreState {
  return state
}

export function useMetronome() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)

  return {
    isPlaying: snapshot.isPlaying,
    bpm: snapshot.bpm,
    start(bpm: number) {
      if (state.isPlaying) {
        engine.setBpm(bpm)
        setState({ bpm })
      } else {
        engine.start(bpm)
        setState({ isPlaying: true, bpm })
      }
    },
    stop() {
      engine.stop()
      setState({ isPlaying: false })
    },
    setVolume(v: number) {
      engine.setVolume(v)
    },
  }
}
