import { useEffect, useState } from 'react'

interface BeatIndicatorProps {
  bpm: number
  isPlaying: boolean
  beatsPerBar?: number
  size?: 'sm' | 'md'
}

export default function BeatIndicator({
  bpm,
  isPlaying,
  beatsPerBar = 4,
  size = 'md',
}: BeatIndicatorProps) {
  const [activeBeat, setActiveBeat] = useState(0)

  // Visual-only approximation of the beat, driven by a plain interval rather
  // than the audio engine's own sample-accurate clock: good enough for a
  // decorative pulse, and keeps this component independent of MetronomeEngine.
  useEffect(() => {
    if (!isPlaying || bpm <= 0) {
      setActiveBeat(0)
      return
    }
    setActiveBeat(0)
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % beatsPerBar
      setActiveBeat(i)
    }, (60 / bpm) * 1000)
    return () => clearInterval(id)
  }, [isPlaying, bpm, beatsPerBar])

  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5'

  return (
    <div className="flex items-center gap-1.5" role="presentation">
      {Array.from({ length: beatsPerBar }, (_, i) => (
        <span
          key={i}
          className={`${dotSize} shrink-0 rounded-full transition-all duration-150 ease-out ${
            isPlaying && i === activeBeat
              ? 'scale-[1.4] bg-accent shadow-[0_0_10px_var(--color-accent)]'
              : i === 0
                ? 'bg-text-muted/50'
                : 'bg-text-muted/25'
          }`}
        />
      ))}
    </div>
  )
}
