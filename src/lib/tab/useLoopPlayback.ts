import { useEffect, useReducer, useRef } from 'react'
import { playerReducer, type PlayerState } from './playerState'
import { useMetronome } from '../audio/useMetronome'

interface UseLoopPlaybackOptions {
  // Identity of the content being played (a tab or exercise id) — the
  // playback clock resets to a fresh full loop whenever this changes.
  loopKey: string
  totalBeats: number
  baseBpm: number
  // Called with minutes of real elapsed practice time whenever playback
  // stops (manual pause or unmount) — not on every tick, so this can
  // safely be a new closure each render without retriggering the effect.
  onStop: (minutesSpent: number) => void
}

// Shared playback engine behind both the tab player and the exercise
// player: owns the play/pause clock, drives it every frame while playing,
// keeps the metronome started/stopped and re-tempoed with it, and tracks
// real elapsed practice time. Callers that need measure-range loop
// narrowing (the tab player) can still dispatch 'setLoop'/'seek' directly.
export function useLoopPlayback({ loopKey, totalBeats, baseBpm, onStop }: UseLoopPlaybackOptions) {
  const [state, dispatch] = useReducer(playerReducer, {
    status: 'idle',
    speedPercent: 100,
    elapsedBeats: 0,
    loopRange: [0, totalBeats] as [number, number],
  } satisfies PlayerState)
  const metronome = useMetronome()
  const practiceSecondsRef = useRef(0)

  const effectiveBpm = (baseBpm * state.speedPercent) / 100

  useEffect(() => {
    dispatch({ type: 'seek', beat: 0 })
    dispatch({ type: 'setLoop', range: [0, totalBeats] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopKey])

  useEffect(() => {
    if (state.status !== 'playing') return
    let rafId: number
    let lastTime: number | null = null
    function frame(time: number) {
      if (lastTime !== null) {
        const deltaSeconds = (time - lastTime) / 1000
        practiceSecondsRef.current += deltaSeconds
        dispatch({ type: 'tick', deltaSeconds, bpm: baseBpm })
      }
      lastTime = time
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafId)
      if (practiceSecondsRef.current > 0) {
        onStop(practiceSecondsRef.current / 60)
        practiceSecondsRef.current = 0
      }
    }
    // onStop intentionally omitted: a new closure each render, but always
    // calls a stable setState updater, so an outdated closure is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, baseBpm, loopKey])

  useEffect(() => {
    if (state.status === 'playing' && effectiveBpm > 0) {
      metronome.start(effectiveBpm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBpm])

  function togglePlayback() {
    if (state.status === 'playing') {
      dispatch({ type: 'pause' })
      metronome.stop()
    } else {
      dispatch({ type: 'play' })
      metronome.start(effectiveBpm)
    }
  }

  return { state, dispatch, effectiveBpm, togglePlayback, metronome, practiceSecondsRef }
}
