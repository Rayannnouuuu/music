import type { TabEvent } from '../content/types'

export function beatsAtTime(elapsedSeconds: number, bpm: number): number {
  return elapsedSeconds * (bpm / 60)
}

export function activeEventIndex(events: TabEvent[], currentBeat: number): number {
  let index = -1
  for (let i = 0; i < events.length; i++) {
    if (events[i].startBeat <= currentBeat) {
      index = i
    } else {
      break
    }
  }
  return index
}

export function isEventActive(event: TabEvent, currentBeat: number): boolean {
  return event.startBeat <= currentBeat && currentBeat < event.startBeat + event.duration
}
