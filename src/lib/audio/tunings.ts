export interface Tuning {
  id: string
  label: string
  strings: { note: string; freq: number }[] // high e first
}

export const TUNINGS: Tuning[] = [
  {
    id: 'standard',
    label: 'Standard (E A D G B E)',
    strings: [
      { note: 'E4', freq: 329.63 },
      { note: 'B3', freq: 246.94 },
      { note: 'G3', freq: 196.0 },
      { note: 'D3', freq: 146.83 },
      { note: 'A2', freq: 110.0 },
      { note: 'E2', freq: 82.41 },
    ],
  },
  {
    id: 'dropD',
    label: 'Drop D',
    strings: [
      { note: 'E4', freq: 329.63 },
      { note: 'B3', freq: 246.94 },
      { note: 'G3', freq: 196.0 },
      { note: 'D3', freq: 146.83 },
      { note: 'A2', freq: 110.0 },
      { note: 'D2', freq: 73.42 },
    ],
  },
  {
    id: 'eb',
    label: 'Eb (demi-ton bas)',
    strings: [
      { note: 'Eb4', freq: 311.13 },
      { note: 'Bb3', freq: 233.08 },
      { note: 'Gb3', freq: 185.0 },
      { note: 'Db3', freq: 138.59 },
      { note: 'Ab2', freq: 103.83 },
      { note: 'Eb2', freq: 77.78 },
    ],
  },
  {
    id: 'openG',
    label: 'Open G',
    strings: [
      { note: 'D4', freq: 293.66 },
      { note: 'B3', freq: 246.94 },
      { note: 'G3', freq: 196.0 },
      { note: 'D3', freq: 146.83 },
      { note: 'G2', freq: 98.0 },
      { note: 'D2', freq: 73.42 },
    ],
  },
  {
    id: 'openD',
    label: 'Open D',
    strings: [
      { note: 'D4', freq: 293.66 },
      { note: 'A3', freq: 220.0 },
      { note: 'F#3', freq: 185.0 },
      { note: 'D3', freq: 146.83 },
      { note: 'A2', freq: 110.0 },
      { note: 'D2', freq: 73.42 },
    ],
  },
]

// Tab/exercise content stores tuning as free text (e.g. "Standard", "Drop D",
// "Eb"). Match it against a known tuning's id or label, falling back to
// standard tuning for anything unrecognized.
export function findTuningByLabel(label: string): Tuning {
  const normalized = label.trim().toLowerCase()
  return (
    TUNINGS.find((t) => t.id.toLowerCase() === normalized) ??
    TUNINGS.find((t) => t.label.toLowerCase().startsWith(normalized)) ??
    TUNINGS[0]
  )
}
