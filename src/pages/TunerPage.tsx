import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Microphone, MicrophoneSlash, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react'
import { usePitchDetector } from '../lib/audio/usePitchDetector'
import { TUNINGS } from '../lib/audio/tunings'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import TunerGauge from '../components/audio/TunerGauge'

const IN_TUNE_THRESHOLD = 5

export default function TunerPage() {
  const [tuningId, setTuningId] = useState(TUNINGS[0].id)
  const { micState, reading, retry } = usePitchDetector(true)

  const activeTuning = TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0]
  const clampedCents = reading ? Math.max(-50, Math.min(50, reading.cents)) : 0
  const inTune = !!reading && Math.abs(reading.cents) <= IN_TUNE_THRESHOLD

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tuner</h1>
        <p className="mt-1 text-text-muted">Accorde ta guitare à l'oreille, en direct.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TUNINGS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTuningId(t.id)}
            className={`rounded-[var(--radius-control)] border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              t.id === tuningId
                ? 'border-accent-soft bg-accent-soft text-accent-strong'
                : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {micState === 'requesting' && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong"
          >
            <Microphone size={26} />
          </motion.div>
          <p className="text-text-muted">Autorisation du micro en cours...</p>
        </Card>
      )}

      {micState === 'denied' && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning">
            <MicrophoneSlash size={26} />
          </div>
          <p className="max-w-sm text-text-muted">
            Accès au microphone refusé ou indisponible. Autorise le microphone dans les paramètres
            de ton navigateur pour utiliser le tuner.
          </p>
          <Button variant="secondary" onClick={retry}>
            <ArrowsClockwise size={17} />
            Réessayer
          </Button>
        </Card>
      )}

      {micState === 'granted' && (
        <Card data-testid="tuner-reading" className="space-y-6 p-6 sm:p-10">
          <TunerGauge cents={clampedCents} hasReading={!!reading} inTune={inTune} />

          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              {reading ? (
                <motion.div
                  key={`${reading.note}${reading.octave}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-1"
                >
                  <p className="font-mono text-5xl font-bold tabular-nums text-text">
                    {reading.note}
                    <span className="text-text-muted">{reading.octave}</span>
                  </p>
                  <p
                    className={`font-mono text-sm tabular-nums ${
                      inTune ? 'text-success' : 'text-text-muted'
                    }`}
                  >
                    {reading.cents > 0 ? '+' : ''}
                    {reading.cents} cents
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-text-muted"
                >
                  Joue une note...
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {inTune && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-success-soft px-3 py-1 text-sm font-semibold text-success"
                >
                  <CheckCircle size={16} weight="fill" />
                  Accordé !
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-muted">Cordes de référence ({activeTuning.label})</span>
        <div className="flex flex-wrap gap-1.5">
          {activeTuning.strings.map((s, i) => (
            <span
              key={i}
              className="rounded-[var(--radius-control)] border border-border-soft bg-panel px-2.5 py-1 font-mono text-xs text-text-muted"
            >
              {s.note}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
