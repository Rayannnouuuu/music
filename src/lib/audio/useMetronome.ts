import { useSyncExternalStore } from 'react'
import { MetronomeEngine } from './metronome'

const engine = new MetronomeEngine()

interface MetronomeStoreState {
  isPlaying: boolean
  bpm: number
  // Who currently has it running: null means started manually from the nav
  // widget, a string is a practice session's loopKey. Lets a practice page
  // that navigates away (or finishes) stop the metronome only if it's still
  // the one driving it — never a metronome the person started themselves.
  owner: string | null
}

let state: MetronomeStoreState = { isPlaying: false, bpm: 90, owner: null }
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
    start(bpm: number, owner: string | null = null) {
      if (state.isPlaying) {
        engine.setBpm(bpm)
        setState({ bpm, owner })
      } else {
        engine.start(bpm)
        setState({ isPlaying: true, bpm, owner })
      }
    },
    // Omit `owner` for a hard/manual stop (always stops). Pass the calling
    // session's loopKey to only stop it if that session still owns it.
    stop(owner?: string) {
      if (owner !== undefined && state.owner !== owner) return
      engine.stop()
      setState({ isPlaying: false, owner: null })
    },
    setVolume(v: number) {
      engine.setVolume(v)
    },
  }
}
