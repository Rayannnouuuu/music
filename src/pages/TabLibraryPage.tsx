import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAllTabs, filterTabs } from '../lib/content/loadTabs'
import { parseAsciiTab } from '../lib/tab/asciiImport'
import { validateTab, ContentValidationError } from '../lib/content/validate'
import { useProgression } from '../lib/progression/ProgressionContext'
import type { Measure, Tab } from '../lib/content/types'

const EMPTY_METADATA = {
  title: '',
  artist: '',
  subgenre: '',
  tuning: 'Standard',
  difficulty: 5,
  originalTempo: 100,
}

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
    <div className="space-y-4">
      <h1>Bibliothèque de tabs</h1>

      <div className="flex flex-wrap gap-4 bg-panel border border-border rounded-lg p-3">
        <label className="flex items-center gap-2 text-sm">
          Sous-genre
          <select
            value={subgenre}
            onChange={(e) => setSubgenre(e.target.value)}
            className="bg-bg text-text border border-border rounded px-2 py-1"
          >
            <option value="">Tous</option>
            {subgenres.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Accordage
          <select
            value={tuning}
            onChange={(e) => setTuning(e.target.value)}
            className="bg-bg text-text border border-border rounded px-2 py-1"
          >
            <option value="">Tous</option>
            {tunings.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Difficulté max {maxDifficulty}
          <input
            type="range"
            min={1}
            max={10}
            value={maxDifficulty}
            onChange={(e) => setMaxDifficulty(Number(e.target.value))}
          />
        </label>
      </div>

      {tabs.length === 0 ? (
        <p className="text-text-muted">Aucune tab ne correspond à ces filtres.</p>
      ) : (
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link
                to={`/tabs/${tab.id}`}
                className="block bg-panel border border-border rounded-lg p-3 hover:border-accent"
              >
                <span className="font-semibold">{tab.title}</span>
                <span className="text-text-muted"> — {tab.artist}</span>
                <span className="text-text-muted text-sm">
                  {' '}
                  · {tab.subgenre} · {tab.tuning} · difficulté {tab.difficulty}/10
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="bg-panel border border-border rounded-lg p-4 space-y-3">
        <button className="text-accent font-semibold" onClick={() => setShowImport((v) => !v)}>
          {showImport ? 'Annuler' : 'Importer une tab ASCII'}
        </button>

        {showImport && (
          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder={'e|--5-7--|\nB|-------|\n...'}
              className="w-full bg-bg text-text border border-border rounded px-2 py-1 font-mono text-sm"
            />
            {importError && <p className="text-sm text-red-400">{importError}</p>}
            <button
              className="text-accent font-semibold"
              onClick={handleParse}
              disabled={importText.trim().length === 0}
            >
              Analyser
            </button>

            {parsedMeasures && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-text-muted text-sm">
                  {parsedMeasures.reduce((n, m) => n + m.events.length, 0)} note(s) trouvée(s) sur{' '}
                  {parsedMeasures.length} mesure(s). Renseigne les infos pour l'ajouter :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Titre"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    className="bg-bg text-text border border-border rounded px-2 py-1"
                  />
                  <input
                    placeholder="Artiste"
                    value={metadata.artist}
                    onChange={(e) => setMetadata({ ...metadata, artist: e.target.value })}
                    className="bg-bg text-text border border-border rounded px-2 py-1"
                  />
                  <input
                    placeholder="Sous-genre"
                    value={metadata.subgenre}
                    onChange={(e) => setMetadata({ ...metadata, subgenre: e.target.value })}
                    className="bg-bg text-text border border-border rounded px-2 py-1"
                  />
                  <input
                    placeholder="Accordage"
                    value={metadata.tuning}
                    onChange={(e) => setMetadata({ ...metadata, tuning: e.target.value })}
                    className="bg-bg text-text border border-border rounded px-2 py-1"
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
                    className="bg-bg text-text border border-border rounded px-2 py-1"
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
                    className="bg-bg text-text border border-border rounded px-2 py-1"
                  />
                </div>
                <button className="text-accent font-semibold" onClick={handleConfirmImport}>
                  Ajouter à la bibliothèque
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
