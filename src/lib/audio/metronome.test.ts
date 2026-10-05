import { describe, test, expect } from 'vitest'
import { computeScheduledTicks, clampBpm } from './metronome'

describe('computeScheduledTicks', () => {
  test('only schedules ticks within the look-ahead window, first tick accented', () => {
    const result = computeScheduledTicks({
      currentTime: 0,
      nextTickTime: 0,
      scheduleAheadTime: 0.1,
      secondsPerBeat: 0.5,
      beatsPerBar: 4,
      nextBeatIndexInBar: 0,
    })

    expect(result.ticks).toEqual([{ time: 0, accent: true }])
    expect(result.nextTickTime).toBe(0.5)
    expect(result.nextBeatIndexInBar).toBe(1)
  })

  test('chains across calls with no gaps or repeats', () => {
    const first = computeScheduledTicks({
      currentTime: 0,
      nextTickTime: 0,
      scheduleAheadTime: 0.1,
      secondsPerBeat: 0.5,
      beatsPerBar: 4,
      nextBeatIndexInBar: 0,
    })

    const second = computeScheduledTicks({
      currentTime: 0.45,
      nextTickTime: first.nextTickTime,
      scheduleAheadTime: 0.1,
      secondsPerBeat: 0.5,
      beatsPerBar: 4,
      nextBeatIndexInBar: first.nextBeatIndexInBar,
    })

    expect(second.ticks).toEqual([{ time: 0.5, accent: false }])
    expect(second.nextTickTime).toBe(1.0)
    expect(second.nextBeatIndexInBar).toBe(2)

    const allTickTimes = [...first.ticks, ...second.ticks].map((t) => t.time)
    expect(allTickTimes).toEqual([0, 0.5])
  })

  test('schedules multiple ticks in one call when the window covers several beats', () => {
    const result = computeScheduledTicks({
      currentTime: 0,
      nextTickTime: 0,
      scheduleAheadTime: 1.1,
      secondsPerBeat: 0.5,
      beatsPerBar: 4,
      nextBeatIndexInBar: 3,
    })

    expect(result.ticks).toEqual([
      { time: 0, accent: false },
      { time: 0.5, accent: true },
      { time: 1.0, accent: false },
    ])
    expect(result.nextTickTime).toBe(1.5)
    expect(result.nextBeatIndexInBar).toBe(2)
  })

  test('does not hang when secondsPerBeat is zero or negative (invalid BPM)', () => {
    const resultZero = computeScheduledTicks({
      currentTime: 0,
      nextTickTime: 0,
      scheduleAheadTime: 0.1,
      secondsPerBeat: 0,
      beatsPerBar: 4,
      nextBeatIndexInBar: 0,
    })
    expect(resultZero.ticks).toEqual([])
    expect(resultZero.nextTickTime).toBe(0)

    const resultNegative = computeScheduledTicks({
      currentTime: 0,
      nextTickTime: 0,
      scheduleAheadTime: 0.1,
      secondsPerBeat: -0.5,
      beatsPerBar: 4,
      nextBeatIndexInBar: 0,
    })
    expect(resultNegative.ticks).toEqual([])
    expect(resultNegative.nextTickTime).toBe(0)
  })
})

describe('clampBpm', () => {
  test('passes a normal BPM through unchanged', () => {
    expect(clampBpm(120)).toBe(120)
  })

  test('clamps a negative or zero BPM up to the minimum', () => {
    expect(clampBpm(-50)).toBe(20)
    expect(clampBpm(0)).toBe(20)
  })

  test('clamps an unreasonably high BPM down to the maximum', () => {
    expect(clampBpm(10000)).toBe(400)
  })

  test('falls back to the minimum for NaN or Infinity', () => {
    expect(clampBpm(NaN)).toBe(20)
    expect(clampBpm(Infinity)).toBe(20)
  })
})
