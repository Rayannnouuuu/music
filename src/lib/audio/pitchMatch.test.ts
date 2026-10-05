import { describe, test, expect } from 'vitest'
import { expectedFrequency, matchPercent } from './pitchMatch'
import { TUNINGS } from './tunings'

describe('expectedFrequency', () => {
  const standard = TUNINGS.find((t) => t.id === 'standard')!

  test('an open string (fret 0) is the tuning\'s own frequency', () => {
    expect(expectedFrequency(standard, 6, 0)).toBeCloseTo(82.41, 2)
  })

  test('fret 12 is exactly one octave above the open string', () => {
    expect(expectedFrequency(standard, 6, 12)).toBeCloseTo(82.41 * 2, 1)
  })

  test('uses the string parameter to index the right open string', () => {
    expect(expectedFrequency(standard, 1, 0)).toBeCloseTo(329.63, 2)
  })
})

describe('matchPercent', () => {
  test('an exact match scores 100', () => {
    expect(matchPercent(440, 440)).toBe(100)
  })

  test('a full semitone off scores 0', () => {
    const semitoneUp = 440 * Math.pow(2, 1 / 12)
    expect(matchPercent(semitoneUp, 440)).toBeCloseTo(0, 5)
  })

  test('more than a semitone off clamps at 0, never negative', () => {
    const wayOff = 440 * Math.pow(2, 5 / 12)
    expect(matchPercent(wayOff, 440)).toBe(0)
  })

  test('10 cents off scores 90', () => {
    const tenCentsUp = 440 * Math.pow(2, 10 / 1200)
    expect(matchPercent(tenCentsUp, 440)).toBeCloseTo(90, 5)
  })

  test('is symmetric: flat and sharp by the same amount score the same', () => {
    const sharp = 440 * Math.pow(2, 20 / 1200)
    const flat = 440 * Math.pow(2, -20 / 1200)
    expect(matchPercent(sharp, 440)).toBeCloseTo(matchPercent(flat, 440), 5)
  })
})
