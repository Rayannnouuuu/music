import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Gear, Microphone } from '@phosphor-icons/react'
import { useProgression } from '../lib/progression/ProgressionContext'

export default function SettingsWidget() {
  const { state, setAutoDetectEnabled } = useProgression()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Paramètres"
        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
      >
        <Gear size={18} />
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
              className="absolute right-0 z-20 mt-2 w-72 space-y-4 rounded-[var(--radius-card)] border border-border bg-panel-raised p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
            >
              <span className="text-sm font-semibold text-text">Paramètres</span>

              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Microphone size={16} />
                  Détection auto des notes (micro)
                </span>
                <button
                  role="switch"
                  aria-checked={state.autoDetectEnabled}
                  onClick={() => setAutoDetectEnabled(!state.autoDetectEnabled)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    state.autoDetectEnabled ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-text"
                    animate={{ left: state.autoDetectEnabled ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                </button>
              </label>
              <p className="text-xs text-text-muted">
                Quand c'est activé, les exercices et tabs peuvent te proposer d'écouter le micro
                pour valider automatiquement les notes jouées.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
