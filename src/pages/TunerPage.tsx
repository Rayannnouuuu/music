import { useEffect, useState } from 'react'
import { detectPitch } from '../lib/audio/pitchDetect'
import { frequencyToNote } from '../lib/audio/noteUtils'
import { TUNINGS } from '../lib/audio/tunings'

type MicState = 'requesting' | 'granted' | 'denied'

export default function TunerPage() {
  const [micState, setMicState] = useState<MicState>('requesting')
  const [tuningId, setTuningId] = useState(TUNINGS[0].id)
  const [reading, setReading] = useState<{ note: string; octave: number; cents: number } | null>(
    null,
  )
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    let rafId: number | null = null
    let stream: MediaStream | null = null
    let audioContext: AudioContext | null = null

    async function start() {
      setMicState('requesting')
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        source.connect(analyser)
        const buffer = new Float32Array(analyser.fftSize)

        setMicState('granted')

        function tick() {
          analyser.getFloatTimeDomainData(buffer)
          const freq = detectPitch(buffer, audioContext!.sampleRate)
          setReading(freq !== null ? frequencyToNote(freq) : null)
          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) setMicState('denied')
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((track) => track.stop())
      audioContext?.close()
    }
  }, [retryKey])

  const activeTuning = TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0]
  const clampedCents = reading ? Math.max(-50, Math.min(50, reading.cents)) : 0

  return (
    <div className="space-y-4">
      <h1>Tuner</h1>

      <label className="flex items-center gap-2 text-sm">
        Accordage de référence
        <select
          value={tuningId}
          onChange={(e) => setTuningId(e.target.value)}
          className="bg-bg text-text border border-border rounded px-2 py-1"
        >
          {TUNINGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {micState === 'denied' && (
        <div className="bg-panel border border-border rounded-lg p-4 space-y-2">
          <p>
            Accès au microphone refusé ou indisponible. Autorise le microphone dans les
            paramètres de ton navigateur pour utiliser le tuner.
          </p>
          <button className="text-accent font-semibold" onClick={() => setRetryKey((k) => k + 1)}>
            Réessayer
          </button>
        </div>
      )}

      {micState === 'granted' && (
        <div
          data-testid="tuner-reading"
          className="bg-panel border border-border rounded-lg p-4 space-y-3"
        >
          {reading ? (
            <>
              <p className="text-3xl font-bold text-accent">
                {reading.note}
                {reading.octave}
              </p>
              <p className="text-text-muted">
                {reading.cents > 0 ? '+' : ''}
                {reading.cents} cents
              </p>
              <div className="h-2 bg-bg border border-border rounded relative">
                <div
                  className="absolute top-0 bottom-0 w-1 bg-accent"
                  style={{ left: `${50 + clampedCents}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-text-muted">Joue une note...</p>
          )}
        </div>
      )}

      <p className="text-text-muted text-sm">
        Cordes de référence ({activeTuning.label}) :{' '}
        {activeTuning.strings.map((s) => s.note).join(' · ')}
      </p>
    </div>
  )
}
