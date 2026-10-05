import { useProgression } from '../lib/progression/ProgressionContext'
import { aggregateXpByDay, skillBreakdown } from '../lib/progression/charts'
import { currentStreak, longestStreak } from '../lib/progression/streak'
import { BADGES } from '../lib/progression/badges'
import BarChart from '../components/charts/BarChart'
import { localDateString } from '../lib/date'

export default function ProgressionPage() {
  const { state } = useProgression()
  const today = localDateString()

  const xpByDay = aggregateXpByDay(state.xpLog)
  const skills = skillBreakdown(state.skillXp)

  const streak = currentStreak(state.streakHistory, today)
  const longest = longestStreak(state.streakHistory)

  const unlockedBadges = BADGES.filter((b) => state.badgesUnlocked.includes(b.id))

  return (
    <div className="space-y-6">
      <h1>Progression</h1>

      <section className="bg-panel border border-border rounded-lg p-4 space-y-3">
        <p className="text-text-muted text-sm">XP dans le temps</p>
        {xpByDay.length > 0 ? (
          <BarChart data={xpByDay.map((d) => ({ label: d.date.slice(5), value: d.total }))} />
        ) : (
          <p className="text-text-muted">Pas encore de données.</p>
        )}
      </section>

      <section className="bg-panel border border-border rounded-lg p-4 space-y-3">
        <p className="text-text-muted text-sm">Répartition par compétence (niveau)</p>
        <BarChart data={skills.map((s) => ({ label: s.category, value: s.level }))} />
      </section>

      <section className="bg-panel border border-border rounded-lg p-4 space-y-2">
        <p className="text-text-muted text-sm">Streak</p>
        <p>
          Actuel : <span className="text-accent font-semibold">{streak} jour(s)</span> · Record :{' '}
          <span className="text-accent font-semibold">{longest} jour(s)</span>
        </p>
      </section>

      <section className="bg-panel border border-border rounded-lg p-4 space-y-2">
        <p className="text-text-muted text-sm">
          Badges débloqués ({unlockedBadges.length}/{BADGES.length})
        </p>
        {unlockedBadges.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {unlockedBadges.map((b) => (
              <li key={b.id} className="bg-bg border border-border rounded px-3 py-1 text-sm">
                {b.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">Aucun badge débloqué pour l'instant.</p>
        )}
      </section>
    </div>
  )
}
