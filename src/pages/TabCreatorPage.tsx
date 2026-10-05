import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Plus, Trash, FloppyDisk, UploadSimple, X, Play } from '@phosphor-icons/react'
import NoteHighway from '../components/tab/NoteHighway'
import { STANDARD_TUNING_LABELS } from '../lib/tab/noteLayout'
import { parseAsciiTab } from '../lib/tab/asciiImport'
import { validateTab, ContentValidationError } from '../lib/content/validate'
import { useProgression } from '../lib/progression/ProgressionContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import type { Measure, Tab, TabEvent, GuitarString, Technique } from '../lib/content/types'

const BEATS_PER_MEASURE = 4

const TECHNIQUE_OPTIONS: { value: Technique | ''; label: string }[] = [
  { value: '', label: 'Aucune' },
  { value: 'hammer', label: 'Hammer-on' },
  { value: 'pull', label: 'Pull-off' },
  { value: 'bend', label: 'Bend' },
  { value: 'slide', label: 'Slide' },
  { value: 'vibrato', label: 'Vibrato' },
  { value: 'palmMute', label: 'Palm mute' },
]

const inputClass =
  'rounded-[var(--radius-input)] border border-border bg-panel-raised px-3 py-2 text-sm text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-accent-soft'

function emptyDraft() {
  return { string: 6 as GuitarString, fret: 0, startBeat: 0, duration: 1, technique: '' as Technique | '' }
}

