import {
  Flame,
  Medal,
  Trophy,
  MusicNotes,
  Guitar,
  TrendUp,
  Lightning,
  MedalMilitary,
  Lock,
  type Icon,
} from '@phosphor-icons/react'
import { useProgression } from '../lib/progression/ProgressionContext'
import { aggregateXpByDay, skillBreakdown } from '../lib/progression/charts'
import { currentStreak, longestStreak } from '../lib/progression/streak'
import { BADGES } from '../lib/progression/badges'
import BarChart from '../components/charts/BarChart'
import { Card } from '../components/ui/Card'
import { localDateString } from '../lib/date'

const BADGE_ICONS: Record<string, Icon> = {
  'premiere-semaine': Flame,
  'un-mois': Medal,
  centurion: Trophy,
  'premier-riff': MusicNotes,
  'dix-riffs': Guitar,
  'monte-en-gamme': TrendUp,
  'virtuose-en-herbe': Lightning,
  'shred-master': MedalMilitary,
}

export default function ProgressionPage() {
  const { state } = useProgression()
  const today = localDateString()

  const xpByDay = aggregateXpByDay(state.xpLog)
  const skills = skillBreakdown(state.skillXp)

  const streak = currentStreak(state.streakHistory, today)
  const longest = longestStreak(state.streakHistory)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Progression</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">XP dans le temps</p>
          {xpByDay.length > 0 ? (
            <BarChart data={xpByDay.map((d) => ({ label: d.date.slice(5), value: d.total }))} />
          ) : (
            <p className="text-text-muted">Pas encore de données.</p>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Répartition par compétence (niveau)
          </p>
          <BarChart data={skills.map((s) => ({ label: s.category, value: s.level }))} />
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Flame size={22} weight="fill" />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-text">{streak}</p>
            <p className="text-sm text-text-muted">Streak actuel</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <Trophy size={22} weight="fill" />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-text">{longest}</p>
            <p className="text-sm text-text-muted">Record de streak</p>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-5">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Badges ({state.badgesUnlocked.length}/{BADGES.length})
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((badge) => {
            const unlocked = state.badgesUnlocked.includes(badge.id)
            const BadgeIcon = BADGE_ICONS[badge.id] ?? Trophy
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-2 rounded-[var(--radius-card)] border p-4 text-center transition-colors ${
                  unlocked
                    ? 'border-accent-soft bg-accent-soft'
                    : 'border-border-soft bg-panel-raised opacity-50'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    unlocked ? 'bg-accent text-text' : 'bg-border text-text-muted'
                  }`}
                >
                  {unlocked ? <BadgeIcon size={19} weight="fill" /> : <Lock size={16} />}
                </span>
                <span
                  className={`text-xs font-medium ${unlocked ? 'text-accent-strong' : 'text-text-muted'}`}
                >
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
