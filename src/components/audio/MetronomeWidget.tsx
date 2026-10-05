import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Metronome, Play, Pause, SpeakerHigh } from '@phosphor-icons/react'
import { useMetronome } from '../../lib/audio/useMetronome'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import BeatIndicator from './BeatIndicator'

export default function MetronomeWidget() {
  const metronome = useMetronome()
  const [open, setOpen] = useState(false)
  const [bpmInput, setBpmInput] = useState(metronome.bpm)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-medium transition-colors ${
          metronome.isPlaying
            ? 'border-accent-soft bg-accent-soft text-accent-strong'
            : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
        }`}
        aria-expanded={open}
      >
        <Metronome size={17} weight={metronome.isPlaying ? 'fill' : 'regular'} />
        <span className="hidden sm:inline">
          {metronome.isPlaying ? `${metronome.bpm} BPM` : 'Métronome'}
        </span>
        {metronome.isPlaying && <BeatIndicator bpm={metronome.bpm} isPlaying size="sm" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 z-20 mt-2 w-64 space-y-4 rounded-[var(--radius-card)] border border-border bg-panel-raised p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Métronome</span>
                <BeatIndicator bpm={bpmInput} isPlaying={metronome.isPlaying} />
              </div>

              <Slider
                label="Tempo"
                value={bpmInput}
                min={30}
                max={300}
                onChange={(v) => {
                  setBpmInput(v)
                  if (metronome.isPlaying) metronome.start(v)
                }}
                formatValue={(v) => `${v} BPM`}
              />

              <label className="flex flex-col gap-2 text-sm text-text-muted">
                <span className="flex items-center gap-2">
                  <SpeakerHigh size={15} /> Volume
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  defaultValue={0.5}
                  onChange={(e) => metronome.setVolume(Number(e.target.value))}
                  className="guitar-slider"
                />
              </label>

              <Button
                variant={metronome.isPlaying ? 'secondary' : 'primary'}
                className="w-full"
                onClick={() => (metronome.isPlaying ? metronome.stop() : metronome.start(bpmInput))}
              >
                {metronome.isPlaying ? <Pause size={17} weight="fill" /> : <Play size={17} weight="fill" />}
                {metronome.isPlaying ? 'Arrêter' : 'Démarrer'}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