function MeasureEditor({
  measure,
  index,
  onAddNote,
  onRemoveNote,
  onRemoveMeasure,
  canRemove,
}: {
  measure: Measure
  index: number
  onAddNote: (event: TabEvent) => void
  onRemoveNote: (eventIndex: number) => void
  onRemoveMeasure: () => void
  canRemove: boolean
}) {
  const [draft, setDraft] = useState(emptyDraft())

  function handleAdd() {
    onAddNote({
      string: draft.string,
      fret: draft.fret,
      startBeat: draft.startBeat,
      duration: draft.duration,
      ...(draft.technique ? { technique: draft.technique } : {}),
    })
    setDraft(emptyDraft())
  }

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text">Mesure {index + 1}</p>
        {canRemove && (
          <button
            onClick={onRemoveMeasure}
            aria-label={`Supprimer la mesure ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-panel-hover hover:text-warning"
          >
            <Trash size={15} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-input)] bg-bg/60 p-4">
        {measure.events.length > 0 ? (
          <NoteHighway events={measure.events} totalBeats={BEATS_PER_MEASURE} />
        ) : (
          <p className="py-6 text-center text-sm text-text-muted">Mesure vide — ajoute une note ci-dessous.</p>
        )}
      </div>

      {measure.events.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {measure.events.map((event, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border-soft bg-panel-raised py-1 pl-2.5 pr-1 text-xs text-text-muted"
            >
              {STANDARD_TUNING_LABELS[event.string - 1]} · case {event.fret} · temps {event.startBeat}
              {event.technique ? ` · ${event.technique}` : ''}
              <button
                onClick={() => onRemoveNote(i)}
                aria-label="Supprimer cette note"
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-panel-hover hover:text-warning"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-border-soft pt-4 sm:grid-cols-5">
        <label className="space-y-1 text-xs text-text-muted">
          Corde
          <select
            value={draft.string}
            onChange={(e) => setDraft({ ...draft, string: Number(e.target.value) as GuitarString })}
            className={`block w-full ${inputClass}`}
          >
            {STANDARD_TUNING_LABELS.map((label, i) => (
              <option key={i} value={i + 1}>
                {i + 1} ({label})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-text-muted">
          Case
          <input
            type="number"
            min={0}
            max={24}
            value={draft.fret}
            onChange={(e) => setDraft({ ...draft, fret: Number(e.target.value) })}
            className={`block w-full ${inputClass}`}
          />
        </label>
        <label className="space-y-1 text-xs text-text-muted">
          Temps (0–3.75)
          <input
            type="number"
            min={0}
            max={3.75}
            step={0.25}
            value={draft.startBeat}
            onChange={(e) => setDraft({ ...draft, startBeat: Number(e.target.value) })}
            className={`block w-full ${inputClass}`}
          />
        </label>
        <label className="space-y-1 text-xs text-text-muted">
          Durée
          <input
            type="number"
            min={0.25}
            max={4}
            step={0.25}
            value={draft.duration}
            onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}
            className={`block w-full ${inputClass}`}
          />
        </label>
        <label className="space-y-1 text-xs text-text-muted">
          Technique
          <select
            value={draft.technique}
            onChange={(e) => setDraft({ ...draft, technique: e.target.value as Technique | '' })}
            className={`block w-full ${inputClass}`}
          >
            {TECHNIQUE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button variant="secondary" size="sm" onClick={handleAdd}>
        <Plus size={15} />
        Ajouter la note
      </Button>
    </Card>
  )
}

export default function TabCreatorPage() {
  const navigate = useNavigate()
  const { state, importTab, deleteImportedTab } = useProgression()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [subgenre, setSubgenre] = useState('')
  const [tuning, setTuning] = useState('Standard')
  const [originalTempo, setOriginalTempo] = useState(120)
  const [difficulty, setDifficulty] = useState(5)
  const [measures, setMeasures] = useState<Measure[]>([{ events: [] }])
  const [saveError, setSaveError] = useState<string | null>(null)

  const [showAsciiImport, setShowAsciiImport] = useState(false)
  const [asciiText, setAsciiText] = useState('')
  const [asciiError, setAsciiError] = useState<string | null>(null)

  function addMeasure() {
    setMeasures((prev) => [...prev, { events: [] }])
  }

  function removeMeasure(index: number) {
    setMeasures((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  function addNote(measureIndex: number, event: TabEvent) {
    setMeasures((prev) =>
      prev.map((m, i) =>
        i === measureIndex ? { events: [...m.events, event].sort((a, b) => a.startBeat - b.startBeat) } : m,
      ),
    )
  }

  function removeNote(measureIndex: number, eventIndex: number) {
    setMeasures((prev) =>
      prev.map((m, i) => (i === measureIndex ? { events: m.events.filter((_, j) => j !== eventIndex) } : m)),
    )
  }

  function handleSave() {
    const candidate: Tab = {
      id: `custom-${Date.now()}`,
      title: title.trim() || 'Ma tab',
      artist: artist.trim() || 'Moi',
      subgenre: subgenre.trim() || 'autre',
      tuning: tuning.trim() || 'Standard',
      originalTempo,
      difficulty,
      measures,
    }
    try {
      const tab = validateTab(candidate)
      importTab(tab)
      navigate(`/tabs/${tab.id}`)
    } catch (err) {
      setSaveError(
        err instanceof ContentValidationError
          ? `Impossible d'enregistrer : ${err.message}`
          : "Impossible d'enregistrer cette tab.",
      )
    }
  }

  function handleAsciiParse() {
    const result = parseAsciiTab(asciiText)
    if ('error' in result) {
      setAsciiError(result.error)
      return
    }
    setAsciiError(null)
    setMeasures(result.measures)
    setShowAsciiImport(false)
  }

  const totalBeats = measures.length * BEATS_PER_MEASURE
  const flatEvents: TabEvent[] = measures.flatMap((m, mi) =>
    m.events.map((e) => ({ ...e, startBeat: e.startBeat + mi * BEATS_PER_MEASURE })),
  )

  return (
    <div className="space-y-6">
      <Link
        to="/tabs"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={15} />
        Bibliothèque de tabs
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Créer une tab</h1>
        <p className="mt-1 text-text-muted">
          Construis ta propre tablature mesure par mesure, avec hammer-on, pull-off, bend, slide et
          vibrato.
        </p>
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          <input
            placeholder="Artiste"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Sous-genre"
            value={subgenre}
            onChange={(e) => setSubgenre(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Accordage"
            value={tuning}
            onChange={(e) => setTuning(e.target.value)}
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Tempo
            <input
              type="number"
              min={20}
              max={400}
              value={originalTempo}
              onChange={(e) => setOriginalTempo(Number(e.target.value))}
              className={`w-full ${inputClass}`}
            />
            BPM
          </label>
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Difficulté
            <input
              type="number"
              min={1}
              max={10}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className={`w-full ${inputClass}`}
            />
            /10
          </label>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-wide text-text-muted">Aperçu complet</p>
        <div className="overflow-x-auto rounded-[var(--radius-input)] bg-bg/60 p-4">
          <NoteHighway events={flatEvents} totalBeats={totalBeats} />
        </div>
      </Card>

      <div className="space-y-4">
        {measures.map((measure, i) => (
          <MeasureEditor
            key={i}
            measure={measure}
            index={i}
            onAddNote={(event) => addNote(i, event)}
            onRemoveNote={(eventIndex) => removeNote(i, eventIndex)}
            onRemoveMeasure={() => removeMeasure(i)}
            canRemove={measures.length > 1}
          />
        ))}
      </div>

      <Button variant="secondary" onClick={addMeasure}>
        <Plus size={16} />
        Ajouter une mesure
      </Button>

      <Card className="space-y-3 p-5">
        <Button onClick={handleSave}>
          <FloppyDisk size={17} weight="fill" />
          Enregistrer ma tab
        </Button>
        {saveError && <p className="text-sm text-warning">{saveError}</p>}
      </Card>

      <Card className="space-y-4 p-5">
        <Button variant="secondary" onClick={() => setShowAsciiImport((v) => !v)}>
          {showAsciiImport ? <X size={17} /> : <UploadSimple size={17} />}
          {showAsciiImport ? 'Annuler' : 'Importer depuis du texte ASCII à la place'}
        </Button>
        <AnimatePresence>
          {showAsciiImport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <textarea
                value={asciiText}
                onChange={(e) => setAsciiText(e.target.value)}
                rows={8}
                placeholder={'e|--5-7--|\nB|-------|\nG|-------|\nD|-------|\nA|-------|\nE|-------|'}
                className={`w-full font-mono ${inputClass}`}
              />
              {asciiError && <p className="text-sm text-warning">{asciiError}</p>}
              <Button variant="secondary" onClick={handleAsciiParse} disabled={asciiText.trim().length === 0}>
                Remplacer les mesures par ce texte
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {state.importedTabs.length > 0 && (
        <Card className="space-y-3 p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Mes tabs enregistrées</p>
          <div className="space-y-2">
            {state.importedTabs.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-input)] border border-border-soft bg-panel-raised px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{t.title}</p>
                  <p className="truncate text-sm text-text-muted">{t.artist}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    to={`/tabs/${t.id}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent-soft hover:text-text"
                    aria-label={`Jouer ${t.title}`}
                  >
                    <Play size={14} weight="fill" />
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer « ${t.title} » ?`)) deleteImportedTab(t.id)
                    }}
                    aria-label={`Supprimer ${t.title}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-warning hover:text-warning"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
