import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Microphone, MicrophoneSlash, Trophy } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'motion/react'
import type { TabEvent } from '../../lib/content/types'
import type { Tuning } from '../../lib/audio/tunings'
import { usePitchDetector } from '../../lib/audio/usePitchDetector'
import { expectedFrequency, matchPercent } from '../../lib/audio/pitchMatch'
import { eventKey } from '../../lib/tab/noteLayout'

const NOTE_VALIDATION_THRESHOLD = 90
const PIECE_VALIDATION_THRESHOLD = 90

interface PracticeValidatorProps {
  activeEvent?: TabEvent
  tuning: Tuning
  // Total distinct notes in the loop — coverage (validated / total) is what
  // decides when the whole piece, not just one note, counts as mastered.
  totalNotes: number
  onValidated?: () => void
  // Fired once per note, right when it's matched (hit) or its window closes
  // unmatched (miss) — drives both the tempo-mode miss counter and
  // practice-mode's "advance only on a correct note" stepping.
  onNoteResult?: (key: string, hit: boolean) => void
}

export default function PracticeValidator({
  activeEvent,
  tuning,
  totalNotes,
  onValidated,
  onNoteResult,
}: PracticeValidatorProps) {
  const { micState, reading } = usePitchDetector(true)
  const [validatedKeys, setValidatedKeys] = useState<Set<string>>(new Set())
  const [hasFiredValidated, setHasFiredValidated] = useState(false)
  const prevKeyRef = useRef<string | undefined>(undefined)

  const currentKey = eventKey(activeEvent)
  const justValidated = currentKey !== undefined && validatedKeys.has(currentKey)

  const expectedFreq = activeEvent ? expectedFrequency(tuning, activeEvent.string, activeEvent.fret) : null
  const percent = reading && expectedFreq ? matchPercent(reading.freq, expectedFreq) : null

  function markValidated(key: string) {
    setValidatedKeys((prev) => {
      if (prev.has(key)) return prev
      onNoteResult?.(key, true)
      return new Set(prev).add(key)
    })
  }

  useEffect(() => {
    if (percent !== null && percent >= NOTE_VALIDATION_THRESHOLD && currentKey !== undefined) {
      markValidated(currentKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent, currentKey])

  // Detect a miss: the active note changed away from a previous one that
  // was never validated while it was current.
  useEffect(() => {
    const prevKey = prevKeyRef.current
    if (prevKey !== undefined && prevKey !== currentKey && !validatedKeys.has(prevKey)) {
      onNoteResult?.(prevKey, false)
    }
    prevKeyRef.current = currentKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  function handleManualValidate() {
    if (currentKey !== undefined) markValidated(currentKey)
  }

  const coveragePercent = totalNotes > 0 ? Math.min(100, (validatedKeys.size / totalNotes) * 100) : 0

  useEffect(() => {
    if (!hasFiredValidated && coveragePercent >= PIECE_VALIDATION_THRESHOLD) {
      setHasFiredValidated(true)
      onValidated?.()
    }
  }, [coveragePercent, hasFiredValidated, onValidated])

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {hasFiredValidated && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-success-soft px-3 py-1.5 text-sm font-semibold text-success"
          >
            <Trophy size={16} weight="fill" />
            Morceau validé !
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-success-soft px-3 py-1.5 font-semibold text-success">
          <CheckCircle size={16} weight="fill" />
          <span>
            {validatedKeys.size}/{totalNotes} notes
          </span>
          <span className="font-mono tabular-nums">{Math.round(coveragePercent)}%</span>
        </div>

        {micState === 'granted' && (
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border px-3 py-1.5 font-mono text-text-muted">
            <Microphone size={15} />
            {reading ? (
              <span className={percent !== null && percent >= NOTE_VALIDATION_THRESHOLD ? 'text-success' : 'text-text-muted'}>
                {reading.note}
                {reading.octave} · {percent !== null ? Math.round(percent) : 0}%
              </span>
            ) : (
              <span>Joue une note...</span>
            )}
          </div>
        )}

        {micState === 'denied' && (
          <div className="flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3 py-1.5 text-text-muted">
            <MicrophoneSlash size={15} />
            Micro indisponible
          </div>
        )}

        <button
          onClick={handleManualValidate}
          disabled={justValidated}
          className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-medium transition-colors ${
            justValidated
              ? 'border-success-soft bg-success-soft text-success'
              : 'border-accent-soft text-accent-strong hover:bg-accent-soft'
          }`}
        >
          Valider
        </button>
      </div>
    </div>
  )
}
