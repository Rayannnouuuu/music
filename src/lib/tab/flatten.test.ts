import { describe, test, expect } from 'vitest'
import { flattenTabEvents, eventsInRange } from './flatten'
import type { Tab } from '../content/types'

function tabWithMeasures(): Tab {
  return {
    id: 't',
    title: 'T',
    artist: 'A',
    subgenre: 'thrash',
    tuning: 'Standard',
    originalTempo: 120,
    difficulty: 5,
    measures: [
      { events: [{ string: 6, fret: 0, startBeat: 0, duration: 1 }] },
      { events: [{ string: 6, fret: 2, startBeat: 1, duration: 1 }] },
    ],
  }
}

describe('flattenTabEvents', () => {
  test('offsets each measure by its index times beatsPerMeasure', () => {
    const result = flattenTabEvents(tabWithMeasures(), 4)
    expect(result).toEqual([
      { string: 6, fret: 0, startBeat: 0, duration: 1 },
      { string: 6, fret: 2, startBeat: 5, duration: 1 },
    ])
  })
})

describe('eventsInRange', () => {
  const flat = flattenTabEvents(tabWithMeasures(), 4)

  test('keeps events within [start, end) and rebases startBeat to the window', () => {
    const result = eventsInRange(flat, 4, 8)
    expect(result).toEqual([{ string: 6, fret: 2, startBeat: 1, duration: 1 }])
  })

  test('excludes events at or past the end boundary', () => {
    const result = eventsInRange(flat, 0, 4)
    expect(result).toEqual([{ string: 6, fret: 0, startBeat: 0, duration: 1 }])
  })

  test('an empty window returns no events', () => {
    expect(eventsInRange(flat, 100, 104)).toEqual([])
  })
})
