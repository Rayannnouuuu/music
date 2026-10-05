import { useEffect, useState } from 'react'
import { CheckCircle, Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import type { TabEvent } from '../../lib/content/types'
import type { Tuning } from '../../lib/audio/tunings'
import { usePitchDetector } from '../../lib/audio/usePitchDetector'
import { expectedFrequency, matchPercent } from '../../lib/audio/pitchMatch'

const VALIDATION_THRESHOLD = 90

interface PracticeValidatorProps {
  activeEvent?: TabEvent
  tuning: Tuning
}

function eventKey(event: TabEvent | undefined): string | undefined {
  return event ? `${event.string}-${event.fret}-${event.startBeat}` : undefined
}

export default function PracticeValidator({ activeEvent, tuning }: PracticeValidatorProps) {
  const { micState, reading } = usePitchDetector(true)
  const [validatedCount, setValidatedCount] = useState(0)
  // The event key already counted, if any — comparing it against the
  // current key (rather than a boolean ref) means a new active note
  // naturally re-enables validation with no separate reset effect, and it
  // stays real state so the disabled button re-renders correctly.
  const [countedKey, setCountedKey] = useState<string | undefined>(undefined)

  const currentKey = eventKey(activeEvent)
  const justValidated = countedKey !== undefined && countedKey === currentKey

  const expectedFreq = activeEvent ? expectedFrequency(tuning, activeEvent.string, activeEvent.fret) : null
  const percent = reading && expectedFreq ? matchPercent(reading.freq, expectedFreq) : null

  useEffect(() => {
    if (percent !== null && percent >= VALIDATION_THRESHOLD && currentKey !== undefined && currentKey !== countedKey) {
      setValidatedCount((c) => c + 1)
      setCountedKey(currentKey)
    }
  }, [percent, currentKey, countedKey])

  function handleManualValidate() {
    if (justValidated || currentKey === undefined) return
    setValidatedCount((c) => c + 1)
    setCountedKey(currentKey)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      <div className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-success-soft px-3 py-1.5 font-semibold text-success">
        <CheckCircle size={16} weight="fill" />
        {validatedCount} bonne{validatedCount > 1 ? 's' : ''} note{validatedCount > 1 ? 's' : ''}
      </div>

      {micState === 'granted' && (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border px-3 py-1.5 font-mono text-text-muted">
          <Microphone size={15} />
          {reading ? (
            <span className={percent !== null && percent >= VALIDATION_THRESHOLD ? 'text-success' : 'text-text-muted'}>
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
  )
}
