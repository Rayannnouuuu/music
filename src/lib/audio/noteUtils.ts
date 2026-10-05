const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function frequencyToNote(
  freq: number,
  referenceA4 = 440,
): { note: string; octave: number; cents: number } {
  const semitonesFromA4 = 12 * Math.log2(freq / referenceA4)
  const rounded = Math.round(semitonesFromA4)
  const cents = Math.round((semitonesFromA4 - rounded) * 100)

  const midiNote = 69 + rounded // MIDI note 69 = A4
  const noteIndex = ((midiNote % 12) + 12) % 12
  const octave = Math.floor(midiNote / 12) - 1

  return { note: NOTE_NAMES[noteIndex], octave, cents }
}
