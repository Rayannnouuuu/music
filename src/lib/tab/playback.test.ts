import { describe, test, expect } from 'vitest'
import { beatsAtTime, activeEventIndex, isEventActive } from './playback'
import type { TabEvent } from '../content/types'

describe('beatsAtTime', () => {
  test('2 seconds at 120bpm is 4 beats', () => {
    expect(beatsAtTime(2, 120)).toBe(4)
  })
})

describe('activeEventIndex', () => {
  const events: TabEvent[] = [
    { string: 6, fret: 0, startBeat: 0, duration: 2 },
    { string: 6, fret: 2, startBeat: 2, duration: 2 },
    { string: 6, fret: 3, startBeat: 4, duration: 2 },
  ]

  test('returns -1 before the first event starts', () => {
    expect(activeEventIndex(events, -0.5)).toBe(-1)
  })

  test('returns the correct index squarely inside each event range', () => {
    expect(activeEventIndex(events, 1)).toBe(0)
    expect(activeEventIndex(events, 3)).toBe(1)
    expect(activeEventIndex(events, 5)).toBe(2)
  })
})

describe('isEventActive', () => {
  const event: TabEvent = { string: 6, fret: 0, startBeat: 2, duration: 1 }

  test('true at the exact start', () => {
    expect(isEventActive(event, 2)).toBe(true)
  })

  test('true just before the end', () => {
    expect(isEventActive(event, 2.99)).toBe(true)
  })

  test('false exactly at the end (end is exclusive)', () => {
    expect(isEventActive(event, 3)).toBe(false)
  })
})
