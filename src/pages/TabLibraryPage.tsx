import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { MusicNotes, UploadSimple, ArrowRight, X } from '@phosphor-icons/react'
import { loadAllTabs, filterTabs } from '../lib/content/loadTabs'
import { parseAsciiTab } from '../lib/tab/asciiImport'
import { validateTab, ContentValidationError } from '../lib/content/validate'
import { useProgression } from '../lib/progression/ProgressionContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Slider } from '../components/ui/Slider'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import type { Measure, Tab } from '../lib/content/types'

const EMPTY_METADATA = {
  title: '',
  artist: '',
  subgenre: '',
  tuning: 'Standard',
  difficulty: 5,
  originalTempo: 100,
}

const inputClass =
  'rounded-[var(--radius-input)] border border-border bg-panel-raised px-3 py-2 text-sm text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-accent-soft'

export default function TabLibraryPage() {
  const { state, importTab } = useProgression()
  const allTabs = useMemo(() => [...loadAllTabs(), ...state.importedTabs], [state.importedTabs])
  const subgenres = useMemo(
    () => Array.from(new Set(allTabs.map((t) => t.subgenre))).sort(),
    [allTabs],
  )
  const tunings = useMemo(() => Array.from(new Set(allTabs.map((t) => t.tuning))).sort(), [allTabs])

  const [subgenre, setSubgenre] = useState('')
  const [tuning, setTuning] = useState('')
  const [maxDifficulty, setMaxDifficulty] = useState(10)

  const tabs = filterTabs(allTabs, {
    subgenre: subgenre || undefined,
    tuning: tuning || undefined,
    maxDifficulty,
  })

  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [parsedMeasures, setParsedMeasures] = useState<Measure[] | null>(null)
  const [metadata, setMetadata] = useState(EMPTY_METADATA)

  function handleParse() {
    const result = parseAsciiTab(importText)
    if ('error' in result) {
      setImportError(result.error)
      setParsedMeasures(null)
      return
    }
    setImportError(null)
    setParsedMeasures(result.measures)
  }

  function handleConfirmImport() {
    if (!parsedMeasures) return
    const candidate: Tab = {
      id: `imported-${Date.now()}`,
      title: metadata.title || 'Tab importée',
      artist: metadata.artist || 'Inconnu',
      subgenre: metadata.subgenre || 'autre',
      tuning: metadata.tuning,
      originalTempo: metadata.originalTempo,
      difficulty: metadata.difficulty,
      measures: parsedMeasures,
    }

    let tab: Tab
    try {
      tab = validateTab(candidate)
    } catch (err) {
      setImportError(
        err instanceof ContentValidationError
          ? `Métadonnées invalides : ${err.message}`
          : 'Métadonnées invalides.',
      )
      return
    }

    importTab(tab)
    setShowImport(false)
    setImportText('')
    setParsedMeasures(null)
    setMetadata(EMPTY_METADATA)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bibliothèque de tabs</h1>
        <p className="mt-1 text-text-muted">{allTabs.length} tablatures metal à jouer.</p>
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Sous-genre</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSubgenre('')}
                className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-medium transition-colors ${
                  subgenre === ''
                    ? 'border-accent-soft bg-accent-soft text-accent-strong'
                    : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
                }`}
              >
                Tous
              </button>
              {subgenres.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubgenre(s)}
                  className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-medium transition-colors ${
                    subgenre === s
                      ? 'border-accent-soft bg-accent-soft text-accent-strong'
                      : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Accordage</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTuning('')}
                className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-medium transition-colors ${
                  tuning === ''
                    ? 'border-accent-soft bg-accent-soft text-accent-strong'
                    : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
                }`}
              >
                Tous
              </button>
              {tunings.map((t) => (
                <button
                  key={t}
                  onClick={() => setTuning(t)}
                  className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-medium transition-colors ${
                    tuning === t
                      ? 'border-accent-soft bg-accent-soft text-accent-strong'
                      : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-xs">
          <Slider
            label="Difficulté max"
            value={maxDifficulty}
            min={1}
            max={10}
            onChange={setMaxDifficulty}
          />
        </div>
      </Card>

      {tabs.length === 0 ? (
        <Card className="p-8 text-center text-text-muted">
          Aucune tab ne correspond à ces filtres.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tabs.map((tab) => (
            <Link key={tab.id} to={`/tabs/${tab.id}`}>
              <Card interactive className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <MusicNotes size={17} />
                  </span>
                  <Badge>{tab.tuning}</Badge>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text">{tab.title}</p>
                  <p className="text-sm text-text-muted">{tab.artist}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs capitalize text-text-muted">{tab.subgenre}</span>
                  <DifficultyMeter value={tab.difficulty} />
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-accent-strong">
                  Jouer <ArrowRight size={14} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <Button variant="secondary" onClick={() => setShowImport((v) => !v)}>
          {showImport ? <X size={17} /> : <UploadSimple size={17} />}
          {showImport ? 'Annuler' : 'Importer une tab ASCII'}
        </Button>

        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                placeholder={'e|--5-7--|\nB|-------|\n...'}
                className={`w-full font-mono ${inputClass}`}
              />
              {importError && <p className="text-sm text-warning">{importError}</p>}
              <Button
                variant="secondary"
                onClick={handleParse}
                disabled={importText.trim().length === 0}
              >
                Analyser
              </Button>

              {parsedMeasures && (
                <div className="space-y-3 border-t border-border-soft pt-4">
                  <p className="text-sm text-text-muted">
                    {parsedMeasures.reduce((n, m) => n + m.events.length, 0)} note(s) trouvée(s)
                    sur {parsedMeasures.length} mesure(s). Renseigne les infos pour l'ajouter :
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      placeholder="Titre"
                      value={metadata.title}
                      onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      placeholder="Artiste"
                      value={metadata.artist}
                      onChange={(e) => setMetadata({ ...metadata, artist: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      placeholder="Sous-genre"
                      value={metadata.subgenre}
                      onChange={(e) => setMetadata({ ...metadata, subgenre: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      placeholder="Accordage"
                      value={metadata.tuning}
                      onChange={(e) => setMetadata({ ...metadata, tuning: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="Difficulté"
                      value={metadata.difficulty}
                      onChange={(e) =>
                        setMetadata({ ...metadata, difficulty: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={30}
                      max={300}
                      placeholder="Tempo (BPM)"
                      value={metadata.originalTempo}
                      onChange={(e) =>
                        setMetadata({ ...metadata, originalTempo: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </div>
                  <Button onClick={handleConfirmImport}>Ajouter à la bibliothèque</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
