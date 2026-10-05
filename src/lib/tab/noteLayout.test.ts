import { describe, test, expect } from 'vitest'
import { isNoteActive, totalBeatsForEvents } from './noteLayout'
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
