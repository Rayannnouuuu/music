import type { Measure, TabEvent, GuitarString, Technique } from '../content/types'

const COLUMNS_PER_BEAT = 4
const BEATS_PER_MEASURE = 4

const TECHNIQUE_CHARS: Record<string, Technique> = {
  h: 'hammer',
  p: 'pull',
  b: 'bend',
  '/': 'slide',
  '\\': 'slide',
  '~': 'vibrato',
}

interface RawRun {
  startCol: number
  fret: number
  technique?: Technique
}

function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9'
}

function findDigitRuns(line: string): RawRun[] {
  const runs: RawRun[] = []
  let i = 0
  while (i < line.length) {
    if (isDigit(line[i])) {
      const start = i
      let j = i
      while (isDigit(line[j])) j++
      const fret = Number(line.slice(start, j))
      const technique = TECHNIQUE_CHARS[line[j]]
      runs.push({ startCol: start, fret, technique })
      i = j
    } else {
      i++
    }
  }
  return runs
}

const LINE_LABEL = /^[a-zA-Z]\|(.*)$/

export function parseAsciiTab(text: string): { measures: Measure[] } | { error: string } {
  const nonEmptyLines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)

  if (nonEmptyLines.length !== 6) {
    return { error: 'lignes de longueur inégale' }
  }

  const stripped: string[] = []
  for (const line of nonEmptyLines) {
    const match = LINE_LABEL.exec(line)
    if (!match) {
      return { error: 'lignes de longueur inégale' }
    }
    stripped.push(match[1])
  }

  const lineLength = stripped[0].length
  if (stripped.some((line) => line.length !== lineLength)) {
    return { error: 'lignes de longueur inégale' }
  }

  const events: TabEvent[] = []
  stripped.forEach((line, lineIndex) => {
    const stringNumber = (lineIndex + 1) as GuitarString
    const runs = findDigitRuns(line)
    runs.forEach((run, runIndex) => {
      const nextRun = runs[runIndex + 1]
      const duration = nextRun ? (nextRun.startCol - run.startCol) / COLUMNS_PER_BEAT : 1
      events.push({
        string: stringNumber,
        fret: run.fret,
        startBeat: run.startCol / COLUMNS_PER_BEAT,
        duration,
        technique: run.technique,
      })
    })
  })

  if (events.length === 0) {
    return { error: 'aucune note trouvée' }
  }

  events.sort((a, b) => a.startBeat - b.startBeat)

  const numMeasures = Math.max(1, Math.ceil(lineLength / (COLUMNS_PER_BEAT * BEATS_PER_MEASURE)))
  const measures: Measure[] = Array.from({ length: numMeasures }, () => ({ events: [] }))

  for (const event of events) {
    const measureIndex = Math.min(
      Math.floor(event.startBeat / BEATS_PER_MEASURE),
      numMeasures - 1,
    )
    measures[measureIndex].events.push({
      ...event,
      startBeat: event.startBeat - measureIndex * BEATS_PER_MEASURE,
    })
  }

  return { measures }
}
