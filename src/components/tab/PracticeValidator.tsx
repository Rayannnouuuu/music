import { useEffect, useState } from 'react'
import { CheckCircle, Microphone, MicrophoneSlash, Trophy } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'motion/react'
import type { TabEvent } from '../../lib/content/types'
import type { Tuning } from '../../lib/audio/tunings'
import { usePitchDetector } from '../../lib/audio/usePitchDetector'
import { expectedFrequency, matchPercent } from '../../lib/audio/pitchMatch'

const NOTE_VALIDATION_THRESHOLD = 90
const PIECE_VALIDATION_THRESHOLD = 90

interface PracticeValidatorProps {
  activeEvent?: TabEvent
  tuning: Tuning
  // Total distinct notes in the loop — coverage (validated / total) is what
  // decides when the whole piece, not just one note, counts as mastered.
  totalNotes: number
  onValidated?: () => void
}

function eventKey(event: TabEvent | undefined): string | undefined {
  return event ? `${event.string}-${event.fret}-${event.startBeat}` : undefined
}

export default function PracticeValidator({ activeEvent, tuning, totalNotes, onValidated }: PracticeValidatorProps) {
  const { micState, reading } = usePitchDetector(true)
  const [validatedKeys, setValidatedKeys] = useState<Set<string>>(new Set())
  const [hasFiredValidated, setHasFiredValidated] = useState(false)

  const currentKey = eventKey(activeEvent)
  const justValidated = currentKey !== undefined && validatedKeys.has(currentKey)

  const expectedFreq = activeEvent ? expectedFrequency(tuning, activeEvent.string, activeEvent.fret) : null
  const percent = reading && expectedFreq ? matchPercent(reading.freq, expectedFreq) : null

  function markValidated(key: string) {
    setValidatedKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }

  useEffect(() => {
    if (percent !== null && percent >= NOTE_VALIDATION_THRESHOLD && currentKey !== undefined) {
      markValidated(currentKey)
    }
  }, [percent, currentKey])

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
