import type { Tab, Exercise, TabEvent, Measure } from './types'

export class ContentValidationError extends Error {}

function fail(message: string): never {
  throw new ContentValidationError(message)
}

function requireField(obj: Record<string, unknown>, field: string): void {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
    fail(`missing required field "${field}"`)
  }
}

function validateEvent(event: TabEvent, index: number): void {
  if (event.string < 1 || event.string > 6) {
    fail(`event[${index}].string is out of range 1-6: ${event.string}`)
  }
  if (event.fret < 0 || event.fret > 24) {
    fail(`event[${index}].fret is out of range 0-24: ${event.fret}`)
  }
  if (event.duration <= 0) {
    fail(`event[${index}].duration must be > 0: ${event.duration}`)
  }
}

function validateEventSequence(events: TabEvent[]): void {
  events.forEach(validateEvent)
  for (let i = 1; i < events.length; i++) {
    if (events[i].startBeat < events[i - 1].startBeat) {
      fail(
        `startBeat must be ascending within a measure: event[${i}].startBeat (${events[i].startBeat}) < event[${i - 1}].startBeat (${events[i - 1].startBeat})`,
      )
    }
  }
}

function validateMeasures(measures: Measure[]): void {
  for (const measure of measures) {
    validateEventSequence(measure.events)
  }
}

function validateDifficulty(difficulty: number): void {
  if (difficulty < 1 || difficulty > 10) {
    fail(`difficulty is out of range 1-10: ${difficulty}`)
  }
}

export function validateTab(data: unknown): Tab {
  const obj = data as Record<string, unknown>
  for (const field of ['id', 'title', 'artist', 'subgenre', 'tuning', 'originalTempo', 'difficulty', 'measures']) {
    requireField(obj, field)
  }
  const tab = obj as unknown as Tab
  validateDifficulty(tab.difficulty)
  validateMeasures(tab.measures)
  return tab
}

export function validateExercise(data: unknown): Exercise {
  const obj = data as Record<string, unknown>
  for (const field of ['id', 'title', 'category', 'difficulty', 'description', 'targetBpm', 'xpReward', 'pattern']) {
    requireField(obj, field)
  }
  const exercise = obj as unknown as Exercise
  validateDifficulty(exercise.difficulty)
  validateEventSequence(exercise.pattern)
  return exercise
}
