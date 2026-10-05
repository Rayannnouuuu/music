import { describe, test, expect } from 'vitest'
import { parseAsciiTab } from './asciiImport'
import type { Measure } from '../content/types'

const SILENT_32 = '-'.repeat(32)
const LOW_E_LINE = '0-------3-------2-------5h7-----' // 32 columns, see Task 20 brief algorithm

function cleanFixture(): string {
  return [`e|${SILENT_32}`, `B|${SILENT_32}`, `G|${SILENT_32}`, `D|${SILENT_32}`, `A|${SILENT_32}`, `E|${LOW_E_LINE}`].join(
    '\n',
  )
}

describe('parseAsciiTab', () => {
  test('parses a clean 2-measure fixture into the expected events', () => {
    const result = parseAsciiTab(cleanFixture())
    expect('measures' in result).toBe(true)
    const measures = (result as { measures: Measure[] }).measures

    expect(measures).toEqual([
      {
        events: [
          { string: 6, fret: 0, startBeat: 0, duration: 2 },
          { string: 6, fret: 3, startBeat: 2, duration: 2 },
        ],
      },
      {
        events: [
          { string: 6, fret: 2, startBeat: 0, duration: 2 },
          { string: 6, fret: 5, startBeat: 2, duration: 0.5, technique: 'hammer' },
          { string: 6, fret: 7, startBeat: 2.5, duration: 1 },
        ],
      },
    ])
  })

  test('the 5h7 pattern gives the first note a hammer technique', () => {
    const result = parseAsciiTab(cleanFixture())
    const measures = (result as { measures: Measure[] }).measures
    const hammerEvent = measures[1].events.find((e) => e.fret === 5)
    expect(hammerEvent?.technique).toBe('hammer')
  })

  test('returns an error (not a throw) when one line is shorter than the others', () => {
    const lines = [
      `e|${SILENT_32}`,
      `B|${SILENT_32}`,
      `G|${SILENT_32}`,
      `D|${SILENT_32}`,
      `A|${SILENT_32}`,
      `E|${LOW_E_LINE.slice(0, -1)}`, // one column shorter
    ]
    const result = parseAsciiTab(lines.join('\n'))
    expect(result).toEqual({ error: 'lignes de longueur inégale' })
  })

  test('returns an error when no digits are found anywhere', () => {
    const lines = [
      `e|${SILENT_32}`,
      `B|${SILENT_32}`,
      `G|${SILENT_32}`,
      `D|${SILENT_32}`,
      `A|${SILENT_32}`,
      `E|${SILENT_32}`,
    ]
    const result = parseAsciiTab(lines.join('\n'))
    expect(result).toEqual({ error: 'aucune note trouvée' })
  })
})
