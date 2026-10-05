import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, Gauge, Lightning, Play, Pause, ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react'
import type { TabEvent } from '../../lib/content/types'
import type { Tuning } from '../../lib/audio/tunings'
import {
  NOTE_HIGHWAY_SIZES,
  STANDARD_TUNING_LABELS,
  eventKey,
  nextNoteProximity,
  PRACTICE_APPROACH_BEATS,
} from '../../lib/tab/noteLayout'
import type { PlayerState } from '../../lib/tab/playerState'
import { useProgression } from '../../lib/progression/ProgressionContext'
import NoteHighway from './NoteHighway'
import FretboardDiagram from './FretboardDiagram'
import PracticeValidator from './PracticeValidator'
import BeatIndicator from '../audio/BeatIndicator'
import { Slider } from '../ui/Slider'
import { FilterChips } from '../ui/FilterChips'

interface TabPerformanceViewProps {
  title: string
  artist: string
  loopEvents: TabEvent[]
  loopLength: number
  scrollPos: number
  activeEvent?: TabEvent
  tuning: Tuning
  effectiveBpm: number
  speedPercent: number
  onSpeedChange: (percent: number) => void
  isPlaying: boolean
  onTogglePause: () => void
  onExit: () => void
  xpSoFar: number
  onPieceValidated?: () => void
  // Changes on every enter/restart — forces the practice validator to
  // remount so its internal per-note state can't survive into a new
  // attempt (see useLoopPlayback's attemptId for why that matters).
  attemptId: number
  countdown: number | null
  mode: PlayerState['mode']
  onModeChange: (mode: PlayerState['mode']) => void
  misses: number
  maxMisses: number
  justFailed: boolean
  onRestart: () => void
  hitKeys: Set<string>
  missedKeys: Set<string>
  onNoteResult: (key: string, hit: boolean) => void
  onAdvanceBeat: (beat: number) => void
}

// Wide enough that at most ~3-4 notes are visible ahead of the cursor on a
// typical desktop width at once for a riff with notes every half beat
// (common in these patterns). This is pixels-per-beat, so it's a trade-off:
// more space between notes also means a faster scroll at a given tempo —
// pushed further (680) a fast song became hard to track at all. 480 is a
// middle point; the render-cost fix below (React.memo + stable event refs)
// addresses the dropped-frames part of that independently of this value.
const PX_PER_BEAT = 480
const CURSOR_OFFSET_PX = 110
// The highway is centered vertically inside its flex-1 container; if that
// container shrinks below the 6 lanes' actual height, the centering clips
// the top and bottom strings symmetrically instead of just scrolling.
const HIGHWAY_HEIGHT = 6 * NOTE_HIGHWAY_SIZES.lg.lane
// Rendered side-by-side copies of the loop, wide enough that the viewport
// never runs out of content before the scroll position wraps back to 0 —
// the wrap is invisible because copy N+1 is pixel-identical to copy N.
const STRIP_COPIES = 8

const TECHNIQUE_LEGEND = 'H hammer-on · P pull-off · / slide · ~ vibrato · PM palm mute (étouffé)'

