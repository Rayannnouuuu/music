import { describe, test, expect } from 'vitest'
import { isNoteActive, totalBeatsForEvents, nextNoteProximity, PROXIMITY_LOOKAHEAD_BEATS } from './noteLayout'
import type { TabEvent } from '../content/types'

describe('isNoteActive', () => {
  test('active exactly at its start beat', () => {
    const event: TabEvent = { string: 1, fret: 5, startBeat: 2, duration: 1 }
    expect(isNoteActive(event, 2)).toBe(true)
  })

  test('active partway through its duration', () => {
    const event: TabEvent = { string: 1, fret: 5, startBeat: 2, duration: 1 }
    expect(isNoteActive(event, 2.5)).toBe(true)
  })

  test('not active once duration has elapsed', () => {
    const event: TabEvent = { string: 1, fret: 5, startBeat: 2, duration: 1 }
    expect(isNoteActive(event, 3)).toBe(false)
  })

  test('not active before its start beat', () => {
    const event: TabEvent = { string: 1, fret: 5, startBeat: 2, duration: 1 }
    expect(isNoteActive(event, 1.9)).toBe(false)
  })
})

describe('totalBeatsForEvents', () => {
  test('rounds up a single short measure to 4 beats', () => {
    const events: TabEvent[] = [{ string: 1, fret: 5, startBeat: 0, duration: 1 }]
    expect(totalBeatsForEvents(events)).toBe(4)
  })

  test('rounds up to the next full measure when events overflow one bar', () => {
    const events: TabEvent[] = [{ string: 1, fret: 5, startBeat: 6, duration: 1 }]
    expect(totalBeatsForEvents(events)).toBe(8)
  })

  test('an empty pattern still returns one full measure', () => {
    expect(totalBeatsForEvents([])).toBe(4)
  })

  test('respects a custom beatsPerMeasure', () => {
    const events: TabEvent[] = [{ string: 1, fret: 5, startBeat: 3, duration: 1 }]
    expect(totalBeatsForEvents(events, 3)).toBe(6)
  })
})

describe('nextNoteProximity', () => {
  const events: TabEvent[] = [
    { string: 1, fret: 0, startBeat: 0, duration: 1 },
    { string: 1, fret: 2, startBeat: 4, duration: 1 },
  ]

  test('is 1 (full green) whenever a note is currently active', () => {
    expect(nextNoteProximity(events, 4.5, events[1])).toBe(1)
  })

  test('is 0 when the next note is further away than the lookahead window', () => {
    expect(nextNoteProximity(events, 4 - PROXIMITY_LOOKAHEAD_BEATS - 1, undefined)).toBe(0)
  })

  test('ramps up smoothly as the next note approaches', () => {
    const far = nextNoteProximity(events, 4 - PROXIMITY_LOOKAHEAD_BEATS, undefined)
    const close = nextNoteProximity(events, 4 - PROXIMITY_LOOKAHEAD_BEATS / 2, undefined)
    expect(far).toBeCloseTo(0)
    expect(close).toBeGreaterThan(far)
    expect(close).toBeLessThan(1)
  })

  test('is 0 when there is no more upcoming note in the loop', () => {
    expect(nextNoteProximity(events, 10, undefined)).toBe(0)
  })
})
