import { useEffect, useRef, useState, useReducer } from 'react'
import { playerReducer, type PlayerState } from './playerState'
import { useMetronome } from '../audio/useMetronome'

interface UseLoopPlaybackOptions {
  // Identity of the content being played (a tab or exercise id) — the
  // playback clock resets to a fresh full loop whenever this changes.
  loopKey: string
  totalBeats: number
  baseBpm: number
  // How many missed notes (in tempo mode) before the attempt resets to the
  // start — exercises want zero tolerance, songs a bit of slack.
  maxMisses?: number
  // If set, reaching this many consecutive clean (no reset) seconds of
  // tempo-mode playback fires onMastered once — used so a short exercise
  // riff isn't an infinite loop but has an actual finish line.
  targetCleanSeconds?: number
  onMastered?: () => void
  // Called with minutes of real elapsed practice time whenever playback
  // stops (manual pause or unmount) — not on every tick, so this can
  // safely be a new closure each render without retriggering the effect.
  onStop: (minutesSpent: number) => void
}

const COUNTDOWN_START = 3
const COUNTDOWN_STEP_MS = 800
const COUNTDOWN_GO_HOLD_MS = 500

// Shared playback + "performance session" engine behind both the tab player
// and the exercise player: owns the play/pause clock, a 3-2-1-GO countdown,
// miss tracking with an automatic reset-to-start, and an optional
// clean-playthrough duration target. Callers that need measure-range loop
// narrowing (the tab player) can still dispatch 'setLoop'/'seek' directly.
export function useLoopPlayback({
  loopKey,
  totalBeats,
  baseBpm,
  maxMisses = 5,
  targetCleanSeconds,
  onMastered,
  onStop,
}: UseLoopPlaybackOptions) {
  const [state, dispatch] = useReducer(playerReducer, {
    status: 'idle',
    mode: 'tempo',
    speedPercent: 100,
    elapsedBeats: 0,
    loopRange: [0, totalBeats] as [number, number],
  } satisfies PlayerState)
  const metronome = useMetronome()
  const practiceSecondsRef = useRef(0)
  const cleanSecondsRef = useRef(0)
  const masteredFiredRef = useRef(false)

  const [performanceOpen, setPerformanceOpen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)
  const [hitKeys, setHitKeys] = useState<Set<string>>(new Set())
  const [missedKeys, setMissedKeys] = useState<Set<string>>(new Set())
  const [justFailed, setJustFailed] = useState(false)

  const effectiveBpm = (baseBpm * state.speedPercent) / 100

  useEffect(() => {
    dispatch({ type: 'seek', beat: 0 })
    dispatch({ type: 'setLoop', range: [0, totalBeats] })
    setPerformanceOpen(false)
    setCountdown(null)
    setMisses(0)
    setHitKeys(new Set())
    setMissedKeys(new Set())
    setJustFailed(false)
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
        if (state.mode === 'tempo' && targetCleanSeconds) {
          cleanSecondsRef.current += deltaSeconds
          if (!masteredFiredRef.current && cleanSecondsRef.current >= targetCleanSeconds) {
            masteredFiredRef.current = true
            onMastered?.()
          }
        }
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
      // Only turn the metronome off if this session is still the one
      // driving it — leaves a manually-started metronome alone.
      metronome.stop(loopKey)
    }
    // onStop/onMastered intentionally omitted: new closures each render,
    // but always call stable updaters, so an outdated closure is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.mode, baseBpm, loopKey, targetCleanSeconds])

  useEffect(() => {
    if (state.status === 'playing' && state.mode === 'tempo' && effectiveBpm > 0) {
      metronome.start(effectiveBpm, loopKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBpm, state.mode])

  function togglePlayback() {
    if (state.status === 'playing') {
      dispatch({ type: 'pause' })
      metronome.stop(loopKey)
    } else {
      dispatch({ type: 'play' })
      if (state.mode === 'tempo') metronome.start(effectiveBpm, loopKey)
    }
  }

  // Countdown runs down 3, 2, 1, then holds on "0" (rendered as "GO") just
  // long enough to read before the clock actually starts.
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      const t = setTimeout(() => {
        setCountdown(null)
        dispatch({ type: 'play' })
        if (state.mode === 'tempo') metronome.start(effectiveBpm, loopKey)
      }, COUNTDOWN_GO_HOLD_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), COUNTDOWN_STEP_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  function resetAttemptState() {
    setMisses(0)
    setHitKeys(new Set())
    setMissedKeys(new Set())
    setJustFailed(false)
    cleanSecondsRef.current = 0
    masteredFiredRef.current = false
  }

  function enterPerformance() {
    setPerformanceOpen(true)
    resetAttemptState()
    dispatch({ type: 'seek', beat: 0 })
    setCountdown(COUNTDOWN_START)
  }

  function exitPerformance() {
    if (state.status === 'playing') {
      dispatch({ type: 'pause' })
      metronome.stop(loopKey)
    }
    setCountdown(null)
    setPerformanceOpen(false)
  }

  function restartPerformance() {
    if (state.status === 'playing') {
      dispatch({ type: 'pause' })
      metronome.stop(loopKey)
    }
    resetAttemptState()
    dispatch({ type: 'seek', beat: 0 })
    setCountdown(COUNTDOWN_START)
  }

  function setMode(mode: PlayerState['mode']) {
    if (mode !== state.mode && state.status === 'playing') metronome.stop(loopKey)
    dispatch({ type: 'setMode', mode })
  }

  function advanceBeat(beat: number) {
    dispatch({ type: 'advance', beat })
  }

  // Reported by the practice validator once per note, right when its
  // window closes: hit if it was matched in time, miss otherwise. Tempo
  // mode only — in practice mode notes wait for you, so nothing ever
  // "times out".
  function handleNoteResult(key: string, hit: boolean) {
    // Once an attempt has already failed, ignore anything still in flight
    // (e.g. a tick scheduled just before the reset took effect) until the
    // person restarts — otherwise the miss count can overshoot maxMisses.
    if (justFailed) return
    if (hit) {
      setHitKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
      return
    }
    setMissedKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
    const next = misses + 1
    setMisses(next)
    if (next >= maxMisses) {
      setJustFailed(true)
      dispatch({ type: 'pause' })
      metronome.stop(loopKey)
      dispatch({ type: 'seek', beat: 0 })
      cleanSecondsRef.current = 0
    }
  }

  return {
    state,
    dispatch,
    effectiveBpm,
    togglePlayback,
    metronome,
    practiceSecondsRef,
    performanceOpen,
    countdown,
    misses,
    maxMisses,
    hitKeys,
    missedKeys,
    justFailed,
    enterPerformance,
    exitPerformance,
    restartPerformance,
    setMode,
    advanceBeat,
    handleNoteResult,
  }
}
