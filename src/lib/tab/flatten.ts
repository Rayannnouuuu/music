import type { Tab, TabEvent } from '../content/types'

// Concatenates every measure's events into one absolute-beat timeline, so a
// whole tab (or a loop window cut from it) can be scrolled through as a
// single continuous strip instead of one measure at a time.
export function flattenTabEvents(tab: Tab, beatsPerMeasure: number): TabEvent[] {
  return tab.measures.flatMap((measure, measureIndex) =>
    measure.events.map((event) => ({
      ...event,
      startBeat: event.startBeat + measureIndex * beatsPerMeasure,
    })),
  )
}

// Cuts out the events falling inside [start, end) and rebases them to start
// at 0, so the loop window can be rendered as its own self-contained strip.
export function eventsInRange(events: TabEvent[], start: number, end: number): TabEvent[] {
  return events
    .filter((event) => event.startBeat >= start && event.startBeat < end)
    .map((event) => ({ ...event, startBeat: event.startBeat - start }))
}
