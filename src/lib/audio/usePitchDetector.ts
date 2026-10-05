import { useEffect, useState } from 'react'
import { detectPitch } from './pitchDetect'
import { frequencyToNote } from './noteUtils'

export type MicState = 'requesting' | 'granted' | 'denied'

export interface PitchReading {
  freq: number
  note: string
  octave: number
  cents: number
}

// The raw analyser samples ~60 times a second, far faster than anyone can
// actually read a note name — tiny pitch jitter made the display flicker
// between notes before there was time to tell if the right one was heard.
// Holding each displayed reading for this long smooths that out.
const DISPLAY_HOLD_MS = 350

// Shared microphone pitch-detection engine behind the tuner and the
// exercise/tab practice validator. `active` gates the microphone request
// entirely — set it false and nothing is requested or listened to, so a
// settings toggle can fully disable this rather than just hiding its UI.
export function usePitchDetector(active: boolean) {
  const [micState, setMicState] = useState<MicState>('requesting')
  const [reading, setReading] = useState<PitchReading | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!active) {
      setMicState('requesting')
      setReading(null)
      return
    }

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

        let lastDisplayUpdate = 0
        function tick() {
          analyser.getFloatTimeDomainData(buffer)
          const freq = detectPitch(buffer, audioContext!.sampleRate)
          const now = performance.now()
          if (now - lastDisplayUpdate >= DISPLAY_HOLD_MS) {
            lastDisplayUpdate = now
            setReading(freq !== null ? { freq, ...frequencyToNote(freq) } : null)
          }
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
  }, [active, retryKey])

  return { micState, reading, retry: () => setRetryKey((k) => k + 1) }
}
