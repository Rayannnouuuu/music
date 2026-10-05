import { describe, test, expect } from 'vitest'
import { renderMeasureToLines } from './renderGrid'
import type { Measure } from '../content/types'

describe('renderMeasureToLines', () => {
  test('places two events on string 1 in column order, other strings blank', () => {
    const measure: Measure = {
      events: [
        { string: 1, fret: 5, startBeat: 0, duration: 1 },
        { string: 1, fret: 7, startBeat: 1, duration: 1 },
      ],
    }

    const lines = renderMeasureToLines(measure)

    expect(lines).toHaveLength(6)
    const firstLine = lines[0]
    expect(firstLine.indexOf('5')).toBeGreaterThanOrEqual(0)
    expect(firstLine.indexOf('7')).toBeGreaterThan(firstLine.indexOf('5'))
    for (const line of lines.slice(1)) {
      expect(line).toMatch(/^-+$/)
    }
  })
})
