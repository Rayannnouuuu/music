import type { Tuning } from './tunings'
import type { GuitarString } from '../content/types'

// Frequency of a fretted note: the open string's frequency, raised by one
// equal-tempered semitone per fret (2^(1/12) per semitone).
export function expectedFrequency(tuning: Tuning, string: GuitarString, fret: number): number {
  return tuning.strings[string - 1].freq * Math.pow(2, fret / 12)
}

// How closely a detected frequency matches an expected one, as 0-100.
// 0 cents off (exact match) is 100; 100 cents off (a full semitone, e.g. the
// wrong fret) is 0 — so natural pitch wobble from a real guitar stays well
// above 0 while a genuinely wrong note drops to it.
export function matchPercent(detectedFreq: number, expectedFreq: number): number {
  const cents = 1200 * Math.log2(detectedFreq / expectedFreq)
  return Math.max(0, Math.min(100, 100 - Math.abs(cents)))
}
