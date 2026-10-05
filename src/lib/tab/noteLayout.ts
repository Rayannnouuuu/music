import type { TabEvent } from '../content/types'

export const TECHNIQUE_LABEL: Record<NonNullable<TabEvent['technique']>, string> = {
  hammer: 'H',
  pull: 'P',
  bend: 'B',
  slide: '/',
  vibrato: '~',
  palmMute: 'PM',
}

export const NOTE_HIGHWAY_SIZES = {
  md: { lane: 34, note: 26, font: 12 },
  lg: { lane: 56, note: 42, font: 17 },
} as const

// Open-string names from string 1 (high e) to string 6 (low E), matching
// the lane order so the highway can double as a labeled, real-feeling neck.
export const STANDARD_TUNING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'] as const

export function isNoteActive(event: TabEvent, currentBeat: number): boolean {
  return event.startBeat <= currentBeat && currentBeat < event.startBeat + event.duration
}

// Identifies one specific note occurrence within a loop (string+fret alone
// isn't unique since the same fret can repeat at different beats). Shared
// by the practice validator (which tracks hit/miss per note) and the
// highway (which colors notes by that same result).
export function eventKey(event: TabEvent | undefined): string | undefined {
  return event ? `${event.string}-${event.fret}-${event.startBeat}` : undefined
}

// Grid width for a strip of events, rounded up to a full measure so the
// layout always ends on a clean bar line instead of clipping mid-beat.
export function totalBeatsForEvents(events: TabEvent[], beatsPerMeasure = 4): number {
  const furthestEnd = events.reduce((max, e) => Math.max(max, e.startBeat + e.duration), 0)
  const measures = Math.max(1, Math.ceil(furthestEnd / beatsPerMeasure))
  return measures * beatsPerMeasure
}

// How many beats out the cursor starts tinting toward green before a note
// is actually due — gives an early "it's coming up" cue instead of a
// binary switch exactly when the note arrives.
export const PROXIMITY_LOOKAHEAD_BEATS = 1.2

// 0 = far from the next note, 1 = right at (or within) the note to play now.
export function nextNoteProximity(
  loopEvents: TabEvent[],
  scrollPos: number,
  activeEvent?: TabEvent,
): number {
  if (activeEvent) return 1
  const upcoming = loopEvents.find((e) => e.startBeat > scrollPos)
  if (!upcoming) return 0
  const distance = upcoming.startBeat - scrollPos
  return Math.max(0, Math.min(1, 1 - distance / PROXIMITY_LOOKAHEAD_BEATS))
}
