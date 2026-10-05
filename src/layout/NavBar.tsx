import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { House, MapTrifold, Barbell, MusicNotes, Waveform, TrendUp, BookOpen, Guitar } from '@phosphor-icons/react'
import MetronomeWidget from '../components/audio/MetronomeWidget'
import SettingsWidget from '../components/SettingsWidget'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/parcours', label: 'Parcours', icon: MapTrifold },
  { to: '/exercises', label: 'Exercices', icon: Barbell },
  { to: '/tabs', label: 'Tabs', icon: MusicNotes },
  { to: '/tuner', label: 'Tuner', icon: Waveform },
  { to: '/progression', label: 'Progression', icon: TrendUp },
  { to: '/resources', label: 'Ressources', icon: BookOpen },
]

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-border-soft bg-panel/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-3 sm:px-6">
        <NavLink
          to="/"
          className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong transition-colors hover:bg-accent/20"
          aria-label="Accueil"
        >
          <Guitar size={20} weight="fill" />
        </NavLink>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="relative shrink-0 rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-medium transition-colors"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-[var(--radius-control)] bg-accent-soft"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-2 ${
                      isActive ? 'text-accent-strong' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    <link.icon size={17} weight={isActive ? 'fill' : 'regular'} />
                    <span className="hidden md:inline">{link.label}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <MetronomeWidget />
        <SettingsWidget />
      </div>
    </nav>
  )
}
