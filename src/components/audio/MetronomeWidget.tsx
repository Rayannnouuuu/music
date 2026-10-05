import { useState } from 'react'
import { useMetronome } from '../../lib/audio/useMetronome'

export default function MetronomeWidget() {
  const metronome = useMetronome()
  const [open, setOpen] = useState(false)
  const [bpmInput, setBpmInput] = useState(metronome.bpm)

  return (
    <div className="relative">
      <button
        className="text-text-muted hover:text-text text-sm"
        onClick={() => setOpen((o) => !o)}
      >
        Métronome{metronome.isPlaying ? ` (${metronome.bpm})` : ''}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-10 bg-panel border border-border rounded-lg p-3 flex flex-col gap-3 w-48">
          <label className="flex items-center justify-between gap-2 text-sm">
            BPM
            <input
              type="number"
              min={30}
              max={300}
              value={bpmInput}
              onChange={(e) => setBpmInput(Number(e.target.value))}
              className="bg-bg text-text border border-border rounded px-2 py-1 w-16"
            />
          </label>
          <button
            className="text-accent font-semibold"
            onClick={() => (metronome.isPlaying ? metronome.stop() : metronome.start(bpmInput))}
          >
            {metronome.isPlaying ? 'Stop' : 'Démarrer'}
          </button>
          <label className="flex items-center justify-between gap-2 text-sm">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              defaultValue={0.5}
              onChange={(e) => metronome.setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  )
}
