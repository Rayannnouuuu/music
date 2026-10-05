import { describe, test, expect } from 'vitest'
import { frequencyToNote } from './noteUtils'

describe('frequencyToNote', () => {
  test('440 Hz is A4 with 0 cents', () => {
    expect(frequencyToNote(440)).toEqual({ note: 'A', octave: 4, cents: 0 })
  })

  test('445 Hz is still A4 but with a small positive cents offset', () => {
    const result = frequencyToNote(445)
    expect(result.note).toBe('A')
    expect(result.octave).toBe(4)
    expect(result.cents).toBeGreaterThan(0)
    expect(result.cents).toBeCloseTo(20, 0)
  })

  test('220 Hz is A3 with 0 cents', () => {
    expect(frequencyToNote(220)).toEqual({ note: 'A', octave: 3, cents: 0 })
  })
})
