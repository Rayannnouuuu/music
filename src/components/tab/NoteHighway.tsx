import { motion } from 'motion/react'
import type { TabEvent } from '../../lib/content/types'
import { TECHNIQUE_LABEL, isNoteActive, NOTE_HIGHWAY_SIZES } from '../../lib/tab/noteLayout'

export interface NoteHighwayProps {
  events: TabEvent[]
  totalBeats: number
  activeBeat?: number
  beatsPerMeasure?: number
  pxPerBeat?: number
  size?: 'md' | 'lg'
}

const STRING_COUNT = 6

export default function NoteHighway({
  events,
  totalBeats,
  activeBeat,
  beatsPerMeasure = 4,
  pxPerBeat = 56,
  size = 'md',
}: NoteHighwayProps) {
  const { lane, note, font } = NOTE_HIGHWAY_SIZES[size]
  const width = totalBeats * pxPerBeat
  const height = STRING_COUNT * lane

  const measureLines = Array.from(
    { length: Math.floor(totalBeats / beatsPerMeasure) + 1 },
    (_, i) => i * beatsPerMeasure,
  )

  return (
    <div className="relative" style={{ width, height }}>
      {Array.from({ length: STRING_COUNT }, (_, stringIndex) => (
        <div
          key={`string-${stringIndex}`}
          className="absolute left-0 bg-[var(--color-text-muted)]/35"
          style={{
            top: stringIndex * lane + lane / 2,
            width,
            height: 1 + stringIndex * 0.6,
          }}
        />
      ))}

      {measureLines.map((beat) => (
        <div
          key={`measure-${beat}`}
          className={`absolute top-0 ${beat === 0 ? 'bg-[var(--color-text-muted)]/60' : 'bg-[var(--color-text-muted)]/25'}`}
          style={{ left: beat * pxPerBeat, width: beat === 0 ? 2 : 1, height }}
        />
      ))}

      {events.map((event, i) => {
        const active = activeBeat !== undefined && isNoteActive(event, activeBeat)
        const laneIndex = event.string - 1
        const label = event.technique ? TECHNIQUE_LABEL[event.technique] : ''
        return (
          <motion.div
            key={`${event.string}-${event.startBeat}-${i}`}
            data-testid={`note-${event.string}-${event.fret}`}
            className={`absolute flex items-center justify-center rounded-full border-2 font-mono font-semibold text-text ${
              active
                ? 'border-accent bg-accent shadow-[0_0_18px_var(--color-accent)]'
                : 'border-[var(--color-text-muted)]/70 bg-[var(--color-panel-hover)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
            }`}
            style={{
              left: event.startBeat * pxPerBeat,
              top: laneIndex * lane + lane / 2,
              width: note,
              height: note,
              fontSize: font,
              marginLeft: -note / 2,
              marginTop: -note / 2,
            }}
            animate={active ? { scale: [1, 1.22, 1.08] } : { scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {event.fret}
            {label && (
              <span
                className={`absolute -right-1 -top-1 rounded-full px-1 text-[9px] font-bold leading-tight ${
                  active ? 'bg-accent-strong text-bg' : 'bg-[var(--color-text-muted)] text-bg'
                }`}
              >
                {label}
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
