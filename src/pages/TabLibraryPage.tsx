import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { MusicNotes, ArrowRight, PenNib } from '@phosphor-icons/react'
import { loadAllTabs, filterTabs } from '../lib/content/loadTabs'
import { useProgression } from '../lib/progression/ProgressionContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Slider } from '../components/ui/Slider'
import { FilterChips } from '../components/ui/FilterChips'
import { DifficultyMeter } from '../components/ui/DifficultyMeter'
import { fadeInUpDelayed } from '../lib/motion/variants'

export default function TabLibraryPage() {
  const { state } = useProgression()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bibliothèque de tabs</h1>
          <p className="mt-1 text-text-muted">{allTabs.length} tablatures metal à jouer.</p>
        </div>
        <Link to="/tabs/new">
          <Button variant="secondary">
            <PenNib size={17} />
            Créer une tab
          </Button>
        </Link>
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Sous-genre</p>
            <FilterChips
              layoutId="tabs-subgenre-pill"
              value={subgenre}
              onChange={setSubgenre}
              options={[{ value: '', label: 'Tous' }, ...subgenres.map((s) => ({ value: s, label: s }))]}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Accordage</p>
            <FilterChips
              layoutId="tabs-tuning-pill"
              value={tuning}
              onChange={setTuning}
              options={[{ value: '', label: 'Tous' }, ...tunings.map((t) => ({ value: t, label: t }))]}
            />
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
        <div key={`${subgenre}-${tuning}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tabs.map((tab, index) => (
            <motion.div key={tab.id} {...fadeInUpDelayed(index)}>
              <Link to={`/tabs/${tab.id}`}>
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
