import type { Tab, Exercise, TabEvent, Measure, Category } from './types'

export class ContentValidationError extends Error {}

function fail(message: string): never {
  throw new ContentValidationError(message)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const CATEGORIES: Category[] = [
  'scales',
  'legato',
  'picking',
  'bends',
  'palmMuting',
  'sweep',
  'rhythm',
  'arpeggios',
]

function requireObject(data: unknown, kind: string): Record<string, unknown> {
  if (!isPlainObject(data)) fail(`${kind} must be an object, got ${typeof data}`)
  return data
}

function requireString(obj: Record<string, unknown>, field: string): void {
  if (typeof obj[field] !== 'string' || obj[field] === '') {
    fail(`missing or invalid required field "${field}"`)
  }
}

function requireFiniteNumber(obj: Record<string, unknown>, field: string): void {
  if (typeof obj[field] !== 'number' || !Number.isFinite(obj[field])) {
    fail(`missing or invalid required field "${field}"`)
  }
}

function validateEvent(event: unknown, index: number): TabEvent {
  if (!isPlainObject(event)) fail(`event[${index}] must be an object`)
  const { string, fret, startBeat, duration } = event

  if (!Number.isInteger(string) || (string as number) < 1 || (string as number) > 6) {
    fail(`event[${index}].string is out of range 1-6: ${string}`)
  }
  if (!Number.isInteger(fret) || (fret as number) < 0 || (fret as number) > 24) {
    fail(`event[${index}].fret is out of range 0-24: ${fret}`)
  }
  if (typeof startBeat !== 'number' || !Number.isFinite(startBeat) || startBeat < 0) {
    fail(`event[${index}].startBeat must be a non-negative number: ${startBeat}`)
  }
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
    fail(`event[${index}].duration must be > 0: ${duration}`)
  }

  return event as unknown as TabEvent
}

function validateEventSequence(events: unknown, kind: string): TabEvent[] {
  if (!Array.isArray(events)) fail(`${kind} must be an array`)
  const validated = events.map((event, index) => validateEvent(event, index))
  for (let i = 1; i < validated.length; i++) {
    if (validated[i].startBeat < validated[i - 1].startBeat) {
      fail(
        `startBeat must be ascending within a measure: event[${i}].startBeat (${validated[i].startBeat}) < event[${i - 1}].startBeat (${validated[i - 1].startBeat})`,
      )
    }
  }
  return validated
}

function validateMeasures(measures: unknown): Measure[] {
  if (!Array.isArray(measures)) fail('measures must be an array')
  if (measures.length === 0) fail('measures must contain at least one measure')
  return measures.map((measure) => {
    if (!isPlainObject(measure)) fail('each measure must be an object')
    return { events: validateEventSequence(measure.events, 'measure.events') }
  })
}

function validateDifficulty(difficulty: unknown): number {
  if (!Number.isInteger(difficulty) || (difficulty as number) < 1 || (difficulty as number) > 10) {
    fail(`difficulty is out of range 1-10: ${difficulty}`)
  }
  return difficulty as number
}

export function validateTab(data: unknown): Tab {
  const obj = requireObject(data, 'Tab')
  requireString(obj, 'id')
  requireString(obj, 'title')
  requireString(obj, 'artist')
  requireString(obj, 'subgenre')
  requireString(obj, 'tuning')
  requireFiniteNumber(obj, 'originalTempo')
  if ((obj.originalTempo as number) <= 0) {
    fail(`originalTempo must be > 0: ${obj.originalTempo}`)
  }
  const difficulty = validateDifficulty(obj.difficulty)
  const measures = validateMeasures(obj.measures)

  return {
    id: obj.id as string,
    title: obj.title as string,
    artist: obj.artist as string,
    subgenre: obj.subgenre as string,
    tuning: obj.tuning as string,
    originalTempo: obj.originalTempo as number,
    difficulty,
    measures,
  }
}

export function validateExercise(data: unknown): Exercise {
  const obj = requireObject(data, 'Exercise')
  requireString(obj, 'id')
  requireString(obj, 'title')
  requireString(obj, 'description')
  if (typeof obj.category !== 'string' || !CATEGORIES.includes(obj.category as Category)) {
    fail(`category must be one of ${CATEGORIES.join(', ')}: ${obj.category}`)
  }
  requireFiniteNumber(obj, 'targetBpm')
  if ((obj.targetBpm as number) <= 0) {
    fail(`targetBpm must be > 0: ${obj.targetBpm}`)
  }
  requireFiniteNumber(obj, 'xpReward')
  const difficulty = validateDifficulty(obj.difficulty)
  const pattern = validateEventSequence(obj.pattern, 'pattern')

  return {
    id: obj.id as string,
    title: obj.title as string,
    category: obj.category as Category,
    difficulty,
    description: obj.description as string,
    targetBpm: obj.targetBpm as number,
    xpReward: obj.xpReward as number,
    pattern,
  }
}