export default function TabPerformanceView({
  title,
  artist,
  loopEvents,
  loopLength,
  scrollPos,
  activeEvent,
  tuning,
  effectiveBpm,
  speedPercent,
  onSpeedChange,
  isPlaying,
  onTogglePause,
  onExit,
  xpSoFar,
  onPieceValidated,
  attemptId,
  countdown,
  mode,
  onModeChange,
  misses,
  maxMisses,
  justFailed,
  onRestart,
  hitKeys,
  missedKeys,
  onNoteResult,
  onAdvanceBeat,
}: TabPerformanceViewProps) {
  const { state: progressState } = useProgression()
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  const translateX = CURSOR_OFFSET_PX - scrollPos * PX_PER_BEAT
  const noteProximity = nextNoteProximity(loopEvents, scrollPos, activeEvent)
  const cursorColor = `color-mix(in srgb, var(--color-success) ${Math.round(noteProximity * 100)}%, var(--color-accent-strong))`
  const counting = countdown !== null

  function handleNoteResult(key: string, hit: boolean) {
    onNoteResult(key, hit)
    if (hit && mode === 'practice') {
      const idx = loopEvents.findIndex((e) => eventKey(e) === key)
      const next = idx !== -1 ? (loopEvents[idx + 1] ?? loopEvents[0]) : undefined
      // Re-anchor a bit before the next note rather than jumping onto it,
      // so it gets its own short animated approach instead of appearing
      // instantly "due" — elapsedBeats has kept ticking the whole time this
      // note was being waited on and is likely already well past this point.
      if (next) onAdvanceBeat(next.startBeat - PRACTICE_APPROACH_BEATS)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg/97 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
        <div>
          <p className="text-lg font-semibold text-text">{title}</p>
          <p className="text-sm text-text-muted">{artist}</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterChips
            layoutId="performance-mode-pill"
            value={mode}
            onChange={onModeChange}
            options={[
              { value: 'tempo', label: 'Tempo' },
              { value: 'practice', label: 'Entraînement' },
            ]}
          />
          <button
            onClick={onTogglePause}
            aria-label={isPlaying ? 'Pause' : 'Reprendre'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
          >
            {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          </button>
          <button
            onClick={onExit}
            aria-label="Quitter le mode performance"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden" style={{ minHeight: HIGHWAY_HEIGHT + 24 }}>
        <AnimatePresence>
          {counting && (
            <motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-bg/80"
            >
              <span className="font-mono text-8xl font-black text-accent-strong">
                {countdown === 0 ? 'GO' : countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {justFailed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-bg/90 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
                <WarningCircle size={28} weight="fill" />
              </span>
              <p className="text-lg font-semibold text-text">
                {maxMisses} faute{maxMisses > 1 ? 's' : ''} — on reprend depuis le début
              </p>
              <p className="max-w-sm text-sm text-text-muted">
                Essaie de jouer tout le passage sans erreur. Tu peux passer en mode entraînement pour
                répéter à ton rythme avant de retenter en tempo.
              </p>
              <button
                onClick={onRestart}
                className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-accent px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-strong"
              >
                <ArrowCounterClockwise size={16} />
                Réessayer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="pointer-events-none absolute left-0 top-1/2 z-10 flex -translate-y-1/2 flex-col"
          style={{ height: HIGHWAY_HEIGHT }}
        >
          {STANDARD_TUNING_LABELS.map((label, i) => (
            <span key={label + i} className="flex flex-1 items-center pl-3">
              <span className="rounded bg-bg/90 px-1.5 py-0.5 font-mono text-sm font-semibold text-text-muted">
                {label}
              </span>
            </span>
          ))}
        </div>
        <motion.div
          className="pointer-events-none absolute top-0 z-10 h-full w-[3px] rounded-full"
          style={{
            left: CURSOR_OFFSET_PX,
            backgroundColor: cursorColor,
            boxShadow: `0 0 24px ${cursorColor}`,
          }}
          animate={isPlaying && mode === 'tempo' ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={{
            duration: effectiveBpm > 0 ? 60 / effectiveBpm : 1,
            repeat: isPlaying && mode === 'tempo' ? Infinity : 0,
            ease: 'easeInOut',
          }}
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
              // Every copy renders the same events at the same relative
              // position, but only copy 0 is the one currently crossing the
              // cursor (copies 1+ are just upcoming-loop previews) — so only
              // it should light up, or every repeat would highlight at once.
              activeBeat={i === 0 ? scrollPos : undefined}
              hitKeys={i === 0 ? hitKeys : undefined}
              missedKeys={i === 0 ? missedKeys : undefined}
              pxPerBeat={PX_PER_BEAT}
              size="lg"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-4">
        <FretboardDiagram activeString={activeEvent?.string} activeFret={activeEvent?.fret} />
      </div>

      <p className="px-4 pb-1 text-center text-xs text-text-muted sm:px-6">{TECHNIQUE_LEGEND}</p>
      <p className="px-4 pb-2 text-center text-xs text-text-muted sm:px-6">
        Détection calée sur l&rsquo;accordage <span className="font-semibold text-text">{tuning.label}</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-border-soft p-4 sm:p-6">
        {mode === 'tempo' ? (
          <>
            <div className="flex items-center gap-2 font-mono text-sm text-text-muted">
              <Gauge size={16} />
              {Math.round(effectiveBpm)} BPM
              <BeatIndicator bpm={effectiveBpm} isPlaying={isPlaying} />
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

            <div
              className={`flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-semibold ${
                misses >= maxMisses - 1 ? 'bg-danger-soft text-danger' : 'bg-panel-raised text-text-muted'
              }`}
            >
              <WarningCircle size={16} weight="fill" />
              {misses}/{maxMisses} fautes
            </div>
          </>
        ) : (
          <p className="text-sm text-text-muted">
            Mode entraînement — joue la bonne note pour avancer, à ton rythme, sans limite de temps.
          </p>
        )}

        <div className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-success-soft px-3 py-1.5 text-sm font-semibold text-success">
          <Lightning size={16} weight="fill" />+{xpSoFar} XP
        </div>
      </div>

      {progressState.autoDetectEnabled && (
        <div className="border-t border-border-soft px-4 py-3 sm:px-6">
          <PracticeValidator
            key={attemptId}
            activeEvent={activeEvent}
            tuning={tuning}
            totalNotes={loopEvents.length}
            onValidated={onPieceValidated}
            onNoteResult={handleNoteResult}
          />
        </div>
      )}
    </motion.div>
  )
}
