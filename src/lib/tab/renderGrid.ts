import type { Measure } from '../content/types'

const COLUMNS_PER_BEAT = 4

export function columnForBeat(startBeat: number): number {
  return Math.round(startBeat * COLUMNS_PER_BEAT)
}

export function renderMeasureToLines(measure: Measure): string[] {
  const maxBeat = measure.events.reduce((max, e) => Math.max(max, e.startBeat), 0)
  const length = columnForBeat(maxBeat) + COLUMNS_PER_BEAT + 1

  const lines: string[][] = Array.from({ length: 6 }, () => Array(length).fill('-'))

  for (const event of measure.events) {
    const col = columnForBeat(event.startBeat)
    const lineIndex = event.string - 1 // string 1 (high e) -> line 0
    const digits = String(event.fret).split('')
    digits.forEach((digit, offset) => {
      if (col + offset < length) {
        lines[lineIndex][col + offset] = digit
      }
    })
  }

  return lines.map((chars) => chars.join(''))
}
