import { describe, test, expect } from 'vitest'
import { playerReducer, type PlayerState } from './playerState'

function baseState(overrides: Partial<PlayerState> = {}): PlayerState {
  return { status: 'idle', speedPercent: 100, elapsedBeats: 0, ...overrides }
}

describe('playerReducer', () => {
  test('play sets status to playing without changing elapsedBeats', () => {
    const state = baseState({ elapsedBeats: 3 })
    const next = playerReducer(state, { type: 'play' })
    expect(next.status).toBe('playing')
    expect(next.elapsedBeats).toBe(3)
  })

  test('pause sets status to paused without changing elapsedBeats', () => {
    const state = baseState({ status: 'playing', elapsedBeats: 3 })
    const next = playerReducer(state, { type: 'pause' })
    expect(next.status).toBe('paused')
    expect(next.elapsedBeats).toBe(3)
  })

  test('seek sets elapsedBeats directly', () => {
    const state = baseState({ elapsedBeats: 0 })
    const next = playerReducer(state, { type: 'seek', beat: 5 })
    expect(next.elapsedBeats).toBe(5)
  })

  test('setSpeed updates speedPercent without affecting elapsedBeats', () => {
    const state = baseState({ speedPercent: 100, elapsedBeats: 2 })
    const next = playerReducer(state, { type: 'setSpeed', percent: 75 })
    expect(next.speedPercent).toBe(75)
    expect(next.elapsedBeats).toBe(2)
  })

  test('tick at 100% speed advances elapsedBeats by beatsAtTime(deltaSeconds, bpm)', () => {
    const state = baseState({ status: 'playing', elapsedBeats: 0, speedPercent: 100 })
    const next = playerReducer(state, { type: 'tick', deltaSeconds: 1, bpm: 120 })
    expect(next.elapsedBeats).toBe(2)
  })

  test('tick at 50% speed advances half as much', () => {
    const state = baseState({ status: 'playing', elapsedBeats: 0, speedPercent: 50 })
    const next = playerReducer(state, { type: 'tick', deltaSeconds: 1, bpm: 120 })
    expect(next.elapsedBeats).toBe(1)
  })

  test('tick while not playing leaves elapsedBeats unchanged', () => {
    const state = baseState({ status: 'paused', elapsedBeats: 4 })
    const next = playerReducer(state, { type: 'tick', deltaSeconds: 1, bpm: 120 })
    expect(next.elapsedBeats).toBe(4)
  })

  test('tick past loopRange end wraps back to loopRange start plus overshoot', () => {
    const state = baseState({ status: 'playing', elapsedBeats: 7, speedPercent: 100, loopRange: [0, 8] })
    const next = playerReducer(state, { type: 'tick', deltaSeconds: 1, bpm: 120 })
    // advance = 2 beats -> raw 9, overshoot past loopRange[1]=8 is 1 -> wraps to 0+1
    expect(next.elapsedBeats).toBe(1)
  })
})
