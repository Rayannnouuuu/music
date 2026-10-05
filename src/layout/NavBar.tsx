import { NavLink } from 'react-router-dom'
import MetronomeWidget from '../components/audio/MetronomeWidget'

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/exercises', label: 'Exercices' },
  { to: '/tabs', label: 'Tabs' },
  { to: '/tuner', label: 'Tuner' },
  { to: '/progression', label: 'Progression' },
  { to: '/resources', label: 'Ressources' },
]

export default function NavBar() {
  return (
    <nav className="bg-panel border-b border-border px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex gap-4">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <MetronomeWidget />
    </nav>
  )
}
