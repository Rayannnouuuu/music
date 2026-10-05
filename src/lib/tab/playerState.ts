import { beatsAtTime } from './playback'

export interface PlayerState {
  status: 'idle' | 'playing' | 'paused'
  // 'tempo': the metronome clock drives the cursor forward automatically.
  // 'practice': the cursor only moves when the current note is matched
  // (via 'advance'), so a beginner can take as long as they need per note.
  mode: 'tempo' | 'practice'
  speedPercent: number
  elapsedBeats: number
  loopRange?: [number, number]
}

export type PlayerAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'seek'; beat: number }
  | { type: 'setSpeed'; percent: number }
  | { type: 'setLoop'; range: [number, number] | undefined }
  | { type: 'setMode'; mode: PlayerState['mode'] }
  | { type: 'advance'; beat: number }
  | { type: 'tick'; deltaSeconds: number; bpm: number }

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'play':
      return { ...state, status: 'playing' }
    case 'pause':
      return { ...state, status: 'paused' }
    case 'seek':
      return { ...state, elapsedBeats: action.beat }
    case 'setSpeed':
      return { ...state, speedPercent: action.percent }
    case 'setLoop':
      return { ...state, loopRange: action.range }
    case 'setMode':
      return { ...state, mode: action.mode }
    case 'advance':
      return { ...state, elapsedBeats: action.beat }
    case 'tick': {
      // Ticks in practice mode too: the page caps the displayed scroll
      // position at the next not-yet-hit note so it still animates smoothly
      // in (instead of staying frozen) but holds there instead of
      // overshooting — see nextNoteProximity/practice capping in the pages.
      if (state.status !== 'playing') return state
      const advance = beatsAtTime((action.deltaSeconds * state.speedPercent) / 100, action.bpm)
      let elapsedBeats = state.elapsedBeats + advance
      if (state.loopRange && elapsedBeats > state.loopRange[1]) {
        const overshoot = elapsedBeats - state.loopRange[1]
        elapsedBeats = state.loopRange[0] + overshoot
      }
      return { ...state, elapsedBeats }
    }
    default:
      return state
  }
}
