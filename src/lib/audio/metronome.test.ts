import { describe, test, expect } from 'vitest'
import { computeScheduledTicks } from './metronome'

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
})
