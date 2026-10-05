import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAllTabs, filterTabs } from '../lib/content/loadTabs'

export default function TabLibraryPage() {
  const allTabs = useMemo(() => loadAllTabs(), [])
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

  return (
    <div className="space-y-4">
      <h1>Bibliothèque de tabs</h1>

      <div className="flex flex-wrap gap-4 bg-panel border border-border rounded-lg p-3">
        <label className="flex items-center gap-2 text-sm">
          Sous-genre
          <select
            value={subgenre}
            onChange={(e) => setSubgenre(e.target.value)}
            className="bg-bg border border-border rounded px-2 py-1"
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
            className="bg-bg border border-border rounded px-2 py-1"
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
    </div>
  )
}
