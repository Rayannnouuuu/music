import { useEffect } from 'react'
import { motion } from 'motion/react'
import { X, Gauge, Lightning } from '@phosphor-icons/react'
import type { TabEvent } from '../../lib/content/types'
import { NOTE_HIGHWAY_SIZES, STANDARD_TUNING_LABELS } from '../../lib/tab/noteLayout'
import NoteHighway from './NoteHighway'
import FretboardDiagram from './FretboardDiagram'
import BeatIndicator from '../audio/BeatIndicator'
import { Slider } from '../ui/Slider'

interface TabPerformanceViewProps {
  title: string
  artist: string
  loopEvents: TabEvent[]
  loopLength: number
  scrollPos: number
  activeEvent?: TabEvent
  effectiveBpm: number
  speedPercent: number
  onSpeedChange: (percent: number) => void
  onExit: () => void
  xpSoFar: number
}

const PX_PER_BEAT = 130
const CURSOR_OFFSET_PX = 110
// Rendered side-by-side copies of the loop, wide enough that the viewport
// never runs out of content before the scroll position wraps back to 0 —
// the wrap is invisible because copy N+1 is pixel-identical to copy N.
const STRIP_COPIES = 8

export default function TabPerformanceView({
  title,
  artist,
  loopEvents,
  loopLength,
  scrollPos,
  activeEvent,
  effectiveBpm,
  speedPercent,
  onSpeedChange,
  onExit,
  xpSoFar,
}: TabPerformanceViewProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  const translateX = CURSOR_OFFSET_PX - scrollPos * PX_PER_BEAT

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col bg-bg/97 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
        <div>
          <p className="text-lg font-semibold text-text">{title}</p>
          <p className="text-sm text-text-muted">{artist}</p>
        </div>
        <button
          onClick={onExit}
          aria-label="Quitter le mode performance"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute left-0 top-1/2 z-10 flex -translate-y-1/2 flex-col"
          style={{ height: 6 * NOTE_HIGHWAY_SIZES.lg.lane }}
        >
          {STANDARD_TUNING_LABELS.map((label, i) => (
            <span key={label + i} className="flex flex-1 items-center pl-3">
              <span className="rounded bg-bg/90 px-1.5 py-0.5 font-mono text-sm font-semibold text-text-muted">
                {label}
              </span>
            </span>
          ))}
        </div>
        <div
          className="pointer-events-none absolute top-0 z-10 h-full w-[3px] rounded-full bg-accent-strong shadow-[0_0_24px_var(--color-accent)]"
          style={{ left: CURSOR_OFFSET_PX }}
        />
        <div
          className="absolute left-0 top-1/2 flex"
          style={{ transform: `translate(${translateX}px, -50%)` }}
        >
          {Array.from({ length: STRIP_COPIES }, (_, i) => (
            <NoteHighway
              key={i}
              events={loopEvents}
              totalBeats={loopLength}
              activeBeat={scrollPos}
              pxPerBeat={PX_PER_BEAT}
              size="lg"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-4">
        <FretboardDiagram activeString={activeEvent?.string} activeFret={activeEvent?.fret} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-border-soft p-4 sm:p-6">
        <div className="flex items-center gap-2 font-mono text-sm text-text-muted">
          <Gauge size={16} />
          {Math.round(effectiveBpm)} BPM
          <BeatIndicator bpm={effectiveBpm} isPlaying />
        </div>

        <div className="w-48">
          <Slider
            label="Vitesse"
            value={speedPercent}
            min={50}
            max={150}
            step={5}
            onChange={onSpeedChange}
            formatValue={(v) => `${v}%`}
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-success-soft px-3 py-1.5 text-sm font-semibold text-success">
          <Lightning size={16} weight="fill" />+{xpSoFar} XP
        </div>
      </div>
    </motion.div>
  )
}
